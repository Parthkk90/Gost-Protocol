# 📱 Privacy Cash Credit Card - React Native Screen Integration Guide

## 🎯 App Overview for AI Copilot

**Prompt for Copilot:**
> "Build a Privacy Cash Credit Card React Native app with dark purple/teal gradient theme. The app enables users to deposit SOL as collateral, get a USDC credit line, and make NFC tap-to-pay transactions with zero-knowledge privacy. Backend runs on Python FastAPI at port 8080."

---

## 📱 Complete Screen Specifications

### **1. OnboardingStep1Screen**
**Purpose:** Welcome screen introducing privacy payments

**UI Elements:**
- Large gradient circle with 🔐 emoji icon
- Title: "Complete Privacy, Every Payment"
- Subtitle: "Use burner wallets + decoys to make your payments untraceable"
- Page indicator (dot 1 of 3)
- "Next" button → OnboardingStep2
- Background: Dark with purple glow effects

**No API calls needed**

---

### **2. OnboardingStep2Screen**
**Purpose:** Explain credit line feature

**UI Elements:**
- 💳 Cash icon with floating shield icons
- Badge: "💳 Credit Line"
- Title: "Instant Credit Line Backed by SOL"
- Subtitle: "Deposit SOL as collateral and get a USDC credit line for payments"
- Back button, Skip button
- Page indicator (dot 2 of 3)
- "Next" button → OnboardingStep3

**No API calls needed**

---

### **3. OnboardingStep3Screen**
**Purpose:** Explain yield earning feature

**UI Elements:**
- 📈 Chart/yield visualization
- Title: "Earn While You Spend"
- Subtitle: "Your collateral earns 10-20% APY while you use your credit"
- Yield calculation preview (e.g., "$1000 deposit = $120/year yield")
- Page indicator (dot 3 of 3)
- "Get Started" button → GetStartedScreen

**No API calls needed**

---

### **4. GetStartedScreen**
**Purpose:** Choose to create or import wallet

**UI Elements:**
- App logo/branding
- Title: "Welcome to Privacy Cash"
- Two large buttons:
  - "Create New Wallet" → CreateWalletScreen
  - "Import Existing Wallet" → ImportWalletScreen
- Small text: "Your keys, your crypto, your privacy"

**No API calls needed**

---

### **5. CreateWalletScreen**
**Purpose:** Generate new wallet with mnemonic backup

**UI Elements:**
- Header: "Create Wallet" with back button
- Step indicator (Step 1: Generate, Step 2: Backup, Step 3: Confirm)
- 12-word mnemonic displayed in grid (3x4)
- Copy button to copy mnemonic
- Warning: "Write these words down and store safely"
- Checkbox: "I have saved my recovery phrase"
- "Continue" button (disabled until checkbox checked)
- Loading state while generating

**API Calls:**
- None (uses local BIP39 mnemonic generation)

**State Management:**
```typescript
{
  mnemonic: string[];      // 12 words
  isBackedUp: boolean;     // Checkbox state
  isGenerating: boolean;   // Loading state
}
```

---

### **6. ImportWalletScreen**
**Purpose:** Import wallet from recovery phrase

**UI Elements:**
- Header: "Import Wallet" with back button
- TextInput for 12/24 word mnemonic (multiline)
- Paste button (clipboard)
- Word count indicator: "12/12 words"
- Validation feedback (green checkmark when valid)
- "Import Wallet" button
- Loading state while importing

**API Calls:**
- None (local wallet derivation)

**Validation:**
- Check word count (12 or 24)
- Validate each word against BIP39 wordlist
- Show error if invalid

---

