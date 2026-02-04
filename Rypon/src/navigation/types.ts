export type RootStackParamList = {
  // Onboarding
  OnboardingStep1: undefined;
  OnboardingStep2: undefined;
  OnboardingStep3: undefined;
  GetStarted: undefined;

  // Main App
  MainTabs: undefined;

  // Wallet
  CreateWallet: undefined;
  ImportWallet: undefined;

  // Screens
  Send: undefined;
  Receive: undefined;
  Settings: undefined;
  TokenDetail: { tokenId: string };
  
  // Vault
  VaultManagement: undefined;
  CreateVault: undefined;
  DepositCollateral: { vaultAddress?: string; solAmount?: number };
  
  // Payment
  TapToPay: undefined;
  PaymentProcessing: { cardHash: string; merchantWallet: string; amount: number };
  PaymentSuccess: { amount: number; txSignature: string; privacyDetails: any };
  
  // Transaction
  TransactionList: undefined;
  TransactionDetail: { txId: string };
  
  // Privacy
  PrivacySettings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Collectibles: undefined;
  Swap: undefined;
  Activity: undefined;
  Browser: undefined;
};
