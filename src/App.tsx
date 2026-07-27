/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Shield, ShieldAlert, Terminal, Send, Download, RefreshCw, 
  Copy, Check, Search, Activity, TrendingUp, TrendingDown, 
  Sparkles, Clock, AlertTriangle, SlidersHorizontal, 
  WifiOff, Database, Cpu, Zap, Ghost, Flame, Eye, Play, Volume2, VolumeX,
  Trash2, TerminalSquare, Info, CircleCheck, Building2, Landmark
} from 'lucide-react';

// Cryptocurrencies configuration
interface Coin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  variation: number; // 24h variation
  marketCap: number;
  volume: number;
  history: number[]; // For sparklines
  iconName: string;
  color: string;
  isPrincipal?: boolean;
}

interface Transaction {
  id: string;
  timestamp: string;
  type: 'ENVIADO' | 'RECEBIDO' | 'COMPRA' | 'VENDA';
  coinSymbol: string;
  amount: number;
  fiatValue: number;
  address: string;
  bankName?: string;
  hash: string;
  status: 'SUCCESS' | 'SECURED_LOCAL' | 'PENDING';
}

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

const INITIAL_TRANSACTIONS: Transaction[] = [
  { 
    id: 'TX-94812P', 
    timestamp: new Date().toLocaleString('pt-BR').substring(0, 16), 
    type: 'VENDA', 
    coinSymbol: 'WMR', 
    amount: 0.0024, 
    fiatValue: 444.48, 
    address: 'RESGATE BANCÁRIO (PagBank • ~R$ 2.444,64)', 
    bankName: 'PagBank', 
    hash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', 
    status: 'SECURED_LOCAL' 
  },
  { 
    id: 'TX-83920P', 
    timestamp: new Date().toLocaleString('pt-BR').substring(0, 16), 
    type: 'VENDA', 
    coinSymbol: 'NETH', 
    amount: 0.11, 
    fiatValue: 376.20, 
    address: 'RESGATE BANCÁRIO (PagBank • ~R$ 2.069,10)', 
    bankName: 'PagBank', 
    hash: '1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c', 
    status: 'SECURED_LOCAL' 
  },
  { 
    id: 'TX-72019P', 
    timestamp: new Date().toLocaleString('pt-BR').substring(0, 16), 
    type: 'VENDA', 
    coinSymbol: 'QSOL', 
    amount: 1.9, 
    fiatValue: 270.75, 
    address: 'RESGATE BANCÁRIO (PagBank • ~R$ 1.489,12)', 
    bankName: 'PagBank', 
    hash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', 
    status: 'SECURED_LOCAL' 
  }
];

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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [passcode, setPasscode] = useState<string>('');
  const [loginError, setLoginError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'carteira' | 'mercado' | 'terminal'>('carteira');
  
  // Dynamic Live Date & Time
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
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
  }, []);

  // Terminal Logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'KALI COLD VAULT OS [v3.2.0-secure] inicializado.',
    'Isolação de Rede Completa: INTERFACE RJ45/WIFI DESATIVADA.',
    'MOEDA PRINCIPAL DA CARTEIRA: WMR TOKEN (WMR)',
    'Estado atual: OFFLINE SECURE VAULT.',
    'Digite "help" para ver os comandos do terminal virtual.'
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

  // Boot screen specific logs
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [bootStep, setBootStep] = useState<number>(0);

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
      const vaultVersion = localStorage.getItem('kali_vault_v5_pagbank');
      if (!vaultVersion) {
        localStorage.clear();
        localStorage.setItem('kali_vault_v5_pagbank', 'true');
        setBalanceFiat(6323.00);
        setPortfolio(INITIAL_PORTFOLIO);
        setTransactions(INITIAL_TRANSACTIONS);
        return;
      }

      const storedBalance = localStorage.getItem('kali_balance_fiat');
      const storedPortfolio = localStorage.getItem('kali_portfolio');
      const storedTransactions = localStorage.getItem('kali_transactions');
      const storedSound = localStorage.getItem('kali_sound');
      
      if (storedBalance) setBalanceFiat(parseFloat(storedBalance));
      if (storedPortfolio) setPortfolio(JSON.parse(storedPortfolio));
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
      if (storedSound) setSoundEnabled(storedSound === 'true');
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }, []);

  // Sync state to localstorage
  useEffect(() => {
    try {
      localStorage.setItem('kali_balance_fiat', balanceFiat.toString());
      localStorage.setItem('kali_portfolio', JSON.stringify(portfolio));
      localStorage.setItem('kali_transactions', JSON.stringify(transactions));
      localStorage.setItem('kali_sound', soundEnabled.toString());
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  }, [balanceFiat, portfolio, transactions, soundEnabled]);

  // Handle Boot logs sequence loading
  useEffect(() => {
    if (currentScreen !== 'boot') return;
    
    const bootSteps = [
      { t: 'KALI_SECURE_OS CORE INIT (v3.2.0-isolated)...', d: 300 },
      { t: '-> Verifying bootloader signature... [OK]', d: 250 },
      { t: '-> Initializing cryptographic offline key store...', d: 350 },
      { t: '-> SECP256K1 key storage integrity: APPROVED', d: 200 },
      { t: '-> Mounting sandbox cold file system partition... [/dev/sdb1]', d: 400 },
      { t: '-> PRINCIPAL ASSET ATTACHED: WMR TOKEN (WMR)', d: 300 },
      { t: '[✓] OFFLINE COLD HARDBOUND BRIDGE UNLOCKED', d: 250 },
      { t: '-> Connecting to local blockchain node sync...', d: 450 },
      { t: '-> Local sync success: 12 nodes verified offline.', d: 200 },
      { t: '-> Loading 18 cryptocurrency market indices... DONE', d: 300 },
      { t: '[🔒] SECURITY LEVEL 4 SECURE VAULT COLD WALLET ATTACHED', d: 300 },
      { t: 'Pronto para entrada de chave de segurança do usuário.', d: 100 }
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

  // Dynamic price variations
  useEffect(() => {
    if (currentScreen !== 'dashboard' && currentScreen !== 'market') return;

    const interval = setInterval(() => {
      setCoins((prevCoins) => {
        return prevCoins.map((coin) => {
          if (coin.symbol === 'ZST') return coin;

          const percentShift = (Math.random() * 3.3 - 1.5) / 100;
          const newPrice = Math.max(0.001, coin.price * (1 + percentShift));
          const newHistory = [...coin.history.slice(1), newPrice];
          const newVar = parseFloat((coin.variation + percentShift * 100).toFixed(2));
          
          return {
            ...coin,
            price: parseFloat(newPrice.toFixed(coin.price > 1000 ? 2 : 4)),
            variation: newVar,
            history: newHistory
          };
        });
      });
      
      if (Math.random() < 0.15) {
        const auditMsgs = [
          'AUDIT: Local wallet integrity re-verified successfully.',
          'WMR CORE: Transmitting heartbeat block index...',
          'SYS: Sandbox memory partition checked. 0 leaks.',
          'CRYPTO-ENGINE: AES-256 state active.',
          'KALI-FIREWALL: Blocked 0 inbound requests (Isolated).'
        ];
        const randomAudit = auditMsgs[Math.floor(Math.random() * auditMsgs.length)];
        setTerminalLogs((prev) => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${randomAudit}`]);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  // Keep terminal logs auto-scrolling
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
      addToast('Acesso autorizado. Bem-vindo ao Cold Vault.', 'success');
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

  // Copy helper
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    playBeep('click');
    addToast(`${label} copiado para a área de transferência!`, 'success');
  };

  // Open modals setup
  const openModal = (type: 'receive' | 'send' | 'sell' | 'buy', coinSymbol?: string) => {
    playBeep('click');
    const coin = coins.find((c) => c.symbol === (coinSymbol || 'WMR')) || coins[0];
    setModalSelectedCoin(coin);
    setModalSelectedBank(BANK_OPTIONS[0]);
    setModalAmount('');
    setModalAddress('');
    setTxSuccessInfo(null);
    setActiveModal(type);
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
      addToast('Endereço de destino obrigatório!', 'error');
      return;
    }

    setIsProcessingTx(true);
    playBeep('click');

    setTimeout(() => {
      const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const fiatEq = amountNum * modalSelectedCoin.price;

      setPortfolio(prev => ({
        ...prev,
        [modalSelectedCoin.symbol]: parseFloat((availableAmount - amountNum).toFixed(6))
      }));

      const newTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
        type: 'ENVIADO',
        coinSymbol: modalSelectedCoin.symbol,
        amount: amountNum,
        fiatValue: parseFloat(fiatEq.toFixed(2)),
        address: modalAddress,
        bankName: modalSelectedBank,
        hash: generatedHash,
        status: 'SECURED_LOCAL'
      };

      setTransactions(prev => [newTx, ...prev]);
      setIsProcessingTx(false);
      setTxSuccessInfo(newTx);
      playBeep('success');
      addToast(`Transferência enviada com sucesso!`, 'success');
      
      setTerminalLogs(prev => [...prev, 
        `[${new Date().toLocaleTimeString()}] TRANS-OUT: ${amountNum} ${modalSelectedCoin.symbol} (${modalSelectedBank}) -> ${modalAddress.substring(0,10)}...`
      ]);
    }, 1800);
  };

  // Run sell transaction (Crypto to USD fiat)
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

    setIsProcessingTx(true);
    playBeep('click');

    setTimeout(() => {
      const sellValue = amountNum * modalSelectedCoin.price;
      const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      setPortfolio(prev => ({
        ...prev,
        [modalSelectedCoin.symbol]: parseFloat((availableAmount - amountNum).toFixed(6))
      }));
      setBalanceFiat(prev => parseFloat((prev + sellValue).toFixed(2)));

      const newTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
        type: 'VENDA',
        coinSymbol: modalSelectedCoin.symbol,
        amount: amountNum,
        fiatValue: parseFloat(sellValue.toFixed(2)),
        address: `RESGATE BANCÁRIO (${modalSelectedBank})`,
        bankName: modalSelectedBank,
        hash: generatedHash,
        status: 'SECURED_LOCAL'
      };

      setTransactions(prev => [newTx, ...prev]);
      setIsProcessingTx(false);
      setTxSuccessInfo(newTx);
      playBeep('success');
      addToast(`Venda realizada: +$${sellValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})} creditados via ${modalSelectedBank}.`, 'success');
      
      setTerminalLogs(prev => [...prev, 
        `[${new Date().toLocaleTimeString()}] SELL-ORDER: Converteu ${amountNum} ${modalSelectedCoin.symbol} para $${sellValue.toFixed(2)} (${modalSelectedBank})`
      ]);
    }, 1500);
  };

  // Run buy transaction (USD fiat to Crypto)
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
      addToast('Saldo USD Fiat insuficiente!', 'error');
      return;
    }

    setIsProcessingTx(true);
    playBeep('click');

    setTimeout(() => {
      const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

      setBalanceFiat(prev => parseFloat((prev - totalCost).toFixed(2)));
      setPortfolio(prev => ({
        ...prev,
        [modalSelectedCoin.symbol]: parseFloat(((prev[modalSelectedCoin.symbol] || 0) + amountNum).toFixed(6))
      }));

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
        status: 'SECURED_LOCAL'
      };

      setTransactions(prev => [newTx, ...prev]);
      setIsProcessingTx(false);
      setTxSuccessInfo(newTx);
      playBeep('success');
      addToast(`Compra efetuada: -$${totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})} via ${modalSelectedBank}.`, 'success');

      setTerminalLogs(prev => [...prev, 
        `[${new Date().toLocaleTimeString()}] BUY-ORDER: Comprou ${amountNum} ${modalSelectedCoin.symbol} por $${totalCost.toFixed(2)} (${modalSelectedBank})`
      ]);
    }, 1500);
  };

  // Receive modal manual add
  const handleSimulateReceiveFund = () => {
    const receiveAmount = modalSelectedCoin.symbol === 'WMR' ? 1.0 : (modalSelectedCoin.symbol === 'DKBT' ? 0.05 : 5.0);
    const fiatValue = receiveAmount * modalSelectedCoin.price;
    const generatedHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    playBeep('success');
    addToast(`Recebimento efetuado via ${modalSelectedBank}: +${receiveAmount} ${modalSelectedCoin.symbol}`, 'success');

    setPortfolio(prev => ({
      ...prev,
      [modalSelectedCoin.symbol]: parseFloat(((prev[modalSelectedCoin.symbol] || 0) + receiveAmount).toFixed(6))
    }));

    const newTx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toLocaleString('pt-BR').substring(0, 16),
      type: 'RECEBIDO',
      coinSymbol: modalSelectedCoin.symbol,
      amount: receiveAmount,
      fiatValue: parseFloat(fiatValue.toFixed(2)),
      address: `0xKALI_LOCAL_${modalSelectedCoin.symbol}_VAULT`,
      bankName: modalSelectedBank,
      hash: generatedHash,
      status: 'SECURED_LOCAL'
    };

    setTransactions(prev => [newTx, ...prev]);
    setActiveModal(null);

    setTerminalLogs(prev => [...prev, 
      `[${new Date().toLocaleTimeString()}] TRANS-IN: Recebeu +${receiveAmount} ${modalSelectedCoin.symbol} (${modalSelectedBank})`
    ]);
  };

  // Reset local application
  const handleResetApp = () => {
    if (confirm('Aviso de Segurança: Deseja formatar as partições da carteira local e redefinir as chaves?')) {
      try {
        localStorage.clear();
        localStorage.setItem('kali_vault_v5_pagbank', 'true');
      } catch (e) {
        console.warn('localStorage clear failed:', e);
      }
      setBalanceFiat(6323.00);
      setPortfolio(INITIAL_PORTFOLIO);
      setCoins(INITIAL_COINS);
      setTransactions(INITIAL_TRANSACTIONS);
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
      newLogs.push('COMANDOS DISPONÍVEIS:');
      newLogs.push('  balance        - Exibe o saldo da carteira e moedas em custódia');
      newLogs.push('  wmr            - Detalhes e cotação da moeda principal WMR Token');
      newLogs.push('  banks          - Lista os bancos suportados para transferências');
      newLogs.push('  coins          - Lista todas as 18 criptomoedas ativas');
      newLogs.push('  clear          - Limpa o histórico da tela do terminal');
      newLogs.push('  audit          - Executa auditoria de integridade do enclave');
      newLogs.push('  status         - Exibe métricas e isolamento do sistema');
    } else if (cmd === 'balance') {
      newLogs.push(`SALDO DISPONÍVEL FIAT: $${balanceFiat.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
      newLogs.push('PORTFÓLIO ATIVO:');
      Object.entries(portfolio).forEach(([symbol, qty]) => {
        const coin = coins.find((c) => c.symbol === symbol);
        const qtyNum = typeof qty === 'number' ? qty : parseFloat(qty as any) || 0;
        const val = qtyNum * (coin ? coin.price : 0);
        newLogs.push(`  • ${symbol}: ${qtyNum} ($${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})})`);
      });
    } else if (cmd === 'wmr') {
      const wmrCoin = coins.find(c => c.symbol === 'WMR');
      newLogs.push(`[WMR TOKEN - MOEDA PRINCIPAL]`);
      newLogs.push(`  Preço Atual: $${wmrCoin?.price.toLocaleString()}`);
      newLogs.push(`  Variação 24h: +${wmrCoin?.variation}%`);
      newLogs.push(`  Custódia na Carteira: ${portfolio['WMR'] || 0} WMR ($${((portfolio['WMR'] || 0) * (wmrCoin?.price || 0)).toLocaleString()})`);
    } else if (cmd === 'banks') {
      newLogs.push('BANCOS PARCEIROS REGISTRADOS:');
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
      newLogs.push('-> Executando checagem SHA256 em todas as chaves privadas...');
      newLogs.push('-> Hash de integridade WMR: INTEGRIDADE OK');
      newLogs.push('-> Teste de isolamento de rede: 0 pacotes vazados.');
      newLogs.push('[✓] AUDITORIA CONCLUÍDA - NENHUMA VULNERABILIDADE ENCONTRADA');
    } else if (cmd === 'status') {
      newLogs.push(`SISTEMA: KALI COLD VAULT OS v3.2.0`);
      newLogs.push(`DATA DO SISTEMA: ${currentDateTime}`);
      newLogs.push(`REDE: OFFLINE ISOLATED (RJ45/WiFi OFF)`);
      newLogs.push(`ENCLAVE AES: ATIVO E SELADO`);
    } else {
      newLogs.push(`Comando não reconhecido: "${cmd}". Digite "help" para ver os comandos.`);
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
              t.type === 'warning' ? 'bg-yellow-950/90 border-yellow-500 text-yellow-300' :
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

      {/* ========================================================= */}
      {/* SCREEN 1: BOOTING SEQUENCE                                */}
      {/* ========================================================= */}
      {currentScreen === 'boot' && (
        <div id="boot-screen" className="fixed inset-0 z-50 bg-[#02040a] flex flex-col justify-between p-6 md:p-12 font-mono text-emerald-400">
          <div className="max-w-4xl w-full mx-auto flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pt-4">
            <div className="flex items-center gap-3 text-cyan-400 mb-6 border-b border-cyan-900/40 pb-4">
              <Terminal className="w-8 h-8 animate-pulse text-cyan-400" />
              <div>
                <h1 className="text-xl font-bold tracking-widest text-cyan-400">KALI SECURE CRYPTO COLD STORAGE</h1>
                <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">SISTEMA DE CARTEIRA OFFLINE COM CRIPTOGRAFIA DE GRAU MILITAR</p>
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
            <div>VAULT STATUS: [ISOLADO DA REDE]</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>OFFLINE ENCRYPTED SECURE_BRIDGE ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREEN 2: LOGIN COMPONENT                                 */}
      {/* ========================================================= */}
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
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-1">DISPOSITIVO DE SEGURANÇA OFFLINE</p>
              
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

              <div className="pt-2 text-center text-[10px] text-slate-500 font-mono font-semibold uppercase tracking-wider">
                SISTEMA OPERACIONAL PROTEGIDO POR CRIPTOGRAFIA DE GRAU MILITAR
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CORE WALLET LAYOUT                                        */}
      {/* ========================================================= */}
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
                  <span className="text-[10px] bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded font-bold font-mono">V3.2-OFFLINE</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono uppercase tracking-wider">SISTEMA SEGURO ISOLADO • MOEDA PRINCIPAL WMR</span>
                </div>
              </div>
            </div>

            {/* Dynamic Real-time Date and Time Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-400 font-mono font-bold">
              <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>BLOCO LOCAL: <span className="text-cyan-400">#592.108</span></span>
              </div>
              <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-emerald-400" />
                <span>REDE: <span className="text-emerald-400">OFFLINE SEGURO</span></span>
              </div>
              <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="uppercase text-amber-300">{currentDateTime || '2026'}</span>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
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
                  addToast('Carteira bloqueada. Insira sua chave (CryptoGui) novamente.', 'info');
                }}
                className="p-2 border border-slate-800 hover:border-amber-500 hover:text-amber-400 rounded text-slate-400 transition-colors cursor-pointer"
                title="Bloquear Carteira"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </header>

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

          {/* ========================================================= */}
          {/* TAB 1: COLD WALLET DASHBOARD                              */}
          {/* ========================================================= */}
          {activeTab === 'carteira' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* BALANCE CARD & QUICK UTILITIES */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* GRAND TOTAL LEDGER CARD */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-cyan-950/20 border-b border-l border-slate-800 rounded-bl-lg">
                    <span className="text-[9px] text-cyan-400 font-mono font-bold tracking-wider">OFFLINE ENCRYPTED STATE</span>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-widest font-black">SALDO TOTAL DA CARTEIRA</p>
                  
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-slate-500 text-xl font-bold font-mono">$</span>
                    <span className="text-4xl font-black font-mono tracking-tight text-white">
                      {grandTotalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                  </div>

                  {/* WMR HIGHLIGHT BADGE */}
                  <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-mono font-black uppercase tracking-wider block">MOEDA PRINCIPAL DA CARTEIRA</span>
                      <span className="text-sm font-black font-mono text-white mt-0.5">{portfolio['WMR'] || 0} WMR</span>
                    </div>
                    <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded border border-cyan-400/40">
                      ${((portfolio['WMR'] || 0) * (coins.find(c => c.symbol === 'WMR')?.price || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-900/80 font-mono">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Disponível em Fiat</p>
                      <p className="text-sm font-black text-slate-200 mt-0.5">${balanceFiat.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Equivalente Cripto</p>
                      <p className="text-sm font-black text-cyan-400 mt-0.5">${totalCryptoFiatValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>

                  {/* COLD WALLET PUBLIC ADDRESS */}
                  <div className="mt-6 p-3 bg-slate-900/60 border border-slate-800 rounded">
                    <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 mb-1 uppercase tracking-wider">
                      <span>Endereço de Carga Local Vault</span>
                      <span>ECDSA_SHA256</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <code className="text-xs font-mono text-cyan-300 break-all select-all">0xKALI_LOCAL_COLD_VAULT_f4b7a77ff</code>
                      <button 
                        onClick={() => handleCopyToClipboard('0xKALI_LOCAL_COLD_VAULT_f4b7a77ff', 'Endereço')}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* DIRECT MODAL TRIGGERS */}
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openModal('send')}
                      className="py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all cursor-pointer shadow-[0_2px_10px_rgba(6,182,212,0.15)] hover:shadow-[0_4px_15px_rgba(6,182,212,0.3)] flex flex-col items-center gap-1.5 border border-cyan-300"
                    >
                      <Send className="w-4 h-4" />
                      Enviar
                    </button>
                    <button
                      onClick={() => openModal('receive')}
                      className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all cursor-pointer shadow-[0_2px_10px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_15px_rgba(16,185,129,0.3)] flex flex-col items-center gap-1.5 border border-emerald-300"
                    >
                      <Download className="w-4 h-4" />
                      Receber
                    </button>
                    <button
                      onClick={() => openModal('sell')}
                      className="py-3 bg-purple-500 hover:bg-purple-400 text-slate-950 font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all cursor-pointer shadow-[0_2px_10px_rgba(168,85,247,0.15)] hover:shadow-[0_4px_15px_rgba(168,85,247,0.3)] flex flex-col items-center gap-1.5 border border-purple-300"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Vender
                    </button>
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
                      <span className="text-slate-500 font-semibold uppercase tracking-wider">Integridade Sandbox:</span>
                      <span className="text-emerald-400 font-black">SECURE_VAULT_OK</span>
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
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">ISOLADOS DA REDE</span>
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
                                ${coin.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                <span className={`text-[10px] ml-1.5 font-bold ${coin.variation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {coin.variation >= 0 ? '+' : ''}{coin.variation}%
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* SVG interactive sparkline mini graph */}
                          <div className="hidden sm:block">
                            {renderSparkline(coin.history, coin.color)}
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black font-mono text-slate-100">{qty.toLocaleString('pt-BR', {maximumFractionDigits: 6})} {coin.symbol}</p>
                            <p className="text-xs font-mono text-cyan-400 mt-0.5">${fiatEq.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
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
                    
                    {/* Filter tabs */}
                    <div className="flex flex-wrap gap-1.5 font-mono text-[9px] font-bold">
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

                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 font-mono text-xs">
                        Nenhuma transação registrada nesta categoria.
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

                          <div className="text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 sm:gap-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-900">
                            <span className="text-xs font-bold font-mono text-slate-100">${tx.fiatValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            <span className="text-[9px] bg-slate-950/60 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider mt-0.5 uppercase">
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CRYPTO MARKET INDEX (18 FUTURISTIC COINS WITH WMR) */}
          {/* ========================================================= */}
          {activeTab === 'mercado' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              
              {/* FILTER / HEADER CONTROLS */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 border-b border-slate-900 pb-5 mb-5">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-mono font-black text-slate-200 uppercase tracking-widest">Cotação de Criptoativos da Carteira</h3>
                    <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-0.5">18 criptomoedas com suporte a WMR atualizando em tempo real</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar moeda (ex: WMR, DarkBit)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-60 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded py-2 pl-9 pr-4 text-xs font-mono text-cyan-300 outline-none transition-colors"
                    />
                  </div>

                  {/* Filter Select tag */}
                  <select
                    value={marketFilter}
                    onChange={(e) => {
                      setMarketFilter(e.target.value as any);
                      playBeep('click');
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono py-2 px-3 rounded outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="all">Filtro: Todas</option>
                    <option value="gainers">Filtro: Altas (Gainers)</option>
                    <option value="losers">Filtro: Baixas (Losers)</option>
                  </select>

                  {/* Sorter Select tag */}
                  <select
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      playBeep('click');
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono py-2 px-3 rounded outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="rank">Ordenar por: Ranking</option>
                    <option value="price-desc">Preço: Maior primeiro</option>
                    <option value="price-asc">Preço: Menor primeiro</option>
                    <option value="var-desc">Variação: Alta primeiro</option>
                    <option value="var-asc">Variação: Baixa primeiro</option>
                  </select>
                </div>
              </div>

              {/* LIST TABLE CONTAINER */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase font-black text-[10px] tracking-wider">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">Preço</th>
                      <th className="py-3 px-4">Variação 24h</th>
                      <th className="py-3 px-4 hidden md:table-cell">Market Cap</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Histórico</th>
                      <th className="py-3 px-4 text-right">Ação Comercial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {filteredCoins.map((coin, index) => {
                      const qtyOwned = portfolio[coin.symbol] || 0;
                      return (
                        <tr key={coin.id} className={`hover:bg-slate-900/30 transition-colors ${coin.isPrincipal ? 'bg-cyan-950/20' : ''}`}>
                          <td className="py-3.5 px-4 font-bold text-slate-500">#{index + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-200">{coin.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-900/80 border border-slate-800" style={{ color: coin.color }}>
                                {coin.symbol}
                              </span>
                              {coin.isPrincipal && (
                                <span className="text-[9px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                                  MOEDA PRINCIPAL
                                </span>
                              )}
                              {qtyOwned > 0 && !coin.isPrincipal && (
                                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950/20 border border-cyan-950 px-1 py-0.2 rounded">
                                  {qtyOwned.toLocaleString('pt-BR', {maximumFractionDigits: 3})}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-100">
                            ${coin.price.toLocaleString('pt-BR', {minimumFractionDigits: coin.price > 1 ? 2 : 4})}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 font-bold ${coin.variation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {coin.variation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {coin.variation >= 0 ? '+' : ''}{coin.variation}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                            ${(coin.marketCap / 1000000).toFixed(1)}M
                          </td>
                          <td className="py-3.5 px-4 hidden lg:table-cell">
                            {renderSparkline(coin.history, coin.color)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openModal('buy', coin.symbol)}
                                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer border border-cyan-300"
                              >
                                Compra
                              </button>
                              <button
                                onClick={() => openModal('sell', coin.symbol)}
                                className="px-2.5 py-1 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-[10px] uppercase rounded transition-colors cursor-pointer border border-purple-300"
                              >
                                Venda
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: TERMINAL INTERATIVO CLI                            */}
          {/* ========================================================= */}
          {activeTab === 'terminal' && (
            <div className="bg-[#020408] border-2 border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.05)]">
              {/* Header */}
              <div className="bg-slate-950/90 border-b border-slate-900 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-mono font-bold text-slate-400 ml-2">kali@coldvault: ~</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">CLI ACTIVA (WMR READY)</span>
                </div>
              </div>

              {/* Console logs */}
              <div className="p-4 h-96 overflow-y-auto font-mono text-xs text-emerald-400 space-y-2 bg-[#020306] custom-scrollbar">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-line leading-relaxed">
                    {log}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Command input form */}
              <form onSubmit={handleTerminalSubmit} className="border-t border-slate-900 bg-slate-950 flex items-center px-4 py-3">
                <span className="text-emerald-500 font-bold mr-2">kali@coldvault:~$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder='Digite "help" para ver comandos (ex: wmr, banks, balance)...'
                  className="flex-1 bg-transparent border-none outline-none text-emerald-300 font-mono text-xs"
                  autoFocus
                />
              </form>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* TRANSACTION MODALS DIALOGS HUB                            */}
      {/* ========================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950/95 border-2 border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] animate-scale-in">
            
            {/* Modal header */}
            <div className="bg-slate-900/80 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-mono font-black text-slate-100 uppercase tracking-wider">
                  {activeModal === 'receive' && 'RECEBER CRIPTOATIVO'}
                  {activeModal === 'send' && 'ENVIAR CRIPTOATIVO'}
                  {activeModal === 'sell' && 'CONVERSÃO DE VENDA'}
                  {activeModal === 'buy' && 'CONVERSÃO DE COMPRA'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  playBeep('click');
                  setActiveModal(null);
                }} 
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                [X]
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 font-mono text-xs">
              
              {/* IF TRANSACTIONS WAS COMPLETED SUCCESSFULLY */}
              {txSuccessInfo ? (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-full cyber-glow-green">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-400">TRANSAÇÃO PROCESSADA!</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Registrada localmente com confirmação bancária</p>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded text-left space-y-2 mt-4 text-[11px]">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">ID da Transação:</span>
                      <span className="text-slate-300 font-bold">{txSuccessInfo.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">Operação:</span>
                      <span className="text-cyan-400 font-bold">{txSuccessInfo.type}</span>
                    </div>
                    {txSuccessInfo.bankName && (
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-500">Banco Selecionado:</span>
                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          {txSuccessInfo.bankName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">Montante:</span>
                      <span className="text-slate-300 font-bold">{txSuccessInfo.amount} {txSuccessInfo.coinSymbol}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">Valor USD Fiat:</span>
                      <span className="text-slate-300 font-bold">${txSuccessInfo.fiatValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Hash do Ledger:</span>
                      <span className="text-[9px] break-all text-emerald-400 select-all font-bold">{txSuccessInfo.hash}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playBeep('click');
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase rounded tracking-widest text-[10px] transition-colors cursor-pointer border border-cyan-300 mt-6"
                  >
                    CONCLUIR
                  </button>
                </div>
              ) : isProcessingTx ? (
                /* LOADING LOADER PROCESSING */
                <div className="text-center py-12 space-y-4">
                  <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                  <div>
                    <h4 className="text-sm font-black text-cyan-400 animate-pulse">PROCESSANDO LEDGER SECURE...</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Conectando ao banco {modalSelectedBank}...</p>
                  </div>
                </div>
              ) : (
                /* ACTUAL MODAL FORMS BASED ON ACTIVE MODAL */
                <div>
                  
                  {/* SELECT TARGET CRYPTO COIN INPUT */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">SELECIONAR MOEDA COLD</label>
                    <select
                      value={modalSelectedCoin.symbol}
                      onChange={(e) => {
                        const coin = coins.find((c) => c.symbol === e.target.value);
                        if (coin) setModalSelectedCoin(coin);
                        playBeep('click');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 py-2.5 px-3 rounded outline-none text-slate-200 text-xs font-mono cursor-pointer"
                    >
                      {activeModal === 'buy' ? (
                        coins.map((c) => (
                          <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol}) - ${c.price.toLocaleString()}</option>
                        ))
                      ) : (
                        coins.filter(c => ['WMR', 'DKBT', 'NETH', 'QSOL', 'CYBR'].includes(c.symbol)).map((c) => (
                          <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol}) - ${c.price.toLocaleString()}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* SELECT BANK FIELD FOR TRANSFER / TRANSACTION */}
                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 mb-1.5 uppercase">
                      <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                      SELECIONAR BANCO PARA ORIGEM/DESTINO
                    </label>
                    <select
                      value={modalSelectedBank}
                      onChange={(e) => {
                        setModalSelectedBank(e.target.value);
                        playBeep('click');
                      }}
                      className="w-full bg-slate-900 border border-cyan-500/40 focus:border-cyan-400 py-2.5 px-3 rounded outline-none text-slate-100 font-bold text-xs font-mono cursor-pointer"
                    >
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  {/* ========================================================= */}
                  {/* MODAL VIEW: RECEIVE COIN                                  */}
                  {/* ========================================================= */}
                  {activeModal === 'receive' && (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center py-3 bg-slate-900/40 border border-slate-900 rounded">
                        <div className="mb-3">
                          {generateQRCodeSvg(`0xKALI_${modalSelectedCoin.symbol}_f4b7a77ff`)}
                        </div>
                        <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-black animate-pulse">[🔒] QR-CODE SEGURO DA CARTEIRA</span>
                      </div>

                      <div className="space-y-1 bg-slate-900/60 p-3 rounded">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Endereço Público ({modalSelectedCoin.symbol})</span>
                        <div className="flex justify-between items-center gap-2">
                          <code className="text-[11px] text-cyan-300 break-all select-all font-mono">0xKALI_{modalSelectedCoin.symbol}_f4b7a77ff</code>
                          <button
                            onClick={() => handleCopyToClipboard(`0xKALI_${modalSelectedCoin.symbol}_f4b7a77ff`, 'Endereço')}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-semibold bg-slate-900/30 p-2.5 rounded border border-slate-900/50">
                        <span className="text-cyan-400 font-bold block mb-1">Injeção Direta de Fundos:</span>
                        Receba os fundos diretamente na sua carteira vinculada ao banco <strong className="text-white">{modalSelectedBank}</strong>.
                      </div>

                      <button
                        onClick={handleSimulateReceiveFund}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase rounded tracking-widest text-[10px] transition-colors cursor-pointer border border-emerald-300"
                      >
                        Confirmar Recebimento via {modalSelectedBank} (+{modalSelectedCoin.symbol === 'WMR' ? '1.0 WMR' : (modalSelectedCoin.symbol === 'DKBT' ? '0.05 DKBT' : '5.0')})
                      </button>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* MODAL VIEW: SEND COIN                                     */}
                  {/* ========================================================= */}
                  {activeModal === 'send' && (
                    <form onSubmit={handleConfirmSend} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Endereço de Destino</label>
                        <input
                          type="text"
                          required
                          placeholder="Inserir endereço (ex: 0xTARGET_99ee2...)"
                          value={modalAddress}
                          onChange={(e) => setModalAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 py-2 px-3 rounded outline-none text-slate-200 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Quantidade a Enviar</label>
                          <span className="text-[10px] text-slate-500">Disponível: {(portfolio[modalSelectedCoin.symbol] || 0)} {modalSelectedCoin.symbol}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.00"
                            value={modalAmount}
                            onChange={(e) => setModalAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 py-2.5 px-3 rounded outline-none text-slate-200 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setModalAmount((portfolio[modalSelectedCoin.symbol] || 0).toString());
                              playBeep('click');
                            }}
                            className="absolute right-2.5 top-2.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded text-[10px] hover:bg-cyan-950/80 cursor-pointer"
                          >
                            MÁX
                          </button>
                        </div>
                      </div>

                      {/* Dynamic conversion feedback info */}
                      {parseFloat(modalAmount) > 0 && (
                        <div className="p-2.5 bg-slate-900/60 rounded text-[11px] text-slate-400 flex justify-between font-mono">
                          <span>Equivalente Fiat:</span>
                          <span className="text-white font-bold">${(parseFloat(modalAmount) * modalSelectedCoin.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                      )}

                      {/* Priority fee setting */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Prioridade da Taxa</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModalGasOption('standard');
                              playBeep('click');
                            }}
                            className={`py-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                              modalGasOption === 'standard' 
                                ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/40 shadow-inner' 
                                : 'bg-slate-900/40 text-slate-500 border-slate-850 hover:text-slate-300'
                            }`}
                          >
                            Normal (~10 min) • 0.001
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalGasOption('priority');
                              playBeep('click');
                            }}
                            className={`py-2 rounded border text-xs font-bold transition-all cursor-pointer ${
                              modalGasOption === 'priority' 
                                ? 'bg-cyan-950/20 text-cyan-400 border-cyan-500/40 shadow-inner' 
                                : 'bg-slate-900/40 text-slate-500 border-slate-850 hover:text-slate-300'
                            }`}
                          >
                            Rápida (~2 min) • 0.005
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase rounded tracking-widest text-[10px] transition-colors cursor-pointer border border-cyan-300 mt-4"
                      >
                        ASSINAR E ENVIAR VIA {modalSelectedBank.toUpperCase()}
                      </button>
                    </form>
                  )}

                  {/* ========================================================= */}
                  {/* MODAL VIEW: SELL COIN                                     */}
                  {/* ========================================================= */}
                  {activeModal === 'sell' && (
                    <form onSubmit={handleConfirmSell} className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Quantidade a Vender</label>
                          <span className="text-[10px] text-slate-500">Disponível: {(portfolio[modalSelectedCoin.symbol] || 0)} {modalSelectedCoin.symbol}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0.00"
                            value={modalAmount}
                            onChange={(e) => setModalAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 py-2.5 px-3 rounded outline-none text-slate-200 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setModalAmount((portfolio[modalSelectedCoin.symbol] || 0).toString());
                              playBeep('click');
                            }}
                            className="absolute right-2.5 top-2.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded text-[10px] hover:bg-cyan-950/80 cursor-pointer"
                          >
                            MÁX
                          </button>
                        </div>
                      </div>

                      {/* Display calculation value */}
                      {parseFloat(modalAmount) > 0 && (
                        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded space-y-2 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Valor Unitário:</span>
                            <span>${modalSelectedCoin.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800/80 pt-1.5 font-bold">
                            <span className="text-emerald-400">USD Fiat a Depositar no {modalSelectedBank}:</span>
                            <span className="text-emerald-400">${(parseFloat(modalAmount) * modalSelectedCoin.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold uppercase rounded tracking-widest text-[10px] transition-colors cursor-pointer border border-purple-300 mt-4"
                      >
                        CONFIRMAR VENDA E RESGATE NO {modalSelectedBank.toUpperCase()}
                      </button>
                    </form>
                  )}

                  {/* ========================================================= */}
                  {/* MODAL VIEW: BUY COIN                                      */}
                  {/* ========================================================= */}
                  {activeModal === 'buy' && (
                    <form onSubmit={handleConfirmBuy} className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Quantidade de {modalSelectedCoin.symbol} a Comprar</label>
                          <span className="text-[10px] text-slate-500">Disponível USD: ${balanceFiat.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.00"
                          value={modalAmount}
                          onChange={(e) => setModalAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 py-2.5 px-3 rounded outline-none text-slate-200 font-mono text-xs"
                        />
                      </div>

                      {/* Cost dynamic update panel */}
                      {parseFloat(modalAmount) > 0 && (
                        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded space-y-2 text-[11px] text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Preço Unitário:</span>
                            <span>${modalSelectedCoin.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800/80 pt-1.5 font-bold">
                            <span className="text-cyan-400">Total USD Fiat a Debitar ({modalSelectedBank}):</span>
                            <span className="text-cyan-400">${(parseFloat(modalAmount) * modalSelectedCoin.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase rounded tracking-widest text-[10px] transition-colors cursor-pointer border border-cyan-300 mt-4"
                      >
                        CONFIRMAR COMPRA VIA {modalSelectedBank.toUpperCase()}
                      </button>
                    </form>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
