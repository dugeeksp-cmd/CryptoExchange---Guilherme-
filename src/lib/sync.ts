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

  try {
    // 1. Fetch Passwords
    const pwdRef = doc(db, PATHS.PASSWORDS);
    const pwdSnap = await getDoc(pwdRef);
    if (pwdSnap.exists()) {
      passwords = pwdSnap.data() as OperationPasswords;
    } else {
      await setDoc(pwdRef, DEFAULT_PASSWORDS);
      passwords = DEFAULT_PASSWORDS;
    }

    // 2. Fetch Market Settings
    const mktRef = doc(db, PATHS.MARKET_CONFIG);
    const mktSnap = await getDoc(mktRef);
    if (mktSnap.exists()) {
      marketSettings = mktSnap.data() as MarketSettings;
    } else {
      await setDoc(mktRef, DEFAULT_MARKET_SETTINGS);
      marketSettings = DEFAULT_MARKET_SETTINGS;
    }

    // 3. Fetch Coins
    const coinsRef = doc(db, PATHS.COINS);
    const coinsSnap = await getDoc(coinsRef);
    if (coinsSnap.exists() && Array.isArray(coinsSnap.data()?.list)) {
      coins = coinsSnap.data()?.list as Coin[];
    } else {
      await setDoc(coinsRef, { list: localCoins });
    }

    // 4. Fetch Wallet State & Transactions
    const walletRef = doc(db, PATHS.WALLET_STATE);
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
      const data = walletSnap.data();
      if (typeof data.balanceFiat === 'number') balanceFiat = data.balanceFiat;
      if (data.portfolio) portfolio = data.portfolio;
    } else {
      await setDoc(walletRef, { balanceFiat: localBalance, portfolio: localPortfolio, updatedAt: new Date().toISOString() });
    }

    const txRef = doc(db, PATHS.TRANSACTIONS);
    const txSnap = await getDoc(txRef);
    if (txSnap.exists() && Array.isArray(txSnap.data()?.list)) {
      transactions = txSnap.data()?.list as Transaction[];
    } else {
      await setDoc(txRef, { list: localTransactions });
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
    storage.addSyncLog('DOWNLOAD', 'Download completo do Firestore realizado.');

    // Update admin stats
    await updateAdminStats(coins.length, nowStr);

    return {
      passwords,
      marketSettings,
      coins,
      transactions,
      balanceFiat,
      portfolio,
      lastSyncTimestamp: nowStr
    };
  } catch (error) {
    console.error('Erro no download do Firestore:', error);
    throw error;
  }
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
    });

    await setDoc(doc(db, PATHS.COINS), { list: coins });
    await setDoc(doc(db, PATHS.TRANSACTIONS), { list: transactions });

    if (passwords) {
      await setDoc(doc(db, PATHS.PASSWORDS), passwords);
      storage.savePasswords(passwords);
    }
    if (marketSettings) {
      await setDoc(doc(db, PATHS.MARKET_CONFIG), marketSettings);
      storage.saveMarketSettings(marketSettings);
    }

    storage.saveCoins(coins);
    storage.saveTransactions(transactions);
    storage.saveBalance(balanceFiat);
    storage.savePortfolio(portfolio);
    storage.saveLastSyncTime(nowStr);
    storage.addSyncLog('UPLOAD', 'Upload de dados para o Firestore realizado com sucesso.');

    await updateAdminStats(coins.length, nowStr);

    return nowStr;
  } catch (error) {
    console.error('Erro no upload para o Firestore:', error);
    throw error;
  }
}

/**
 * Verifies operation password against Firestore.
 * Flow:
 * 1. Read passwords from Firestore `system_passwords/operations`
 * 2. If firestore document exists, check `password[opType]`
 * 3. Returns true if match, false otherwise.
 */
export async function verifyPasswordInFirestore(
  opType: 'buy' | 'sell' | 'receive' | 'send',
  inputPassword: string
): Promise<boolean> {
  try {
    const pwdRef = doc(db, PATHS.PASSWORDS);
    const pwdSnap = await getDocFromServer(pwdRef);
    if (pwdSnap.exists()) {
      const data = pwdSnap.data() as OperationPasswords;
      const expected = data[opType] || '1234';
      return inputPassword.trim() === expected.trim();
    } else {
      // Fallback to local stored password if doc doesn't exist yet
      const localPwd = storage.loadPasswords();
      return inputPassword.trim() === (localPwd[opType] || '1234').trim();
    }
  } catch (error) {
    console.error('Erro ao verificar senha no Firestore:', error);
    // If offline or error, try local storage fallback
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
