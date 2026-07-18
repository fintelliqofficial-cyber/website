# FintelliQ Portfolio Dashboard — API Contract

Base URL (production): `https://fintelliq.biz`  
Token: daily portfolio link token from WhatsApp (path segment `/portfolio/{token}`)

The website makes **2 API calls** in production:

| # | Method | Endpoint | When |
|---|--------|----------|------|
| 1 | `GET` | `/api/v1/portfolio/{token}` | Page load, after onboarding, after edit |
| 2 | `POST` | `/api/v1/user/{token}/onboarding` | Complete onboarding or save edits |

Stock search uses local `mock/stocks.json` (NIFTY 500) — **no search API**.

---

## 1. Get portfolio (bootstrap)

Decides whether to show **onboarding** or **dashboard**. Single entry-point for the SPA.

```bash
curl -sS "https://fintelliq.biz/api/v1/portfolio/{token}" \
  -H "Accept: application/json"
```

Replace `{token}` with the user's daily portfolio token.

### Routing rule (frontend)

```
if response.onboardingIncomplete === true  →  show onboarding
else                                       →  show dashboard
```

When onboarding is complete, **omit** `onboardingIncomplete` or set it to `false`.

---

### Response A — onboarding required (`200 OK`)

Minimal payload. No dashboard fields.

```json
{
  "onboardingIncomplete": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `onboardingIncomplete` | boolean | yes | Must be `true` |

---

### Response B — dashboard data (`200 OK`)

Full portfolio snapshot. Do **not** include `onboardingIncomplete: true`.

```json
{
  "generatedAt": "2025-07-01T08:30:00+05:30",

  "portfolio": {
    "currentValue": 1482350,
    "todayChange": 21560,
    "todayChangePercent": 1.48,
    "holdingsImpacted": 3
  },

  "allocation": [
    { "sectorId": "IT", "sectorName": "IT", "weight": 38, "color": "#16A34A" },
    { "sectorId": "BANK", "sectorName": "Banking", "weight": 27, "color": "#2563EB" },
    { "sectorId": "AUTO", "sectorName": "Auto", "weight": 16, "color": "#F59E0B" },
    { "sectorId": "DEF", "sectorName": "Defence", "weight": 11, "color": "#7C3AED" },
    { "sectorId": "FMCG", "sectorName": "FMCG", "weight": 8, "color": "#DC2626" }
  ],

  "sectorPerformance": [
    { "sectorId": "IT", "sectorName": "IT", "changePercent": 1.42 },
    { "sectorId": "DEF", "sectorName": "Defence", "changePercent": 0.85 },
    { "sectorId": "AUTO", "sectorName": "Auto", "changePercent": 0.32 },
    { "sectorId": "FMCG", "sectorName": "FMCG", "changePercent": -0.15 },
    { "sectorId": "BANK", "sectorName": "Banking", "changePercent": -0.82 }
  ],

  "holdings": [
    {
      "symbol": "TCS",
      "companyName": "Tata Consultancy Services",
      "sectorId": "IT",
      "quantity": 20,
      "avgPrice": 3400.00,
      "currentPrice": 3825.10,
      "changeAmount": 52.80,
      "changePercent": 1.40,
      "weight": 18.2,
      "movedToday": true
    },
    {
      "symbol": "HDFCBANK",
      "companyName": "HDFC Bank",
      "sectorId": "BANK",
      "quantity": 15,
      "avgPrice": 1620.00,
      "currentPrice": 1672.35,
      "changeAmount": -13.60,
      "changePercent": -0.80,
      "weight": 13.4
    }
  ],

  "watchlist": [
    {
      "symbol": "HAL",
      "companyName": "Hindustan Aeronautics",
      "currentPrice": 5125.80,
      "changeAmount": 83.10,
      "changePercent": 1.65
    },
    {
      "symbol": "MARUTI",
      "companyName": "Maruti Suzuki",
      "currentPrice": 14152.00,
      "changeAmount": 59.20,
      "changePercent": 0.42
    }
  ]
}
```

#### Complete field reference

**Root (dashboard response)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `onboardingIncomplete` | boolean | no | Omit or `false` when dashboard is ready |
| `generatedAt` | string (ISO 8601) | yes | Snapshot timestamp shown in dashboard header |
| `portfolio` | object | yes | Summary metrics |
| `allocation` | array | yes | Donut chart segments (`[]` if no holdings) |
| `sectorPerformance` | array | yes | Bar chart data (`[]` if no holdings) |
| `holdings` | array | yes | User holdings (`[]` for watchlist-only users) |
| `watchlist` | array | yes | Watchlist stocks (`[]` allowed) |

**`portfolio` object**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentValue` | number | yes | Total portfolio value in INR |
| `todayChange` | number | yes | Absolute change today in INR |
| `todayChangePercent` | number | yes | Percent change today |
| `holdingsImpacted` | number | yes | Count for "X stocks moved today" banner |

