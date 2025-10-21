/**
 * TypeScript types for Supabase database
 */

export interface WalletTracking {
  id: number;
  wallet_address: string;
  last_tracked_tx: string | null;
  last_tracked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoundupRecord {
  id: number;
  wallet_address: string;
  transaction_id: string;
  transaction_date: string;
  token: string;
  token_mint: string | null;
  token_amount: number;
  usd_value: number;
  round_up_value: number;
  price_source: string;
  created_at: string;
}

// Helper types for creating new records
export type CreateWalletTracking = Omit<WalletTracking, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWalletTracking = Partial<Omit<WalletTracking, 'id' | 'wallet_address' | 'created_at'>>;

export type CreateRoundupRecord = Omit<RoundupRecord, 'id' | 'created_at'>;

// Supabase database schema type
export interface Database {
  public: {
    Tables: {
      wallet_tracking: {
        Row: WalletTracking;
        Insert: Omit<WalletTracking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WalletTracking, 'id' | 'wallet_address' | 'created_at'>>;
      };
      roundup_records: {
        Row: RoundupRecord;
        Insert: Omit<RoundupRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<RoundupRecord, 'id' | 'wallet_address' | 'transaction_id'>>;
      };
    };
  };
}
