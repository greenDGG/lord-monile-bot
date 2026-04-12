import threading
import time

from config import load_config
from state import load_state, save_state, add_history
from bot_manager import kill_bot, start_bot, is_bot_running
from account_manager import get_available_accounts, swap_accounts

_lock = threading.Lock()


def _enabled_accounts(state, cfg):
    disabled = set(cfg.get("disabled_accounts", []))
    return [a for a in state["order"] if a not in disabled]


def get_groups():
    state = load_state()
    cfg = load_config()
    accounts = _enabled_accounts(state, cfg)
    size = cfg["group_size"]
    if not accounts or size <= 0:
        return []
    groups = []
    for i in range(0, len(accounts), size):
        groups.append(accounts[i : i + size])
    return groups


def get_current_group_index():
    state = load_state()
    return state.get("current_group", 0)


def ensure_order():
    state = load_state()
    if not state["order"]:
        state["order"] = get_available_accounts()
        save_state(state)
    return state


def rotate_to(group_index: int, trigger: str = "manual"):
    with _lock:
        return _rotate_impl(group_index, trigger)


def _rotate_impl(group_index: int, trigger: str):
    ensure_order()
    groups = get_groups()
    if not groups:
        return False, "No hay cuentas disponibles"

    group_index = group_index % len(groups)
    target = groups[group_index]
    prev_idx = get_current_group_index()

    print(f"[ENGINE] Rotación iniciada: Grupo {prev_idx + 1} → Grupo {group_index + 1} (trigger={trigger})")
    print(f"[ENGINE] Cuentas objetivo: {target}")

    # kill bot
    if is_bot_running():
        print(f"[ENGINE] Matando bot...")
        kill_bot()

    # swap configs
    print(f"[ENGINE] Swapeando cuentas...")
    ok, err = swap_accounts(target)
    if not ok:
        print(f"[ENGINE] Error en swap: {err}")
        add_history("rotation_failed", {
            "from_group": prev_idx + 1,
            "to_group": group_index + 1,
            "trigger": trigger,
            "error": err,
        })
        try:
            start_bot()
        except Exception:
            pass
        return False, f"Error al cambiar cuentas: {err}"

    # start bot
    print(f"[ENGINE] Iniciando bot...")
    try:
        start_bot()
        print(f"[ENGINE] Bot iniciado exitosamente")
    except Exception as exc:
        print(f"[ENGINE] Error al iniciar bot: {exc}")
        add_history("bot_start_failed", {
            "group": group_index + 1,
            "accounts": target,
            "error": str(exc),
        })
        return False, f"Cuentas copiadas pero el bot no arrancó: {exc}"

    # update state
    state = load_state()
    state["current_group"] = group_index
    state["last_switch"] = int(time.time())
    save_state(state)
    print(f"[ENGINE] Estado actualizado: Grupo {group_index + 1}, last_switch={state['last_switch']}")

    add_history("rotation", {
        "from_group": prev_idx + 1,
        "to_group": group_index + 1,
        "accounts": target,
        "trigger": trigger,
    })

    # trigger alias scan for newly active accounts
    try:
        from api import _check_live_aliases
        _check_live_aliases()
    except Exception:
        pass

    return True, f"Rotado al grupo {group_index + 1}"


def next_group(trigger="manual"):
    groups = get_groups()
    if not groups:
        return False, "No hay grupos"
    current = get_current_group_index()
    print(f"[ENGINE] next_group() llamado con trigger='{trigger}' desde grupo {current + 1}")
    return rotate_to((current + 1) % len(groups), trigger)


def prev_group(trigger="manual"):
    groups = get_groups()
    if not groups:
        return False, "No hay grupos"
    current = get_current_group_index()
    return rotate_to((current - 1) % len(groups), trigger)


def reload_group():
    return rotate_to(get_current_group_index(), "reload")
