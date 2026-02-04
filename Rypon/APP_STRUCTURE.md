# 📱 Rypon Wallet - Screen Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     APP START                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 ONBOARDING FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Welcome                                            │
│  "Welcome to your portal to Solana"                         │
│  [Next Button] ──────────────────────────┐                  │
│                                           ▼                  │
│  Step 2: Features                                           │
│  "Manage your SOL and NFTs in one place"                    │
│  [Skip] [Next Button] ───────────────────┐                  │
│                                           ▼                  │
│  Step 3: Security                                           │
│  "Security first. Your keys, your crypto"                   │
│  [Get Started] [Import Wallet] ──────────┐                  │
│                                           ▼                  │
│  Get Started Screen                                         │
│  [Create New Wallet] [Import Existing Wallet]               │
│                                           │                  │
└───────────────────────────────────────────┼──────────────────┘
                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MAIN APP (TABS)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────┬──────────┬───────┬──────────┬─────────┐        │
│  │ Home  │Collectib.│ Swap  │ Activity │ Browser │        │
│  └───┬───┴──────────┴───┬───┴──────────┴─────────┘        │
│      │                   │                                  │
│      ▼                   ▼                                  │
│  ┌───────────────┐   ┌────────────────┐                   │
│  │   HOME TAB    │   │   SWAP TAB     │                   │
│  ├───────────────┤   ├────────────────┤                   │
│  │• Balance      │   │• From Token    │                   │
│  │• Assets List  │   │• To Token      │                   │
│  │• Send Button ─┼───│• Exchange Rate │                   │
│  │• Receive Btn ─┼─┐ │• Review Button │                   │
│  │• Settings Btn─┼─┤ └────────────────┘                   │
│  └───────────────┘ │ │                                     │
│                    │ │                                     │
│  ┌────────────────┘ │                                     │
│  ▼                  │                                     │
│  ┌───────────────┐  │                                     │
│  │  SEND SCREEN  │  │                                     │
│  ├───────────────┤  │                                     │
│  │• Recipient    │  │                                     │
│  │• Amount       │  │                                     │
│  │• Contacts     │  │                                     │
│  │• [Next Btn]   │  │                                     │
│  └───────────────┘  │                                     │
│                     │                                     │
│  ┌──────────────────┘                                     │
│  ▼                                                         │
│  ┌───────────────┐                                        │
│  │RECEIVE SCREEN │                                        │
│  ├───────────────┤                                        │
│  │• QR Code      │                                        │
│  │• Address      │                                        │
│  │• Copy Button  │                                        │
│  │• Share        │                                        │
│  └───────────────┘                                        │
│                                                            │
│  ┌───────────────┐                                        │
│  │SETTINGS SCREEN│                                        │
│  ├───────────────┤                                        │
│  │• Profile      │                                        │
│  │• Security     │                                        │
│  │• Network      │                                        │
│  │• Preferences  │                                        │
│  └───────────────┘                                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Screen Descriptions

### 🚀 Onboarding Flow

1. **Step 1**: Hero image, welcome message, Next button
2. **Step 2**: Feature showcase with animated card, Skip/Next
3. **Step 3**: Security message, Get Started/Import buttons
4. **Get Started**: Create or Import wallet options

### 🏠 Main App - Bottom Tabs

#### Tab 1: Home

- Total balance display ($1,240.50)
- Asset list (SOL, USDC, BTC)
- Send button → Send Screen
- Receive button → Receive Screen
- Settings icon → Settings Screen

#### Tab 2: Collectibles

- Placeholder (Coming Soon)
- NFT gallery (Ready for implementation)

#### Tab 3: Swap

- Token swap interface
- From/To token selectors
- Exchange rate display
- Review order button

#### Tab 4: Activity

- Placeholder (Coming Soon)
- Transaction history (Ready for implementation)

#### Tab 5: Browser

- Placeholder (Coming Soon)
- dApp browser (Ready for implementation)

### 💸 Send Screen (Modal)

- Recipient address input with paste/QR
- Amount input with USD conversion
- MAX button for full balance
- Recent contacts carousel
- Next button

### 📥 Receive Screen (Modal)

- Solana network indicator
- QR code generator
- Wallet address display
- Copy address button
- Info warning about supported assets

### ⚙️ Settings Screen

- Profile section with avatar
- Network settings (Developer mode, RPC)
- Security settings (Private key, Face ID, Trusted apps)
- Preferences (General, Address book, Support)
- Remove account option

## Component Hierarchy

```
App.tsx
└── SafeAreaProvider
    └── RootNavigator (Stack)
        ├── OnboardingStep1Screen
        ├── OnboardingStep2Screen
        ├── OnboardingStep3Screen
        ├── GetStartedScreen
        ├── MainTabs (Bottom Tabs)
        │   ├── Home (HomeScreen)
        │   ├── Collectibles (Placeholder)
        │   ├── Swap (SwapScreen)
        │   ├── Activity (Placeholder)
        │   └── Browser (Placeholder)
        ├── Send (SendScreen) [Modal]
        ├── Receive (ReceiveScreen) [Modal]
        └── Settings (SettingsScreen)
```

## Navigation Types

### Stack Navigation

- Handles main flow and modals
- Slides for regular screens
- Modal presentation for Send/Receive

### Tab Navigation

- Bottom bar with 5 tabs
- Active/inactive states
- Icon + label for each tab

## Data Flow

```
Sample Data (sampleData.ts)
    │
    ├─→ HomeScreen (displays balance & assets)
    ├─→ SendScreen (shows available balance)
    ├─→ ReceiveScreen (shows wallet address)
    ├─→ SwapScreen (shows token info)
    └─→ SettingsScreen (shows profile data)
```

## Color System

```
Primary:          #6d13ec ████████ (Purple - main actions)
Background Dark:  #181022 ████████ (Deep dark - main background)
Surface Dark:     #251b30 ████████ (Cards, inputs)
Text Primary:     #FFFFFF ████████ (White - main text)
Text Secondary:   #a89db9 ████████ (Gray - secondary text)
Success:          #10b981 ████████ (Green - positive changes)
Error:            #ef4444 ████████ (Red - errors, warnings)
```

## Feature Status

✅ **Completed**

- All 10 screens
- Navigation flow
- UI components
- Sample data
- Color theme
- TypeScript types

🔄 **Ready for Implementation**

- Blockchain integration
- Wallet generation
- Transaction signing
- NFT gallery
- Transaction history
- dApp browser

⚠️ **Security Required**

- Key storage
- Biometric auth
- Seed phrase backup
- Network security

---

**Total Screens**: 10 (4 onboarding + 6 main app)
**Navigation Stacks**: 2 (Stack + Tabs)
**Reusable Components**: 5+ (Button, Input, Card, Header, PageIndicator)
**Sample Assets**: 3 (SOL, USDC, BTC)
**Sample Contacts**: 3
