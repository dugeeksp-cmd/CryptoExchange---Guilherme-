/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Shield, ShieldAlert, Terminal, Send, Download, RefreshCw, 
  Copy, Check, Search, Activity, TrendingUp, TrendingDown, 
  Sparkles, Clock, AlertTriangle, SlidersHorizontal, 
  WifiOff, Wifi, Database, Cpu, Zap, Ghost, Flame, Eye, Play, Volume2, VolumeX,
  Trash2, TerminalSquare, Info, CircleCheck, Building2, Landmark, ShieldCheck, Key, Plus
} from 'lucide-react';

import { Coin, Transaction, OperationPasswords, MarketSettings } from './types';
import { firebaseConfig } from './lib/firebase';
import { storage, DEFAULT_PASSWORDS, DEFAULT_MARKET_SETTINGS } from './lib/storage';
import { downloadFromFirestore, uploadToFirestore, verifyPasswordInFirestore } from './lib/sync';
import { calculateCoinOscillation } from './lib/market';
import { isValidRandomPixKey, generateSamplePixKey } from './lib/validators';
import { AdminPanel } from './components/AdminPanel';

export const LOCAL_VAULT_ADDRESS = '0xKALI_LOCAL_COLD_VAULT_f4b7a77ff';

export const BANK_OPTIONS = [
  'Itaú Unibanco',
  'Banco Bradesco',
  'NuBank',
  'Caixa Econômica Federal',
  'InfinitePay',
  'PicPay',
  'PayPal',
  'Mercado Pago',
  'PagBank',
  'Banco Santander',
  'Banco Inter',
  'BTG Pactual',
  'C6 Bank',
  'Banco Neon',
  'Sicoob',
  'Sicredi',
  'Banco do Brasil',
  'Banco BMG',
  'Banco Safra'
];

