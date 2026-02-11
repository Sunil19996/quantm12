# Database Configuration & Setup

## Quick Start (5 Minutes)

```bash
# 1. Install MySQL package
npm install mysql2

# 2. Run database migrations
npm run db:migrate

# 3. Test database connection
npm run db:test

# 4. Done! ✅
```

---

## File Overview

### Database Files Created

| File | Purpose |
|------|---------|
| [database/schema.sql](database/schema.sql) | Complete MySQL schema with 13 tables + 3 views |
| [src/lib/database.ts](src/lib/database.ts) | TypeScript utilities for database operations |
| [scripts/migrate-db.js](scripts/migrate-db.js) | Automated migration runner |
| [scripts/test-database.js](scripts/test-database.js) | Connection testing & diagnostics |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Detailed setup instructions |
| [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) | Code integration guide |
| [.env.local](.env.local) | Database credentials (already created) |

---

## Database Details

### Connection Information

```
Host:     127.0.0.1
Port:     3306
Database: quantumalphaindiadb
User:     quantumalphaindiadb
Password: quantumalphaindia@2026
```

### Database Tables

**Core Tables:**
1. `users` - Master/Follower accounts
2. `followers` - Follower profiles linked to master
3. `follower_credentials` - API keys & login credentials
4. `oauth_tokens` - OAuth access tokens
5. `oauth_config` - OAuth configuration
6. `copy_trades` - Copy trade log entries
7. `master_trades` - Master account trades
8. `risk_config` - Risk settings per follower
9. `trade_events` - Real-time trade event tracking
10. `audit_logs` - System activity logging
11. `sessions` - User sessions
12. `notifications` - User notifications
13. `performance_metrics` - Daily performance statistics
14. `system_settings` - Global system configuration

**Views:**
1. `v_active_followers` - Active followers with statistics
2. `v_daily_trading_summary` - Daily trading metrics
3. `v_follower_performance` - Performance KPIs

---

## Setup Steps

### Step 1: Verify Prerequisites

```bash
# Check Node.js version
node --version

# Check MySQL connectivity
mysql -h 127.0.0.1 -u quantumalphaindiadb -p
# Enter password: quantumalphaindia@2026
# Type: SHOW DATABASES;
# Exit with: EXIT;
```

### Step 2: Install Package

```bash
npm install mysql2
```

### Step 3: Run Migration

```bash
npm run db:migrate
```

**Expected Output:**
```
🔄 Connecting to database...
✅ Connected to database

📖 Reading schema file...
✅ Found 47 SQL statements

🚀 Executing SQL statements...
✅ Migration completed successfully!
```

### Step 4: Verify Installation

```bash
npm run db:test
```

**Expected Output:**
```
✅ Connection successful!
✅ MySQL Version: 8.0.x
✅ Tables found: 14
✅ Views found: 3
✅ All tests passed!
```

---

## Usage in Code

### Import Database Functions

```typescript
import {
  query,
  queryOne,
  insert,
  update,
  deleteRecord,
  find,
  findById,
  transaction,
  saveOAuthToken,
  getOAuthToken,
  saveFollowerCredentials,
  getFollowerByUsername,
  logCopyTrade,
  getFollowerCopyTrades
} from '@/lib/database';
```

### Common Operations

#### Save OAuth Token

```typescript
await saveOAuthToken('user-123', {
  access_token: 'token_value',
  refresh_token: 'refresh_value',
  expires_at: '2025-02-20T10:30:00Z',
  scope: 'trades'
});
```

#### Get OAuth Token

```typescript
const token = await getOAuthToken('user-123');
console.log(token.access_token);
```

#### Register Follower

```typescript
await insert('followers', {
  id: 'follower-1',
  master_id: 'master-1',
  follower_name: 'John Trader',
  status: 'active'
});

await insert('follower_credentials', {
  follower_id: 'follower-1',
  login_username: 'john_trader_123',
  login_password_hash: 'hashed_password',
  api_key: 'api_key_value',
  api_secret: 'api_secret_value',
  client_id: 'client_id_value',
  lot_multiplier: 1.5
});
```

