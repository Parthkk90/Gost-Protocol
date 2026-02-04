# ✅ Testing Checklist - Rypon Wallet

Use this checklist to test all features of the wallet app.

## 🚀 Getting Started

- [ ] Run `npx expo start`
- [ ] App loads without errors
- [ ] Choose iOS/Android/Expo Go
- [ ] App opens to Onboarding Step 1

---

## 📱 Onboarding Flow

### Step 1: Welcome Screen

- [ ] Purple gradient background visible
- [ ] Hero animation/image displays
- [ ] Title: "Welcome to your portal to Solana"
- [ ] Subtitle: "Secure, simple, and powerful."
- [ ] Progress indicator shows dot 1 active
- [ ] "Next" button is visible
- [ ] Tap "Next" → navigates to Step 2

### Step 2: Features Screen

- [ ] Background pattern/glow visible
- [ ] Animated card with wallet icon
- [ ] Floating elements (token, image icons)
- [ ] Title: "Manage your SOL and NFTs..."
- [ ] Progress indicator shows dot 2 active
- [ ] "Skip" button in header
- [ ] "Back" button works
- [ ] Tap "Next" → navigates to Step 3
- [ ] Tap "Skip" → goes to Get Started

### Step 3: Security Screen

- [ ] Shield icon displayed
- [ ] Title: "Security first."
- [ ] Progress indicator shows dot 3 active
- [ ] "Get Started" button visible
- [ ] "Already have a wallet? Import" link
- [ ] Tap "Get Started" → Main App
- [ ] Tap "Import" → Main App (both work)

### Get Started Screen

- [ ] SolWallet logo with glow
- [ ] Title: "Welcome to SolWallet"
- [ ] Hero card with security badge
- [ ] "Create New Wallet" button
- [ ] "Import Existing Wallet" button
- [ ] Legal text at bottom
- [ ] Both buttons → navigate to Main App

---

## 🏠 Main App - Home Screen

### Header

- [ ] QR scanner icon (left)
- [ ] Wallet selector (center)
- [ ] "Wallet 1" displayed
- [ ] Gradient wallet icon
- [ ] Settings icon (right)
- [ ] Settings icon → opens Settings screen

### Balance Section

- [ ] Balance displays: $1,240.50
- [ ] Green trending up icon
- [ ] Change displays: +$12.45 (1.2%)
- [ ] Wallet address: 8xGv...3aD2
- [ ] Copy icon next to address
- [ ] Tap address → copies to clipboard

### Action Buttons

- [ ] Send button (purple, arrow up)
- [ ] Receive button (gray, arrow down)
- [ ] Send button → opens Send screen
- [ ] Receive button → opens Receive screen

### Assets List

- [ ] "Assets" header with "Manage" link
- [ ] 3 assets displayed:
  - [ ] Solana (SOL) - 12.5 SOL / $850.00 / +2.4%
  - [ ] USD Coin (USDC) - 390.50 USDC / $390.50 / 0.0%
  - [ ] Bitcoin (BTC) - 0.0000 BTC / $0.00 / 0.0%
- [ ] Each asset has icon, name, balance, value, change%
- [ ] Assets are tappable (ready for detail view)

---

## 💸 Send Screen

### Header

- [ ] Back button works
- [ ] Title: "Send SOL"
- [ ] Settings icon (right)

### Balance Chip

- [ ] Green status dot animated
- [ ] "Available: 12.45 SOL" displayed

### Recipient Input

- [ ] "TO" label
- [ ] @ icon on left
- [ ] Input field placeholder visible
- [ ] "Paste" button on right
- [ ] QR scanner icon on right
- [ ] Paste button → fills address
- [ ] Input accepts text

### Amount Input

- [ ] "AMOUNT" label
- [ ] "Show USD" toggle with swap icon
- [ ] MAX button (top right)
- [ ] Large amount input (placeholder: 0.00)
- [ ] USD equivalent below (≈ $0.00 USD)
- [ ] MAX button → fills with 12.45
- [ ] Amount updates USD value

### Recent Contacts

