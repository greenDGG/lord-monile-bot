import React from 'react';
import '../styles/components.css';

// SVG Icon Components
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m2.12-2.12l4.24-4.24"></path>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export const Login = ({ onLogin, error, isLoading }) => {
  const [token, setToken] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(token.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>RotateLM</h1>
        <p>Ingresa el token de la API para acceder al panel de control</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Token de API"
            autoComplete="off"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%' }}>
            {isLoading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const Header = ({ onLogout }) => {
  return (
    <header className="header">
      <h1>
        <span className="dot dot-on"></span> RotateLM
      </h1>
      <button onClick={onLogout} className="btn-outline btn-sm">
        Cerrar sesión
      </button>
    </header>
  );
};

export const StatusCard = ({ status }) => {
  if (!status) return null;

  const botStatusClass = {
    running: 'dot-on',
    error: 'dot-off',
    starting: 'dot-warn',
    stopping: 'dot-warn',
  }[status.bot_status] || 'dot-gray';

  const botStatusText = {
    running: 'Activo',
    stopped: 'Detenido',
    starting: 'Iniciando',
    stopping: 'Cerrando',
    error: 'Error',
    unknown: '?',
  }[status.bot_status] || status.bot_status;

  const modeText =
    status.mode === 'auto' ? (status.paused ? 'Pausado' : 'Automático') : 'Manual';

  return (
    <div className="card">
      <h2>Estado</h2>
      <div className="status-grid">
        <div className="stat">
          <div className="stat-value">{status.current_group || '-'} / {status.total_groups || '-'}</div>
          <div className="stat-label">Grupo</div>
        </div>
        <div className="stat">
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span className={`dot ${botStatusClass}`}></span>
            {botStatusText}
          </div>
          <div className="stat-label">Bot</div>
        </div>
        <div className="stat">
          <div className="stat-value">{status.time_remaining ? formatTime(status.time_remaining) : '-'}</div>
          <div className="stat-label">Próxima rotación</div>
        </div>
        <div className="stat">
          <div className="stat-value">{modeText}</div>
          <div className="stat-label">Modo</div>
        </div>
        <div className="stat">
          <div className="stat-value">{status.total_accounts || '-'}</div>
          <div className="stat-label">Cuentas totales</div>
        </div>
      </div>
      <TimerBar status={status} />
      <CurrentAccounts accounts={status.current_accounts || []} aliases={status.aliases || {}} />
    </div>
  );
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const TimerBar = ({ status }) => {
  if (!status.interval || status.mode === 'manual' || status.paused) {
    return <div className="timer-wrap"><div className="timer-bar" style={{ width: '0%' }}></div></div>;
  }

  const elapsed = Math.max(0, status.last_switch ? Math.floor(Date.now() / 1000) - status.last_switch : 0);
  const percentage = Math.min(100, (elapsed / status.interval) * 100);

  return <div className="timer-wrap"><div className="timer-bar" style={{ width: `${percentage}%` }}></div></div>;
};

const CurrentAccounts = ({ accounts, aliases }) => {
  return (
    <div className="accounts-list">
      {accounts.map((acc) => (
        <span key={acc} className="account-tag">
          {aliases[acc] || acc}
        </span>
      ))}
    </div>
  );
};

export const ControlPanel = ({ status, onAction, isLoading }) => {
  const handleAction = async (action) => {
    await onAction(action);
  };

  return (
    <div className="card">
      <h2>Control</h2>
      <div className="button-row">
        <button
          onClick={() => handleAction('prev')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          ◀ Anterior
        </button>
        <button
          onClick={() => handleAction('next')}
          disabled={isLoading}
          className="btn btn-primary"
        >
          Siguiente ▶
        </button>
        <button
          onClick={() => handleAction('reload')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          ↻ Recargar
        </button>
        <button
          onClick={() => handleAction('pause')}
          disabled={isLoading}
          className="btn btn-warn"
        >
          {status?.paused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
        <button
          onClick={() => handleAction('mode')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          Modo: {status?.mode === 'auto' ? 'Auto' : 'Manual'}
        </button>
      </div>
      <div className="button-row" style={{ marginTop: '8px' }}>
        <button
          onClick={() => handleAction('start-bot')}
          disabled={isLoading}
          className="btn btn-success"
        >
          Iniciar Bot
        </button>
        <button
          onClick={() => handleAction('stop-bot')}
          disabled={isLoading}
          className="btn btn-danger"
        >
          Detener Bot
        </button>
        <button
          onClick={() => handleAction('restart-bot')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          Reiniciar Bot
        </button>
      </div>
    </div>
  );
};

export const GroupsGrid = ({ groups, onGotoGroup, isLoading }) => {
  return (
    <div className="card">
      <h2>Grupos</h2>
      <div className="groups-grid">
        {groups.map((group) => (
          <button
            key={group.index}
            onClick={() => onGotoGroup(group.index)}
            className={`group-btn ${group.active ? 'active' : ''}`}
            disabled={isLoading}
            title={group.accounts_display?.join(', ') || ''}
          >
            {group.index}
          </button>
        ))}
      </div>
    </div>
  );
};

export const HistoryPanel = ({ history }) => {
  return (
    <div className="card">
      <h2>Historial</h2>
      <div className="history-list">
        {history.length === 0 ? (
          <div style={{ color: 'var(--dim)', padding: '10px' }}>Sin historial</div>
        ) : (
          history
            .slice()
            .reverse()
            .map((item, idx) => (
              <HistoryItem key={idx} item={item} />
            ))
        )}
      </div>
    </div>
  );
};

const HistoryItem = ({ item }) => {
  const date = new Date(item.timestamp * 1000);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const isOk = !item.details?.error;
  const badges = {
    rotation: 'Rotación',
    rotation_failed: 'Fallo',
    bot_start_failed: 'Error Bot',
  };

  let desc = '';
  if (item.event === 'rotation') {
    desc = `Grupo ${item.details.from_group} → ${item.details.to_group} (${item.details.trigger})`;
  } else if (item.details?.error) {
    desc = item.details.error;
  } else {
    desc = JSON.stringify(item.details);
  }

  return (
    <div className="history-item">
      <span className="history-time">{time}</span>
      <span className={`history-badge ${isOk ? 'ok' : 'err'}`}>
        {badges[item.event] || item.event}
      </span>
      <span>{desc}</span>
    </div>
  );
};

export const Toast = ({ message, type }) => {
  return <div className={`toast toast-${type}`}>{message}</div>;
};

export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const sections = [
    { id: 'dashboard', label: 'Estado y Control', icon: DashboardIcon },
    { id: 'history', label: 'Historial', icon: HistoryIcon },
    { id: 'config', label: 'Configuración', icon: SettingsIcon },
    { id: 'accounts', label: 'Cuentas', icon: UsersIcon },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>RotateLM</h2>
      </div>
      
      <nav className="sidebar-menu">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <span className="sidebar-icon"><IconComponent /></span>
              <span className="sidebar-label">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <button onClick={onLogout} className="sidebar-logout">
        <LogoutIcon /> Cerrar sesión
      </button>
    </aside>
  );
};

export const Dashboard = ({ status, groups, history, onAction, isLoading }) => {
  return (
    <div className="dashboard-content">
      <StatusCard status={status} />
      <ControlPanel status={status} onAction={onAction} isLoading={isLoading} />
      <GroupsGrid groups={groups} onGotoGroup={(idx) => onAction('goto', idx)} isLoading={isLoading} />
    </div>
  );
};

export const ConfigSection = ({ config, onConfigChange, onSaveConfig, isLoading }) => {
  return (
    <div className="dashboard-content">
      <div className="card">
        <h2><SettingsIcon /> Configuración de la Aplicación</h2>
        <div className="setting-row">
          <label>Tamaño de grupo</label>
          <input
            type="number"
            min="1"
            value={config.group_size || ''}
            onChange={(e) => onConfigChange('group_size', parseInt(e.target.value))}
            disabled={isLoading}
          />
        </div>
        <div className="setting-row">
          <label>Intervalo (segundos)</label>
          <input
            type="number"
            min="10"
            value={config.interval || ''}
            onChange={(e) => onConfigChange('interval', parseInt(e.target.value))}
            disabled={isLoading}
          />
        </div>
        <div className="setting-row">
          <label>Check every (segundos)</label>
          <input
            type="number"
            min="1"
            value={config.check_every || ''}
            onChange={(e) => onConfigChange('check_every', parseInt(e.target.value))}
            disabled={isLoading}
          />
        </div>
        <div className="button-row">
          <button onClick={onSaveConfig} disabled={isLoading} className="btn btn-primary">
            <SaveIcon /> Guardar Configuración
          </button>
          <button onClick={() => alert('Regenerando orden...')} disabled={isLoading} className="btn btn-outline">
            <RefreshIcon /> Regenerar Orden
          </button>
        </div>
      </div>
    </div>
  );
};

export const AccountsConfig = ({ accounts, aliases, onToggleAccount, onEditAccount, isLoading }) => {
  return (
    <div className="dashboard-content">
      <div className="card">
        <h2><UsersIcon /> Configuración de Cuentas</h2>
        <div className="accounts-config-list">
          {accounts.map((acc) => (
            <div key={acc.name} className="account-config-row">
              <div className="account-info">
                <span className="account-name">{aliases[acc.name] || acc.name}</span>
                <span className="account-id">{acc.name}</span>
              </div>
              <div className="account-actions">
                <button
                  onClick={() => onToggleAccount(acc.name, acc.enabled)}
                  disabled={isLoading}
                  className={`toggle-btn ${acc.enabled ? 'enabled' : 'disabled'}`}
                >
                  {acc.enabled ? 'Activa' : 'Inactiva'}
                </button>
                <button
                  onClick={() => onEditAccount(acc.name)}
                  disabled={isLoading}
                  className="btn btn-outline"
                  title="Editar categorías"
                >
                  Editar Categorías
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AccountSettingsModal = ({ 
  isOpen, 
  accountName, 
  accountAlias,
  settings, 
  isLoading, 
  onSave, 
  onClose 
}) => {
  const [editedSettings, setEditedSettings] = React.useState(settings || {});

  React.useEffect(() => {
    setEditedSettings(settings || {});
  }, [settings, isOpen]);

  const handleCategoryChange = (category, key, value) => {
    setEditedSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(editedSettings);
  };

  if (!isOpen || !accountName) {
    return null;
  }

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <h2>Editar Categorías: {accountAlias || accountName}</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="settings-categories">
            {Object.keys(editedSettings).map((category) => (
              <div key={category} className="category-section">
                <h3>{category}</h3>
                <div className="category-fields">
                  {typeof editedSettings[category] === 'object' && editedSettings[category] !== null ? (
                    Object.keys(editedSettings[category]).map((key) => {
                      const value = editedSettings[category][key];
                      const inputType = typeof value === 'boolean' ? 'checkbox' : 'text';
                      
                      return (
                        <div key={`${category}-${key}`} className="setting-field">
                          <label htmlFor={`${category}-${key}`}>
                            {key}
                          </label>
                          {inputType === 'checkbox' ? (
                            <input
                              id={`${category}-${key}`}
                              type="checkbox"
                              checked={value || false}
                              onChange={(e) => handleCategoryChange(category, key, e.target.checked)}
                              disabled={isLoading}
                            />
                          ) : (
                            <input
                              id={`${category}-${key}`}
                              type="text"
                              value={String(value)}
                              onChange={(e) => handleCategoryChange(category, key, e.target.value)}
                              disabled={isLoading}
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="setting-field">
                      <label>{category}</label>
                      <input
                        type="text"
                        value={String(editedSettings[category])}
                        onChange={(e) => setEditedSettings(prev => ({
                          ...prev,
                          [category]: e.target.value
                        }))}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-outline"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
