import { Coin, Transaction, OperationPasswords, MarketSettings, SyncLog } from '../types';

const STORAGE_KEYS = {
  VERSION: 'kali_vault_v6_hybrid',
  BALANCE: 'kali_balance_fiat',
  PORTFOLIO: 'kali_portfolio',
  COINS: 'kali_coins',
  TRANSACTIONS: 'kali_transactions',
  PASSWORDS: 'kali_passwords',
  MARKET_SETTINGS: 'kali_market_settings',
  SYNC_LOGS: 'kali_sync_logs',
  LAST_SYNC: 'kali_last_sync_time',
  SOUND: 'kali_sound'
};

export const DEFAULT_PASSWORDS: OperationPasswords = {
  buy: '1234',
  sell: '1234',
  receive: '1234',
  send: '1234'
};

export const DEFAULT_MARKET_SETTINGS: MarketSettings = {
  intervalSeconds: 10,
  maxUpPercent: 5,
  maxDownPercent: 5,
  preset: 'Neutro',
  trend: 'neutro',
  updateSpeedMs: 10000,
  lastUpdated: new Date().toISOString()
};

export const storage = {
  initStorage(initialBalance: number, initialPortfolio: Record<string, number>, initialCoins: Coin[], initialTransactions: Transaction[]) {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (!v) {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEYS.VERSION, 'true');
        this.saveBalance(initialBalance);
        this.savePortfolio(initialPortfolio);
        this.saveCoins(initialCoins);
        this.saveTransactions(initialTransactions);
        this.savePasswords(DEFAULT_PASSWORDS);
        this.saveMarketSettings(DEFAULT_MARKET_SETTINGS);
      }
    } catch (e) {
      console.warn('Storage init error:', e);
    }
  },

  loadBalance(defaultVal: number): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.BALANCE);
      return val ? parseFloat(val) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  saveBalance(val: number) {
    try {
      localStorage.setItem(STORAGE_KEYS.BALANCE, val.toString());
    } catch (e) {
      console.warn('Save balance error:', e);
    }
  },

  loadPortfolio(defaultVal: Record<string, number>): Record<string, number> {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      return val ? JSON.parse(val) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  savePortfolio(val: Record<string, number>) {
    try {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(val));
    } catch (e) {
      console.warn('Save portfolio error:', e);
    }
  },

  loadCoins(defaultVal: Coin[]): Coin[] {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.COINS);
      return val ? JSON.parse(val) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  saveCoins(val: Coin[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.COINS, JSON.stringify(val));
    } catch (e) {
      console.warn('Save coins error:', e);
    }
  },

  loadTransactions(defaultVal: Transaction[]): Transaction[] {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return val ? JSON.parse(val) : defaultVal;
    } catch {
      return defaultVal;
    }
  },

  saveTransactions(val: Transaction[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(val));
    } catch (e) {
      console.warn('Save transactions error:', e);
    }
  },

  loadPasswords(): OperationPasswords {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      return val ? JSON.parse(val) : DEFAULT_PASSWORDS;
    } catch {
      return DEFAULT_PASSWORDS;
    }
  },

  savePasswords(val: OperationPasswords) {
    try {
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(val));
    } catch (e) {
      console.warn('Save passwords error:', e);
    }
  },

  loadMarketSettings(): MarketSettings {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.MARKET_SETTINGS);
      return val ? JSON.parse(val) : DEFAULT_MARKET_SETTINGS;
    } catch {
      return DEFAULT_MARKET_SETTINGS;
    }
  },

  saveMarketSettings(val: MarketSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.MARKET_SETTINGS, JSON.stringify(val));
    } catch (e) {
      console.warn('Save market settings error:', e);
    }
  },

  loadSyncLogs(): SyncLog[] {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  },

  saveSyncLogs(val: SyncLog[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(val.slice(0, 50)));
    } catch (e) {
      console.warn('Save sync logs error:', e);
    }
  },

  addSyncLog(type: SyncLog['type'], details: string) {
    const logs = this.loadSyncLogs();
    const newLog: SyncLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      type,
      details
    };
    this.saveSyncLogs([newLog, ...logs]);
  },

  loadLastSyncTime(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'NUNCA';
    } catch {
      return 'NUNCA';
    }
  },

  saveLastSyncTime(timeStr: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timeStr);
    } catch (e) {
      console.warn('Save last sync error:', e);
    }
  }
};
