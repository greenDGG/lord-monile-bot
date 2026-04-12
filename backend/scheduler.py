import threading
import time

from config import load_config
from state import load_state
from engine import next_group, ensure_order
from bot_manager import is_bot_running, start_bot

_running = True
_thread = None


def _loop():
    while _running:
        try:
            cfg = load_config()
            state = load_state()
            ensure_order()
            now = int(time.time())

            if state.get("paused") or state.get("mode") == "manual":
                if not is_bot_running():
                    try:
                        start_bot()
                    except Exception as e:
                        print(f"[SCHEDULER] Error al iniciar bot: {e}")
                time.sleep(cfg["check_every"])
                continue

            elapsed = now - state.get("last_switch", 0)
            if elapsed >= cfg["interval"]:
                next_group(trigger="auto")
            else:
                # No intentar iniciar el bot en los primeros 40 segundos después de una rotación
                # (cubre 10 seg login + buffer para que se estabilice)
                if elapsed > 40 and not is_bot_running():
                    try:
                        start_bot()
                    except Exception as e:
                        print(f"[SCHEDULER] Error al iniciar bot: {e}")

            time.sleep(cfg["check_every"])
        except Exception as e:
            print(f"[SCHEDULER] Error en loop: {type(e).__name__}: {e}")
            time.sleep(10)


def start_scheduler():
    global _thread
    _thread = threading.Thread(target=_loop, daemon=True)
    _thread.start()


def stop_scheduler():
    global _running
    _running = False
