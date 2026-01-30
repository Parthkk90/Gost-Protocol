# 📱 Privacy Cash Credit Card - React Native App Architecture

## 🎯 Project Overview

**App Name**: Privacy Cash Credit Card  
**Platform**: React Native (iOS + Android)  
**Backend**: Python FastAPI Relayer  
**Blockchain**: Solana (Devnet/Mainnet)  
**Privacy Layer**: Privacy Cash SDK  
**Hardware**: ESP32 + RC522 NFC Reader

---

## 📂 Project Structure

```
privacy-cash-app/
├── src/
│   ├── api/                      # API integration layer
│   │   ├── client.ts             # Axios HTTP client
│   │   ├── endpoints.ts          # API endpoint definitions
│   │   ├── auth.ts               # Authentication API
│   │   ├── vault.ts              # Vault operations API
│   │   ├── payment.ts            # Payment processing API
│   │   ├── transaction.ts        # Transaction history API
│   │   ├── card.ts               # NFC card management API
│   │   └── privacy.ts            # Privacy features API
│   │
│   ├── screens/                  # UI Screens
│   │   ├── onboarding/
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── OnboardingScreen.tsx
│   │   │   └── WalletSetupScreen.tsx
│   │   ├── auth/
│   │   │   ├── CreateWalletScreen.tsx
│   │   │   ├── ImportWalletScreen.tsx
│   │   │   └── BiometricSetupScreen.tsx
│   │   ├── vault/
│   │   │   ├── CreateVaultScreen.tsx
│   │   │   ├── DepositCollateralScreen.tsx
│   │   │   └── VaultDetailsScreen.tsx
│   │   ├── card/
│   │   │   ├── RegisterCardScreen.tsx
│   │   │   └── CardListScreen.tsx
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx
│   │   │   └── DashboardScreen.tsx
│   │   ├── payment/
│   │   │   ├── TapToPayScreen.tsx
│   │   │   ├── PaymentProcessingScreen.tsx
│   │   │   └── PaymentSuccessScreen.tsx
│   │   ├── transaction/
│   │   │   ├── TransactionListScreen.tsx
│   │   │   └── TransactionDetailScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       └── PrivacySettingsScreen.tsx
│   │
│   ├── components/               # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── VaultCard.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── NFCAnimation.tsx
│   │   └── PrivacyIndicator.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useVault.ts
│   │   ├── usePayment.ts
│   │   ├── useTransaction.ts
│   │   ├── useWallet.ts
│   │   └── useWebSocket.ts
│   │
│   ├── store/                    # State management (Redux/Zustand)
│   │   ├── authSlice.ts
│   │   ├── vaultSlice.ts
│   │   ├── paymentSlice.ts
│   │   └── transactionSlice.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── solana.ts            # Solana Web3 utils
│   │   ├── crypto.ts            # Encryption/hashing
│   │   ├── formatting.ts        # Format numbers, dates
│   │   └── validation.ts        # Input validation
│   │
│   ├── types/                    # TypeScript types
│   │   ├── api.types.ts
│   │   ├── vault.types.ts
│   │   ├── payment.types.ts
│   │   └── transaction.types.ts
│   │
│   ├── navigation/               # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   │
│   └── config/                   # Configuration
│       ├── constants.ts          # App constants
│       └── env.ts                # Environment variables
│
├── android/                      # Android native code
├── ios/                          # iOS native code
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔌 API Integration Layer

### **1. Base API Client** (`src/api/client.ts`)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://YOUR_RELAYER_IP:8000/api/v1';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor (add auth token)
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (handle errors)
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized (logout user)
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const apiClient = new APIClient();
```

---

### **2. API Endpoints** (`src/api/endpoints.ts`)

