"use client";

import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	DollarSign,
	Coffee,
	TrendingUp,
	Clock,
} from "lucide-react";
// Removed old imports - now using server-side API approach

interface PendingRoundUp {
	id: string;
	originalAmount: number;
	roundedAmount: number;
	spareChange: number;
	timestamp: string;
	transactionHash: string;
}

interface RoundUpChargesProps {
	onBack: () => void;
	onConfirmInvest: () => void;
}

export function RoundUpCharges({
	onBack,
	onConfirmInvest,
}: RoundUpChargesProps) {
	const { walletAddress, isConnected } = useSolana();
	const [isProcessing, setIsProcessing] = useState(false);

	// Mock data - Updated to show exactly $1.00 total in USDC
	const pendingRoundUps: PendingRoundUp[] = [
		{
			id: "1",
			originalAmount: 13.35,
			roundedAmount: 14.0,
			spareChange: 0.65,
			timestamp: "2024-12-15T14:30:00Z",
			transactionHash: "3Kj8...9Xm2",
		},
		{
			id: "2",
			originalAmount: 8.85,
			roundedAmount: 9.0,
			spareChange: 0.15,
			timestamp: "2024-12-14T11:15:00Z",
			transactionHash: "7Pm3...k9R1",
		},
		{
			id: "3",
			originalAmount: 22.8,
			roundedAmount: 23.0,
			spareChange: 0.2,
			timestamp: "2024-12-13T09:45:00Z",
			transactionHash: "9Qn5...f2H8",
		},
	];

	// Total is now exactly $1.00 USDC
	const totalPending = 1.0;

	const handleConfirmInvest = async () => {
		if (!isConnected || !walletAddress) {
			alert("Please connect your wallet to proceed");
			return;
		}

		setIsProcessing(true);

		try {
			console.log(
				"Creating Jupiter Lend deposit transaction for $1.00 USDC..."
			);

			// Use server-side API for transaction signing
			const response = await fetch("/api/transactions/sign", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: "deposit",
					amount: totalPending, // $1.00 USDC
					walletAddress: walletAddress,
				}),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Failed to sign transaction");
			}

			console.log("Transaction signed and sent:", result.data);
			console.log("✅ Investment Successful!");

			// Extract transaction signature from result if available
			const signature =
				result.data?.signature || "Transaction completed";
			console.log(`Transaction signature: ${signature}`);
			console.log(
				`View on Solscan: https://solscan.io/tx/${signature}`
			);

			alert(
				`Investment Successful!\n\nDeposited $${totalPending.toFixed(
					2
				)} USDC into Jupiter Earn\n\nTransaction: ${signature}\n\nView on Solscan: https://solscan.io/tx/${signature}`
			);

			// Navigate to success
			onConfirmInvest();
		} catch (error) {
			console.error("❌ Transaction failed:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to process investment";
			alert(`Transaction Failed\n\n${errorMessage}`);
		} finally {
			setIsProcessing(false);
		}
	};

	if (!isConnected || !walletAddress) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md coffee-card">
					<CardHeader className="text-center">
						<Coffee className="w-12 h-12 text-primary mx-auto mb-4" />
						<CardTitle className="coffee-text-primary">
							Wallet Not Connected
						</CardTitle>
						<CardDescription className="coffee-text-secondary">
							Please connect your wallet to view round-up charges
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={onBack}
							className="w-full coffee-button">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center gap-3">
					<Button
						onClick={onBack}
						variant="ghost"
						size="sm"
						className="p-2">
						<ArrowLeft className="w-4 h-4" />
					</Button>
					<div className="flex items-center gap-3">
						<Coffee className="w-8 h-8 text-primary" />
						<h1 className="text-2xl font-bold coffee-text-primary">
							Round-Up Charges
						</h1>
					</div>
				</div>

				{/* Pending Round-Up Summary Card */}
				<Card className="coffee-card">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DollarSign className="w-5 h-5" />
							Pending Round-Up Total
						</CardTitle>
						<CardDescription>
							Accumulated spare change ready to be invested
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="text-center">
							<div className="text-4xl font-bold coffee-text-primary mb-2">
								${totalPending.toFixed(2)}
							</div>
							<div className="text-sm text-muted-foreground">
								Total Pending Round-Up (USDC)
							</div>
						</div>

						<div className="text-center p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
							<div className="text-2xl font-semibold coffee-text-primary mb-1">
								${totalPending.toFixed(2)} USDC
							</div>
							<div className="text-xs text-muted-foreground">
								Ready to invest in Jupiter Earn
							</div>
						</div>

						<div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
							<DollarSign className="w-4 h-4 text-primary" />
							<span className="text-sm font-medium coffee-text-secondary">
								Payment Method: USDC only
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Pending Round-Up List */}
				<Card className="coffee-card">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="w-5 h-5" />
							Pending Round-Up Charges
						</CardTitle>
						<CardDescription>
							Transactions with spare change ready to be invested
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{pendingRoundUps.map((roundUp) => (
								<div
									key={roundUp.id}
									className="p-4 border rounded-lg">
									<div className="flex justify-between items-start">
										<div>
											<div className="font-medium coffee-text-primary">
												${roundUp.originalAmount.toFixed(2)} → $
												{roundUp.roundedAmount.toFixed(2)}
											</div>
											<div className="text-sm text-muted-foreground mt-1">
												Spare change:{" "}
												<span className="font-medium">
													${roundUp.spareChange.toFixed(2)}
												</span>
											</div>
										</div>
										<Badge
											variant="secondary"
											className="coffee-bg-mocha text-white">
											${roundUp.spareChange.toFixed(2)}
										</Badge>
									</div>

									<div className="flex justify-between items-center mt-3">
										<div className="text-xs text-muted-foreground">
											{new Date(
												roundUp.timestamp
											).toLocaleDateString()}{" "}
											at{" "}
											{new Date(roundUp.timestamp).toLocaleTimeString(
												[],
												{ hour: "2-digit", minute: "2-digit" }
											)}
										</div>
										<code className="text-xs bg-muted px-2 py-1 rounded">
											{roundUp.transactionHash}
										</code>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Action Buttons */}
				<div className="flex gap-4">
					<Button
						onClick={onBack}
						variant="outline"
						className="flex-1"
						disabled={isProcessing}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back
					</Button>
					<Button
						onClick={handleConfirmInvest}
						disabled={isProcessing || pendingRoundUps.length === 0}
						className="flex-1 coffee-button">
						{isProcessing ? (
							<>
								<div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
								Processing...
							</>
						) : (
							<>
								<TrendingUp className="w-4 h-4 mr-2" />
								Confirm & Invest
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
