import subprocess
import time

from config import load_config


class BotStatus:
    RUNNING = "running"
    STOPPED = "stopped"
    STARTING = "starting"
    STOPPING = "stopping"
    ERROR = "error"
    UNKNOWN = "unknown"


_status = BotStatus.UNKNOWN
_last_start_time = 0  # Cooldown para evitar doble apertura


def is_bot_running():
    cfg = load_config()
    name = cfg["bot_process_name"]
    try:
        result = subprocess.run(
            ["tasklist", "/FI", f"IMAGENAME eq {name}", "/NH"],
            capture_output=True, text=True, timeout=10,
        )
        found = name.lower() in result.stdout.lower()
        if not found:
            print(f"[BOT_MANAGER] is_bot_running() = False (proceso {name} no encontrado en tasklist)")
        return found
    except Exception as e:
        print(f"[BOT_MANAGER] is_bot_running() excepción: {e}")
        return False


def get_status():
    global _status
    if is_bot_running():
        _status = BotStatus.RUNNING
    elif _status not in (BotStatus.STARTING, BotStatus.STOPPING):
        _status = BotStatus.STOPPED
    return _status


def kill_bot():
    global _status, _last_start_time
    cfg = load_config()
    _status = BotStatus.STOPPING
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
    global _status, _last_start_time
    cfg = load_config()
    
    # Cooldown de 40 segundos para evitar apertura doble durante rotación
    # PERO: si el bot no está corriendo, forzar reinicio sin esperar
    now = time.time()
    time_since_last_start = now - _last_start_time
    
    # Si el bot está corriendo, respetar el cooldown
    if is_bot_running():
        if time_since_last_start < 40:
            print(f"[BOT_MANAGER] start_bot() rechazado: bot YA está corriendo y en cooldown ({time_since_last_start:.1f}s < 40s)")
            return
    else:
        # Si bot NO está corriendo después de 40s, permitir reintento sin esperar
        if time_since_last_start >= 40:
            print(f"[BOT_MANAGER] start_bot() permitido: bot no está corriendo y cooldown expiró ({time_since_last_start:.1f}s >= 40s)")
        else:
            print(f"[BOT_MANAGER] start_bot() permitido: bot no está corriendo, ignorando cooldown ({time_since_last_start:.1f}s < 40s)")
    
    _last_start_time = now
    _status = BotStatus.STARTING
    try:
        print(f"[BOT_MANAGER] ✓ Abriendo bot: {cfg['bot_exe']}")
        subprocess.Popen(
            [cfg["bot_exe"]],
            cwd=cfg["bot_cwd"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=0x00000008,  # DETACHED_PROCESS
        )
        print(f"[BOT_MANAGER] Proceso lanzado. Status=STARTING (verificación asincrónica)")
        _status = BotStatus.STARTING
        # NO esperar aquí, dejar que el scheduler lo verifique en la siguiente iteración
    except Exception as exc:
        print(f"[BOT_MANAGER] ✗ Error al abrir bot: {exc}")
        _status = BotStatus.ERROR
        raise RuntimeError(f"No se pudo iniciar el bot: {exc}") from exc


def restart_bot():
    print(f"[BOT_MANAGER] restart_bot() llamado - Matando y reiniciando...")
    if is_bot_running():
        kill_bot()
    start_bot()
