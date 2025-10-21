/**
 * Round-up Calculation Service
 * Calculates round-up values and stores them in Supabase
 */

import { createServerClient } from '../supabase/client';
import { PriceOracle } from './price-oracle';
import type { ParsedHeliusTransaction } from './helius-service';
import type { RoundupRecord } from '../supabase/types';

export interface RoundupCalculation {
  transaction_id: string;
  transaction_date: string;
  token: string;
  token_mint: string | null;
  token_amount: number;
  usd_value: number;
  round_up_value: number;
  price_source: string;
}

export class RoundupCalculator {
  private supabase;
  private priceOracle: PriceOracle;

  constructor() {
    this.supabase = createServerClient();
    this.priceOracle = new PriceOracle();
  }

  /**
   * Calculate round-up value for a transaction
   * Rounds up to the nearest whole USD dollar
   *
   * Examples:
   * - $200.80 → $201.00 → round-up = $0.20
   * - $50.10 → $51.00 → round-up = $0.90
   * - $100.00 → $100.00 → round-up = $0.00
   *
   * @param usdValue USD value of the transaction
   */
  calculateRoundup(usdValue: number): number {
    const rounded = Math.ceil(usdValue);
    const roundup = rounded - usdValue;
    return Math.max(0, roundup); // Ensure non-negative
  }

  /**
   * Get USD price for a token
   * @param token Token symbol (SOL, USDC, etc.)
   * @param tokenMint Token mint address
   */
  async getTokenPrice(token: string, tokenMint: string | null): Promise<number> {
    try {
      // For SOL, use native SOL mint
      if (token === 'SOL') {
        const priceData = await this.priceOracle.getCurrentSolPrice();
        return priceData.price;
      }

      // For stablecoins, return $1.00
      if (token === 'USDC' || token === 'USDT') {
        return 1.0;
      }

      // For other tokens, fetch from price oracle
      if (tokenMint) {
        const priceData = await this.priceOracle.getCurrentTokenPrice(tokenMint);
        return priceData.price;
      }

      // Fallback to 0 if we can't determine price
      console.warn(`Unable to determine price for token: ${token}`);
      return 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  /**
   * Process a single transaction and calculate round-up
   * @param transaction Parsed Helius transaction
   */
  async processTransaction(transaction: ParsedHeliusTransaction): Promise<RoundupCalculation | null> {
    try {
      // Get current token price
      const tokenPrice = await this.getTokenPrice(transaction.token, transaction.tokenMint);

      if (tokenPrice === 0) {
        console.warn(`Skipping transaction ${transaction.signature} - unable to get price for ${transaction.token}`);
        return null;
      }

      // Calculate USD value
      const usdValue = transaction.amount * tokenPrice;

      // Calculate round-up
      const roundUpValue = this.calculateRoundup(usdValue);

      // Create round-up calculation
      const calculation: RoundupCalculation = {
        transaction_id: transaction.signature,
        transaction_date: new Date(transaction.timestamp * 1000).toISOString(),
        token: transaction.token,
        token_mint: transaction.tokenMint,
        token_amount: transaction.amount,
        usd_value: parseFloat(usdValue.toFixed(2)),
        round_up_value: parseFloat(roundUpValue.toFixed(2)),
        price_source: 'coingecko',
      };

      return calculation;
    } catch (error) {
      console.error('Error processing transaction for round-up:', error);
      return null;
    }
  }

  /**
   * Store round-up record in Supabase
   * @param walletAddress Wallet address
   * @param calculation Round-up calculation
   */
  async storeRoundup(
    walletAddress: string,
    calculation: RoundupCalculation
  ): Promise<RoundupRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('roundup_records')
        .insert({
          wallet_address: walletAddress,
          transaction_id: calculation.transaction_id,
          transaction_date: calculation.transaction_date,
          token: calculation.token,
          token_mint: calculation.token_mint,
          token_amount: calculation.token_amount,
          usd_value: calculation.usd_value,
          round_up_value: calculation.round_up_value,
          price_source: calculation.price_source,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate record error
        if (error.code === '23505') {
          console.log(`Round-up record already exists for transaction ${calculation.transaction_id}`);
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error storing round-up record:', error);
      throw error;
    }
  }

  /**
   * Process multiple transactions and store round-ups
   * @param walletAddress Wallet address
   * @param transactions Array of parsed transactions
   */
  async processAndStoreTransactions(
    walletAddress: string,
    transactions: ParsedHeliusTransaction[]
  ): Promise<{ stored: number; skipped: number; total: number }> {
    let stored = 0;
    let skipped = 0;

    for (const transaction of transactions) {
      try {
        const calculation = await this.processTransaction(transaction);

        if (!calculation) {
          skipped++;
          continue;
        }

        const record = await this.storeRoundup(walletAddress, calculation);

        if (record) {
          stored++;
          console.log(`Stored round-up: ${calculation.round_up_value} USD for tx ${calculation.transaction_id.substring(0, 8)}...`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error processing transaction ${transaction.signature}:`, error);
        skipped++;
      }
    }

    return {
      stored,
      skipped,
      total: transactions.length,
    };
  }

  /**
   * Get all round-up records for a wallet
   * @param walletAddress Wallet address
   * @param limit Maximum number of records to fetch
   */
  async getRoundups(walletAddress: string, limit: number = 100): Promise<RoundupRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('roundup_records')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching round-up records:', error);
      throw error;
    }
  }

  /**
   * Get total round-up value for a wallet
   * @param walletAddress Wallet address
   */
  async getTotalRoundup(walletAddress: string): Promise<number> {
    try {
      const records = await this.getRoundups(walletAddress, 1000); // Fetch up to 1000 records
      const total = records.reduce((sum, record) => sum + parseFloat(record.round_up_value.toString()), 0);
      return parseFloat(total.toFixed(2));
    } catch (error) {
      console.error('Error calculating total round-up:', error);
      return 0;
    }
  }

  /**
   * Check if round-up total is ready for investment (>= $1.00)
   * @param walletAddress Wallet address
   */
  async isReadyForInvestment(walletAddress: string): Promise<boolean> {
    try {
      const total = await this.getTotalRoundup(walletAddress);
      return total >= 1.0;
    } catch (error) {
      console.error('Error checking investment readiness:', error);
      return false;
    }
  }
}

// Singleton instance
let roundupCalculatorInstance: RoundupCalculator | null = null;

export function getRoundupCalculator(): RoundupCalculator {
  if (!roundupCalculatorInstance) {
    roundupCalculatorInstance = new RoundupCalculator();
  }
  return roundupCalculatorInstance;
}
