import os
import re
import time
import json

from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from config import load_config, save_config, update_config
from state import load_state, save_state, load_history
from engine import (
    get_groups, get_current_group_index, rotate_to,
    next_group, prev_group, reload_group, ensure_order,
)
from bot_manager import get_status, restart_bot, kill_bot, start_bot
from account_manager import get_available_accounts, get_active_accounts

app = FastAPI(title="RotateLM Controller")

# ---- CORS Configuration ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (development). Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "public")


# ---- auth ----

def verify_token(request: Request):
    cfg = load_config()
    header = request.headers.get("Authorization", "")
    token = header.removeprefix("Bearer ").strip()
    if not token or token != cfg["api_token"]:
        raise HTTPException(status_code=401, detail="Token inválido")


# ---- status ----

@app.get("/api/status")
def api_status(_=Depends(verify_token)):
    state = load_state()
    cfg = load_config()
    groups = get_groups()
    current = get_current_group_index()
    aliases = _get_aliases()
    now = int(time.time())
    remaining = max(0, cfg["interval"] - (now - state.get("last_switch", 0)))
    accs = groups[current] if current < len(groups) else []
    return {
        "mode": state.get("mode", "auto"),
        "paused": state.get("paused", False),
        "current_group": current + 1,
        "total_groups": len(groups),
        "current_accounts": accs,
        "current_accounts_display": [aliases.get(a, a) for a in accs],
        "bot_status": get_status(),
        "time_remaining": remaining,
        "interval": cfg["interval"],
        "last_switch": state.get("last_switch", 0),
        "group_size": cfg["group_size"],
        "total_accounts": len(state.get("order", [])),
        "aliases": aliases,
    }


# ---- control ----

@app.post("/api/next")
def api_next(_=Depends(verify_token)):
    ok, msg = next_group()
    return {"success": ok, "message": msg}


@app.post("/api/prev")
def api_prev(_=Depends(verify_token)):
    ok, msg = prev_group()
    return {"success": ok, "message": msg}


@app.post("/api/goto/{group_index}")
def api_goto(group_index: int, _=Depends(verify_token)):
    groups = get_groups()
    if groups and (group_index < 1 or group_index > len(groups)):
        raise HTTPException(400, f"El grupo debe estar entre 1 y {len(groups)}")
    ok, msg = rotate_to(group_index - 1)
    return {"success": ok, "message": msg}


@app.post("/api/reload")
def api_reload(_=Depends(verify_token)):
    ok, msg = reload_group()
    return {"success": ok, "message": msg}


@app.post("/api/pause")
def api_pause(_=Depends(verify_token)):
    state = load_state()
    state["paused"] = True
    save_state(state)
    return {"success": True, "message": "Rotación pausada"}


@app.post("/api/resume")
def api_resume(_=Depends(verify_token)):
    state = load_state()
    state["paused"] = False
    save_state(state)
    return {"success": True, "message": "Rotación reanudada"}


@app.post("/api/mode/{mode}")
def api_mode(mode: str, _=Depends(verify_token)):
    if mode not in ("auto", "manual"):
        raise HTTPException(400, "El modo debe ser 'auto' o 'manual'")
    state = load_state()
    state["mode"] = mode
    save_state(state)
    return {"success": True, "message": f"Modo cambiado a {mode}"}


# ---- bot ----