```typescript
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    CREATE_WALLET: '/user/create',
    LOGIN: '/user/login',
    LOGOUT: '/user/logout',
    REFRESH_TOKEN: '/user/refresh',
  },

  // Vault Operations
  VAULT: {
    CREATE: '/vault/create',
    GET_DETAILS: (address: string) => `/vault/${address}`,
    DEPOSIT: '/vault/deposit',
    WITHDRAW: '/vault/withdraw',
    GET_HEALTH: (address: string) => `/vault/${address}/health`,
  },

  // Card Management
  CARD: {
    REGISTER: '/card/register',
    LIST: '/card/list',
    DELETE: (cardId: string) => `/card/${cardId}`,
    GET_BY_ID: (cardId: string) => `/card/${cardId}`,
  },

  // Payments
  PAYMENT: {
    INITIATE: '/payment/initiate',
    NFC: '/payment/nfc',
    STATUS: (txId: string) => `/payment/status/${txId}`,
    CANCEL: (txId: string) => `/payment/cancel/${txId}`,
  },

  // Privacy Features
  PRIVACY: {
    GET_ENTROPY: '/privacy/entropy',
    CREATE_BURNER: '/privacy/burner',
    GET_DECOYS: '/privacy/decoys',
    PRIVACY_SCORE: (txId: string) => `/privacy/score/${txId}`,
  },

  // Transactions
  TRANSACTION: {
    LIST: '/transactions',
    GET_DETAIL: (txId: string) => `/transactions/${txId}`,
    EXPORT: '/transactions/export',
  },

  // Market Data
  MARKET: {
    SOL_PRICE: '/price/sol-usd',
    JUPITER_QUOTE: '/price/jupiter-quote',
  },

  // WebSocket
  WEBSOCKET: {
    PAYMENT_UPDATES: '/ws/payment-updates',
    VAULT_UPDATES: '/ws/vault-updates',
  },
};
```

---

### **3. Vault API** (`src/api/vault.ts`)

```typescript
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  CreateVaultRequest,
  CreateVaultResponse,
  VaultDetails,
  DepositCollateralRequest,
  DepositCollateralResponse,
  VaultHealthResponse,
} from '../types/api.types';

export class VaultAPI {
  /**
   * Create a new vault
   * POST /api/v1/vault/create
   */
  static async createVault(
    data: CreateVaultRequest
  ): Promise<CreateVaultResponse> {
    return apiClient.post(API_ENDPOINTS.VAULT.CREATE, {
      owner_pubkey: data.ownerPubkey,
      vault_id: data.vaultId,
      default_ltv: data.defaultLtv || 15000, // 150% in basis points
      base_interest_rate: data.baseInterestRate || 500, // 5% in basis points
    });
  }

  /**
   * Get vault details
   * GET /api/v1/vault/{address}
   */
  static async getVaultDetails(vaultAddress: string): Promise<VaultDetails> {
    return apiClient.get(API_ENDPOINTS.VAULT.GET_DETAILS(vaultAddress));
  }

  /**
   * Deposit collateral into vault
   * POST /api/v1/vault/deposit
   */
  static async depositCollateral(
    data: DepositCollateralRequest
  ): Promise<DepositCollateralResponse> {
    return apiClient.post(API_ENDPOINTS.VAULT.DEPOSIT, {
      vault_address: data.vaultAddress,
      amount_sol: data.amountSol,
    });
  }

  /**
   * Get vault health factor
   * GET /api/v1/vault/{address}/health
   */
  static async getVaultHealth(
    vaultAddress: string
  ): Promise<VaultHealthResponse> {
    return apiClient.get(API_ENDPOINTS.VAULT.GET_HEALTH(vaultAddress));
  }

  /**
   * Withdraw collateral from vault
   * POST /api/v1/vault/withdraw
   */
  static async withdrawCollateral(
    vaultAddress: string,
    amountSol: number
  ): Promise<any> {
    return apiClient.post(API_ENDPOINTS.VAULT.WITHDRAW, {
      vault_address: vaultAddress,
      amount_sol: amountSol,
    });
  }
}
```

---

### **4. Payment API** (`src/api/payment.ts`)

```typescript
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  NFCPaymentRequest,
  NFCPaymentResponse,
  PaymentStatusResponse,
} from '../types/api.types';

export class PaymentAPI {
  /**
   * Initiate a payment
   * POST /api/v1/payment/initiate
   */
  static async initiatePayment(
    data: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> {
    return apiClient.post(API_ENDPOINTS.PAYMENT.INITIATE, {
      vault_address: data.vaultAddress,
      merchant_address: data.merchantAddress,
      amount_usd: data.amountUsd,
    });
  }

  /**
   * Process NFC card payment
   * POST /api/v1/payment/nfc
   */
  static async processNFCPayment(
    data: NFCPaymentRequest
  ): Promise<NFCPaymentResponse> {
    return apiClient.post(API_ENDPOINTS.PAYMENT.NFC, {
      card_id: data.cardId,
      merchant_address: data.merchantAddress,
      amount_usd: data.amountUsd,
    });
  }

  /**
   * Get payment status
   * GET /api/v1/payment/status/{txId}
   */
  static async getPaymentStatus(txId: string): Promise<PaymentStatusResponse> {
    return apiClient.get(API_ENDPOINTS.PAYMENT.STATUS(txId));
  }

  /**
   * Cancel pending payment
   * POST /api/v1/payment/cancel/{txId}
   */
  static async cancelPayment(txId: string): Promise<any> {
    return apiClient.post(API_ENDPOINTS.PAYMENT.CANCEL(txId));
  }
}
```

