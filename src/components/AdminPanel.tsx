import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Database, Key, Coins, Sliders, Activity, RefreshCw, 
  Plus, Edit, Trash2, Check, AlertCircle, TrendingUp, TrendingDown, Clock, 
  Users, ArrowLeft, Save, Server, Shield, CheckCircle2, Lock, XCircle,
  ArrowUpRight, ArrowDownLeft, ShoppingCart, Banknote, Search, Filter, MessageSquare, Wallet
} from 'lucide-react';
import { Coin, OperationPasswords, MarketSettings, SyncLog, AdminDashboardStats, Transaction } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storage, DEFAULT_PASSWORDS, DEFAULT_MARKET_SETTINGS } from '../lib/storage';

interface AdminPanelProps {
  onBackToWallet?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToWallet }) => {
  // Authentication state for Admin Panel
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminAuthPassword, setAdminAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'wallet_edit' | 'passwords' | 'coins' | 'market' | 'logs'>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Firestore & Admin States
  const [passwords, setPasswords] = useState<OperationPasswords>(DEFAULT_PASSWORDS);
  const [marketSettings, setMarketSettings] = useState<MarketSettings>(DEFAULT_MARKET_SETTINGS);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [adminBalanceInput, setAdminBalanceInput] = useState<number>(6323.00);
  const [adminPortfolioInput, setAdminPortfolioInput] = useState<Record<string, number>>({
    'WMR': 0.02,
    'DKBT': 0.01,
    'NETH': 0.05,
    'QSOL': 1.0,
    'CYBR': 100.0
  });
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalCoins: 0,
    totalWallets: 1,
    lastSyncTimestamp: 'Agora',
    connectedUsers: 3,
    firestoreStatus: 'CONECTADO'
  });

  // Transaction tab filter & search
  const [txTabFilter, setTxTabFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Coin Modal / Form state
  const [isEditingCoin, setIsEditingCoin] = useState<boolean>(false);
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null);
  const [coinForm, setCoinForm] = useState({
    name: '',
    symbol: '',
    price: 10.0,
    variation: 0.0,
    marketCap: 1000000,
    volume: 50000,
    iconName: 'Cpu',
    color: '#00f0ff'
  });

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminData();
    }
  }, [isAdminAuthenticated]);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuthPassword.trim() === '420933') {
      setIsAdminAuthenticated(true);
      setAuthError(null);
      showStatus('Sessão administrativa autenticada!', 'success');
    } else {
      setAuthError('Senha administrativa incorreta! Tente novamente.');
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    let connected = false;

    const fetchWithTimeout = async <T,>(promise: Promise<T>, ms = 3500): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout de conexão')), ms))
      ]);
    };

    try {
      // 1. Passwords
      try {
        const pwdSnap = await fetchWithTimeout(getDoc(doc(db, 'system_passwords/operations')));
        if (pwdSnap.exists()) {
          setPasswords(pwdSnap.data() as OperationPasswords);
          connected = true;
        } else {
          setPasswords(storage.loadPasswords());
        }
      } catch (e) {
        console.warn('Pwd fetch fallback:', e);
        setPasswords(storage.loadPasswords());
      }

      // 2. Market Settings
      try {
        const mktSnap = await fetchWithTimeout(getDoc(doc(db, 'system_config/market')));
        if (mktSnap.exists()) {
          setMarketSettings(mktSnap.data() as MarketSettings);
          connected = true;
        } else {
          setMarketSettings(storage.loadMarketSettings());
        }
      } catch (e) {
        console.warn('Market fetch fallback:', e);
        setMarketSettings(storage.loadMarketSettings());
      }

      // 3. Coins
      try {
        const coinsSnap = await fetchWithTimeout(getDoc(doc(db, 'system_data/coins')));
        if (coinsSnap.exists() && Array.isArray(coinsSnap.data()?.list) && coinsSnap.data()?.list.length > 0) {
          setCoins(coinsSnap.data()?.list);
          connected = true;
        } else {
          setCoins(storage.loadCoins([]));
        }
      } catch (e) {
        console.warn('Coins fetch fallback:', e);
        setCoins(storage.loadCoins([]));
      }

      // 4. Transactions
      try {
        const txSnap = await fetchWithTimeout(getDoc(doc(db, 'system_data/transactions')));
        if (txSnap.exists() && Array.isArray(txSnap.data()?.list)) {
          setTransactions(txSnap.data()?.list);
          connected = true;
        } else {
          setTransactions(storage.loadTransactions([]));
        }
      } catch (e) {
        console.warn('Tx fetch fallback:', e);
        setTransactions(storage.loadTransactions([]));
      }

      // 5. Logs
      setLogs(storage.loadSyncLogs());

      // 6. Stats
      try {
        const statsSnap = await fetchWithTimeout(getDoc(doc(db, 'system_stats/general')));
        if (statsSnap.exists()) {
          setStats(statsSnap.data() as AdminDashboardStats);
          connected = true;
        }
      } catch (e) {
        console.warn('Stats fetch fallback:', e);
      }

      // 7. Wallet State (Balance & Portfolio)
      try {
        const walletSnap = await fetchWithTimeout(getDoc(doc(db, 'wallet_state/main')));
        if (walletSnap.exists()) {
          const wData = walletSnap.data();
          if (typeof wData.balanceFiat === 'number') setAdminBalanceInput(wData.balanceFiat);
          if (wData.portfolio) setAdminPortfolioInput(wData.portfolio);
          connected = true;
        } else {
          setAdminBalanceInput(storage.loadBalance(6323.00));
          setAdminPortfolioInput(storage.loadPortfolio({ 'WMR': 0.02, 'DKBT': 0.01, 'NETH': 0.05, 'QSOL': 1.0, 'CYBR': 100.0 }));
        }
      } catch (e) {
        console.warn('Wallet state fetch fallback:', e);
        setAdminBalanceInput(storage.loadBalance(6323.00));
        setAdminPortfolioInput(storage.loadPortfolio({ 'WMR': 0.02, 'DKBT': 0.01, 'NETH': 0.05, 'QSOL': 1.0, 'CYBR': 100.0 }));
      }

      if (connected) {
        setStats(prev => ({ 
          ...prev, 
          firestoreStatus: 'CONECTADO', 
          lastSyncTimestamp: new Date().toLocaleTimeString('pt-BR') 
        }));
        showStatus('Conectado ao Firebase com sucesso! Dados sincronizados.', 'success');
      } else {
        setStats(prev => ({ ...prev, firestoreStatus: 'DESCONECTADO' }));
        showStatus('Usando cópia local para o Painel Admin', 'info');
      }
    } catch (err) {
      console.warn('Fallback geral:', err);
      showStatus('Usando cópia local para o Painel Admin', 'info');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE PASSWORDS ---
  const handleSavePasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'system_passwords/operations'), passwords);
      storage.savePasswords(passwords);
      storage.addSyncLog('ADMIN_EDIT', 'Senhas de operações atualizadas pelo Administrador.');
      showStatus('Senhas salvas com sucesso no servidor!', 'success');
    } catch (error) {
      console.error(error);
      storage.savePasswords(passwords);
      showStatus('Salvo localmente (erro de conexão)', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE MARKET SETTINGS ---
  const handleSaveMarketSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const updated = {
      ...marketSettings,
      lastUpdated: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'system_config/market'), updated);
      storage.saveMarketSettings(updated);
      storage.addSyncLog('ADMIN_EDIT', `Configurações de oscilação salvas (Preset: ${marketSettings.preset}).`);
      showStatus('Configurações de mercado salvas no servidor!', 'success');
    } catch (error) {
      console.error(error);
      storage.saveMarketSettings(updated);
      showStatus('Salvo localmente (erro no servidor)', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- MANUAL WALLET EDIT HANDLER ---
  const handleSaveWalletManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedAt = new Date().toISOString();
      await setDoc(doc(db, 'wallet_state/main'), {
        balanceFiat: Number(adminBalanceInput),
        portfolio: adminPortfolioInput,
        updatedAt
      });
      storage.saveBalance(Number(adminBalanceInput));
      storage.savePortfolio(adminPortfolioInput);
      storage.addSyncLog('ADMIN_EDIT', `Edição manual: Saldo R$ (${adminBalanceInput}) e Portfólio atualizados pelo Administrador.`);
      showStatus('Dados da carteira (Saldo em R$ e Portfólio) alterados com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      storage.saveBalance(Number(adminBalanceInput));
      storage.savePortfolio(adminPortfolioInput);
      showStatus('Salvo localmente (erro de conexão com o servidor)', 'info');
    } finally {
      setLoading(false);
    }
  };

  // --- TRANSACTION APPROVAL & REJECTION HANDLERS ---
  const handleApproveTransaction = async (txId: string) => {
    setLoading(true);
    try {
      const targetTx = transactions.find(t => t.id === txId);
      if (targetTx && targetTx.status !== 'APROVADO') {
        let currentBalance = adminBalanceInput;
        let currentPortfolio = { ...adminPortfolioInput };

        if (targetTx.type === 'COMPRA') {
          currentBalance = Math.max(0, currentBalance - targetTx.fiatValue);
          currentPortfolio[targetTx.coinSymbol] = parseFloat(((currentPortfolio[targetTx.coinSymbol] || 0) + targetTx.amount).toFixed(6));
        } else if (targetTx.type === 'VENDA') {
          currentPortfolio[targetTx.coinSymbol] = parseFloat(Math.max(0, (currentPortfolio[targetTx.coinSymbol] || 0) - targetTx.amount).toFixed(6));
          currentBalance = parseFloat((currentBalance + targetTx.fiatValue).toFixed(2));
        } else if (targetTx.type === 'ENVIADO') {
          currentPortfolio[targetTx.coinSymbol] = parseFloat(Math.max(0, (currentPortfolio[targetTx.coinSymbol] || 0) - targetTx.amount).toFixed(6));
        } else if (targetTx.type === 'RECEBIDO') {
          currentPortfolio[targetTx.coinSymbol] = parseFloat(((currentPortfolio[targetTx.coinSymbol] || 0) + targetTx.amount).toFixed(6));
        }

        setAdminBalanceInput(currentBalance);
        setAdminPortfolioInput(currentPortfolio);

        await setDoc(doc(db, 'wallet_state/main'), {
          balanceFiat: currentBalance,
          portfolio: currentPortfolio,
          updatedAt: new Date().toISOString()
        });
        storage.saveBalance(currentBalance);
        storage.savePortfolio(currentPortfolio);
      }

      const updated = transactions.map(t => {
        if (t.id === txId) {
          return { ...t, status: 'APROVADO' as const, rejectionReason: undefined };
        }
        return t;
      });
      setTransactions(updated);
      await setDoc(doc(db, 'system_data/transactions'), { list: updated });
      storage.saveTransactions(updated);
      storage.addSyncLog('ADMIN_EDIT', `Transação ${txId} APROVADA e dados processados.`);
      showStatus(`Transação ${txId} APROVADA! Saldo e portfólio da carteira foram atualizados.`, 'success');
    } catch (err) {
      console.error(err);
      showStatus('Erro ao atualizar no servidor. Alteração salva localmente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectModal = (txId: string) => {
    setRejectingTxId(txId);
    setRejectionReasonInput('');
  };

  const handleConfirmRejectTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTxId) return;
    if (!rejectionReasonInput.trim()) {
      alert('Por favor, informe o motivo da recusa.');
      return;
    }

    setLoading(true);
    try {
      const updated = transactions.map(t => {
        if (t.id === rejectingTxId) {
          return {
            ...t,
            status: 'RECUSADO' as const,
            rejectionReason: rejectionReasonInput.trim()
          };
        }
        return t;
      });

      setTransactions(updated);
      await setDoc(doc(db, 'system_data/transactions'), { list: updated });
      storage.saveTransactions(updated);
      storage.addSyncLog('ADMIN_EDIT', `Transação ${rejectingTxId} RECUSADA pelo Administrador. Motivo: ${rejectionReasonInput.trim()}`);
      showStatus(`Transação ${rejectingTxId} RECUSADA! Motivo gravado com sucesso.`, 'info');
      setRejectingTxId(null);
      setRejectionReasonInput('');
    } catch (err) {
      console.error(err);
      showStatus('Erro no servidor. Alteração salva localmente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- COIN MANAGEMENT ---
  const handleOpenAddCoin = () => {
    setEditingCoinId(null);
    setCoinForm({
      name: '',
      symbol: '',
      price: 10.0,
      variation: 0.0,
      marketCap: 1000000,
      volume: 50000,
      iconName: 'Cpu',
      color: '#00f0ff'
    });
    setIsEditingCoin(true);
  };

  const handleOpenEditCoin = (c: Coin) => {
    setEditingCoinId(c.id);
    setCoinForm({
      name: c.name,
      symbol: c.symbol,
      price: c.price,
      variation: c.variation,
      marketCap: c.marketCap,
      volume: c.volume,
      iconName: c.iconName,
      color: c.color
    });
    setIsEditingCoin(true);
  };

  const handleSaveCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinForm.name || !coinForm.symbol) {
      showStatus('Nome e Sigla são obrigatórios', 'error');
      return;
    }

    let updatedList: Coin[];
    if (editingCoinId) {
      updatedList = coins.map(c => c.id === editingCoinId ? {
        ...c,
        name: coinForm.name,
        symbol: coinForm.symbol.toUpperCase(),
        price: Number(coinForm.price),
        variation: Number(coinForm.variation),
        marketCap: Number(coinForm.marketCap),
        volume: Number(coinForm.volume),
        iconName: coinForm.iconName,
        color: coinForm.color
      } : c);
    } else {
      const newCoin: Coin = {
        id: coinForm.symbol.toLowerCase() + '-' + Date.now(),
        name: coinForm.name,
        symbol: coinForm.symbol.toUpperCase(),
        price: Number(coinForm.price),
        variation: Number(coinForm.variation),
        marketCap: Number(coinForm.marketCap),
        volume: Number(coinForm.volume),
        history: [coinForm.price * 0.95, coinForm.price * 0.98, coinForm.price],
        iconName: coinForm.iconName,
        color: coinForm.color
      };
      updatedList = [...coins, newCoin];
    }

    setCoins(updatedList);
    setIsEditingCoin(false);

    setLoading(true);
    try {
      await setDoc(doc(db, 'system_data/coins'), { list: updatedList });
      storage.saveCoins(updatedList);
      storage.addSyncLog('ADMIN_EDIT', `Moeda ${coinForm.symbol.toUpperCase()} atualizada/cadastrada.`);
      showStatus('Moedas sincronizadas no servidor com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      storage.saveCoins(updatedList);
      showStatus('Salvo localmente (erro de conexão com servidor)', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoin = async (id: string, symbol: string) => {
    if (!confirm(`Tem certeza que deseja remover a moeda ${symbol}?`)) return;
    const updated = coins.filter(c => c.id !== id);
    setCoins(updated);
    setLoading(true);
    try {
      await setDoc(doc(db, 'system_data/coins'), { list: updated });
      storage.saveCoins(updated);
      storage.addSyncLog('ADMIN_EDIT', `Moeda ${symbol} excluída.`);
      showStatus(`Moeda ${symbol} removida com sucesso.`, 'success');
    } catch (err) {
      console.error(err);
      storage.saveCoins(updated);
      showStatus('Removido localmente', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Filtered transactions for the Admin tab
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = 
      txTabFilter === 'ALL' ? true :
      txTabFilter === 'PENDING' ? (tx.status === 'PENDENTE' || tx.status === 'SECURED_LOCAL' || tx.status === 'PENDING') :
      txTabFilter === 'APPROVED' ? (tx.status === 'APROVADO' || tx.status === 'SUCCESS') :
      txTabFilter === 'REJECTED' ? tx.status === 'RECUSADO' : true;

    const query = txSearchQuery.toLowerCase().trim();
    const matchesQuery = !query ? true :
      tx.id.toLowerCase().includes(query) ||
      tx.coinSymbol.toLowerCase().includes(query) ||
      tx.address.toLowerCase().includes(query) ||
      tx.type.toLowerCase().includes(query) ||
      (tx.rejectionReason && tx.rejectionReason.toLowerCase().includes(query));

    return matchesFilter && matchesQuery;
  });

  const pendingCount = transactions.filter(t => t.status === 'PENDENTE' || t.status === 'SECURED_LOCAL' || t.status === 'PENDING').length;

  // --- RENDER ADMIN PIN LOCK SCREEN IF UNAUTHENTICATED ---
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#040711] text-slate-100 font-sans flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
        <div className="w-full max-w-md bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/60 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 animate-pulse" />
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-cyan-950/80 border border-cyan-500/40 rounded-2xl text-cyan-400 mb-1 shadow-inner">
              <ShieldCheck className="w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-xl font-black tracking-widest text-cyan-400 font-mono uppercase">
              KALI ADMIN SECURITY LOCK
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Acesso Restrito ao Painel Administrativo. Informe a chave PIN autorizada.
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-cyan-300 mb-1.5 uppercase">
                SENHA ADMINISTRATIVA (PIN MESTRE)
              </label>
              <input
                type="password"
                value={adminAuthPassword}
                onChange={(e) => {
                  setAdminAuthPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder="Digite a senha..."
                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3.5 text-center text-xl font-mono tracking-[0.3em] text-cyan-200 outline-none transition-all shadow-inner"
                autoFocus
                required
              />
              {authError && (
                <p className="text-xs text-rose-400 font-mono text-center font-bold mt-2 animate-bounce flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black font-mono text-sm rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/40 cursor-pointer"
            >
              ACESSAR PAINEL ADMIN
            </button>
          </form>

          {onBackToWallet && (
            <div className="text-center pt-3 border-t border-slate-900">
              <button
                onClick={onBackToWallet}
                className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a Carteira
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950 border-b border-cyan-900/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-cyan-400 flex items-center gap-2">
              KALI ADMIN PORTAL <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded uppercase font-mono">v2.4 Online</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Painel Administrativo do Banco de Dados Cloud</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>

          <button
            onClick={() => {
              setIsAdminAuthenticated(false);
              setAdminAuthPassword('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
            title="Encerrar sessão administrativa"
          >
            <Lock className="w-3.5 h-3.5" /> Bloquear
          </button>
          
          {onBackToWallet && (
            <button
              onClick={onBackToWallet}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all shadow-lg shadow-cyan-900/30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para Carteira
            </button>
          )}
        </div>
      </header>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className={`px-6 py-2.5 text-xs font-mono flex items-center justify-between border-b ${
          statusMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800' :
          statusMessage.type === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-800' :
          'bg-cyan-950/90 text-cyan-300 border-cyan-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage.text}</span>
          </div>
          <span className="text-[10px] opacity-75">{new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar Menu */}
        <aside className="md:col-span-1 space-y-2">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-lg space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 px-3 py-1 mb-1">Módulos Administrativos</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              Painel Geral (Dashboard)
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'transactions' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Aprovação de Transações</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wallet_edit')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'wallet_edit' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Wallet className="w-4 h-4 text-cyan-400" />
              Edição Manual da Carteira
            </button>

            <button
              onClick={() => setActiveTab('passwords')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'passwords' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              Configurar Senhas
            </button>

            <button
              onClick={() => setActiveTab('coins')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'coins' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              Cadastrar / Editar Moedas
            </button>

            <button
              onClick={() => setActiveTab('market')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'market' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              Oscilação & Mercado
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'logs' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-400" />
              Histórico & Auditoria
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="text-slate-400 font-bold flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" /> Status do Servidor
            </div>
            <div className="text-[11px] space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Servidor Cloud:</span>
                <span className="text-emerald-400 font-bold">CONECTADO</span>
              </div>
              <div className="flex justify-between">
                <span>Sincronia:</span>
                <span className="text-cyan-400">Automática</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Tab Contents */}
        <main className="md:col-span-3 space-y-6">

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Quantidade de Moedas</div>
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono">{coins.length}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">Cadastradas no Servidor</div>
                  <Coins className="absolute right-4 bottom-4 w-10 h-10 text-cyan-950 group-hover:text-cyan-900/40 transition-all" />
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Transações Totais</div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">{transactions.length}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">{pendingCount} Pendentes de Aprovação</div>
                  <Activity className="absolute right-4 bottom-4 w-10 h-10 text-emerald-950 group-hover:text-emerald-900/40 transition-all" />
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Status do Servidor</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    {stats.firestoreStatus}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">Banco de Dados Ativo</div>
                  <Database className="absolute right-4 bottom-4 w-10 h-10 text-emerald-950 group-hover:text-emerald-900/40 transition-all" />
                </div>
              </div>

              {/* Admin Quick Overview Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Shield className="w-5 h-5 text-cyan-400" /> Resumo de Operações e Parâmetros
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-bold mb-1">Senhas das Operações do Usuário:</div>
                    <div className="text-slate-200">🟢 Comprar: <span className="text-cyan-400 font-bold">{passwords.buy}</span></div>
                    <div className="text-slate-200">🔴 Vender: <span className="text-cyan-400 font-bold">{passwords.sell}</span></div>
                    <div className="text-slate-200">🟢 Receber: <span className="text-cyan-400 font-bold">{passwords.receive}</span></div>
                    <div className="text-slate-200">🔴 Enviar: <span className="text-cyan-400 font-bold">{passwords.send}</span></div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-bold mb-1">Controle Automático do Mercado:</div>
                    <div className="text-slate-200">Preset Atual: <span className="text-purple-400 font-bold">{marketSettings.preset}</span></div>
                    <div className="text-slate-200">Intervalo de Atualização: <span className="text-cyan-400">{marketSettings.intervalSeconds}s</span></div>
                    <div className="text-slate-200">Variação Max: <span className="text-emerald-400">+{marketSettings.maxUpPercent}%</span> / <span className="text-rose-400">-{marketSettings.maxDownPercent}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APROVAÇÃO DE TRANSAÇÕES */}
          {activeTab === 'transactions' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Aprovação e Recusa de Transações
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Gerencie todas as ordens da carteira. Aceite ou recuse transações e grave o motivo das recusas.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      placeholder="Buscar por ID, destino..."
                      className="bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-slate-200 outline-none focus:border-cyan-500 w-48 text-xs"
                    />
                  </div>

                  <div className="flex bg-slate-950 border border-slate-800 rounded overflow-hidden">
                    <button
                      onClick={() => setTxTabFilter('ALL')}
                      className={`px-3 py-1.5 transition-colors cursor-pointer ${txTabFilter === 'ALL' ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-400'}`}
                    >
                      Todas ({transactions.length})
                    </button>
                    <button
                      onClick={() => setTxTabFilter('PENDING')}
                      className={`px-3 py-1.5 transition-colors cursor-pointer ${txTabFilter === 'PENDING' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-slate-400'}`}
                    >
                      Pendentes ({pendingCount})
                    </button>
                    <button
                      onClick={() => setTxTabFilter('APPROVED')}
                      className={`px-3 py-1.5 transition-colors cursor-pointer ${txTabFilter === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-400'}`}
                    >
                      Aprovadas
                    </button>
                    <button
                      onClick={() => setTxTabFilter('REJECTED')}
                      className={`px-3 py-1.5 transition-colors cursor-pointer ${txTabFilter === 'REJECTED' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-slate-400'}`}
                    >
                      Recusadas
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                  Nenhuma transação encontrada com os filtros selecionados.
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {filteredTransactions.map((tx) => {
                    const isPending = tx.status === 'PENDENTE' || tx.status === 'SECURED_LOCAL' || tx.status === 'PENDING';
                    const isApproved = tx.status === 'APROVADO' || tx.status === 'SUCCESS';
                    const isRejected = tx.status === 'RECUSADO';

                    return (
                      <div 
                        key={tx.id} 
                        className={`bg-slate-950 border rounded-xl p-4 space-y-3 transition-all ${
                          isPending ? 'border-amber-500/40 shadow-lg shadow-amber-950/10' :
                          isApproved ? 'border-emerald-500/30' : 'border-rose-500/30'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg font-bold text-xs ${
                              tx.type === 'ENVIADO' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                              tx.type === 'RECEBIDO' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              tx.type === 'COMPRA' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                              'bg-purple-950 text-purple-400 border border-purple-800'
                            }`}>
                              {tx.type === 'ENVIADO' && <ArrowUpRight className="w-4 h-4 inline mr-1" />}
                              {tx.type === 'RECEBIDO' && <ArrowDownLeft className="w-4 h-4 inline mr-1" />}
                              {tx.type === 'COMPRA' && <ShoppingCart className="w-4 h-4 inline mr-1" />}
                              {tx.type === 'VENDA' && <Banknote className="w-4 h-4 inline mr-1" />}
                              {tx.type}
                            </div>

                            <div>
                              <div className="text-sm font-black text-slate-100">
                                {tx.amount} {tx.coinSymbol} <span className="text-slate-400 font-normal text-xs">(R$ {tx.fiatValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})})</span>
                              </div>
                              <div className="text-[10px] text-slate-500">ID: {tx.id} • {tx.timestamp}</div>
                            </div>
                          </div>

                          {/* Status Badge & Actions */}
                          <div className="flex items-center gap-3">
                            {isApproved && (
                              <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold rounded-full text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> APROVADA
                              </span>
                            )}

                            {isRejected && (
                              <span className="px-3 py-1 bg-rose-950/80 border border-rose-500/40 text-rose-400 font-bold rounded-full text-[11px] flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> RECUSADA
                              </span>
                            )}

                            {isPending && (
                              <span className="px-3 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-400 font-bold rounded-full text-[11px] flex items-center gap-1 animate-pulse">
                                <Clock className="w-3.5 h-3.5" /> PENDENTE
                              </span>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              {!isApproved && (
                                <button
                                  onClick={() => handleApproveTransaction(tx.id)}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shadow"
                                >
                                  <Check className="w-3.5 h-3.5" /> Aceitar
                                </button>
                              )}

                              {!isRejected && (
                                <button
                                  onClick={() => handleOpenRejectModal(tx.id)}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shadow"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Recusar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Transaction details & Destino */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 text-[10px] block font-bold uppercase">Destino:</span>
                            <span className="text-cyan-300 font-bold break-all">{tx.address}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block font-bold uppercase">Instituição Bancária:</span>
                            <span className="text-slate-300 font-bold">{tx.bankName || 'KALI BANK NETWORK'}</span>
                          </div>
                        </div>

                        {/* Rejection Reason display if present */}
                        {tx.rejectionReason && (
                          <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-lg text-rose-300 text-xs flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold block uppercase text-[10px] text-rose-400">Motivo da Recusa Registrado pelo Admin:</span>
                              <span className="italic">{tx.rejectionReason}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: EDIÇÃO MANUAL DA CARTEIRA */}
          {activeTab === 'wallet_edit' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-cyan-400" /> Edição Manual da Carteira
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Área exclusiva do Administrador para alterar manualmente qualquer saldo ou ativo na carteira do usuário.
                </p>
              </div>

              <form onSubmit={handleSaveWalletManual} className="space-y-6 max-w-2xl font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="block text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                    Saldo Total Fiat (R$):
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={adminBalanceInput}
                      onChange={(e) => setAdminBalanceInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-slate-100 font-bold text-base outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <label className="block text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                    Saldos do Portfólio de Criptomoedas:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coins.map((coin) => (
                      <div key={coin.symbol} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center text-slate-300 font-bold">
                          <span>{coin.name} ({coin.symbol})</span>
                          <span className="text-[10px] text-slate-500">Cot: US$ {coin.price}</span>
                        </div>
                        <input
                          type="number"
                          step="0.000001"
                          value={adminPortfolioInput[coin.symbol] !== undefined ? adminPortfolioInput[coin.symbol] : 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setAdminPortfolioInput(prev => ({ ...prev, [coin.symbol]: val }));
                          }}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-slate-100 font-bold outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-black rounded-lg uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/40 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salvar Alterações na Carteira
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CONFIGURAR SENHAS */}
          {activeTab === 'passwords' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" /> Senhas de Autorização das Operações
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Defina as senhas necessárias para os usuários realizarem transações. Estas senhas são salvas no servidor e verificadas em tempo real.
                </p>
              </div>

              <form onSubmit={handleSavePasswords} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-emerald-400 mb-1.5 font-bold">
                      Senha para COMPRAR
                    </label>
                    <input
                      type="text"
                      value={passwords.buy}
                      onChange={(e) => setPasswords({ ...passwords, buy: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-rose-400 mb-1.5 font-bold">
                      Senha para VENDER
                    </label>
                    <input
                      type="text"
                      value={passwords.sell}
                      onChange={(e) => setPasswords({ ...passwords, sell: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-cyan-400 mb-1.5 font-bold">
                      Senha para RECEBER
                    </label>
                    <input
                      type="text"
                      value={passwords.receive}
                      onChange={(e) => setPasswords({ ...passwords, receive: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-purple-400 mb-1.5 font-bold">
                      Senha para ENVIAR
                    </label>
                    <input
                      type="text"
                      value={passwords.send}
                      onChange={(e) => setPasswords({ ...passwords, send: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Salvar Senhas no Servidor
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: CADASTRAR & EDITAR MOEDAS */}
          {activeTab === 'coins' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-400" /> Cadastrar & Editar Criptomoedas
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Gerencie as moedas disponíveis na carteira e sincronizadas no servidor.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddCoin}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Nova Moeda
                </button>
              </div>

              {/* Form Modal/Section */}
              {isEditingCoin && (
                <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/40 space-y-4">
                  <h4 className="text-sm font-bold text-cyan-400 font-mono uppercase">
                    {editingCoinId ? 'Editar Moeda Existente' : 'Cadastrar Nova Moeda'}
                  </h4>

                  <form onSubmit={handleSaveCoin} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <label className="block text-slate-300 mb-1">Nome da Moeda:</label>
                      <input
                        type="text"
                        value={coinForm.name}
                        onChange={(e) => setCoinForm({ ...coinForm, name: e.target.value })}
                        placeholder="Ex: Bitcoin"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Sigla (Symbol):</label>
                      <input
                        type="text"
                        value={coinForm.symbol}
                        onChange={(e) => setCoinForm({ ...coinForm, symbol: e.target.value })}
                        placeholder="Ex: BTC"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Preço Inicial (USD):</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={coinForm.price}
                        onChange={(e) => setCoinForm({ ...coinForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Variação 24h (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={coinForm.variation}
                        onChange={(e) => setCoinForm({ ...coinForm, variation: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Cor Hexadecimal:</label>
                      <input
                        type="color"
                        value={coinForm.color}
                        onChange={(e) => setCoinForm({ ...coinForm, color: e.target.value })}
                        className="w-full h-9 bg-slate-900 border border-slate-700 rounded p-1 cursor-pointer"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingCoin(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded font-mono"
                      >
                        Salvar Moeda
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Coins List Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="p-3">Moeda</th>
                      <th className="p-3">Sigla</th>
                      <th className="p-3">Preço USD</th>
                      <th className="p-3">Variação</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {coins.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </td>
                        <td className="p-3 text-cyan-400 font-bold">{c.symbol}</td>
                        <td className="p-3 text-slate-200 font-bold">
                          US$ {c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>
                        <td className={`p-3 font-bold ${c.variation >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {c.variation >= 0 ? '+' : ''}{c.variation}%
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditCoin(c)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoin(c.id, c.symbol)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: OSCILAÇÃO AUTOMÁTICA & MERCADO */}
          {activeTab === 'market' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" /> Controle de Oscilação Automática do Mercado
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Configure o comportamento dos preços das criptomoedas na rede.
                </p>
              </div>

              <form onSubmit={handleSaveMarketSettings} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-xs font-mono text-purple-300 mb-2 font-bold">
                    Preset de Tendência do Mercado:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(['Alta forte', 'Alta moderada', 'Neutro', 'Baixa moderada', 'Baixa forte', 'Aleatório'] as const).map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setMarketSettings({ ...marketSettings, preset })}
                        className={`px-3 py-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                          marketSettings.preset === preset 
                            ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold shadow-md' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold">Tempo entre Oscilações:</label>
                    <select
                      value={marketSettings.intervalSeconds}
                      onChange={(e) => setMarketSettings({ ...marketSettings, intervalSeconds: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={10}>10 Segundos</option>
                      <option value={30}>30 Segundos</option>
                      <option value={60}>1 Minuto</option>
                      <option value={300}>5 Minutos</option>
                      <option value={900}>15 Minutos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-emerald-400 mb-1 font-bold">% Máxima de Subida por Ciclo:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={marketSettings.maxUpPercent}
                      onChange={(e) => setMarketSettings({ ...marketSettings, maxUpPercent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-400 mb-1 font-bold">% Máxima de Queda por Ciclo:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={marketSettings.maxDownPercent}
                      onChange={(e) => setMarketSettings({ ...marketSettings, maxDownPercent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-mono text-emerald-400 font-bold">
                    Liberação de Atualização da Versão da Carteira (index.html Offline):
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setMarketSettings({ ...marketSettings, updateAvailable: !marketSettings.updateAvailable })}
                      className={`px-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                        marketSettings.updateAvailable 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/50' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${marketSettings.updateAvailable ? 'text-emerald-400 animate-spin' : ''}`} />
                      {marketSettings.updateAvailable ? 'LIBERADO (Botão "Atualizar Versão" Ativo no Header)' : 'BLOQUEADO (Botão Inativo)'}
                    </button>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Quando ativado pelo Admin, o usuário poderá clicar no botão de atualização da versão na carteira para atualizar localmente a versão do arquivo index.html.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Salvar Parâmetros no Servidor
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: HISTÓRICO & AUDITORIA */}
          {activeTab === 'logs' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-5 h-5 text-blue-400" /> Logs de Sincronização & Auditoria do Sistema
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {logs.length === 0 ? (
                  <div className="text-slate-500 py-6 text-center">Nenhum evento registrado ainda.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-start justify-between gap-4">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded mr-2 ${
                          log.type === 'DOWNLOAD' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                          log.type === 'UPLOAD' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          'bg-purple-950 text-purple-400 border border-purple-800'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-slate-300">{log.details}</span>
                      </div>
                      <span className="text-slate-500 text-[10px] whitespace-nowrap">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL REJEITAR TRANSAÇÃO COM MOTIVO */}
      {rejectingTxId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border-2 border-rose-500/60 p-6 rounded-xl shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" /> Recusar Transação {rejectingTxId}
              </h3>
              <button 
                onClick={() => setRejectingTxId(null)}
                className="text-slate-500 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300">
              Por favor, informe o motivo do indeferimento/recusa desta transação. O motivo será exibido no histórico do usuário.
            </p>

            <form onSubmit={handleConfirmRejectTransaction} className="space-y-4">
              <div>
                <label className="block text-rose-400 font-bold mb-1 uppercase text-[10px]">
                  Motivo da Recusa:
                </label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ex: Chave PIX inválida, suspeita de fraude, divergência de titularidade..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-rose-400 rounded-lg p-3 text-slate-100 outline-none text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingTxId(null)}
                  className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer shadow-lg"
                >
                  Confirmar Recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
