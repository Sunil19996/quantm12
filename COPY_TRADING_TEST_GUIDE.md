# Copy Trading Testing Guide

## Quick Setup Checklist

- [ ] Database tables created (followers, follower_credentials, copy_trades)
- [ ] Environment variables configured in .env.local
- [ ] Frontend form for adding followers is working
- [ ] Alice Blue credentials obtained for test account

## Step 1: Add Alice Blue Test Follower

### Via UI (Configuration Page)

1. Go to `/configuration`
2. Click "Add New Follower"
3. Fill in the form:
   - **Account Name:** "Test Follower Account"
   - **Client ID:** Your Alice Blue Client ID (from account panel)
   - **API Key:** Your Alice Blue API Key (from account panel)
   - **Lot Multiplier:** 1.0 (one-to-one copying)
   - **Max Order Quantity:** 500 (safety limit)
4. Check "I give consent to copy trade my account"
5. Click "Save Follower"

### Expected Result:
✅ Success message displayed
✅ Follower appears in the followers list

### Verify in Database:
```sql
SELECT * FROM followers WHERE follower_name = 'Test Follower Account';
SELECT * FROM follower_credentials WHERE follower_id = (
  SELECT id FROM followers WHERE follower_name = 'Test Follower Account'
);
```

## Step 2: Execute Sample Copy Trade

### Via UI (Dashboard)

1. Go to `/dashboard` (or main page)
2. Find "Copy Trade Execution" section
3. Enter trade details:
   - **Symbol:** SBIN-EQ (or any active stock)
   - **Side:** BUY
   - **Quantity:** 5 (small amount for testing)
   - **Price:** 750 (or current market price)
4. Select "Test Follower Account" checkbox
5. Click "Execute Copy Trade"

### Expected Result:
✅ Dialog shows execution status
✅ "Test Follower Account" shows SUCCESS
✅ Follower Qty shows 5 (1.0 multiplier × 5)

### Example Response:
```json
{
  "ok": true,
  "tradeId": "trade_1234567890_xyz",
  "results": [
    {
      "followerId": "follower_001",
      "followerName": "Test Follower Account",
      "status": "SUCCESS",
      "followerQty": 5,
      "orderId": "order_alice_123"
    }
  ]
}
```

## Step 3: Verify Trade Execution Logs

### Check Database:
```sql
SELECT * FROM copy_trades 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected columns:
- id: trade ID
- master_id: your master account ID
- follower_id: follower's ID
- symbol: SBIN-EQ
- side: BUY
- master_qty: 5
- follower_qty: 5
- price: 750
- status: SUCCESS
- created_at: timestamp

### Check Logs:
```bash
# Look for copy trade logs
grep "EXECUTE-COPY-TRADE" /path/to/logs

# Look for Alice order logs
grep "ALICE-ORDER" /path/to/logs
```

## Step 4: Test Quantity Calculations

### Test Case 1: Half Quantity (Lot Multiplier = 0.5)

1. Update follower: PATCH `/api/followers/update-config/follower_001`
2. Body:
   ```json
   {
     "lotMultiplier": 0.5,
     "maxOrderQuantity": 500
   }
   ```
3. Execute trade with 100 quantity
4. Expected follower qty: 50 (100 × 0.5)

### Test Case 2: Double Quantity Capped (Lot Multiplier = 2.0, Max = 60)

1. Update follower: PATCH `/api/followers/update-config/follower_001`
2. Body:
   ```json
   {
     "lotMultiplier": 2.0,
     "maxOrderQuantity": 60
   }
   ```
3. Execute trade with 100 quantity
4. Expected follower qty: 60 (capped by max, not 200)

### Test Case 3: Too Small (Lot Multiplier = 0.1, Max = 1000)

1. Update follower: PATCH `/api/followers/update-config/follower_001`
2. Body:
   ```json
   {
     "lotMultiplier": 0.1,
     "maxOrderQuantity": 1000
   }
   ```
3. Execute trade with 3 quantity
4. Expected result: SKIPPED (0.3 rounds down to 0)

## Step 5: Test Multiple Followers

### Add Another Follower:
1. Add "Test Follower #2" via UI with different Alice Blue credentials
2. Configure: Lot Multiplier = 0.75, Max Qty = 300

### Execute to Multiple Followers:
1. Execute trade with both followers selected
2. Expected behavior:
   - Follower #1: 100 qty
   - Follower #2: 75 qty (100 × 0.75)
3. Check results show both successes

## Step 6: Error Testing

### Test 1: Missing Symbol
```bash
curl -X POST http://localhost:3000/api/followers/execute-copy-trade \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "master_account",
    "listenerFollowers": ["follower_001"],
    "side": "BUY",
    "masterQty": 100,
    "price": 750
  }'