---

### **5. Card Management API** (`src/api/card.ts`)

```typescript
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  RegisterCardRequest,
  RegisterCardResponse,
  CardListResponse,
  CardDetails,
} from '../types/api.types';

export class CardAPI {
  /**
   * Register a new NFC card
   * POST /api/v1/card/register
   */
  static async registerCard(
    data: RegisterCardRequest
  ): Promise<RegisterCardResponse> {
    return apiClient.post(API_ENDPOINTS.CARD.REGISTER, {
      card_number: data.cardNumber,
      card_name: data.cardName,
      vault_address: data.vaultAddress,
    });
  }

  /**
   * Get list of registered cards
   * GET /api/v1/card/list
   */
  static async getCardList(): Promise<CardListResponse> {
    return apiClient.get(API_ENDPOINTS.CARD.LIST);
  }

  /**
   * Delete a card
   * DELETE /api/v1/card/{cardId}
   */
  static async deleteCard(cardId: string): Promise<any> {
    return apiClient.delete(API_ENDPOINTS.CARD.DELETE(cardId));
  }

  /**
   * Get card details
   * GET /api/v1/card/{cardId}
   */
  static async getCardDetails(cardId: string): Promise<CardDetails> {
    return apiClient.get(API_ENDPOINTS.CARD.GET_BY_ID(cardId));
  }
}
```

---

### **6. Transaction API** (`src/api/transaction.ts`)

```typescript
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  TransactionListResponse,
  TransactionDetail,
  TransactionFilters,
} from '../types/api.types';

export class TransactionAPI {
  /**
   * Get transaction list
   * GET /api/v1/transactions
   */
  static async getTransactionList(
    filters?: TransactionFilters
  ): Promise<TransactionListResponse> {
    return apiClient.get(API_ENDPOINTS.TRANSACTION.LIST, {
      params: filters,
    });
  }

  /**
   * Get transaction details
   * GET /api/v1/transactions/{txId}
   */
  static async getTransactionDetail(txId: string): Promise<TransactionDetail> {
    return apiClient.get(API_ENDPOINTS.TRANSACTION.GET_DETAIL(txId));
  }

  /**
   * Export transactions
   * GET /api/v1/transactions/export
   */
  static async exportTransactions(format: 'csv' | 'pdf'): Promise<Blob> {
    return apiClient.get(API_ENDPOINTS.TRANSACTION.EXPORT, {
      params: { format },
      responseType: 'blob',
    });
  }
}
```

---

### **7. Privacy Features API** (`src/api/privacy.ts`)

```typescript
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import {
  EntropyResponse,
  BurnerWalletRequest,
  BurnerWalletResponse,
  DecoyOutputsResponse,
  PrivacyScoreResponse,
} from '../types/api.types';

export class PrivacyAPI {
  /**
   * Get hardware entropy from ESP32
   * GET /api/v1/privacy/entropy
   */
  static async getEntropy(): Promise<EntropyResponse> {
    return apiClient.get(API_ENDPOINTS.PRIVACY.GET_ENTROPY);
  }

  /**
   * Create burner wallet
   * POST /api/v1/privacy/burner
   */
  static async createBurnerWallet(
    data: BurnerWalletRequest
  ): Promise<BurnerWalletResponse> {
    return apiClient.post(API_ENDPOINTS.PRIVACY.CREATE_BURNER, {
      vault_address: data.vaultAddress,
      nonce: data.nonce,
    });
  }

  /**
   * Get decoy outputs preview
   * GET /api/v1/privacy/decoys
   */
  static async getDecoyOutputs(
    merchantAddress: string,
    amount: number,
    numDecoys: number = 4
  ): Promise<DecoyOutputsResponse> {
    return apiClient.get(API_ENDPOINTS.PRIVACY.GET_DECOYS, {
      params: {
        merchant_address: merchantAddress,
        amount,
        num_decoys: numDecoys,
      },
    });
  }

  /**
   * Get privacy score for a transaction
   * GET /api/v1/privacy/score/{txId}
   */
  static async getPrivacyScore(txId: string): Promise<PrivacyScoreResponse> {
    return apiClient.get(API_ENDPOINTS.PRIVACY.PRIVACY_SCORE(txId));
  }
}
```

