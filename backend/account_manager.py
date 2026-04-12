import os
import shutil

from config import load_config


def get_available_accounts():
    cfg = load_config()
    path = cfg["acc_path"]
    if not os.path.exists(path):
        return []
    return sorted(
        e for e in os.listdir(path)
        if os.path.isdir(os.path.join(path, e))
    )


def get_active_accounts():
    cfg = load_config()
    path = cfg["active_path"]
    if not os.path.exists(path):
        return []
    return [
        f for f in os.listdir(path)
        if f.lower() != "global" and os.path.isdir(os.path.join(path, f))
    ]


def _clean_active(active_path: str):
    removed = []
    for f in os.listdir(active_path):
        if f.lower() == "global":
            continue
        p = os.path.join(active_path, f)
        if os.path.isdir(p):
            shutil.rmtree(p)
        else:
            os.remove(p)
        removed.append(f)
    return removed


def _deploy_accounts(acc_path: str, active_path: str, accounts: list):
    for acc in accounts:
        src = os.path.join(acc_path, acc)
        dst = os.path.join(active_path, acc)
        if not os.path.exists(src):
            raise FileNotFoundError(f"Carpeta de cuenta no encontrada: {src}")
        shutil.copytree(src, dst)


def _sync_back(active_path: str, acc_path: str):
    """
    Copy active account folders back to acc_path, overwriting originals.
    This preserves logs, configs and any changes the bot made while running.
    """
    synced = []
    for f in os.listdir(active_path):
        if f.lower() == "global":
            continue
        src = os.path.join(active_path, f)
        dst = os.path.join(acc_path, f)
        if not os.path.isdir(src):
            continue
        if not os.path.exists(os.path.join(acc_path, f)):
            continue
        shutil.rmtree(dst)
        shutil.copytree(src, dst)
        synced.append(f)
    return synced


def swap_accounts(new_accounts: list):
    """
    Swap active accounts atomically with rollback on failure.
    1. Sync current active back to acc (preserve logs/configs)
    2. Backup current active (for rollback)
    3. Clean active + deploy new group
    Returns (success, error_message | None).
    """
    cfg = load_config()
    active_path = cfg["active_path"]
    acc_path = cfg["acc_path"]
    backup_dir = os.path.join(os.path.dirname(active_path), "_config_backup")

    try:
        # 1. sync active accounts back to acc_path (preserve logs/configs)
        _sync_back(active_path, acc_path)

        # 2. backup current (non-global) for rollback
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
        os.makedirs(backup_dir, exist_ok=True)

        for f in os.listdir(active_path):
            if f.lower() == "global":
                continue
            src = os.path.join(active_path, f)
            dst = os.path.join(backup_dir, f)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)

        # 3. clean + deploy new group
        _clean_active(active_path)
        _deploy_accounts(acc_path, active_path, new_accounts)

        # 4. success → remove backup
        shutil.rmtree(backup_dir, ignore_errors=True)
        return True, None

    except Exception as exc:
        # rollback
        try:
            _clean_active(active_path)
            if os.path.exists(backup_dir):
                for f in os.listdir(backup_dir):
                    src = os.path.join(backup_dir, f)
                    dst = os.path.join(active_path, f)
                    if os.path.isdir(src):
                        shutil.copytree(src, dst)
                    else:
                        shutil.copy2(src, dst)
                shutil.rmtree(backup_dir, ignore_errors=True)
        except Exception:
            pass
        return False, str(exc)
