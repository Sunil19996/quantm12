/**
 * Copy Trading System - Integration Examples
 * 
 * This file shows how to integrate the copy-trading system
 * with the automatic trade replication flow.
 */

// ============================================
// EXAMPLE 1: Master Places a Trade
// ============================================

/**
 * When master places a trade on their AliceBlue account:
 * 1. Master places trade (e.g., Buy 100 RELIANCE @ 2850.50)
 * 2. System detects the trade
 * 3. For each follower, calculate follower quantity
 * 4. Log copy trades for all followers
 * 5. Followers see the trade on their dashboard
 */

import {
  calculateFollowerQuantity,
  replicateTradeToFollowers,
  logCopyTrade,
  updateCopyTradeStatus,
} from '@/lib/copy-trading-engine';

// Example: Master places a BUY trade
async function exampleMasterTradeFlow() {
  const masterTrade = {
    symbol: 'RELIANCE',
    side: 'BUY' as const,
    masterQty: 100,
    price: 2850.50,
  };

  // Get followers from database
  const followersResponse = await fetch('/api/followers/list');
  const { followers } = await followersResponse.json();

  console.log(`[EXAMPLE] Master placed: ${masterTrade.symbol} ${masterTrade.side} qty=${masterTrade.masterQty}`);

  // Replicate to all followers
  await replicateTradeToFollowers({
    masterId: 'master_account',
    followers: followers.map((f: any) => ({
      id: f.id,
      name: f.username,
      apiKey: 'would-be-from-db',
      clientId: 'would-be-from-db',
      lotMultiplier: f.lotMultiplier || 1.0,
      maxQuantity: f.maxQuantity,
    })),
    symbol: masterTrade.symbol,
    side: masterTrade.side,
    masterQty: masterTrade.masterQty,
    price: masterTrade.price,
  });

  console.log(`[EXAMPLE] Copy trades created for ${followers.length} followers`);
}

// ============================================
// EXAMPLE 2: Calculate Follower Quantity
// ============================================

/**
 * Different scenarios for calculating follower quantity
 */

async function exampleCalculateQuantities() {
  // Scenario 1: Simple 1:1 replication
  const qty1 = calculateFollowerQuantity(100, 1.0);
  console.log('1:1 replication: 100 * 1.0 =', qty1); // 100

  // Scenario 2: Half replication (0.5x)
  const qty2 = calculateFollowerQuantity(100, 0.5);
  console.log('Half replication: 100 * 0.5 =', qty2); // 50

  // Scenario 3: Double replication (2x)
  const qty3 = calculateFollowerQuantity(100, 2.0);
  console.log('Double replication: 100 * 2.0 =', qty3); // 200

  // Scenario 4: With max quantity constraint
  const qty4 = calculateFollowerQuantity(100, 2.0, 150);
  console.log('With max constraint: 100 * 2.0 capped at 150 =', qty4); // 150

  // Scenario 5: Very small multiplier
  const qty5 = calculateFollowerQuantity(100, 0.1);
  console.log('Very small multiplier: 100 * 0.1 =', qty5); // 10 (at least 1)
}

// ============================================
// EXAMPLE 3: Master Manually Triggers Test Trade
// ============================================

/**
 * Master can manually create a test copy trade
 * (Already implemented in ManualCopyTradeDialog)
 */

async function exampleManualTestTrade() {
  const testTrade = {
    symbol: 'TCS',
    side: 'SELL',
    masterQty: 50,
    price: 3650.25,
  };

  // Get all followers
  const followersResponse = await fetch('/api/followers/list');
  const { followers } = await followersResponse.json();

  console.log(`[EXAMPLE] Master triggers test trade: ${testTrade.symbol}`);

  // Create copy trade for each follower
  for (const follower of followers) {
    const followerQty = calculateFollowerQuantity(
      testTrade.masterQty,
      follower.lotMultiplier || 1.0,
      follower.maxQuantity
    );

    await logCopyTrade({
      masterId: 'master_account',
      followerId: follower.id,
      symbol: testTrade.symbol,
      side: testTrade.side as 'BUY' | 'SELL',
      masterQty: testTrade.masterQty,
      followerQty,
      price: testTrade.price,
      status: 'SUCCESS', // Immediately successful for test
    });

    console.log(`[EXAMPLE] Logged copy trade for ${follower.username}: qty=${followerQty}`);
  }
}

