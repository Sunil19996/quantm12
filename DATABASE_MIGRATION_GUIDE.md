# Database Migration Guide - Code Integration

## Overview

This guide explains how to migrate the existing file-based storage system to MySQL database persistence. The system currently uses JSON files for storage but will transition to database tables for scalability and reliability.

## Current Storage System

**Files being used:**
```
.alice.tokens.json                 → oauth_tokens table
.alice.follower-credentials.json   → follower_credentials table + users table
.alice.copy-trades.json            → copy_trades table + trade_events table
```

## Migration Path

### Phase 1: Database Setup (DONE ✅)
- ✅ Schema created (`database/schema.sql`)
- ✅ Database utilities ready (`src/lib/database.ts`)
- ✅ Migration script created (`scripts/migrate-db.js`)

### Phase 2: Run Database Setup (NEXT STEP)

```bash
# Install mysql2 package if not already installed
npm install mysql2

# Run migration script
node scripts/migrate-db.js
```

Expected output:
```
✅ Connected to database
✅ Found 47 SQL statements
🚀 Executing SQL statements...
✅ Migration completed successfully!
```

### Phase 3: Update API Routes

#### 1. OAuth Token Storage (`src/app/api/alice/oauth-connect/route.ts`)

**Before (File-based):**
```typescript
import fs from 'fs';
import path from 'path';

const tokenFile = path.join(process.cwd(), '.alice.tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
tokens[userId] = token;
fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
```

**After (Database):**
```typescript
import { saveOAuthToken } from '@/lib/database';

await saveOAuthToken(userId, {
  access_token: token.access_token,
  refresh_token: token.refresh_token,
  expires_at: expiryTime,
  scope: token.scope
});
```

#### 2. Get OAuth Token (`src/lib/alice.ts`)

**Before (File-based):**
```typescript
export function getAccountToken(accountId: string): { token: string; refreshToken?: string } | null {
  const tokenFile = path.join(process.cwd(), '.alice.tokens.json');
  if (!fs.existsSync(tokenFile)) return null;
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
  return tokens[accountId];
}
```

**After (Database):**
```typescript
import { getOAuthToken } from '@/lib/database';

export async function getAccountToken(accountId: string) {
  const tokenRecord = await getOAuthToken(accountId);
  return tokenRecord ? {
    token: tokenRecord.access_token,
    refreshToken: tokenRecord.refresh_token
  } : null;
}
```

#### 3. Follower Credentials (`src/app/api/followers/register-api-key/route.ts`)

**Before (File-based):**
```typescript
const credsFile = path.join(process.cwd(), '.alice.follower-credentials.json');
const credentials = fs.existsSync(credsFile) ? 
  JSON.parse(fs.readFileSync(credsFile, 'utf-8')) : {};

credentials[followerId] = {
  loginUsername,
  loginPasswordHash,
  apiKey,
  apiSecret,
  clientId,
  lotMultiplier
};

fs.writeFileSync(credsFile, JSON.stringify(credentials, null, 2));
```

**After (Database):**
```typescript
import { insert } from '@/lib/database';

await insert('followers', {
  id: followerId,
  master_id: masterId,
  follower_name: followerName,
  status: 'active'
});

await insert('follower_credentials', {
  follower_id: followerId,
  login_username: loginUsername,
  login_password_hash: loginPasswordHash,
  api_key: apiKey,
  api_secret: apiSecret,
  client_id: clientId,
  lot_multiplier: lotMultiplier
});
```

#### 4. Copy Trade Logging (`src/app/api/followers/copy-trades-log/route.ts`)

**Before (File-based):**
```typescript
const tradesFile = path.join(process.cwd(), '.alice.copy-trades.json');
const trades = fs.existsSync(tradesFile) ? 
  JSON.parse(fs.readFileSync(tradesFile, 'utf-8')) : [];

trades.push({
  id: tradeId,
  masterId,
  followerId,
  symbol,
  side,
  masterQty,
  followerQty,
  price,
  status: 'PENDING',
  created_at: new Date()
});

fs.writeFileSync(tradesFile, JSON.stringify(trades, null, 2));
```

