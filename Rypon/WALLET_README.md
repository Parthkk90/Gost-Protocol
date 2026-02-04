# Rypon - Solana Web3 Wallet

A beautiful and secure Web3 Solana wallet built with React Native and Expo. This app features a clean architecture with feature-based organization and follows React Native best practices.

## 🎨 Features

- **Onboarding Flow**: 3-step onboarding with beautiful animations
- **Wallet Management**: View balance, assets, and manage multiple wallets
- **Send & Receive**: Send SOL and SPL tokens, receive with QR codes
- **Token Swap**: Swap between different tokens on Solana
- **Settings**: Comprehensive wallet settings and security options
- **Dark Mode**: Beautiful dark theme matching the original design

## 🏗️ Architecture

The project follows a clean, feature-based architecture:

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (Button, Input, Card, etc.)
├── constants/          # App constants (colors, theme)
├── data/               # Sample/mock data
├── features/           # Feature modules
│   ├── onboarding/    # Onboarding screens
│   ├── wallet/        # Wallet home screen
│   ├── send/          # Send assets screen
│   ├── receive/       # Receive with QR code
│   ├── settings/      # Settings screen
│   └── swap/          # Token swap screen
├── navigation/        # Navigation configuration
└── types/             # TypeScript type definitions
```

## 🎨 Design System

### Colors

- **Primary**: `#6d13ec` (Purple)
- **Background Dark**: `#181022`
- **Surface Dark**: `#251b30`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#a89db9`

### Key Components

- **Button**: Customizable button with variants (primary, secondary, outline, ghost)
- **Input**: Text input with icons and error states
- **Card**: Container component with different variants
- **Header**: Reusable header with navigation
- **PageIndicator**: Progress indicator for onboarding

## 📱 Screens

### Onboarding

1. **Step 1**: Welcome screen with hero visual
2. **Step 2**: Feature showcase (SOL & NFTs)
3. **Step 3**: Security emphasis
4. **Get Started**: Wallet creation options

### Main App

- **Home**: Wallet overview with assets and actions
- **Send**: Send SOL/tokens to addresses
- **Receive**: QR code and address display
- **Swap**: Token swap interface
- **Settings**: Wallet settings and preferences

### Bottom Tabs

- Home (Wallet overview)
- Collectibles (NFTs)
- Swap (Token exchange)
- Activity (Transaction history)
- Browser (dApp browser)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Run on your platform:

```bash
# iOS
npm run ios

# Android
npm run android

# Web (limited functionality)
npm run web
```

## 📦 Dependencies

### Core

- React Native 0.81.5
- Expo SDK ~54
- React Navigation 7.x

### UI & Design

- expo-linear-gradient (Gradients)
- react-native-svg (Vector graphics)
- react-native-qrcode-svg (QR codes)
- @expo/vector-icons (Ionicons)

### Utilities

- expo-clipboard (Copy to clipboard)
- react-native-safe-area-context (Safe areas)
- expo-status-bar (Status bar styling)

## 🔧 Configuration

### TypeScript

The app is fully typed with TypeScript. Type definitions are located in `src/types/`.

### Navigation

Navigation is configured using React Navigation with:

- Stack Navigator for main flow
- Bottom Tab Navigator for main app
- Modal presentations for Send/Receive screens

## 📊 Sample Data

The app includes sample data for demonstration:

- **Wallet Balance**: $1,240.50
- **Assets**: SOL, USDC, BTC (wrapped)
- **Contacts**: 3 sample contacts
- **Transactions**: Recent transaction history

## 🎯 Key Features Implementation

### 1. Onboarding

- Smooth page transitions
- Progress indicators
- Skip functionality
- Beautiful gradient backgrounds

### 2. Wallet Home

- Real-time balance display
- Asset list with prices and changes
- Quick actions (Send/Receive)
- Copyable wallet address

### 3. Send Screen

- Amount input with USD conversion
- Recent contacts
- QR code scanner integration (ready)
- Max balance button

### 4. Receive Screen

- Dynamic QR code generation
- Copyable wallet address
- Network indicator
- Share functionality (ready)

### 5. Token Swap

- Real-time rate display
- Slippage settings
- Network fee estimation
- Token selector

### 6. Settings

- Profile management
- Security options (Face ID, Private Key)
- Network configuration
- Developer mode

## 🔐 Security Considerations

This is a demo app with mock data. For production:

- Implement secure key storage (Keychain/Keystore)
- Add biometric authentication
- Integrate with Solana blockchain
- Implement transaction signing
- Add seed phrase backup/recovery
- Enable hardware wallet support

## 🎨 UI/UX Highlights

- **Consistent Design**: Matches HTML design pixel-perfect
- **Smooth Animations**: Native animations throughout
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Proper touch targets and contrast
- **Dark Mode**: Optimized for OLED displays

## 📝 Development Notes

### Adding New Features

1. Create feature folder in `src/features/`
2. Add screen component
3. Register in navigation
4. Update types if needed

### Styling

- Use the Colors constant from `src/constants/colors.ts`
- Follow existing component patterns
- Maintain consistent spacing (8px grid)

### State Management

Currently uses local state. For production, consider:

- Redux Toolkit
- Zustand
- React Query (for API calls)

## 🚧 Roadmap

- [ ] Integrate Solana Web3.js
- [ ] Implement actual wallet creation
- [ ] Add transaction signing
- [ ] Connect to Solana RPC
- [ ] Implement NFT gallery
- [ ] Add dApp browser
- [ ] Multi-wallet support
- [ ] Transaction history
- [ ] Price charts
- [ ] Push notifications

## 🤝 Contributing

This is a demo project. Feel free to fork and enhance!

## 📄 License

MIT License - feel free to use this code for your projects!

## 🙏 Acknowledgments

- Design inspired by modern Web3 wallets
- Built with React Native and Expo
- Icons by Ionicons
- Color scheme optimized for dark mode

---

**Note**: This is a UI/UX demonstration app with sample data. Do not use for actual cryptocurrency transactions without implementing proper security measures and blockchain integration.