@app.post("/api/restart-bot")
def api_restart_bot(_=Depends(verify_token)):
    try:
        restart_bot()
        return {"success": True, "message": "Bot reiniciado"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


@app.post("/api/stop-bot")
def api_stop_bot(_=Depends(verify_token)):
    kill_bot()
    return {"success": True, "message": "Bot detenido"}


@app.post("/api/start-bot")
def api_start_bot(_=Depends(verify_token)):
    try:
        start_bot()
        return {"success": True, "message": "Bot iniciado"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


# ---- groups / accounts ----

@app.get("/api/groups")
def api_groups(_=Depends(verify_token)):
    groups = get_groups()
    current = get_current_group_index()
    aliases = _get_aliases()
    return {
        "current": current + 1,
        "groups": [
            {
                "index": i + 1,
                "accounts": g,
                "accounts_display": [aliases.get(a, a) for a in g],
                "active": i == current,
            }
            for i, g in enumerate(groups)
        ],
    }


@app.get("/api/accounts")
def api_accounts(_=Depends(verify_token)):
    cfg = load_config()
    state = load_state()
    disabled = set(cfg.get("disabled_accounts", []))
    aliases = _get_aliases()
    return {
        "accounts": [
            {"name": a, "alias": aliases.get(a, ""), "enabled": a not in disabled}
            for a in state.get("order", [])
        ]
    }


# ---- history ----

@app.get("/api/history")
def api_history(limit: int = 50, _=Depends(verify_token)):
    return load_history()[-limit:]


# ---- config ----

@app.get("/api/config")
def api_get_config(_=Depends(verify_token)):
    cfg = load_config()
    return {k: v for k, v in cfg.items() if k != "api_token"}


class ConfigUpdate(BaseModel):
    group_size: Optional[int] = None
    interval: Optional[int] = None
    check_every: Optional[int] = None
    acc_path: Optional[str] = None
    active_path: Optional[str] = None
    bot_exe: Optional[str] = None
    bot_cwd: Optional[str] = None
    bot_process_name: Optional[str] = None


@app.put("/api/config")
def api_update_config(body: ConfigUpdate, _=Depends(verify_token)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    cfg = update_config(updates)
    return {k: v for k, v in cfg.items() if k != "api_token"}


# ---- admin ----

@app.post("/api/regenerate-order")
def api_regenerate(_=Depends(verify_token)):
    accounts = get_available_accounts()
    state = load_state()
    state["order"] = accounts
    state["current_group"] = 0
    save_state(state)
    return {"success": True, "total": len(accounts), "accounts": accounts}


@app.post("/api/disable-account/{name}")
def api_disable(name: str, _=Depends(verify_token)):
    cfg = load_config()
    disabled = cfg.get("disabled_accounts", [])
    if name not in disabled:
        disabled.append(name)
    cfg["disabled_accounts"] = disabled
    save_config(cfg)
    return {"success": True, "disabled": disabled}


@app.post("/api/enable-account/{name}")
def api_enable(name: str, _=Depends(verify_token)):
    cfg = load_config()
    disabled = cfg.get("disabled_accounts", [])
    if name in disabled:
        disabled.remove(name)
    cfg["disabled_accounts"] = disabled
    save_config(cfg)
    return {"success": True, "disabled": disabled}


# ---- aliases (permanent in config, auto-discovered from logs) ----

_alias_check_ts: float = 0
_ALIAS_CHECK_INTERVAL = 30  # seconds between live-account alias checks


def _get_aliases() -> dict:
    """Return aliases, auto-checking live accounts periodically."""
    global _alias_check_ts
    now = time.time()
    if now - _alias_check_ts >= _ALIAS_CHECK_INTERVAL:
        _alias_check_ts = now
        _check_live_aliases()
    return load_config().get("aliases", {})


def _save_alias(account_id: str, player_name: str):
    """Persist a discovered alias to config.json."""
    cfg = load_config()
    aliases = cfg.get("aliases", {})
    if aliases.get(account_id) != player_name:
        aliases[account_id] = player_name
        cfg["aliases"] = aliases
        save_config(cfg)


def _extract_alias_from_log_content(content: str) -> str:
    """Extract player name from log text."""
    matches = re.findall(r'Nombre Del Jugador:\s*(.+)', content)
    return matches[-1].strip() if matches else ""


def _parse_log_date(filename: str):
    """Parse date from log-DD-MM-YYYY.txt format. Return (YYYY, MM, DD) tuple or (0,0,0)."""
    m = re.match(r'log-?(\d{2})-(\d{2})-(\d{4})', filename, re.IGNORECASE)
    if m:
        dd, mm, yyyy = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return (yyyy, mm, dd)
    return (0, 0, 0)


def _sorted_log_files(logs_dir: str) -> list:
    """Return log filenames sorted by date (most recent first)."""
    if not os.path.isdir(logs_dir):
        return []
    files = [f for f in os.listdir(logs_dir) if f.lower().endswith(".txt")]
    files.sort(key=_parse_log_date, reverse=True)
    return files


def _find_latest_log(cfg: dict, account_id: str) -> str:
    """Find player name from the most recent log across both acc_path and active_path."""
    candidates = []
    for base in (cfg["active_path"], cfg["acc_path"]):
        logs_dir = os.path.join(base, account_id, "Logs")
        if not os.path.isdir(logs_dir):
            continue
        for f in os.listdir(logs_dir):
            if f.lower().endswith(".txt"):
                fp = os.path.join(logs_dir, f)
                date_key = _parse_log_date(f)
                candidates.append((date_key, fp))
    if not candidates:
        return ""
    # sort by parsed date, most recent first
    candidates.sort(reverse=True)
    for _, filepath in candidates:
        try:
            with open(filepath, encoding="utf-8", errors="replace") as fh:
                name = _extract_alias_from_log_content(fh.read())
            if name:
                return name
        except Exception:
            pass
    return ""


def _scan_missing_aliases():
    """Full scan: all accounts. Check all logs to find player names."""
    cfg = load_config()
    state = load_state()
    aliases = cfg.get("aliases", {})
    changed = False
    for account_id in state.get("order", []):
        name = _find_latest_log(cfg, account_id)
        if name and aliases.get(account_id) != name:
            aliases[account_id] = name
            changed = True
    if changed:
        cfg["aliases"] = aliases
        save_config(cfg)
    return aliases


def _check_live_aliases():
    """Lightweight: only re-check accounts currently in active_path."""
    cfg = load_config()
    aliases = cfg.get("aliases", {})
    active_path = cfg["active_path"]
    if not os.path.isdir(active_path):
        return
    changed = False
    for account_id in os.listdir(active_path):
        name = _find_latest_log(cfg, account_id)
        if name and aliases.get(account_id) != name:
            aliases[account_id] = name
            changed = True
    if changed:
        cfg["aliases"] = aliases
        save_config(cfg)


@app.get("/api/aliases")
def api_get_aliases(_=Depends(verify_token)):
    return _get_aliases()


@app.post("/api/aliases/refresh")
def api_refresh_aliases(_=Depends(verify_token)):
    aliases = _scan_missing_aliases()
    return {"success": True, "aliases": aliases, "total": len(aliases)}


@app.on_event("startup")
def on_startup():
    _scan_missing_aliases()


# ---- logs ----

def _safe_account_name(name: str) -> str:
    """Validate account name to prevent path traversal."""
    if not re.match(r'^[\w\-]+$', name):
        raise HTTPException(400, "Nombre de cuenta inválido")
    return name


def _safe_log_filename(name: str) -> str:
    """Validate log filename to prevent path traversal."""
    if not re.match(r'^[\w\-\. ]+\.txt$', name, re.IGNORECASE):
        raise HTTPException(400, "Nombre de archivo inválido")
    return name


def _log_base_path(cfg: dict, account_id: str) -> tuple:
    """Return (logs_dir, is_live). Prefer active_path if account is there."""
    active_logs = os.path.join(cfg["active_path"], account_id, "Logs")
    if os.path.isdir(active_logs):
        return active_logs, True
    acc_logs = os.path.join(cfg["acc_path"], account_id, "Logs")
    return acc_logs, False


@app.get("/api/logs/{account_id}")
def api_log_files(account_id: str, _=Depends(verify_token)):
    account_id = _safe_account_name(account_id)
    cfg = load_config()
    logs_dir, live = _log_base_path(cfg, account_id)
    if not os.path.isdir(logs_dir):
        return {"files": [], "live": False}
    files = _sorted_log_files(logs_dir)
    return {"files": files, "live": live}


@app.get("/api/logs/{account_id}/{filename}")
def api_log_content(
    account_id: str, filename: str,
    tail: int = Query(default=200, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
    _=Depends(verify_token),
):
    account_id = _safe_account_name(account_id)
    filename = _safe_log_filename(filename)
    cfg = load_config()
    logs_dir, live = _log_base_path(cfg, account_id)
    filepath = os.path.join(logs_dir, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(404, "Archivo de log no encontrado")
    with open(filepath, encoding="utf-8", errors="replace") as f:
        lines = f.readlines()
    total = len(lines)
    if offset > 0:
        new_lines = lines[offset:]
        content = "".join(new_lines)
        return {
            "filename": filename, "total_lines": total,
            "lines_returned": len(new_lines), "offset": total,
            "content": content, "live": live,
        }
    content = "".join(lines[-tail:])
    return {
        "filename": filename, "total_lines": total,
        "lines_returned": min(tail, total), "offset": total,
        "content": content, "live": live,
    }


# ---- settings (acc o active_path) ----

class SettingsUpdate(BaseModel):
    settings: dict


def _get_account_path(cfg: dict, account_name: str, target: str) -> str:
    """Retorna la ruta de la carpeta de cuenta según target (acc o config)"""
    if target == "acc":
        return os.path.join(cfg["acc_path"], account_name)
    elif target == "config":
        return os.path.join(cfg["active_path"], account_name)
    else:
        raise HTTPException(400, "target debe ser 'acc' o 'config'")


def _find_account_path(cfg: dict, account_name: str) -> tuple:
    """
    Busca la carpeta de una cuenta. Intenta primero en config/ (activas), 
    luego en acc/ (inactivas).
    Retorna (ruta, tipo) donde tipo es 'config' o 'acc', o (None, None) si no existe.
    """
    # Primero intenta en config (cuentas activas)
    config_path = os.path.join(cfg["active_path"], account_name)
    if os.path.isdir(config_path):
        settings_file = os.path.join(config_path, "settings.json")
        if os.path.isfile(settings_file):
            return config_path, "config"
    
    # Si no encuentra, intenta en acc (cuentas inactivas)
    acc_path = os.path.join(cfg["acc_path"], account_name)
    if os.path.isdir(acc_path):
        settings_file = os.path.join(acc_path, "settings.json")
        if os.path.isfile(settings_file):
            return acc_path, "acc"
    
    return None, None


def _filter_settings(settings: dict) -> dict:
    """Filtra secciones y campos no editables"""
    excluded_sections = {"connectionSettings", "statSettings", "mailSettings", "speedUpSettings", "kingdomBoosts", "realmGatherSettings"}
    
    # Campos permitidos en miscSettings
    misc_allowed = {
        "useVipPoints", "useExpItems", "autoOpenChests", "autoClaimKingdomGifts",
        "useResourceFromBag", "autoTreasureTrove", "scheduleBuildSpam",
        "scheduleBuildSpamHours", "scheduleBuildSpamAmount", "scheduleBuildSpamDelay"
    }
    
    # Campos permitidos en guildSettings
    guild_allowed = {
        "sendGuildHelp", "requestGuildHelp", "autoGuildGifts"
    }
    
    # Campos permitidos en turfQuests
    turf_allowed = {
        "attackLabyrinth", "attackKingdomTycoon"
    }
    
    filtered = {}
    for section, fields in settings.items():
        if section in excluded_sections:
            continue
        
        if section == "miscSettings" and isinstance(fields, dict):
            # Filtrar solo campos permitidos
            filtered[section] = {k: v for k, v in fields.items() if k in misc_allowed}
        elif section == "guildSettings" and isinstance(fields, dict):
            # Filtrar solo campos permitidos
            filtered[section] = {k: v for k, v in fields.items() if k in guild_allowed}
        elif section == "turfQuests" and isinstance(fields, dict):
            # Filtrar solo campos permitidos
            filtered[section] = {k: v for k, v in fields.items() if k in turf_allowed}
        else:
            filtered[section] = fields
    
    return filtered


@app.get("/api/settings/account/{account_name}")
def api_get_account_settings(
    account_name: str,
    _=Depends(verify_token)
):
    """Obtener settings.json de una cuenta
    Busca automáticamente en config/ (activas) o acc/ (inactivas)"""
    account_name = _safe_account_name(account_name)
    cfg = load_config()
    
    account_path, target = _find_account_path(cfg, account_name)
    if not account_path:
        raise HTTPException(404, f"Cuenta '{account_name}' no encontrada en config/ ni en acc/")
    
    settings_file = os.path.join(account_path, "settings.json")
    
    try:
        with open(settings_file, encoding="utf-8") as f:
            settings_full = json.load(f)
        settings_filtered = _filter_settings(settings_full)
        return {
            "account": account_name,
            "target": target,
            "settings_filtered": settings_filtered,
            "settings_full": settings_full
        }
    except json.JSONDecodeError:
        raise HTTPException(400, f"settings.json corrupto en {target}/{account_name}")


@app.put("/api/settings/account/{account_name}")
def api_update_account_settings(
    account_name: str,
    body: SettingsUpdate,
    _=Depends(verify_token)
):
    """Modificar settings.json de una cuenta
    Busca automáticamente en config/ (activas) o acc/ (inactivas)"""
    account_name = _safe_account_name(account_name)
    cfg = load_config()
    
    account_path, target = _find_account_path(cfg, account_name)
    if not account_path:
        raise HTTPException(404, f"Cuenta '{account_name}' no encontrada en config/ ni en acc/")
    
    settings_file = os.path.join(account_path, "settings.json")
    
    try:
        with open(settings_file, "w", encoding="utf-8") as f:
            json.dump(body.settings, f, indent=2)
        return {
            "success": True,
            "account": account_name,
            "target": target,
            "settings": body.settings
        }
    except Exception as e:
        raise HTTPException(400, f"Error guardando settings: {str(e)}")


@app.get("/api/settings")
def api_get_all_settings(
    target: str = Query(default="config"),
    _=Depends(verify_token)
):
    """Obtener todas las configuraciones (acc o config)"""
    if target not in ("acc", "config"):
        raise HTTPException(400, "target debe ser 'acc' o 'config'")
    cfg = load_config()
    base_path = cfg["acc_path"] if target == "acc" else cfg["active_path"]
    
    if not os.path.isdir(base_path):
        raise HTTPException(404, f"{target} no existe")
    
    all_settings = {}
    for account_name in os.listdir(base_path):
        if account_name.lower() == "global":
            continue
        account_dir = os.path.join(base_path, account_name)
        if not os.path.isdir(account_dir):
            continue
        
        settings_file = os.path.join(account_dir, "settings.json")
        if os.path.isfile(settings_file):
            try:
                with open(settings_file, encoding="utf-8") as f:
                    raw_settings = json.load(f)
                all_settings[account_name] = _filter_settings(raw_settings)
            except json.JSONDecodeError:
                all_settings[account_name] = {"_error": "Archivo corrupto"}
    
    return {"target": target, "accounts": all_settings}


@app.put("/api/settings")
def api_update_all_settings(
    body: SettingsUpdate,
    target: str = Query(default="config"),
    _=Depends(verify_token)
):
    """Modificar settings.json de TODAS las cuentas (acc o config)"""
    if target not in ("acc", "config"):
        raise HTTPException(400, "target debe ser 'acc' o 'config'")
    cfg = load_config()
    base_path = cfg["acc_path"] if target == "acc" else cfg["active_path"]
    
    if not os.path.isdir(base_path):
        raise HTTPException(404, f"{target} no existe")
    
    updated = []
    failed = []
    
    for account_name in os.listdir(base_path):
        if account_name.lower() == "global":
            continue
        account_dir = os.path.join(base_path, account_name)
        if not os.path.isdir(account_dir):
            continue
        
        settings_file = os.path.join(account_dir, "settings.json")
        if os.path.isfile(settings_file):
            try:
                with open(settings_file, "w", encoding="utf-8") as f:
                    json.dump(body.settings, f, indent=2)
                updated.append(account_name)
            except Exception as e:
                failed.append({"account": account_name, "error": str(e)})
    
    return {
        "success": len(failed) == 0,
        "target": target,
        "updated": updated,
        "failed": failed,
        "total_updated": len(updated),
        "total_failed": len(failed)
    }


# ---- web panel ----

@app.get("/", response_class=HTMLResponse)
def index():
    path = os.path.join(STATIC_DIR, "index.html")
    with open(path, encoding="utf-8") as f:
        return f.read()
