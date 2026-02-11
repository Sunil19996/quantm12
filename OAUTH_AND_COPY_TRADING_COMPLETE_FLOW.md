# Complete Copy-Trading Setup & Workflow Guide

**This guide shows the complete end-to-end flow from Master OAuth login to Copy Trading with Followers**

---

## 🎯 Complete Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ MASTER SCENARIO: Connect OAuth → Add Followers → Copy Trades    │
└─────────────────────────────────────────────────────────────────┘

Step 1: Master Logs In
  ↓
Step 2: Master Connects OAuth Account
  ↓
Step 3: Master's Dashboard Shows Trades (from AliceBlue)
  ↓
Step 4: Master Goes to Connections
  ↓
Step 5: Master Registers Followers (with Lot Multipliers)
  ↓
Step 6: Master Manually Creates Test Copy Trade
  ↓
Step 7: All Followers Automatically Get Copy Trades (with their qty)
  ↓
┌─────────────────────────────────────────────────────────────────┐
│ FOLLOWER SCENARIO: Login → See Copy Trades on Dashboard         │
└─────────────────────────────────────────────────────────────────┘

Step 8: Follower Logs In with Generated Credentials
  ↓
Step 9: Follower Dashboard Shows Copy-Trading Board
  ↓
Step 10: Follower Sees All Copy Trades in Real-Time
```

---

# Part A: MASTER WORKFLOW

## Step 1️⃣: Master Visits Website & Signs In

1. Open: `http://localhost:3000`
2. Click "Login" button
3. Enter credentials (or use demo login)
4. See Master Dashboard

**Expected Result**: Home dashboard with "Dashboard" heading

---

## Step 2️⃣: Master Connects OAuth Account

### Navigate to Connections Page
- Click navigation menu → "Connections"  
- Or go to: `http://localhost:3000/connections`

**You'll see:**
```
┌─────────────────────────────────────┐
│ Your AliceBlue Account              │
├─────────────────────────────────────┤
│ Status: Not Connected               │
│ [Connect] [OAuth Configuration]     │
└─────────────────────────────────────┘
```

### Connect OAuth
1. Click **"Connect"** button
2. Browser redirects to AliceBlue login page
3. Login with your AliceBlue credentials:
   - Username: [your AliceBlue username]
   - Password: [your AliceBlue password]
4. AliceBlue shows permission screen
5. Click "Approve"
6. Redirected back to your dashboard
7. System stores OAuth token locally

**Expected Result**: 
```
Status: ✅ Connected
Last Updated: [timestamp]
[Disconnect] button now showing
```

---

## Step 3️⃣: Check Master Dashboard Shows Trades

### Go to Master Dashboard
- Click navigation → "Dashboard"
- Or go to: `http://localhost:3000/dashboard`

**You'll see:**
```
┌──────────────────────────────────────┐
│ Dashboard                            │
│ Manage your master trading account   │
│ [Connect] ← OAuth status             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📊 Master Connection Status          │
│ ✅ Connected to AliceBlue            │
│ Account: mastertrade@aliceblue.com   │
│ Last Sync: 2024-02-10 10:30:45       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📈 Master Trade Book                 │
│ (Live trades from your AliceBlue)    │
├──────────────────────────────────────┤
│ Symbol | Side | Qty | Price | Status │
│ RELIANCE | BUY | 100 | 2850 | ...   │
│ TCS | SELL | 50 | 3650 | ...        │
└──────────────────────────────────────┘
```

**What's happening**: System is polling your OAuth token to fetch real trades from AliceBlue

---

## Step 4️⃣: Master Returns to Connections for Setup

1. Go back to: `http://localhost:3000/connections`
2. Scroll down to **"Add Followers"** section

**You'll see:**
```
┌──────────────────────────────────────┐
│ 👥 Add Followers                     │
│ Register followers with API keys     │
│ [Add Followers Button]               │
└──────────────────────────────────────┘
```

---

## Step 5️⃣: Master Registers First Follower

### Click "Add Followers" Button

