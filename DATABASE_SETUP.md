# Database Setup Guide

## Overview

This guide will help you set up the MySQL database for the Quantum Alpha India copy-trading system on CloudPanel.

## Prerequisites

- ✅ CloudPanel MySQL access configured
- ✅ `.env.local` file created with database credentials
- ✅ Database `quantumalphaindiadb` exists

## Database Information

```
Host: 127.0.0.1
Port: 3306
Database: quantumalphaindiadb
User: quantumalphaindiadb
Password: quantumalphaindia@2026
```

## Setup Methods

### Method 1: Using MySQL Client (Recommended)

#### Step 1: Connect to MySQL

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p
# When prompted, enter: quantumalphaindia@2026
```

#### Step 2: Select the Database

```sql
USE quantumalphaindiadb;
```

#### Step 3: Import the Schema

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb < database/schema.sql
# When prompted, enter: quantumalphaindia@2026
```

---

### Method 2: Using Node.js Connection

#### Step 1: Install MySQL Package (if not installed)

```bash
npm install mysql2
```

#### Step 2: Run the Migration Script

```bash
node scripts/migrate-db.js
```

---

### Method 3: Using Prisma (Alternative)

If you want to use Prisma ORM (optional, for modern development):

#### Step 1: Install Prisma

```bash
npm install @prisma/client prisma
```

#### Step 2: Initialize Prisma

```bash
npx prisma init
```

#### Step 3: Update `.env.local`

Ensure `DATABASE_URL` matches:
```
DATABASE_URL="mysql://quantumalphaindiadb:quantumalphaindia@2026@127.0.0.1:3306/quantumalphaindiadb"
```

#### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

---

## Schema Structure

### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Master/Follower accounts | Base table for all users |
| `followers` | Follower accounts linked to masters | Belongs to `users` (master_id) |
| `follower_credentials` | API keys & login credentials | Belongs to `followers` |
| `oauth_tokens` | OAuth access tokens | Belongs to `users` |
| `risk_config` | Risk settings per follower | Belongs to `followers` |
| `copy_trades` | Copy trade log entries | References `users` and `followers` |
| `master_trades` | Master account trades | Belongs to `users` |
| `trade_events` | Real-time trade event tracking | Linked to `copy_trades` |
| `audit_logs` | System activity logging | References `users` |
| `sessions` | User sessions | Belongs to `users` |
| `notifications` | User notifications | Belongs to `users` |
| `performance_metrics` | Daily performance statistics | Belongs to `followers` |
| `system_settings` | Global system configuration | N/A |

### Database Views

1. **`v_active_followers`** - List of active followers with statistics
2. **`v_daily_trading_summary`** - Daily trading metrics by master
3. **`v_follower_performance`** - Follower performance KPIs

---

## Verification After Setup

### Step 1: Verify Tables Created

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb -e "SHOW TABLES;"
```

Expected output (13 tables):
```
audit_logs
copy_trades
followers
follower_credentials
master_trades
notifications
oauth_config
oauth_tokens
performance_metrics
risk_config
sessions
system_settings
trade_events
users
```

### Step 2: Check Table Structure

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb -e "DESCRIBE users;"
```

### Step 3: Verify Views

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb -e "SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';"
```

### Step 4: Test Sample Query

```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb -e "SELECT * FROM system_settings LIMIT 5;"
```

---

## Database Connections in Application Code

### Using Node.js (mysql2)

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### Using Next.js API Route

```typescript
// src/app/api/db.ts
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const connection = await pool.getConnection();
  try {
    const results = await connection.query('SELECT * FROM users');
    return Response.json(results);
  } finally {
    connection.release();
  }
}
```

---

## Initial Data Setup

### Step 1: Create Master Account (Optional)

```sql
INSERT INTO users (id, username, email, password_hash, role, auth_method)
VALUES ('master-1', 'admin', 'admin@quantumalphaindia.com', 'hash_here', 'master', 'oauth');
```

### Step 2: Create System Settings (Already included in schema)

The schema.sql file automatically inserts default system settings.

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

## Troubleshooting

### Issue: "Access denied for user"

**Solution:** Verify credentials in `.env.local`:
```bash
cat .env.local | grep DB_
```

### Issue: "Unknown database"

**Solution:** Create database first:
```sql
CREATE DATABASE IF NOT EXISTS quantumalphaindiadb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Issue: "Tables already exist"

**Solution:** The schema.sql includes `IF NOT EXISTS` clauses, so re-running is safe. To reset:
```bash
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb -e "DROP DATABASE quantumalphaindiadb; CREATE DATABASE quantumalphaindiadb;"
mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb < database/schema.sql
```

### Issue: Connection timeout

**Solution:** Verify CloudPanel MySQL service is running:
```bash
netstat -tuln | grep 3306
```

---

## Next Steps

1. ✅ Review schema.sql structure
2. ✅ Run: `mysql -h 127.0.0.1 -u quantumalphaindiadb -p quantumalphaindiadb < database/schema.sql`
3. ✅ Verify all tables with: `SHOW TABLES;`
4. Update API routes to use database instead of file storage
5. Update `.env.local` with database connection settings
6. Test database connectivity from Node.js
7. Deploy to production

---

## Database Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Master Account (User)                 │
├─────────────────────────────────────────────────────────┤
│ • OAuth Token (oauth_tokens)                            │
│ • Session (sessions)                                    │
│ • Audit Log (audit_logs)                                │
│ • Master Trades (master_trades)                         │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌──────────┐         ┌──────────┐
   │Follower 1│         │Follower 2│
   └────┬─────┘         └────┬─────┘
        │ Copy Trades        │ Copy Trades
        ▼                    ▼
  ┌──────────────┐    ┌──────────────┐
  │copy_trades   │    │copy_trades   │
  │trade_events  │    │trade_events  │
  │risk_config   │    │risk_config   │
  └──────────────┘    └──────────────┘
```

---

## Support

For issues or questions, check:
- `.env.local` configuration
- Database credentials
- CloudPanel MySQL service status
- MySQL error logs in `/var/log/mysql/`

