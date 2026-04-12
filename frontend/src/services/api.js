class ApiService {
  constructor(baseURL = process.env.REACT_APP_API_URL || '') {
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

  async request(method, endpoint, body = null) {
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
      throw error;
    }
  }

  // Status & Control
  getStatus() {
    return this.request('GET', '/status');
  }

  nextGroup() {
    return this.request('POST', '/next');
  }

  prevGroup() {
    return this.request('POST', '/prev');
  }

  gotoGroup(index) {
    return this.request('POST', `/goto/${index}`);
  }

  reloadGroup() {
    return this.request('POST', '/reload');
  }

  // Pause/Resume
  pause() {
    return this.request('POST', '/pause');
  }

  resume() {
    return this.request('POST', '/resume');
  }

  setMode(mode) {
    return this.request('POST', `/mode/${mode}`);
  }

  // Bot Control
  startBot() {
    return this.request('POST', '/start-bot');
  }

  stopBot() {
    return this.request('POST', '/stop-bot');
  }

  restartBot() {
    return this.request('POST', '/restart-bot');
  }

  // Groups & Accounts
  getGroups() {
    return this.request('GET', '/groups');
  }

  getAccounts() {
    return this.request('GET', '/accounts');
  }

  disableAccount(name) {
    return this.request('POST', `/disable-account/${encodeURIComponent(name)}`);
  }

  enableAccount(name) {
    return this.request('POST', `/enable-account/${encodeURIComponent(name)}`);
  }

  // Config
  getConfig() {
    return this.request('GET', '/config');
  }

  updateConfig(config) {
    return this.request('PUT', '/config', config);
  }

  regenerateOrder() {
    return this.request('POST', '/regenerate-order');
  }

  // History
  getHistory(limit = 50) {
    return this.request('GET', `/history?limit=${limit}`);
  }

  // Logs
  getLogAccounts(accountId) {
    return this.request('GET', `/logs/${encodeURIComponent(accountId)}`);
  }

  getLogContent(accountId, filename, tail = 200, offset = 0) {
    const params = new URLSearchParams();
    if (tail) params.append('tail', tail);
    if (offset) params.append('offset', offset);
    return this.request('GET', `/logs/${encodeURIComponent(accountId)}/${encodeURIComponent(filename)}?${params.toString()}`);
  }

  // Aliases
  getAliases() {
    return this.request('GET', '/aliases');
  }

  refreshAliases() {
    return this.request('POST', '/aliases/refresh');
  }

  // Settings
  getSettings(target = 'config') {
    return this.request('GET', `/settings?target=${target}`);
  }

  getAccountSettings(accountName) {
    return this.request('GET', `/settings/account/${encodeURIComponent(accountName)}`);
  }

  updateAccountSettings(accountName, settings) {
    return this.request('PUT', `/settings/account/${encodeURIComponent(accountName)}`, { settings });
  }
}

export default new ApiService();