**After (Database):**
```typescript
import { insert } from '@/lib/database';

await insert('copy_trades', {
  id: tradeId,
  master_id: masterId,
  follower_id: followerId,
  symbol,
  side,
  master_qty: masterQty,
  follower_qty: followerQty,
  price,
  status: 'PENDING'
});
```

#### 5. Get Copy Trades (`src/app/api/followers/copy-trades/route.ts`)

**Before (File-based):**
```typescript
const tradesFile = path.join(process.cwd(), '.alice.copy-trades.json');
const trades = fs.existsSync(tradesFile) ? 
  JSON.parse(fs.readFileSync(tradesFile, 'utf-8')) : [];

const followerTrades = trades.filter(t => t.followerId === followerId);
```

**After (Database):**
```typescript
import { getFollowerCopyTrades } from '@/lib/database';

const followerTrades = await getFollowerCopyTrades(followerId);
```

### Phase 4: Update Helper Functions

#### Copy Trading Engine (`src/lib/copy-trading-engine.ts`)

Update all functions to use database instead of files:

```typescript
import { 
  logCopyTrade, 
  updateCopyTradeStatus,
  getFollowerCopyTrades 
} from '@/lib/database';

export async function replicateTradeToFollowers(
  masterId: string,
  masterTrade: Trade
) {
  // Get followers from database
  const followers = await query(
    'SELECT * FROM followers WHERE master_id = ?',
    [masterId]
  );

  for (const follower of followers) {
    // Calculate quantity
    const followerQty = calculateFollowerQuantity(
      masterTrade.qty,
      follower.lot_multiplier
    );

    // Log to database
    await logCopyTrade({
      id: generateId(),
      master_id: masterId,
      follower_id: follower.id,
      symbol: masterTrade.symbol,
      side: masterTrade.side,
      master_qty: masterTrade.qty,
      follower_qty: followerQty,
      price: masterTrade.price,
      status: 'PENDING'
    });
  }
}

export async function updateTradeStatus(
  tradeId: string,
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
  reason?: string
) {
  await updateCopyTradeStatus(tradeId, status, reason);
}
```

### Phase 5: Update Authentication Flow

#### Follower Login (`src/app/(auth)/login/page.tsx`)

Add database lookup for credentials:

```typescript
import { getFollowerByUsername } from '@/lib/database';
import { verifyPassword } from '@/lib/auth';

export async function authenticateFollower(username: string, password: string) {
  // Get from database
  const follower = await getFollowerByUsername(username);
  
  if (!follower) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await verifyPassword(password, follower.login_password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Create session
  return follower;
}
```

### Phase 6: Update API Routes with Database

Create updated versions of key routes:

#### `/api/followers/register-api-key` (Database Version)