```
Expected: **400 Error** - "Missing required trade fields"

### Test 2: Invalid Follower
```bash
curl -X POST http://localhost:3000/api/followers/execute-copy-trade \
  -H "Content-Type: application/json" \
  -d '{
    "masterId": "master_account",
    "followerId": "nonexistent_follower",
    "symbol": "SBIN-EQ",
    "side": "BUY",
    "masterQty": 100,
    "price": 750
  }'
```
Expected: **400 Error** - "No active followers found"

### Test 3: Invalid Symbol (Alice Blue Should Reject)
1. Execute trade with invalid symbol: "INVALID-XYZ"
2. Expected: Status = FAILED with reason from Alice Blue API
3. Check copy_trades table for failed record

## Step 7: End-to-End Integration Tests

### Test Workflow: Master Places Order → Auto-Copies to Followers

1. **Setup:**
   - Add 2 followers with different multipliers
   - Follower A: 1.0x multiplier, max 1000
   - Follower B: 0.5x multiplier, max 200

2. **Execute:**
   - Master buys 400 units of INFY-EQ at 3000

3. **Verify:**
   - Database check:
     ```sql
     SELECT follower_id, master_qty, follower_qty, status 
     FROM copy_trades 
     WHERE symbol = 'INFY-EQ' 
     ORDER BY created_at DESC 
     LIMIT 2;
     ```
   - Expected results:
     - Follower A: 400 units (1.0 × 400)
     - Follower B: 200 units (capped by max, not 0.5 × 400 = 200)

## Performance Testing

### Bulk Copy Trade Execution

```bash
# Execute 10 trades in sequence
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/followers/execute-copy-trade \
    -H "Content-Type: application/json" \
    -d "{
      \"masterId\": \"master_account\",
      \"listenerFollowers\": [\"follower_001\"],
      \"symbol\": \"SBIN-EQ\",
      \"side\": \"BUY\",
      \"masterQty\": $((100 + i*10)),
      \"price\": 750
    }"
done
```

**Metrics to track:**
- Response time per trade (target: < 2 seconds each)
- Database insert latency
- No connection pool exhaustion
- All trades logged correctly

## Troubleshooting Common Issues

### Issue: "Follower API Key and Client ID are required"

**Cause:** Missing credentials in follower_credentials table

**Fix:**
1. Verify follower was created
2. Check follower_credentials table has entries
3. Re-add follower with correct credentials

### Issue: "HMAC Signature Mismatch" from Alice Blue

**Cause:** Incorrect signing mechanism

**Checklist:**
- [ ] ALICE_AUTH_METHOD=hmac in .env.local
- [ ] Client ID is used as the HMAC secret
- [ ] API Key is correct
- [ ] Server time is synchronized

### Issue: Order Placed But Not Visible in Follower Account

**Checklist:**
1. Verify follower account is active in Alice Blue
2. Check follower balance (may not have funds)
3. Verify symbol is tradeable (not suspended)
4. Check Alice Blue logs in account panel

### Issue: Status Shows SUCCESS But No Order ID

**Cause:** Alice Blue returned success but with different response format

**Fix:**
1. Check Alice Blue API response format
2. Update order ID parsing in pushOrderToAccount()
3. Log full response for debugging

## Database Verification Queries

### Check All Followers:
```sql
SELECT f.id, f.follower_name, f.status, fc.copy_trading_enabled, fc.lot_multiplier
FROM followers f
LEFT JOIN follower_credentials fc ON f.id = fc.follower_id;
```

### Check Recent Copy Trades:
```sql
SELECT id, symbol, side, master_qty, follower_qty, status, created_at
FROM copy_trades
ORDER BY created_at DESC
LIMIT 20;
```

### Check Failed Trades:
```sql
SELECT follower_id, symbol, reason, created_at
FROM copy_trades
WHERE status = 'FAILED'
ORDER BY created_at DESC;
```

## Testing Checklist

- [ ] Follower added successfully
- [ ] Credentials stored in database
- [ ] Single copy trade executes successfully
- [ ] Quantity calculation works (1.0x multiplier)
- [ ] Quantity capped correctly (> max qty)
- [ ] Multiple followers trade simultaneously
- [ ] Different multipliers produce correct quantities
- [ ] Failed trades logged with reasons
- [ ] Copy trades table has audit trail
- [ ] Response times reasonable (< 2 sec per trade)
- [ ] No database connection leaks
- [ ] HMAC signatures validated
- [ ] Error messages helpful for debugging

## Next Steps After Testing

1. **Monitor Production:**
   - Set up alerts for failed copy trades
   - Monitor Alice Blue API latency
   - Track error rates per follower

2. **Optimize:**
   - Add request queuing for high volume
   - Consider batch processing for multiple followers
   - Cache follower credentials in memory (with TTL)

3. **Enhance:**
   - Add UI for monitoring copy trade history
   - Create rollback mechanism (cancel copied orders)
   - Implement trade reconciliation checks

4. **Document:**
   - Train users on using copy trading feature
   - Document restrictions and risks
   - Create incident response playbook
