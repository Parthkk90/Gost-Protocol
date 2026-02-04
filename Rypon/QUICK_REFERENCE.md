# 🚀 Quick Reference - Rypon Wallet

## Start Development

```bash
npx expo start
# Then: press 'i' for iOS, 'a' for Android, or scan QR
```

## Project Structure

```
src/
├── components/ui/     → Reusable UI (Button, Input, Card, etc.)
├── constants/         → Colors (#6d13ec theme)
├── data/             → Sample data (wallet, assets, contacts)
├── features/         → All screens organized by feature
│   ├── onboarding/  → 4 screens
│   ├── wallet/      → Home screen
│   ├── send/        → Send assets
│   ├── receive/     → Receive with QR
│   ├── settings/    → Settings
│   └── swap/        → Token swap
├── navigation/       → Navigation setup
└── types/           → TypeScript types
```

## Key Files

- `App.tsx` - Main entry point
- `src/constants/colors.ts` - Theme colors
- `src/data/sampleData.ts` - Mock data
- `src/navigation/RootNavigator.tsx` - Navigation

## Screens Flow

1. Onboarding (3 steps) → Get Started
2. Create/Import → Main App (Bottom Tabs)
3. Home → Send/Receive/Settings
4. Swap Tab

## Color Palette

```typescript
primary: "#6d13ec"; // Purple
backgroundDark: "#181022"; // Deep dark
surfaceDark: "#251b30"; // Card background
textPrimary: "#FFFFFF"; // White
textSecondary: "#a89db9"; // Gray
```

## Common Tasks

### Add New Screen

1. Create `src/features/[name]/[Name]Screen.tsx`
2. Add to `src/navigation/RootNavigator.tsx`
3. Update `src/navigation/types.ts`

### Change Colors

Edit `src/constants/colors.ts`

### Modify Data

Edit `src/data/sampleData.ts`

### Add Component

Create in `src/components/ui/[Component].tsx`

## Navigation

- Stack: Main flow (onboarding → app)
- Tabs: Bottom navigation (5 tabs)
- Modal: Send, Receive screens

## Dependencies

- React Navigation (Stack + Tabs)
- Expo Linear Gradient
- React Native QR Code
- Expo Clipboard
- Safe Area Context

## Sample Data

- Balance: $1,240.50
- Assets: SOL, USDC, BTC
- Address: 8xGv...3aD2
- 3 Contacts, Recent transactions

## Build Commands

```bash
npm start              # Start dev server
npm run ios           # iOS simulator
npm run android       # Android emulator
npm run web           # Web (limited)
```

## Troubleshooting

```bash
# Clear cache
npx expo start -c

# Reinstall
rm -rf node_modules
npm install

# Reset Metro
npx expo start --clear
```

## Documentation

- `PROJECT_SUMMARY.md` - Complete overview
- `WALLET_README.md` - Feature documentation
- `SETUP_GUIDE.md` - Installation guide

## Quick Tips

✅ App uses mock data - safe to test
✅ All screens match HTML design exactly
✅ TypeScript for type safety
✅ Feature-based clean architecture
✅ Reusable component library

## Next Steps for Production

- Integrate Solana Web3.js
- Implement wallet generation
- Add transaction signing
- Connect to blockchain
- Add proper security

---

**Ready to code? Run `npx expo start` and start building!** 🎉
