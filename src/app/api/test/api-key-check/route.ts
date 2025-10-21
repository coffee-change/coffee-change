/**
 * API Key Diagnostic Tool
 * Shows detailed information about the Helius API key
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.HELIUS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'HELIUS_API_KEY not found in environment variables',
    });
  }

  // Analyze the key
  const keyLength = apiKey.length;
  const segments = apiKey.split('-');
  const segmentLengths = segments.map(s => s.length);

  // Check for hidden characters
  const hasWhitespace = apiKey !== apiKey.trim();
  const visibleKey = apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 4);

  // Expected UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const expectedSegments = [8, 4, 4, 4, 12];
  const formatMatch = JSON.stringify(segmentLengths) === JSON.stringify(expectedSegments);

  // Test the key with a simple API call
  let apiTest = { works: false, error: null as string | null };

  try {
    const testResponse = await fetch(
      `https://api.helius-rpc.com/?api-key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      }
    );

    apiTest.works = testResponse.ok;
    apiTest.error = testResponse.ok ? null : `HTTP ${testResponse.status}`;
  } catch (error) {
    apiTest.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json({
    success: true,
    apiKey: {
      found: true,
      visible: visibleKey,
      length: keyLength,
      expectedLength: 36,
      lengthMatch: keyLength === 36,
      segments: segmentLengths,
      expectedSegments,
      formatMatch,
      hasWhitespace,
      actualKey: apiKey, // Show full key for debugging (remove in production!)
    },
    validation: {
      lengthOk: keyLength === 36 ? '✓' : '✗',
      formatOk: formatMatch ? '✓' : '✗',
      noWhitespace: !hasWhitespace ? '✓' : '✗',
    },
    apiTest,
    recommendation: !formatMatch
      ? 'API key format is incorrect. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      : !apiTest.works
      ? 'API key format looks correct but API test failed. Key might be invalid or revoked.'
      : 'API key looks good!',
  });
}
