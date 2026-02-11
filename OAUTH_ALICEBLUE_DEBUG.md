# OAuth AliceBlue Integration - Debugging Guide

## Problem Summary
When users OAuth and connect to AliceBlue, tradebooks are not being fetched and displayed on the dashboard.

## Root Causes Identified

### 1. **Missing OAuth Endpoint Configuration**
The system was not configured to use AliceBlue's OAuth trade endpoint. It was falling back to seeded test data.

**Fixed by:** Adding OAuth-specific endpoint support in `/src/lib/alice.ts`

### 2. **No Token File Persistence Check**
There was no visibility into whether OAuth tokens were actually being saved to `.alice.tokens.json`

**Fixed by:** Creating `/api/alice/oauth-debug` endpoint to diagnose token storage

### 3. **Silent Failures**
When trades weren't fetched, the system quietly fell back to test data without logging errors.

**Fixed by:** Adding comprehensive logging throughout the OAuth flow

---

## Quick Diagnostic Steps

### Step 1: Check if Tokens are Saved
```bash
curl http://localhost:3000/api/alice/oauth-debug
```

**Look for:**
- `debug.files.tokens.exists: true` - Token file exists
- `debug.files.tokens.count > 0` - Accounts are stored
- `debug.status.hasTrades: true` - Trades have been fetched

**If tokens don't exist:**
- Check browser console after OAuth callback for errors
- Verify `ALICE_API_SECRET` environment variable is set
- Check server logs for "Failed saving account token"

### Step 2: Manual Poll Test
```bash
curl -X POST http://localhost:3000/api/alice/poll
```

**Expected response:**
```json
{
  "ok": true,
  "newTrades": 5,
  "accountsPolled": 1
}
```

**If 0 trades:**
- Check logs for `[POLL]` messages
- Verify OAuth endpoint is responding correctly
- Check if token is valid

### Step 3: Direct Trade Fetch
```bash
curl "http://localhost:3000/api/alice/trades?accountId=YOUR_ACCOUNT_ID"
```

**Should return:**
```json
{
  "trades": [
    { "id": "...", "symbol": "INFY", "side": "BUY", ... }
  ]
}
```

---

## Browser Console Debugging

After clicking "Connect to AliceBlue":

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Look for these log patterns:**

✅ **Success indicators:**
```
[OAuth Dashboard] Fetching trades for account: user123
[OAuth Dashboard] Fetched 5 trades for user123
[POLL] Starting poll for 1 account(s)
[POLL] Added 3 new trades for user123
```

❌ **Error indicators:**
```
[OAuth Dashboard] API returned error: ...
[ALICE] OAuth endpoint failed for ...
[POLL] Failed fetching trades for user123
```

---

## Environment Variables Required

```bash
# AliceBlue OAuth
ALICE_CLIENT_ID=your_client_id
ALICE_REDIRECT_URI=http://localhost:3000/aliceblue/callback
ALICE_API_SECRET=your_api_secret  # Required for OAuth flow

# Optional: Custom OAuth endpoint (defaults to AliceBlue prod)
ALICE_OAUTH_TRADES_ENDPOINT=https://ant.aliceblueonline.com/open-api/od/v1/trades

# Optional: API key auth (for non-OAuth)
ALICE_TRADES_ENDPOINT=https://api.aliceblue.com/v1/trades
ALICE_API_KEY=your_api_key
```

---

## File Locations

- **OAuth Tokens:** `.alice.tokens.json` (root directory)
- **Master Account:** `.master.account` (root directory)
- **Cached Trades:** `.alice.incoming.json` (root directory)

Check these exist after OAuth:
```bash
ls -la .alice.* .master.account
```

---

## Common Issues & Solutions

### Issue: "No trades showing after OAuth"

**Check:**
1. Run `curl http://localhost:3000/api/alice/oauth-debug`
2. Verify `tokens.exists = true` and `tokens.count > 0`
3. Check browser console for errors
4. Run manual poll: `curl -X POST http://localhost:3000/api/alice/poll`

