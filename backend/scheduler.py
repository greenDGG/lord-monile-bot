import threading
import time

from config import load_config
from state import load_state, save_state
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
            print(f"[SCHEDULER] Verificando: elapsed={elapsed}s, interval={cfg['interval']}s, paused={state.get('paused')}, mode={state.get('mode')}, bot_status={bot_is_running}")
            
            if elapsed >= cfg["interval"]:
                print(f"[SCHEDULER] ¡¡ROTACIÓN DISPARADA!! Intervalo alcanzado ({elapsed}s >= {cfg['interval']}s)")
                next_group(trigger="auto")
            else:
                # Reaabrir bot si está muerto (siempre, no solo después de 40s)
                if not bot_is_running:
                    # No reintentar en los primeros 40s de estabilización (solo INFO)
                    if elapsed <= 40:
                        print(f"[SCHEDULER] Bot NO está corriendo pero aún en estabilización ({elapsed}s <= 40s) - Reabriendo...")
                    else:
                        print(f"[SCHEDULER] Bot NO está corriendo (elapsed={elapsed}s > 40s) - Reabriendo...")
                    
                    # Ver qué cuentas hay ANTES de reiniciar
                    import os
                    active_path = cfg["active_path"]
                    if os.path.exists(active_path):
                        current_accounts = [f for f in os.listdir(active_path) if f.lower() != "global" and os.path.isdir(os.path.join(active_path, f))]
                        print(f"[SCHEDULER] Cuentas en config/ ANTES de reiniciar: {current_accounts}")
                    
                    # IMPORTANTE: Al reaabrir el bot, resetear last_switch para evitar rotación accidental
                    # en la próxima iteración del scheduler
                    state["last_switch"] = now
                    save_state(state)
                    print(f"[SCHEDULER] ✓ last_switch reseteado a {now} para evitar rotación accidental")
                    
                    try:
                        start_bot()  # Solo abre el .exe, nada más
                    except Exception as e:
                        print(f"[SCHEDULER] ✗ Error al iniciar bot: {type(e).__name__}: {e}")
                else:
                    print(f"[SCHEDULER] Bot está corriendo correctamente")

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
