import React from 'react';
import api from './services/api';
import {
  useAuth,
  useStatus,
  useGroups,
  useHistory,
  useToast,
} from './hooks';
import {
  Login,
  Sidebar,
  Dashboard,
  HistoryPanel,
  ConfigSection,
  AccountsConfig,
  AccountSettingsModal,
  ToastContainer,
} from './components';
import './styles/global.css';

function App() {
  const auth = useAuth();
  const { status, isConnected, refresh: refreshStatus } = useStatus();
  const { groups, refresh: refreshGroups } = useGroups();
  const { history, refresh: refreshHistory } = useHistory(30);
  const { toasts, add: addToast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('dashboard');
  const [config, setConfig] = React.useState({ group_size: 0, interval: 0, check_every: 0 });
  const [accounts, setAccounts] = React.useState([]);
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    accountName: null,
    accountAlias: null,
    settings: null
  });

  // Set API base URL if needed
  React.useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      api.setToken(auth.token);
    }
  }, [auth.isAuthenticated, auth.token]);

  // Load config and accounts on mount
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      loadConfig();
      loadAccounts();
    }
  }, [auth.isAuthenticated]);

  const loadConfig = async () => {
    try {
      const cfg = await api.getConfig();
      setConfig(cfg);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const accs = await api.getAccounts();
      setAccounts(accs.accounts || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleAction = React.useCallback(
    async (action, arg) => {
      setIsLoading(true);
      try {
        let result;
        switch (action) {
          case 'next':
            result = await api.nextGroup();
            break;
          case 'prev':
            result = await api.prevGroup();
            break;
          case 'reload':
            result = await api.reloadGroup();
            break;
          case 'pause':
            if (status?.paused) {
              result = await api.resume();
            } else {
              result = await api.pause();
            }
            break;
          case 'mode':
            const nextMode = status?.mode === 'auto' ? 'manual' : 'auto';
            result = await api.setMode(nextMode);
            break;
          case 'start-bot':
            result = await api.startBot();
            break;
          case 'stop-bot':
            result = await api.stopBot();
            break;
          case 'restart-bot':
            result = await api.restartBot();
            break;
          case 'goto':
            result = await api.gotoGroup(arg);
            break;
          default:
            return;
        }
        addToast(result.message || 'Acción completada', 'ok');
        setTimeout(() => {
          refreshStatus();
          refreshGroups();
          refreshHistory();
        }, 1000);
      } catch (error) {
        addToast(`Error: ${error.message}`, 'err');
      } finally {
        setIsLoading(false);
      }
    },
    [status, addToast, refreshStatus, refreshGroups, refreshHistory]
  );

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const result = await api.updateConfig(config);
      addToast('Configuración guardada', 'ok');
      loadConfig();
      refreshStatus();
    } catch (error) {
      addToast(`Error: ${error.message}`, 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAccount = async (name, enabled) => {
    setIsLoading(true);
    try {
      const result = enabled 
        ? await api.disableAccount(name)
        : await api.enableAccount(name);
      addToast(result.message || 'Cuenta actualizada', 'ok');
      loadAccounts();
    } catch (error) {
      addToast(`Error: ${error.message}`, 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAccount = async (accountName) => {
    setIsLoading(true);
    try {
      const response = await api.getAccountSettings(accountName);
      const accountAlias = (status?.aliases || {})[accountName] || accountName;
      setModalState({
        isOpen: true,
        accountName,
        accountAlias,
        settings: response.settings_filtered || {}
      });
    } catch (error) {
      addToast(`Error cargando categorías: ${error.message}`, 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      accountName: null,
      accountAlias: null,
      settings: null
    });
  };

  const handleSaveAccountSettings = async (settings) => {
    setIsLoading(true);
    try {
      const result = await api.updateAccountSettings(modalState.accountName, settings);
      addToast('Categorías actualizadas', 'ok');
      handleCloseModal();
      loadAccounts();
    } catch (error) {
      addToast(`Error guardando cambios: ${error.message}`, 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (token) => {
    const success = await auth.login(token);
    if (!success) {
      addToast(auth.error || 'Fallo en la autenticación', 'err');
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <>
        <Login
          onLogin={handleLogin}
          error={auth.error}
          isLoading={auth.isLoading}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        onLogout={auth.logout}
      />
      
      <main className="main-content">
        {activeSection === 'dashboard' && (
          <Dashboard
            status={status}
            groups={groups}
            history={history}
            onAction={handleAction}
            isLoading={isLoading}
          />
        )}
        
        {activeSection === 'history' && (
          <div className="dashboard-content">
            <HistoryPanel history={history} />
          </div>
        )}
        
        {activeSection === 'config' && (
          <ConfigSection
            config={config}
            onConfigChange={handleConfigChange}
            onSaveConfig={handleSaveConfig}
            isLoading={isLoading}
          />
        )}
        
        {activeSection === 'accounts' && (
          <AccountsConfig
            accounts={accounts}
            aliases={status?.aliases || {}}
            onToggleAccount={handleToggleAccount}
            onEditAccount={handleEditAccount}
            isLoading={isLoading}
          />
        )}
      </main>

      <AccountSettingsModal
        isOpen={modalState.isOpen}
        accountName={modalState.accountName}
        accountAlias={modalState.accountAlias}
        settings={modalState.settings}
        isLoading={isLoading}
        onSave={handleSaveAccountSettings}
        onClose={handleCloseModal}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default App;
