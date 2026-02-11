# Copy Trading with Alice Blue API Integration

## Overview

This document explains how the copy trading system integrates with Alice Blue's order placement API to enable masters to copy trades to their followers' accounts.

## System Architecture

```
Master Account (Your Trading Account)
           ↓
    [Master executes trade]
           ↓
    Copy Trade API Endpoint
           ↓
    [Fetch active followers]
           ↓
    [For each follower:]
    - Calculate adjusted quantity (qty × lot_multiplier)
    - Apply max order quantity cap
    - Send order to Alice Blue API
           ↓
    [Alice Blue processes order]
           ↓
    [Order executed on follower's account]
```

## Setup Instructions

### 1. Database Requirements

The system requires the following tables:

**followers** table:
```sql
CREATE TABLE followers (
  id VARCHAR(36) PRIMARY KEY,
  master_id VARCHAR(36),
  follower_name VARCHAR(255),
  status ENUM('active', 'inactive', 'paused'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**follower_credentials** table:
```sql
CREATE TABLE follower_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  lot_multiplier DECIMAL(10, 2) DEFAULT 1.0,
  max_order_quantity INT DEFAULT 1000,
  copy_trading_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES followers(id)
);
```

**copy_trades** table (for logging):
```sql
CREATE TABLE copy_trades (
  id VARCHAR(36) PRIMARY KEY,
  master_id VARCHAR(36),
  follower_id VARCHAR(36),
  symbol VARCHAR(50),
  side VARCHAR(10),
  master_qty INT,
  follower_qty INT,
  price DECIMAL(15, 2),
  status ENUM('SUCCESS', 'FAILED', 'SKIPPED'),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Environment Configuration

Add the following to your `.env.local`:

```dotenv
# Alice Blue Base URLs
ALICE_BASE_URL=https://ant.aliceblueonline.com
ALICE_API_BASE_URL=https://ant.aliceblueonline.com/open-api
ALICE_ORDER_ENDPOINT=https://ant.aliceblueonline.com/open-api/od/v1/orders/placeorder

# Alice Blue Authentication Method
ALICE_AUTH_METHOD=headers

# Master Account ID (your trading account)
ALICE_MASTER_ACCOUNT=master_account
```

## Adding Followers

### Frontend Form

Followers are added through the Configuration page (`/configuration`):

**Required Fields:**
- Account Name: Human-readable name (e.g., "Follower Account #1")
- Client ID: Alice Blue Client ID for the follower account
- API Key: Alice Blue API Key for the follower account
- Lot Multiplier: Quantity multiplier (1.0 = same qty, 0.5 = half qty, 2.0 = double qty)
- Max Order Quantity: Maximum quantity to execute per order

**API Endpoint:** `POST /api/followers/credentials`

### Example Request:

```typescript
POST /api/followers/credentials

{
  "accountId": "follower_001",
  "accountName": "Subhash Kumar",
  "clientId": "your_client_id_123",
  "apiKey": "your_api_key_456",
  "lotMultiplier": 1.0,
  "maxOrderQuantity": 500,
  "consentGiven": true
}
```

### Example Response:

```json
{
  "ok": true,
  "message": "Follower credentials saved successfully",
  "followerId": "follower_001"
}
```

## Executing Copy Trades

### Frontend Dialog

Masters use the Copy Trade Execution Dialog in the dashboard to execute trades:

1. Enter trade details:
   - Symbol (e.g., "SBIN-EQ")
   - Side (BUY or SELL)
   - Quantity
   - Price

2. Select followers to trade with

3. Click "Execute Copy Trade"

### API Endpoint

**POST** `/api/followers/execute-copy-trade`

### Request Body:

```typescript
{
  "masterId": "master_account",              // Master account ID
  "listenerFollowers": ["follower_001"],    // Array of follower IDs
  "symbol": "SBIN-EQ",                      // Trading symbol
  "side": "BUY",                            // BUY or SELL
  "masterQty": 100,                         // Master account quantity
  "price": 750.50,                          // Trade price
  "productType": "MIS",                     // MIS or CNC
  "orderType": "REGULAR"                    // REGULAR or MARKET
}
```

### Response:

```json
{
  "ok": true,
  "tradeId": "trade_1234567890_abc123",
  "message": "Copy trade executed: 2 successful, 0 failed",
  "results": [
    {
      "followerId": "follower_001",
      "followerName": "Subhash Kumar",
      "status": "SUCCESS",
      "followerQty": 100,
      "orderId": "order_alice_123"
    }
  ],
  "summary": {
    "successCount": 1,
    "failedCount": 0,
    "totalFollowers": 1
  }
}
```

## Quantity Calculation

The system applies risk management through quantity adjustment:

```typescript
// Formula for each follower:
adjustedQty = Math.floor(masterQty × lotMultiplier)

// Then apply maximum cap:
finalQty = Math.min(adjustedQty, maxOrderQuantity)

// Skip if final quantity is 0
if (finalQty === 0) {
  status = "SKIPPED"
  reason = "Quantity too small after multiplier"
}
```

### Examples:

**Master executes 100 shares of SBIN**

| Follower | Lot Multiplier | Max Qty | Result | Reason |
|----------|----------------|---------|--------|--------|
| Follower A | 1.0 | 1000 | 100 | Full quantity |
| Follower B | 0.5 | 500 | 50 | Half quantity |
| Follower C | 2.0 | 100 | 100 | Capped by max |
| Follower D | 0.25 | 500 | 25 | Quarter quantity |
| Follower E | 0.01 | 1000 | 1 | Near-minimum |

## Alice Blue API Integration

### Order Placement Endpoint

**Endpoint:** `POST https://ant.aliceblueonline.com/open-api/od/v1/orders/placeorder`

### Request Format:

```json
{
  "symbol": "SBIN-EQ",
  "transactionType": "BUY",
  "quantity": 100,
  "orderType": "MARKET",
  "price": 750.50,
  "productType": "MIS",
  "clientOrderId": "ORDER_1234567890"
}
```

### Authentication Headers:

The system implements HMAC-SHA256 signing for Alice Blue API requests:

```typescript
Headers: {
  "x-api-key": "follower_api_key",
  "x-timestamp": "1234567890",
  "x-signature": "HMAC-SHA256(clientId:timestamp)"
}
```

### Response Handling:

```typescript
// Success Response
{
  "ok": true,
  "orderID": "order_123456",
  "status": "PENDING"
}

// Error Response
{
  "status": "error",
  "message": "Invalid symbol"
}
```

## Configuration Management

### Update Follower Settings

**Endpoint:** `PATCH /api/followers/update-config/{followerId}`

```typescript
{
  "lotMultiplier": 0.75,      // Update ratio
  "maxOrderQuantity": 200      // Update max
}
```

### Disable/Enable Copy Trading

Update followers status through the dashboard UI or:

```typescript
// Via database
UPDATE followers SET status = 'paused' WHERE id = 'follower_001';
UPDATE follower_credentials SET copy_trading_enabled = false WHERE follower_id = 'follower_001';
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required trade fields" | Symbol, side, qty, or price not provided | Verify all fields are filled |
| "No active followers found" | No enabled followers in database | Add followers and enable copy trading |
| "API Key and Client ID required" | Credentials not stored for follower | Re-add follower with correct credentials |
| "Order placement failed" | Alice Blue API rejected order | Check symbol format, verify account has funds |
| "Quantity too small after multiplier" | Result qty rounds to 0 | Increase lot multiplier or master qty |

### Logging

All copy trade executions are logged to the `copy_trades` table for audit trails:

```sql
SELECT * FROM copy_trades 
WHERE master_id = 'master_account' 
  AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC;
```

## Testing Copy Trades

### 1. Add Test Follower

Use the Configuration page to add a follower with:
- Test Alice Blue account credentials
- Lot Multiplier: 1.0 (full quantity)
- Max Order Quantity: 1000

### 2. Execute Small Trade

Send a copy trade request with:
- Symbol: Valid NSE stock (SBIN-EQ, INFY-EQ, etc.)
- Side: BUY
- Qty: 1 (minimum for testing)
- Price: Current market price

### 3. Verify Results

Check:
- Response shows SUCCESS status
- Order ID is returned
- Check copy_trades table for log entry
- Verify order appears in follower's account

## Security Considerations

### Credential Storage

- Store API Keys and Client IDs in database
- Do NOT log credentials to console
- Consider encryption for production
- Use environment-specific credentials

### Request Signing

- HMAC-SHA256 ensures request authenticity
- Timestamps prevent replay attacks
- Client ID must match the account being traded

### Rate Limiting

Alice Blue API may have rate limits:
- Monitor response status codes
- Implement backoff for 429 responses
- Consider request queuing for multiple followers

## Performance Notes

- Execute trades serially per follower (not parallel) for safety
- Each follower trade takes ~1-2 seconds
- Database queries are indexed on follower_id
- Logging is asynchronous and non-blocking

## Troubleshooting

### Trades Not Executing

1. Verify follower is active: `SELECT status FROM followers WHERE id = ?`
2. Check credentials: `SELECT client_id, api_key FROM follower_credentials WHERE follower_id = ?`
3. Verify copy_trading_enabled: `SELECT copy_trading_enabled FROM follower_credentials WHERE follower_id = ?`
4. Check logs: `SELECT * FROM copy_trades WHERE follower_id = ? ORDER BY created_at DESC`

### HMAC Signature Errors

1. Verify API Key matches in follower_credentials
2. Verify Client ID matches Alice Blue account
3. Ensure timestamp is recent (within 5 minutes of server)
4. Check ALICE_AUTH_METHOD is set to "headers"

### Order Rejected by Alice Blue

1. Verify symbol format (should be like "SBIN-EQ")
2. Check account has sufficient funds
3. Verify tradeable qty is not 0
4. Check if symbol is suspended

## APIs Reference

### Core Endpoints

```
POST   /api/followers/credentials                    - Add follower
PATCH  /api/followers/update-config/{followerId}    - Update follower config
POST   /api/followers/execute-copy-trade             - Execute copy trade
GET    /api/followers/list                           - List all followers
DELETE /api/followers/{followerId}                   - Remove follower
```

### Database Tables

```
followers                    - Master follower records
follower_credentials        - Stored Alice Blue credentials
copy_trades                 - Execution history and logs
```

## Summary

The copy trading system provides a secure, scalable way for masters to execute trades across multiple follower accounts using Alice Blue's API. By using Client ID + API Key authentication, the system avoids complex OAuth flows while maintaining security through HMAC signing.

Key features:
- ✅ Simple credential storage (Client ID + API Key)
- ✅ Risk management via lot multiplier and max quantity caps
- ✅ Per-trade status tracking
- ✅ Comprehensive logging for audit trails
- ✅ Alice Blue API integration with HMAC signatures
- ✅ Error handling and fallback mechanisms