// ============================================
// EXAMPLE 4: Follower Sees Copy Trades
// ============================================

/**
 * Follower dashboard fetches and displays copy trades
 */

async function exampleFollowerDashboard(followerId: string) {
  // Fetch copy trades for this follower
  const response = await fetch(`/api/followers/copy-trades?followerId=${followerId}`);
  const { trades } = await response.json();

  console.log(`[EXAMPLE] Follower ${followerId} has ${trades.length} copy trades:`);

  trades.forEach((trade: any) => {
    console.log(`  - ${trade.symbol} ${trade.side} qty=${trade.followerQty} @ ₹${trade.price} [${trade.status}]`);
  });

  // Calculate stats
  const stats = {
    total: trades.length,
    successful: trades.filter((t: any) => t.status === 'SUCCESS').length,
    pending: trades.filter((t: any) => t.status === 'PENDING').length,
    failed: trades.filter((t: any) => t.status === 'FAILED').length,
  };

  console.log('[EXAMPLE] Stats:', stats);
}

// ============================================
// EXAMPLE 5: Handle Trade Status Updates
// ============================================

/**
 * When an order placement succeeds/fails, update the copy trade status
 */

async function exampleUpdateTradeStatus() {
  // Scenario 1: Trade successfully placed
  await updateCopyTradeStatus(
    'trade_abc123def456',
    'SUCCESS',
    undefined // No reason for success
  );
  console.log('[EXAMPLE] Trade marked as SUCCESS');

  // Scenario 2: Trade failed due to insufficient funds
  await updateCopyTradeStatus(
    'trade_abc123def456',
    'FAILED',
    'Insufficient funds in account'
  );
  console.log('[EXAMPLE] Trade marked as FAILED: Insufficient funds');

  // Scenario 3: Trade cancelled by user
  await updateCopyTradeStatus(
    'trade_abc123def456',
    'CANCELLED',
    'Manually cancelled by follower'
  );
  console.log('[EXAMPLE] Trade marked as CANCELLED');
}

// ============================================
// EXAMPLE 6: Register a New Follower
// ============================================

/**
 * Master registers a new follower with API credentials
 */

async function exampleRegisterFollower() {
  const newFollower = {
    followerName: 'John Trader',
    apiKey: 'api_key_1234567890abcdef',
    apiSecret: 'api_secret_fedcba0987654321',
    clientId: 'client_id_abcdef1234567890',
    lotMultiplier: 1.5, // Receive 1.5x quantity
    maxQuantity: 500, // Max 500 quantity per trade
    maxOrderValue: 250000, // Max ₹2.5L per order
    maxDailyLoss: 25000, // Stop if loss > ₹25k
  };

  const response = await fetch('/api/followers/register-api-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newFollower),
  });

  const result = await response.json();

  if (result.ok) {
    console.log('[EXAMPLE] Follower registered successfully!');
    console.log('  Follower ID:', result.follower.followerId);
    console.log('  Login Username:', result.follower.loginUsername);
    console.log('  Login Password:', result.follower.loginPassword);
    console.log('  Created At:', result.follower.createdAt);
    console.log('');
    console.log('[EXAMPLE] IMPORTANT: Share credentials with follower:');
    console.log('  Website: https://your-domain.com');
    console.log('  Username:', result.follower.loginUsername);
    console.log('  Password:', result.follower.loginPassword);
    console.log('  ⚠️  Credentials shown only once - save them securely!');
  }
}

// ============================================
// EXAMPLE 7: Full Integration - Day in Life
// ============================================

