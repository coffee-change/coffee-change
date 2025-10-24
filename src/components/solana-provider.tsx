"use client";

import React, {
	createContext,
	useContext,
	useState,
	useMemo,
	useEffect,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
	createSolanaRpc,
	createSolanaRpcSubscriptions,
} from "@solana/kit";
import { getCurrentNetworkConfig } from "@/lib/config";

// Get current network configuration
const networkConfig = getCurrentNetworkConfig();
console.log("Using RPC endpoint:", networkConfig.RPC_ENDPOINT);
const rpc = createSolanaRpc(networkConfig.RPC_ENDPOINT);
const ws = createSolanaRpcSubscriptions(networkConfig.WS_ENDPOINT);

interface SolanaContextState {
	// RPC
	rpc: ReturnType<typeof createSolanaRpc>;
	ws: ReturnType<typeof createSolanaRpcSubscriptions>;
	chain: `solana:${string}`;
	networkName: string;

	// Wallet State (Privy)
	walletAddress: string | null;
	isConnected: boolean;
	user: any; // Privy user object

	// Balance State
	solBalance: number | null;
	usdcBalance: number | null;
	isLoadingBalances: boolean;

	// Wallet Actions
	fetchBalances: () => Promise<void>;
}

const SolanaContext = createContext<SolanaContextState | undefined>(
	undefined
);

export function useSolana() {
	const context = useContext(SolanaContext);
	if (!context) {
		throw new Error("useSolana must be used within a SolanaProvider");
	}
	return context;
}

export function SolanaProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { ready, authenticated, user } = usePrivy();
	const { wallets } = useWallets();

	// State management
	const [solBalance, setSolBalance] = useState<number | null>(null);
	const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
	const [isLoadingBalances, setIsLoadingBalances] = useState(false);

	// Get Solana wallet address from Privy embedded wallet
	const walletAddress = useMemo(() => {
		console.log("Wallet connection debug:", {
			ready,
			authenticated,
			wallets: wallets?.length || 0,
			walletsData: wallets,
			userWallet: user?.linkedAccounts,
		});

		if (!ready || !authenticated || !user?.linkedAccounts)
			return null;

		// Find the Solana embedded wallet in linked accounts
		const solanaWallet = user.linkedAccounts.find(
			(account: any) =>
				account.type === "wallet" && account.chainType === "solana"
		);

		console.log("Found Solana wallet:", solanaWallet);
		return (solanaWallet as any)?.address || null;
	}, [ready, authenticated, user]);

	const isConnected = ready && authenticated && !!walletAddress;

	const fetchBalances = async () => {
		if (!walletAddress || !isConnected) return;

		setIsLoadingBalances(true);
		try {
			console.log("Fetching balance for address:", walletAddress);
			console.log("Using RPC endpoint:", networkConfig.RPC_ENDPOINT);

			// Add small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Fetch SOL balance
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const solBalanceResponse = await rpc
				.getBalance(walletAddress as any)
				.send();
			console.log("SOL balance response:", solBalanceResponse);

			const solLamports = solBalanceResponse.value;
			console.log("Extracted lamports:", solLamports);

			setSolBalance(Number(solLamports) / 1e9); // Convert lamports to SOL

			// Add delay between requests
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Fetch USDC balance using getTokenAccountsByOwner
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const tokenAccounts = await rpc
					.getTokenAccountsByOwner(
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						walletAddress as any,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						{ mint: networkConfig.USDC_MINT as any }
					)
					.send();

				if (tokenAccounts.value.length > 0) {
					const tokenAccount = tokenAccounts.value[0];
					const accountData = Buffer.from(
						tokenAccount.account.data,
						"base64"
					);
					// Token account balance is at bytes 64-72 (8 bytes, little endian)
					const balanceBytes = accountData.slice(64, 72);
					const balance = new DataView(
						balanceBytes.buffer
					).getBigUint64(0, true);
					setUsdcBalance(Number(balance) / 1_000_000); // USDC has 6 decimals
				} else {
					setUsdcBalance(0);
				}
			} catch (usdcError) {
				console.log(
					"No USDC account found or error fetching USDC:",
					usdcError
				);
				setUsdcBalance(0);
			}
		} catch (error) {
			console.error("Error fetching balances:", error);
			setSolBalance(null);
			setUsdcBalance(null);
		} finally {
			setIsLoadingBalances(false);
		}
	};

	// Initialize wallet tracking when user connects
	useEffect(() => {
		const initializeWallet = async () => {
			if (!walletAddress) return;

			try {
				const response = await fetch("/api/wallet/init", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ address: walletAddress }),
				});

				const result = await response.json();

				if (result.success) {
					console.log("✓ Wallet initialized:", result.data);
					if (result.data.isNewWallet) {
						console.log(
							"✓ New wallet detected, baseline set to:",
							result.data.last_tracked_tx
						);
					} else {
						console.log(
							"✓ Existing wallet, last tracked:",
							result.data.last_tracked_tx
						);
					}
				} else {
					console.error(
						"✗ Failed to initialize wallet tracking:",
						result.error
					);
					if (result.details) {
						console.error("  Details:", result.details);
					}
					if (result.network) {
						console.error(`  Current network: ${result.network}`);
					}
				}
			} catch (error) {
				console.error("Error initializing wallet tracking:", error);
			}

			// Fetch balances after initialization
			fetchBalances();
		};

		if (isConnected && walletAddress) {
			initializeWallet();
		} else {
			setSolBalance(null);
			setUsdcBalance(null);
		}
	}, [isConnected, walletAddress]);

	// Create context value
	const contextValue = useMemo<SolanaContextState>(
		() => ({
			// Static RPC values
			rpc,
			ws,
			chain: networkConfig.CHAIN as `solana:${string}`,
			networkName: networkConfig.DISPLAY_NAME,

			// Wallet values (Privy)
			walletAddress,
			isConnected,
			user,

			// Balance values
			solBalance,
			usdcBalance,
			isLoadingBalances,

			// Actions
			fetchBalances,
		}),
		[
			walletAddress,
			isConnected,
			user,
			solBalance,
			usdcBalance,
			isLoadingBalances,
		]
	);

	return (
		<SolanaContext.Provider value={contextValue}>
			{children}
		</SolanaContext.Provider>
	);
}