---

## 📱 Screen-by-Screen API Integration

### **1. Home Screen** (`src/screens/home/HomeScreen.tsx`)

**APIs Used:**
- `VaultAPI.getVaultDetails()` - Get vault balance, credit limit
- `VaultAPI.getVaultHealth()` - Get health factor
- `TransactionAPI.getTransactionList()` - Recent transactions
- `MarketAPI.getSolPrice()` - Current SOL price

**Component Flow:**
```typescript
const HomeScreen = () => {
  const [vaultData, setVaultData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load vault details
      const vault = await VaultAPI.getVaultDetails(userVaultAddress);
      setVaultData(vault);
      
      // Load recent transactions
      const txList = await TransactionAPI.getTransactionList({
        limit: 5,
        sort: 'desc',
      });
      setTransactions(txList.transactions);
      
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <VaultCard data={vaultData} />
          <RecentTransactions transactions={transactions} />
          <TapToPayButton onPress={() => navigation.navigate('TapToPay')} />
        </>
      )}
    </View>
  );
};
```

---

### **2. Create Vault Screen** (`src/screens/vault/CreateVaultScreen.tsx`)

**APIs Used:**
- `VaultAPI.createVault()` - Initialize vault on-chain

**Component Flow:**
```typescript
const CreateVaultScreen = () => {
  const [collateralAmount, setCollateralAmount] = useState('0.5');
  const [creating, setCreating] = useState(false);

  const handleCreateVault = async () => {
    try {
      setCreating(true);
      
      // Step 1: Create vault
      const result = await VaultAPI.createVault({
        ownerPubkey: userWallet.publicKey,
        vaultId: 1,
        defaultLtv: 15000, // 150%
        baseInterestRate: 500, // 5%
      });
      
      console.log('Vault created:', result.vaultAddress);
      
      // Navigate to deposit screen
      navigation.navigate('DepositCollateral', {
        vaultAddress: result.vaultAddress,
        amount: parseFloat(collateralAmount),
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create vault');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View>
      <Input
        label="Collateral Amount (SOL)"
        value={collateralAmount}
        onChangeText={setCollateralAmount}
        keyboardType="decimal-pad"
      />
      <Text>Credit Limit: ${calculateCredit(collateralAmount)}</Text>
      <Button
        title="Create Vault"
        onPress={handleCreateVault}
        loading={creating}
      />
    </View>
  );
};
```

---

### **3. Deposit Collateral Screen** (`src/screens/vault/DepositCollateralScreen.tsx`)

**APIs Used:**
- `VaultAPI.depositCollateral()` - Deposit SOL to vault

**Component Flow:**
```typescript
const DepositCollateralScreen = ({ route }) => {
  const { vaultAddress, amount } = route.params;
  const [status, setStatus] = useState('idle'); // idle, wrapping, depositing, success
  const [progress, setProgress] = useState(0);

  const handleDeposit = async () => {
    try {
      setStatus('wrapping');
      setProgress(25);
      
      // Call deposit API
      const result = await VaultAPI.depositCollateral({
        vaultAddress,
        amountSol: amount,
      });
      
      setProgress(50);
      setStatus('depositing');
      
      // Wait for confirmation
      await pollDepositStatus(result.transactionId);
      
      setProgress(100);
      setStatus('success');
      
      // Navigate to success screen
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);
      
    } catch (error) {
      Alert.alert('Error', 'Deposit failed');
    }
  };

  return (
    <View>
      <Text>Depositing {amount} SOL...</Text>
      <ProgressBar progress={progress} />
      <StatusIndicator status={status} />
    </View>
  );
};
```

---

### **4. Tap to Pay Screen** (`src/screens/payment/TapToPayScreen.tsx`)

**APIs Used:**
- `PaymentAPI.initiatePayment()` - Start payment flow
- WebSocket for real-time updates

**Component Flow:**
```typescript
const TapToPayScreen = () => {
  const [paymentAmount, setPaymentAmount] = useState(15.00);
  const [waiting, setWaiting] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    ws.current = new WebSocket('ws://YOUR_RELAYER_IP:8000/ws/payment-updates');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handlePaymentUpdate(data);
    };
    
    return () => ws.current?.close();
  }, []);

  const handleTap = async () => {
    try {
      setWaiting(true);
      
      // Initiate payment
      const result = await PaymentAPI.initiatePayment({
        vaultAddress: userVaultAddress,
        merchantAddress: merchantPubkey,
        amountUsd: paymentAmount,
      });
      
      // Navigate to processing screen
      navigation.navigate('PaymentProcessing', {
        paymentId: result.paymentId,
      });
      
    } catch (error) {
      Alert.alert('Error', 'Payment initiation failed');
    } finally {
      setWaiting(false);
    }
  };

  return (
    <View>
      <NFCAnimation waiting={waiting} />
      <Text>Amount: ${paymentAmount}</Text>
      <Button title="Tap Card" onPress={handleTap} disabled={waiting} />
    </View>
  );
};
```

