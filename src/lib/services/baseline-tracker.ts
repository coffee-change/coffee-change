/**
 * Baseline Tracking Service
 * Manages wallet tracking and baseline transaction storage in Supabase
 */

import { createServerClient } from '../supabase/client';
import type { WalletTracking } from '../supabase/types';

export class BaselineTracker {
  private supabase;

  constructor() {
    this.supabase = createServerClient();
  }

  /**
   * Get wallet tracking record for a given wallet address
   * @param walletAddress Wallet address to look up
   */
  async getWalletTracking(walletAddress: string): Promise<WalletTracking | null> {
    try {
      const { data, error } = await this.supabase
        .from('wallet_tracking')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching wallet tracking:', error);
      throw error;
    }
  }

  /**
   * Create or update wallet tracking record with baseline transaction
   * @param walletAddress Wallet address
   * @param transactionSignature Most recent transaction signature (baseline)
   */
  async setBaseline(
    walletAddress: string,
    transactionSignature: string
  ): Promise<WalletTracking> {
    try {
      const now = new Date().toISOString();

      // Try to get existing record
      const existing = await this.getWalletTracking(walletAddress);

      if (existing) {
        // Update existing record
        const { data, error } = await this.supabase
          .from('wallet_tracking')
          .update({
            last_tracked_tx: transactionSignature,
            last_tracked_at: now,
            updated_at: now,
          })
          .eq('wallet_address', walletAddress)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await this.supabase
          .from('wallet_tracking')
          .insert({
            wallet_address: walletAddress,
            last_tracked_tx: transactionSignature,
            last_tracked_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error setting baseline:', error);
      throw error;
    }
  }

  /**
   * Update the last tracked transaction for a wallet
   * @param walletAddress Wallet address
   * @param transactionSignature Transaction signature to update to
   */
  async updateLastTracked(
    walletAddress: string,
    transactionSignature: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      const { error } = await this.supabase
        .from('wallet_tracking')
        .update({
          last_tracked_tx: transactionSignature,
          last_tracked_at: now,
          updated_at: now,
        })
        .eq('wallet_address', walletAddress);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating last tracked transaction:', error);
      throw error;
    }
  }

  /**
   * Get the baseline transaction signature for a wallet
   * Returns null if no baseline has been set
   * @param walletAddress Wallet address
   */
  async getBaseline(walletAddress: string): Promise<string | null> {
    try {
      const tracking = await this.getWalletTracking(walletAddress);
      return tracking?.last_tracked_tx || null;
    } catch (error) {
      console.error('Error getting baseline:', error);
      return null;
    }
  }

  /**
   * Check if a wallet has been initialized (has a baseline)
   * @param walletAddress Wallet address
   */
  async isWalletInitialized(walletAddress: string): Promise<boolean> {
    try {
      const tracking = await this.getWalletTracking(walletAddress);
      return tracking !== null && tracking.last_tracked_tx !== null;
    } catch (error) {
      console.error('Error checking wallet initialization:', error);
      return false;
    }
  }

  /**
   * Delete wallet tracking record (use with caution)
   * @param walletAddress Wallet address
   */
  async deleteWalletTracking(walletAddress: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('wallet_tracking')
        .delete()
        .eq('wallet_address', walletAddress);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting wallet tracking:', error);
      throw error;
    }
  }
}

// Singleton instance
let baselineTrackerInstance: BaselineTracker | null = null;

export function getBaselineTracker(): BaselineTracker {
  if (!baselineTrackerInstance) {
    baselineTrackerInstance = new BaselineTracker();
  }
  return baselineTrackerInstance;
}
