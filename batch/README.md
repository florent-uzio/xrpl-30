# XRPL Batch Transaction Demo

A comprehensive UI demonstration of XRPL Batch transactions, showcasing both single-account and multi-account batch modes with atomic swap capabilities.

## Features

- **Account Management**: Generate and manage XRPL accounts
- **Token Issuance**: Create MPT tokens and IOUs
- **Single Account Batch**: Create batch transactions from a single account with multiple inner transactions
- **Multi-Account Batch**: Demonstrate atomic swaps between two accounts
- **All Batch Flags**: Support for all four batch execution modes:
  - **All or Nothing** (tfAllOrNothing): All transactions must succeed or the whole batch fails
  - **Only One** (tfOnlyOne): Only the first successful transaction is applied
  - **Until Failure** (tfUntilFailure): All transactions are applied until the first failure
  - **Independent** (tfIndependent): All transactions will be applied, regardless of failure

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- XRPL Devnet access (automatically configured)

### Installation

```bash
cd batch
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Build

```bash
npm run build
```

## Usage

### 1. Generate Accounts

1. Navigate to the **Accounts** tab
2. Click **Generate** to create a new XRPL account
3. The account will be automatically funded via the Devnet faucet
4. Generate at least 2 accounts for multi-account batch demonstrations

### 2. Issue Tokens

1. Navigate to the **Issue Tokens** tab
2. Select an account from the sidebar
3. Choose between **MPT Token** or **IOU**
4. Fill in the required fields:
   - For MPT: Asset scale, maximum amount, metadata, and flags
   - For IOU: Currency code and initial amount
5. Click **Create** to issue the token

### 3. Single Account Batch

1. Navigate to the **Single Account Batch** tab
2. Select an account from the sidebar
3. Choose a batch mode (All or Nothing, Only One, Until Failure, or Independent)
4. Click **Add Transaction** to add inner transactions (2-8 required)
5. Configure each transaction:
   - Type (Payment, OfferCreate, TrustSet)
   - Destination, amount, currency, and issuer (if applicable)
6. Click **Submit Batch Transaction** to execute

### 4. Multi-Account Batch (Atomic Swap)

1. Navigate to the **Multi Account Batch** tab
2. Select **Account A** and **Account B** from the dropdowns
3. Configure the swap:
   - **Account A**: Sends RLUSD (IOU) to Account B
   - **Account B**: Sends MPT token to Account A
4. Choose a batch mode
5. Click **Build Batch Transaction**
6. **Sign with Account A**: Account A signs the transaction
7. **Sign with Account B & Submit**: Account B signs and the transaction is submitted
8. The atomic swap completes atomically - both transactions succeed or both fail

## Architecture

### Components

- **AccountManager**: Account generation and management
- **TokenIssuer**: MPT and IOU issuance
- **SingleAccountBatch**: Single-account batch transaction builder
- **MultiAccountBatch**: Multi-account atomic swap demonstration
- **TransactionViewer**: JSON transaction viewer

### Technologies

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **XRPL.js** for XRPL integration
- **Lucide React** for icons

## Batch Transaction Structure

### Single Account Batch

```json
{
  "TransactionType": "Batch",
  "Account": "rAccount...",
  "Flags": 65536,
  "RawTransactions": [
    {
      "RawTransaction": {
        "TransactionType": "Payment",
        "Account": "rAccount...",
        "Destination": "rDestination...",
        "Amount": "1000000",
        "Sequence": 123,
        "Fee": "0",
        "SigningPubKey": "",
        "Flags": 1073741824
      }
    }
  ],
  "Fee": "40"
}
```

### Multi-Account Batch

```json
{
  "TransactionType": "Batch",
  "Account": "rAccountA...",
  "Flags": 65536,
  "RawTransactions": [
    {
      "RawTransaction": {
        "TransactionType": "Payment",
        "Account": "rAccountA...",
        "Destination": "rAccountB...",
        "Amount": {
          "currency": "RLUSD",
          "issuer": "rAccountA...",
          "value": "1000"
        },
        "Sequence": 123,
        "Fee": "0",
        "SigningPubKey": "",
        "Flags": 1073741824
      }
    },
    {
      "RawTransaction": {
        "TransactionType": "Payment",
        "Account": "rAccountB...",
        "Destination": "rAccountA...",
        "Amount": {
          "currency": "MPT",
          "issuer": "rAccountB...",
          "value": "2"
        },
        "Sequence": 456,
        "Fee": "0",
        "SigningPubKey": "",
        "Flags": 1073741824
      }
    }
  ],
  "BatchSigners": [
    {
      "Account": "rAccountB...",
      "SigningPubKey": "...",
      "TxnSignature": "..."
    }
  ],
  "Fee": "60"
}
```

## Important Notes

- This demo uses **XRPL Devnet** - no real value is involved
- Batch transactions require the **Batch amendment** to be enabled on the network
- Inner transactions must have:
  - `Flags: 1073741824` (tfInnerBatchTxn)
  - `Fee: "0"`
  - Empty `SigningPubKey: ""`
  - Valid `Sequence` or `TicketSequence`
- Batch transactions require 2-8 inner transactions
- Multi-account batches require signatures from all participating accounts

## References

- [XRPL Batch Transaction Documentation](https://xrpl.org/docs/references/protocol/transactions/types/batch)
- [XRPL.js Documentation](https://xrpl.org/docs/references/xrpl-js)

## License

This project is for demonstration purposes.
