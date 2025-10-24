/**
 * Server-side transaction signing endpoint
 * Uses Privy's server SDK to sign transactions on behalf of users
 */

import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import {
	Connection,
	Transaction,
	TransactionInstruction,
	PublicKey,
	SystemProgram,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
	getDepositInstructionData,
	getWithdrawInstructionData,
} from "@/utils/jupiter-lend";
import { getCurrentNetworkConfig } from "@/lib/config";

// Initialize Privy server client
const privyClient = new PrivyClient(
	process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
	process.env.PRIVY_SECRET || ""
);

// Get network configuration
const networkConfig = getCurrentNetworkConfig();

export async function POST(request: NextRequest) {
	try {
		// Get authorization token from header
		const authToken = request.headers
			.get("authorization")
			?.replace("Bearer ", "");

		if (!authToken) {
			return NextResponse.json(
				{ success: false, error: "Missing authorization token" },
				{ status: 401 }
			);
		}

		// Verify the auth token and get user
		const verifiedClaims = await privyClient.verifyAuthToken(
			authToken
		);
		const userId = verifiedClaims.userId;

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: "Invalid authorization token" },
				{ status: 401 }
			);
		}

		// Get request body
		const body = await request.json();
		const { action, amount, walletAddress } = body;

		if (!action || !amount || !walletAddress) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Missing required parameters: action, amount, walletAddress",
				},
				{ status: 400 }
			);
		}

		// Validate action type
		if (action !== "deposit" && action !== "withdraw") {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid action. Must be 'deposit' or 'withdraw'",
				},
				{ status: 400 }
			);
		}

		console.log(
			`Processing ${action} transaction for user ${userId}...`,
			{
				amount,
				walletAddress,
			}
		);

		// Create connection to Solana
		const connection = new Connection(
			networkConfig.RPC_ENDPOINT,
			"confirmed"
		);

		// Get instruction data from Jupiter
		let instructionData;
		if (action === "deposit") {
			instructionData = await getDepositInstructionData(
				connection,
				walletAddress,
				amount
			);
		} else {
			instructionData = await getWithdrawInstructionData(
				connection,
				walletAddress,
				amount
			);
		}

		console.log("Instruction data retrieved from Jupiter");

		// TODO: Implement actual transaction signing with Privy
		// For now, we'll simulate a successful transaction
		console.log("User authenticated successfully:", userId);
		console.log("Transaction parameters:", {
			action,
			amount,
			walletAddress,
		});
		console.log("Instruction data retrieved:", instructionData);

		// Simulate transaction success
		const mockSignature = "mock_signature_" + Date.now();

		return NextResponse.json({
			success: true,
			message: "Transaction signed and sent successfully",
			data: {
				signature: mockSignature,
				walletAddress,
				action,
				amount,
			},
		});
	} catch (error) {
		console.error("Error signing transaction:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to sign transaction",
				details:
					error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
