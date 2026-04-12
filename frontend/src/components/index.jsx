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

const LoadingSpinner = () => (
  <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" style={{ opacity: 0.2 }}></circle>
    <path d="M12 2a10 10 0 0 1 10 10" style={{ strokeDasharray: '52', strokeDashoffset: 0 }}></path>
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
      <h2>Control {isLoading && <LoadingSpinner />}</h2>
      <div className="button-row">
        <button
          onClick={() => handleAction('prev')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          {isLoading ? <LoadingSpinner /> : '◀'} {isLoading ? 'Cargando...' : 'Anterior'}
        </button>
        <button
          onClick={() => handleAction('next')}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? <LoadingSpinner /> : '▶'} {isLoading ? 'Cargando...' : 'Siguiente'}
        </button>
        <button
          onClick={() => handleAction('reload')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          {isLoading ? <LoadingSpinner /> : '↻'} {isLoading ? 'Cargando...' : 'Recargar'}
        </button>
        <button
          onClick={() => handleAction('pause')}
          disabled={isLoading}
          className="btn btn-warn"
        >
          {isLoading ? <LoadingSpinner /> : (status?.paused ? '▶' : '⏸')} {isLoading ? 'Cargando...' : (status?.paused ? 'Reanudar' : 'Pausar')}
        </button>
        <button
          onClick={() => handleAction('mode')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          {isLoading ? <LoadingSpinner /> : '◉'} {isLoading ? 'Cargando...' : `Modo: ${status?.mode === 'auto' ? 'Auto' : 'Manual'}`}
        </button>
      </div>
      <div className="button-row" style={{ marginTop: '8px' }}>
        <button
          onClick={() => handleAction('start-bot')}
          disabled={isLoading}
          className="btn btn-success"
        >
          {isLoading ? <LoadingSpinner /> : '▶'} {isLoading ? 'Cargando...' : 'Iniciar Bot'}
        </button>
        <button
          onClick={() => handleAction('stop-bot')}
          disabled={isLoading}
          className="btn btn-danger"
        >
          {isLoading ? <LoadingSpinner /> : '⏹'} {isLoading ? 'Cargando...' : 'Detener Bot'}
        </button>
        <button
          onClick={() => handleAction('restart-bot')}
          disabled={isLoading}
          className="btn btn-outline"
        >
          {isLoading ? <LoadingSpinner /> : '🔄'} {isLoading ? 'Cargando...' : 'Reiniciar Bot'}
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
  const [expandedCategories, setExpandedCategories] = React.useState({});

  // Mapeo de traducción de categorías
  const categoryTranslations = {
    miscSettings: 'Varios',
    guildSettings: 'Gremio',
    turfQuests: 'Búsqueda de Terrazgo',
    questSettings: 'Búsquedas',
    otherTurfEvents: 'Otros Eventos de Terrazgo',
    cargoShipSettings: 'Configuración de Barco de Carga',
    rallySettings: 'Configuración de Rally',
    protectionSettings: 'Configuración de Protección',
    supplySettings: 'Configuración de Suministro',
    gatherSettings: 'Configuración de Recolección',
    monsterSettings: 'Configuración de Monstruos'
  };

  // Mapeo de traducción de campos
  const fieldTranslations = {
    // Varios
    useVipPoints: 'Usar Puntos VIP',
    useExpItems: 'Usar Objetos de Experiencia',
    autoOpenChests: 'Abrir Cofres Automáticamente',
    autoClaimKingdomGifts: 'Reclamar Regalos Automáticamente',
    useResourceFromBag: 'Usar Recursos de la Bolsa',
    autoTreasureTrove: 'Tesoro Automático',
    scheduleBuildSpam: 'Spam de Construcción Programado',
    scheduleBuildSpamHours: 'Horas de Spam',
    scheduleBuildSpamAmount: 'Cantidad de Spam',
    scheduleBuildSpamDelay: 'Retraso de Spam',
    // Gremio
    sendGuildHelp: 'Enviar Ayuda del Gremio',
    requestGuildHelp: 'Solicitar Ayuda del Gremio',
    autoGuildGifts: 'Regalos del Gremio Automáticos',
    // Búsqueda de Terrazgo
    attackLabyrinth: 'Atacar Laberinto',
    attackKingdomTycoon: 'Atacar Reino Magnate',
    // Búsquedas
    dailyLoginGift: 'Regalo de Login Diario',
    autoVIPQuest: 'Búsqueda VIP Automática',
    autoTurfQuest: 'Búsqueda de Terrazgo Automática',
    autoChapterQuest: 'Búsqueda de Capítulo Automática',
    autoAdminQuest: 'Búsqueda de Admin Automática',
    autoGuildQuest: 'Búsqueda de Gremio Automática',
    adventureLog: 'Registro de Aventura',
    autoMysteryBox: 'Caja Misteriosa Automática',
    autoBogo: 'Compra Uno Lleva Otro Automática',
    collectDailyQuests: 'Recopilar Búsquedas Diarias',
    sendEmoji: 'Enviar Emoji',
    attackLabQuest: 'Atacar Laberinto',
    attackTycoonQuest: 'Atacar Magnate',
    shelterQuest: 'Búsqueda de Refugio',
    openAllGuildQuest: 'Abrir Todas las Búsquedas de Gremio',
    openAllAdminQuest: 'Abrir Todas las Búsquedas de Admin',
    questReserve: 'Reserva de Búsquedas',
    // Otros Eventos de Terrazgo
    attackLabyrinthOther: 'Atacar Laberinto Otros',
    collectLabWeeklyChallenge: 'Recopilar Desafío Semanal del Laberinto',
    attackKTOther: 'Atacar Magnate Otros',
    collectKTWeeklyChallenge: 'Recopilar Desafío Semanal del Magnate',
    KTMode: 'Modo Magnate',
    LabOnlyFree: 'Solo Laberinto Gratis',
    KTOnlyFree: 'Solo Magnate Gratis',
    LabModeOther: 'Modo Laberinto Otros',
    PlayLottery: 'Jugar Lotería',
    LotteryOnlyFree: 'Solo Lotería Gratis',
    PlayFC: 'Jugar FC',
    CollectFCRewards: 'Recopilar Recompensas FC',
    PlayRace: 'Jugar Carrera',
    PlayPinball: 'Jugar Pinball',
    CollectPinballRewards: 'Recopilar Recompensas de Pinball',
    CollectRaceRewards: 'Recopilar Recompensas de Carrera',
    PlayLimitPass: 'Jugar Pase Limitado',
    // Configuración de Barco de Carga
    allowTrading: 'Permitir Comercio',
    tradeFood: 'Comerciar Comida',
    tradeStone: 'Comerciar Piedra',
    tradeWood: 'Comerciar Madera',
    tradeOre: 'Comerciar Mineral',
    tradeGold: 'Comerciar Oro',
    ignoreFood: 'Ignorar Comida',
    ignoreStone: 'Ignorar Piedra',
    ignoreWood: 'Ignorar Madera',
    ignoreOre: 'Ignorar Mineral',
    ignoreGold: 'Ignorar Oro',
    ignoreAnima: 'Ignorar Anima',
    ignoreLunite: 'Ignorar Lunita',
    ignoreSpeedUp: 'Ignorar Acelerar',
    exchangeRssItemOnly: 'Solo Intercambiar Recursos',
    useRssFromBagIfNeeded: 'Usar Recursos de la Bolsa si es Necesario',
    exchangeMinQuality: 'Calidad Mínima de Intercambio',
    // Configuración de Rally
    joinRallies: 'Unirse a Rallies',
    craftEssences: 'Crear Esencias',
    dontFillRally: 'No Llenar Rally',
    noSiege: 'Sin Asedio',
    noT5: 'Sin T5',
    oneType: 'Un Solo Tipo',
    addBuffers: 'Agregar Buffers',
    minEssenceLevel: 'Nivel Mínimo de Esencia',
    extraSpace: 'Espacio Extra',
    rallyLimit: 'Límite de Rally',
    maxWalkTime: 'Tiempo Máximo de Caminata',
    rejoinWaitTime: 'Tiempo de Espera para Reunirse',
    rallyTroopType: 'Tipo de Tropa Rally',
    maxRallyTime: 'Tiempo Máximo de Rally',
    keepEssSlotFree: 'Mantener Ranura de Esencia Libre',
    checkLab: 'Verificar Laboratorio',
    levelToAttack: 'Nivel para Atacar',
    // Configuración de Protección
    alwaysOpenShield: 'Abrir Escudo Siempre',
    openShieldWhenUnderAttack: 'Abrir Escudo Bajo Ataque',
    openShieldWhenScouted: 'Abrir Escudo Cuando Se Explora',
    openShieldWhenRallied: 'Abrir Escudo Cuando Se Hace Rally',
    biggerSheildsFirst: 'Escudos Más Grandes Primero',
    alwaysAntiScout: 'Anti-Exploración Siempre',
    useLongerAnti: 'Usar Anti Más Largo',
    antiScoutWhenScout: 'Anti-Exploración Cuando Se Explora',
    recallGatherTroopsWhenUnderAttack: 'Recuperar Tropas de Recolección Bajo Ataque',
    recallGatherTroopsWhenScouted: 'Recuperar Tropas de Recolección Cuando Se Explora',
    recallGatherTroopsOnConflict: 'Recuperar Tropas de Recolección en Conflicto',
    sendTroopsToRegather: 'Enviar Tropas a Reagrupar',
    dontShelterSiege: 'No Refugiar Asedio',
    regatherWaitTime: 'Tiempo de Espera para Reagrupar',
    shieldRandomTime: 'Tiempo Aleatorio de Escudo',
    ShelterType: 'Tipo de Refugio',
    AttackShelterType: 'Tipo de Refugio de Ataque',
    shieldRedeployTime: 'Tiempo de Redesplegue de Escudo',
    antiRedeployTime: 'Tiempo de Redesplegue Anti',
    recallShelterTroopsAfterAttack: 'Recuperar Tropas de Refugio Después del Ataque',
    preferredShield: 'Escudo Preferido',
    // Configuración de Suministro
    sendResources: 'Enviar Recursos',
    useBagResource: 'Usar Recursos de la Bolsa',
    randomizeSpeed: 'Velocidad Aleatoria',
    speedGear: 'Engranaje de Velocidad',
    supplySpeed: 'Velocidad de Suministro',
    maxTravelTime: 'Tiempo Máximo de Viaje',
    playerToSend: 'Jugador a Enviar',
    reservedRss: 'Recursos Reservados',
    supplyMin: 'Mínimo de Suministro',
    reservedBagRss: 'Recursos Reservados en Bolsa',
    typesToSend: 'Tipos a Enviar',
    bagTypesToSend: 'Tipos de Bolsa a Enviar',
    // Configuración de Recolección
    gatherResources: 'Recopilar Recursos',
    gatherLowestResources: 'Recopilar Recursos Más Bajos',
    ignoreLevelForGems: 'Ignorar Nivel para Gemas',
    clearTiles: 'Limpiar Baldosas',
    targetHigherLevel: 'Apuntar Nivel Más Alto',
    leaveSpareArmy: 'Dejar Ejército de Repuesto',
    spareArmyAmount: 'Cantidad de Ejército de Repuesto',
    recallCamps: 'Recuperar Campamentos',
    useGatherGear: 'Usar Equipo de Recolección',
    useGatherSchedule: 'Usar Horario de Recolección',
    ignoreLevel3GF: 'Ignorar Nivel 3 GF',
    gatherStartTime: 'Hora de Inicio de Recolección',
    gatherEndTime: 'Hora de Fin de Recolección',
    maxArmysToSend: 'Máximo de Ejércitos a Enviar',
    maxSearchArea: 'Área de Búsqueda Máxima',
    maxTravelTime: 'Tiempo Máximo de Viaje',
    tileMinimum: 'Mínimo de Baldosa',
    sendingDelay: 'Retraso de Envío',
    levelToGather: 'Nivel para Recopilar',
    typesToGather: 'Tipos a Recopilar',
    // Configuración de Monstruos
    autoHunting: 'Caza Automática',
    sendMonstersToChat: 'Enviar Monstruos al Chat',
    useBoots: 'Usar Botas',
    useEnergyItems: 'Usar Objetos de Energía',
    oneKillHunt: 'Caza de Un Golpe',
    comboPrediction: 'Predicción de Combo',
    allowSaberfang: 'Permitir Saberfang',
    huntSearchArea: 'Área de Búsqueda de Caza',
    huntSendDelay: 'Retraso de Envío de Caza',
    avoidConflict: 'Evitar Conflictos',
    avoidGuildConflict: 'Evitar Conflictos del Gremio',
    energyPercentage: 'Porcentaje de Energía',
    huntMode: 'Modo de Caza',
    stealPercentage: 'Porcentaje de Robo',
    stealCombo: 'Combo de Robo',
    heroType: 'Tipo de Héroe',
    huntLevels: 'Niveles de Caza',
    monsterTypes: 'Tipos de Monstruos',
    selectedHerosMP: 'Héroes Seleccionados MP',
    selectedHerosM: 'Héroes Seleccionados M',
    HuntAnyMonster: 'Cazar Cualquier Monstruo',
    monstersToHunt_: 'Monstruos a Cazar'
  };

  const translateCategory = (category) => {
    return categoryTranslations[category] || category;
  };

  const translateField = (field) => {
    return fieldTranslations[field] || field;
  };

  React.useEffect(() => {
    setEditedSettings(settings || {});
    // Expandir la primera categoría por defecto
    const categories = Object.keys(settings || {});
    if (categories.length > 0) {
      setExpandedCategories({ [categories[0]]: true });
    }
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

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
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
          <div className="settings-accordion">
            {Object.keys(editedSettings).map((category) => (
              <div key={category} className="accordion-item">
                <button
                  className={`accordion-header ${expandedCategories[category] ? 'open' : ''}`}
                  onClick={() => toggleCategory(category)}
                  disabled={isLoading}
                >
                  <span className="accordion-toggle">
                    {expandedCategories[category] ? '▾' : '▸'}
                  </span>
                  <span className="accordion-title">{translateCategory(category)}</span>
                </button>
                
                {expandedCategories[category] && (
                  <div className="accordion-body">
                    {typeof editedSettings[category] === 'object' && editedSettings[category] !== null ? (
                      <div className="category-fields">
                        {Object.keys(editedSettings[category]).map((key) => {
                          const value = editedSettings[category][key];
                          const inputType = typeof value === 'boolean' ? 'checkbox' : 'text';
                          
                          // Renderizado especial para levelToAttack (10 niveles)
                          if (key === 'levelToAttack') {
                            const levels = String(value).split(',').map(v => v.trim() === 'true');
                            
                            return (
                              <div key={`${category}-${key}`} className="setting-field">
                                <label>{translateField(key)}</label>
                                <div className="level-selector">
                                  {levels.map((isActive, index) => (
                                    <button
                                      key={index}
                                      className={`level-btn ${isActive ? 'active' : 'inactive'}`}
                                      onClick={() => {
                                        const newLevels = [...levels];
                                        newLevels[index] = !newLevels[index];
                                        const newValue = newLevels.join(',');
                                        handleCategoryChange(category, key, newValue);
                                      }}
                                      disabled={isLoading}
                                      title={`Nivel ${index + 1}`}
                                    >
                                      {index + 1}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          
                          // Renderizado especial para campos de recursos (5 tipos)
                          if (['reservedRss', 'supplyMin', 'reservedBagRss', 'typesToSend', 'bagTypesToSend'].includes(key)) {
                            const resourceNames = ['Comida', 'Piedra', 'Madera', 'Mineral', 'Oro'];
                            const resourceValues = String(value).split(',').map(v => v.trim());
                            const isNumericField = ['reservedRss', 'supplyMin', 'reservedBagRss'].includes(key);
                            
                            return (
                              <div key={`${category}-${key}`} className="setting-field resource-field">
                                <label>{translateField(key)}</label>
                                <div className="resource-grid">
                                  {resourceNames.map((resourceName, index) => {
                                    const resourceValue = resourceValues[index];
                                    
                                    return (
                                      <div key={index} className="resource-item">
                                        <div className="resource-label">{resourceName}</div>
                                        {isNumericField ? (
                                          <input
                                            type="number"
                                            value={isNaN(parseInt(resourceValue)) ? 0 : parseInt(resourceValue)}
                                            onChange={(e) => {
                                              const newValues = [...resourceValues];
                                              newValues[index] = e.target.value;
                                              handleCategoryChange(category, key, newValues.join(','));
                                            }}
                                            disabled={isLoading}
                                            className="resource-input"
                                          />
                                        ) : (
                                          <button
                                            className={`resource-toggle ${resourceValue === 'true' ? 'active' : 'inactive'}`}
                                            onClick={() => {
                                              const newValues = [...resourceValues];
                                              newValues[index] = newValues[index] === 'true' ? 'false' : 'true';
                                              handleCategoryChange(category, key, newValues.join(','));
                                            }}
                                            disabled={isLoading}
                                            title={resourceName}
                                          >
                                            {resourceValue === 'true' ? '✓' : '✗'}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={`${category}-${key}`} className="setting-field">
                              <label htmlFor={`${category}-${key}`}>
                                {translateField(key)}
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
                        })}
                      </div>
                    ) : (
                      <div className="category-fields">
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
                      </div>
                    )}
                  </div>
                )}
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