### **7. HomeScreen (Main Dashboard)**
**Purpose:** Primary wallet view with balance and quick actions

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  🟢 Connected to Mainnet        ⚙️      │  ← Header with settings
├─────────────────────────────────────────┤
│                                         │
│       💰 Total Balance                  │
│         $1,247.50                       │
│         ↑ +2.4% today                   │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   📤    │ │   📥    │ │   💳    │   │  ← Quick Actions
│  │  Send   │ │ Receive │ │ Tap Pay │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│  💳 Credit Card Status                  │  ← Vault Summary Card
│  ┌─────────────────────────────────┐   │
│  │ Available: $1,300.00            │   │
│  │ ████████░░░░ 35% used          │   │
│  │ Health: 🟢 185%                 │   │
│  │ [Deposit More] [Manage Vault]  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  📊 Recent Activity                     │  ← Last 3-5 transactions
│  ├ ☕ Coffee Shop      -$4.50    🟢95  │
│  ├ ⛽ Gas Station     -$35.00    🟢92  │
│  └ 🍕 Pizza Place     -$18.00    🟢98  │
│                    [View All →]         │
└─────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/vault/{address}` → Vault details
- `GET /api/v1/transactions?limit=5` → Recent transactions
- `GET /api/v1/market/sol-price` → SOL price

**Features:**
- Pull-to-refresh
- Real-time balance updates
- Tap vault card → VaultManagement
- Tap transaction → TransactionDetail
- No wallet state → Show Create/Import buttons

---

### **8. CreateVaultScreen**
**Purpose:** Initialize credit vault with collateral

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  ← Create Vault                         │
├─────────────────────────────────────────┤
│  ℹ️ Deposit SOL as collateral to get   │
│     a USDC credit line for payments     │
├─────────────────────────────────────────┤
│  Collateral Amount                      │
│  ┌─────────────────────────────────┐   │
│  │ ◎ 1.0                    SOL   │   │
│  └─────────────────────────────────┘   │
│  Available: 2.5 SOL                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ You will receive:               │   │
│  │ 💳 Credit Limit: $225.00        │   │
│  │ 📈 Est. Yield: $27/year (12%)   │   │
│  │ 💰 LTV Ratio: 150%              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [────────────Create Vault────────────] │
└─────────────────────────────────────────┘
```

**API Calls:**
- `POST /api/v1/vault/create` → Create vault
- `POST /api/v1/vault/deposit` → Deposit collateral

**Calculations (Client-side):**
```typescript
creditLimit = collateralSOL * solPrice * 1.5;  // 150% LTV
estimatedYield = collateralSOL * solPrice * 0.12;  // 12% APY
```

---

### **9. DepositCollateralScreen**
**Purpose:** Add more collateral to existing vault

**UI Elements:**
- Header: "Deposit Collateral"
- Current vault stats (collateral, credit limit, health)
- Amount input with SOL balance
- Preview of new credit limit after deposit
- Progress indicator during transaction
- Success/failure feedback

**API Calls:**
- `POST /api/v1/vault/deposit`

---

### **10. TapToPayScreen**
**Purpose:** NFC tap-to-pay interface

**UI Elements:**
```
┌─────────────────────────────────────────┐
│                              ✕          │  ← Close button
├─────────────────────────────────────────┤
│                                         │
│         Ready to Pay                    │
│    Tap your card on the NFC reader      │
│                                         │
│           ┌───────────┐                 │
│           │  📱 ))) │                 │  ← Phone icon with
│           │           │                 │     animated waves
│           └───────────┘                 │
│                                         │
│          Amount: $25.50                 │
│                                         │
├─────────────────────────────────────────┤
│  🔐 Privacy Features Active             │
│  • Burner wallet: Creating...           │
│  • Decoys: 5 transactions               │
│  • Privacy Score: 95+                   │
├─────────────────────────────────────────┤
│  [──────────Cancel Payment──────────]   │
└─────────────────────────────────────────┘
```

**API Calls:**
- `POST /api/v1/payment` → Process payment (on card detect)

**States:**
1. `waiting` - Showing NFC animation, waiting for tap
2. `detected` - Card detected, processing
3. `processing` - Navigate to PaymentProcessingScreen

**Animation:**
- Pulsing NFC waves emanating from phone icon
- Use `react-native-reanimated` for smooth animation

---

### **11. PaymentProcessingScreen**
**Purpose:** Show real-time payment progress

**UI Elements:**
```
┌─────────────────────────────────────────┐
│         Processing Payment              │
│              $25.50                     │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Card detected                       │
│  ✅ Vault verified                      │
│  ✅ Getting SOL price                   │
│  ⏳ Creating burner wallet...           │  ← Current step
│  ○  Generating decoys                   │
│  ○  Submitting transaction              │
│                                         │
│  ████████████░░░░░░░░ 60%              │  ← Progress bar
│                                         │
├─────────────────────────────────────────┤
│  🔐 Privacy: HIGH                       │
│  5 decoy transactions will be created   │
└─────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/payment/status/{txId}` → Poll every 1s