#### Log Copy Trade

```typescript
await logCopyTrade({
  id: 'trade-123',
  master_id: 'master-1',
  follower_id: 'follower-1',
  symbol: 'INFY',
  side: 'BUY',
  master_qty: 10,
  follower_qty: 15,
  price: 1500.50,
  status: 'PENDING'
});
```

#### Update Trade Status

```typescript
await updateCopyTradeStatus('trade-123', 'SUCCESS');
```

#### Get Follower Trades

```typescript
const trades = await getFollowerCopyTrades('follower-1', 50);
trades.forEach(trade => {
  console.log(`${trade.symbol}: ${trade.status}`);
});
```

#### Run Transaction

```typescript
await transaction(async (connection) => {
  // Multiple operations within transaction
  await connection.query('INSERT INTO users VALUES (...)', []);
  await connection.query('UPDATE followers SET status = ?', ['active']);
  // Auto-commit on success, auto-rollback on error
});
```

---

## Migration from File-Based Storage

### Current Storage (Being Replaced)

```
.alice.tokens.json               → oauth_tokens table
.alice.follower-credentials.json → follower_credentials + users tables
.alice.copy-trades.json          → copy_trades table
```

### Migration Path

1. **Phase 1: Setup** (Current)
   - ✅ Create schema
   - ✅ Create database utilities
   - ✅ Create migration scripts

2. **Phase 2: Run Setup**
   - Run `npm run db:migrate`
   - Run `npm run db:test`

3. **Phase 3: Update Code**
   - Update API routes to use database functions
   - Update OAuth token storage
   - Update follower registration
   - Update copy trade logging
   - See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md)

---

## API Routes to Update

### High Priority (Critical for functionality)

| Route | Current Storage | Update To | Priority |
|-------|-----------------|-----------|----------|
| `/api/alice/oauth-connect` | `.alice.tokens.json` | `saveOAuthToken()` | 🔴 HIGH |
| `/api/followers/register-api-key` | `.alice.follower-credentials.json` | Database insert | 🔴 HIGH |
| `/api/followers/copy-trades-log` | `.alice.copy-trades.json` | `logCopyTrade()` | 🔴 HIGH |
| `/api/followers/copy-trades` | `.alice.copy-trades.json` | `getFollowerCopyTrades()` | 🔴 HIGH |

### Medium Priority (Performance enhancement)

| Route | Benefit | Priority |
|-------|---------|----------|
| `/api/alice/trades` | Indexed token lookup | 🟡 MEDIUM |
| Audit logging endpoints | Complete audit trail | 🟡 MEDIUM |
| Performance metrics | Dashboard metrics | 🟡 MEDIUM |

---

## Environment Configuration

### .env.local File (Already Exists)

```
DATABASE_URL=mysql://quantumalphaindiadb:quantumalphaindia@2026@127.0.0.1:3306/quantumalphaindiadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=quantumalphaindiadb
DB_PASSWORD=quantumalphaindia@2026
DB_NAME=quantumalphaindiadb
```

### Connection Pool Settings

In [src/lib/database.ts](src/lib/database.ts):
```typescript
// Default settings
connectionLimit: 10        // Max concurrent connections
queueLimit: 0             // Unlimited queue
enableKeepAlive: true     // Maintain connections
```

---

## Performance Considerations

### Connection Pooling
- Reuses connections for efficiency
- Automatically manages connection lifecycle
- Keep `connectionLimit` at 10 for most use cases

### Indexes (Automatically Created)
```sql
-- Follower queries
INDEX idx_followers_master_status ON followers(master_id, status)

-- Copy trade queries
INDEX idx_copy_trades_follower_status ON copy_trades(follower_id, status)
INDEX idx_copy_trades_date_range ON copy_trades(created_at DESC)

-- OAuth token lookup
INDEX idx_oauth_tokens ON oauth_tokens(user_id, account_id, provider)

-- Audit trail
INDEX idx_audit_logs_timestamp ON audit_logs(created_at DESC)
```

### Query Optimization Tips

