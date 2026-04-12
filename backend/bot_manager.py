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
        return name.lower() in result.stdout.lower()
    except Exception:
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
    try:
        subprocess.run(
            ["taskkill", "/F", "/IM", cfg["bot_process_name"]],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15,
        )
    except Exception:
        pass
    time.sleep(5)
    _status = BotStatus.STOPPED
    _last_start_time = 0  # Reset cooldown para poder iniciar inmediatamente después


def start_bot():
    global _status, _last_start_time
    cfg = load_config()
    
    # Cooldown de 40 segundos para evitar apertura doble durante rotación
    # (cubre 10 seg login + buffer de estabilización)
    now = time.time()
    if now - _last_start_time < 40:
        return  # Aún en cooldown, no intentar abrir de nuevo
    
    _last_start_time = now
    _status = BotStatus.STARTING
    try:
        subprocess.Popen(
            [cfg["bot_exe"]],
            cwd=cfg["bot_cwd"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=0x00000008,  # DETACHED_PROCESS
        )
        time.sleep(3)
        _status = BotStatus.RUNNING
    except Exception as exc:
        _status = BotStatus.ERROR
        raise RuntimeError(f"No se pudo iniciar el bot: {exc}") from exc


def restart_bot():
    print(f\"[BOT_MANAGER] restart_bot() llamado - Matando y reiniciando...\")
    if is_bot_running():
        kill_bot()
    start_bot()
