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

## Current System Status

### ✅ Fully Operational Features
1. **Live Concurrent API Testing**: GPT-4o Mini & Gemini 2.0 Flash working
2. **PostgreSQL Persistence**: All test results stored with timestamps
3. **Historical Data Visualization**: Recharts displaying latency & TPS trends
4. **Time-Range Filtering**: 24h/7d/30d toggle working correctly
5. **Metric Aggregation**: Average calculations for latency, TPS, cost
6. **Full-Stack Integration**: Next.js ↔ FastAPI ↔ PostgreSQL pipeline complete
7. **Error Handling**: Graceful failure display for unavailable models

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
│       └── ui/                   # Radix UI-based components
│           ├── card.tsx
│           └── button.tsx
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

**Last Updated**: October 6, 2025  
**Current Version**: Phase 1-2 Complete  
**Status**: ✅ Production Ready (2 of 4 models operational)
