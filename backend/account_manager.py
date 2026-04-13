import os
import shutil
import threading

from config import load_config

# Lock global para evitar race conditions entre swap_accounts y ensure_accounts_deployed
_account_lock = threading.Lock()


def get_available_accounts():
    cfg = load_config()
    path = cfg["acc_path"]
    if not os.path.exists(path):
        return []
    return sorted(
        e for e in os.listdir(path)
        if os.path.isdir(os.path.join(path, e))
    )


def get_active_accounts():
    cfg = load_config()
    path = cfg["active_path"]
    if not os.path.exists(path):
        return []
    return [
        f for f in os.listdir(path)
        if f.lower() != "global" and os.path.isdir(os.path.join(path, f))
    ]


def _clean_active(active_path: str):
    print(f"[ACCOUNT_MANAGER] _clean_active() - Limpiando {active_path}")
    before = [f for f in os.listdir(active_path) if f.lower() != "global" and os.path.isdir(os.path.join(active_path, f))]
    print(f"[ACCOUNT_MANAGER] Carpetas ANTES de limpiar: {before}")
    removed = []
    for f in os.listdir(active_path):
        if f.lower() == "global":
            continue
        p = os.path.join(active_path, f)
        if os.path.isdir(p):
            shutil.rmtree(p)
        else:
            os.remove(p)
        removed.append(f)
    after = [f for f in os.listdir(active_path) if f.lower() != "global" and os.path.isdir(os.path.join(active_path, f))]
    print(f"[ACCOUNT_MANAGER] Removidas: {removed}")
    print(f"[ACCOUNT_MANAGER] Carpetas DESPUÉS de limpiar: {after}")
    return removed


def _deploy_accounts(acc_path: str, active_path: str, accounts: list):
    print(f"[ACCOUNT_MANAGER] _deploy_accounts() - Desplegando: {accounts}")
    import time
    for acc in accounts:
        src = os.path.join(acc_path, acc)
        dst = os.path.join(active_path, acc)
        if not os.path.exists(src):
            raise FileNotFoundError(f"Carpeta de cuenta no encontrada: {src}")
        print(f"[ACCOUNT_MANAGER] Copiando {acc}: {src} → {dst}")
        shutil.copytree(src, dst)
        print(f"[ACCOUNT_MANAGER] ✓ {acc} copiada exitosamente")
        time.sleep(1)  # Espera ACTIVA para asegurar que se escribió completamente en disco
    
    # Verificar que TODAS las carpetas existan en disco ANTES de continuar
    time.sleep(2)  # Espera extra para sincronización del FS
    deployed_check = [f for f in os.listdir(active_path) if f.lower() != "global" and os.path.isdir(os.path.join(active_path, f))]
    print(f"[ACCOUNT_MANAGER] ✓ Todas desplegadas. VERIFICACIÓN EN DISK: {sorted(deployed_check)}")
    print(f"[ACCOUNT_MANAGER] Esperadas: {sorted(accounts)}")
    if set(deployed_check) != set(accounts):
        raise RuntimeError(f"Mismatch de carpetas! Esperadas: {sorted(accounts)}, Encontradas: {sorted(deployed_check)}")


def _sync_back(active_path: str, acc_path: str):
    """
    Copy active account folders back to acc_path, overwriting originals.
    This preserves logs, configs and any changes the bot made while running.
    """
    print(f"[ACCOUNT_MANAGER] _sync_back() - Sincronizando cambios de cuenta activa")
    synced = []
    for f in os.listdir(active_path):
        if f.lower() == "global":
            continue
        src = os.path.join(active_path, f)
        dst = os.path.join(acc_path, f)
        if not os.path.isdir(src):
            continue
        if not os.path.exists(os.path.join(acc_path, f)):
            continue
        print(f"[ACCOUNT_MANAGER] Sincronizando {f}: active → acc")
        shutil.rmtree(dst)
        shutil.copytree(src, dst)
        synced.append(f)
    print(f"[ACCOUNT_MANAGER] Sincronizadas: {synced}")
    return synced