**Steps Array:**
```typescript
const steps = [
  { id: 1, text: 'Card detected', status: 'complete' },
  { id: 2, text: 'Vault verified', status: 'complete' },
  { id: 3, text: 'Getting SOL price', status: 'complete' },
  { id: 4, text: 'Creating burner wallet', status: 'loading' },
  { id: 5, text: 'Generating decoys', status: 'pending' },
  { id: 6, text: 'Submitting transaction', status: 'pending' },
];
```

---

### **12. PaymentSuccessScreen**
**Purpose:** Confirm successful payment

**UI Elements:**
```
┌─────────────────────────────────────────┐
│                                         │
│              ✅                         │  ← Large checkmark
│                                         │
│       Payment Successful!               │
│          $25.50                         │
│                                         │
├─────────────────────────────────────────┤
│  Transaction Details                    │
│  ├ Signature: 5x7k...Yz3m              │  ← Tap to copy
│  ├ Burner: 9Abc...def                  │
│  ├ Privacy Score: 🟢 98                │
│  └ Decoys: 5                           │
├─────────────────────────────────────────┤
│  🔐 Your payment is untraceable         │
│  Merchant cannot link to your vault     │
├─────────────────────────────────────────┤
│  [View on Solscan]  [Back to Home]     │
└─────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/privacy/score/{txId}` → Get final privacy score

---

### **13. ActivityScreen (Transaction History)**
**Purpose:** Full transaction history with filters

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  Activity                    🔍 Filter  │
├─────────────────────────────────────────┤
│  [All] [Payments] [Deposits]            │  ← Filter tabs
├─────────────────────────────────────────┤
│  📊 This Month                          │
│  Total Spent: $342.50                   │
│  Transactions: 12                       │
│  Avg Privacy: 🟢 94                     │
├─────────────────────────────────────────┤
│  Today                                  │
│  ├ ☕ Coffee Shop    -$4.50      🟢95  │
│  └ 🍕 Pizza Place   -$18.00      🟢98  │
│                                         │
│  Yesterday                              │
│  ├ ⛽ Gas Station   -$35.00      🟢92  │
│  └ 🛒 Grocery       -$67.50      🟢96  │
│                                         │
│  Jan 28                                 │
│  └ 💳 Deposit       +$500.00     ──    │
└─────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/transactions?page=1&limit=20`

**Features:**
- Infinite scroll pagination
- Pull-to-refresh
- Filter by type (payments/deposits/withdrawals)
- Group by date
- Tap item → TransactionDetailScreen

---

### **14. CollectiblesScreen**
**Purpose:** View NFTs and token balances

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  Collectibles                  🔍 +     │
├─────────────────────────────────────────┤
│  [NFTs]  [Tokens]                       │  ← Tab switcher
├─────────────────────────────────────────┤
│  NFTs Tab:                              │
│  ┌─────────┐  ┌─────────┐              │
│  │  🖼️    │  │  🖼️    │              │
│  │ SMB#123│  │DeGod#45 │              │
│  │ 12.5◎  │  │ 45.2◎   │              │
│  └─────────┘  └─────────┘              │
│                                         │
│  Tokens Tab:                            │
│  ┌─────────────────────────────────┐   │
│  │ ◎ SOL          2.5    $375.00   │   │
│  │ 💵 USDC      112.50   $112.50   │   │
│  │ 🔮 RAY         45.0    $22.50   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/wallet/{address}/nfts`
- `GET /api/v1/wallet/{address}/tokens`

---

