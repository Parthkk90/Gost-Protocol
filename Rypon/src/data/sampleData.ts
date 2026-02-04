import { Asset, Contact, Transaction, WalletData } from "../types/wallet.types";

// Sample privacy payment transactions
export const SAMPLE_PRIVACY_PAYMENTS = [
  {
    id: "1",
    type: "payment",
    merchant_name: "Coffee Shop",
    amount_usd: 4.50,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "completed",
    privacy_score: 95,
    burner_wallet: "9Abc...def1",
    decoys_count: 5,
  },
  {
    id: "2",
    type: "payment",
    merchant_name: "Gas Station",
    amount_usd: 35.00,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: "completed",
    privacy_score: 92,
    burner_wallet: "8Xyz...abc2",
    decoys_count: 5,
  },
  {
    id: "3",
    type: "payment",
    merchant_name: "Pizza Place",
    amount_usd: 18.00,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: "completed",
    privacy_score: 98,
    burner_wallet: "7Qwe...rty3",
    decoys_count: 5,
  },
  {
    id: "4",
    type: "deposit",
    merchant_name: "Vault Deposit",
    amount_usd: 500.00,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    status: "completed",
    privacy_score: 0,
  },
];

export const SAMPLE_ASSETS: Asset[] = [
  {
    id: "1",
    name: "Solana",
    symbol: "SOL",
    balance: 12.5,
    usdValue: 850.0,
    changePercent: 2.4,
    icon: "solana",
  },
  {
    id: "2",
    name: "USD Coin",
    symbol: "USDC",
    balance: 390.5,
    usdValue: 390.5,
    changePercent: 0.0,
    icon: "usdc",
  },
  {
    id: "3",
    name: "Bitcoin",
    symbol: "BTC",
    balance: 0.0,
    usdValue: 0.0,
    changePercent: 0.0,
    icon: "bitcoin",
  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "receive",
    amount: 2.5,
    symbol: "SOL",
    usdValue: 170.0,
    from: "8xGv...3aD2",
    to: "9yHw...4bE3",
    timestamp: new Date(Date.now() - 3600000),
    status: "completed",
    txHash: "5J7x...9kL2",
  },
  {
    id: "2",
    type: "send",
    amount: 100.0,
    symbol: "USDC",
    usdValue: 100.0,
    from: "9yHw...4bE3",
    to: "7wFt...2cD1",
    timestamp: new Date(Date.now() - 86400000),
    status: "completed",
    txHash: "3K8y...7mN4",
  },
  {
    id: "3",
    type: "swap",
    amount: 1.0,
    symbol: "SOL",
    usdValue: 68.0,
    from: "SOL",
    to: "USDC",
    timestamp: new Date(Date.now() - 172800000),
    status: "completed",
    txHash: "2L9z...5oP6",
  },
];

export const SAMPLE_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Alice.sol",
    address: "8xGv...3aD2",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "2",
    name: "Bob.eth",
    address: "7wFt...2cD1",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "3",
    name: "Jason",
    address: "6vEs...1bC0",
  },
];

export const SAMPLE_WALLET: WalletData = {
  address: "8xGv...3aD2",
  name: "Wallet 1",
  totalBalance: 1240.5,
  assets: SAMPLE_ASSETS,
  transactions: SAMPLE_TRANSACTIONS,
};

export const WALLET_ADDRESSES = {
  full: "8xGvKt2P9fH3aD27wLmN5kJ4bE3cF1",
  short: "8xGv...3aD2",
};
