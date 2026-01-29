# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains XRPL (XRP Ledger) demonstration projects organized as a monorepo with three independent applications:

1. **xrpl.js/** - Tutorial scripts demonstrating basic XRPL operations
2. **batch/** - React UI demonstrating XRPL Batch transactions (XLS-89)
3. **mpt-demo/** - React UI demonstrating Multi-Purpose Tokens (MPT)
4. **single-asset-vault-loans/** - (Empty directory, future project)

Each project is self-contained with its own dependencies and build system.

## Development Commands

### xrpl.js (Tutorial Scripts)

```bash
cd xrpl.js
npm install
npm start                    # Run tutorials via ts-node
```

**Running specific tutorials:**
- Edit `src/index.ts` to uncomment the desired tutorial function
- Each tutorial file exports a function demonstrating specific XRPL functionality

**Environment setup:**
- Copy `.env.example` to `.env`
- Add wallet seeds as `SEED_1` and `SEED_2` for tutorials that require existing wallets

### batch (Batch Transaction Demo)

```bash
cd batch
npm install
npm run dev                  # Start dev server on http://localhost:5173
npm run build               # Build for production
npm run lint                # Run ESLint
npm run preview             # Preview production build
```

### mpt-demo (Multi-Purpose Token Demo)

```bash
cd mpt-demo
npm install
npm run dev                  # Start dev server on http://localhost:5173
npm run build               # Build for production
npm run lint                # Run ESLint
npm run preview             # Preview production build
```

## Architecture

### xrpl.js Structure

The tutorial project follows a simple script-based architecture:

- **src/[1-6]-*.ts** - Individual tutorial scripts, each demonstrating a specific XRPL feature
- **src/index.ts** - Entry point that imports and runs selected tutorials
- **src/helpers/** - Utility functions shared across tutorials

All tutorials connect to XRPL Testnet: `wss://s.altnet.rippletest.net:51233`

### React App Structure (batch & mpt-demo)

Both React applications share a similar architecture:

**Component Organization:**
- **App.tsx** - Main application container managing:
  - Client connection state
  - Account management (list of wallets)
  - Tab/view navigation
  - Global transaction history
  - Token/MPT tracking
- **components/** - Feature-specific components, each handling a distinct XRPL operation
- **main.tsx** - React entry point
- **index.css** - Global styles with Tailwind CSS

**Key Architectural Patterns:**

1. **Centralized State Management**: App.tsx maintains all accounts, tokens, and transactions in state and passes them down as props
2. **Client Singleton**: XRPL Client instance is created in App.tsx and passed to child components
3. **Component Independence**: Each component in `components/` is self-contained and handles its own form state and XRPL operations
4. **Transaction Flow**: Components submit transactions, then notify parent via callbacks to update global state

### batch App Components

- **AccountManager** - Generate and manage XRPL accounts with faucet funding
- **TokenIssuer** - Create MPT tokens and IOUs
- **SingleAccountBatch** - Build batch transactions with multiple inner transactions from one account
- **MultiAccountBatch** - Create atomic swaps between two accounts using batch transactions
- **Payment** - Standard XRPL payments
- **TrustSet** - Establish trust lines
- **MPTokenAuthorize** - Authorize accounts to hold MPTs
- **TokenList** - Display created tokens
- **TransactionHistory** - Show transaction history
- **TransactionViewer** - JSON transaction viewer
- **BatchVisualizer** - Animated visualization of batch transactions

### mpt-demo App Components

- **AccountManager** - Generate and manage XRPL accounts
- **MPTokenCreator** - Create Multi-Purpose Tokens with flags (Can Lock, Require Auth, Can Escrow, Can Trade, Can Transfer, Can Clawback)
- **MPTokenAuthorizer** - Authorize/unauthorize accounts for restricted MPTs
- **MPTPayment** - Send MPT payments between accounts
- **MPTClawback** - Issuer clawback of MPTs from holders
- **MPTokenDestroyer** - Permanently destroy MPTs
- **MPTokenLocker** - Lock/unlock MPTs (global and individual)
- **MPTokenVisualizer** - Animated demonstrations of MPT capabilities
- **TransactionHistory** - Transaction history display
- **TransactionViewer** - JSON transaction viewer
- **utils/transactionTracker.ts** - Utility for tracking transaction status

## XRPL-Specific Implementation Notes

### Batch Transactions (XLS-89)

Batch transactions allow multiple transactions to be executed atomically or with specific failure handling modes. Key implementation details:

**Inner Transaction Requirements:**
- Must set `Flags: 1073741824` (tfInnerBatchTxn)
- Must set `Fee: "0"` (fee paid by outer Batch transaction)
- Must set `SigningPubKey: ""` (empty string)
- Must provide valid `Sequence` or `TicketSequence`
- Must have 2-8 inner transactions

**Batch Flags:**
- `65536` (tfAllOrNothing) - All succeed or all fail
- `131072` (tfOnlyOne) - Only first successful transaction applies
- `262144` (tfUntilFailure) - Apply until first failure
- `524288` (tfIndependent) - Apply all regardless of failure

**Multi-Account Batches:**
- Outer transaction signed by primary account
- Additional accounts sign via `BatchSigners` array
- Each signer provides: Account, SigningPubKey, TxnSignature

### Multi-Purpose Tokens (MPT)

MPTs are native XRPL tokens with configurable flags and restrictions:

**MPT Creation Flow:**
1. Submit `MPTokenIssuanceCreate` transaction with flags
2. Track `mptIssuanceId` from transaction result
3. For restricted tokens (Require Auth), authorize holders via `MPTokenAuthorize`
4. Holders can then receive payments via standard `Payment` transactions with MPT amount objects

**MPT Flags:**
- `lsfMPTCanLock` (1) - Enable locking
- `lsfMPTRequireAuth` (2) - Require issuer authorization
- `lsfMPTCanEscrow` (4) - Enable escrow
- `lsfMPTCanTrade` (8) - Enable DEX trading
- `lsfMPTCanTransfer` (16) - Enable transfers
- `lsfMPTCanClawback` (32) - Enable issuer clawback

### Network Connections

Both React apps connect to XRPL Testnet by default:
```typescript
const client = new Client("wss://s.altnet.rippletest.net:51233");
```

For mainnet, change to: `wss://xrplcluster.com/`

## Tech Stack

### xrpl.js
- TypeScript with ts-node execution
- xrpl.js v4.0.0
- CommonJS module system
- dotenv for environment configuration

### batch & mpt-demo
- React 19 with TypeScript
- Vite 7+ for build tooling
- Tailwind CSS 4+ with PostCSS
- Framer Motion for animations
- xrpl.js v4.4.2
- Lucide React for icons
- ESLint with React-specific rules
- ES Modules

## Important Development Notes

1. **XRPL Client Connection**: Always connect before operations (`await client.connect()`) and disconnect after (`await client.disconnect()`)

2. **Account Persistence**: Accounts in React apps are stored in component state only. They will be lost on page refresh. For persistent development, save wallet secrets separately.

3. **Testnet Funding**: React apps use `client.fundWallet()` for automatic faucet funding. This only works on Testnet/Devnet.

4. **Transaction Fees**: Standard transactions use dynamic fees. Batch transactions aggregate fees for all inner transactions.

5. **Sequence Numbers**: Must be obtained fresh before each transaction submission. Use `client.getXrpBalance()` or similar to verify account state.

6. **MPT Metadata**: Stored as hex-encoded JSON. The demos include helper functions to encode/decode metadata.

7. **Async Operations**: All XRPL operations are asynchronous. Use `await` consistently and handle errors appropriately.

8. **React 19 Features**: Both React apps use React 19. Be aware of breaking changes if downgrading.

## Common Workflows

### Adding a New Tutorial (xrpl.js)

1. Create new file: `src/N-feature-name.ts`
2. Export an async function demonstrating the feature
3. Import and call in `src/index.ts`
4. Update README.md with tutorial description

### Adding a New Component (batch/mpt-demo)

1. Create component file in `src/components/`
2. Accept `client`, `accounts`, and relevant callbacks as props
3. Implement local form state
4. Submit transactions via `client.submitAndWait()`
5. Notify parent via callbacks for state updates
6. Import and add to appropriate tab in `App.tsx`
