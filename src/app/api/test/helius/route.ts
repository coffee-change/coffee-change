/**
 * Helius API Test Endpoint
 * Tests if the Helius API key is working correctly
 *
 * GET /api/test/helius?address=WALLET_ADDRESS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHeliusService } from '@/lib/services/helius-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    // Get API key from environment
    const apiKey = process.env.HELIUS_API_KEY;
    const network = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';

    // Check if API key exists
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'HELIUS_API_KEY not found in environment variables',
          help: 'Add HELIUS_API_KEY to your .env.local file',
        },
        { status: 500 }
      );
    }

    // Show API key info (partial, for security)
    const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;

    // Basic validation
    if (apiKey.length < 20) {
      return NextResponse.json({
        success: false,
        error: 'Helius API key seems invalid (too short)',
        apiKeyLength: apiKey.length,
        maskedKey,
        help: 'Get a valid API key from https://helius.dev',
      });
    }

    // If no address provided, just return API key status
    if (!address) {
      return NextResponse.json({
        success: true,
        message: 'Helius API key found',
        network,
        maskedKey,
        help: 'Add ?address=YOUR_WALLET_ADDRESS to test transaction fetching',
      });
    }

    // Try to fetch transactions
    const heliusService = getHeliusService();

    console.log(`Testing Helius API with address: ${address}`);
    console.log(`Network: ${network}`);

    let transactions;
    let rawResponse;

    try {
      // First, let's try the raw API call to see what we get
      const baseUrl = network === 'devnet'
        ? 'https://api-devnet.helius-rpc.com'
        : 'https://api.helius-rpc.com';

      const testUrl = `${baseUrl}/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=5`;

      console.log(`Calling Helius API: ${baseUrl}/v0/addresses/${address}/transactions`);

      const rawFetch = await fetch(testUrl);
      const rawText = await rawFetch.text();

      console.log('Helius raw response status:', rawFetch.status);
      console.log('Helius raw response (first 500 chars):', rawText.substring(0, 500));

      if (!rawFetch.ok) {
        return NextResponse.json({
          success: false,
          error: `Helius API returned ${rawFetch.status}`,
          details: rawText,
          network,
          url: `${baseUrl}/v0/addresses/${address}/transactions`,
          help: rawFetch.status === 404
            ? `No transactions found for this address on ${network}. Try switching networks or use a wallet with transaction history.`
            : 'Check if your API key is valid for this network'
        }, { status: 500 });
      }

      try {
        rawResponse = JSON.parse(rawText);
      } catch (e) {
        return NextResponse.json({
          success: false,
          error: 'Failed to parse Helius response',
          details: rawText.substring(0, 200),
        }, { status: 500 });
      }

      transactions = await heliusService.fetchTransactions(address, 5);

      return NextResponse.json({
        success: true,
        message: 'Helius API is working!',
        network,
        maskedKey,
        data: {
          address,
          transactionCount: transactions.length,
          rawTransactionCount: Array.isArray(rawResponse) ? rawResponse.length : 0,
          transactions: transactions.map(tx => ({
            signature: tx.signature,
            timestamp: tx.timestamp,
            type: tx.type,
            description: tx.description,
          })),
        },
      });
    } catch (fetchError) {
      console.error('Transaction fetch error:', fetchError);

      return NextResponse.json({
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        network,
        address,
        help: 'This wallet may have no transactions on ' + network,
        suggestion: network === 'mainnet'
          ? 'Try switching to devnet if your transactions are there'
          : 'Try switching to mainnet or make a test transaction on devnet',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Helius test error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        help: 'Check your Helius API key at https://helius.dev',
        network: process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet',
      },
      { status: 500 }
    );
  }
}