### **15. SendScreen**
**Purpose:** Send SOL/tokens to another address

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  ← Send SOL                      ⚙️     │
├─────────────────────────────────────────┤
│  🟢 Available: 2.50 SOL                 │
├─────────────────────────────────────────┤
│  Recipient Address                      │
│  ┌─────────────────────────────────┐   │
│  │ Enter Solana address...    📋 📷│   │  ← Paste, QR scan
│  └─────────────────────────────────┘   │
│                                         │
│  Amount                                 │
│  ┌─────────────────────────────────┐   │
│  │ 0.5                        SOL │   │
│  └─────────────────────────────────┘   │
│  ≈ $75.00 USD                          │
│                                         │
│  Quick Amounts                          │
│  [0.1] [0.5] [1.0] [MAX]               │
├─────────────────────────────────────────┤
│  Recent Recipients                      │
│  ├ 🦄 Alice    9Abc...xyz              │
│  └ 🐸 Bob      7Def...uvw              │
├─────────────────────────────────────────┤
│  [───────────────Next───────────────]   │
└─────────────────────────────────────────┘
```

**API Calls:**
- `POST /api/v1/transfer` → Execute transfer

---

### **16. ReceiveScreen**
**Purpose:** Show wallet address and QR code

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  ✕       Receive              Share     │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────┐                │
│         │ ▄▄▄ ▄ ▄▄▄ │                │
│         │ █ ▄ ▄▄▄ █ │                │  ← QR Code
│         │ ▀▀▀ ▀ ▀▀▀ │                │
│         └─────────────┘                │
│                                         │
│  Your Solana Address                    │
│  ┌─────────────────────────────────┐   │
│  │ 9AbCd...xYz123                  │   │
│  │                          📋     │   │  ← Copy button
│  └─────────────────────────────────┘   │
│                                         │
│  [───────────Set Amount───────────]    │
│  Request specific amount                │
└─────────────────────────────────────────┘
```

**Features:**
- QR code generation with wallet address
- One-tap copy address
- Share via native share sheet
- Optional: Set specific amount to receive

---

### **17. RegisterCardScreen**
**Purpose:** Link NFC card to vault

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  ← Register Card                 Skip   │
├─────────────────────────────────────────┤
│                                         │
│         ┌───────────────┐              │
│         │    💳 )))   │              │  ← Card + NFC icon
│         └───────────────┘              │
│                                         │
│  Link your NFC card to your vault       │
│  for instant tap-to-pay                 │
│                                         │
├─────────────────────────────────────────┤
│  Card Number                            │
│  ┌─────────────────────────────────┐   │
│  │ 4532 1234 5678 9012             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Card Name (Optional)                   │
│  ┌─────────────────────────────────┐   │
│  │ My Privacy Card                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [──────────Register Card──────────]   │
└─────────────────────────────────────────┘
```

**API Calls:**
- `POST /api/v1/register_card`
  ```json
  {
    "card_hash": "sha256(card_number)",
    "vault_pubkey": "user_vault_address"
  }
  ```

---

### **18. SettingsScreen**
**Purpose:** App configuration and wallet management

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  ← Wallet Settings                      │
├─────────────────────────────────────────┤
│        🦄                               │
│    Solana Whale                         │  ← Avatar + name
│    9Abc...xyz                           │
├─────────────────────────────────────────┤
│  Security                               │
│  ├ 🔐 Face ID / Fingerprint    [ON]   │
│  ├ 🔑 View Recovery Phrase      →     │
│  └ 🔒 Change PIN                →     │
├─────────────────────────────────────────┤
│  Privacy                                │
│  ├ 🎭 Default Decoy Count      [5]    │
│  ├ 🔥 Auto-expire Burners      [ON]   │
│  └ 📊 Privacy Reports           →     │
├─────────────────────────────────────────┤
│  Network                                │
│  ├ 🌐 RPC Endpoint        [Mainnet]   │
│  └ 🔗 Backend Status        🟢 Online  │
├─────────────────────────────────────────┤
│  Developer                              │
│  ├ 🛠️ Developer Mode          [OFF]   │
│  └ 📋 Export Logs               →     │
├─────────────────────────────────────────┤
│  [──────────Disconnect Wallet──────────]│  ← Red, destructive
└─────────────────────────────────────────┘
```

**Features:**
- Toggle biometric auth
- View/backup recovery phrase (requires auth)
- Privacy settings (decoy count, burner expiry)
- Network status indicator
- Developer mode for debugging

---

