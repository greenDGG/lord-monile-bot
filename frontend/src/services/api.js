class ApiService {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('rlm_token') || '';
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('rlm_token', token);
    } else {
      localStorage.removeItem('rlm_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(method, endpoint, body = null, allowMock = false) {
    const url = `${this.baseURL}/api${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        this.setToken('');
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      
      // TEMPORARY: Return mock data in development for design testing
      if (allowMock && this.token) {
        console.warn(`[MOCK MODE] Returning mock data for ${endpoint}`);
        return this.getMockData(endpoint);
      }
      
      throw error;
    }
  }

  getMockData(endpoint) {
    const mocks = {
      '/status': {
        current_group: 2,
        total_groups: 8,
        bot_status: 'running',
        paused: false,
        mode: 'auto',
        interval: 600,
        last_switch: Math.floor(Date.now() / 1000) - 150,
        total_accounts: 24,
        current_accounts: ['acc-001', 'acc-002', 'acc-003', 'acc-004', 'acc-005'],
        aliases: {
          'acc-001': 'Cuenta Principal',
          'acc-002': 'Backup 1',
          'acc-003': 'Backup 2',
          'acc-004': 'Test Account',
          'acc-005': 'Reserve'
        }
      },
      '/groups': {
        groups: Array.from({ length: 8 }, (_, i) => ({
          index: i + 1,
          accounts: Array.from({ length: 3 }, (_, j) => `acc-${String(i * 3 + j + 1).padStart(3, '0')}`),
          active: i === 1
        }))
      },
      '/accounts': {
        accounts: Array.from({ length: 24 }, (_, i) => ({
          name: `acc-${String(i + 1).padStart(3, '0')}`,
          alias: ['Cuenta Principal', 'Backup 1', 'Backup 2', 'Test Account', 'Reserve'][i % 5],
          enabled: i < 20
        }))
      },
      '/history?limit=30': {
        history: Array.from({ length: 15 }, (_, i) => ({
          timestamp: Math.floor(Date.now() / 1000) - (i * 300),
          event: 'rotation',
          details: {
            from_group: i % 8 + 1,
            to_group: (i + 1) % 8 + 1,
            trigger: 'auto',
            error: i % 5 === 0 ? 'Connection timeout' : null
          }
        }))
      },
      '/config': {
        group_size: 5,
        interval: 600,
        check_every: 10
      }
    };

    // Match endpoint to mock data
    for (const [mockEndpoint, mockData] of Object.entries(mocks)) {
      if (endpoint.startsWith(mockEndpoint.split('?')[0])) {
        return mockData;
      }
    }

    // Default response
    return { success: true, message: 'Mock response' };
  }

  // Status & Control
  getStatus() {
    return this.request('GET', '/status', null, true);
  }

  nextGroup() {
    return this.request('POST', '/next', null, true);
  }

  prevGroup() {
    return this.request('POST', '/prev', null, true);
  }

  gotoGroup(index) {
    return this.request('POST', `/goto/${index}`, null, true);
  }

  reloadGroup() {
    return this.request('POST', '/reload', null, true);
  }

  // Pause/Resume
  pause() {
    return this.request('POST', '/pause', null, true);
  }

  resume() {
    return this.request('POST', '/resume', null, true);
  }

  setMode(mode) {
    return this.request('POST', `/mode/${mode}`, null, true);
  }

  // Bot Control
  startBot() {
    return this.request('POST', '/start-bot', null, true);
  }

  stopBot() {
    return this.request('POST', '/stop-bot', null, true);
  }

  restartBot() {
    return this.request('POST', '/restart-bot', null, true);
  }

  // Groups & Accounts
  getGroups() {
    return this.request('GET', '/groups', null, true);
  }

  getAccounts() {
    return this.request('GET', '/accounts', null, true);
  }

  disableAccount(name) {
    return this.request('POST', `/disable-account/${encodeURIComponent(name)}`, null, true);
  }

  enableAccount(name) {
    return this.request('POST', `/enable-account/${encodeURIComponent(name)}`, null, true);
  }

  // Config
  getConfig() {
    return this.request('GET', '/config', null, true);
  }

  updateConfig(config) {
    return this.request('PUT', '/config', config, true);
  }

  regenerateOrder() {
    return this.request('POST', '/regenerate-order', null, true);
  }

  // History
  getHistory(limit = 50) {
    return this.request('GET', `/history?limit=${limit}`, null, true);
  }

  // Logs
  getLogAccounts(accountId) {
    return this.request('GET', `/logs/${encodeURIComponent(accountId)}`, null, true);
  }

  getLogContent(accountId, filename, tail = 200, offset = 0) {
    const params = new URLSearchParams();
    if (tail) params.append('tail', tail);
    if (offset) params.append('offset', offset);
    return this.request('GET', `/logs/${encodeURIComponent(accountId)}/${encodeURIComponent(filename)}?${params.toString()}`, null, true);
  }

  // Aliases
  getAliases() {
    return this.request('GET', '/aliases', null, true);
  }

  refreshAliases() {
    return this.request('POST', '/aliases/refresh', null, true);
  }

  // Settings
  getSettings(target = 'config') {
    return this.request('GET', `/settings?target=${target}`, null, true);
  }

  getAccountSettings(accountName, target = 'config') {
    return this.request('GET', `/settings/account/${encodeURIComponent(accountName)}?target=${target}`, null, true);
  }

  updateAccountSettings(accountName, settings, target = 'config') {
    return this.request('PUT', `/settings/account/${encodeURIComponent(accountName)}?target=${target}`, { settings }, true);
  }
}

export default new ApiService();
