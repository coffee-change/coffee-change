/**
 * Wallet Network Checker
 * Checks if a wallet has transactions on mainnet and/or devnet
 *
 * GET /api/test/wallet-check?address=WALLET_ADDRESS
 */

import { NextRequest, NextResponse } from 'next/server';

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

    const apiKey = process.env.HELIUS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'HELIUS_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Check both mainnet and devnet
    const results = {
      address,
      mainnet: { hasTransactions: false, count: 0, error: null as string | null },
      devnet: { hasTransactions: false, count: 0, error: null as string | null },
      recommendation: '',
    };

    // Check Mainnet
    try {
      const mainnetUrl = `https://api.helius-rpc.com/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=1`;
      const mainnetResponse = await fetch(mainnetUrl);

      if (mainnetResponse.ok) {
        const mainnetData = await mainnetResponse.json();
        results.mainnet.hasTransactions = Array.isArray(mainnetData) && mainnetData.length > 0;
        results.mainnet.count = Array.isArray(mainnetData) ? mainnetData.length : 0;
      } else {
        results.mainnet.error = `HTTP ${mainnetResponse.status}`;
      }
    } catch (error) {
      results.mainnet.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check Devnet
    try {
      const devnetUrl = `https://api-devnet.helius-rpc.com/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=1`;
      const devnetResponse = await fetch(devnetUrl);

      if (devnetResponse.ok) {
        const devnetData = await devnetResponse.json();
        results.devnet.hasTransactions = Array.isArray(devnetData) && devnetData.length > 0;
        results.devnet.count = Array.isArray(devnetData) ? devnetData.length : 0;
      } else {
        results.devnet.error = `HTTP ${devnetResponse.status}`;
      }
    } catch (error) {
      results.devnet.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Determine recommendation
    if (results.mainnet.hasTransactions && results.devnet.hasTransactions) {
      results.recommendation = 'Wallet has transactions on BOTH mainnet and devnet. You can use either network.';
    } else if (results.mainnet.hasTransactions) {
      results.recommendation = 'Wallet has transactions on MAINNET only. Set NEXT_PUBLIC_SOLANA_CLUSTER=mainnet';
    } else if (results.devnet.hasTransactions) {
      results.recommendation = 'Wallet has transactions on DEVNET only. Set NEXT_PUBLIC_SOLANA_CLUSTER=devnet';
    } else {
      results.recommendation = 'No transactions found on either network. Make sure this is the correct wallet address.';
    }

    const currentNetwork = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet';
    const currentNetworkMatch = currentNetwork === 'mainnet'
      ? results.mainnet.hasTransactions
      : results.devnet.hasTransactions;

    return NextResponse.json({
      success: true,
      data: results,
      currentAppNetwork: currentNetwork,
      currentNetworkHasTransactions: currentNetworkMatch,
      action: !currentNetworkMatch
        ? `Switch to ${results.mainnet.hasTransactions ? 'mainnet' : 'devnet'} in .env.local`
        : 'Current network is correct ✓',
    });
  } catch (error) {
    console.error('Wallet check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
