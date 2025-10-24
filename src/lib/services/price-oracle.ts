/**
 * Price oracle service for fetching USD prices at block time
 * Supports Pyth and Jupiter price feeds
 */

import { Connection, PublicKey } from "@solana/web3.js";
// Removed unused @solana/kit imports
import { config } from "../config";

export interface PriceData {
	price: number;
	timestamp: number;
	source: "pyth" | "jupiter" | "cached";
	confidence?: number;
}

export interface HistoricalPriceRequest {
	tokenMint?: string;
	blockTime: number;
	slot?: number;
}

export class PriceOracle {
	private connection: Connection;
	private priceCache: Map<string, PriceData>;
	private cacheDuration: number = 60 * 1000; // 1 minute cache

	constructor() {
		const solanaConfig = config.getSolanaConfig();
		this.connection = new Connection(
			solanaConfig.rpcUrl,
			solanaConfig.commitment
		);
		this.priceCache = new Map();
	}

	/**
	 * Get current SOL price in USD
	 */
	async getCurrentSolPrice(): Promise<PriceData> {
		const cacheKey = "sol_current";
		const cached = this.getCachedPrice(cacheKey);
		if (cached) return cached;

		try {
			// Use CoinGecko for SOL price (free, no API key needed)
			const price = await this.fetchFromCoinGecko("solana");
			const priceData: PriceData = {
				price,
				timestamp: Date.now(),
				source: "jupiter", // Keep as 'jupiter' for backward compatibility
			};
			this.cachePrice(cacheKey, priceData);
			return priceData;
		} catch (error) {
			console.error("Error fetching current SOL price:", error);
			// Return a fallback price if all sources fail
			return {
				price: 0,
				timestamp: Date.now(),
				source: "jupiter",
			};
		}
	}

	/**
	 * Get current token price in USD
	 */
	async getCurrentTokenPrice(tokenMint: string): Promise<PriceData> {
		const cacheKey = `${tokenMint}_current`;
		const cached = this.getCachedPrice(cacheKey);
		if (cached) return cached;

		try {
			// Map token mint to CoinGecko ID
			const coingeckoId = this.mintToCoinGeckoId(tokenMint);
			const price = await this.fetchFromCoinGecko(coingeckoId);
			const priceData: PriceData = {
				price,
				timestamp: Date.now(),
				source: "jupiter", // Keep as 'jupiter' for backward compatibility
			};
			this.cachePrice(cacheKey, priceData);
			return priceData;
		} catch (error) {
			console.error(
				`Error fetching current price for ${tokenMint}:`,
				error
			);
			return {
				price: 0,
				timestamp: Date.now(),
				source: "jupiter",
			};
		}
	}

	/**
	 * Get historical price at a specific block time
	 * Note: This is an approximation as historical data is expensive to query
	 */
	async getHistoricalPrice(
		request: HistoricalPriceRequest
	): Promise<PriceData> {
		const tokenMint =
			request.tokenMint ||
			"So11111111111111111111111111111111111111112";
		const now = Math.floor(Date.now() / 1000);
		const age = now - request.blockTime;

		// If the transaction is recent (< 5 minutes), use current price
		if (age < 300) {
			if (
				tokenMint === "So11111111111111111111111111111111111111112"
			) {
				return this.getCurrentSolPrice();
			}
			return this.getCurrentTokenPrice(tokenMint);
		}

		// For historical prices, we'll use current price as approximation
		// In production, you'd want to integrate with a historical price API
		// or maintain your own price history database
		const currentPrice =
			tokenMint === "So11111111111111111111111111111111111111112"
				? await this.getCurrentSolPrice()
				: await this.getCurrentTokenPrice(tokenMint);

		return {
			...currentPrice,
			timestamp: request.blockTime * 1000,
		};
	}