You'll see a dialog:
```
┌─────────────────────────────────────────────────┐
│ Register Follower                               │
├─────────────────────────────────────────────────┤
│ Follower Name:        [John Trader           ]  │
│ API Key:              [api_key_12345...      ]  │
│ API Secret:           [••••••••••••••      ]  │
│ Client ID:            [client_id_abc...     ]  │
│                                                 │
│ Risk Configuration:                             │
│ Lot Multiplier:       [1.5                  ]  │
│ Max Quantity:         [1000                 ]  │
│ Max Order Value:      [500000               ]  │
│ Max Daily Loss:       [50000                ]  │
│                                                 │
│ [Cancel]  [Register]                            │
└─────────────────────────────────────────────────┘
```

### Fill in the Form

**Example 1: Follower with 1.5x Multiplier**
```
Follower Name:        John Trader
API Key:              api_test_key_12345
API Secret:           api_secret_67890
Client ID:            test_client_001
Lot Multiplier:       1.5  ← Will receive 1.5x quantity
Max Quantity:         1000 ← Cap at 1000 qty
Max Order Value:      500000
Max Daily Loss:       50000
```

**Example 2: Follower with 1.0x Multiplier (1:1)**
```
Follower Name:        Jane Trader
API Key:              api_test_key_99999
API Secret:           api_secret_88888
Client ID:            test_client_002
Lot Multiplier:       1.0  ← Will receive exact same qty
Max Quantity:         800
Max Order Value:      300000
Max Daily Loss:       30000
```

### Click "Register"

System creates follower and displays credentials **ONE TIME ONLY**:

```
┌─────────────────────────────────────────────────┐
│ ✅ Follower Registered Successfully!            │
├─────────────────────────────────────────────────┤
│ Follower ID:  follower_abc123def456             │
│ Name:         John Trader                       │
│ Created:      2024-02-10 10:35:22               │
│                                                 │
│ LOGIN CREDENTIALS (Share with Follower):        │
│ ┌──────────────────────────────────────────┐   │
│ │ Username: john_trader_xyz789             │   │
│ │ [📋 Copy]                                 │   │
│ │                                          │   │
│ │ Password: a3f8d5e2c9b1f7g4h6              │   │
│ │ [📋 Copy]                                 │   │
│ │                                          │   │
│ │ Website: http://localhost:3000           │   │
│ │ [📋 Copy]                                 │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ⚠️  Credentials shown only once!                │
│    Save them securely before closing dialog     │
│                                                 │
│ [Close]                                         │
└─────────────────────────────────────────────────┘
```

### IMPORTANT: Save Credentials

