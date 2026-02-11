# Copy-Trading System Implementation Guide

## Overview

This document describes the complete copy-trading system implementation, including:
- **Master Account**: Connects via OAuth to AliceBlue, places trades
- **Follower Accounts**: Register with API credentials, receive copy-traded orders
- **Live Dashboard**: Followers see their copy-traded orders in real-time

## Architecture

### Components

#### 1. **Master Side**
- **OAuth Connection**: Master connects their AliceBlue account via OAuth
- **Trade Placement**: Master places trades on their AliceBlue account
- **Manual Testing**: Master can manually trigger test copy trades via UI

#### 2. **Follower Side**
- **API Key Registration**: Master registers followers with their API credentials
- **Auto-Generated Credentials**: System generates unique username/password for follower
- **Copy Trade Reception**: Followers receive copy-traded orders automatically
- **Live Dashboard**: Shows all copy-traded orders with status updates

#### 3. **Backend System**
- **Credential Storage**: `.alice.follower-credentials.json` - stores all follower credentials
- **Copy Trade Log**: `.alice.copy-trades.json` - logs all copy trades with status
- **Trade Replication**: Automatic calculation of follower quantities based on multiplier

## API Endpoints

### Follower Management

#### **POST /api/followers/register-api-key**
Register a new follower with API credentials.

**Request:**
```json
{
  "followerName": "John Doe",
  "apiKey": "api_key_...",
  "apiSecret": "api_secret_...",
  "clientId": "client_id_...",
  "lotMultiplier": 1.0,
  "maxQuantity": 1000,
  "maxOrderValue": 500000,
  "maxDailyLoss": 50000,
  "allowedInstruments": [],
  "allowedProductTypes": ["MIS", "CNC"]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Follower registered successfully",
  "follower": {
    "followerId": "follower_abc123...",
    "followerName": "John Doe",
    "loginUsername": "john_doe_def456",
    "loginPassword": "random_16_byte_hex_string",
    "createdAt": "2024-..."
  },
  "credentials": {
    "apiKey": "api_key_...****",
    "clientId": "cli_id_...****"
  },
  "riskConfig": {
    "lotMultiplier": 1.0,
    "maxQuantity": 1000,
    "maxOrderValue": 500000,
    "maxDailyLoss": 50000,
    "allowedInstruments": [],
    "allowedProductTypes": ["MIS", "CNC"]
  }
}
```

#### **GET /api/followers/list**
Get list of all registered followers (for master dashboard).

**Response:**
```json
{
  "ok": true,
  "followers": [
    {
      "id": "follower_abc123...",
      "username": "john_doe_def456",
      "createdAt": "2024-...",
      "lotMultiplier": 1.0,
      "maxQuantity": 1000,
      "maxDailyLoss": 50000
    }
  ],
  "total": 1
}
```

### Copy Trade Management

#### **POST /api/followers/copy-trades-log**
Log a copy trade when master places a trade.

**Request:**
```json
{
  "masterId": "master_account",
  "followerId": "follower_abc123...",
  "symbol": "RELIANCE",
  "side": "BUY",
  "masterQty": 100,
  "followerQty": 100,
  "price": 2850.50,
  "status": "PENDING",
  "reason": "Optional reason for failure"
}
```

**Response:**
```json
{
  "ok": true,
  "trade": {
    "id": "trade_abc123def456",
    "masterId": "master_account",
    "followerId": "follower_abc123...",
    "symbol": "RELIANCE",
    "side": "BUY",
    "masterQty": 100,
    "followerQty": 100,
    "price": 2850.50,
    "status": "PENDING",
    "timestamp": "2024-..."
  }
}
```

#### **GET /api/followers/copy-trades?followerId=FOLLOWER_ID**
Fetch all copy trades for a specific follower.

**Response:**
```json
{
  "ok": true,
  "trades": [
    {
      "id": "trade_abc123def456",
      "masterId": "master_account",
      "followerId": "follower_abc123...",
      "symbol": "RELIANCE",
      "side": "BUY",
      "masterQty": 100,
      "followerQty": 100,
      "price": 2850.50,
      "status": "SUCCESS",
      "timestamp": "2024-..."
    }
  ],
  "total": 1
}
```

#### **PATCH /api/followers/copy-trades-log**
Update copy trade status (e.g., PENDING → SUCCESS).

**Request:**
```json
{
  "tradeId": "trade_abc123def456",
  "status": "SUCCESS",
  "reason": "Optional reason for failure"
}
```

## Frontend Components

### Master Components

#### **ManualCopyTradeDialog**
- Location: `src/app/(main)/components/manual-copy-trade-dialog.tsx`
- Purpose: Master can manually trigger test copy trades
- Features:
  - Symbol, Side, Quantity, Price inputs
  - Creates copy trades for ALL registered followers
  - Shows success count
  - Uses follower's lot multiplier

#### **FollowerApiKeyRegistration**
- Location: `src/app/(main)/components/follower-api-key-registration.tsx`
- Purpose: Master registers new followers
- Features:
  - Form for follower API credentials
  - Risk limit configuration
  - One-time credential display
  - Copy-to-clipboard buttons

### Follower Components

#### **FollowerCopyTradesBoard**
- Location: `src/app/(main)/components/follower-copy-trades-board.tsx`
- Purpose: Show follower their copy-traded orders
- Features:
  - Real-time copy trade table
  - Trade statistics (Total, Successful, Pending, Failed)
  - 5-second polling for updates
  - Status badges (SUCCESS, PENDING, FAILED, CANCELLED)
  - Trade details with timestamps

## Utility Functions

### Copy Trading Engine (`src/lib/copy-trading-engine.ts`)

