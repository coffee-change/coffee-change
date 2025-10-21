# ☕ Coffee Change

An automated micro-investment app that tracks Solana wallet transactions and rounds up spare change for investment. Users can accumulate round-ups and invest them into **Jupiter Earn** to earn yield on their USDC.

## 🎯 Features

- **Wallet Integration**: Connect with Phantom, Solflare, or Backpack wallets via Wallet Standard
- **Transaction Tracking**: Real-time monitoring of Solana wallet transactions using Helius RPC
- **Round-up Calculation**: Automatic calculation of spare change from transactions
- **Jupiter Earn Integration**: Deposit accumulated round-ups ($1 USDC minimum) into Jupiter Lend protocol
- **Mainnet Ready**: Configured for Solana Mainnet with real USDC deposits
- **Portfolio Tracking**: View your investment position and performance

## 🏦 How It Works

1. **Connect Wallet**: Users connect their Solana wallet (Phantom recommended)
2. **Track Transactions**: App monitors wallet transactions and calculates round-up amounts
3. **Accumulate Round-ups**: Spare change accumulates in the "Charges" tab (mock data shows $1.00)
4. **Invest in Jupiter Earn**: Click "Confirm & Invest" to deposit USDC into Jupiter Lend protocol
5. **Earn Yield**: USDC deposits earn yield through Jupiter's lending pools

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Solana wallet (Phantom recommended for best compatibility)
- USDC on Solana Mainnet for testing deposits
- SOL for transaction fees

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coffee-change
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```
*Note: Use `--legacy-peer-deps` flag due to Solana library peer dependency conflicts*

3. Configure environment variables:

Create a `.env.local` file in the root directory:
```env
# Solana Network (mainnet or devnet)
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet

# RPC Endpoints (use your own Helius API key)
NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/                    # API endpoints (Next.js API routes)
│   │   ├── txns/              # Transaction fetching endpoints
│   │   ├── prices/            # Price oracle data (CoinGecko)
│   │   ├── proposals/         # Round-up proposal generation
│   │   └── pool/position/     # Pool position data (mock)
│   ├── globals.css            # Global styles with coffee theme
│   ├── layout.tsx             # Root layout with Solana provider
│   └── page.tsx               # Main app entry point
├── components/
│   ├── ui/                    # Reusable UI components (shadcn/ui)
│   ├── app-navigation.tsx     # Main navigation between screens
│   ├── dashboard.tsx          # Dashboard with wallet info & balances
│   ├── roundup-charges.tsx    # Charges tab with Jupiter deposit
│   ├── roundup-review.tsx     # Round-up review screen
│   ├── investment-position.tsx # Investment portfolio view
│   ├── investment-history.tsx  # Past investment records
│   ├── solana-provider.tsx    # Solana wallet context (Wallet Standard)
│   └── wallet-connect-button.tsx # Wallet connection UI
├── lib/
│   ├── config.ts              # Network and app configuration
│   └── services/              # Business logic services
│       ├── transaction-fetcher.ts  # Fetches wallet transactions
│       ├── proposal-engine.ts      # Calculates round-ups
│       └── price-oracle.ts         # Fetches SOL/USDC prices
└── utils/
    └── jupiter-lend.ts        # Jupiter Lend SDK integration
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context (Solana Provider)

### Blockchain
- **Network**: Solana Mainnet
- **Wallet**: Wallet Standard + Phantom API
- **RPC Provider**: Helius
- **Libraries**:
  - `@solana/web3.js` - Solana transactions
  - `@solana/kit` - RPC and wallet utilities
  - `@wallet-standard/react` - Multi-wallet support
  - `@jup-ag/lend` - Jupiter Lend SDK

### Backend Services
- **API Routes**: Next.js API routes
- **Price Oracle**: CoinGecko API (free tier)
- **Transaction Fetcher**: Helius RPC

### Key Dependencies
```json
{
  "@jup-ag/lend": "^latest",
  "@solana/web3.js": "^latest",
  "@solana/kit": "^4.0.0",
  "@wallet-standard/react": "^latest",
  "bn.js": "^5.2.1",
  "next": "15.5.4",
  "react": "^19",
  "tailwindcss": "^3.4.1"
}
```

## 🎨 Design System

The app uses a coffee-themed design system with:

