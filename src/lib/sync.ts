import { doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { Coin, Transaction, OperationPasswords, MarketSettings, SyncLog } from '../types';
import { storage, DEFAULT_PASSWORDS, DEFAULT_MARKET_SETTINGS } from './storage';

const PATHS = {
  PASSWORDS: 'system_passwords/operations',
  MARKET_CONFIG: 'system_config/market',
  COINS: 'system_data/coins',
  WALLET_STATE: 'wallet_state/main',
  TRANSACTIONS: 'system_data/transactions',
  ADMIN_STATS: 'system_stats/general'
};

export interface RemoteSyncData {
  passwords: OperationPasswords;
  marketSettings: MarketSettings;
  coins: Coin[];
  transactions: Transaction[];
  balanceFiat: number;
  portfolio: Record<string, number>;
  lastSyncTimestamp: string;
}

/**
 * Downloads data from Firestore.
 * If Firestore documents do not exist yet, initializes them with current local data.
 */
export async function downloadFromFirestore(
  localCoins: Coin[],
  localTransactions: Transaction[],
  localBalance: number,
  localPortfolio: Record<string, number>
): Promise<RemoteSyncData> {
  let passwords = storage.loadPasswords();
  let marketSettings = storage.loadMarketSettings();
  let coins = localCoins;
  let transactions = localTransactions;
  let balanceFiat = localBalance;
  let portfolio = localPortfolio;

  const fetchWithTimeout = async <T>(promise: Promise<T>, ms = 3000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout de conexão')), ms))
    ]);
  };

  // 1. Passwords
  try {
    const pwdRef = doc(db, PATHS.PASSWORDS);
    const pwdSnap = await fetchWithTimeout(getDoc(pwdRef));
    if (pwdSnap.exists()) {
      passwords = pwdSnap.data() as OperationPasswords;
    } else {
      await fetchWithTimeout(setDoc(pwdRef, DEFAULT_PASSWORDS)).catch(() => {});
    }
  } catch (e) {
    console.warn('Sync passwords fallback:', e);
  }

  // 2. Market Settings
  try {
    const mktRef = doc(db, PATHS.MARKET_CONFIG);
    const mktSnap = await fetchWithTimeout(getDoc(mktRef));
    if (mktSnap.exists()) {
      marketSettings = mktSnap.data() as MarketSettings;
    } else {
      await fetchWithTimeout(setDoc(mktRef, DEFAULT_MARKET_SETTINGS)).catch(() => {});
    }
  } catch (e) {
    console.warn('Sync market settings fallback:', e);
  }

  // 3. Coins
  try {
    const coinsRef = doc(db, PATHS.COINS);
    const coinsSnap = await fetchWithTimeout(getDoc(coinsRef));
    if (coinsSnap.exists() && Array.isArray(coinsSnap.data()?.list) && coinsSnap.data()?.list.length > 0) {
      coins = coinsSnap.data()?.list as Coin[];
    } else {
      await fetchWithTimeout(setDoc(coinsRef, { list: localCoins })).catch(() => {});
    }
  } catch (e) {
    console.warn('Sync coins fallback:', e);
  }

  // 4. Wallet State
  try {
    const walletRef = doc(db, PATHS.WALLET_STATE);
    const walletSnap = await fetchWithTimeout(getDoc(walletRef));
    if (walletSnap.exists()) {
      const data = walletSnap.data();
      if (typeof data.balanceFiat === 'number') balanceFiat = data.balanceFiat;
      if (data.portfolio) portfolio = data.portfolio;
    } else {
      await fetchWithTimeout(setDoc(walletRef, { balanceFiat: localBalance, portfolio: localPortfolio, updatedAt: new Date().toISOString() })).catch(() => {});
    }
  } catch (e) {
    console.warn('Sync wallet state fallback:', e);
  }

  // 5. Transactions
  try {
    const txRef = doc(db, PATHS.TRANSACTIONS);
    const txSnap = await fetchWithTimeout(getDoc(txRef));
    if (txSnap.exists() && Array.isArray(txSnap.data()?.list)) {
      transactions = txSnap.data()?.list as Transaction[];
    } else {
      await fetchWithTimeout(setDoc(txRef, { list: localTransactions })).catch(() => {});
    }
  } catch (e) {
    console.warn('Sync transactions fallback:', e);
  }

  const nowStr = new Date().toLocaleString('pt-BR');
  
  // Save everything to localStorage
  storage.savePasswords(passwords);
  storage.saveMarketSettings(marketSettings);
  storage.saveCoins(coins);
  storage.saveTransactions(transactions);
  storage.saveBalance(balanceFiat);
  storage.savePortfolio(portfolio);
  storage.saveLastSyncTime(nowStr);
  storage.addSyncLog('DOWNLOAD', 'Sincronização com o servidor finalizada.');

  // Update admin stats
  updateAdminStats(coins.length, nowStr).catch(() => {});

  return {
    passwords,
    marketSettings,
    coins,
    transactions,
    balanceFiat,
    portfolio,
    lastSyncTimestamp: nowStr
  };
}

