/**
 * Wallet Initialization API
 * Sets up baseline tracking when a wallet connects
 *
 * POST /api/wallet/init
 * Body: { address: string }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     wallet_address: string,
 *     last_tracked_tx: string,
 *     isNewWallet: boolean
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHeliusService } from '@/lib/services/helius-service';
import { getBaselineTracker } from '@/lib/services/baseline-tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    // Validate wallet address
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate address format (Solana addresses are base58 encoded, 32-44 chars)
    if (address.length < 32 || address.length > 44) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Initialize services
    const heliusService = getHeliusService();
    const baselineTracker = getBaselineTracker();

    // Check if wallet is already initialized
    const existingTracking = await baselineTracker.getWalletTracking(address);

    if (existingTracking && existingTracking.last_tracked_tx) {
      return NextResponse.json({
        success: true,
        data: {
          wallet_address: existingTracking.wallet_address,
          last_tracked_tx: existingTracking.last_tracked_tx,
          last_tracked_at: existingTracking.last_tracked_at,
          isNewWallet: false,
        },
      });
    }

    // Fetch most recent transaction from Helius
    let mostRecentTx;
    try {
      mostRecentTx = await heliusService.getMostRecentTransaction(address);
    } catch (heliusError) {
      console.error('Helius API error:', heliusError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch transactions from Helius API. Please check your API key and try again.',
          details: heliusError instanceof Error ? heliusError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    if (!mostRecentTx) {
      return NextResponse.json(
        {
          success: false,
          error: `No transactions found for this wallet on ${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet'}. Make sure you're on the correct network and have transaction history.`,
          network: process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet',
        },
        { status: 404 }
      );
    }

    // Set baseline transaction
    const tracking = await baselineTracker.setBaseline(address, mostRecentTx.signature);

    return NextResponse.json({
      success: true,
      data: {
        wallet_address: tracking.wallet_address,
        last_tracked_tx: tracking.last_tracked_tx,
        last_tracked_at: tracking.last_tracked_at,
        isNewWallet: !existingTracking,
      },
    });
  } catch (error) {
    console.error('Error initializing wallet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    const baselineTracker = getBaselineTracker();
    const tracking = await baselineTracker.getWalletTracking(address);

    if (!tracking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet not initialized',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        wallet_address: tracking.wallet_address,
        last_tracked_tx: tracking.last_tracked_tx,
        last_tracked_at: tracking.last_tracked_at,
        isInitialized: !!tracking.last_tracked_tx,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet tracking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