### **19. SwapScreen**
**Purpose:** Swap tokens via Jupiter DEX

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  ← Swap                                 │
├─────────────────────────────────────────┤
│  From                                   │
│  ┌─────────────────────────────────┐   │
│  │ [◎ SOL ▼]              1.0     │   │
│  │ Balance: 2.5 SOL               │   │
│  └─────────────────────────────────┘   │
│                                         │
│              ⇅ Swap                     │  ← Flip button
│                                         │
│  To                                     │
│  ┌─────────────────────────────────┐   │
│  │ [💵 USDC ▼]          ~$150.00  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Route: SOL → USDC (Jupiter)            │
│  Price Impact: <0.1%                    │
│  Est. Fee: $0.00025                     │
├─────────────────────────────────────────┤
│  [────────────Swap Now────────────]     │
└─────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/price/jupiter-quote` → Get swap quote
- `POST /api/v1/swap` → Execute swap

---

## 🎨 Design System Summary

### Colors (Keep Your Current Theme)
```typescript
const Colors = {
  primary: '#6d13ec',        // Purple
  gradientEnd: '#00d4aa',    // Teal
  backgroundDark: '#0a0a0f', // Near black
  surfaceDark: '#1a1a24',    // Card background
  textPrimary: '#ffffff',
  textSecondary: '#8b8b9e',
  success: '#00d4aa',        // Teal
  warning: '#f59e0b',        // Orange
  error: '#ef4444',          // Red
};
```

### Typography
- Titles: 28-32px, Bold
- Subtitles: 16-18px, Regular
- Body: 14-16px, Regular
- Labels: 12-14px, Medium, textSecondary

### Components
- Buttons: Rounded (12px), gradient fill for primary
- Cards: Rounded (16px), surfaceDark background
- Inputs: Rounded (12px), border with focus state
- Icons: Ionicons from @expo/vector-icons

---

## 🔌 API Endpoints Summary

| Screen | Endpoints Used |
|--------|---------------|
| HomeScreen | `GET /vault/{addr}`, `GET /transactions`, `GET /market/sol-price` |
| CreateVaultScreen | `POST /vault/create`, `POST /vault/deposit` |
| TapToPayScreen | `POST /payment` |
| PaymentProcessingScreen | `GET /payment/status/{txId}` |
| PaymentSuccessScreen | `GET /privacy/score/{txId}` |
| ActivityScreen | `GET /transactions` |
| CollectiblesScreen | `GET /wallet/{addr}/tokens`, `GET /wallet/{addr}/nfts` |
| RegisterCardScreen | `POST /register_card` |
| SettingsScreen | Local storage only |

---

## 📋 Implementation Priority

### Phase 1 (Core - Week 1)
1. ✅ Onboarding screens (1-3)
2. ✅ GetStartedScreen
3. ✅ CreateWalletScreen
4. ✅ ImportWalletScreen
5. ✅ HomeScreen

### Phase 2 (Vault - Week 2)
6. CreateVaultScreen
7. DepositCollateralScreen
8. VaultManagementScreen

### Phase 3 (Payments - Week 3)
9. TapToPayScreen
10. PaymentProcessingScreen
11. PaymentSuccessScreen
12. RegisterCardScreen

### Phase 4 (History & Settings - Week 4)
13. ActivityScreen
14. TransactionDetailScreen
15. CollectiblesScreen
16. SettingsScreen
17. SendScreen
18. ReceiveScreen
19. SwapScreen

---

## 🚀 Copilot Prompt Examples

### To generate a screen:
> "Create PaymentProcessingScreen.tsx for Privacy Cash app. Show 6 payment steps with checkmarks/loading indicators. Poll /api/v1/payment/status/{txId} every second. Use dark purple theme with #6d13ec primary color. Navigate to PaymentSuccessScreen when complete."

### To add API integration:
> "Add vault details loading to HomeScreen. Call GET /api/v1/vault/{address} on mount. Show collateral amount, credit limit, available credit, and health factor. Add pull-to-refresh. Handle loading and error states."

### To fix navigation:
> "Fix GO_BACK error in all screens. Before calling navigation.goBack(), check navigation.canGoBack(). If false, navigate to MainTabs instead."

---

This guide provides everything needed to build or extend the Privacy Cash Credit Card React Native app! 🎉