/**
 * Complete workflow from master placing trade to follower seeing it
 */

async function exampleFullDayInLife() {
  console.log('=== DAY IN LIFE OF COPY-TRADING SYSTEM ===\n');

  // Step 1: Master connects OAuth
  console.log('Step 1: Master connects OAuth');
  console.log('  - Master logs into dashboard');
  console.log('  - Clicks "Connect" → OAuth flow');
  console.log('  - System stores OAuth token\n');

  // Step 2: Master registers followers
  console.log('Step 2: Master registers followers');
  console.log('  - Goes to Connections page');
  console.log('  - Clicks "Add Followers"');
  console.log('  - Fills form with follower API credentials');
  console.log('  - System generates username/password');
  console.log('  - Master shares with follower\n');

  // Step 3: Follower logs in
  console.log('Step 3: Follower logs in');
  console.log('  - Receives credentials from master');
  console.log('  - Visits website URL');
  console.log('  - Logs in with username/password');
  console.log('  - Sees dashboard with "Copy Trading" section (initially empty)\n');

  // Step 4: Master places trade
  console.log('Step 4: Master places trade on AliceBlue');
  console.log('  - Master places: BUY 100 RELIANCE @ 2850.50');
  console.log('  - System detects trade');
  console.log('  - Calculates follower quantities (e.g., 1.5x multiplier = 150 qty)');
  console.log('  - Logs copy trades for all followers\n');

  // Step 5: Follower sees copy trade
  console.log('Step 5: Follower sees copy trade');
  console.log('  - Dashboard fetches copy trades');
  console.log('  - Shows: RELIANCE BUY 150 @ 2850.50 [SUCCESS]');
  console.log('  - Stats: Total=1, Successful=1, Pending=0, Failed=0');
  console.log('  - Refreshes every 5 seconds\n');

  // Step 6: More trades
  console.log('Step 6: Master places more trades');
  console.log('  - Master places multiple trades throughout the day');
  console.log('  - Each one automatically replicates to followers');
  console.log('  - Dashboard updates in real-time\n');

  // Step 7: Day ends
  console.log('Step 7: End of day');
  console.log('  - Audit trail: All trades logged in .alice.copy-trades.json');
  console.log('  - Master can review: Which followers participated');
  console.log('  - Master can check: Success rates, failures, etc.');
}

// ============================================
// INTEGRATION CHECKLIST
// ============================================

/**
 * When integrating copy-trading with existing trade flow:
 * 
 * IMMEDIATE ACTIONS:
 * ✅ Register follower with API credentials
 * ✅ Manually test copy trades via dashboard
 * ✅ Check follower dashboard shows copy trades
 * 
 * PHASE 1 (WebSocket/Auto Detection):
 * [ ] Hook trade detection from AliceBlue
 * [ ] Auto-calculate follower quantities
 * [ ] Auto-create copy trade entries
 * [ ] Real-time status updates
 * 
 * PHASE 2 (Risk Management):
 * [ ] Enforce maxQuantity before placing
 * [ ] Track daily loss per follower
 * [ ] Enforce maxOrderValue check
 * [ ] Block trades if limits exceeded
 * 
 * PHASE 3 (Production):
 * [ ] Database migration (file-based → proper DB)
 * [ ] Encrypted credential storage
 * [ ] Audit logging with user activity
 * [ ] Notification system (email/SMS)
 * [ ] Analytics dashboard
 */

console.log(`
✅ Copy-Trading System Ready!

Current Status:
- ✅ Follower registration working
- ✅ Manual copy trade testing working
- ✅ Follower dashboard displaying trades
- ✅ Copy trade logging functional

Next Steps:
1. Register your first follower
2. Create a test copy trade from dashboard
3. Check follower dashboard for the trade
4. Iterate and refine as needed

Files:
- Guide: COPY_TRADING_SYSTEM.md
- Endpoints: /api/followers/*
- Dashboard: /dashboard (master/follower)
- Connections: /connections (setup)
`);
