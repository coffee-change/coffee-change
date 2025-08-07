import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// USDC Contract configurations for different chains
const USDC_CONTRACTS = {
  '0xaa36a7': {
    address: process.env.USDC_CONTRACT_SEPOLIA?.toLowerCase(),
    decimals: 6,
    symbol: 'USDC',
    chain: 'sepolia'
  }
} as const;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Moralis signature verification
function verifySignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-signature');
  if (!signature || !process.env.WEBHOOK_SECRET) {
    console.log('❌ No signature or webhook secret provided');
    return false;
  }
  
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex');
    
  const isValid = signature === expected;
  if (!isValid) {
    console.log('❌ Invalid signature');
    console.log('Expected:', expected);
    console.log('Received:', signature);
  }
  
  return isValid;
}

// Format USDC amount from raw value
function formatUSDCAmount(value: string, decimals: number = 6): string {
  // Convert from wei-like units to human readable
  const divisor = BigInt(10 ** decimals);
  const amount = BigInt(value) / divisor;
  const remainder = BigInt(value) % divisor;
  
  if (remainder === BigInt(0)) {
    return amount.toString();
  } else {
    const remainderStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${amount}.${remainderStr}`;
  }
}

// Determine transaction type based on monitored addresses
function determineTransactionType(
  from: string, 
  to: string, 
  monitoredAddresses: string[]
): 'spend' | 'receive' | 'internal' | 'unknown' {
  const isFromMonitored = monitoredAddresses.includes(from.toLowerCase());
  const isToMonitored = monitoredAddresses.includes(to.toLowerCase());
  
  if (isFromMonitored && !isToMonitored) {
    return 'spend'; // User is spending USDC
  } else if (!isFromMonitored && isToMonitored) {
    return 'receive'; // User is receiving USDC
  } else if (isFromMonitored && isToMonitored) {
    return 'internal'; // Transfer between monitored addresses
  } else {
    return 'unknown'; // Shouldn't happen if filtering is correct
  }
}

// Calculate round-up amount for coffee change investment
function calculateRoundUp(amount: string): number {
  const spentAmount = parseFloat(amount);
  
  // Only calculate round-up for amounts > 0
  if (spentAmount <= 0) {
    return 0;
  }
  
  // Round up to the nearest dollar
  const roundUpAmount = Math.ceil(spentAmount) - spentAmount;
  
  // Return rounded to 6 decimal places (USDC precision)
  return Math.round(roundUpAmount * 1000000) / 1000000;
}

// Legacy function - no longer used since we moved to user-controlled staking
// Keeping for reference but not called anywhere
async function processRoundUp(transactionId: string, amount: string, transactionType: string, userAddress: string): Promise<void> {
  console.log('ℹ️ processRoundUp is deprecated - using user-controlled staking instead')
}

// Decode Transfer event log
function decodeTransferLog(log: any): { from: string; to: string; value: string } | null {
  try {
    // Transfer event has signature: Transfer(address,address,uint256)
    // topic0 = event signature hash
    // topic1 = from address (indexed)
    // topic2 = to address (indexed)  
    // data = value (not indexed)
    
    if (!log.topic1 || !log.topic2 || !log.data) {
      console.log('❌ Missing required log data');
      return null;
    }

    // Remove '0x' prefix and pad to 64 chars, then add '0x' back
    const from = '0x' + log.topic1.slice(2).padStart(64, '0').slice(-40);
    const to = '0x' + log.topic2.slice(2).padStart(64, '0').slice(-40);
    
    // Parse value from data field
    const value = BigInt(log.data).toString();
    
    return { from, to, value };
  } catch (error) {
    console.error('❌ Error decoding transfer log:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔔 Received webhook from Moralis');
  
  try {
    const body = await request.text();
    const data = JSON.parse(body);
    
    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && !verifySignature(request, body)) {
      return NextResponse.json({ error: 'Bad signature' }, { status: 401 });
    }

    const { logs, txs, tag, confirmed, chainId } = data;
    
    if (tag !== 'user-wallets' && tag !== 'usdc-transactions') {
      console.log(`⏭️ Ignoring webhook with tag: ${tag}`);
      return NextResponse.json({ message: 'Ignored - wrong tag' }, { status: 200 });
    }

    console.log(`📊 Processing ${logs?.length || 0} logs and ${txs?.length || 0} transactions`);
    console.log(`🔗 Chain ID: ${chainId}, Confirmed: ${confirmed}`);
    console.log(`📋 Webhook type: ${confirmed ? 'CONFIRMATION' : 'DETECTION'}`);

    // Get the USDC contract info for this chain
    const usdcConfig = USDC_CONTRACTS[chainId as keyof typeof USDC_CONTRACTS];
    if (!usdcConfig) {
      console.log(`❌ Unsupported chain: ${chainId}`);
      return NextResponse.json({ message: 'Unsupported chain' }, { status: 200 });
    }

    // Get list of monitored addresses from database
    const { data: monitoredWallets, error: walletsError } = await supabase
      .from('monitored_wallets')
      .select('address')
      .eq('active', true);
      
    if (walletsError) {
      console.error('❌ Error fetching monitored wallets:', walletsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const monitoredAddresses = monitoredWallets?.map(w => w.address.toLowerCase()) || [];
    
    if (monitoredAddresses.length === 0) {
      console.log('⚠️ No monitored addresses found');
      return NextResponse.json({ message: 'No monitored addresses' }, { status: 200 });
    }

    // Process logs (ERC-20 Transfer events)
    if (logs && logs.length > 0) {
      for (const log of logs) {
        try {
          console.log('🔍 Processing log:', {
            address: log.address,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber
          });
          
          // Only process logs from USDC contracts
          if (log.address?.toLowerCase() !== usdcConfig.address) {
            console.log(`⏭️ Skipping non-USDC contract: ${log.address}`);
            continue;
          }

          // Decode the Transfer event
          const decoded = decodeTransferLog(log);
          if (!decoded) {
            console.log('⏭️ Failed to decode transfer log');
            continue;
          }

          const { from, to, value } = decoded;
          const amount = formatUSDCAmount(value, usdcConfig.decimals);
          
          // Determine transaction type
          const transactionType = determineTransactionType(from, to, monitoredAddresses);
          
          // Only process if it involves our monitored addresses
          if (transactionType === 'unknown') {
            console.log('⏭️ Skipping - no monitored addresses involved');
            continue;
          }

          console.log(`💰 USDC ${transactionType}: ${amount} ${usdcConfig.symbol} on ${usdcConfig.chain}`);
          console.log(`📤 From: ${from}`);
          console.log(`📥 To: ${to}`);

          // Check if transaction already exists
          const { data: existingTx } = await supabase
            .from('usdc_transactions')
            .select('id, confirmed')
            .eq('tx_hash', log.transactionHash)
            .single();

          if (existingTx) {
            // Update existing transaction with new confirmation status
            const { error: updateError } = await supabase
              .from('usdc_transactions')
              .update({
                confirmed: confirmed,
                block_number: parseInt(log.blockNumber),
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTx.id);

            if (updateError) {
              console.error('❌ Error updating transaction:', updateError);
            } else {
              console.log(`🔄 Updated transaction ${log.transactionHash} - confirmed: ${confirmed}`);
              
              // Skip round-up processing on confirmation since we do it immediately (POC mode)
              if (confirmed && !existingTx.confirmed) {
                console.log('✅ Transaction confirmed - round-up already processed on detection');
                // Round-up was already processed when transaction was first detected
              }
            }
            continue;
          }

          // Determine user_address based on transaction type
          const userAddress = transactionType === 'spend' ? from.toLowerCase() : to.toLowerCase();

          // Store new transaction in database
          const roundUpAmount = transactionType === 'spend' ? calculateRoundUp(amount) : 0;
          const { data: insertedData, error: insertError } = await supabase
            .from('usdc_transactions')
            .insert({
              tx_hash: log.transactionHash,
              block_number: parseInt(log.blockNumber),
              chain_id: chainId,
              chain_name: usdcConfig.chain,
              contract_address: log.address.toLowerCase(),
              from_address: from.toLowerCase(),
              to_address: to.toLowerCase(),
              user_address: userAddress,
              amount: amount,
              amount_raw: value,
              transaction_type: transactionType,
              confirmed: confirmed,
              log_index: log.logIndex,
              transaction_index: log.transactionIndex,
              created_at: new Date().toISOString(),
              round_up_amount: roundUpAmount,
              round_up_processed: false
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Database insert error:', insertError);
            continue;
          }

          console.log(`✅ Stored new transaction: ${insertedData.id} (confirmed: ${confirmed})`);

          // Store transaction for user-controlled round-up staking
          if (transactionType === 'spend') {
            console.log('💰 USDC spend detected - user can stake round-up amount from dashboard');
          } else {
            console.log('ℹ️ USDC received - no round-up calculation needed');
          }

        } catch (logError) {
          console.error('❌ Error processing log:', logError);
          continue;
        }
      }
    }

    console.log('✅ Webhook processing completed');
    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'coffee-change-webhook-handler'
  });
}