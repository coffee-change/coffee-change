"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSolana } from "@/components/solana-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Wallet, LogOut, User } from "lucide-react";

function truncateAddress(address: string): string {
	return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
	const { login, logout, authenticated, user } = usePrivy();
	const { walletAddress, isConnected } = useSolana();

	const handleLogin = async () => {
		try {
			await login();
		} catch (err) {
			console.error("Failed to login:", err);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch (err) {
			console.error("Failed to logout:", err);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="min-w-[140px] justify-between">
					{isConnected && walletAddress ? (
						<>
							<div className="flex items-center gap-2">
								<Wallet className="h-4 w-4" />
								<span className="font-mono text-sm">
									{truncateAddress(walletAddress)}
								</span>
							</div>
							<ChevronDown className="ml-2 h-4 w-4" />
						</>
					) : (
						<>
							<Wallet className="mr-2 h-4 w-4" />
							<span>Connect Wallet</span>
							<ChevronDown className="ml-2 h-4 w-4" />
						</>
					)}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				className="w-[280px]">
				{!authenticated ? (
					<>
						<DropdownMenuLabel>Get Started</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<div className="p-2">
							<p className="text-sm text-muted-foreground mb-3 px-2">
								Create an embedded wallet by logging in with your
								email
							</p>
							<Button
								onClick={handleLogin}
								className="w-full">
								<Wallet className="mr-2 h-4 w-4" />
								Login / Sign Up
							</Button>
						</div>
					</>
				) : (
					<>
						<DropdownMenuLabel>Connected Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<div className="px-2 py-1.5">
							<div className="flex items-center gap-2">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
									<User className="h-4 w-4 text-primary" />
								</div>
								<div className="flex flex-col">
									<span className="text-sm font-medium">
										{user?.email?.address || "Privy User"}
									</span>
									{walletAddress && (
										<span className="text-xs text-muted-foreground font-mono">
											{truncateAddress(walletAddress)}
										</span>
									)}
								</div>
							</div>
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive cursor-pointer"
							onClick={handleLogout}>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
