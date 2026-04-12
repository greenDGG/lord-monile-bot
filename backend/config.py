import json
import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

DEFAULTS = {
    "acc_path": r"C:\Users\admin\Desktop\acc",
    "active_path": r"C:\Users\admin\Desktop\bot\config",
    "bot_exe": r"C:\Users\admin\Desktop\bot\LordsMobileBot.exe",
    "bot_cwd": r"C:\Users\admin\Desktop\bot",
    "bot_process_name": "LordsMobileBot.exe",
    "group_size": 5,
    "interval": 600,
    "check_every": 10,
    "api_port": 8080,
    "api_token": "",
    "disabled_accounts": [],
    "aliases": {},
}


def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, encoding="utf-8") as f:
                content = f.read().strip()
                if not content:  # Archivo vacío
                    raise ValueError("Config file is empty")
                cfg = json.loads(content)
        except (json.JSONDecodeError, ValueError):
            # Config corrupto, recrear con defaults
            cfg = dict(DEFAULTS)
            cfg["api_token"] = secrets.token_hex(16)
            save_config(cfg)
            return cfg
        for k, v in DEFAULTS.items():
            if k not in cfg:
                cfg[k] = v
        return cfg
    cfg = dict(DEFAULTS)
    cfg["api_token"] = secrets.token_hex(16)
    save_config(cfg)
    return cfg


def save_config(cfg):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


def update_config(updates: dict):
    cfg = load_config()
    allowed = {
        "group_size", "interval", "check_every", "acc_path",
        "active_path", "bot_exe", "bot_cwd", "bot_process_name",
        "api_port",
    }
    for k, v in updates.items():
        if k in allowed:
            cfg[k] = v
    save_config(cfg)
    return cfg
