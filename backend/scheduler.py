import threading
import time

from config import load_config
from state import load_state, save_state
from engine import next_group, ensure_order
from bot_manager import is_bot_running, start_bot

_running = True
_thread = None


def _loop():
    global _last_bot_status
    while _running:
        try:
            cfg = load_config()
            state = load_state()
            ensure_order()
            now = int(time.time())
            elapsed = now - state.get("last_switch", 0)
            current_group = state.get("current_group", 0)

            if state.get("paused") or state.get("mode") == "manual":
                if not is_bot_running():
                    try:
                        print(f"[SCHEDULER] Modo pausado/manual - Bot no está corriendo, reiniciando...")
                        start_bot()
                    except Exception as e:
                        print(f"[SCHEDULER] Error al iniciar bot: {e}")
                time.sleep(cfg["check_every"])
                continue

            # Verificar si debe rotar
            bot_is_running = is_bot_running()
            
            if elapsed >= cfg["interval"]:
                print(f"[SCHEDULER] ¡¡ROTACIÓN DISPARADA!! Intervalo alcanzado ({elapsed}s >= {cfg['interval']}s)")
                next_group(trigger="auto")
            elif not bot_is_running:
                # Bot está muerto, reabrirlo SIN rotar
                print(f"[SCHEDULER] ⚠ Bot NO está corriendo (elapsed={elapsed}s) - Reabriendo...")
                
                # Ver qué cuentas hay EN DISK antes de reiniciar
                import os
                active_path = cfg["active_path"]
                if os.path.exists(active_path):
                    current_accounts = [f for f in os.listdir(active_path) if f.lower() != "global" and os.path.isdir(os.path.join(active_path, f))]
                    print(f"[SCHEDULER] Cuentas en config/ ANTES de reiniciar: {current_accounts}")
                
                # Resetear last_switch para evitar rotación accidental
                state["last_switch"] = now
                save_state(state)
                print(f"[SCHEDULER] last_switch reseteado")
                
                try:
                    print(f"[SCHEDULER] Llamando start_bot()...")
                    start_bot()
                    print(f"[SCHEDULER] ✓ start_bot() completado")
                except Exception as e:
                    print(f"[SCHEDULER] ✗ Error en start_bot(): {type(e).__name__}: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                # Bot está corriendo - silencioso
                pass

            time.sleep(cfg["check_every"])
        except Exception as e:
            print(f"[SCHEDULER] Error en loop: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(10)


def start_scheduler():
    global _thread
    _thread = threading.Thread(target=_loop, daemon=True)
    _thread.start()


def stop_scheduler():
    global _running
    _running = False