def ensure_accounts_deployed(expected_accounts: list):
    """
    Verifica que las cuentas esperadas estén en config/.
    Si faltan, las recopia desde acc/ automáticamente.
    Si hay extra, las elimina.
    
    THREAD-SAFE: Usa lock global para evitar race conditions con swap_accounts().
    Retorna (True, "OK") si todo está bien, (False, error) si hay problema.
    """
    with _account_lock:  # Lock CRÍTICO
        cfg = load_config()
        active_path = cfg["active_path"]
        acc_path = cfg["acc_path"]
        
        # Obtener cuentas actualmente en config/
        current_accounts = get_active_accounts()
        current_set = set(current_accounts)
        expected_set = set(expected_accounts)
        
        print(f"[ACCOUNT_MANAGER] ensure_accounts_deployed() [LOCK ADQUIRIDO]")
        print(f"[ACCOUNT_MANAGER]  - Esperadas: {sorted(expected_set)}")
        print(f"[ACCOUNT_MANAGER]  - Actuales:  {sorted(current_set)}")
        
        # Si todas están, OK
        if current_set == expected_set:
            print(f"[ACCOUNT_MANAGER] ✓ Todas las cuentas están presentes en config/")
            return True, "OK"
        
        # Detectar cuáles faltan y cuáles sobran
        missing = expected_set - current_set
        extra = current_set - expected_set
        
        if missing:
            print(f"[ACCOUNT_MANAGER] ⚠ FALTAN cuentas: {sorted(missing)}")
        if extra:
            print(f"[ACCOUNT_MANAGER] ⚠ CUENTAS EXTRA: {sorted(extra)}")
        
        # PASO 1: Limpiar cuentas extra PRIMERO
        if extra:
            try:
                print(f"[ACCOUNT_MANAGER] PASO 1: Removiendo cuentas extra...")
                for extra_acc in sorted(extra):
                    path = os.path.join(active_path, extra_acc)
                    if os.path.exists(path):
                        shutil.rmtree(path)
                        print(f"[ACCOUNT_MANAGER]  ✓ Removida: {extra_acc}")
                print(f"[ACCOUNT_MANAGER] ✓ Cuentas extra removidas")
            except Exception as e:
                error_msg = f"Error removiendo cuentas extra: {e}"
                print(f"[ACCOUNT_MANAGER] ✗ {error_msg}")
                return False, error_msg
        
        # PASO 2: Copiar cuentas faltantes
        if missing:
            try:
                print(f"[ACCOUNT_MANAGER] PASO 2: Copiando cuentas faltantes desde acc/...")
                missing_list = sorted(list(missing))
                _deploy_accounts(acc_path, active_path, missing_list)
                print(f"[ACCOUNT_MANAGER] ✓ Cuentas faltantes recopiladas exitosamente")
            except Exception as e:
                error_msg = f"No se pudieron copiar cuentas faltantes: {e}"
                print(f"[ACCOUNT_MANAGER] ✗ {error_msg}")
                return False, error_msg
        
        # Verificación final
        final_accounts = get_active_accounts()
        final_set = set(final_accounts)
        
        if final_set == expected_set:
            print(f"[ACCOUNT_MANAGER] ✓ Verificación final OK - Estado completo [LOCK LIBERADO]")
            return True, "OK"
        else:
            error_msg = f"Mismatch final: esperadas {sorted(expected_set)}, encontradas {sorted(final_set)}"
            print(f"[ACCOUNT_MANAGER] ✗ {error_msg}")
            return False, error_msg


def swap_accounts(new_accounts: list):
    """
    Swap active accounts atomically with rollback on failure.
    1. Sync current active back to acc (preserve logs/configs)
    2. Backup current active (for rollback)
    3. Clean active + deploy new group
    
    THREAD-SAFE: Usa lock global para evitar race conditions con ensure_accounts_deployed().
    Returns (success, error_message | None).
    """
    with _account_lock:  # Lock CRÍTICO
        print(f"[ACCOUNT_MANAGER] swap_accounts() - Cambiando a: {new_accounts} [LOCK ADQUIRIDO]")
        cfg = load_config()
        active_path = cfg["active_path"]
        acc_path = cfg["acc_path"]
        backup_dir = os.path.join(os.path.dirname(active_path), "_config_backup")

        try:
            # 1. sync active accounts back to acc_path (preserve logs/configs)
            print(f"[ACCOUNT_MANAGER] 1. Sincronizando active → acc")
            _sync_back(active_path, acc_path)

            # 2. backup current (non-global) for rollback
            if os.path.exists(backup_dir):
                shutil.rmtree(backup_dir)
            os.makedirs(backup_dir, exist_ok=True)

            for f in os.listdir(active_path):
                if f.lower() == "global":
                    continue
                src = os.path.join(active_path, f)
                dst = os.path.join(backup_dir, f)
                if os.path.isdir(src):
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)

            # 3. clean + deploy new group
            _clean_active(active_path)
            _deploy_accounts(acc_path, active_path, new_accounts)

            # 4. success → remove backup
            shutil.rmtree(backup_dir, ignore_errors=True)
            final_accounts = [f for f in os.listdir(active_path) if f.lower() != "global" and os.path.isdir(os.path.join(active_path, f))]
            print(f"[ACCOUNT_MANAGER] swap_accounts() COMPLETADO. Carpetas finales en config: {final_accounts} [LOCK LIBERADO]")
            return True, None

        except Exception as exc:
            # rollback
            print(f"[ACCOUNT_MANAGER] ✗ ERROR EN SWAP: {exc}. EJECUTANDO ROLLBACK...")
            try:
                _clean_active(active_path)
                if os.path.exists(backup_dir):
                    for f in os.listdir(backup_dir):
                        src = os.path.join(backup_dir, f)
                        dst = os.path.join(active_path, f)
                        if os.path.isdir(src):
                            shutil.copytree(src, dst)
                        else:
                            shutil.copy2(src, dst)
                    shutil.rmtree(backup_dir, ignore_errors=True)
                print(f"[ACCOUNT_MANAGER] ✓ Rollback completado. Restore a carpetas anteriores")
            except Exception as rollback_exc:
                print(f"[ACCOUNT_MANAGER] ✗✗ ERROR DURANTE ROLLBACK: {rollback_exc}")
            return False, str(exc)
