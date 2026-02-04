# Rypon - Solana Web3 Wallet Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- React Navigation
- Expo Linear Gradient
- React Native QR Code
- Expo Clipboard
- And all other dependencies

### 2. Clear Expo Cache (Recommended)

```bash
npx expo start -c
```

### 3. Run the App

Choose your platform:

```bash
# iOS (Mac only)
npx expo start --ios

# Android
npx expo start --android

# Development mode with QR code
npx expo start
```

## 📱 App Structure

The app is now fully set up with:

### ✅ Completed Features

1. **Onboarding Flow** (3 screens)
   - Welcome screen with animations
   - Feature showcase
   - Security emphasis
   - Get Started screen

2. **Main Wallet App**
   - Home screen with balance and assets
   - Send SOL screen
   - Receive with QR code
   - Token Swap interface
   - Settings screen

3. **Navigation**
   - Stack navigation for main flow
   - Bottom tabs (Home, Collectibles, Swap, Activity, Browser)
   - Modal presentations for Send/Receive

4. **UI Components**
   - Button (with variants)
   - Input fields
   - Cards
   - Headers
   - Page indicators

5. **Sample Data**
   - Mock wallet with $1,240.50
   - 3 assets (SOL, USDC, BTC)
   - Transaction history
   - Contact list

## 🎨 Color Theme

The app uses the exact color scheme from your HTML design:

- **Primary Purple**: `#6d13ec`
- **Background Dark**: `#181022`
- **Surface Dark**: `#251b30`
- **Text Colors**: White (`#FFFFFF`) and Gray (`#a89db9`)

## 📂 Project Structure

```
src/
├── components/ui/      # Reusable UI components
├── constants/          # Colors and theme
├── data/              # Sample data
├── features/          # Feature modules
│   ├── onboarding/   # Onboarding screens
│   ├── wallet/       # Home screen
│   ├── send/         # Send screen
│   ├── receive/      # Receive screen
│   ├── settings/     # Settings
│   └── swap/         # Swap screen
├── navigation/        # Navigation setup
└── types/            # TypeScript types
```

## 🔧 Configuration Notes

### Entry Point

The app now uses standard Expo entry point (`App.tsx`) instead of expo-router.

### Dependencies Added

- `@react-navigation/native-stack` - Stack navigation
- `expo-linear-gradient` - Gradient effects
- `expo-clipboard` - Copy to clipboard
- `react-native-qrcode-svg` - QR code generation
- `react-native-svg` - SVG support

## 🎯 Testing the App

### Onboarding Flow

1. App starts with Onboarding Step 1
2. Navigate through 3 onboarding screens
3. Get Started screen with create/import options
4. Both lead to main app

### Main Features

- **Home Tab**: View wallet balance and assets
- **Send**: Enter recipient and amount
- **Receive**: Display QR code for receiving
- **Swap Tab**: Token swap interface
- **Settings**: Access from home screen header

## 🐛 Troubleshooting

### If you see module not found errors:

```bash
rm -rf node_modules
npm install
npx expo start -c
```

### If gradients don't show:

```bash
npx expo install expo-linear-gradient
```

### If QR codes don't work:

```bash
npx expo install react-native-svg react-native-qrcode-svg
```

## 📱 Features to Implement (Future)

This is a UI demo. For production, you'll need:

1. **Blockchain Integration**
   - Solana Web3.js integration
   - Wallet key generation
   - Transaction signing
   - RPC connection

2. **Security**
   - Keychain/Keystore integration
   - Biometric auth (Face ID/Touch ID)
   - Seed phrase backup
   - PIN/Password protection

3. **Additional Features**
   - Real transaction history
   - NFT gallery
   - dApp browser
   - Price charts
   - Multi-wallet support
   - Push notifications

## 🎨 Customization

### Change Colors

Edit `src/constants/colors.ts`

### Add New Screens

1. Create screen in `src/features/[feature-name]/`
2. Add to navigation in `src/navigation/RootNavigator.tsx`
3. Update types in `src/navigation/types.ts`

### Modify Sample Data

Edit `src/data/sampleData.ts`

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

## ✅ Checklist

Before running:

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Expo CLI installed globally (optional)
- [ ] iOS Simulator or Android Emulator set up
- [ ] All dependencies installed

## 🎉 You're Ready!

Run `npx expo start` and scan the QR code with Expo Go app (iOS/Android) or press `i` for iOS simulator or `a` for Android emulator.

---

**Note**: This is a demo app with mock data. Do not use for real cryptocurrency transactions without proper security implementation!