**`allocation[]` item**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sectorId` | string | yes | Sector code |
| `sectorName` | string | yes | Display label |
| `weight` | number | yes | Percentage weight (0–100) |
| `color` | string | yes | Hex color for chart |

**`sectorPerformance[]` item**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sectorId` | string | yes | Sector code |
| `sectorName` | string | yes | Display label |
| `changePercent` | number | yes | Average % change for user's holdings in that sector |

**`holdings[]` item**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | yes | NSE symbol |
| `companyName` | string | yes | Display name |
| `sectorId` | string | yes | Sector code |
| `quantity` | number | yes | Shares held |
| `avgPrice` | number | yes | Average buy price |
| `currentPrice` | number | yes | LTP |
| `changeAmount` | number | yes | Absolute change today |
| `changePercent` | number | yes | Percent change today |
| `weight` | number | yes | Portfolio weight % |
| `movedToday` | boolean | no | If `true`, included in "stocks moved" panel |

**`watchlist[]` item**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | yes | NSE symbol |
| `companyName` | string | yes | Display name |
| `currentPrice` | number | yes | LTP |
| `changeAmount` | number | yes | Absolute change today |
| `changePercent` | number | yes | Percent change today |

### Error responses

**Invalid or expired token (`404 Not Found`)**

```json
{
  "status": "error",
  "message": "Invalid or expired portfolio link"
}
```

**Server error (`500`)**

```json
{
  "status": "error",
  "message": "Unable to load portfolio"
}
```

---

## 2. Save onboarding / edit portfolio

Called when user completes onboarding, or saves holdings/watchlist edits from the dashboard.

```bash
curl -sS -X POST "https://fintelliq.biz/api/v1/user/{token}/onboarding" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "holdings": [
      {
        "symbol": "TCS",
        "name": "Tata Consultancy Services",
        "quantity": 20,
        "avgPrice": 3400.00
      }
    ],
    "watchlist": [
      {
        "symbol": "HAL",
        "name": "Hindustan Aeronautics"
      }
    ],
    "interests": ["markets", "commodities", "mutualFunds"]
  }'
```

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `holdings` | array | yes | Can be `[]` (watchlist-only users) |
| `watchlist` | array | yes | At least one of holdings/watchlist must be non-empty on first onboarding |
| `interests` | string[] | yes | Selected interest IDs (see below) |

**Valid `interests` values:** `markets` · `economy` · `commodities` · `crypto` · `mutualFunds` · `ipoStocks`

### Success response (`200 OK`)

Frontend only checks HTTP status, then re-calls `GET /api/v1/portfolio/{token}`.

```json
{
  "status": "success",
  "message": "Portfolio preferences saved"
}
```

### Error responses

**Invalid token (`404`)**

```json
{
  "status": "error",
  "message": "Invalid or expired portfolio link"
}
```

**Validation error (`400`)**

```json
{
  "status": "error",
  "message": "quantity must be a positive integer"
}
```

---

## Frontend routing logic

```
GET /api/v1/portfolio/{token}
  │
  ├─ 404 ──────────────────────► Show "invalid or expired link"
  │
  ├─ 200 + onboardingIncomplete ► Show onboarding flow
  │                                 └─ POST /onboarding ─► GET /portfolio again
  │
  └─ 200 + full payload ─────────► Show dashboard
                                      ├─ Edit holdings ─► POST /onboarding (holdings only)
                                      └─ Edit watchlist ─► POST /onboarding (watchlist only)
```

---

## Local mock testing

Set `USE_MOCK_DATA = true` in `js/api.js` (default).

| URL / action | Result |
|--------------|--------|
| First visit | `mock/onboarding-incomplete.json` |
| `?onboarding=1` | Force onboarding |
| After onboarding submit | `localStorage` flag → `mock/portfolio.json` |
| `localStorage.clear()` | Reset to onboarding |

Production: set `USE_MOCK_DATA = false`.
