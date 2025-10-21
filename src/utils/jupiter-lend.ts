/**
 * Jupiter Lend SDK Integration
 * Provides deposit and withdraw functionality for Jupiter Earn
 */

import {
  Connection,
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getDepositIx,
  getWithdrawIx,
  getLendingTokens,
  getLendingTokenDetails,
  getUserLendingPositionByAsset,
} from "@jup-ag/lend/earn";
import { BN } from "bn.js";

// USDC mainnet mint address
export const USDC_MAINNET_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

// Jupiter Lend program ID
export const JUPITER_LEND_PROGRAM_ID = new PublicKey(
  "jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9"
);

/**
 * Deposit USDC into Jupiter Earn
 * @param connection - Solana connection
 * @param signerPublicKey - User's wallet public key
 * @param amount - Amount in USDC (with 6 decimals)
 * @returns VersionedTransaction ready to be signed and sent
 */
export async function createDepositTransaction(
  connection: Connection,
  signerPublicKey: PublicKey,
  amount: number // Amount in USDC (e.g., 1.5 for $1.50)
): Promise<VersionedTransaction> {
  try {
    // Convert amount to token decimals (USDC has 6 decimals)
    const amountInTokenDecimals = new BN(Math.floor(amount * 1_000_000));

    console.log("Creating deposit transaction...", {
      signer: signerPublicKey.toString(),
      amount,
      amountInTokenDecimals: amountInTokenDecimals.toString(),
    });

    // Get deposit instruction from Jupiter Lend SDK
    const depositIx = await getDepositIx({
      amount: amountInTokenDecimals,
      asset: USDC_MAINNET_MINT,
      signer: signerPublicKey,
      connection,
    });

    console.log("Deposit instruction received:", depositIx);

    // Convert the raw instruction to TransactionInstruction
    const instruction = new TransactionInstruction({
      programId: new PublicKey(depositIx.programId),
      keys: depositIx.keys.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(depositIx.data),
    });

    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();

    // Create transaction message
    const messageV0 = new TransactionMessage({
      payerKey: signerPublicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [instruction],
    }).compileToV0Message();

    // Create versioned transaction
    const transaction = new VersionedTransaction(messageV0);

    console.log("Transaction created successfully");
    return transaction;
  } catch (error) {
    console.error("Error creating deposit transaction:", error);
    throw new Error(
      `Failed to create deposit transaction: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Withdraw USDC from Jupiter Earn
 * @param connection - Solana connection
 * @param signerPublicKey - User's wallet public key
 * @param amount - Amount in USDC (with 6 decimals)
 * @returns VersionedTransaction ready to be signed and sent
 */
export async function createWithdrawTransaction(
  connection: Connection,
  signerPublicKey: PublicKey,
  amount: number // Amount in USDC (e.g., 1.5 for $1.50)
): Promise<VersionedTransaction> {
  try {
    // Convert amount to token decimals (USDC has 6 decimals)
    const amountInTokenDecimals = new BN(Math.floor(amount * 1_000_000));

    console.log("Creating withdraw transaction...", {
      signer: signerPublicKey.toString(),
      amount,
      amountInTokenDecimals: amountInTokenDecimals.toString(),
    });

    // Get withdraw instruction from Jupiter Lend SDK
    const withdrawIx = await getWithdrawIx({
      amount: amountInTokenDecimals,
      asset: USDC_MAINNET_MINT,
      signer: signerPublicKey,
      connection,
    });

    console.log("Withdraw instruction received:", withdrawIx);

    // Convert the raw instruction to TransactionInstruction
    const instruction = new TransactionInstruction({
      programId: new PublicKey(withdrawIx.programId),
      keys: withdrawIx.keys.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(withdrawIx.data),
    });

    // Get latest blockhash
    const latestBlockhash = await connection.getLatestBlockhash();

    // Create transaction message
    const messageV0 = new TransactionMessage({
      payerKey: signerPublicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [instruction],
    }).compileToV0Message();

    // Create versioned transaction
    const transaction = new VersionedTransaction(messageV0);

    console.log("Transaction created successfully");
    return transaction;
  } catch (error) {
    console.error("Error creating withdraw transaction:", error);
    throw new Error(
      `Failed to create withdraw transaction: ${
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
  lendingToken: PublicKey
) {
  try {
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
  userPublicKey: PublicKey
) {
  try {
    const position = await getUserLendingPositionByAsset({
      asset: USDC_MAINNET_MINT,
      user: userPublicKey,
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
export function bnToNumber(bn: typeof BN.prototype, decimals: number): number {
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
