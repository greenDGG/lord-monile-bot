# Backend - RotateLM Controller

API Python (FastAPI) para control y rotación de cuentas.

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecutar

```bash
python main.py
```

## Estructura

- `config.py` - Carga y guardado de configuración
- `state.py` - Gestión de estado y historial
- `engine.py` - Lógica de rotación de cuentas
- `bot_manager.py` - Control del proceso bot
- `account_manager.py` - Gestión de carpetas de cuentas
- `scheduler.py` - Scheduler automático de rotaciones
- `api.py` - Endpoints FastAPI

## Configuración

Ver `config.json` - se genera automáticamente con valores por defecto.

## Archivos de Estado

- `state.json` - Estado actual (grupo, modo, paused, orden)
- `history.json` - Historial de eventos