- [ ] "RECENT CONTACTS" label
- [ ] 3 contacts displayed horizontally:
  - [ ] Alice.sol with avatar
  - [ ] Bob.eth with avatar
  - [ ] Jason with initials
- [ ] Contacts are scrollable
- [ ] Tap contact → fills recipient

### Bottom Action

- [ ] White "Next" button with arrow
- [ ] Button is sticky at bottom
- [ ] Tap Next → goes back (demo)

---

## 📥 Receive Screen

### Header

- [ ] Close button (X) top left
- [ ] Title: "Receive"
- [ ] Share icon top right
- [ ] Close button → goes back

### Network Indicator

- [ ] Green pulsing dot
- [ ] "Solana Network" text
- [ ] Chip has glass effect

### QR Code

- [ ] White card with QR code
- [ ] QR code is visible and centered
- [ ] Logo overlay in center
- [ ] Card has shadow effect

### Address Display

- [ ] "WALLET ADDRESS" label
- [ ] Address: 8xOp...3kL9 (or similar)
- [ ] Copy icon next to address
- [ ] Tap address → copies full address

### Info Box

- [ ] Info icon (i) on left
- [ ] Warning text about SPL tokens
- [ ] "Solana (SOL)" and "SPL tokens" bolded
- [ ] Purple border and background

### Bottom Action

- [ ] "Copy Address" button with copy icon
- [ ] Button is purple
- [ ] Tap button → copies address

---

## 🔄 Swap Screen

### Header

- [ ] Title: "Swap" (centered)
- [ ] Settings icon (right)

### From Card

- [ ] "You pay" label
- [ ] MAX button (top right)
- [ ] Balance: 4.85 SOL
- [ ] Amount input: 1.5
- [ ] SOL token selector with gradient icon
- [ ] Dropdown arrow
- [ ] USD value: ≈ $210.45

### Swap Button

- [ ] Circular button between cards
- [ ] Swap arrows icon
- [ ] Positioned in center
- [ ] Tappable

### To Card

- [ ] "You receive" label
- [ ] Amount: 209.80 (read-only)
- [ ] USDC token selector with blue icon
- [ ] Dropdown arrow
- [ ] USD value: ≈ $209.80
- [ ] Red badge: -0.3%

### Transaction Details

- [ ] Rate: 1 SOL ≈ 140.2 USDC (with info icon)
- [ ] Divider line
- [ ] Est. Network Fee: < $0.01 (with gas icon)
- [ ] Max Slippage: 0.5% (with edit icon)

### Bottom Action

- [ ] White "Review Order" button
- [ ] Button is sticky at bottom

---

## ⚙️ Settings Screen

### Header

- [ ] Back button works
- [ ] Title: "Wallet Settings"

### Profile Section

- [ ] Avatar with emoji (🦄)
- [ ] Edit badge on avatar
- [ ] Name: "Solana Whale"
- [ ] Address chip: 8xF2...3k9
- [ ] Copy icon next to address

### Network Section

- [ ] "NETWORK" section title
- [ ] Developer Mode row:
  - [ ] Globe icon (blue)
  - [ ] "Developer Mode" title
  - [ ] "Enable testnet networks" subtitle
  - [ ] Toggle switch (off by default)
  - [ ] Toggle works
- [ ] Divider line
- [ ] RPC Endpoint row:
  - [ ] Server icon (purple)
  - [ ] "RPC Endpoint" title
  - [ ] "Mainnet Beta" subtitle
  - [ ] Chevron right
  - [ ] Tappable

### Security Section

- [ ] "SECURITY" section title
- [ ] Show Private Key row:
  - [ ] Key icon (red)
  - [ ] "Show Private Key" title (red)
  - [ ] Chevron right
  - [ ] Tappable
- [ ] Divider
- [ ] Trusted Apps row:
  - [ ] Shield icon (green)
  - [ ] "Trusted Apps" title
  - [ ] Chevron right
- [ ] Divider
- [ ] Face ID row:
  - [ ] Face icon (gray)
  - [ ] "Face ID" title
  - [ ] Toggle switch (on by default)
  - [ ] Toggle works

### Preferences Section

- [ ] "PREFERENCES" section title
- [ ] General Settings row (with chevron)
- [ ] Address Book row (with chevron)
- [ ] Support row (with external link icon)

