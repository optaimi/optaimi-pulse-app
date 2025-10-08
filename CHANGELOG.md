# Optaimi Pulse - Project Changelog

## Project Overview

**Optaimi Pulse** is a Next.js 15 dashboard application for real-time performance and cost analysis of leading LLM models. The application tests multiple AI models concurrently, displays performance metrics (latency, tokens/sec, cost), stores historical data in PostgreSQL, and visualizes trends over time.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: FastAPI (Python), Uvicorn
- **Database**: PostgreSQL (Replit-hosted)
- **UI Components**: Radix UI primitives, Recharts for visualization
- **Styling**: Tailwind CSS 4 with custom design tokens, emerald accent colors (#10b981)

### Current Models Tested
1. **GPT-4o Mini** (OpenAI) - ✅ Working
2. **Claude 3.5 Haiku** (Anthropic) - ⚠️ Requires API credits
3. **Gemini 2.0 Flash** (Google) - ✅ Working
4. **DeepSeek Chat** (DeepSeek) - ⚠️ Requires API credits

---

## Architecture Summary

### Frontend Architecture
- **Framework**: Next.js 15 with App Router pattern
- **Main Page**: `app/page.tsx` - Client-side rendered dashboard
- **API Routes**: 
  - `/api/run-test` - Proxies to FastAPI backend for test execution
  - `/api/history` - Proxies historical data with time-range filtering
- **Components**: 
  - `design-system/components/PerformanceChart.tsx` - Recharts-based visualization
  - `design-system/components/ui/` - Radix UI-based design system components
- **Path Aliasing**: `@/*` configured for both root and `design-system/` directories

### Backend Architecture
- **Framework**: FastAPI with async/await patterns
- **Server**: Uvicorn on port 8000 (0.0.0.0 host)
- **API Endpoints**:
  - `GET /api/run-test` - Executes concurrent LLM tests, stores results in DB
  - `GET /api/history` - Returns historical data with optional model/time-range filtering
- **LLM Integration**: Concurrent API calls using `asyncio.gather()`
- **Database**: PostgreSQL with `psycopg2-binary` adapter

### Database Schema
**Table: `results`**
```sql
- id: serial PRIMARY KEY (auto-incrementing)
- ts: timestamp with time zone DEFAULT CURRENT_TIMESTAMP
- provider: varchar (OpenAI, Anthropic, Google, DeepSeek)
- model: varchar (model identifier)
- latency_s: numeric (test latency in seconds)
- tps: numeric (tokens per second)
- cost_usd: numeric (cost in USD)
- in_tokens: integer (input token count)
- out_tokens: integer (output token count)
- error: text (error message if test failed, null if successful)
```

### Deployment Configuration
- **Frontend Workflow**: Next.js dev server on port 5000
- **Backend Workflow**: FastAPI/Uvicorn server on port 8000
- **Scheduled Deployment**: `scheduler.py` configured for 15-minute automated testing intervals

---

## Session Changelog (October 6, 2025)

### Phase 1-2: Live Concurrent Testing & Historical Data ✅

#### 1. Initial Project Setup
- **Migration from Pages Router to App Router**
  - Removed legacy `pages/` directory
  - Created `app/page.tsx` as main dashboard
  - Configured development server on port 5000 with 0.0.0.0 host

#### 2. Tailwind CSS v4 Migration
- Updated to Tailwind CSS 4 with `@import "tailwindcss"`
- Implemented `@theme` directive for CSS variable to token mapping
- Fixed styling issues with proper CSS variable handling in `app/globals.css`
- Added dark mode support with `.dark` class variants

#### 3. FastAPI Backend Implementation
- **Created `main.py`** with async LLM testing functions:
  - `test_openai()` - Tests GPT-4o Mini
  - `test_anthropic()` - Tests Claude 3.5 Haiku
  - `test_gemini()` - Tests Gemini 2.0 Flash
  - `test_deepseek()` - Tests DeepSeek Chat
- **Concurrent Execution**: All models tested in parallel using `asyncio.gather()`
- **Cost Calculation**: Per-model pricing table with input/output token costs
- **Error Handling**: Graceful failure handling with error messages stored in results

#### 4. PostgreSQL Database Integration
- **Created `results` table** with schema for storing test history
- **Database Functions**:
  - `get_db_connection()` - Connection management with env variables
  - `insert_result()` - Async result persistence
- **Environment Variables**: PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT

#### 5. API Endpoints Implementation
- **`GET /api/run-test`**:
  - Executes concurrent tests on all 4 models
  - Returns performance metrics (latency, TPS, cost, tokens)
  - Stores results in PostgreSQL for historical tracking
  - Response format: `{"results": [...]}`

- **`GET /api/history`**:
  - Query params: `model` (optional), `range` (24h/7d/30d)
  - Filters successful tests (error IS NULL)
  - Returns time-series data for charts
  - Response format: `{"history": [...], "range": "24h", "model": null}`

#### 6. Next.js API Route Proxies
- **Created `app/api/run-test/route.ts`**:
  - Proxies frontend requests to FastAPI backend
  - Uses `REPLIT_DEV_DOMAIN` environment variable for URL construction
  - Handles errors with 500 status codes

- **Created `app/api/history/route.ts`**:
  - Forwards query parameters to backend
  - Implements no-cache policy for fresh data

#### 7. Frontend Dashboard Implementation
- **Main Dashboard (`app/page.tsx`)**:
  - Refresh button with loading states
  - Metric summary tiles: Avg Latency, Avg TPS, Avg Cost
  - Results table with model name, latency, TPS, cost
  - Error display for failed model tests
  - Time-range toggle (24h/7d/30d)

- **Performance Chart Component** (`design-system/components/PerformanceChart.tsx`):
  - Two Recharts LineCharts: Latency & Tokens/Sec
  - Color-coded lines per model (emerald, amber, blue, purple)
  - Responsive design with proper dark mode theming
  - Dynamic import to avoid SSR issues

#### 8. Design System Implementation
- **Emerald Accent Colors**: Primary brand color #10b981
- **Typography**: Inter font family with tabular-nums for metrics
- **Card Components**: Large rounded cards with border-2
- **Button Styling**: Emerald-600 with hover states
- **Radix UI Integration**: Dialog, Label, Slider, Slot components

#### 9. Critical Bug Fixes

##### Bug #1: Google GenAI Import Error ❌→✅
- **Issue**: `from google import genai` caused ImportError
- **Fix**: Changed to `import google.generativeai as genai`
- **Location**: `main.py` line 15

##### Bug #2: PerformanceChart Path Resolution ❌→✅
- **Issue**: Component in `components/` directory not found by Next.js
- **Fix**: Moved to `design-system/components/PerformanceChart.tsx`
- **Update**: Updated import in `app/page.tsx` to `@/components/PerformanceChart`
- **Cleanup**: Removed empty `components/` directory

##### Bug #3: Gemini Token Count TypeError ❌→✅
- **Issue**: `candidates_token_count` returned as list instead of int
- **Error**: `TypeError: unsupported operand type(s) for /: 'list' and 'float'`
- **Fix**: Added type checking and extraction logic:
  ```python
  candidates_count = response.usage_metadata.candidates_token_count
  out_tokens = candidates_count[0] if isinstance(candidates_count, list) and len(candidates_count) > 0 
               else (candidates_count if isinstance(candidates_count, int) else 0)
  ```
- **Location**: `main.py` lines 199-201
- **Result**: Gemini now successfully computes TPS (71.34 TPS average)

#### 10. Workflow Configuration
- **Backend Workflow**: `python main.py` on port 8000
- **Frontend Workflow**: `npm run dev -- -p 5000` on port 5000
- **Parallel Execution**: Both workflows run simultaneously
- **Console Output**: Backend shows API logs, Frontend shows compilation status

#### 11. Scheduled Deployment
- **File**: `scheduler.py` (configured for automated testing)
- **Interval**: 15-minute automated test execution
- **Purpose**: Continuous data collection for historical analysis

#### 12. Documentation Updates
- **Updated `replit.md`** with:
  - Phase 1-2 completion summary
  - Updated API endpoint documentation
  - Database schema documentation
  - Backend dependencies (psycopg2-binary, openai, anthropic, google-generativeai, httpx)
  - Component architecture changes

---

## Session Changelog (October 8, 2025)

### Phase 3: Multi-Currency Support, Settings UI, and Chart Improvements ✅

#### Brand Identity & Dark Theme Implementation (October 8, 2025 - PM Session)

##### 1. Dark Mode Activation
- **Issue**: Dark theme CSS configured but not applied by default
- **Fix**: Added `className="dark"` to `<html>` tag in `app/layout.tsx`
- **Result**: Default dark mode with brand colors:
  - Background: #0F172A (dark navy slate)
  - Text: #E6E9EF (light gray)
  - Accent: #10B981 (emerald green)

##### 2. Optaimi Spark Branding Integration
- **Logo Assets**:
  - Moved `attached_assets/optaimispark-logodark_1759911682325.png` → `public/logo.png`
  - Moved `attached_assets/favicon-spark_1759911619410.png` → `app/icon.png`
- **Header Update** (`app/page.tsx`):
  - Replaced Lucide Zap icon with Next.js Image component
  - Logo source: `/logo.png` with alt text "Optaimi Spark"
  - Dimensions: 40x40 with auto-width for responsiveness
- **Favicon**: Next.js 15 automatically serves `app/icon.png` as favicon

##### 3. Brand Color Verification UI
- **Added Visual Token Section** (bottom of dashboard):
  - Displays all three brand colors with hex values
  - Color swatches with actual colors for visual validation:
    - #0F172A - Background swatch
    - #E6E9EF - Primary Text swatch
    - #10B981 - Accent swatch
  - Purpose: Quick visual debugging of brand colors

##### 4. Critical Backend Bug Fix: Coroutine Leak ❌→✅
- **Issue**: RuntimeWarning: `coroutine 'test_anthropic' was never awaited`
- **Root Cause**: 
  - `model_tests` dictionary called async functions immediately: `"model": test_func("id")`
  - Created coroutines for ALL models, but only SOME were awaited (based on `selected_models`)
  - Unselected model coroutines never awaited, causing RuntimeWarnings
- **Fix** (`main.py` lines 381-393):
  ```python
  # Before (BAD - creates coroutines immediately)
  model_tests = {
      "gpt-4o-mini": test_openai("gpt-4o-mini"),  # Creates coroutine NOW
      ...
  }
  
  # After (GOOD - lambdas defer coroutine creation)
  model_test_funcs = {
      "gpt-4o-mini": lambda: test_openai("gpt-4o-mini"),  # Creates coroutine only when called
      ...
  }
  tests_to_run = [model_test_funcs[m]() for m in selected_models]
  ```
- **Validation**: 
  - API tested with curl: 200 OK responses
  - Backend logs show no RuntimeWarnings
  - Architect review confirmed no remaining coroutine leaks
- **Impact**: Refresh button now works correctly with no warnings

#### 1. ExchangeRate-API Integration
- **Currency Conversion Utility** (`main.py`):
  - Added `get_fx_rate()` function with 24-hour caching
  - Uses ExchangeRate-API free tier (1,500 requests/month limit)
  - Fetches USD→GBP exchange rate on demand
  - Implements in-memory cache to minimize API calls
  - Returns cached rate if within 24-hour window

- **FX_USD_GBP Secret Check**:
  - Checks for optional `FX_USD_GBP` environment variable
  - Falls back to live API call if not provided
  - Enables manual rate override for testing/stability

#### 2. Backend API Enhancements
- **POST `/api/run-test` Endpoint**:
  - Now accepts POST requests with JSON body: `{models?: string[], currency?: 'GBP'|'USD'}`
  - `models` parameter enables selective model testing (array of model IDs)
  - `currency` parameter controls cost conversion in response
  - Backward compatible: GET requests still work with all models

- **Response Format Updates**:
  - Added `cost_gbp` field to all model results
  - Converted using live or cached FX rate
  - Both `cost_usd` and `cost_gbp` returned for client-side flexibility

- **GET `/api/history` Enhancements**:
  - Returns `ts_ms` (epoch milliseconds) instead of string timestamps
  - Calculates `ts_ms = int(ts.timestamp()) * 1000` for JavaScript Date compatibility
  - Includes both `cost_usd` and computed `cost_gbp` for historical data
  - Enables numeric X-axis charting with proper date formatting

#### 3. Frontend Settings Drawer
- **Created SettingsDrawer Component** (`design-system/components/SettingsDrawer.tsx`):
  - Slide-out drawer using Radix UI Sheet primitives
  - **Model Selection**: Checkboxes for all 4 models
    - GPT-4o Mini (OpenAI)
    - Claude 3.5 Haiku (Anthropic)
    - Gemini 2.0 Flash (Google)
    - DeepSeek Chat (DeepSeek)
  - **Currency Toggle**: Switch between GBP and USD
  - **localStorage Persistence**:
    - `pulse.enabledModels`: JSON array of selected model IDs
    - `pulse.currency`: 'GBP' or 'USD' string
  - Default: GPT-4o Mini + Gemini 2.0 Flash in GBP

- **Created Sheet Component** (`design-system/components/ui/sheet.tsx`):
  - Wrapper around Radix UI Dialog with slide-in animation
  - SheetTrigger, SheetContent, SheetHeader, SheetTitle subcomponents
  - Responsive overlay with proper z-indexing

- **Created Checkbox Component** (`design-system/components/ui/checkbox.tsx`):
  - Radix UI Checkbox primitive with custom styling
  - Emerald checkmark icon using Lucide React
  - Accessible with proper ARIA attributes

#### 4. Chart Date Fix
- **PerformanceChart Component Updates** (`design-system/components/PerformanceChart.tsx`):
  - **HistoryPoint Interface**: Changed `timestamp: string` → `ts_ms: number`
  - **Numeric X-Axis**: XAxis now uses `type="number"` with `dataKey="ts_ms"`
  - **Date Formatting**: Added `formatTimestamp()` helper function
    - Converts epoch ms → locale date string
    - Format: "Oct 8, 14:30" (short month, day, time)
  - **Tick Formatter**: XAxis `tickFormatter={formatTimestamp}`
  - **Tooltip Enhancement**: Added `labelFormatter={formatTimestamp}` for hover labels
  - **Result**: Fixed "Invalid Date" errors in charts, proper date display on X-axis

#### 5. Blended Cost Per Million Tokens
- **Cost Calculation Method**:
  - Formula: `(cost / (in_tokens + out_tokens)) * 1_000_000`
  - Calculates cost per million tokens across entire conversation
  - Replaces previous simple cost display

- **Currency-Aware Calculation** (`app/page.tsx`):
  - `calculateBlendedCostPerMtok(result, currency)`:
    - Uses `result.cost_gbp` when currency is 'GBP'
    - Uses `result.cost_usd` when currency is 'USD'
    - Returns null if no cost data available
  - Critical fix: Ensures displayed cost matches selected currency

- **Currency Formatting Helper**:
  - `formatCurrency(amount, curr)`: Intl.NumberFormat with currency symbols
  - Displays £ for GBP, $ for USD
  - 4-6 decimal places for precision (e.g., £0.003456)

- **Applied to**:
  - Average Cost tile (dashboard header)
  - Latest Results table (Cost / Mtok column)
  - Both dynamically update when currency changes

#### 6. Next.js API Route Updates
- **POST Handler** (`app/api/run-test/route.ts`):
  - Added POST method alongside existing GET
  - Proxies request body to FastAPI backend
  - Enables selective model testing from frontend

- **Backward Compatibility**:
  - GET requests continue to work (test all models)
  - POST requests enable custom model selection

#### 7. Main Dashboard Integration
- **Settings Icon**: Gear icon button next to Refresh
- **Currency State Management**:
  - `useState<Currency>("GBP")` with localStorage sync
  - Updates propagate to all cost calculations
- **Model Selection State**:
  - `useState<string[]>` with default: ["gpt-4o-mini", "gemini-2.0-flash-exp"]
  - Passed to POST /api/run-test for selective testing
- **Refresh Function Update**:
  - Changed from GET to POST with `{models: enabledModels, currency}` body
  - Only tests selected models, returns costs in selected currency

#### 8. Critical Bug Fixes

##### Bug #1: Blended Cost Currency Mismatch ❌→✅
- **Issue**: `calculateBlendedCostPerMtok()` always used `cost_usd` even when GBP selected
- **Impact**: GBP costs showed USD values with £ symbol (incorrect conversion)
- **Fix**: 
  - Updated function to accept `curr: Currency` parameter
  - Branches on currency: `curr === 'GBP' ? result.cost_gbp : result.cost_usd`
  - All call sites now pass `currency` state variable
- **Locations Fixed**:
  - Line 153: Average cost tile calculation
  - Line 289: Results table cost column
- **Result**: Costs now correctly display in selected currency

---

## Current System Status

### ✅ Fully Operational Features
1. **Live Concurrent API Testing**: GPT-4o Mini & Gemini 2.0 Flash working
2. **PostgreSQL Persistence**: All test results stored with timestamps
3. **Historical Data Visualization**: Recharts displaying latency & TPS trends with proper date formatting
4. **Time-Range Filtering**: 24h/7d/30d toggle working correctly
5. **Metric Aggregation**: Average calculations for latency, TPS, blended cost per Mtok
6. **Full-Stack Integration**: Next.js ↔ FastAPI ↔ PostgreSQL pipeline complete
7. **Error Handling**: Graceful failure display for unavailable models
8. **Multi-Currency Support**: GBP/USD toggle with ExchangeRate-API integration (24h caching)
9. **Settings Drawer**: User-configurable model selection and currency preference
10. **localStorage Persistence**: Settings saved between sessions
11. **Selective Model Testing**: Only test enabled models to save API costs
12. **Blended Cost Calculation**: Cost per million tokens with currency-aware display

### ⚠️ Known Limitations
1. **Claude 3.5 Haiku**: Requires Anthropic API credits
2. **DeepSeek Chat**: Requires DeepSeek API credits (402 error)

### 🔧 Environment Setup Required
- `OPENAI_API_KEY` - ✅ Configured
- `ANTHROPIC_API_KEY` - ✅ Configured (needs credits)
- `GEMINI_API_KEY` - ✅ Configured
- `DEEPSEEK_API_KEY` - ✅ Configured (needs credits)
- `DATABASE_URL` - ✅ Configured (Replit PostgreSQL)

---

## Test Results Summary

### Latest Test Execution (October 6, 2025 18:46 UTC)
| Model | Status | Latency | TPS | Cost |
|-------|--------|---------|-----|------|
| GPT-4o Mini | ✅ Success | 1.165s | 54.92 | $0.000041 |
| Claude 3.5 Haiku | ❌ API Credits | - | - | - |
| Gemini 2.0 Flash | ✅ Success | 0.869s | 71.34 | $0.00 |
| DeepSeek Chat | ❌ Insufficient Balance | - | - | - |

### Database Statistics
- **Total Tests Executed**: 8
- **Unique Models Tested**: 4
- **Successful Tests**: 5 (GPT-4o Mini: 3, Gemini 2.0 Flash: 3)
- **Historical Data Range**: October 6, 2025

---

## File Structure

```
.
├── app/
│   ├── api/
│   │   ├── run-test/
│   │   │   └── route.ts          # Next.js API proxy for test execution
│   │   └── history/
│   │       └── route.ts          # Next.js API proxy for historical data
│   ├── page.tsx                  # Main dashboard component
│   ├── layout.tsx                # Root layout with Inter font
│   └── globals.css               # Tailwind CSS 4 configuration
├── design-system/
│   └── components/
│       ├── PerformanceChart.tsx  # Recharts visualization component
│       ├── SettingsDrawer.tsx    # Settings UI with model/currency selection
│       └── ui/                   # Radix UI-based components
│           ├── card.tsx
│           ├── button.tsx
│           ├── sheet.tsx         # Slide-out drawer component
│           └── checkbox.tsx      # Checkbox component
├── main.py                       # FastAPI backend with LLM testing
├── scheduler.py                  # Scheduled deployment script
├── package.json                  # Node.js dependencies
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── replit.md                    # Project documentation
└── CHANGELOG.md                 # This file
```

---

## Next Steps / Future Enhancements

### Potential Phase 3 Features
1. **Additional Models**: Add more LLM providers (Cohere, Mistral, etc.)
2. **Cost Tracking**: Cumulative cost dashboard over time
3. **Alert System**: Notify when latency exceeds thresholds
4. **Model Comparison**: Side-by-side performance analysis
5. **Export Functionality**: Download historical data as CSV/JSON
6. **Authentication**: User-specific test history and preferences
7. **Custom Prompts**: Allow users to test with their own prompts
8. **Real-time Streaming**: WebSocket-based live updates during tests

### Maintenance Notes
- Monitor API credit balance for Anthropic and DeepSeek
- Keep scheduler deployment running for continuous data collection
- Watch for API schema changes (especially Google GenAI usage fields)
- Consider adding retry logic for transient API failures

---

## Development Commands

```bash
# Install dependencies
npm install
pip install -r requirements.txt  # (implied from installed packages)

# Run frontend (port 5000)
npm run dev -- -p 5000

# Run backend (port 8000)
python main.py

# Database operations
# (No migrations needed - direct SQL CREATE TABLE was used)

# Test API endpoints
curl http://localhost:8000/api/run-test
curl http://localhost:8000/api/history?range=24h
curl http://localhost:5000/api/run-test
```

---

**Last Updated**: October 8, 2025  
**Current Version**: Phase 3 Complete (Multi-Currency + Settings UI)  
**Status**: ✅ Production Ready (2 of 4 models operational, GBP/USD support)
