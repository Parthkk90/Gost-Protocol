export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  usdValue: number;
  changePercent: number;
  icon: string;
  address?: string;
}

export interface Transaction {
  id: string;
  type: "send" | "receive" | "swap";
  amount: number;
  symbol: string;
  usdValue: number;
  from: string;
  to: string;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  txHash?: string;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  avatar?: string;
}

export interface WalletData {
  address: string;
  name: string;
  totalBalance: number;
  assets: Asset[];
  transactions: Transaction[];
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  networkFee: number;
  slippage: number;
}
