# Database Implementation Checklist

## Phase 1: Database Setup (COMPLETED ✅)

### Infrastructure Files Created
- ✅ `database/schema.sql` - Complete schema with 14 tables + 3 views
- ✅ `src/lib/database.ts` - TypeScript database utilities
- ✅ `scripts/migrate-db.js` - Automated migration script
- ✅ `scripts/test-database.js` - Connection testing script
- ✅ `.env.local` - Database credentials configured
- ✅ `package.json` - Added database scripts

### Documentation Files Created
- ✅ `DATABASE.md` - Quick start guide
- ✅ `DATABASE_SETUP.md` - Detailed setup instructions
- ✅ `DATABASE_MIGRATION_GUIDE.md` - Code integration guide

**Status: COMPLETE ✅**

---

## Phase 2: Run Database Migration (NEXT STEP)

### Instructions
```bash
# 1. Install MySQL package
npm install mysql2

# 2. Run migration
npm run db:migrate

# 3. Test connection
npm run db:test

# 4. Verify all tables created
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb -e "SHOW TABLES;"
```

### Expected Outcome
- All 14 tables created successfully
- All 3 views created successfully
- System settings initialized (6 entries)
- No errors reported

**Status: PENDING ⏳**

---

## Phase 3: Update API Routes (MIGRATION)

### High Priority Routes (Required for functionality)

#### 1. OAuth Token Storage
File: `src/app/api/alice/oauth-connect/route.ts`

**Current Code Pattern:**
```typescript
const tokenFile = path.join(process.cwd(), '.alice.tokens.json');
fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
```

**Update To:**
```typescript
import { saveOAuthToken } from '@/lib/database';
await saveOAuthToken(userId, tokenData);
```

**Estimated Impact:** 2 edits
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

#### 2. Get OAuth Token
File: `src/lib/alice.ts` - `getAccountToken()` function

**Current Code Pattern:**
```typescript
const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
return tokens[accountId];
```

**Update To:**
```typescript
import { getOAuthToken } from '@/lib/database';
const token = await getOAuthToken(accountId);
return token?.access_token;
```

**Estimated Impact:** 1 edit, make function async
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

#### 3. Register Follower with API Key
File: `src/app/api/followers/register-api-key/route.ts`

**Current Code Pattern:**
```typescript
const credsFile = path.join(process.cwd(), '.alice.follower-credentials.json');
credentials[followerId] = { ...data };
fs.writeFileSync(credsFile, JSON.stringify(credentials, null, 2));
```

**Update To:**
```typescript
import { insert } from '@/lib/database';

// Insert into followers table
await insert('followers', {
  id: followerId,
  master_id: masterId,
  follower_name: followerName,
  status: 'active'
});

// Insert credentials
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

**Estimated Impact:** 1 edit, ~20 lines
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

#### 4. Follower Login
File: `src/app/(auth)/login/page.tsx` - authentication logic

**Current Code Pattern:**
```typescript
// Reads from .alice.follower-credentials.json file
const credentials = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
```

**Update To:**
```typescript
import { getFollowerByUsername, verifyPassword } from '@/lib/database';

const follower = await getFollowerByUsername(username);
if (!follower || !await verifyPassword(password, follower.login_password_hash)) {
  throw new Error('Invalid credentials');
}
```

**Estimated Impact:** 1-2 edits
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

#### 5. Log Copy Trade
File: `src/app/api/followers/copy-trades-log/route.ts`

**Current Code Pattern:**
```typescript
const tradesFile = path.join(process.cwd(), '.alice.copy-trades.json');
trades.push(tradeData);
fs.writeFileSync(tradesFile, JSON.stringify(trades, null, 2));
```

**Update To:**
```typescript
import { logCopyTrade, updateCopyTradeStatus } from '@/lib/database';

// For POST (create)
await logCopyTrade({
  id: tradeId,
  master_id: masterId,
  follower_id: followerId,
  symbol: symbol,
  side: side,
  master_qty: masterQty,
  follower_qty: followerQty,
  price: price,
  status: 'PENDING'
});

// For PATCH (update)
await updateCopyTradeStatus(tradeId, status, reason);
```

**Estimated Impact:** 2 edits
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

#### 6. Get Copy Trades
File: `src/app/api/followers/copy-trades/route.ts`

**Current Code Pattern:**
```typescript
const trades = JSON.parse(fs.readFileSync(tradesFile, 'utf-8'));
const followerTrades = trades.filter(t => t.followerId === followerId);
```

**Update To:**
```typescript
import { getFollowerCopyTrades } from '@/lib/database';

const followerTrades = await getFollowerCopyTrades(followerId, 50);
```

**Estimated Impact:** 1 edit
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

#### 7. Copy Trading Engine
File: `src/lib/copy-trading-engine.ts` - all functions

**Functions to Update:**
- `replicateTradeToFollowers()` - use database instead of files
- `calculateFollowerQuantity()` - fetch follower data from DB
- `updateCopyTradeStatus()` - use database update function
- `logCopyTrade()` - use database insert

**Estimated Impact:** 4+ edits
**Priority:** 🔴 CRITICAL
**Status:** ⏳ NOT STARTED

---

### Medium Priority Routes (Performance & Audit)

#### Audit Logging
File: Create `src/lib/audit-log.ts` or update existing

**Add To Routes:**
```typescript
import { insert } from '@/lib/database';

