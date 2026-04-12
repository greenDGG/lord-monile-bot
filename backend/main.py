import uvicorn
from config import load_config
from scheduler import start_scheduler
from api import app  # noqa: F401
from engine import ensure_order


def main():
    cfg = load_config()
    token = cfg["api_token"]
    port = cfg["api_port"]

    print()
    print("=" * 52)
    print("  RotateLM Controller")
    print("=" * 52)
    print(f"  Token : {token}")
    print(f"  Panel : http://localhost:{port}")
    print("=" * 52)
    print()

    ensure_order()
    start_scheduler()
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="error"  # Solo mostrar errores, sin logs de requests
    )


if __name__ == "__main__":
    main()