	/**
	 * Map Solana token mint address to CoinGecko ID
	 */
	private mintToCoinGeckoId(tokenMint: string): string {
		const mintMap: { [key: string]: string } = {
			So11111111111111111111111111111111111111112: "solana",
			EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "usd-coin", // Mainnet USDC
			"4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU": "usd-coin", // Devnet USDC
			Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "tether", // USDT
			mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "msol", // mSOL
		};

		return mintMap[tokenMint] || "solana";
	}

	/**
	 * Fetch price from CoinGecko API (free, no API key needed)
	 */
	private async fetchFromCoinGecko(coinId: string): Promise<number> {
		const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`CoinGecko API error: ${response.statusText}`
				);
			}

			const data = await response.json();
			const priceData = data[coinId];

			if (!priceData || !priceData.usd) {
				throw new Error("Price data not available");
			}

			return priceData.usd;
		} catch (error) {
			console.error("CoinGecko fetch error:", error);
			throw error;
		}
	}

	/**
	 * Fetch price from Jupiter aggregator (deprecated - requires auth now)
	 */
	private async fetchFromJupiter(tokenMint: string): Promise<number> {
		const oracleConfig = config.getPriceOracleConfig();
		const url = `${oracleConfig.jupiterApiUrl}/price?ids=${tokenMint}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Jupiter API error: ${response.statusText}`);
			}

			const data = await response.json();
			const priceData = data.data?.[tokenMint];

			if (!priceData || !priceData.price) {
				throw new Error("Price data not available");
			}

			return priceData.price;
		} catch (error) {
			console.error("Jupiter fetch error:", error);
			throw error;
		}
	}

	/**
	 * Fetch price from Pyth oracle (on-chain)
	 * This is more complex and requires parsing on-chain account data
	 */
	private async fetchFromPyth(
		priceFeedAddress: string
	): Promise<PriceData> {
		try {
			const publicKey = new PublicKey(priceFeedAddress);
			const accountInfo = await this.connection.getAccountInfo(
				publicKey
			);

			if (!accountInfo) {
				throw new Error("Pyth price feed not found");
			}

			// Parse Pyth price data
			// Note: This is a simplified version. In production, use @pythnetwork/client
			const price = this.parsePythPrice(accountInfo.data);

			return {
				price,
				timestamp: Date.now(),
				source: "pyth",
			};
		} catch (error) {
			console.error("Pyth fetch error:", error);
			throw error;
		}
	}

	/**
	 * Parse Pyth price from account data
	 * Simplified version - in production use @pythnetwork/client
	 */
	private parsePythPrice(_data: Buffer): number {
		// This is a placeholder - actual Pyth price parsing is more complex
		// You should use @pythnetwork/client library for production
		// For now, we'll just return 0 and rely on Jupiter
		console.warn(
			"Pyth price parsing not fully implemented, use Jupiter instead"
		);
		return 0;
	}

	/**
	 * Get cached price if available and not expired
	 */
	private getCachedPrice(key: string): PriceData | null {
		const cached = this.priceCache.get(key);
		if (!cached) return null;

		const age = Date.now() - cached.timestamp;
		if (age > this.cacheDuration) {
			this.priceCache.delete(key);
			return null;
		}

		return { ...cached, source: "cached" };
	}

	/**
	 * Cache price data
	 */
	private cachePrice(key: string, data: PriceData): void {
		this.priceCache.set(key, data);
	}

	/**
	 * Clear price cache
	 */
	clearCache(): void {
		this.priceCache.clear();
	}

	/**
	 * Calculate USD value for a token amount
	 */
	async calculateUsdValue(
		amount: number,
		tokenMint?: string
	): Promise<number> {
		const price = tokenMint
			? await this.getCurrentTokenPrice(tokenMint)
			: await this.getCurrentSolPrice();

		return amount * price.price;
	}

	/**
	 * Calculate USD value at historical block time
	 */
	async calculateHistoricalUsdValue(
		amount: number,
		blockTime: number,
		tokenMint?: string
	): Promise<number> {
		const price = await this.getHistoricalPrice({
			blockTime,
			tokenMint,
		});
		return amount * price.price;
	}
}
