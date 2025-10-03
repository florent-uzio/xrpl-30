# MPT Demo Script for YouTube Video

## Introduction (30 seconds)

- "Welcome to the XRPL Multi-Purpose Token Demo!"
- "MPTs just went live on mainnet, and today we'll explore their powerful capabilities"
- "This is a modern web app built with React, TypeScript, and XRPL.js"

## Demo Flow (8-10 minutes)

### 1. Account Setup (1 minute)

- Show the clean, modern UI
- Click "Generate" to create testnet accounts
- Explain the faucet integration
- Show account details and balance

### 2. MPT Creation (3-4 minutes)

- Navigate to "Create MPT" tab
- **Basic Configuration**:
  - Asset Scale: "2" (0.01 precision)
  - Maximum Amount: "1,000,000"
  - Transfer Fee: "100" (0.1%)
- **Flags Configuration** (the exciting part!):
  - ✅ **Can Transfer**: Enable P2P transfers
  - ✅ **Can Trade**: Enable DEX trading
  - ❌ **Require Authorization**: Keep it open
  - ❌ **Can Clawback**: No clawback needed
  - ❌ **Can Lock**: No locking
  - ❌ **Can Escrow**: No escrow
- **Metadata**: Show the rich JSON metadata
- Click "Create Multi-Purpose Token"
- Show the transaction JSON viewer

### 3. Authorization Demo (2 minutes)

- Switch to "Authorize" tab
- Show how to authorize another account
- **Highlight global MPT access**: Show that MPTs created by any account are available
- Explain the authorization process
- Demonstrate unauthorization
- Show the issuer information in the dropdown

### 4. MPT Payments (2 minutes)

- Switch to "Send Payment" tab
- Show how to send MPTs between accounts
- **Demonstrate global access**: Switch accounts and show MPTs from other accounts are available
- Explain the Payment transaction structure with `mpt_issuance_id`
- Demonstrate direct MPT transfers
- Show optional fields (destination tag, invoice ID)
- Highlight that MPTs can only be sent directly (no DEX trading in v1)

### 5. MPT Clawback (2 minutes)

- Switch to "Clawback" tab
- Show how issuers can reclaim tokens from holders
- Explain regulatory compliance use cases
- Demonstrate the Clawback transaction structure
- Highlight the issuer authority requirements
- Show when clawback is useful (fraud prevention, error recovery)

### 6. MPT Lock/Unlock (2 minutes)

- Switch to "Lock/Unlock" tab
- Show how issuers can lock MPT balances to prevent transfers
- Demonstrate locking an MPT (tfMPTLock flag = 1)
- Show how locked tokens cannot be transferred
- Demonstrate unlocking an MPT (tfMPTUnlock flag = 2)
- Explain the optional Holder field for specific account targeting
- Show the MPTokenIssuanceSet transaction structure
- Highlight use cases: compliance, security, emergency stops

### 7. Transaction History (2 minutes)

- Switch to "History" tab
- Show all transactions from the session
- Demonstrate search and filtering capabilities
- Show transaction details: source account, type, hash, validation status
- Demonstrate copy-to-clipboard functionality for transaction hashes
- Show external link to XRPL Explorer
- Explain the persistent storage across sessions
- Highlight the real-time updates as new transactions are created

### 8. Advanced Features (1-2 minutes)

- Show different flag combinations
- Demonstrate restricted tokens (Require Auth)
- Show transfer fee implications
- Explain real-world use cases
- Highlight transaction tracking and history features

## Key Talking Points

### Technical Highlights

- "Built with modern web technologies"
- "Real XRPL testnet integration"
- "TypeScript for type safety"
- "Framer Motion for smooth animations"
- "Tailwind CSS for beautiful design"
- "Persistent transaction history with localStorage"
- "Real-time transaction tracking and updates"

### MPT Capabilities

- "MPTs are more flexible than traditional tokens"
- "Six different flags for fine-grained control"
- "Built-in transfer fees for issuers"
- "Lock/unlock functionality for compliance and security"
- "Rich metadata support"
- "Authorization system for compliance"
- "Direct payment transfers between accounts"
- "Issuer clawback capabilities for compliance"
- "Lock/unlock functionality for emergency controls"

### Use Cases

- **Stablecoins**: Can Transfer + Can Trade
- **Securities**: Require Auth + Can Clawback + Can Lock
- **Rewards**: Can Lock + Can Escrow
- **Utility Tokens**: Can Transfer + Can Trade
- **Compliance Tokens**: All flags enabled + Lock/Unlock controls

## Conclusion (30 seconds)

- "MPTs represent a new era of tokenization on XRPL"
- "The flexibility and control they offer is unprecedented"
- "Perfect for everything from stablecoins to securities"
- "Check out the code on GitHub and try it yourself!"

## Call to Action

- Subscribe for more XRPL content
- Follow on social media
- Check out the GitHub repository
- Try the demo yourself
