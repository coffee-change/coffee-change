/**
 * Direct Helius RPC Test
 * Tests Helius API using different methods
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address') || 'EKRhGoNwyLPawTpyGv6vu4xgxeCEeX8s2AJaziBYJgDn';
  const apiKey = process.env.HELIUS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'HELIUS_API_KEY not found',
    });
  }

  const results = {
    apiKey: {
      visible: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      length: apiKey.length,
      format: apiKey.split('-').map(s => s.length).join('-'),
    },
    tests: [] as any[],
  };

  // Test 1: Standard RPC endpoint with getHealth
  try {
    const healthUrl = `https://api.helius-rpc.com/?api-key=${apiKey}`;
    const healthResponse = await fetch(healthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
    });

    const healthData = await healthResponse.text();

    results.tests.push({
      name: 'RPC Health Check',
      url: 'https://api.helius-rpc.com/?api-key=***',
      status: healthResponse.status,
      success: healthResponse.ok,
      response: healthData.substring(0, 200),
    });
  } catch (error) {
    results.tests.push({
      name: 'RPC Health Check',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 2: Enhanced Transactions API (mainnet)
  try {
    const mainnetTxUrl = `https://api.helius-rpc.com/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=1`;
    const mainnetResponse = await fetch(mainnetTxUrl);
    const mainnetText = await mainnetResponse.text();

    results.tests.push({
      name: 'Mainnet Transactions API',
      url: `https://api.helius-rpc.com/v0/addresses/${address}/transactions`,
      status: mainnetResponse.status,
      success: mainnetResponse.ok,
      response: mainnetText.substring(0, 500),
    });
  } catch (error) {
    results.tests.push({
      name: 'Mainnet Transactions API',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 3: Enhanced Transactions API (devnet)
  try {
    const devnetTxUrl = `https://api-devnet.helius-rpc.com/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=1`;
    const devnetResponse = await fetch(devnetTxUrl);
    const devnetText = await devnetResponse.text();

    results.tests.push({
      name: 'Devnet Transactions API',
      url: `https://api-devnet.helius-rpc.com/v0/addresses/${address}/transactions`,
      status: devnetResponse.status,
      success: devnetResponse.ok,
      response: devnetText.substring(0, 500),
    });
  } catch (error) {
    results.tests.push({
      name: 'Devnet Transactions API',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Analyze results
  const allPassed = results.tests.every(t => t.success);
  const failedTests = results.tests.filter(t => !t.success);

  return NextResponse.json({
    success: allPassed,
    summary: {
      total: results.tests.length,
      passed: results.tests.filter(t => t.success).length,
      failed: failedTests.length,
    },
    ...results,
    diagnosis: allPassed
      ? '✓ All tests passed! API key is working.'
      : failedTests.length === results.tests.length
      ? '✗ All tests failed. API key is invalid or there\'s a network issue.'
      : '⚠️ Some tests failed. API key might have limited access.',
    nextSteps: !allPassed
      ? [
          'Check if API key was copied correctly from Helius dashboard',
          'Verify you copied the API Key (not Project ID)',
          'Try creating a new API key at https://dev.helius.xyz',
          'Check if there are trailing spaces in .env.local',
        ]
      : ['API key is working! The issue must be elsewhere.'],
  });
}
