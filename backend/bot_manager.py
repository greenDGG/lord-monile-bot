import subprocess
import time
import threading

from config import load_config
from account_manager import ensure_accounts_deployed


class BotStatus:
    RUNNING = "running"
    STOPPED = "stopped"
    STARTING = "starting"
    STOPPING = "stopping"
    ERROR = "error"
    UNKNOWN = "unknown"


_status = BotStatus.UNKNOWN
_last_start_time = 0  # Cooldown para evitar doble apertura

# === CACHE Y MONITOREO EN TIEMPO REAL ===
_bot_running_cached = False  # Cache del estado actual
_monitor_thread = None  # Hilo que monitorea constantemente
_monitor_running = False  # Flag para controlar el hilo


def _monitor_bot_status():
    """Hilo dedicado que monitorea el bot cada 1 segundo"""
    global _bot_running_cached, _last_start_time
    
    print("[BOT_MONITOR] ✓ Hilo de monitoreo iniciado - Verificando cada 1 segundo")
    last_status = None
    check_count = 0
    
    while _monitor_running:
        try:
            check_count += 1
            cfg = load_config()
            name = cfg["bot_process_name"]
            result = subprocess.run(
                ["tasklist", "/FI", f"IMAGENAME eq {name}", "/NH"],
                capture_output=True, text=True, timeout=5,
            )
            found = name.lower() in result.stdout.lower()
            
            # Si cambió el estado, registrar
            if found != _bot_running_cached:
                if found:
                    elapsed_since_last = time.time() - _last_start_time
                    print(f"[BOT_MONITOR] (check #{check_count}) ✓ ESTADO CAMBIÓ: Bot INICIÓ (after {elapsed_since_last:.1f}s)")
                else:
                    print(f"[BOT_MONITOR] (check #{check_count}) ✗ ESTADO CAMBIÓ: Bot CERRÓ")
                _bot_running_cached = found
                last_status = found
            
            time.sleep(1)  # Verificar cada 1 segundo
        except Exception as e:
            print(f"[BOT_MONITOR] (check #{check_count}) Error: {type(e).__name__}: {e}")
            time.sleep(1)


def start_bot_monitor():
    """Inicia el hilo de monitoreo"""
    global _monitor_thread, _monitor_running
    if _monitor_thread is None:
        _monitor_running = True
        _monitor_thread = threading.Thread(target=_monitor_bot_status, daemon=True)
        _monitor_thread.start()


def stop_bot_monitor():
    """Detiene el hilo de monitoreo"""
    global _monitor_running
    _monitor_running = False


def is_bot_running():
    """Retorna el estado cacheado del bot (actualizado por el hilo monitor en tiempo real)"""
    return _bot_running_cached


def get_status():
    global _status
    if is_bot_running():
        _status = BotStatus.RUNNING
    elif _status not in (BotStatus.STARTING, BotStatus.STOPPING):
        _status = BotStatus.STOPPED
    return _status


def kill_bot():
    global _status, _last_start_time, _bot_running_cached
    cfg = load_config()
    _status = BotStatus.STOPPING
    _bot_running_cached = False  # Actualizar cache
    print(f"[BOT_MANAGER] kill_bot() llamado - matando {cfg['bot_process_name']}")
    import traceback
    traceback.print_stack(limit=5)  # Ver de dónde se llamó
    try:
        subprocess.run(
            ["taskkill", "/F", "/IM", cfg["bot_process_name"]],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15,
        )
        print(f"[BOT_MANAGER] ✓ Bot terminado")
    except Exception:
        pass
    time.sleep(5)
    _status = BotStatus.STOPPED
    _last_start_time = 0  # Reset cooldown para poder iniciar inmediatamente después


def start_bot():
    global _status, _last_start_time, _bot_running_cached
    cfg = load_config()
    
    print(f"[BOT_MANAGER] start_bot() INICIO")
    
    # Obtener las cuentas que deberían estar activas
    try:
        from engine import get_groups, get_current_group_index
        groups = get_groups()
        current_idx = get_current_group_index()
        expected_accounts = groups[current_idx] if current_idx < len(groups) else []
        print(f"[BOT_MANAGER] Grupo actual: {current_idx + 1}, Grupo={current_idx}, Cuentas esperadas: {expected_accounts}")
    except Exception as e:
        print(f"[BOT_MANAGER] ✗ Error obteniendo cuentas esperadas: {e}")
        expected_accounts = []
    
    # Verificar que las cuentas esperadas estén en config/
    if expected_accounts:
        ok, msg = ensure_accounts_deployed(expected_accounts)
        if not ok:
            print(f"[BOT_MANAGER] ✗ No se pudieron completar las carpetas: {msg}")
            # Continuar de todas formas
        else:
            print(f"[BOT_MANAGER] ✓ Carpetas verificadas OK")
    else:
        print(f"[BOT_MANAGER] ⚠ No hay cuentas esperadas, lanzo sin verificar")
    
    # Cooldown de 40 segundos para evitar apertura doble durante rotación
    # PERO: si el bot no está corriendo, forzar reinicio sin esperar
    now = time.time()
    time_since_last_start = now - _last_start_time
    
    # Si el bot está corriendo, respetar el cooldown
    if _bot_running_cached:  # Usar cache
        if time_since_last_start < 40:
            print(f"[BOT_MANAGER] RC: bot YA está corriendo y en cooldown ({time_since_last_start:.1f}s < 40s) - RECHAZADO")
            return
    else:
        # Si bot NO está corriendo después de 40s, permitir reintento sin esperar
        if time_since_last_start >= 40:
            print(f"[BOT_MANAGER] OK: bot no está corriendo y cooldown expiró ({time_since_last_start:.1f}s >= 40s)")
        else:
            print(f"[BOT_MANAGER] OK: bot no está corriendo, ignorando cooldown ({time_since_last_start:.1f}s < 40s)")
    
    _last_start_time = now
    _status = BotStatus.STARTING
    try:
        exe_path = cfg['bot_exe']
        cwd = cfg['bot_cwd']
        print(f"[BOT_MANAGER] Lanzando: {exe_path}")
        print(f"[BOT_MANAGER] CWD: {cwd}")
        
        process = subprocess.Popen(
            [exe_path],
            cwd=cwd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=0x00000008,  # DETACHED_PROCESS
        )
        print(f"[BOT_MANAGER] ✓ Proceso lanzado (PID: {process.pid}) - Status=STARTING")
        _status = BotStatus.STARTING
    except Exception as exc:
        print(f"[BOT_MANAGER] ✗ EXCEPCIÓN al abrir bot: {type(exc).__name__}: {exc}")
        _status = BotStatus.ERROR
        import traceback
        traceback.print_exc()
        raise RuntimeError(f"No se pudo iniciar el bot: {exc}") from exc


def restart_bot():
    print(f"[BOT_MANAGER] restart_bot() llamado - Matando y reiniciando...")
    if is_bot_running():
        kill_bot()
    start_bot()