---

### **5. Payment Processing Screen** (`src/screens/payment/PaymentProcessingScreen.tsx`)

**APIs Used:**
- `PaymentAPI.getPaymentStatus()` - Poll payment status
- `PrivacyAPI.getPrivacyScore()` - Get privacy details

**Component Flow:**
```typescript
const PaymentProcessingScreen = ({ route }) => {
  const { paymentId } = route.params;
  const [steps, setSteps] = useState([
    { id: 1, text: 'Card detected', status: 'complete' },
    { id: 2, text: 'Vault verified', status: 'complete' },
    { id: 3, text: 'Getting SOL price', status: 'loading' },
    { id: 4, text: 'Creating burner', status: 'pending' },
    { id: 5, text: 'Generating decoys', status: 'pending' },
    { id: 6, text: 'Submitting transaction', status: 'pending' },
  ]);

  useEffect(() => {
    pollPaymentStatus();
  }, []);

  const pollPaymentStatus = async () => {
    const interval = setInterval(async () => {
      try {
        const status = await PaymentAPI.getPaymentStatus(paymentId);
        
        updateSteps(status.currentStep);
        
        if (status.status === 'confirmed') {
          clearInterval(interval);
          navigation.navigate('PaymentSuccess', {
            transactionId: status.transactionId,
          });
        }
        
      } catch (error) {
        clearInterval(interval);
        Alert.alert('Error', 'Payment failed');
      }
    }, 1000);
  };

  return (
    <View>
      <Text>Processing Payment...</Text>
      {steps.map((step) => (
        <StepIndicator key={step.id} step={step} />
      ))}
      <ProgressBar progress={calculateProgress(steps)} />
    </View>
  );
};
```

---

### **6. Transaction List Screen** (`src/screens/transaction/TransactionListScreen.tsx`)

**APIs Used:**
- `TransactionAPI.getTransactionList()` - Get all transactions

**Component Flow:**
```typescript
const TransactionListScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadTransactions();
  }, [page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      const result = await TransactionAPI.getTransactionList({
        page,
        limit: 20,
        sort: 'desc',
      });
      
      setTransactions((prev) => [...prev, ...result.transactions]);
      
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => (
        <TransactionItem
          transaction={item}
          onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
        />
      )}
      onEndReached={handleLoadMore}
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
};
```

---

### **7. Register Card Screen** (`src/screens/card/RegisterCardScreen.tsx`)

**APIs Used:**
- `CardAPI.registerCard()` - Register NFC card

**Component Flow:**
```typescript
const RegisterCardScreen = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    try {
      setRegistering(true);
      
      // Validate inputs
      if (!cardNumber || cardNumber.length !== 16) {
        Alert.alert('Error', 'Invalid card number');
        return;
      }
      
      // Register card
      const result = await CardAPI.registerCard({
        cardNumber,
        cardName,
        vaultAddress: userVaultAddress,
      });
      
      Alert.alert('Success', 'Card registered successfully!');
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to register card');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <View>
      <Input
        label="Card Number"
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="number-pad"
        maxLength={16}
      />
      <Input
        label="Card Name"
        value={cardName}
        onChangeText={setCardName}
        placeholder="My Privacy Card"
      />
      <Button
        title="Register Card"
        onPress={handleRegister}
        loading={registering}
      />
    </View>
  );
};
```

---

## 🔧 Custom Hooks

### **useVault Hook** (`src/hooks/useVault.ts`)

```typescript
import { useState, useEffect } from 'react';
import { VaultAPI } from '../api/vault';
import { VaultDetails } from '../types/api.types';

export const useVault = (vaultAddress: string) => {
  const [vault, setVault] = useState<VaultDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadVault();
  }, [vaultAddress]);

  const loadVault = async () => {
    try {
      setLoading(true);
      const data = await VaultAPI.getVaultDetails(vaultAddress);
      setVault(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadVault();
  };

  return { vault, loading, error, refresh };
};
```

---