#### **calculateFollowerQuantity(masterQty, lotMultiplier, maxQuantity)**
Calculate follower quantity based on lot multiplier and constraints.

```typescript
const followerQty = calculateFollowerQuantity(100, 1.5, 150);
// Result: 150 (100 * 1.5 = 150, but capped at maxQuantity)
```

#### **logCopyTrade(config)**
Log a copy trade to the system.

```typescript
await logCopyTrade({
  masterId: 'master_account',
  followerId: 'follower_abc123...',
  symbol: 'RELIANCE',
  side: 'BUY',
  masterQty: 100,
  followerQty: 100,
  price: 2850.50,
  status: 'PENDING',
});
```

#### **replicateTradeToFollowers(config)**
Replicate a trade to all followers.

```typescript
await replicateTradeToFollowers({
  masterId: 'master_account',
  followers: [
    {
      id: 'follower_abc123...',
      name: 'John',
      apiKey: 'api_key_...',
      clientId: 'client_id_...',
      lotMultiplier: 1.0,
    }
  ],
  symbol: 'RELIANCE',
  side: 'BUY',
  masterQty: 100,
  price: 2850.50,
});
```

## Data Storage

### `.alice.follower-credentials.json`
Stores all follower credentials (one-time storage).

```json
[
  {
    "followerId": "follower_abc123...",
    "loginUsername": "john_doe_def456",
    "loginPassword": "hex_string_here",
    "createdAt": "2024-...",
    "apiKey": "api_key_...",
    "apiSecret": "api_secret_...",
    "clientId": "client_id_...",
    "lotMultiplier": 1.0,
    "maxQuantity": 1000,
    "maxOrderValue": 500000,
    "maxDailyLoss": 50000,
    "allowedInstruments": [],
    "allowedProductTypes": ["MIS", "CNC"]
  }
]
```

### `.alice.copy-trades.json`
Logs all copy trades for audit trail.

```json
[
  {
    "id": "trade_abc123def456",
    "masterId": "master_account",
    "followerId": "follower_abc123...",
    "symbol": "RELIANCE",
    "side": "BUY",
    "masterQty": 100,
    "followerQty": 100,
    "price": 2850.50,
    "status": "SUCCESS",
    "timestamp": "2024-...",
    "reason": null
  }
]
```

## User Flow

### Master Flow

1. **Connect OAuth Account**
   - Master clicks "Connect" on Connections page
   - Browser redirects to AliceBlue OAuth login
   - System stores OAuth token

2. **Register Followers**
   - Master goes to Connections page
   - Clicks "Add Followers" button
   - Fills form with follower's API credentials and risk limits
   - System generates username/password
   - Master shares credentials with follower

3. **Place Trades**
   - Master places trade on their AliceBlue account
   - (FUTURE) System automatically creates copy trades for all followers
   - Or master can manually trigger test trades via dashboard

### Follower Flow

1. **Receive Credentials**
   - Master provides: username, password, website URL

2. **Login to Dashboard**
   - Follower logs in with provided credentials
   - (FUTURE) Dashboard shows their trading account

3. **Monitor Copy Trades**
   - Dashboard shows "Copy Trading" section
   - Real-time updates of copy-traded orders
   - Can see trade status (SUCCESS, PENDING, FAILED)

## Testing

### Manual Copy Trade Testing

1. Go to Master Dashboard
2. Scroll to "Manual Copy Trade (Testing)" section
3. Click "Test Copy Trade"
4. Fill form:
   - Symbol: RELIANCE
   - Side: BUY
   - Master Quantity: 100
   - Price: 2850.50
5. Click "Create Copy Trade"
6. Check follower dashboard → should see new trades

### Checking Follower Dashboard

1. Login as follower
2. Go to Dashboard
3. Should see "Copy Trading Dashboard" section
4. Table shows all copy-traded orders
5. Stats show Total, Successful, Pending, Failed counts

## Future Enhancements

1. **Automatic Trade Replication**: When master places trade, automatically replicate to followers
2. **Real-time Updates**: Use WebSocket/SSE instead of polling
3. **Risk Enforcement**: Check risk limits before placing copy trades
4. **Order Amendments**: Handle order modifications/cancellations
5. **Performance Analytics**: Show P&L for each follower
6. **Audit Logging**: Detailed timestamps and reasons for all actions
7. **Notifications**: Alert followers of copy-traded orders
8. **Rollback**: Cancel all copy trades if master cancels

## Security Considerations

1. **One-Time Credential Display**: Login credentials shown only once, not stored anywhere
2. **API Key Storage**: Encrypted and stored securely per follower
3. **Audit Trail**: All copy trades logged with timestamps
4. **Risk Limits**: Enforced before placing copy trades
5. **Follower Isolation**: Each follower can only see their own copy trades

## Troubleshooting

### Follower Not Receiving Copy Trades
- Check if follower is registered: `GET /api/followers/list`
- Check API credentials are correct
- Check risk limits not exceeded
- Review copy trade log: `.alice.copy-trades.json`

### Copy Trade Failed
- Check follower's API key/secret validity
- Check risk limits (maxQuantity, maxDailyLoss)
- Check instrument is allowed for follower
- Check order value not exceeding maxOrderValue

### Credentials Not Displaying
- Credentials are shown only once after registration
- If lost, master must register follower again
- (FUTURE) Add "Resend Credentials" feature

## References

- OAuth Setup: [ALICE_BLUE_API_ENABLED.md](../docs/ALICE_BLUE_API_ENABLED.md)
- Token Management: [TOKEN_MANAGEMENT_GUIDE.md](../TOKEN_MANAGEMENT_GUIDE.md)
- Replication System: [REPLICATION_SYSTEM_README.md](../docs/REPLICATION_SYSTEM_README.md)
