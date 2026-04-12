import json
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, "state.json")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")

DEFAULT_STATE = {
    "order": [],
    "current_group": 0,
    "last_switch": 0,
    "mode": "auto",
    "paused": False,
}


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, encoding="utf-8") as f:
                content = f.read().strip()
                if not content:  # Archivo vacío
                    raise ValueError("State file is empty")
                state = json.loads(content)
        except (json.JSONDecodeError, ValueError):
            # State corrupto, recrear con defaults
            state = dict(DEFAULT_STATE)
            save_state(state)
            return state
        for k, v in DEFAULT_STATE.items():
            if k not in state:
                state[k] = v
        return state
    return dict(DEFAULT_STATE)


def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


# ---- history ----

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, encoding="utf-8") as f:
                content = f.read().strip()
                if not content:  # Archivo vacío
                    return []
                return json.loads(content)
        except (json.JSONDecodeError, ValueError):
            # History corrupto, resetear
            return []
    return []


def add_history(event: str, details: dict):
    history = load_history()
    history.append({
        "timestamp": int(time.time()),
        "event": event,
        "details": details,
    })
    if len(history) > 500:
        history = history[-500:]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