**Copy these three things** (or follower won't be able to login):
1. Username: `john_trader_xyz789`
2. Password: `a3f8d5e2c9b1f7g4h6`
3. Website: `http://localhost:3000`

**⚠️ If you close without copying:**
- Credentials are lost
- Must register follower AGAIN to get new credentials
- Old credentials become invalid

---

## Step 6️⃣: Master Creates Test Copy Trade

### Go Back to Dashboard
1. Navigate to: `http://localhost:3000/dashboard`
2. Scroll down (after Master Trade Book)

**You'll see:**
```
┌──────────────────────────────────────────────────┐
│ ⚡ Manual Copy Trade (Testing)                   │
│ Manually trigger copy trades to all followers    │
│ for testing purposes                             │
│                                                  │
│ [Test Copy Trade]                                │
└──────────────────────────────────────────────────┘
```

### Click "Test Copy Trade"

Dialog appears:
```
┌─────────────────────────────────────┐
│ Create Test Copy Trade              │
├─────────────────────────────────────┤
│ Symbol: [RELIANCE          ]         │
│ Side:   [BUY ▼            ]         │
│ Master Qty: [100           ]         │
│ Price: [2850.50           ]         │
│                                     │
│ ℹ️ Follower quantities will be       │
│    calculated based on their        │
│    lot multiplier                   │
│                                     │
│ [Cancel]  [Create Copy Trade]       │
└─────────────────────────────────────┘
```

### Fill in Trade Details

**Example Trade:**
```
Symbol:      RELIANCE
Side:        BUY
Master Qty:  100
Price:       2850.50
```

**What will happen:**
- Master Qty = 100
- Follower 1 (John, 1.5x):  100 × 1.5 = **150 qty**
- Follower 2 (Jane, 1.0x):  100 × 1.0 = **100 qty**

### Click "Create Copy Trade"

**Success!**
```
✅ Copy Trades Created
   5 copy trade(s) logged for all followers
```

This creates:
- Entry for Follower 1: RELIANCE BUY 150 @ 2850.50 [SUCCESS]
- Entry for Follower 2: RELIANCE BUY 100 @ 2850.50 [SUCCESS]
- (For each registered follower)

---

## Step 7️⃣: Master Adds More Followers (Optional)

Repeat Steps 5-6 to add more followers with different multipliers

**Example Multi-Follower Setup:**
```
Follower 1: John Trader     (1.5x)  → RELIANCE 150
Follower 2: Jane Trader     (1.0x) → RELIANCE 100
Follower 3: Bob Investor    (0.5x) → RELIANCE 50
Follower 4: Alice Trader    (2.0x) → RELIANCE 200
```

Each copy trade automatically calculates for their multiplier!

---

# Part B: FOLLOWER WORKFLOW

## Step 8️⃣: Follower Receives Login Credentials

Master provides:
```
Username: john_trader_xyz789
Password: a3f8d5e2c9b1f7g4h6
Website:  http://localhost:3000
```

---

## Step 9️⃣: Follower Visits and Logs In

### Open Website
1. Go to: `http://localhost:3000`
2. Click "Login"

**Login page:**
```
┌──────────────────────────────┐
│ Login to Trading Dashboard   │
├──────────────────────────────┤
│ Username: [________________] │
│ Password: [________________] │
│ [Remember Me] [Forgot?]      │
│                              │
│ [Sign In]                    │
└──────────────────────────────┘
```

### Enter Credentials
```
Username: john_trader_xyz789
Password: a3f8d5e2c9b1f7g4h6
```

### Click "Sign In"

**Result**: Follower is now logged in!

---

## Step 🔟: Follower Dashboard Shows Copy Trades

### Dashboard Loads
```
┌─────────────────────────────────────────────────────┐
│ Copy Trading Dashboard                              │
│ Live trades copied from master account              │
│ (follower_abc123...)                                │
├─────────────────────────────────────────────────────┤
│ 📊 Statistics                                       │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │ Total       │ │ Successful  │ │ Pending     │   │
│ │ Copied      │ │             │ │             │   │
│ │   5         │ │   5         │ │   0         │   │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐                                    │
│ │ Failed      │                                    │
│ │   0         │                                    │
│ └─────────────┘                                    │
├─────────────────────────────────────────────────────┤
│ 📈 Live Copy Trades                                 │
│ Orders copied from master in real-time              │
│                                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ Symbol │ Side │ M Qty │ Your Qty │ Price │ St│  │
│ ├───────────────────────────────────────────────┤  │
│ │ RELIEF │ BUY  │ 100   │ 150      │ 2850  │ ✓│  │
│ ├───────────────────────────────────────────────┤  │
│ │ TCS    │ SELL │ 50    │ 75       │ 3650  │ ✓│  │
│ └───────────────────────────────────────────────┘  │
│                                                     │
│ 📊 How It Works                                    │
│ ✅ Master places trade on their account           │
│ ✅ System calculates YOUR quantity (qty × mult)   │
│ ✅ Order is placed automatically                  │
│ ✅ Status updates appear here in real-time        │
│ ✅ Risk limits enforced before placement          │
└─────────────────────────────────────────────────────┘
```

### What Follower Sees

Each copy trade shows:
- **Symbol**: RELIANCE, TCS, INFY, etc.
- **Side**: BUY (blue) or SELL (red)
- **Master Qty**: What master traded (100)
- **Your Qty**: What YOU got (150 = 100 × 1.5)
- **Price**: Execution price (₹2850)
- **Time**: When it was created (10:35:22)
- **Status**: ✅ SUCCESS, ⏳ PENDING, ❌ FAILED, ⊘ CANCELLED

---

## Step 1️⃣1️⃣: Real-Time Updates

Dashboard polls every **5 seconds** automatically:

**Scenario:**
```
10:35:22 - Follower sees: RELIANCE BUY 150 [SUCCESS]
10:35:27 - (5-sec refresh) - Still shows: RELIANCE BUY 150 [SUCCESS]
10:36:00 - Master places NEW trade
10:36:05 - Follower dashboard refreshes
          NEW trade appears: TCS SELL 75 [SUCCESS]
```

**No action needed** - just watch the dashboard, trades appear automatically!

---

# Part C: QUANTITY CALCULATION EXAMPLES

## How Lot Multiplier Works

### Example 1: 1.5x Multiplier
```
Master places:  RELIANCE BUY 100
Follower mult:  1.5

Calculation: 100 × 1.5 = 150
Follower gets: RELIANCE BUY 150
```

### Example 2: Half Size (0.5x)
```
Master places:  INFY BUY 200
Follower mult:  0.5

Calculation: 200 × 0.5 = 100
Follower gets: INFY BUY 100
```

### Example 3: Double Size (2.0x)
```
Master places:  TCS SELL 50
Follower mult:  2.0

Calculation: 50 × 2.0 = 100
Follower gets: TCS SELL 100
```

### Example 4: With Max Quantity Cap
```
Master places:  BANK NIFTY BUY 100
Follower mult:  2.0
Follower cap:   MAX 150 qty

Calculation: 100 × 2.0 = 200, but capped at 150
Follower gets: BANK NIFTY BUY 150
```

---

# Part D: REAL EXAMPLE SCENARIO

## Scenario: Trading Day with 3 Followers

### 🌅 Morning: Setup (10:00 AM)

**Master Dashboard:**
```
✅ OAuth Connected
📈 Live Trades Flowing from AliceBlue
```

**Master Adds Followers:**
```
1. Alice (1.5x)  - Conservative trader
2. Bob (1.0x)    - Moderate trader  
3. Charlie (2.0x) - Aggressive trader
```

Each gets login credentials.

---

### 📱 Mid-Morning: Follower Login (10:15 AM)

**Alice logs in:**
```
Username: alice_trader_xxx
Password: f8g5h2j9k1l3
```

**Dashboard shows:**
```
Total Copied: 0
(No trades yet)
```

---

### 🚀 Late Morning: First Trade (10:30 AM)

**Master places:**
```
RELIANCE BUY 100 @ 2850.50
```

**System creates copy trades:**
```
Alice (1.5x):   RELIANCE BUY 150
Bob (1.0x):     RELIANCE BUY 100
Charlie (2.0x): RELIANCE BUY 200
```

---

### 👀 Followers See Trades (10:35 AM)

**Alice's Dashboard:**
```
Total Copied: 1
Successful: 1

Trade: RELIANCE BUY 150 @ 2850.50 ✅
```

**Bob's Dashboard:**
```
Total Copied: 1
Successful: 1

Trade: RELIANCE BUY 100 @ 2850.50 ✅
```

**Charlie's Dashboard:**
```
Total Copied: 1
Successful: 1

Trade: RELIANCE BUY 200 @ 2850.50 ✅
```

---

### 📈 Noon: More Trades (11:00 AM - 11:30 AM)

**Master places 3 more trades:**

**Trade 2 @ 11:05 AM:**
```
Master: TCS SELL 50 @ 3650.25
→ Alice:   TCS SELL 75
→ Bob:     TCS SELL 50
→ Charlie: TCS SELL 100
```

**Trade 3 @ 11:15 AM:**
```
Master: INFY BUY 200 @ 2450.00
→ Alice:   INFY BUY 300
→ Bob:     INFY BUY 200
→ Charlie: INFY BUY 400
```

**Trade 4 @ 11:30 AM:**
```
Master: WIPRO SELL 80 @ 525.50
→ Alice:   WIPRO SELL 120
→ Bob:     WIPRO SELL 80
→ Charlie: WIPRO SELL 160
```

---

### 🏁 End of Day Summary (4:00 PM)

**All Followers See Same Dashboard Structure:**

| Symbol | Side | Master Qty | Your Qty | Price | Status |
|--------|------|-----------|----------|-------|--------|
| RELIANCE | BUY | 100 | 150/100/200 | 2850 | ✅ |
| TCS | SELL | 50 | 75/50/100 | 3650 | ✅ |
| INFY | BUY | 200 | 300/200/400 | 2450 | ✅ |
| WIPRO | SELL | 80 | 120/80/160 | 525 | ✅ |

**Statistics:**
```
Alice:   Total 4 ✅ | Successful 4 | Failed 0
Bob:     Total 4 ✅ | Successful 4 | Failed 0
Charlie: Total 4 ✅ | Successful 4 | Failed 0
```

---

# Part E: TROUBLESHOOTING

## Issue 1: OAuth Won't Connect

**Problem:** "Connection Failed" when clicking Connect button

**Solution:**
1. Verify AliceBlue credentials are correct
2. AliceBlue account must be active
3. Check internet connection
4. Try in incognito window (clear cache)

**Debug:**
```
Check browser console (F12)
Look for [OAUTH] logs
```

---

## Issue 2: Followers Don't See Copy Trades

**Problem:** Follower dashboard is empty

**Possible Causes:**
1. No followers registered
2. Follower ID doesn't match
3. Copy trade never created

**Solution:**
```
Step 1: Check /api/followers/list
        - See if follower is registered

Step 2: Create copy trade manually
        - Go to master dashboard
        - Click "Test Copy Trade"
        - Fill form and submit

Step 3: Dashboard should refresh in 5 seconds
        - Should show the new trade
```

---

## Issue 3: Wrong Quantity Showing

**Problem:** Follower gets wrong quantity

**Check:**
1. Verify lot multiplier set correctly
2. Verify max quantity limit
3. Check calculation: master_qty × multiplier

**Example:**
```
Master Trade: BUY 100
Follower Multiplier: 1.5
Expected: 150

If showing something else:
- Check multiplier in .alice.follower-credentials.json
- Re-verify during registration
```

---

## Issue 4: Credentials Lost

**Problem:** Forgot to save follower credentials

**Solution:**
1. You MUST register follower again
2. New credentials will be generated
3. Previous credentials are invalid

**Prevention:**
```
- Copy credentials immediately after registration
- Save to password manager
- Take screenshot
- Send via secure method to follower
```

---

# Part F: FILES & TESTING

## Test Data Storage

**Follower Credentials:** `.alice.follower-credentials.json`
```json
[
  {
    "followerId": "follower_abc123def456",
    "loginUsername": "john_trader_xyz789",
    "loginPassword": "a3f8d5e2c9b1f7g4h6",
    "lotMultiplier": 1.5,
    "createdAt": "2024-02-10T10:35:22Z"
  }
]
```

**Copy Trades Log:** `.alice.copy-trades.json`
```json
[
  {
    "id": "trade_abc123",
    "masterId": "master_account",
    "followerId": "follower_abc123def456",
    "symbol": "RELIANCE",
    "side": "BUY",
    "masterQty": 100,
    "followerQty": 150,
    "price": 2850.50,
    "status": "SUCCESS",
    "timestamp": "2024-02-10T10:35:22Z"
  }
]
```

---

## Quick Check Commands

```bash
# Check all followers
curl http://localhost:3000/api/followers/list

# Check follower's copy trades
curl "http://localhost:3000/api/followers/copy-trades?followerId=follower_abc123"

# Check files
cat .alice.follower-credentials.json
cat .alice.copy-trades.json
```

---

# 🎯 FINAL CHECKLIST

Before calling it complete:

- [ ] Master logged in to dashboard
- [ ] OAuth connected (shows ✅ Connected)
- [ ] Master trades visible on dashboard
- [ ] Master can see "Add Followers" button
- [ ] Master registered at least 1 follower
- [ ] Got login credentials for follower
- [ ] Master created test copy trade
- [ ] Follower logged in with credentials
- [ ] Follower sees copy trades on dashboard
- [ ] Copy trade quantity matches (master × multiplier)
- [ ] Statistics show correct counts
- [ ] Another trade appears within 5 seconds refresh

**If all ✅ - System is working perfectly!** 🎉

---

## 🚀 Next Steps

1. Add more followers with different multipliers
2. Try multiple test trades
3. Check all followers see their correct quantities
4. Practice registering and logging in
5. Verify dashboard real-time updates (5-sec polling)

**You're ready to go live!** 🚀
