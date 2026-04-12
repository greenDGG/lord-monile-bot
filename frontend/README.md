# RotateLM - Frontend (React)

Interfaz web moderna para el panel de control de RotateLM.

## 📁 Estructura del Proyecto

```
frontend/
├── public/
│   ├── index.html          # HTML base (solo <div id="root"></div>)
├── src/
│   ├── services/
│   │   └── api.js          # Singleton API client con todas las rutas
│   ├── hooks/
│   │   └── index.js        # Custom React hooks (useAuth, useStatus, etc)
│   ├── components/
│   │   └── index.jsx       # Componentes React reutilizables
│   ├── styles/
│   │   ├── global.css      # Estilos base, variables CSS, layout
│   │   └── components.css  # Estilos específicos de componentes
│   ├── App.jsx             # Componente principal (orquestación)
│   └── index.jsx           # Entry point React
├── package.json
└── README.md
```

## 🎯 Componentes Principales

### `services/api.js`
- **ApiService**: Singleton que maneja todas las comunicaciones con la API
- Métodos para: status, grupos, control de rotación, bot, logs, settings, aliases
- Manejo automático de tokens Bearer
- Logout automático en errores 401

### `hooks/index.js`
- **useAuth()**: Gestiona login/logout, almacenamiento de token
- **useStatus()**: Auto-refresh de estado cada 5 segundos
- **useGroups()**: Carga datos de grupos
- **useHistory()**: Historial de rotaciones
- **useToast()**: Sistema de notificaciones con auto-dismiss

### `components/index.jsx`
Componentes React reutilizables:
- **Login**: Formulario de autenticación
- **Header**: Navegación y botón de logout
- **StatusCard**: Estado actual (grupo, bot, timer, mode)
- **ControlPanel**: Botones de control
- **GroupsGrid**: Selector de grupos
- **HistoryPanel**: Historial de rotaciones
- **Toast/ToastContainer**: Notificaciones

### `App.jsx`
- Orquestador principal de la aplicación
- Gestiona todos los hooks
- Ruteo entre Login y Dashboard
- Procesamiento de todas las acciones

## 🚀 Instalación y Build

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Desarrollo (hot reload)
npm run dev

# 3. Build producción
npm run build

# 4. Preview del build
npm run preview
```

## 🎨 Estilos CSS

### Separación de estilos:
- **`global.css`**: Variables, reset, base, layout responsivo
- **`components.css`**: Botones, cards, formularios, modales, tablas

### Variables CSS Disponibles:
```css
--bg: #0d1117              /* Fondo principal */
--surface: #161b22         /* Superficie de cards */
--text: #e6edf3            /* Texto principal */
--accent: #58a6ff          /* Azul primario */
--danger: #f85149          /* Rojo */
--success: #3fb950         /* Verde */
--warning: #d29922         /* Amarillo */
```

## 📊 Flujo de Datos

```
index.jsx
    ↓
App.jsx (orquestador principal)
    ├→ useAuth()     → localStorage
    ├→ useStatus()   → Backend
    ├→ useGroups()   → Backend
    ├→ useHistory()  → Backend
    └→ useToast()    (notificaciones)
        ↓
    Render: Login o Dashboard
        ↓
    Eventos → api.js → Backend
```

## ⚙️ Vite Config (vite.config.js)

```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

## 📦 Dependencies Necesarias

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.9"
  }
}
```

## 🔄 Ciclo de Vida

1. App monta → Verifica token
2. Si token existe → Carga status, grupos, historial
3. useStatus() → auto-refresh cada 5s
4. Interacción Usuario → api.js → Backend
5. useToast() → Feedback al usuario

## 🛠️ TODO

- [ ] npm install react react-dom @vitejs/plugin-react vite
- [ ] Crear vite.config.js
- [ ] Probar con `npm run dev`
- [ ] Adaptar URLs backend si está en otro puerto

## 📞 Métodos API Disponibles

Ver `src/services/api.js` para lista completa. Ejemplos:

```javascript
apiService.getStatus()
apiService.nextGroup()
apiService.prevGroup()
apiService.gotoGroup(index)
apiService.startBot()
apiService.stopBot()
apiService.getGroups()
apiService.getHistory()
apiService.getConfig()
apiService.updateConfig({...})
```

## 🔐 Autenticación

- Token guardado en `localStorage` con clave `rlm_token`
- Enviado en header: `Authorization: Bearer <token>`
- Auto-logout en errores 401 (expiración)

---

**Last Updated**: Refactorización completa a React con estilos separados


Los archivos estáticos se generarán en `build/`.