**Solutions:**
- **If tokens count = 0:** OAuth callback failed - check `ALICE_API_SECRET` and logs
- **If poll returns 0 trades:** OAuth endpoint might be wrong or token invalid
- **If trades exist but not showing:** Dashboard component might have fetch errors - check console

### Issue: "Failed to fetch trades: 401"

**Means:** OAuth token is invalid or expired

**Solutions:**
1. Clear `.alice.tokens.json`
2. Log out and OAuth again
3. Verify `ALICE_API_SECRET` matches AliceBlue settings

### Issue: "ALICE_OAUTH_TRADES_ENDPOINT not configured"

**Solutions:**
a) Set env var: `ALICE_OAUTH_TRADES_ENDPOINT=https://ant.aliceblueonline.com/open-api/od/v1/trades`
b) Or system uses AliceBlue default endpoint automatically

---

## Testing OAuth Flow

### Manual Test Sequence

1. **Start server:**
   ```bash
   ALICE_CLIENT_ID=test \
   ALICE_REDIRECT_URI=http://localhost:3000/aliceblue/callback \
   ALICE_API_SECRET=testsecret \
   npm run dev
   ```

2. **Trigger OAuth:**
   - Visit http://localhost:3000/dashboard
   - Click "Connect to AliceBlue" button
   - Authorize on AliceBlue

3. **Check callback:**
   - Should redirect to `/dashboard`
   - Check logs for "✅ Saved OAuth token"

4. **Verify token saved:**
   ```bash
   curl http://localhost:3000/api/alice/oauth-debug | jq '.debug.files.tokens'
   ```

5. **Check trades:**
   ```bash
   curl http://localhost:3000/api/alice/trades?accountId=YOUR_ID
   ```

---

## Logs to Monitor

**OAuth Callback:**
```
✅ Saved OAuth token for accountId: ...
🔔 Triggered trade poll on login: { status: 200, newTrades: 5 }
```

**Poll Endpoint:**
```
[POLL] Starting poll for 1 account(s)
[POLL] Fetching trades for account: user123
[ALICE] OAuth fetch for user123: received 5 trades
[POLL] Added 5 new trades for user123
```

**Dashboard:**
```
[OAuth Dashboard] Fetching trades for account: user123
[OAuth Dashboard] Fetched 5 trades for user123
[OAuth Dashboard] Received 2 new trades via SSE
```

---

## What Was Changed (Code Fixes)

1. **`/src/lib/alice.ts`** - Modified `getTradesForAccount()` to:
   - Check for OAuth token first
   - Use OAuth-specific endpoint with Bearer auth
   - Fall back to API key auth only if no OAuth token

2. **`/src/app/api/alice/poll/route.ts`** - Added:
   - Detailed logging of poll status
   - Account polling details
   - Trade count per account

3. **`/src/app/(main)/dashboard/components/oauth-trades-dashboard.tsx`** - Added:
   - Error state display
   - Refresh button for manual retry
   - Better console logging
   - Error messages shown to user

4. **`/src/app/api/alice/oauth-debug/route.ts`** - New endpoint:
   - Diagnostic information about token storage
   - File existence checks
   - Account and trade counts

---

## Next Steps If Still Not Working

1. **Get debug info:**
   ```bash
   curl http://localhost:3000/api/alice/oauth-debug | jq
   ```

2. **Share server logs:**
   ```bash
   npm run dev 2>&1 | grep -E "\[OAUTH\]|\[POLL\]|\[ALICE\]"
   ```

3. **Test AliceBlue endpoint directly:**
   ```bash
   curl -X GET https://ant.aliceblueonline.com/open-api/od/v1/trades \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Check AliceBlue API docs:**
   - Verify the correct endpoint for fetching trades
   - Verify token format and authentication method
   - Check if access/scopes are correct
