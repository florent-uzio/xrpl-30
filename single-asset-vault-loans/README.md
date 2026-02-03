# XRPL Vault - Single Asset Vault Loans

A stunning, production-ready web application for managing XRPL accounts on devnet with a neo-financial terminal aesthetic. Built for XRPL community demos and showcasing the upcoming Single Asset Vault amendment.

## 🎨 Design Philosophy

**Neo-Financial Terminal** - A bold fusion of Bloomberg Terminal precision and cyberpunk aesthetics. Features:
- Dark theme with electric cyan/magenta accents
- Monospace typography for addresses and data
- Smooth animations and micro-interactions
- Scan-line effects and glowing elements
- Professional, data-rich layouts

## ✨ Features

### Account Management
- **Create Accounts**: Generate new XRPL accounts with automatic devnet funding
- **Persistent Storage**: Accounts saved in browser localStorage for reuse
- **Account Cards**: Elegant card layout displaying address, balance, and sequence
- **Active Selection**: Select and switch between accounts with dropdown selector
- **Copy Addresses**: One-click address copying with visual feedback
- **Delete Accounts**: Remove accounts you no longer need

### Visual Experience
- **Real-time Connection Status**: Live devnet connection indicator
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Works beautifully on desktop and mobile
- **Loading States**: Visual feedback during account creation
- **Error Handling**: Clear error messages with recovery options

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
cd single-asset-vault-loans
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:5173 to view the application.

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite 7** for blazing fast builds
- **Tailwind CSS 4** with custom cyber theme
- **Framer Motion** for smooth animations
- **xrpl.js** for blockchain interactions
- **Lucide React** for beautiful icons

## 🎯 Usage

1. **Create Account**: Click "New Account" to generate and fund a new XRPL account on devnet
2. **View Accounts**: All created accounts appear in the card grid
3. **Select Account**: Click on a card or use the dropdown to select an active account
4. **Copy Address**: Click the copy icon on any account card
5. **Delete Account**: Click the trash icon to remove an account

## 🎨 Design System

### Colors
- **Cyber Dark**: Primary background `#0a0e17`
- **Cyber Blue**: Primary accent `#00d9ff`
- **Cyber Magenta**: Secondary accent `#ff006e`
- **Cyber Purple**: Gradient accent `#8b5cf6`
- **Cyber Green**: Success state `#00ff9f`

### Typography
- **Display Font**: JetBrains Mono (monospace)
- **Body Font**: Inter (sans-serif)

### Components
- `.cyber-card`: Glassmorphic cards with hover effects
- `.cyber-button`: Gradient buttons with shine animation
- `.cyber-input`: Styled form inputs
- `.glow-text`: Text with neon glow effect

## 🔗 XRPL Connection

Connects to XRPL Devnet: `wss://s.devnet.rippletest.net:51233`

All accounts are funded automatically using the devnet faucet.

## 📝 Next Steps

This foundation is ready for implementing Single Asset Vault features:
- Vault creation
- Collateral deposits
- Loan management
- Interest calculations
- Liquidation mechanics

## 🤝 Contributing

Built for the XRPL community. Feel free to fork, modify, and use for your own projects!

## 📄 License

MIT License - See LICENSE file for details