1. **Use indexed columns in WHERE clauses**
   ```typescript
   // ✅ Good - uses index
   const trades = await query(
     'SELECT * FROM copy_trades WHERE follower_id = ? ORDER BY created_at DESC',
     [followerId]
   );

   // ❌ Bad - full table scan
   const trades = await query('SELECT * FROM copy_trades');
   ```

2. **Use LIMIT for large result sets**
   ```typescript
   // ✅ Efficient
   const trades = await query(
     'SELECT * FROM copy_trades LIMIT 50'
   );
   ```

3. **Use JOINs instead of multiple queries**
   ```typescript
   // ✅ Better performance
   const results = await query(
     `SELECT f.*, fc.*, COUNT(ct.id) as trade_count
      FROM followers f
      LEFT JOIN follower_credentials fc ON f.id = fc.follower_id
      LEFT JOIN copy_trades ct ON f.id = ct.follower_id
      GROUP BY f.id`
   );
   ```

---

## Troubleshooting

### Connection Errors

```bash
# Test connection
npm run db:test

# Check CloudPanel MySQL status
# 1. CloudPanel Dashboard → Databases
# 2. Verify database exists
# 3. Verify user permissions
```

### Migration Errors

```bash
# Re-run with verbose output
DEBUG=* npm run db:migrate

# Reset database
mysql -h 127.0.0.1 -u quantumalphaindiadb -p
DROP DATABASE quantumalphaindiadb;
CREATE DATABASE quantumalphaindiadb;
npm run db:migrate
```

### Performance Issues

```sql
-- Check query execution time
EXPLAIN SELECT * FROM copy_trades WHERE follower_id = ? \G

-- Check table statistics
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'quantumalphaindiadb';

-- Monitor connections
SHOW PROCESSLIST;
```

---

## Backup & Restore

### Create Backup

```bash
mysqldump -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb < backup_YYYYMMDD_HHMMSS.sql
```

---

## Monitoring & Maintenance

### Monitor Database Usage

```typescript
// Check connection pool status
import { pool } from '@/lib/database';

const connections = pool._connectionPool.length;
const queue = pool._connectionQueue.length;
console.log(`Active: ${connections}, Queued: ${queue}`);
```

### Regular Maintenance

Schedule these monthly:

1. **Optimize Tables**
   ```sql
   OPTIMIZE TABLE copy_trades;
   OPTIMIZE TABLE audit_logs;
   OPTIMIZE TABLE oauth_tokens;
   ```

2. **Analyze Query Performance**
   ```sql
   ANALYZE TABLE copy_trades;
   ANALYZE TABLE followers;
   ```

3. **Check for Errors**
   ```bash
   tail -50 /var/log/mysql/error.log
   ```

---

## Next Steps

1. ✅ Review this README
2. ✅ Run `npm install mysql2` (if not done)
3. ✅ Run `npm run db:migrate`
4. ✅ Run `npm run db:test`
5. 📖 Read [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md)
6. 🔄 Update API routes to use database functions
7. ✅ Test all functionality
8. 🚀 Deploy to production

---

## Support Resources

- **Setup Issues**: See [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Code Integration**: See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md)
- **Schema Details**: See [database/schema.sql](database/schema.sql)
- **API Utilities**: See [src/lib/database.ts](src/lib/database.ts)

---

## Key Infrastructure Files

```
Database/
├── database/
│   ├── schema.sql                    # Complete schema
│   └── migration_missing_tables.sql  # Legacy migrations
├── src/
│   └── lib/
│       └── database.ts               # Database utilities
├── scripts/
│   ├── migrate-db.js                 # Migration runner
│   ├── test-database.js              # Connection test
│   └── fetch_tokens.py               # Token fetching
├── .env.local                        # Database credentials
├── DATABASE_SETUP.md                 # Setup guide
├── DATABASE_MIGRATION_GUIDE.md       # Integration guide
└── DATABASE.md                       # This file
```

---

## Questions?

1. Check the relevant markdown file (setup, migration, or schema)
2. Review the database utility functions in `src/lib/database.ts`
3. Check CloudPanel documentation for database management
4. Review MySQL error logs in `/var/log/mysql/error.log`