const INITIAL_COINS: Coin[] = [
  { id: 'wmr', name: 'WMR Token', symbol: 'WMR', price: 185200.00, variation: 12.8, marketCap: 5200000000, volume: 240000000, history: [172000, 175000, 178000, 181000, 183500, 185200], iconName: 'Cpu', color: '#00f0ff', isPrincipal: true },
  { id: 'dkbt', name: 'DarkBit', symbol: 'DKBT', price: 64250.00, variation: 2.4, marketCap: 1250000000, volume: 45000000, history: [63800, 63950, 63100, 64500, 64100, 64250], iconName: 'Terminal', color: '#ff3366' },
  { id: 'neth', name: 'NeoEther', symbol: 'NETH', price: 3420.00, variation: -1.2, marketCap: 410000000, volume: 18000000, history: [3480, 3460, 3450, 3400, 3410, 3420], iconName: 'Cpu', color: '#38bdf8' },
  { id: 'qsol', name: 'QuantumSol', symbol: 'QSOL', price: 142.50, variation: 8.7, marketCap: 65000000, volume: 7200000, history: [128, 131, 134, 138, 140, 142.5], iconName: 'Shield', color: '#39ff14' },
  { id: 'cybr', name: 'CyberCoin', symbol: 'CYBR', price: 1.24, variation: 12.3, marketCap: 12400000, volume: 1500000, history: [1.05, 1.10, 1.08, 1.15, 1.20, 1.24], iconName: 'Zap', color: '#fbcfe8' },
  { id: 'ghst', name: 'GhostToken', symbol: 'GHST', price: 0.45, variation: -3.8, marketCap: 4500000, volume: 380000, history: [0.48, 0.47, 0.46, 0.44, 0.43, 0.45], iconName: 'Ghost', color: '#c084fc' },
  { id: 'mtxg', name: 'MatrixGold', symbol: 'MTXG', price: 12.80, variation: 4.2, marketCap: 128000000, volume: 9400000, history: [12.10, 12.30, 12.20, 12.60, 12.50, 12.80], iconName: 'Sparkles', color: '#facc15' },
  { id: 'void', name: 'VoidNet', symbol: 'VOID', price: 0.082, variation: -15.4, marketCap: 820000, volume: 154000, history: [0.098, 0.095, 0.090, 0.088, 0.080, 0.082], iconName: 'TrendingDown', color: '#ef4444' },
  { id: 'syn', name: 'SynthWei', symbol: 'SYN', price: 2.15, variation: 0.8, marketCap: 4300000, volume: 215000, history: [2.12, 2.14, 2.10, 2.18, 2.13, 2.15], iconName: 'Activity', color: '#fb923c' },
  { id: 'spc', name: 'Spectra', symbol: 'SPC', price: 8.90, variation: 1.1, marketCap: 17800000, volume: 890000, history: [8.75, 8.82, 8.80, 8.95, 8.88, 8.90], iconName: 'Eye', color: '#10b981' },
  { id: 'onx', name: 'OnyxCore', symbol: 'ONX', price: 41.20, variation: -2.3, marketCap: 82400000, volume: 4120000, history: [42.40, 42.10, 41.80, 41.50, 41.00, 41.20], iconName: 'Database', color: '#6366f1' },
  { id: 'neb', name: 'NebulaCash', symbol: 'NEB', price: 0.95, variation: 5.4, marketCap: 9500000, volume: 950000, history: [0.89, 0.91, 0.90, 0.93, 0.92, 0.95], iconName: 'Flame', color: '#ec4899' },
  { id: 'crn', name: 'ChronoCoin', symbol: 'CRN', price: 185.00, variation: -0.5, marketCap: 370000000, volume: 18500000, history: [186.20, 185.80, 184.90, 185.50, 184.80, 185.0], iconName: 'Clock', color: '#a855f7' },
  { id: 'ags', name: 'AegisToken', symbol: 'AGS', price: 11.20, variation: 0.2, marketCap: 22400000, volume: 1120000, history: [11.15, 11.18, 11.22, 11.16, 11.21, 11.20], iconName: 'ShieldAlert', color: '#22c55e' },
  { id: 'ovr', name: 'Overdrive', symbol: 'OVR', price: 0.12, variation: 25.8, marketCap: 2400000, volume: 620000, history: [0.091, 0.098, 0.105, 0.112, 0.115, 0.12], iconName: 'Play', color: '#e11d48' },
  { id: 'cbt', name: 'Cobalt', symbol: 'CBT', price: 54.10, variation: -4.1, marketCap: 108200000, volume: 5410000, history: [56.40, 55.80, 55.10, 54.80, 53.90, 54.10], iconName: 'SlidersHorizontal', color: '#3b82f6' },
  { id: 'zst', name: 'ZeroState', symbol: 'ZST', price: 0.024, variation: 0.0, marketCap: 240000, volume: 2400, history: [0.024, 0.024, 0.024, 0.024, 0.024, 0.024], iconName: 'Info', color: '#94a3b8' },
  { id: 'cat', name: 'Catalyst', symbol: 'CAT', price: 7.45, variation: 3.6, marketCap: 14900000, volume: 745000, history: [7.12, 7.25, 7.18, 7.32, 7.40, 7.45], iconName: 'Flame', color: '#f97316' }
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_PORTFOLIO: Record<string, number> = {
  'WMR': 0.02,
  'DKBT': 0.01,
  'NETH': 0.05,
  'QSOL': 1.0,
  'CYBR': 100.0,
  'GHST': 0.0
};

export default function App() {
  // Screens state
  const [currentScreen, setCurrentScreen] = useState<'boot' | 'login' | 'dashboard' | 'market'>('boot');
  
  // App settings & simulation states
  const [balanceFiat, setBalanceFiat] = useState<number>(6323.00);
  const [portfolio, setPortfolio] = useState<Record<string, number>>(INITIAL_PORTFOLIO);
  const [coins, setCoins] = useState<Coin[]>(INITIAL_COINS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  
  // Login passcode state
  const [passcode, setPasscode] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'carteira' | 'mercado' | 'terminal'>('carteira');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // FIREBASE & HYBRID OFFLINE/ONLINE STATES
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('NUNCA');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // PASSWORD PROMPT FOR SENSITIVE OPERATIONS
  const [pwdModal, setPwdModal] = useState<{
    open: boolean;
    opType: 'buy' | 'sell' | 'receive' | 'send';
    coinSymbol?: string;
    inputPassword: string;
    error: string | null;
    pendingAction: (() => void) | null;
  }>({
    open: false,
    opType: 'buy',
    inputPassword: '',
    error: null,
    pendingAction: null
  });

  // Clock effect: Only updates if online!
  useEffect(() => {
    const updateDateTime = () => {
      if (!isConnected) return; // FREEZE CLOCK WHEN OFFLINE
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentDateTime(`${day} ${month} ${year} • ${hours}:${minutes}:${seconds}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Terminal Logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'KALI COLD VAULT OS [v3.2.0-secure] inicializado.',
    'Isolação de Rede Completa: SISTEMA HÍBRIDO OFFLINE / ONLINE ATIVADO.',
    'MOEDA PRINCIPAL DA CARTEIRA: WMR TOKEN (WMR)',
    'Estado atual: OFFLINE (Dados congelados).',
    'Clique em "CONECTAR" no topo para sincronizar com o servidor.'
  ]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'receive' | 'send' | 'sell' | 'buy' | null>(null);
  const [modalSelectedCoin, setModalSelectedCoin] = useState<Coin>(INITIAL_COINS[0]);
  const [modalSelectedBank, setModalSelectedBank] = useState<string>(BANK_OPTIONS[0]);
  const [modalAmount, setModalAmount] = useState<string>('');
  const [modalAddress, setModalAddress] = useState<string>('');
  const [modalGasOption, setModalGasOption] = useState<'standard' | 'priority'>('standard');
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [txSuccessInfo, setTxSuccessInfo] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('rank');
  const [marketFilter, setMarketFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [txHistoryFilter, setTxHistoryFilter] = useState<'TODAS' | 'ENVIADO' | 'RECEBIDO' | 'COMPRA' | 'VENDA'>('TODAS');
  
  // Toast notifications
  const [toasts, setToasts] = useState<{id: string; message: string; type: 'success' | 'info' | 'warning' | 'error'}[]>([]);

  // Ref to log container
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const bootLogsEndRef = useRef<HTMLDivElement>(null);

  // Boot screen specific logs (ENGLISH ONLY)
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [bootStep, setBootStep] = useState<number>(0);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  // Send modal specific options
  const [sendMode, setSendMode] = useState<'crypto' | 'bank'>('crypto');
  const [sendBrokerage, setSendBrokerage] = useState<'standard' | 'express' | 'instant'>('standard');

  // Sound Synthesizer function using Web Audio API
  const playBeep = (type: 'click' | 'success' | 'error' | 'boot' | 'keystroke') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'keystroke') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'boot') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Ignore audio permission/interaction errors
    }
  };

  // Toast adder helper
  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Persistent storage loaders
  useEffect(() => {
    try {
      storage.initStorage(6323.00, INITIAL_PORTFOLIO, INITIAL_COINS, INITIAL_TRANSACTIONS);
      setBalanceFiat(storage.loadBalance(6323.00));
      setPortfolio(storage.loadPortfolio(INITIAL_PORTFOLIO));
      setCoins(storage.loadCoins(INITIAL_COINS));
      setTransactions(storage.loadTransactions(INITIAL_TRANSACTIONS));
      setLastSyncTimestamp(storage.loadLastSyncTime());
      const mkt = storage.loadMarketSettings();
      setUpdateAvailable(!!mkt.updateAvailable);
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
  }, []);

  // Save changes locally
  useEffect(() => {
    storage.saveBalance(balanceFiat);
    storage.savePortfolio(portfolio);
    storage.saveCoins(coins);
    storage.saveTransactions(transactions);
  }, [balanceFiat, portfolio, coins, transactions]);

  // Handle Boot logs sequence loading (ENGLISH ONLY)
  useEffect(() => {
    if (currentScreen !== 'boot') return;
    
    const bootSteps = [
      { t: 'KALI_SECURE_OS CORE INIT (v5.0.0-isolated)...', d: 300 },
      { t: '-> Verifying bootloader signature... [OK]', d: 250 },
      { t: '-> Initializing cryptographic offline key store...', d: 350 },
      { t: '-> SECP256K1 key storage integrity: APPROVED', d: 200 },
      { t: '-> Mounting sandbox cold file system partition... [/dev/sdb1]', d: 400 },
      { t: '-> PRIMARY ASSET ATTACHED: WMR TOKEN (WMR)', d: 300 },
      { t: '[✓] ONLINE CONNECTION INITIALIZED', d: 250 },
      { t: '-> Mode status: OFFLINE (FROZEN UNTIL CONNECTED)', d: 300 },
      { t: 'Ready for user security key input.', d: 100 }
    ];

    if (bootStep < bootSteps.length) {
      const timer = setTimeout(() => {
        setBootLogs((prev) => [...prev, bootSteps[bootStep].t]);
        playBeep('keystroke');
        setBootStep((prev) => prev + 1);
      }, bootSteps[bootStep].d);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        playBeep('boot');
        setCurrentScreen('login');
      }, 800);
      return () => clearTimeout(finishTimer);
    }
  }, [bootStep, currentScreen]);

  // Dynamic price variations: ONLY RUNS WHEN ONLINE! (FROZEN WHEN OFFLINE)
  useEffect(() => {
    if (!isConnected) return; // Freeze prices when offline!
    if (currentScreen !== 'dashboard' && currentScreen !== 'market') return;

    const mktSettings = storage.loadMarketSettings();
    const intervalMs = (mktSettings.intervalSeconds || 10) * 1000;

    const interval = setInterval(() => {
      setCoins((prevCoins) => {
        return prevCoins.map((coin) => {
          if (coin.symbol === 'ZST') return coin;
          return calculateCoinOscillation(coin, mktSettings);
        });
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [currentScreen, isConnected]);

  // Auto-scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  useEffect(() => {
    bootLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bootLogs]);

  // Passcode login verification
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'CryptoGui') {
      playBeep('success');
      addToast('Acesso autorizado. Modo Offline ativado por padrão.', 'success');
      setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ADMIN LOGGED IN - COLD WALLET MOUNTED`]);
      setCurrentScreen('dashboard');
    } else {
      playBeep('error');
      setLoginError(true);
      setPasscode('');
      addToast('Senha Incorreta! Acesso negado.', 'error');
      setTimeout(() => setLoginError(false), 500);
    }
  };

  // FIREBASE CONNECT HANDLER
  const handleConnectFirebase = async () => {
    setIsSyncing(true);
    playBeep('click');
    addToast('Conectando ao servidor e baixando dados...', 'info');
    try {
      const remote = await downloadFromFirestore(coins, transactions, balanceFiat, portfolio);
      setCoins(remote.coins);
      setTransactions(remote.transactions);
      setBalanceFiat(remote.balanceFiat);
      setPortfolio(remote.portfolio);
      setLastSyncTimestamp(remote.lastSyncTimestamp);
      const mkt = storage.loadMarketSettings();
      setUpdateAvailable(!!mkt.updateAvailable);
      setIsConnected(true);
      playBeep('success');
      addToast('Conectado ao servidor! Dados e cotações sincronizados.', 'success');
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] REMOTE SERVER CONNECTED - SECURE HANDSHAKE COMPLETED`]);
    } catch (err) {
      console.error(err);
      playBeep('error');
      addToast('Erro ao conectar ao servidor. Verifique sua conexão.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // FIREBASE DISCONNECT HANDLER
  const handleDisconnectFirebase = async () => {
    setIsSyncing(true);
    playBeep('click');
    try {
      const ts = await uploadToFirestore(coins, transactions, balanceFiat, portfolio);
      setLastSyncTimestamp(ts);
      setIsConnected(false);
      playBeep('click');
      addToast('Desconectado. Modo Offline ativado (Informações congeladas).', 'info');
      setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SERVER DISCONNECTED - LOCAL COLD ENCLAVE FROZEN`]);
    } catch (err) {
      console.warn(err);
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // OPERATION INITIATION WITH PASSWORD GUARD
  const handleInitiateOperation = (
    opType: 'buy' | 'sell' | 'receive' | 'send', 
    coinSymbol?: string, 
    onSuccessAction?: () => void
  ) => {
    if (!isConnected) {
      playBeep('error');
      addToast('Conecte-se ao servidor para realizar operações.', 'warning');
      return;
    }

    setPwdModal({
      open: true,
      opType,
      coinSymbol,
      inputPassword: '',
      error: null,
      pendingAction: onSuccessAction || null
    });
  };

  // VERIFY OPERATION PASSWORD SUBMIT
  const handleVerifyOperationPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdModal.inputPassword.trim()) {
      setPwdModal(prev => ({ ...prev, error: 'Digite a senha da operação.' }));
      return;
    }

    try {
      const valid = await verifyPasswordInFirestore(pwdModal.opType, pwdModal.inputPassword);
      if (valid) {
        playBeep('success');
        addToast('Senha autorizada com sucesso!', 'success');
        const action = pwdModal.pendingAction;
        const op = pwdModal.opType;
        const sym = pwdModal.coinSymbol;
        setPwdModal({ open: false, opType: 'buy', inputPassword: '', error: null, pendingAction: null });
        
        if (action) {
          action();
        } else {
          openModal(op, sym);
        }
      } else {
        playBeep('error');
        setPwdModal(prev => ({ ...prev, error: 'Senha inválida.' }));
      }
    } catch (err) {
      console.error(err);
      playBeep('error');
      setPwdModal(prev => ({ ...prev, error: 'Erro ao validar senha no servidor.' }));
    }
  };

  // SVG QR Code generator
  const generateQRCodeSvg = (address: string) => {
    const size = 21;
    const grid = [];
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const isFinder = 
          (r < 7 && c < 7) || 
          (r < 7 && c >= size - 7) || 
          (r >= size - 7 && c < 7);
        
        if (isFinder) {
          const innerFinder = 
            (r === 0 || r === 6 || c === 0 || c === 6 || (r >= size - 7 && (r === size - 7 || r === size - 1)) || (c >= size - 7 && (c === size - 7 || c === size - 1))) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) ||
            (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4);
          row.push(innerFinder);
        } else {
          const bitIndex = r * size + c;
          const noise = Math.abs((hash ^ (bitIndex * 733)) % 100) > 42;
          row.push(noise);
        }
      }
      grid.push(row);
    }

    return (
      <svg className="w-40 h-40 bg-slate-900 p-2 border border-cyan-500/30 rounded" viewBox="0 0 21 21" shapeRendering="crispEdges">
        {grid.map((row, r) => 
          row.map((active, c) => (
            <rect 
              key={`${r}-${c}`} 
              x={c} 
              y={r} 
              width="1" 
              height="1" 
              fill={active ? '#00f0ff' : 'transparent'} 
            />
          ))
        )}
      </svg>
    );
  };

  // Sparkline visual render
  const renderSparkline = (points: number[], color: string) => {
    if (points.length === 0) return null;
    const width = 100;
    const height = 28;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min === 0 ? 1 : max - min;
    
    const polyPoints = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - 2 - ((p - min) / range) * (height - 4);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-20 h-7" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={polyPoints}
        />
      </svg>
    );
  };

  // Constants for brokerages
  const BROKERAGE_OPTIONS_SEND = [
    { id: 'standard', name: 'Standard Brokerage', deadline: 'Prazo: 2 dias', fee: 'Taxa: 0,5%' },
    { id: 'express', name: 'Express Brokerage', deadline: 'Prazo: 1 dia', fee: 'Taxa: 15%' },
    { id: 'instant', name: 'Instant Vault Brokerage', deadline: 'Prazo: 3 horas', fee: 'Taxa: 35%' }
  ];

  const SELL_BROKERAGES = [
    'CryptoExchange Prime (Liquidez OTC Instantânea)',
    'Nexus Global Brokerage (Execução Direta)',
    'Apex Quantum Capital (Conversão Express)'
  ];

  // Copy helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    playBeep('click');
    addToast(`${label} copiado para a área de transferência!`, 'success');
  };

  // Version Update Local Handler
  const handleUpdateWalletVersion = () => {
    if (!updateAvailable) return;
    playBeep('success');
    addToast('Atualização de versão efetuada com sucesso! Código index.html atualizado localmente para v5.0.', 'success');
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [VERSION UPDATE] Local codebase index.html updated to v5.0.0-PROD.`
    ]);
  };

  // Open modal inner setup
  const openModal = (type: 'receive' | 'send' | 'sell' | 'buy', coinSymbol?: string) => {
    playBeep('click');
    if (type === 'sell') {
      const nonZeroCoins = coins.filter(c => (portfolio[c.symbol] || 0) > 0);
      const coin = nonZeroCoins.find(c => c.symbol === coinSymbol) || nonZeroCoins[0] || coins[0];
      setModalSelectedCoin(coin);
      setModalSelectedBank(SELL_BROKERAGES[0]);
    } else {
      const coin = coins.find((c) => c.symbol === (coinSymbol || 'WMR')) || coins[0];
      setModalSelectedCoin(coin);
      setModalSelectedBank(BANK_OPTIONS[0]);
    }
    setSendMode('crypto');
    setSendBrokerage('standard');
    setModalAmount('');
    if (type === 'receive') {
      setModalAddress(LOCAL_VAULT_ADDRESS);
    } else if (type === 'send') {
      setModalAddress(LOCAL_VAULT_ADDRESS);
    } else {
      setModalAddress('');
    }
    setTxSuccessInfo(null);
    setActiveModal(type);
  };

  // Delete all transactions handler
  const handleClearAllTransactions = () => {
    if (window.confirm('Tem certeza de que deseja EXCLUIR TODO o histórico de transações?')) {
      setTransactions([]);
      storage.saveTransactions([]);
      playBeep('click');
      addToast('Histórico de transações zerado com sucesso!', 'success');
      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [TRANSACTION LOG] Cleared all transactions from local vault history.`
      ]);
    }
  };

  // Delete single transaction handler
  const handleDeleteSingleTransaction = (txId: string) => {
    const updated = transactions.filter(t => t.id !== txId);
    setTransactions(updated);
    storage.saveTransactions(updated);
    playBeep('click');
    addToast(`Transação ${txId} excluída do histórico!`, 'info');
  };

  // Run sending transaction
  const handleConfirmSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(modalAmount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      playBeep('error');
      addToast('Valor inválido!', 'error');
      return;
    }

    const availableAmount = portfolio[modalSelectedCoin.symbol] || 0;
    if (amountNum > availableAmount) {
      playBeep('error');
      addToast(`Saldo insuficiente de ${modalSelectedCoin.symbol}!`, 'error');
      return;
    }

    if (!modalAddress.trim()) {
      playBeep('error');
      addToast('Destino obrigatório!', 'error');
      return;
    }

    setIsProcessingTx(true);
    playBeep('click');

    setTimeout(async () => {
      const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const fiatEq = amountNum * modalSelectedCoin.price;

      let bankInfo = 'Carteira Cripto Externa / Vault';
      if (sendMode === 'bank') {
        const brok = BROKERAGE_OPTIONS_SEND.find(b => b.id === sendBrokerage) || BROKERAGE_OPTIONS_SEND[0];
        bankInfo = `${brok.name} (${brok.deadline} - ${brok.fee})`;
      }

      const newTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
        type: 'ENVIADO',
        coinSymbol: modalSelectedCoin.symbol,
        amount: amountNum,
        fiatValue: parseFloat(fiatEq.toFixed(2)),
        address: modalAddress.trim(),
        bankName: bankInfo,
        hash: generatedHash,
        status: 'PENDENTE'
      };

      const newTxList = [newTx, ...transactions];

      setTransactions(newTxList);
      storage.saveTransactions(newTxList);
      setIsProcessingTx(false);
      setActiveModal(null);
      setTxSuccessInfo(newTx);
      playBeep('success');
      addToast(`Transferência enviada! Gravada no histórico e aguardando aprovação do Admin.`, 'success');

      if (isConnected) {
        await uploadToFirestore(coins, newTxList, balanceFiat, portfolio);
      }
      
      setTerminalLogs(prev => [...prev, 
        `[${new Date().toLocaleTimeString()}] TRANSFER-OUT (${sendMode.toUpperCase()}): ${amountNum} ${modalSelectedCoin.symbol} -> ${modalAddress.trim()} [PENDING]`
      ]);
    }, 1200);
  };

  // Run sell transaction
  const handleConfirmSell = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(modalAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      playBeep('error');
      addToast('Valor de conversão inválido!', 'error');
      return;
    }

    const availableAmount = portfolio[modalSelectedCoin.symbol] || 0;
    if (amountNum > availableAmount) {
      playBeep('error');
      addToast(`Saldo de ${modalSelectedCoin.symbol} insuficiente!`, 'error');
      return;
    }

    if (!modalAddress.trim()) {
      playBeep('error');
      addToast('Destino obrigatório para recebimento do valor!', 'error');
      return;
    }

    setIsProcessingTx(true);
    playBeep('click');

    setTimeout(async () => {
      const sellValue = amountNum * modalSelectedCoin.price;
      const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      const newTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
        type: 'VENDA',
        coinSymbol: modalSelectedCoin.symbol,
        amount: amountNum,
        fiatValue: parseFloat(sellValue.toFixed(2)),
        address: modalAddress.trim(),
        bankName: modalSelectedBank,
        hash: generatedHash,
        status: 'PENDENTE'
      };

      const newTxList = [newTx, ...transactions];

      setTransactions(newTxList);
      setIsProcessingTx(false);
      setActiveModal(null);
      setTxSuccessInfo(newTx);
      playBeep('success');
      addToast(`Ordem de Venda registrada! Enviada ao histórico e aguardando aprovação do Admin.`, 'success');

      if (isConnected) {
        await uploadToFirestore(coins, newTxList, balanceFiat, portfolio);
      }
      
      setTerminalLogs(prev => [...prev, 
        `[${new Date().toLocaleTimeString()}] SELL-ORDER (${modalSelectedBank}): ${amountNum} ${modalSelectedCoin.symbol} -> ${modalAddress.trim()} [PENDING]`
      ]);
    }, 1200);
  };

  // Run buy transaction
  const handleConfirmBuy = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(modalAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      playBeep('error');
      addToast('Valor inválido!', 'error');
      return;
    }

    const totalCost = amountNum * modalSelectedCoin.price;
    if (totalCost > balanceFiat) {
      playBeep('error');
      addToast('Saldo em R$ insuficiente para compra!', 'error');
      return;
    }

    setIsProcessingTx(true);
    playBeep('click');

    setTimeout(async () => {
      const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      const newTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
        type: 'COMPRA',
        coinSymbol: modalSelectedCoin.symbol,
        amount: amountNum,
        fiatValue: parseFloat(totalCost.toFixed(2)),
        address: `PAGAMENTO BANCÁRIO (${modalSelectedBank})`,
        bankName: modalSelectedBank,
        hash: generatedHash,
        status: 'PENDENTE'
      };

      const newTxList = [newTx, ...transactions];

      setTransactions(newTxList);
      setIsProcessingTx(false);
      setActiveModal(null);
      setTxSuccessInfo(newTx);
      playBeep('success');
      addToast(`Ordem de Compra registrada! Aguardando aprovação do Admin.`, 'success');

      if (isConnected) {
        await uploadToFirestore(coins, newTxList, balanceFiat, portfolio);
      }

      setTerminalLogs(prev => [...prev, 
        `[${new Date().toLocaleTimeString()}] BUY-ORDER: Solicitou ${amountNum} ${modalSelectedCoin.symbol} ($${totalCost.toFixed(2)}) [PENDENTE]`
      ]);
    }, 1200);
  };

  // Receive modal manual add
  const handleRequestReceiveFund = async () => {
    const receiveAmount = modalSelectedCoin.symbol === 'WMR' ? 1.0 : (modalSelectedCoin.symbol === 'DKBT' ? 0.05 : 5.0);
    const fiatValue = receiveAmount * modalSelectedCoin.price;
    const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    playBeep('success');
    addToast(`Solicitação de Depósito de +${receiveAmount} ${modalSelectedCoin.symbol} enviada ao Administrador!`, 'info');

    const newTx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
      type: 'RECEBIDO',
      coinSymbol: modalSelectedCoin.symbol,
      amount: receiveAmount,
      fiatValue: parseFloat(fiatValue.toFixed(2)),
      address: `DEPÓSITO (${modalSelectedBank})`,
      bankName: modalSelectedBank,
      hash: generatedHash,
      status: 'PENDENTE'
    };

    const newTxList = [newTx, ...transactions];

    setTransactions(newTxList);
    setActiveModal(null);

    if (isConnected) {
      await uploadToFirestore(coins, newTxList, balanceFiat, portfolio);
    }

    setTerminalLogs(prev => [...prev, 
      `[${new Date().toLocaleTimeString()}] DEPOSIT-REQ: +${receiveAmount} ${modalSelectedCoin.symbol} (${modalSelectedBank}) [PENDENTE]`
    ]);
  };

  // Reset local application
  const handleResetApp = () => {
    if (confirm('Aviso de Segurança: Deseja formatar as partições da carteira local e redefinir as chaves?')) {
      localStorage.clear();
      setBalanceFiat(6323.00);
      setPortfolio(INITIAL_PORTFOLIO);
      setCoins(INITIAL_COINS);
      setTransactions(INITIAL_TRANSACTIONS);
      setIsConnected(false);
      setTerminalLogs([
        'KALI COLD VAULT OS redefinido.',
        'Novo keychain gerado localmente.',
        'Estado: OFFLINE SECURE VAULT.'
      ]);
      setBootLogs([]);
      setBootStep(0);
      setCurrentScreen('boot');
      playBeep('error');
      addToast('Sistema redefinido com sucesso.', 'info');
    }
  };

  // Handle virtual interactive terminal commands
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    playBeep('keystroke');
    const newLogs = [...terminalLogs, `kali@coldvault:~$ ${terminalInput}`];

    if (cmd === 'help') {
      newLogs.push('AVAILABLE COMMANDS:');
      newLogs.push('  balance        - Display wallet balance and assets in custody');
      newLogs.push('  wmr            - Details and quote for primary asset WMR Token');
      newLogs.push('  banks          - List supported settlement banking partners');
      newLogs.push('  coins          - List all 18 active cryptocurrencies');
      newLogs.push('  connect        - Connect to remote server');
      newLogs.push('  disconnect     - Disconnect from remote server (freeze data)');
      newLogs.push('  clear          - Clear terminal log output');
      newLogs.push('  audit          - System integrity audit check');
    } else if (cmd === 'connect') {
      handleConnectFirebase();
      setTerminalInput('');
      return;
    } else if (cmd === 'disconnect') {
      handleDisconnectFirebase();
      setTerminalInput('');
      return;
    } else if (cmd === 'balance') {
      newLogs.push(isConnected ? `FIAT AVAILABLE BALANCE: $${balanceFiat.toLocaleString('en-US', {minimumFractionDigits: 2})}` : 'FIAT BALANCE: HIDDEN (OFFLINE MODE)');
      newLogs.push('ACTIVE PORTFOLIO:');
      Object.entries(portfolio).forEach(([symbol, qty]) => {
        const coin = coins.find((c) => c.symbol === symbol);
        const qtyNum = typeof qty === 'number' ? qty : parseFloat(qty as any) || 0;
        const val = qtyNum * (coin ? coin.price : 0);
        newLogs.push(`  • ${symbol}: ${qtyNum} ${isConnected ? `($${val.toLocaleString('en-US', {minimumFractionDigits: 2})})` : ''}`);
      });
    } else if (cmd === 'wmr') {
      const wmrCoin = coins.find(c => c.symbol === 'WMR');
      newLogs.push(`[WMR TOKEN - PRIMARY ASSET]`);
      newLogs.push(`  Current Price: $${wmrCoin?.price.toLocaleString()}`);
      newLogs.push(`  24h Variation: +${wmrCoin?.variation}%`);
      newLogs.push(`  Vault Custody: ${portfolio['WMR'] || 0} WMR`);
    } else if (cmd === 'banks') {
      newLogs.push('REGISTERED SETTLEMENT BANK PARTNERS:');
      BANK_OPTIONS.forEach(b => newLogs.push(`  - ${b}`));
    } else if (cmd === 'coins') {
      coins.forEach((c) => {
        newLogs.push(`  ${c.symbol.padEnd(5)} | ${c.name.padEnd(14)} | $${c.price.toLocaleString().padStart(10)} | ${c.variation >= 0 ? '+' : ''}${c.variation}%`);
      });
    } else if (cmd === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'audit') {
      newLogs.push('-> WMR cryptographic integrity: VERIFIED');
      newLogs.push(`-> Server state: ${isConnected ? 'CONNECTED' : 'DISCONNECTED (OFFLINE)'}`);
      newLogs.push('[✓] AUDIT COMPLETED SUCCESSFULLY');
    } else {
      newLogs.push(`Command not recognized: "${cmd}". Type "help" for a list of available commands.`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
  };

  // Grand total calculations
  const totalCryptoFiatValue = Object.entries(portfolio).reduce((acc, [symbol, qty]) => {
    const coin = coins.find((c) => c.symbol === symbol);
    const qtyNum = typeof qty === 'number' ? qty : parseFloat(qty as any) || 0;
    return acc + (coin ? coin.price * qtyNum : 0);
  }, 0);

  const grandTotalBalance = balanceFiat + totalCryptoFiatValue;

  // Market filtered list
  const filteredCoins = coins.filter((coin) => {
    const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (marketFilter === 'gainers') return coin.variation > 0;
    if (marketFilter === 'losers') return coin.variation < 0;
    return true;
  }).sort((a, b) => {
    if (sortOption === 'price-desc') return b.price - a.price;
    if (sortOption === 'price-asc') return a.price - b.price;
    if (sortOption === 'var-desc') return b.variation - a.variation;
    if (sortOption === 'var-asc') return a.variation - b.variation;
    return 0;
  });

  // Filtered transactions list
  const filteredTransactions = transactions.filter((tx) => {
    if (txHistoryFilter === 'TODAS') return true;
    return tx.type === txHistoryFilter;
  });

  // Check URL for admin access (e.g., /admin, ?admin, #admin)
  useEffect(() => {
    const checkAdminUrl = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      if (path.toLowerCase().includes('/admin') || search.toLowerCase().includes('admin') || hash.toLowerCase().includes('admin')) {
        setShowAdminPanel(true);
      }
    };
    checkAdminUrl();
    window.addEventListener('popstate', checkAdminUrl);
    return () => window.removeEventListener('popstate', checkAdminUrl);
  }, []);

  // If Admin view toggled
  if (showAdminPanel) {
    return <AdminPanel onBackToWallet={() => {
      setShowAdminPanel(false);
      if (window.location.search.includes('admin') || window.location.pathname.includes('/admin') || window.location.hash.includes('admin')) {
        window.history.pushState({}, '', window.location.pathname.replace('/admin', '') || '/');
      }
    }} />;
  }

  return (
    <div id="kali-root" className="min-h-screen bg-[#060913] text-slate-100 font-sans relative overflow-x-hidden select-none custom-scrollbar pb-10">
      
      {/* CRT Scanline Visual Effect overlay */}
      <div className="crt-scanlines" />

      {/* Retro background hacker matrix digital green/blue nodes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/15 via-[#060913]/90 to-[#060913] pointer-events-none z-0" />

      {/* Active Toast Alerts Hub */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`pointer-events-auto flex items-center gap-3 p-3 rounded border shadow-xl transition-all duration-300 animate-slide-in-right ${
              t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' :
              t.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-300' :
              t.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-300' :
              'bg-slate-900/95 border-cyan-500 text-cyan-200'
            }`}
          >
            {t.type === 'success' && <CircleCheck className="w-5 h-5 flex-shrink-0" />}
            {t.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
            <span className="text-xs font-mono font-bold leading-tight">{t.message}</span>
          </div>
        ))}
      </div>

      {/* SCREEN 1: BOOTING SEQUENCE */}
      {currentScreen === 'boot' && (
        <div id="boot-screen" className="fixed inset-0 z-50 bg-[#02040a] flex flex-col justify-between p-6 md:p-12 font-mono text-emerald-400">
          <div className="max-w-4xl w-full mx-auto flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pt-4">
            <div className="flex items-center gap-3 text-cyan-400 mb-6 border-b border-cyan-900/40 pb-4">
              <Terminal className="w-8 h-8 animate-pulse text-cyan-400" />
              <div>
                <h1 className="text-xl font-bold tracking-widest text-cyan-400">KALI SECURE CRYPTO COLD STORAGE</h1>
                <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">SISTEMA HÍBRIDO DE CARTEIRA OFFLINE / ONLINE</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-emerald-300/95">
              {bootLogs.map((log, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-emerald-500 font-bold">»</span>
                  <p className="whitespace-pre-line">{log}</p>
                </div>
              ))}
              <div ref={bootLogsEndRef} />
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto border-t border-slate-900 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-bold">
            <div>VAULT STATUS: [MODO OFFLINE POR PADRÃO]</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>OFFLINE ENCRYPTED SECURE_BRIDGE ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: LOGIN COMPONENT */}
      {currentScreen === 'login' && (
        <div id="login-screen" className="fixed inset-0 z-40 bg-[#03060d]/95 flex items-center justify-center p-4">
          <div className={`w-full max-w-md bg-slate-950/80 backdrop-blur-md p-6 md:p-8 rounded-xl border-2 transition-all duration-300 shadow-[0_0_40px_rgba(0,240,255,0.06)] ${
            loginError ? 'border-red-500 animate-shake' : 'border-slate-800'
          }`}>
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-cyan-950/30 rounded-full border border-cyan-500/20 mb-3 cyber-glow-cyan">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-black tracking-wide text-cyan-400 font-mono">COGNITIVE COLD VAULT</h2>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-1">CARTEIRA CRYPTO HÍBRIDA (OFFLINE + ONLINE)</p>
              
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">OFFLINE SECURE VAULT</span>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">Inserir Chave AES / Passcode</label>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">CRIPTO: AES-256</span>
                </div>
                <div className="relative">
                  <input 
                    type="password" 
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      playBeep('keystroke');
                    }}
                    placeholder="Digite sua chave de acesso"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 text-center text-lg font-mono tracking-widest py-3 px-4 rounded text-cyan-300 outline-none transition-colors"
                    autoFocus
                  />
                  <div className="absolute right-3 top-3.5 text-slate-600">
                    <Shield className="w-5 h-5 text-cyan-500/30" />
                  </div>
                </div>
              </div>

              {/* Keypad interface */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setPasscode((prev) => prev + num);
                      playBeep('keystroke');
                    }}
                    className="py-2 bg-slate-900/60 hover:bg-cyan-950/30 border border-slate-800/80 rounded text-slate-300 font-mono text-sm font-bold active:border-cyan-400 transition-all hover:text-cyan-400 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPasscode('');
                    playBeep('click');
                  }}
                  className="py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded text-red-400 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  LIMPAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasscode((prev) => prev + '0');
                    playBeep('keystroke');
                  }}
                  className="py-2 bg-slate-900/60 hover:bg-cyan-950/30 border border-slate-800/80 rounded text-slate-300 font-mono text-sm font-bold active:border-cyan-400 transition-all hover:text-cyan-400 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasscode((prev) => prev.slice(0, -1));
                    playBeep('click');
                  }}
                  className="py-2 bg-slate-900/60 hover:bg-cyan-950/30 border border-slate-800/80 rounded text-slate-300 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
                  title="Apagar último caractere"
                >
                  DEL
                </button>
              </div>

              <button 
                type="submit" 
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 rounded font-mono uppercase tracking-widest text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-300 mt-2"
              >
                AUTENTICAR ASSINATURA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CORE WALLET LAYOUT */}
      {currentScreen !== 'boot' && currentScreen !== 'login' && (
        <div id="main-wallet-dashboard" className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6 relative z-10 space-y-6">
          
          {/* TOP PANEL: SECURITY NOTIFIER & CONTROL BAR */}
          <header className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/30 rounded-lg border border-cyan-500/20 cyber-glow-cyan">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black font-mono tracking-widest text-slate-100 uppercase">KALI COLD VAULT</h1>
                  <span className="text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded font-bold font-mono">v6.2 HÍBRIDO</span>
                  <a
                    href="/wallet_sync_loader.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 px-2 py-0.5 rounded font-mono font-bold transition-all flex items-center gap-1"
                    title="Open Standalone 4-Hour Sync & Update Page"
                  >
                    <Clock className="w-3 h-3 text-cyan-400" /> 4h Sync Page ↗
                  </a>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  </span>
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isConnected ? '🟢 CONECTADO ONLINE' : '🔴 MODO OFFLINE (DADOS CONGELADOS)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Real-time Date and Time Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400 font-mono font-bold">
              <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>SERVIDOR: <span className="text-cyan-400 font-bold">{isConnected ? 'SINCRO ATIVA' : 'CONGELADO'}</span></span>
              </div>
              <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded flex items-center gap-2">
                {isConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
                <span>REDE: <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>{isConnected ? 'ONLINE' : 'OFFLINE SEGURO'}</span></span>
              </div>
              <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="uppercase text-amber-300">{isConnected ? currentDateTime : 'RELÓGIO CONGELADO'}</span>
              </div>
            </div>

            {/* Right side controls: CONNECT / DISCONNECT & ADMIN */}
            <div className="flex flex-wrap items-center gap-2">
              {/* CONNECT / DISCONNECT BUTTON */}
              {isConnected ? (
                <button
                  onClick={handleDisconnectFirebase}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-300 font-bold rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                  title="Desconectar do servidor e congelar informações"
                >
                  <WifiOff className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>DESCONECTAR</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectFirebase}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-lg text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                  title="Conectar ao servidor online e sincronizar dados"
                >
                  <Wifi className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>{isSyncing ? 'CONECTANDO...' : 'CONECTAR'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playBeep('click');
                  addToast(soundEnabled ? 'Sons desativados' : 'Sons ativados', 'info');
                }}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  soundEnabled ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20' : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title={soundEnabled ? 'Desativar Sons' : 'Ativar Sons'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleResetApp}
                className="p-2 border border-red-500/30 hover:border-red-500 hover:bg-red-950/20 text-red-400 rounded transition-colors cursor-pointer"
                title="Formatar Carteira local"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playBeep('click');
                  setCurrentScreen('login');
                  addToast('Carteira bloqueada. Insira sua chave novamente.', 'info');
                }}
                className="p-2 border border-slate-800 hover:border-amber-500 hover:text-amber-400 rounded text-slate-400 transition-colors cursor-pointer"
                title="Bloquear Carteira"
              >
                <Lock className="w-4 h-4" />
              </button>

              <button
                onClick={handleUpdateWalletVersion}
                disabled={!updateAvailable}
                className={`px-3 py-2 border rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  updateAvailable
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse'
                    : 'border-slate-800 text-slate-600 bg-slate-900/40 cursor-not-allowed opacity-50'
                }`}
                title={updateAvailable ? 'Atualizar Versão da Carteira (Ativado pelo Admin)' : 'Atualização de Versão Bloqueada pelo Admin'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updateAvailable ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className="hidden sm:inline">Atualizar Versão</span>
              </button>
            </div>
          </header>

          {/* OFFLINE WARNING BANNER */}
          {!isConnected && (
            <div className="bg-amber-950/80 border border-amber-600/60 rounded-xl p-3.5 text-xs font-mono text-amber-300 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 font-bold">
                <WifiOff className="w-4.5 h-4.5 text-amber-400 flex-shrink-0" />
                <span>MODO OFFLINE ATIVO: Informações congeladas. Valores Fiat ocultos.</span>
              </div>
              <div className="text-[11px] text-amber-400/90 font-semibold flex items-center gap-3">
                <span>Conecte-se ao servidor para realizar operações.</span>
                <span className="text-amber-200 bg-amber-900/60 border border-amber-700/60 px-2 py-0.5 rounded">Última Sincronização: {lastSyncTimestamp}</span>
              </div>
            </div>
          )}

          {/* MAIN SCREEN SECTIONS SWITCHER NAVIGATION */}
          <nav className="flex border-b border-slate-800">
            <button
              onClick={() => {
                setActiveTab('carteira');
                playBeep('click');
              }}
              className={`px-5 py-3.5 font-mono text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'carteira' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              CARTEIRA COLD (WMR PRINCIPAL)
            </button>
            <button
              onClick={() => {
                setActiveTab('mercado');
                playBeep('click');
              }}
              className={`px-5 py-3.5 font-mono text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'mercado' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              COTAÇÕES (18 MOEDAS)
            </button>
            <button
              onClick={() => {
                setActiveTab('terminal');
                playBeep('click');
              }}
              className={`px-5 py-3.5 font-mono text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'terminal' 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TerminalSquare className="w-4 h-4" />
              TERMINAL INTERATIVO
            </button>
          </nav>

          <AnimatePresence mode="wait">
            {/* TAB 1: COLD WALLET DASHBOARD */}
            {activeTab === 'carteira' && (
              <motion.div
                key="carteira"
                initial={{ opacity: 0, y: 12, x: -6 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -12, x: 6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* BALANCE CARD & QUICK UTILITIES */}
                  <div className="lg:col-span-1 space-y-6">
                
                {/* GRAND TOTAL LEDGER CARD */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-cyan-950/20 border-b border-l border-slate-800 rounded-bl-lg">
                    <span className="text-[9px] text-cyan-400 font-mono font-bold tracking-wider">
                      {isConnected ? 'ONLINE SYNC STATE' : 'FROZEN OFFLINE STATE'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-widest font-black">SALDO TOTAL DA CARTEIRA</p>
                  
                  <div className="mt-3 flex items-baseline gap-1.5">
                    {isConnected ? (
                      <>
                        <span className="text-slate-500 text-xl font-bold font-mono">$</span>
                        <span className="text-4xl font-black font-mono tracking-tight text-white">
                          {grandTotalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      </>
                    ) : (
                      <div className="text-amber-400 font-mono text-lg font-bold">
                        MODO OFFLINE (FIAT OCULTO)
                      </div>
                    )}
                  </div>

                  {/* WMR HIGHLIGHT BADGE */}
                  <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-mono font-black uppercase tracking-wider block">MOEDA PRINCIPAL DA CARTEIRA</span>
                      <span className="text-sm font-black font-mono text-white mt-0.5">{portfolio['WMR'] || 0} WMR</span>
                    </div>
                    {isConnected ? (
                      <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded border border-cyan-400/40">
                        ${((portfolio['WMR'] || 0) * (coins.find(c => c.symbol === 'WMR')?.price || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-600/40 font-bold">
                        DADOS CONGELADOS
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-900/80 font-mono">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Disponível em Fiat</p>
                      <p className="text-sm font-black text-slate-200 mt-0.5">
                        {isConnected ? `$${balanceFiat.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'OCULTO (OFFLINE)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Equivalente Cripto</p>
                      <p className="text-sm font-black text-cyan-400 mt-0.5">
                        {isConnected ? `$${totalCryptoFiatValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'OCULTO (OFFLINE)'}
                      </p>
                    </div>
                  </div>

                  {/* COLD WALLET PUBLIC ADDRESS */}
                  <div className="mt-6 p-3 bg-slate-900/60 border border-slate-800 rounded">
                    <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 mb-1 uppercase tracking-wider">
                      <span>Endereço de Carga Local Vault</span>
                      <span>ECDSA_SHA256</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <code className="text-xs font-mono text-cyan-300 break-all select-all">{LOCAL_VAULT_ADDRESS}</code>
                      <button 
                        onClick={() => handleCopyToClipboard(LOCAL_VAULT_ADDRESS, 'Endereço')}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* DIRECT MODAL TRIGGERS WITH OFFLINE LOCK */}
                  <div className="mt-6 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleInitiateOperation('send')}
                        disabled={!isConnected}
                        className={`py-3 font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all cursor-pointer flex flex-col items-center gap-1.5 border ${
                          isConnected 
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_2px_10px_rgba(6,182,212,0.15)]' 
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </button>

                      <button
                        onClick={() => handleInitiateOperation('receive')}
                        disabled={!isConnected}
                        className={`py-3 font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all cursor-pointer flex flex-col items-center gap-1.5 border ${
                          isConnected 
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_2px_10px_rgba(16,185,129,0.15)]' 
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        Receber
                      </button>

                      <button
                        onClick={() => handleInitiateOperation('sell')}
                        disabled={!isConnected}
                        className={`py-3 font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all cursor-pointer flex flex-col items-center gap-1.5 border ${
                          isConnected 
                            ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 border-purple-300 shadow-[0_2px_10px_rgba(168,85,247,0.15)]' 
                            : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Vender
                      </button>
                    </div>
                    {!isConnected && (
                      <p className="text-[10px] text-amber-400 font-mono text-center pt-1 font-semibold">
                        * Conecte-se ao servidor para realizar operações.
                      </p>
                    )}
                  </div>
                </div>

                {/* SECURITY PROTOCOL CARD */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                    <SlidersHorizontal className="w-4.5 h-4.5 text-cyan-400" />
                    <h3 className="text-xs font-mono font-black text-slate-200 uppercase tracking-wider">Status do Enclave Local</h3>
                  </div>

                  <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Moeda Ativa Principal:</span>
                      <span className="text-cyan-400 font-black">WMR TOKEN</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-900/60">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Cripto Chip Ativo:</span>
                      <span className="text-cyan-400 font-black">AES-GCM-256</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t border-slate-900/60">
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Estado do Servidor:</span>
                      <span className={`font-black ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isConnected ? 'ONLINE (SINCRO ATIVA)' : 'OFFLINE (CONGELADO)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIVE WALLET CRYPTO ASSETS PORTFOLIO */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-xs font-mono font-black text-slate-200 uppercase tracking-widest">Ativos na Carteira (WMR Destaque)</h3>
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isConnected ? 'Sincronizado' : 'Informações Congeladas'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {coins.filter(c => ['WMR', 'DKBT', 'NETH', 'QSOL', 'CYBR'].includes(c.symbol)).map((coin) => {
                      const qty = portfolio[coin.symbol] || 0;
                      const fiatEq = qty * coin.price;
                      return (
                        <div key={coin.symbol} className={`p-4 bg-slate-900/40 hover:bg-slate-900/70 border rounded-lg flex items-center justify-between gap-4 transition-all ${
                          coin.isPrincipal ? 'border-cyan-500/60 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,240,255,0.08)]' : 'border-slate-800/80 hover:border-slate-800'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-950 rounded border flex items-center justify-center text-xs font-mono font-black" style={{ color: coin.color, borderColor: `${coin.color}40` }}>
                              {coin.symbol}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-slate-100">{coin.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono font-semibold">{coin.symbol}</span>
                                {coin.isPrincipal && (
                                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ml-1">
                                    PRINCIPAL
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                {isConnected ? `$${coin.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'OFFLINE (Preço Congelado)'}
                                {isConnected && (
                                  <span className={`text-[10px] ml-1.5 font-bold ${coin.variation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {coin.variation >= 0 ? '+' : ''}{coin.variation}%
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* SVG interactive sparkline mini graph */}
                          <div className="hidden sm:block">
                            {renderSparkline(coin.history, coin.color)}
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black font-mono text-slate-100">{qty.toLocaleString('pt-BR', {maximumFractionDigits: 6})} {coin.symbol}</p>
                            <p className="text-xs font-mono text-cyan-400 mt-0.5">
                              {isConnected ? `$${fiatEq.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Fiat Oculto'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HISTÓRICO DE TRANSAÇÕES */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-xs font-mono font-black text-slate-200 uppercase tracking-widest">Histórico de Transações e Bancos</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Clear All History Button */}
                      {transactions.length > 0 && (
                        <button
                          onClick={handleClearAllTransactions}
                          className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/60 rounded font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                          title="Excluir TODO o Histórico de Transações"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          <span>Zerar Histórico</span>
                        </button>
                      )}

                      {/* Filter tabs */}
                      <div className="flex flex-wrap gap-1 font-mono text-[9px] font-bold">
                        {(['TODAS', 'ENVIADO', 'RECEBIDO', 'COMPRA', 'VENDA'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => {
                              setTxHistoryFilter(filter);
                              playBeep('click');
                            }}
                            className={`px-2 py-1 rounded border transition-colors cursor-pointer uppercase ${
                              txHistoryFilter === filter 
                                ? 'bg-cyan-950/30 text-cyan-300 border-cyan-500/40' 
                                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 font-mono text-xs">
                        Nenhuma transação registrada nesta categoria. Histórico limpo.
                      </div>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <div key={tx.id} className="p-3 bg-slate-900/40 border border-slate-800/60 hover:border-slate-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded text-[10px] font-mono font-black w-20 text-center ${
                              tx.type === 'RECEBIDO' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                              tx.type === 'ENVIADO' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                              tx.type === 'COMPRA' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' :
                              'bg-purple-950/40 text-purple-400 border border-purple-500/20'
                            }`}>
                              {tx.type}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-200">{tx.amount} {tx.coinSymbol}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({tx.id})</span>
                                {tx.bankName && (
                                  <span className="inline-flex items-center gap-1 text-[9px] bg-slate-800/90 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700 font-bold font-mono">
                                    <Landmark className="w-2.5 h-2.5 text-cyan-400" />
                                    {tx.bankName}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.timestamp} • {tx.address.substring(0, 24)}...</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-900">
                            <div className="text-right">
                              <span className="text-xs font-bold font-mono text-slate-100 block">
                                {isConnected ? `$${tx.fiatValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Fiat Oculto'}
                              </span>
                              <span className="text-[9px] bg-slate-950/60 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider mt-0.5 uppercase inline-block">
                                {tx.status}
                              </span>
                            </div>

                            {/* Delete single transaction button */}
                            <button
                              onClick={() => handleDeleteSingleTransaction(tx.id)}
                              className="p-1.5 hover:bg-red-950/80 text-slate-500 hover:text-red-400 rounded border border-transparent hover:border-red-800/60 transition-all cursor-pointer"
                              title="Excluir esta transação individual"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

            {/* TAB 2: CRYPTO MARKET INDEX */}
            {activeTab === 'mercado' && (
              <motion.div
                key="mercado"
                initial={{ opacity: 0, y: 12, x: -6 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -12, x: 6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                  
                  {/* FILTER / HEADER CONTROLS */}
                  <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 border-b border-slate-900 pb-5 mb-5">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <div>
                        <h3 className="text-xs font-mono font-black text-slate-200 uppercase tracking-widest">Cotação de Criptoativos da Carteira</h3>
                        <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-0.5">
                          {isConnected ? '18 criptomoedas atualizando online' : 'Informações congeladas (Conecte ao servidor para atualizar)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por nome ou sigla..."
                          className="bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs font-mono py-2 pl-9 pr-4 rounded text-slate-200 outline-none w-full sm:w-60"
                        />
                      </div>

                      {/* Filter Gainers/Losers */}
                      <div className="flex border border-slate-800 rounded overflow-hidden text-xs font-mono">
                        <button
                          onClick={() => setMarketFilter('all')}
                          className={`px-3 py-2 ${marketFilter === 'all' ? 'bg-cyan-950 text-cyan-300 font-bold' : 'bg-slate-900 text-slate-400'}`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setMarketFilter('gainers')}
                          className={`px-3 py-2 ${marketFilter === 'gainers' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'bg-slate-900 text-slate-400'}`}
                        >
                          +Altas
                        </button>
                        <button
                          onClick={() => setMarketFilter('losers')}
                          className={`px-3 py-2 ${marketFilter === 'losers' ? 'bg-red-950 text-red-300 font-bold' : 'bg-slate-900 text-slate-400'}`}
                        >
                          -Baixas
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COINS TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4"># Moeda</th>
                          <th className="py-3 px-4">Preço (USD)</th>
                          <th className="py-3 px-4">Variação 24h</th>
                          <th className="py-3 px-4 hidden md:table-cell">Tendência Sparkline</th>
                          <th className="py-3 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-xs font-mono">
                        {filteredCoins.map((coin, index) => (
                          <tr key={coin.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <span className="text-slate-600 font-bold w-4">{index + 1}</span>
                                <div className="p-1.5 bg-slate-950 border rounded text-xs font-black" style={{ color: coin.color, borderColor: `${coin.color}40` }}>
                                  {coin.symbol}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                    {coin.name}
                                    {coin.isPrincipal && (
                                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-1 py-0.2 rounded">WMR</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{coin.symbol}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-100">
                              {isConnected ? `$${coin.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'OFFLINE'}
                            </td>

                            <td className="py-3.5 px-4 font-bold">
                              {isConnected ? (
                                <span className={coin.variation >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {coin.variation >= 0 ? '+' : ''}{coin.variation}%
                                </span>
                              ) : (
                                <span className="text-slate-500">Congelado</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 hidden md:table-cell">
                              {renderSparkline(coin.history, coin.color)}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleInitiateOperation('buy', coin.symbol)}
                                disabled={!isConnected}
                                className={`px-3 py-1.5 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                                  isConnected 
                                    ? 'bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300' 
                                    : 'bg-slate-900 text-slate-600 border border-slate-800 opacity-40 cursor-not-allowed'
                                }`}
                              >
                                Comprar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: TERMINAL INTERATIVO */}
            {activeTab === 'terminal' && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, y: 12, x: -6 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -12, x: 6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl font-mono text-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <TerminalSquare className="w-5 h-5" />
                      <span className="font-bold uppercase tracking-wider">Terminal Virtual de Comandos Cold Enclave</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Digite "help" para lista de comandos</span>
                  </div>

                  <div className="bg-[#02040a] border border-slate-900 p-4 rounded-lg h-80 overflow-y-auto custom-scrollbar space-y-1 text-emerald-400">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">{log}</div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>

                  <form onSubmit={handleTerminalSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-cyan-400 font-bold">$</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="Digite um comando (ex: help, balance, connect, disconnect)..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 text-slate-200 py-2 pl-7 pr-3 rounded outline-none font-mono text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded cursor-pointer"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* MODAL DE SENHA DA OPERAÇÃO */}
      {pwdModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-950 border-2 border-amber-500/60 p-6 rounded-xl shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-amber-950/40 border border-amber-500/30 rounded-full text-amber-400 mb-1">
                <Key className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-black font-mono text-amber-400 uppercase tracking-wider">
                AUTENTICAÇÃO DE OPERAÇÃO: {pwdModal.opType.toUpperCase()}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Informe a senha cadastrada no servidor para autorizar esta transação.
              </p>
            </div>

            <form onSubmit={handleVerifyOperationPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={pwdModal.inputPassword}
                  onChange={(e) => setPwdModal({ ...pwdModal, inputPassword: e.target.value, error: null })}
                  placeholder="Digite a senha..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest text-slate-100 outline-none"
                  autoFocus
                  required
                />
                {pwdModal.error && (
                  <p className="text-xs text-rose-400 font-mono text-center font-bold mt-2 animate-bounce">
                    {pwdModal.error}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPwdModal({ open: false, opType: 'buy', inputPassword: '', error: null, pendingAction: null })}
                  className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded border border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded cursor-pointer shadow-lg"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS STANDARD (SEND / RECEIVE / SELL / BUY) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 p-6 rounded-xl shadow-2xl space-y-4 font-mono text-xs">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                {activeModal === 'send' && <Send className="w-4 h-4" />}
                {activeModal === 'receive' && <Download className="w-4 h-4" />}
                {activeModal === 'sell' && <RefreshCw className="w-4 h-4" />}
                {activeModal === 'buy' && <Plus className="w-4 h-4" />}
                {activeModal.toUpperCase()} - {modalSelectedCoin.name} ({modalSelectedCoin.symbol})
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-500 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* RECEIVE MODAL */}
            {activeModal === 'receive' && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Endereço de Carga Local Vault</span>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono font-bold">COLD STORAGE</span>
                  </div>
                  <div className="text-cyan-200 font-mono text-xs sm:text-sm font-bold break-all bg-slate-950 p-2.5 rounded border border-slate-800 select-all">
                    {LOCAL_VAULT_ADDRESS}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Utilize este endereço local padrão de custódia para receber depósitos de {modalSelectedCoin.name} ({modalSelectedCoin.symbol}).
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyToClipboard(LOCAL_VAULT_ADDRESS, 'Endereço Local Vault')}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded uppercase tracking-wider font-mono cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copiar Endereço Local Vault
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-900 flex justify-between items-center">
                  <span>REDE: KALI COLD LEDGER</span>
                  <span>PROTOCOLO: SECP256K1</span>
                </div>
              </div>
            )}

            {/* SEND MODAL */}
            {activeModal === 'send' && (
              <form onSubmit={handleConfirmSend} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-2">Opção de Envio:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSendMode('crypto');
                        setModalAddress(LOCAL_VAULT_ADDRESS);
                      }}
                      className={`p-2.5 rounded font-mono text-xs font-bold border transition-all cursor-pointer text-center ${
                        sendMode === 'crypto' 
                          ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Outra Carteira Crypto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSendMode('bank');
                        setModalAddress('');
                      }}
                      className={`p-2.5 rounded font-mono text-xs font-bold border transition-all cursor-pointer text-center ${
                        sendMode === 'bank' 
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Transferência Bancária ($)
                    </button>
                  </div>
                </div>

                {sendMode === 'bank' && (
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Selecione a Corretagem:</label>
                    <select
                      value={sendBrokerage}
                      onChange={(e) => setSendBrokerage(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-mono text-xs"
                    >
                      {BROKERAGE_OPTIONS_SEND.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.deadline} • {b.fee})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-400 text-[10px] uppercase font-bold">Quantidade ({modalSelectedCoin.symbol}):</label>
                    <span className="text-[10px] text-slate-500 font-mono">Disponível: {portfolio[modalSelectedCoin.symbol] || 0} {modalSelectedCoin.symbol}</span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-bold font-mono"
                    required
                  />
                  {modalAmount && (
                    <p className="text-[10px] text-cyan-400 mt-1 font-mono">
                      Equivalente em Fiat: ${(parseFloat(modalAmount || '0') * modalSelectedCoin.price).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-400 text-[10px] uppercase font-bold">
                      {sendMode === 'crypto' ? 'Endereço da Carteira Cripto / Vault de Destino:' : 'Destino Bancário (Chave PIX ou Conta):'}
                    </label>
                    {sendMode === 'crypto' && (
                      <button
                        type="button"
                        onClick={() => setModalAddress(LOCAL_VAULT_ADDRESS)}
                        className="text-[9px] text-cyan-400 hover:underline font-mono"
                      >
                        Usar Vault Local
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={modalAddress}
                    onChange={(e) => setModalAddress(e.target.value)}
                    placeholder={sendMode === 'crypto' ? `Ex: ${LOCAL_VAULT_ADDRESS}` : 'Ex: 8f3b2a1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c ou Dados Bancários'}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded p-2.5 text-slate-100 font-mono text-xs outline-none"
                    required
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded cursor-pointer font-mono font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingTx}
                    className="w-1/2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded cursor-pointer shadow-lg font-mono"
                  >
                    {isProcessingTx ? 'Processando...' : 'Confirmar Envio'}
                  </button>
                </div>
              </form>
            )}

            {/* SELL MODAL */}
            {activeModal === 'sell' && (
              <form onSubmit={handleConfirmSell} className="space-y-4">
                {coins.filter(c => (portfolio[c.symbol] || 0) > 0).length === 0 ? (
                  <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-lg text-center space-y-3 font-mono">
                    <p className="text-rose-300 font-bold text-xs">Nenhuma criptomoeda com saldo disponível para venda na carteira.</p>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded font-bold cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Selecione a Criptomoeda com Saldo:</label>
                      <select
                        value={modalSelectedCoin.symbol}
                        onChange={(e) => {
                          const coin = coins.find(c => c.symbol === e.target.value);
                          if (coin) setModalSelectedCoin(coin);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-mono text-xs font-bold"
                      >
                        {coins.filter(c => (portfolio[c.symbol] || 0) > 0).map((c) => (
                          <option key={c.symbol} value={c.symbol}>
                            {c.name} ({c.symbol}) - Saldo: {portfolio[c.symbol]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Selecione a Corretagem:</label>
                      <select
                        value={modalSelectedBank}
                        onChange={(e) => setModalSelectedBank(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-mono text-xs"
                      >
                        {SELL_BROKERAGES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-slate-400 text-[10px] uppercase font-bold">Quantidade a Vender ({modalSelectedCoin.symbol}):</label>
                        <span className="text-[10px] text-slate-500 font-mono">Max: {portfolio[modalSelectedCoin.symbol] || 0}</span>
                      </div>
                      <input
                        type="number"
                        step="0.0001"
                        value={modalAmount}
                        onChange={(e) => setModalAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-bold font-mono"
                        required
                      />
                      {modalAmount && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                          Valor Estimado: ${(parseFloat(modalAmount || '0') * modalSelectedCoin.price).toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                        Destino para Recebimento:
                      </label>
                      <input
                        type="text"
                        value={modalAddress}
                        onChange={(e) => setModalAddress(e.target.value)}
                        placeholder="Endereço de destino ou Chave PIX"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded p-2.5 text-slate-100 font-mono text-xs outline-none"
                        required
                      />
                    </div>

                    <div className="pt-2 flex gap-2 font-mono">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded cursor-pointer font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingTx}
                        className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded cursor-pointer shadow-lg"
                      >
                        {isProcessingTx ? 'Processando...' : 'Confirmar Venda'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* BUY MODAL */}
            {activeModal === 'buy' && (
              <form onSubmit={handleConfirmBuy} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Selecione o Banco Parceiro:</label>
                  <select
                    value={modalSelectedBank}
                    onChange={(e) => setModalSelectedBank(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-mono text-xs"
                  >
                    {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Quantidade a Comprar ({modalSelectedCoin.symbol}):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-100 outline-none font-bold font-mono"
                    required
                  />
                  {modalAmount && (
                    <p className="text-[10px] text-cyan-400 mt-1 font-mono">
                      Custo Estimado: ${(parseFloat(modalAmount || '0') * modalSelectedCoin.price).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded cursor-pointer font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingTx}
                    className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded cursor-pointer shadow-lg"
                  >
                    {isProcessingTx ? 'Processando...' : 'Confirmar Compra'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
