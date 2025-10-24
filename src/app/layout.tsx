"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import {
	createSolanaRpc,
	createSolanaRpcSubscriptions,
} from "@solana/kit";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

import { SolanaProvider } from "@/components/solana-provider";
import "./globals.css";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<PrivyProvider
					appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
					config={{
						loginMethods: ["email", "wallet"],
						appearance: {
							theme: "light",
							accentColor: "#6A4E23",
							logo: undefined,
							walletChainType: "ethereum-and-solana",
						},
						externalWallets: {
							solana: {
								connectors: toSolanaWalletConnectors(),
							},
						},
						embeddedWallets: {
							solana: {
								createOnLogin: "users-without-wallets",
							},
						},
						solana: {
							rpcs: {
								"solana:devnet": {
									rpc: createSolanaRpc(
										"https://api.devnet.solana.com"
									),
									rpcSubscriptions: createSolanaRpcSubscriptions(
										"wss://api.devnet.solana.com"
									),
								},
							},
						},
						supportedChains: [
							{
								id: 103, // Solana Devnet chain ID
								name: "Solana Devnet",
								network: "solana-devnet",
								nativeCurrency: {
									name: "SOL",
									symbol: "SOL",
									decimals: 9,
								},
								rpcUrls: {
									default: {
										http: [
											process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL ||
												"https://api.devnet.solana.com",
										],
									},
								},
							},
						],
					}}>
					<SolanaProvider>{children}</SolanaProvider>
				</PrivyProvider>
			</body>
		</html>
	);
}