### **usePayment Hook** (`src/hooks/usePayment.ts`)

```typescript
import { useState } from 'react';
import { PaymentAPI } from '../api/payment';

export const usePayment = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initiatePayment = async (
    vaultAddress: string,
    merchantAddress: string,
    amountUsd: number
  ) => {
    try {
      setProcessing(true);
      setError(null);
      
      const result = await PaymentAPI.initiatePayment({
        vaultAddress,
        merchantAddress,
        amountUsd,
      });
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const processNFC = async (cardId: string, merchantAddress: string, amountUsd: number) => {
    try {
      setProcessing(true);
      const result = await PaymentAPI.processNFCPayment({
        cardId,
        merchantAddress,
        amountUsd,
      });
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return { initiatePayment, processNFC, processing, error };
};
```

---

## 🎨 Component Examples

### **VaultCard Component** (`src/components/VaultCard.tsx`)

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface VaultCardProps {
  data: {
    collateralSol: number;
    creditLimit: number;
    usedCredit: number;
    healthFactor: number;
  };
}

export const VaultCard: React.FC<VaultCardProps> = ({ data }) => {
  const availableCredit = data.creditLimit - data.usedCredit;
  const utilizationPercent = (data.usedCredit / data.creditLimit) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💳 Available Credit</Text>
      <Text style={styles.amount}>${availableCredit.toFixed(2)} USD</Text>
      
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${utilizationPercent}%` }]} />
      </View>
      
      <View style={styles.details}>
        <View>
          <Text style={styles.label}>📊 Vault Health</Text>
          <Text style={styles.value}>
            {data.healthFactor > 1.5 ? '🟢' : '🟡'} {(data.healthFactor * 100).toFixed(0)}%
          </Text>
        </View>
        <View>
          <Text style={styles.label}>💰 Collateral</Text>
          <Text style={styles.value}>{data.collateralSol} SOL</Text>
        </View>
      </View>
    </View>
  );
};
```

---

## 📦 Dependencies (package.json)

```json
{
  "name": "privacy-cash-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0",
    "react-navigation": "^6.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "axios": "^1.6.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.0",
    "react-native-safe-area-context": "^4.8.0",
    "react-native-screens": "^3.29.0",
    "@solana/web3.js": "^1.87.0",
    "bs58": "^5.0.0",
    "react-native-biometrics": "^3.0.0",
    "react-native-nfc-manager": "^3.14.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 🚀 Implementation Checklist

### Phase 1: Setup & Authentication
- [ ] Initialize React Native project
- [ ] Setup navigation structure
- [ ] Implement API client with interceptors
- [ ] Create wallet generation/import screens
- [ ] Implement biometric authentication
- [ ] Setup AsyncStorage for persistence

### Phase 2: Vault Management
- [ ] Create vault creation flow
- [ ] Implement collateral deposit
- [ ] Build vault details screen
- [ ] Add health factor monitoring
- [ ] Implement withdraw functionality

### Phase 3: Payment Flow
- [ ] Build tap-to-pay screen with NFC animation
- [ ] Implement payment processing with real-time updates
- [ ] Create success/failure screens
- [ ] Add WebSocket for live updates
- [ ] Integrate Privacy SDK features (show decoys, burner)

### Phase 4: Transaction History
- [ ] Build transaction list with pagination
- [ ] Create transaction detail screen
- [ ] Show privacy indicators
- [ ] Add export functionality
- [ ] Implement filters and search

### Phase 5: Settings & Privacy
- [ ] Create settings screen
- [ ] Build privacy configuration
- [ ] Add card management
- [ ] Implement security settings
- [ ] Add help/support section

### Phase 6: Testing & Polish
- [ ] Test all API integrations
- [ ] Add error handling
- [ ] Implement loading states
- [ ] Add animations
- [ ] Optimize performance

---

## 🔐 Security Considerations

1. **Never store private keys in plain text**
   - Use secure keychain (iOS) / keystore (Android)
   - Encrypt sensitive data with biometric keys

2. **API Communication**
   - Always use HTTPS in production
   - Implement certificate pinning
   - Add request signing for sensitive operations

3. **Wallet Security**
   - Store seed phrases encrypted
   - Use biometric authentication
   - Implement auto-lock after inactivity

4. **Privacy Features**
   - Show privacy indicators clearly
   - Explain decoy system to users
   - Allow privacy level configuration

---

This documentation provides the complete blueprint for building your React Native app with proper API integration. Each screen knows exactly which APIs to call, and the architecture is modular and maintainable! 🚀