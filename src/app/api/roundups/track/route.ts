/**
 * Round-up Tracking API
 * Fetches new transactions since baseline and calculates/stores round-ups
 *
 * POST /api/roundups/track
 * Body: { address: string, limit?: number }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     processed: number,
 *     stored: number,
 *     skipped: number,
 *     totalRoundup: number,
 *     newBaseline: string
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHeliusService } from '@/lib/services/helius-service';
import { getBaselineTracker } from '@/lib/services/baseline-tracker';
import { getRoundupCalculator } from '@/lib/services/roundup-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, limit = 100, ignoreBaseline = false } = body;

    // Validate wallet address
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Initialize services
    const heliusService = getHeliusService();
    const baselineTracker = getBaselineTracker();
    const roundupCalculator = getRoundupCalculator();

    // Check if wallet is initialized
    const tracking = await baselineTracker.getWalletTracking(address);

    if (!tracking || !tracking.last_tracked_tx) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wallet not initialized. Please call /api/wallet/init first.',
        },
        { status: 400 }
      );
    }

    // Fetch new transactions since baseline (or all if ignoring baseline)
    const baselineSignature = ignoreBaseline ? undefined : tracking.last_tracked_tx;

    if (ignoreBaseline) {
      console.log(`Fetching ALL transactions (ignoring baseline), limit: ${limit}`);
    } else {
      console.log(`Fetching transactions after baseline: ${tracking.last_tracked_tx}`);
    }

    const newTransactions = await heliusService.fetchOutgoingTransactions(
      address,
      limit,
      baselineSignature
    );

    console.log(`Found ${newTransactions.length} new outgoing transactions`);

    if (newTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          processed: 0,
          stored: 0,
          skipped: 0,
          totalRoundup: await roundupCalculator.getTotalRoundup(address),
          newBaseline: tracking.last_tracked_tx,
        },
      });
    }

    // Process and store round-ups
    const result = await roundupCalculator.processAndStoreTransactions(address, newTransactions);

    // Update baseline to the most recent transaction
    const mostRecentTx = newTransactions[0]; // Transactions are returned newest first
    await baselineTracker.updateLastTracked(address, mostRecentTx.signature);

    // Get updated total round-up
    const totalRoundup = await roundupCalculator.getTotalRoundup(address);

    return NextResponse.json({
      success: true,
      data: {
        processed: result.total,
        stored: result.stored,
        skipped: result.skipped,
        totalRoundup,
        newBaseline: mostRecentTx.signature,
        isReadyForInvestment: totalRoundup >= 1.0,
        mode: ignoreBaseline ? 'historical' : 'incremental',
      },
    });
  } catch (error) {
    console.error('Error tracking round-ups:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/roundups/track
 * Get round-up records for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing wallet address' },
        { status: 400 }
      );
    }

    const roundupCalculator = getRoundupCalculator();

    // Get round-up records
    const records = await roundupCalculator.getRoundups(address, limit);
    const totalRoundup = await roundupCalculator.getTotalRoundup(address);
    const isReady = await roundupCalculator.isReadyForInvestment(address);

    return NextResponse.json({
      success: true,
      data: {
        records,
        totalRoundup,
        count: records.length,
        isReadyForInvestment: isReady,
      },
    });
  } catch (error) {
    console.error('Error fetching round-up records:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