### Footer

- [ ] Version text: "Version 1.0.4 (Build 234)"
- [ ] "Remove Account" button (red text)

---

## 🧭 Bottom Tab Navigation

### Tab Bar

- [ ] Tab bar visible at bottom
- [ ] Tab bar has blur effect
- [ ] 5 tabs displayed:
  1. [ ] Home (wallet icon)
  2. [ ] Collectibles (grid icon)
  3. [ ] Swap (swap icon)
  4. [ ] Activity (lightning icon)
  5. [ ] Browser (globe icon)

### Tab Switching

- [ ] Tap Home → shows Home screen
- [ ] Home tab active (purple)
- [ ] Tap Collectibles → "Coming Soon" placeholder
- [ ] Tap Swap → shows Swap screen
- [ ] Swap tab active (purple)
- [ ] Tap Activity → "Coming Soon" placeholder
- [ ] Tap Browser → "Coming Soon" placeholder
- [ ] Active tab has filled icon
- [ ] Inactive tabs are gray
- [ ] Tab labels are bold

---

## 🎨 UI/UX Testing

### Colors & Theme

- [ ] Primary purple (#6d13ec) used consistently
- [ ] Dark background (#181022) throughout
- [ ] Surface cards (#251b30) visible
- [ ] Text is readable (white/gray)
- [ ] Gradients display correctly

### Animations

- [ ] Screen transitions are smooth
- [ ] Buttons have press feedback
- [ ] Tab switches animate
- [ ] Modal presentations work

### Typography

- [ ] Titles are bold and readable
- [ ] Subtitles are gray and smaller
- [ ] Numbers display correctly
- [ ] Icons are properly sized

### Layout

- [ ] All screens fit on screen
- [ ] No content cut off
- [ ] Proper spacing between elements
- [ ] Cards have rounded corners
- [ ] Safe areas respected

---

## 🔧 Technical Testing

### Navigation

- [ ] Back buttons work everywhere
- [ ] Deep linking ready (if implemented)
- [ ] Modal dismissal works
- [ ] Tab history maintained

### State Management

- [ ] Data persists across screens
- [ ] Input values maintained
- [ ] Toggle states work
- [ ] Sample data loads correctly

### Performance

- [ ] App loads quickly
- [ ] No lag when scrolling
- [ ] Smooth animations
- [ ] No memory leaks visible

---

## 📊 Sample Data Verification

### Wallet Data

- [ ] Total Balance: $1,240.50
- [ ] Wallet Address: 8xGv...3aD2
- [ ] Wallet Name: Wallet 1

### Assets

- [ ] SOL: 12.5 tokens, $850, +2.4%
- [ ] USDC: 390.5 tokens, $390.50, 0.0%
- [ ] BTC: 0 tokens, $0, 0.0%

### Contacts

- [ ] Alice.sol (with avatar)
- [ ] Bob.eth (with avatar)
- [ ] Jason (initials only)

---

## ✅ Final Checks

### Overall App

- [ ] No crashes or errors
- [ ] All buttons work
- [ ] All navigation works
- [ ] Colors match design
- [ ] Animations smooth
- [ ] Text readable
- [ ] Icons display correctly

### Ready for Next Steps

- [ ] App runs on iOS
- [ ] App runs on Android
- [ ] Code is clean and organized
- [ ] TypeScript compiles
- [ ] No warnings in console

---

## 🎯 Testing Summary

**Total Items**: ~150+ checkpoints
**Estimated Testing Time**: 20-30 minutes for full test

### Quick Test (5 min)

1. [ ] Launch app
2. [ ] Complete onboarding
3. [ ] View home screen
4. [ ] Open Send screen
5. [ ] Open Receive screen
6. [ ] Switch to Swap tab
7. [ ] Open Settings

### Full Test (30 min)

- [ ] Test all checkpoints above
- [ ] Try all buttons and links
- [ ] Test on multiple platforms
- [ ] Verify all sample data
- [ ] Check all animations

---

**Testing Complete!** 🎉

If all items checked, your Rypon Wallet is working perfectly!