- **Primary Colors**:
  - Dark Coffee Bean (#2D2016) - Primary text and backgrounds
  - Mocha Brown (#735557) - Buttons and accents
  - Creamy Foam (#D9D9D9) - Card backgrounds and surfaces

- **Typography**: Clean, modern sans-serif fonts (Inter, Sora, Roboto)
- **Layout**: Card-based design with rounded corners and subtle shadows
- **UI Components**: shadcn/ui (customized with coffee theme)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

1. **Dashboard** (`dashboard.tsx`):
   - Main screen showing wallet info, balances (SOL & USDC)
   - Quick access to charges, position, and settings
   - Displays network badge (Solana Mainnet)

2. **Charges Tab** (`roundup-charges.tsx`):
   - Shows pending round-up charges ($1.00 USDC)
   - "Confirm & Invest" button triggers Jupiter Lend deposit
   - Uses `jupiter-lend.ts` to create deposit transaction
   - Phantom wallet popup for transaction approval

3. **Round-up Review** (`roundup-review.tsx`):
   - Review screen for confirming transfers (currently mock)
   - Future: Will show actual transaction details before investing

4. **Investment Position** (`investment-position.tsx`):
   - Portfolio view showing user's position in Jupiter Earn
   - Displays pool stats and performance (currently mock)

5. **Solana Provider** (`solana-provider.tsx`):
   - Context provider for wallet connection
   - Manages wallet state, balances, and RPC connection
   - Uses Wallet Standard for multi-wallet support

### API Endpoints

- `GET /api/txns` - Fetch user's wallet transactions
- `POST /api/txns` - Trigger transaction fetch with params
- `GET /api/prices` - Get current SOL/USD and USDC/USD prices from CoinGecko
- `POST /api/proposals` - Generate round-up proposals from transactions
- `GET /api/pool/position?wallet=<address>` - Get user's pool position (mock)

### Core Services

#### Transaction Fetcher (`lib/services/transaction-fetcher.ts`)
- Fetches transactions from Solana using Helius RPC
- Parses SOL and SPL token transfers
- Calculates transaction amounts and timestamps

#### Proposal Engine (`lib/services/proposal-engine.ts`)
- Generates round-up proposals from transactions
- Supports percentage-based and round-up strategies
- Configurable min/max proposal amounts

#### Price Oracle (`lib/services/price-oracle.ts`)
- Fetches real-time SOL/USD and USDC/USD prices
- Uses CoinGecko API (free tier)
- 1-minute price caching

#### Jupiter Lend Integration (`utils/jupiter-lend.ts`)
- Creates deposit/withdraw transactions for Jupiter Earn
- Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Helper functions for token details and user positions

## 🌐 Network Configuration

**Current Network**: **Solana Mainnet** ✅

The app is configured to run on Solana Mainnet with real USDC deposits into Jupiter Earn. Key configurations:

- **RPC Provider**: Helius (configured in `.env.local`)
- **USDC Mint**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (Mainnet USDC)
- **Jupiter Lend Program**: `jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9`

To switch to **Devnet** for testing:
1. Update `.env.local`: `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`
2. Update `src/lib/config.ts`: Change `CURRENT_NETWORK` default
3. Change USDC mint in components to devnet USDC: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

## 📱 Wallet Support

**Recommended**: Phantom Wallet (best tested compatibility)

Also supports:
- Solflare
- Backpack
- Any wallet supporting the Wallet Standard

**Important**: The app uses `window.phantom.solana` API directly for transaction signing, so Phantom wallet extension must be installed.

## 🧪 Testing the App

### Test Flow (Mainnet)

1. **Connect Wallet**:
   - Install Phantom wallet extension
   - Ensure you have USDC and SOL in your wallet
   - Connect wallet on the dashboard

2. **Navigate to Charges**:
   - Click "View Charges" on dashboard
   - You'll see $1.00 USDC pending (mock data)

3. **Deposit to Jupiter Earn**:
   - Click "Confirm & Invest" button
   - Phantom popup will appear
   - Approve the transaction
   - Transaction deposits $1 USDC into Jupiter Earn
   - Check console for transaction signature
   - View on Solscan: `https://solscan.io/tx/{signature}`

### Required Tokens for Testing
- **Minimum**: 1 USDC (for deposit) + ~0.001 SOL (for fees)
- Get USDC: Use Jupiter Exchange to swap SOL → USDC

## 🚧 Development Status & Current Implementation

### ✅ Completed Features
- [x] Wallet connection (Wallet Standard + Phantom)
- [x] Real-time balance fetching (SOL & USDC)
- [x] Transaction fetching from Helius RPC
- [x] Price oracle integration (CoinGecko)
- [x] Jupiter Lend SDK integration
- [x] Mainnet USDC deposits to Jupiter Earn
- [x] Transaction signing with Phantom wallet

### 🚧 Mock Data (To Be Implemented)
- [ ] Round-up charges (currently shows mock $1.00)
- [ ] Investment position/portfolio data
- [ ] Investment history
- [ ] Real-time round-up calculation from actual transactions

### 📋 Future Development Tasks

1. **Transaction Scanning**:
   - Connect proposal engine to real transaction fetcher
   - Calculate actual round-ups from user transactions
   - Store round-up data (currently mock)

2. **Jupiter Position Tracking**:
   - Fetch real user position from Jupiter Lend
   - Display actual yield and APY
   - Show transaction history

3. **Smart Contract Integration**:
   - Optional: Deploy custom contract for batched deposits
   - Track user contributions on-chain
   - Implement withdrawal flow

4. **UI/UX Enhancements**:
   - Better error handling and user feedback
   - Transaction status tracking
   - Loading states and animations

## 🔑 Important Files to Understand

| File | Purpose | Status |
|------|---------|--------|
| `src/utils/jupiter-lend.ts` | Jupiter Earn deposit/withdraw | ✅ Working |
| `src/components/roundup-charges.tsx` | Charges tab with invest button | ✅ Working |
| `src/components/solana-provider.tsx` | Wallet connection & state | ✅ Working |
| `src/lib/services/transaction-fetcher.ts` | Fetch wallet transactions | ✅ Working |
| `src/lib/services/proposal-engine.ts` | Calculate round-ups | ⚠️ Not connected to UI |
| `src/lib/services/price-oracle.ts` | Get SOL/USDC prices | ✅ Working |

## 🐛 Known Issues

1. **Wallet Standard Features**: The wallet-standard library's feature access pattern had issues, so we use direct Phantom API (`window.phantom.solana`)
2. **Mock Data**: Round-up charges, investment position, and history use hardcoded mock data
3. **Network Switching**: Changing networks requires code changes and rebuild

## 🤝 Contributing

When working on this project:

1. **Always use** `npm install --legacy-peer-deps` for installations
2. **Test on Devnet first** before mainnet (update config accordingly)
3. **Check console logs** for transaction signatures and errors
4. **Update mock data** in components if testing new flows
5. **Document changes** in this README

## 🔍 Troubleshooting

### Build Errors

**Issue**: `npm install` fails with peer dependency errors
**Solution**: Use `npm install --legacy-peer-deps`

**Issue**: TypeScript errors about `BN` type
**Solution**: Ensure `@types/bn.js` is installed: `npm i --save-dev @types/bn.js --legacy-peer-deps`

**Issue**: Module not found errors
**Solution**: Clear Next.js cache: `rm -rf .next && npm run dev`

### Wallet Connection Issues

**Issue**: Wallet not connecting
**Solution**:
- Ensure Phantom extension is installed and unlocked
- Refresh the page and try again
- Check browser console for errors

**Issue**: "Wallet does not support signing" error
**Solution**:
- The app uses Phantom's direct API (`window.phantom.solana`)
- Make sure you're using Phantom wallet, not another wallet
- Check that Phantom is properly initialized

### Transaction Errors

**Issue**: Phantom popup not appearing
**Solution**:
- Check console logs for errors
- Ensure `window.phantom.solana` is available (Phantom installed)
- Verify you're on mainnet and have USDC in wallet

**Issue**: Transaction fails with "Insufficient funds"
**Solution**:
- Ensure you have at least 1 USDC + 0.001 SOL (for fees)
- Check your wallet balance on Phantom

**Issue**: "blockhash not found" error
**Solution**:
- RPC connection issue - check your Helius API key
- Try again (blockhash may have expired)

### Development Issues

**Issue**: Hot reload not working
**Solution**: Restart dev server: `npm run dev`

**Issue**: Environment variables not loading
**Solution**:
- Ensure `.env.local` exists in project root
- Restart dev server after changing env vars
- Variables must start with `NEXT_PUBLIC_` for client-side access

### Network Issues

**Issue**: Using wrong network (devnet vs mainnet)
**Solution**:
- Check `.env.local`: `NEXT_PUBLIC_SOLANA_CLUSTER`
- Check `src/lib/config.ts`: `CURRENT_NETWORK` default
- Verify network badge on UI shows correct network

## 📞 Support

For questions or issues:
1. Check this README first
2. Review console logs for error messages
3. Check Solscan for transaction details: `https://solscan.io/tx/{signature}`
4. Verify wallet connection and balances

## 📄 License

This project is for development purposes.