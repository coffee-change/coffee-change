/**
 * Jupiter Lend SDK Integration
 * Provides deposit and withdraw functionality for Jupiter Earn
 */

import { type Address } from "@solana/kit";
import {
	getDepositIx,
	getWithdrawIx,
	getLendingTokens,
	getLendingTokenDetails,
	getUserLendingPositionByAsset,
} from "@jup-ag/lend/earn";
import { BN } from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js"; // Still needed for Jupiter SDK compatibility

// USDC mainnet mint address
export const USDC_MAINNET_MINT =
	"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
export const USDC_MAINNET_MINT_PUBKEY = new PublicKey(
	USDC_MAINNET_MINT
);

// Jupiter Lend program ID
export const JUPITER_LEND_PROGRAM_ID =
	"jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9" as Address;
export const JUPITER_LEND_PROGRAM_ID_PUBKEY = new PublicKey(
	JUPITER_LEND_PROGRAM_ID
);

/**
 * Get deposit instruction data for Jupiter Earn
 * @param connection - Solana connection (web3.js for Jupiter SDK compat)
 * @param signerAddress - User's wallet address
 * @param amount - Amount in USDC (e.g., 1.5 for $1.50)
 * @returns Instruction data for server-side signing
 */
export async function getDepositInstructionData(
	connection: Connection,
	signerAddress: string,
	amount: number
) {
	try {
		// Convert amount to token decimals (USDC has 6 decimals)
		const amountInTokenDecimals = new BN(
			Math.floor(amount * 1_000_000)
		);
		const signerPubkey = new PublicKey(signerAddress);

		console.log("Getting deposit instruction...", {
			signer: signerAddress,
			amount,
			amountInTokenDecimals: amountInTokenDecimals.toString(),
		});

		// Get deposit instruction from Jupiter Lend SDK
		const depositIx = await getDepositIx({
			amount: amountInTokenDecimals,
			asset: USDC_MAINNET_MINT_PUBKEY,
			signer: signerPubkey,
			connection,
		});

		console.log("Deposit instruction received");

		return {
			programId: depositIx.programId.toString(),
			keys: depositIx.keys.map((key) => ({
				pubkey: key.pubkey.toString(),
				isSigner: key.isSigner,
				isWritable: key.isWritable,
			})),
			data: Array.from(depositIx.data), // Convert Uint8Array to regular array for JSON serialization
		};
	} catch (error) {
		console.error("Error getting deposit instruction:", error);
		throw new Error(
			`Failed to get deposit instruction: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

/**
 * Get withdraw instruction data for Jupiter Earn
 * @param connection - Solana connection (web3.js for Jupiter SDK compat)
 * @param signerAddress - User's wallet address
 * @param amount - Amount in USDC (e.g., 1.5 for $1.50)
 * @returns Instruction data for server-side signing
 */
export async function getWithdrawInstructionData(
	connection: Connection,
	signerAddress: string,
	amount: number
) {
	try {
		// Convert amount to token decimals (USDC has 6 decimals)
		const amountInTokenDecimals = new BN(
			Math.floor(amount * 1_000_000)
		);
		const signerPubkey = new PublicKey(signerAddress);

		console.log("Getting withdraw instruction...", {
			signer: signerAddress,
			amount,
			amountInTokenDecimals: amountInTokenDecimals.toString(),
		});

		// Get withdraw instruction from Jupiter Lend SDK
		const withdrawIx = await getWithdrawIx({
			amount: amountInTokenDecimals,
			asset: USDC_MAINNET_MINT_PUBKEY,
			signer: signerPubkey,
			connection,
		});

		console.log("Withdraw instruction received");

		return {
			programId: withdrawIx.programId.toString(),
			keys: withdrawIx.keys.map((key) => ({
				pubkey: key.pubkey.toString(),
				isSigner: key.isSigner,
				isWritable: key.isWritable,
			})),
			data: Array.from(withdrawIx.data), // Convert Uint8Array to regular array for JSON serialization
		};
	} catch (error) {
		console.error("Error getting withdraw instruction:", error);
		throw new Error(
			`Failed to get withdraw instruction: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

/**
 * Get all available lending tokens
 */
export async function getAllLendingTokens(connection: Connection) {
	try {
		const tokens = await getLendingTokens({ connection });
		return tokens;
	} catch (error) {
		console.error("Error fetching lending tokens:", error);
		throw error;
	}
}

/**
 * Get detailed information about a lending token
 */
export async function getTokenDetails(
	connection: Connection,
	lendingTokenAddress: string
) {
	try {
		const lendingToken = new PublicKey(lendingTokenAddress);
		const details = await getLendingTokenDetails({
			lendingToken,
			connection,
		});
		return details;
	} catch (error) {
		console.error("Error fetching token details:", error);
		throw error;
	}
}

/**
 * Get user's lending position for USDC
 */
export async function getUserUSDCPosition(
	connection: Connection,
	userAddress: string
) {
	try {
		const userPubkey = new PublicKey(userAddress);
		const position = await getUserLendingPositionByAsset({
			asset: USDC_MAINNET_MINT_PUBKEY,
			user: userPubkey,
			connection,
		});
		return position;
	} catch (error) {
		console.error("Error fetching user position:", error);
		throw error;
	}
}

/**
 * Helper function to convert BN to number with decimals
 */
export function bnToNumber(
	bn: typeof BN.prototype,
	decimals: number
): number {
	return bn.toNumber() / Math.pow(10, decimals);
}

/**
 * Helper function to format USDC amount for display
 */
export function formatUSDC(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	}).format(amount);
}
