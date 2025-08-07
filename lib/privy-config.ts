import type { PrivyClientConfig } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'wallet'],
  appearance: {
    theme: 'light',
    accentColor: '#3b82f6',
    showWalletLoginFirst: false, // Prioritize email for embedded wallets
  },
  defaultChain: sepolia,
  supportedChains: [sepolia],
  // Embedded wallet configuration - Required for session signers
  embeddedWallets: {
    createOnLogin: 'all-users', // Auto-create embedded wallets for ALL users (required for session signers)
    requireUserPasswordOnCreate: false, // Streamlined UX
  },
};
