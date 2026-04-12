# RotateLM

Sistema de control y rotación de cuentas para Lord's Mobile con panel web.

## Estructura del Proyecto

```
rotateLM/
├── backend/                 # API Python (FastAPI)
│   ├── main.py
│   ├── api.py
│   ├── config.py
│   ├── state.py
│   ├── bot_manager.py
│   ├── account_manager.py
│   ├── engine.py
│   ├── scheduler.py
│   ├── config.json          # Configuración
│   ├── state.json           # Estado actual
│   ├── history.json         # Historial de rotaciones
│   └── requirements.txt
│
├── frontend/                # React (Panel Web)
│   ├── public/
│   │   └── index.html       # Interfaz web actual
│   ├── src/                 # (Será una app React completa)
│   ├── package.json
│   └── README.md
│
└── README.md                # Este archivo
```

## Backend (Python + FastAPI)

### Instalación

```bash
cd backend
pip install -r requirements.txt
```

### Ejecutar

```bash
cd backend
python main.py
```

El servidor correrá en `http://localhost:8080`

### API Endpoints

- `GET /api/status` - Estado actual del sistema
- `POST /api/next` - Siguiente grupo
- `POST /api/prev` - Grupo anterior
- `POST /api/goto/{group}` - Ir a grupo específico
- `POST /api/pause` - Pausar rotación
- `POST /api/resume` - Reanudar rotación
- `POST /api/start-bot` - Iniciar bot
- `POST /api/stop-bot` - Detener bot
- `GET /api/config` - Obtener configuración
- `PUT /api/config` - Actualizar configuración
- Y más...

## Frontend (Actualmente HTML/JS puro)

El panel web está en `frontend/public/index.html`. Es una aplicación HTML/CSS/JS pura sin dependencias que consume la API del backend.

### Migración a React

Para modernizar el frontend y hacerlo más mantenible, se recomienda:

1. Implementar componentes React
2. Usar hooks para estado y efectos
3. Crear estructura de carpetas: `src/components/`, `src/pages/`, `src/hooks/`, `src/services/`
4. Configurar proxy para desarrollo

## Configuración

Editar `backend/config.json`:

```json
{
  "acc_path": "Ruta a carpeta de cuentas",
  "active_path": "Ruta a carpeta activa del bot",
  "bot_exe": "Ruta al ejecutable del bot",
  "bot_process_name": "Nombre del proceso",
  "group_size": 5,
  "interval": 600,
  "api_port": 8080,
  "api_token": "Token para autenticación"
}
```

## Desarrollo

### Backend
- Editar archivos Python en `backend/`
- Cambios se aplican con reinicio del servidor

### Frontend
- Actualmente: modifica `frontend/public/index.html`
- Futuro (React): ejecutar `npm start` en `frontend/`

## Deploy

1. Backend: Deployar en servidor con Python
2. Frontend: Build con `npm run build` y servir archivos
