export interface Coin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  variation: number; // 24h variation (%)
  marketCap: number;
  volume: number;
  history: number[]; // Sparkline history
  iconName: string;
  color: string;
  isPrincipal?: boolean;
  // Oscillation settings per coin
  intervalSeconds?: number;
  maxUpPercent?: number;
  maxDownPercent?: number;
  trend?: 'alta' | 'baixa' | 'neutro' | 'aleatorio';
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: 'ENVIADO' | 'RECEBIDO' | 'COMPRA' | 'VENDA';
  coinSymbol: string;
  amount: number;
  fiatValue: number;
  address: string;
  bankName?: string;
  hash: string;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'SUCCESS' | 'SECURED_LOCAL' | 'PENDING';
  rejectionReason?: string;
}

export interface OperationPasswords {
  buy: string;
  sell: string;
  receive: string;
  send: string;
}

export interface MarketSettings {
  intervalSeconds: number;
  maxUpPercent: number;
  maxDownPercent: number;
  preset: 'Alta forte' | 'Alta moderada' | 'Neutro' | 'Baixa moderada' | 'Baixa forte' | 'Aleatório';
  trend: 'alta' | 'baixa' | 'neutro' | 'aleatorio';
  updateSpeedMs: number;
  lastUpdated?: string;
  updateAvailable?: boolean;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'UPLOAD' | 'DOWNLOAD' | 'ADMIN_EDIT' | 'TRANSACTION';
  details: string;
}

export interface AdminDashboardStats {
  totalCoins: number;
  totalWallets: number;
  lastSyncTimestamp: string;
  connectedUsers: number;
  firestoreStatus: 'CONECTADO' | 'DESCONECTADO' | 'SINCRONIZANDO';
}
