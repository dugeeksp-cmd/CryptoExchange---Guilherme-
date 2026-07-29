import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Database, Key, Coins, Sliders, Activity, RefreshCw, 
  Plus, Edit, Trash2, Check, AlertCircle, TrendingUp, TrendingDown, Clock, 
  Users, ArrowLeft, Save, Server, Shield, CheckCircle2
} from 'lucide-react';
import { Coin, OperationPasswords, MarketSettings, SyncLog, AdminDashboardStats } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storage, DEFAULT_PASSWORDS, DEFAULT_MARKET_SETTINGS } from '../lib/storage';

interface AdminPanelProps {
  onBackToWallet?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToWallet }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'passwords' | 'coins' | 'market' | 'logs'>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Firestore & Admin States
  const [passwords, setPasswords] = useState<OperationPasswords>(DEFAULT_PASSWORDS);
  const [marketSettings, setMarketSettings] = useState<MarketSettings>(DEFAULT_MARKET_SETTINGS);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalCoins: 0,
    totalWallets: 1,
    lastSyncTimestamp: 'Agora',
    connectedUsers: 3,
    firestoreStatus: 'CONECTADO'
  });

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
    loadAdminData();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Passwords
      const pwdSnap = await getDoc(doc(db, 'system_passwords/operations'));
      if (pwdSnap.exists()) {
        setPasswords(pwdSnap.data() as OperationPasswords);
      } else {
        setPasswords(storage.loadPasswords());
      }

      // 2. Market Settings
      const mktSnap = await getDoc(doc(db, 'system_config/market'));
      if (mktSnap.exists()) {
        setMarketSettings(mktSnap.data() as MarketSettings);
      } else {
        setMarketSettings(storage.loadMarketSettings());
      }

      // 3. Coins
      const coinsSnap = await getDoc(doc(db, 'system_data/coins'));
      if (coinsSnap.exists() && Array.isArray(coinsSnap.data()?.list)) {
        setCoins(coinsSnap.data()?.list);
      } else {
        setCoins(storage.loadCoins([]));
      }

      // 4. Logs
      setLogs(storage.loadSyncLogs());

      // 5. Stats
      const statsSnap = await getDoc(doc(db, 'system_stats/general'));
      if (statsSnap.exists()) {
        setStats(statsSnap.data() as AdminDashboardStats);
      }

      showStatus('Dados administrativos carregados do Firestore com sucesso!', 'info');
    } catch (err) {
      console.warn('Fallback para dados locais:', err);
      setPasswords(storage.loadPasswords());
      setMarketSettings(storage.loadMarketSettings());
      setCoins(storage.loadCoins([]));
      setLogs(storage.loadSyncLogs());
      showStatus('Usando cópia local para o Painel Admin (offline/erro no Firestore)', 'info');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE PASSWORDS TO FIRESTORE ---
  const handleSavePasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'system_passwords/operations'), passwords);
      storage.savePasswords(passwords);
      storage.addSyncLog('ADMIN_EDIT', 'Senhas de operações (Comprar/Vender/Receber/Enviar) atualizadas no Firestore.');
      showStatus('Senhas salvas com sucesso no Firestore!', 'success');
    } catch (error) {
      console.error(error);
      storage.savePasswords(passwords);
      showStatus('Salvo localmente (erro de conexão com Firestore)', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE MARKET SETTINGS TO FIRESTORE ---
  const handleSaveMarketSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = {
        ...marketSettings,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(doc(db, 'system_config/market'), updated);
      storage.saveMarketSettings(updated);
      storage.addSyncLog('ADMIN_EDIT', `Configurações de oscilação salvas (Preset: ${marketSettings.preset}).`);
      showStatus('Configurações de mercado salvas no Firestore!', 'success');
    } catch (error) {
      console.error(error);
      storage.saveMarketSettings(marketSettings);
      showStatus('Salvo localmente (erro no Firestore)', 'error');
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
      storage.addSyncLog('ADMIN_EDIT', `Moeda ${coinForm.symbol.toUpperCase()} atualizada/cadastrada no Firestore.`);
      showStatus('Moedas sincronizadas no Firestore com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      storage.saveCoins(updatedList);
      showStatus('Salvo localmente (erro de conexão com Firestore)', 'error');
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
            Recarregar Dados
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-lg">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 px-3 py-1 mb-2">Módulos Administrativos</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              Painel Geral (Dashboard)
            </button>

            <button
              onClick={() => setActiveTab('passwords')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'passwords' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Key className="w-4 h-4 text-amber-400" />
              Configurar Senhas
            </button>

            <button
              onClick={() => setActiveTab('coins')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'coins' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              Cadastrar / Editar Moedas
            </button>

            <button
              onClick={() => setActiveTab('market')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'market' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              Oscilação & Mercado
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'logs' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Carteiras Conectadas</div>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">{stats.totalWallets}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">Sincronizadas com o banco</div>
                  <Users className="absolute right-4 bottom-4 w-10 h-10 text-emerald-950 group-hover:text-emerald-900/40 transition-all" />
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Status do Servidor</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    {stats.firestoreStatus}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">Regiões Ativas</div>
                  <Database className="absolute right-4 bottom-4 w-10 h-10 text-emerald-950 group-hover:text-emerald-900/40 transition-all" />
                </div>
              </div>

              {/* Admin Quick Overview Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Shield className="w-5 h-5 text-cyan-400" /> Resumo do Servidor Cloud
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-slate-400">Segurança de Operações (Senhas):</div>
                    <div className="text-slate-200">🟢 Comprar: <span className="text-cyan-400 font-bold">{passwords.buy}</span></div>
                    <div className="text-slate-200">🔴 Vender: <span className="text-cyan-400 font-bold">{passwords.sell}</span></div>
                    <div className="text-slate-200">🟢 Receber: <span className="text-cyan-400 font-bold">{passwords.receive}</span></div>
                    <div className="text-slate-200">🔴 Enviar: <span className="text-cyan-400 font-bold">{passwords.send}</span></div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-slate-400">Controle Automático do Mercado:</div>
                    <div className="text-slate-200">Preset Atual: <span className="text-purple-400 font-bold">{marketSettings.preset}</span></div>
                    <div className="text-slate-200">Intervalo de Atualização: <span className="text-cyan-400">{marketSettings.intervalSeconds}s</span></div>
                    <div className="text-slate-200">Variação Max: <span className="text-emerald-400">+{marketSettings.maxUpPercent}%</span> / <span className="text-rose-400">-{marketSettings.maxDownPercent}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURAR SENHAS */}
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

          {/* TAB 3: CONFIGURAR MOEDAS */}
          {activeTab === 'coins' && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
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
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all shadow-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Nova Moeda
                  </button>
                </div>

                {/* Coin Form Modal / Box */}
                {isEditingCoin && (
                  <form onSubmit={handleSaveCoin} className="bg-slate-950 border border-cyan-800/60 p-5 rounded-xl space-y-4 animate-in fade-in duration-200">
                    <div className="text-sm font-bold text-cyan-400 font-mono border-b border-slate-800 pb-2">
                      {editingCoinId ? 'EDITAR MOEDA' : 'CADASTRAR NOVA MOEDA'}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <label className="block text-slate-400 mb-1">Nome da Moeda:</label>
                        <input
                          type="text"
                          value={coinForm.name}
                          onChange={(e) => setCoinForm({ ...coinForm, name: e.target.value })}
                          placeholder="Ex: WMR Token"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Sigla / Ticker:</label>
                        <input
                          type="text"
                          value={coinForm.symbol}
                          onChange={(e) => setCoinForm({ ...coinForm, symbol: e.target.value })}
                          placeholder="Ex: WMR"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 uppercase focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Preço Inicial (US$):</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={coinForm.price}
                          onChange={(e) => setCoinForm({ ...coinForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Cor do Ícone (Hex):</label>
                        <input
                          type="color"
                          value={coinForm.color}
                          onChange={(e) => setCoinForm({ ...coinForm, color: e.target.value })}
                          className="w-full h-9 bg-slate-900 border border-slate-700 rounded px-1 py-1 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Cap. de Mercado (US$):</label>
                        <input
                          type="number"
                          value={coinForm.marketCap}
                          onChange={(e) => setCoinForm({ ...coinForm, marketCap: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Volume 24h (US$):</label>
                        <input
                          type="number"
                          value={coinForm.volume}
                          onChange={(e) => setCoinForm({ ...coinForm, volume: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingCoin(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs font-mono cursor-pointer"
                      >
                        Salvar Moeda
                      </button>
                    </div>
                  </form>
                )}

                {/* Coin Table */}
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Moeda</th>
                        <th className="p-3">Sigla</th>
                        <th className="p-3">Preço (US$)</th>
                        <th className="p-3">Variação 24h</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {coins.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
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
            </div>
          )}

          {/* TAB 4: OSCILAÇÃO AUTOMÁTICA & MERCADO */}
          {activeTab === 'market' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" /> Controle de Oscilação Automática do Mercado
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Configure o comportamento dos preços quando as carteiras estiverem conectadas ao Firebase.
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

          {/* TAB 5: HISTÓRICO & AUDITORIA */}
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
    </div>
  );
};
