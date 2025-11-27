# XRPL Multi-Purpose Token (MPT) Demo

A modern, interactive web application for managing Multi-Purpose Tokens on the XRP Ledger. This demo showcases the new MPT functionality that went live on mainnet.

## Features

### 🏦 Account Management

- Generate devnet accounts with XRP from the faucet
- View account balances and details
- Copy addresses and secret keys
- Manage multiple accounts

### 🪙 MPT Creation

- Create Multi-Purpose Tokens with full configuration
- Set all available MPT flags:
  - **Can Lock**: Allow tokens to be locked individually and globally
  - **Require Authorization**: Require issuer approval for holders
  - **Can Escrow**: Allow holders to place balances in escrow
  - **Can Trade**: Enable trading on XRPL DEX
  - **Can Transfer**: Allow transfers between accounts
  - **Can Clawback**: Allow issuer to claw back tokens
- Configure asset scale, transfer fees, and maximum amounts
- Add rich JSON metadata

### 🔐 Authorization Management

- Authorize accounts to hold specific MPTs
- Unauthorize accounts (when balance is zero)
- Manage allow-listing for restricted tokens

### 💸 MPT Payments

- Send MPTs directly between accounts
- Support for destination tags and invoice IDs
- Real-time transaction validation
- Direct transfer capabilities (no DEX trading in v1)

### 🔄 MPT Clawback

- Reclaim tokens from holders (issuer authority)
- Regulatory compliance features
- Fraud prevention and error recovery
- Requires "Can Clawback" flag to be enabled

### 🗑️ Token Destruction

- Permanently destroy MPTs (irreversible)
- Safety checks and warnings

### 🎬 Visualizations

- Animated MPT transfers between accounts
- Interactive demonstrations of token capabilities
- Real-time flag status indicators

### 📄 Transaction Viewer

- Formatted JSON transaction display
- Copy and download transaction data
- Ready for signing and submission

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **Framer Motion** for smooth animations
- **XRPL.js** for XRP Ledger integration
- **Lucide React** for beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository and navigate to the mpt-demo directory:

```bash
cd mpt-demo
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Generate Accounts**: Click "Generate" to create testnet accounts with XRP from the faucet
2. **Select Account**: Choose an account from the sidebar to perform operations
3. **Create MPT**: Configure and create Multi-Purpose Tokens with custom flags
4. **Authorize**: Manage which accounts can hold your tokens
5. **Send Payments**: Transfer MPTs directly between accounts
6. **Clawback**: Reclaim tokens from holders (if enabled)
7. **Visualize**: Watch animated demonstrations of MPT capabilities
8. **View Transactions**: Copy or download formatted transaction JSON

## MPT Flags Explained

| Flag             | Description                                   | Use Case                              |
| ---------------- | --------------------------------------------- | ------------------------------------- |
| **Can Lock**     | Tokens can be locked individually or globally | Compliance, time-locked rewards       |
| **Require Auth** | Issuer must approve each holder               | KYC/AML compliance, restricted tokens |
| **Can Escrow**   | Holders can place tokens in escrow            | Conditional payments, smart contracts |
| **Can Trade**    | Tokens can be traded on XRPL DEX              | Liquid markets, price discovery       |
| **Can Transfer** | Tokens can be transferred between accounts    | P2P payments, general utility         |
| **Can Clawback** | Issuer can reclaim tokens                     | Regulatory compliance, error recovery |

## Network Information

- **Testnet**: `wss://s.altnet.rippletest.net:51233`
- **Mainnet**: Ready for production use (update connection string)

## Contributing

This is a demonstration project for educational purposes. Feel free to fork and modify for your own use cases.

## License

MIT License - see LICENSE file for details.

## Resources

- [XRPL MPT Documentation](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate)
- [XRPL.js Documentation](https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate)
- [XRP Ledger Dev Portal](https://xrpl.org/)