// In API routes
await insert('audit_logs', {
  user_id: userId,
  action: 'CREATE_FOLLOWER',
  resource_type: 'FOLLOWER',
  resource_id: resourceId,
  details: JSON.stringify({ followerName, lotMultiplier })
});
```

**Priority:** 🟡 MEDIUM
**Status:** ⏳ NOT STARTED

---

#### Performance Metrics
File: Create `src/lib/performance-metrics.ts`

**Functionality:**
- Calculate daily trade statistics
- Track success rates per follower
- Update performance_metrics table

**Priority:** 🟡 MEDIUM
**Status:** ⏳ NOT STARTED

---

#### Trade Events Tracking
File: Update copy-trading-engine.ts

**Add Database Calls:**
```typescript
await insert('trade_events', {
  copy_trade_id: tradeId,
  follower_id: followerId,
  event_type: 'CREATED',
  event_data: JSON.stringify(tradeData),
  message: 'Trade created successfully'
});
```

**Priority:** 🟡 MEDIUM
**Status:** ⏳ NOT STARTED

---

## Phase 4: Testing & Validation

### Unit Tests

```typescript
// test/database.test.ts
describe('Database Functions', () => {
  it('should save and retrieve OAuth token', async () => { });
  it('should register follower with credentials', async () => { });
  it('should log copy trade', async () => { });
  it('should get follower by username', async () => { });
  it('should update trade status', async () => { });
});
```

**Status:** ⏳ NOT STARTED

---

### Integration Tests

```bash
# Manual testing
npm run db:test              # Verify connection
npm run dev                  # Start application
# Test OAuth flow
# Test follower registration
# Test copy trade creation
# Verify data in database
```

**Status:** ⏳ NOT STARTED

---

### Verification Checklist

- [ ] Database migration completed successfully
- [ ] All 14 tables created
- [ ] All 3 views available
- [ ] System settings initialized
- [ ] OAuth token storage updated
- [ ] Follower registration updated
- [ ] Copy trade logging updated
- [ ] Follower login updated
- [ ] No file-based storage calls remain
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No runtime errors in console
- [ ] Audit logs recording actions
- [ ] Performance metrics tracking

**Status:** ⏳ NOT STARTED

---

## Phase 5: Cleanup & Optimization

### Archive Old Files (Keep for reference, don't delete immediately)

- `.alice.tokens.json` → Backup to `/backups/`
- `.alice.follower-credentials.json` → Backup to `/backups/`
- `.alice.copy-trades.json` → Backup to `/backups/`

**Status:** ⏳ PENDING

---

### Remove File-Based Storage Code

After verifying database works:
- Remove all `fs.readFileSync()` calls
- Remove all `fs.writeFileSync()` calls
- Remove JSON file path references
- Clean up old backup code

**Status:** ⏳ PENDING

---

### Performance Optimization

- [ ] Add indexes to frequently queried columns
- [ ] Optimize query patterns
- [ ] Implement connection pooling monitoring
- [ ] Set up query logging for slow queries
- [ ] Configure auto-archive for old trades

**Status:** ⏳ NOT STARTED

---

## Phase 6: Production Deployment

### Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] No database errors in logs
- [ ] Performance verified (< 100ms per query)
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team trained on database usage

**Status:** ⏳ NOT STARTED

---

### Deployment Steps

1. Create database backup
2. Run migrations in staging
3. Run full test suite
4. Update API routes (one by one)
5. Monitor for errors
6. Deploy to production
7. Archive old JSON files
8. Monitor database performance

**Status:** ⏳ NOT STARTED

---

## Summary

| Phase | Task | Status | Priority |
|-------|------|--------|----------|
| 1 | Infrastructure & Files | ✅ COMPLETE | - |
| 2 | Run Migration | ⏳ NEXT | 🔴 CRITICAL |
| 3.1 | OAuth Token Storage | ⏳ PENDING | 🔴 CRITICAL |
| 3.2 | Get OAuth Token | ⏳ PENDING | 🔴 CRITICAL |
| 3.3 | Register Follower | ⏳ PENDING | 🔴 CRITICAL |
| 3.4 | Follower Login | ⏳ PENDING | 🔴 CRITICAL |
| 3.5 | Log Copy Trade | ⏳ PENDING | 🔴 CRITICAL |
| 3.6 | Get Copy Trades | ⏳ PENDING | 🔴 CRITICAL |
| 3.7 | Copy Trade Engine | ⏳ PENDING | 🔴 CRITICAL |
| 3.8 | Audit Logging | ⏳ PENDING | 🟡 MEDIUM |
| 4 | Testing & Validation | ⏳ PENDING | 🔴 CRITICAL |
| 5 | Cleanup | ⏳ PENDING | 🟡 MEDIUM |
| 6 | Production Deploy | ⏳ PENDING | 🔴 CRITICAL |

**Overall Progress: 8% (1/13 phases complete)**

---

## Next Action Items

### Immediate (Today)
1. Run `npm run db:migrate`
2. Run `npm run db:test`
3. Verify all 14 tables created
4. Commit structure to Git

### Short Term (This Week)
1. Update OAuth token storage code
2. Update follower registration code
3. Update copy trade logging
4. Update follower login
5. Test each change individually

### Medium Term (This Month)
1. Complete all critical route updates
2. Add unit and integration tests
3. Performance optimization
4. Production deployment

### Long Term (Ongoing)
1. Monitor database performance
2. Optimize slow queries
3. Archive old data
4. Regular backups

---

## Resources

- [DATABASE.md](DATABASE.md) - Quick start guide
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Detailed setup
- [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) - Code integration
- [database/schema.sql](database/schema.sql) - Schema reference
- [src/lib/database.ts](src/lib/database.ts) - API reference