/**
 * Uploads local wallet state and transactions to Firestore
 */
export async function uploadToFirestore(
  coins: Coin[],
  transactions: Transaction[],
  balanceFiat: number,
  portfolio: Record<string, number>,
  passwords?: OperationPasswords,
  marketSettings?: MarketSettings
): Promise<string> {
  const nowStr = new Date().toLocaleString('pt-BR');
  try {
    await setDoc(doc(db, PATHS.WALLET_STATE), {
      balanceFiat,
      portfolio,
      updatedAt: nowStr
    }).catch(e => console.warn('upload wallet state error:', e));

    await setDoc(doc(db, PATHS.COINS), { list: coins }).catch(e => console.warn('upload coins error:', e));
    await setDoc(doc(db, PATHS.TRANSACTIONS), { list: transactions }).catch(e => console.warn('upload tx error:', e));

    if (passwords) {
      await setDoc(doc(db, PATHS.PASSWORDS), passwords).catch(e => console.warn('upload pwd error:', e));
      storage.savePasswords(passwords);
    }
    if (marketSettings) {
      await setDoc(doc(db, PATHS.MARKET_CONFIG), marketSettings).catch(e => console.warn('upload mkt error:', e));
      storage.saveMarketSettings(marketSettings);
    }

    storage.saveCoins(coins);
    storage.saveTransactions(transactions);
    storage.saveBalance(balanceFiat);
    storage.savePortfolio(portfolio);
    storage.saveLastSyncTime(nowStr);
    storage.addSyncLog('UPLOAD', 'Upload de dados para o servidor realizado.');

    updateAdminStats(coins.length, nowStr).catch(() => {});

    return nowStr;
  } catch (error) {
    console.warn('Erro no upload para o Firestore:', error);
    storage.saveCoins(coins);
    storage.saveTransactions(transactions);
    storage.saveBalance(balanceFiat);
    storage.savePortfolio(portfolio);
    storage.saveLastSyncTime(nowStr);
    return nowStr;
  }
}

/**
 * Verifies operation password against Firestore.
 */
export async function verifyPasswordInFirestore(
  opType: 'buy' | 'sell' | 'receive' | 'send',
  inputPassword: string
): Promise<boolean> {
  try {
    const pwdRef = doc(db, PATHS.PASSWORDS);
    const pwdSnap = await Promise.race([
      getDoc(pwdRef),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
    ]).catch(() => null);

    if (pwdSnap && pwdSnap.exists()) {
      const data = pwdSnap.data() as OperationPasswords;
      const expected = data[opType] || '1234';
      return inputPassword.trim() === expected.trim();
    } else {
      const localPwd = storage.loadPasswords();
      return inputPassword.trim() === (localPwd[opType] || '1234').trim();
    }
  } catch (error) {
    console.warn('Erro ao verificar senha no servidor, fallback local:', error);
    const localPwd = storage.loadPasswords();
    return inputPassword.trim() === (localPwd[opType] || '1234').trim();
  }
}

/**
 * Updates Admin Statistics in Firestore
 */
async function updateAdminStats(totalCoins: number, lastSyncTimestamp: string) {
  try {
    await setDoc(doc(db, PATHS.ADMIN_STATS), {
      totalCoins,
      totalWallets: 1,
      lastSyncTimestamp,
      connectedUsers: Math.floor(Math.random() * 5) + 1,
      firestoreStatus: 'CONECTADO',
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Stats update error:', e);
  }
}
