# XRPL Vault & Lending Terminal

A stunning, production-ready web application for demonstrating XLS-65d (Single Asset Vaults) and XLS-66 (Lending Protocol) on the XRP Ledger. Features a professional financial terminal aesthetic with sidebar navigation and comprehensive vault management.

## 🎨 Design Philosophy

**Financial Terminal Aesthetic** - Inspired by professional trading interfaces with a modern cyberpunk twist:
- Dark theme with electric cyan/magenta/purple accents
- Left sidebar navigation for organized access
- Monospace typography for blockchain data
- Smooth animations and micro-interactions
- Glassmorphic cards with neon borders
- Professional, data-rich layouts

## ✨ Features

### 🏦 Vault Management (XLS-65d)
- **Create Vaults**: Submit VaultCreate transactions with full field support
  - Asset types: XRP, IOU, or MPT
  - Configure maximum asset capacity
  - Set vault metadata and share metadata
  - Private vault and non-transferable share flags
- **View Vaults**: Browse all vaults for your account
- **Transaction History**: Track all vault operations

### 💰 Lending Protocol (XLS-66)
- **Coming Soon**: Placeholder interface for upcoming lending features
- **Educational Resources**: Links to XLS-66 proposal and documentation
- **Status Updates**: Track amendment progress

### 👤 Account Management
- **Generate Accounts**: Create new XRPL accounts with automatic devnet funding
- **Import Accounts**: Import existing accounts via seed
- **Persistent Storage**: Accounts saved in browser localStorage
- **Account Selection**: Quick account switching in sidebar
- **Balance Display**: Real-time XRP balance tracking
- **Copy & Delete**: One-click operations for account management

### 🎯 User Experience
- **Sidebar Navigation**: Organized sections for Vaults, Lending, and Activity
- **Real-time Status**: Live devnet connection indicator
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Visual feedback for all operations
- **Error Handling**: Clear messages with recovery options

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

### Getting Started
1. **Create Account**: Click "Generate" in the sidebar to create a new funded XRPL account
2. **Select Account**: Choose an active account from the dropdown
3. **Navigate**: Use the sidebar to access different sections

### Creating a Vault
1. Navigate to **Create Vault** in the sidebar
2. Select asset type (XRP, IOU, or MPT)
3. Enter asset details based on type
4. Set maximum asset capacity
5. Optionally add metadata and configure flags
6. Submit the VaultCreate transaction

### Viewing Vaults
1. Navigate to **My Vaults** in the sidebar
2. View all vaults associated with your selected account
3. See vault details: asset, balance, shares, capacity
4. Identify private vaults and non-transferable shares

### Transaction History
1. Navigate to **Transactions** in the sidebar
2. Search transactions by hash, type, or account
3. Filter by status (all, success, failed)
4. Click external link icon to view on XRPL explorer

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
- `.cyber-card`: Glassmorphic cards with hover effects and neon borders
- `.cyber-button`: Gradient buttons with shine animation
- `.cyber-input`: Styled form inputs with focus states
- `.glow-text`: Text with cyan neon glow effect
- `.mono-text`: Monospace text for blockchain data

## 🔗 XRPL Connection

Connects to XRPL Devnet: `wss://s.devnet.rippletest.net:51233`

All accounts are funded automatically using the devnet faucet.

## 📚 Resources

### XLS-65d: Single Asset Vaults
- [XLS-65d Specification](https://opensource.ripple.com/docs/xls-65d-single-asset-vault/reference/transactions/vaultcreate)
- [GitHub Proposal](https://github.com/XRPLF/XRPL-Standards/pull/239)
- [Community Discussion](https://github.com/XRPLF/XRPL-Standards/discussions/192)

### XLS-66: Lending Protocol
- [XLS-66 Proposal](https://github.com/XRPLF/XRPL-Standards/pull/240)
- [Dev.to Article](https://dev.to/ripplexdev/xrp-ledger-lending-protocol-2pla)
- [Amendment Status](https://xrpl.org/resources/known-amendments)

## 🎬 Demo Features

Perfect for demonstrating:
- ✅ VaultCreate transaction submission
- ✅ Multiple asset type support (XRP, IOU, MPT)
- ✅ Vault listing and visualization
- ✅ Transaction history tracking
- 🔜 XLS-66 lending features (coming soon)

## 🤝 Contributing

Built for the XRPL community. Feel free to fork, modify, and use for your own projects!

## 📄 License

MIT License - See LICENSE file for details
