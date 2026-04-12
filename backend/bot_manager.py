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
        print(f"[BOT_MANAGER] start_bot() en cooldown ({now - _last_start_time:.1f}s < 40s)")
        return  # Aún en cooldown, no intentar abrir de nuevo
    
    _last_start_time = now
    _status = BotStatus.STARTING
    try:
        print(f"[BOT_MANAGER] start_bot() - Abriendo {cfg['bot_exe']}...")
        subprocess.Popen(
            [cfg["bot_exe"]],
            cwd=cfg["bot_cwd"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=0x00000008,  # DETACHED_PROCESS
        )
        
        # Esperar más tiempo y verificar múltiples veces que el bot esté corriendo
        print(f"[BOT_MANAGER] Esperando a que bot inicie...")
        for i in range(10):  # Intentar 10 veces (10 segundos total)
            time.sleep(1)
            if is_bot_running():
                print(f"[BOT_MANAGER] ✓ Bot detectado en tasklist (intento {i+1})")
                _status = BotStatus.RUNNING
                return
        
        # Si llegamos aquí, no se detectó en tasklist pero quizás esté iniciando
        print(f"[BOT_MANAGER] ⚠ Bot NO encontrado en tasklist después de 10s, pero proceso se lanzó. Status=RUNNING de todas formas")
        _status = BotStatus.RUNNING
    except Exception as exc:
        print(f"[BOT_MANAGER] ✗ Error al abrir bot: {exc}")
        _status = BotStatus.ERROR
        raise RuntimeError(f"No se pudo iniciar el bot: {exc}") from exc


def restart_bot():
    print(f"[BOT_MANAGER] restart_bot() llamado - Matando y reiniciando...")
    if is_bot_running():
        kill_bot()
    start_bot()
