/**
 * Helius API Service
 * Fetches transaction data using Helius enhanced transaction API
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

if (!HELIUS_API_KEY) {
  console.warn('HELIUS_API_KEY not found in environment variables');
}

export interface HeliusTransaction {
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges?: Array<{
      mint: string;
      rawTokenAmount: {
        tokenAmount: string;
        decimals: number;
      };
      userAccount: string;
    }>;
  }>;
  events?: {
    nft?: any;
    swap?: any;
    compressed?: any;
  };
}

export interface ParsedHeliusTransaction {
  signature: string;
  timestamp: number;
  slot: number;
  fee: number;
  type: 'sent' | 'received' | 'unknown';
  amount: number; // In SOL or token amount
  token: string; // 'SOL', 'USDC', etc.
  tokenMint: string | null;
  tokenDecimals: number;
  fromAddress: string;
  toAddress: string;
}

export class HeliusService {
  private apiKey: string;
  private network: 'mainnet' | 'devnet';

  constructor(apiKey?: string, network: 'mainnet' | 'devnet' = 'devnet') {
    this.apiKey = apiKey || HELIUS_API_KEY || '';
    this.network = network;

    // Validate API key format
    if (this.apiKey) {
      // Helius API keys are typically UUIDs in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(this.apiKey)) {
        console.warn('⚠️  Helius API key format looks incorrect. Expected UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        console.warn(`   Current key: ${this.apiKey.substring(0, 20)}...`);
        console.warn('   Get a valid key from: https://helius.dev');
      }
    } else {
      console.error('❌ HELIUS_API_KEY not found in environment variables!');
      console.error('   Add HELIUS_API_KEY to your .env.local file');
    }
  }

  private getBaseUrl(): string {
    return `https://api${this.network === 'devnet' ? '-devnet' : ''}.helius-rpc.com`;
  }

  /**
   * Fetch transactions for a wallet address using Helius Enhanced Transactions API
   * @param address Wallet address
   * @param limit Maximum number of transactions to fetch
   * @param before Optional transaction signature to paginate from
   */
  async fetchTransactions(
    address: string,
    limit: number = 100,
    before?: string
  ): Promise<HeliusTransaction[]> {
    try {
      const baseUrl = this.getBaseUrl();

      // Build the enhanced transactions endpoint
      let url = `${baseUrl}/v0/addresses/${address}/transactions?api-key=${this.apiKey}`;

      // Add query parameters
      const params = new URLSearchParams();
      if (before) {
        params.append('before', before);
      }

      if (params.toString()) {
        url += `&${params.toString()}`;
      }

      console.log(`Fetching transactions from Helius: ${this.network}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helius API error response:', errorText);
        throw new Error(`Helius API error (${response.status}): ${response.statusText}`);
      }

      const transactions = await response.json();

      if (!Array.isArray(transactions)) {
        console.error('Unexpected Helius response format:', transactions);
        throw new Error('Invalid response format from Helius API');
      }

      console.log(`Fetched ${transactions.length} transactions from Helius`);
      return transactions.slice(0, limit);
    } catch (error) {
      console.error('Error fetching transactions from Helius:', error);
      throw error;
    }
  }

  /**
   * Get the most recent transaction for a wallet
   * @param address Wallet address
   */
  async getMostRecentTransaction(address: string): Promise<HeliusTransaction | null> {
    try {
      const transactions = await this.fetchTransactions(address, 1);
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      console.error('Error fetching most recent transaction:', error);
      return null;
    }
  }

  /**
   * Parse Helius transaction to extract outgoing transaction details
   * @param tx Helius transaction
   * @param walletAddress User's wallet address
   */
  parseTransaction(tx: HeliusTransaction, walletAddress: string): ParsedHeliusTransaction | null {
    try {
      // Determine transaction type (sent/received)
      let type: 'sent' | 'received' | 'unknown' = 'unknown';
      let amount = 0;
      let token = 'SOL';
      let tokenMint: string | null = null;
      let tokenDecimals = 9;
      let fromAddress = '';
      let toAddress = '';

      // Check native SOL transfers
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        const transfer = tx.nativeTransfers[0];
        fromAddress = transfer.fromUserAccount;
        toAddress = transfer.toUserAccount;
        amount = transfer.amount / 1e9; // Convert lamports to SOL

        if (transfer.fromUserAccount === walletAddress) {
          type = 'sent';
        } else if (transfer.toUserAccount === walletAddress) {
          type = 'received';
        }
      }

      // Check token transfers
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        const transfer = tx.tokenTransfers[0];
        fromAddress = transfer.fromUserAccount;
        toAddress = transfer.toUserAccount;
        tokenMint = transfer.mint;
        amount = transfer.tokenAmount;

        // Determine token symbol from mint (you may want to expand this mapping)
        if (tokenMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ||
            tokenMint === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') {
          token = 'USDC';
          tokenDecimals = 6;
        } else if (tokenMint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
          token = 'USDT';
          tokenDecimals = 6;
        }

        if (transfer.fromUserAccount === walletAddress) {
          type = 'sent';
        } else if (transfer.toUserAccount === walletAddress) {
          type = 'received';
        }
      }

      // Only return sent transactions (outgoing)
      if (type !== 'sent') {
        return null;
      }

      return {
        signature: tx.signature,
        timestamp: tx.timestamp,
        slot: tx.slot,
        fee: tx.fee / 1e9, // Convert lamports to SOL
        type,
        amount,
        token,
        tokenMint,
        tokenDecimals,
        fromAddress,
        toAddress,
      };
    } catch (error) {
      console.error('Error parsing Helius transaction:', error);
      return null;
    }
  }

  /**
   * Fetch and parse outgoing transactions for a wallet
   * @param address Wallet address
   * @param limit Maximum number of transactions
   * @param afterSignature Only fetch transactions after this signature (baseline)
   */
  async fetchOutgoingTransactions(
    address: string,
    limit: number = 100,
    afterSignature?: string
  ): Promise<ParsedHeliusTransaction[]> {
    try {
      const allTransactions: ParsedHeliusTransaction[] = [];
      let currentBefore: string | undefined;
      let foundBaseline = !afterSignature; // If no baseline, process all

      while (allTransactions.length < limit) {
        const transactions = await this.fetchTransactions(address, Math.min(100, limit - allTransactions.length), currentBefore);

        if (transactions.length === 0) {
          break; // No more transactions
        }

        for (const tx of transactions) {
          // Stop if we've reached the baseline transaction
          if (afterSignature && tx.signature === afterSignature) {
            foundBaseline = true;
            break;
          }

          // Only process if we haven't found the baseline yet
          if (!foundBaseline) {
            const parsed = this.parseTransaction(tx, address);
            if (parsed && parsed.type === 'sent') {
              allTransactions.push(parsed);
            }
          }
        }

        if (foundBaseline) {
          break;
        }

        // Get the last transaction signature for pagination
        currentBefore = transactions[transactions.length - 1]?.signature;

        if (!currentBefore) {
          break;
        }
      }

      return allTransactions;
    } catch (error) {
      console.error('Error fetching outgoing transactions:', error);
      throw error;
    }
  }
}

/**
 * Get the current network from environment
 */
function getCurrentNetwork(): 'mainnet' | 'devnet' {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

  // Map 'mainnet-beta' to 'mainnet' for Helius
  if (cluster === 'mainnet-beta' || cluster === 'mainnet') {
    return 'mainnet';
  }

  return 'devnet';
}

// Singleton instance
let heliusInstance: HeliusService | null = null;
let currentNetworkCache: 'mainnet' | 'devnet' | null = null;

export function getHeliusService(network?: 'mainnet' | 'devnet'): HeliusService {
  const targetNetwork = network || getCurrentNetwork();

  // Recreate instance if network changed
  if (!heliusInstance || currentNetworkCache !== targetNetwork) {
    console.log(`Initializing Helius service for ${targetNetwork}`);
    heliusInstance = new HeliusService(HELIUS_API_KEY, targetNetwork);
    currentNetworkCache = targetNetwork;
  }

  return heliusInstance;
}