```typescript
// src/app/api/followers/register-api-key/route.ts
import { insert } from '@/lib/database';
import crypto from 'crypto';

export async function POST(request: Request) {
  const { masterId, followerName, apiKey, apiSecret, clientId, lotMultiplier } = await request.json();

  // Generate credentials
  const followerId = `follower-${crypto.randomUUID()}`;
  const loginUsername = `${followerName.replace(/\s+/g, '_')}_${Date.now()}`.toLowerCase();
  const loginPassword = crypto.randomBytes(16).toString('hex');
  const loginPasswordHash = crypto.createHash('sha256').update(loginPassword).digest('hex');

  try {
    // Save to database
    await insert('followers', {
      id: followerId,
      master_id: masterId,
      follower_name: followerName,
      status: 'active'
    });

    await insert('follower_credentials', {
      follower_id: followerId,
      login_username: loginUsername,
      login_password_hash: loginPasswordHash,
      api_key: apiKey,
      api_secret: apiSecret,
      client_id: clientId,
      lot_multiplier: lotMultiplier || 1.0
    });

    // Log action
    await insert('audit_logs', {
      user_id: masterId,
      action: 'CREATE_FOLLOWER',
      resource_type: 'FOLLOWER',
      resource_id: followerId,
      details: JSON.stringify({ followerName })
    });

    return Response.json({
      success: true,
      followerId,
      loginUsername,
      loginPassword: loginPassword, // Only show once!
      message: 'Follower registered successfully. Save these credentials securely!'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

#### `/api/followers/copy-trades` (Database Version)

```typescript
// src/app/api/followers/copy-trades/route.ts
import { getFollowerCopyTrades } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const followerId = searchParams.get('followerId');

  if (!followerId) {
    return Response.json({ error: 'followerId required' }, { status: 400 });
  }

  try {
    const trades = await getFollowerCopyTrades(followerId, 50);
    
    return Response.json({
      success: true,
      trades,
      total: trades.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Testing the Migration

### 1. Test Database Connection

```typescript
// test-db-connection.ts
import { query } from '@/lib/database';

async function testConnection() {
  try {
    const result = await query('SELECT 1 as test');
    console.log('✅ Database connection successful:', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
```

### 2. Test Token Storage

```typescript
import { saveOAuthToken, getOAuthToken } from '@/lib/database';

async function testTokenStorage() {
  // Save
  await saveOAuthToken('test-user', {
    access_token: 'test_token_12345',
    refresh_token: 'refresh_67890',
    expires_at: new Date(Date.now() + 3600000).toISOString()
  });

  // Retrieve
  const token = await getOAuthToken('test-user');
  console.log('✅ Token stored and retrieved:', token);
}
```

### 3. Test Follower Credentials

```typescript
import { insert, getFollowerByUsername } from '@/lib/database';

async function testFollowerCredentials() {
  // Create
  await insert('followers', {
    id: 'test-follower-1',
    master_id: 'master-1',
    follower_name: 'Test Follower',
    status: 'active'
  });

  // Retrieve
  const follower = await getFollowerByUsername('test_username');
  console.log('✅ Follower created and retrieved:', follower);
}
```

## Rollback Plan

If issues occur, you can temporarily revert to file-based storage:

1. Keep file-based functions intact in code
2. Add feature flag environment variable:
   ```
   USE_DATABASE_STORAGE=false
   ```
3. Use conditional logic:
   ```typescript
   if (process.env.USE_DATABASE_STORAGE === 'true') {
     // Use database
   } else {
     // Use file system
   }
   ```

## Performance Considerations

### Connection Pooling
The database module uses connection pooling with:
- **connectionLimit**: 10 concurrent connections
- **queueLimit**: 0 (unlimited queue)
- **enableKeepAlive**: true

### Indexes
Automatically created for:
- `copy_trades(follower_id, status)`
- `followers(master_id, status)`
- `oauth_tokens(user_id, account_id, provider)`
- `audit_logs(created_at DESC)`

### Query Optimization
```sql
-- Fast retrieval of follower's recent trades
SELECT * FROM copy_trades 
WHERE follower_id = ? 
ORDER BY created_at DESC LIMIT 50;
-- Uses index on (follower_id, created_at)

-- Quick status checks
SELECT COUNT(*) FROM copy_trades 
WHERE follower_id = ? AND status = 'SUCCESS';
-- Uses index on (follower_id, status)
```

## Monitoring

Monitor database performance:

```typescript
// Monitor query times
import { queryOne } from '@/lib/database';

export async function getQueryStats() {
  const result = await queryOne('SHOW STATUS LIKE "Queries"');
  console.log('Total Queries:', result);
}
```

## Migration Checklist

- [ ] Run `npm install mysql2`
- [ ] Run `node scripts/migrate-db.js`
- [ ] Verify tables with `SHOW TABLES;`
- [ ] Update `src/lib/alice.ts` to use `getOAuthToken()`
- [ ] Update `/api/followers/register-api-key` route
- [ ] Update `/api/followers/copy-trades-log` route
- [ ] Update `/api/followers/copy-trades` route
- [ ] Update `src/lib/copy-trading-engine.ts`
- [ ] Test OAuth token storage
- [ ] Test follower registration
- [ ] Test copy trade logging
- [ ] Verify audit logs
- [ ] Deploy to production
- [ ] Monitor database performance
- [ ] Archive old JSON files (don't delete immediately)

## Support & Troubleshooting

**Issue: "Lost connection to MySQL server"**
- Check CloudPanel MySQL service is running
- Verify connection pooling is initialized

**Issue: Performance degradation**
- Check for missing indexes
- Review slow query logs
- Increase connection pool size if needed

**Issue: Duplicate entries**
- Use transactions for critical operations
- Verify unique constraints are in place

See `DATABASE_SETUP.md` for additional troubleshooting.

