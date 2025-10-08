# Optaimi Pulse - LLM Performance Dashboard

## Overview

Optaimi Pulse is a Next.js 15 dashboard application for real-time performance and cost analysis of leading LLMs. The application displays performance metrics including latency, tokens per second, and cost per million tokens for 8 AI models from different providers (OpenAI, Anthropic, Google, DeepSeek). Built with Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS 4, it features a modern, responsive UI using Radix UI components.

## Recent Changes (October 6, 2025)

### Phase 1-2 Implementation Complete ✅
- **Live Concurrent API Calls**: Real-time testing of 4 LLM models (gpt-4o-mini, claude-3-5-haiku-20241022, gemini-2.0-flash-exp, deepseek-chat)
- **PostgreSQL Persistence**: Database table `results` storing test history with timestamps, latency, TPS, cost, and error tracking
- **Historical Charts**: Performance visualization with Recharts showing latency and tokens/sec trends over time
- **Time-Range Toggle**: 24h/7d/30d filtering for historical data analysis
- **Metric Summary Tiles**: Real-time calculation and display of average latency, average TPS, and average cost
- **Full-Stack Integration**: Next.js API routes proxying to FastAPI backend with proper error handling
- **Component Architecture**: PerformanceChart moved to design-system/components/ for proper path resolution
- **Google GenAI Fix**: Corrected import from `from google import genai` to `import google.generativeai as genai`
- **Scheduled Deployment**: scheduler.py configured for automated 15-minute testing intervals
- **Design System**: Emerald accent colors (#10b981), Inter font, tabular-nums for metrics, large rounded cards

## User Preferences

Preferred communication style: Simple, everyday language.

## Important: Project Documentation

**CHANGELOG.md**: This project maintains a comprehensive changelog (`CHANGELOG.md`) that documents all changes, architecture decisions, and implementation details. **After any significant change to the project, update CHANGELOG.md** to keep it current. This helps maintain project context across sessions and assists collaboration.

## System Architecture

### Frontend Architecture

**Framework Choice: Next.js 15 with App Router**
- **Rationale**: Leverages the modern App Router for improved routing, layouts, and server components capabilities
- **Client-Side Rendering**: The main page (`app/page.tsx`) uses `"use client"` directive for interactive state management
- **TypeScript**: Full TypeScript support for type safety throughout the application

**Styling System: Tailwind CSS 4 with CSS Variables**
- **Rationale**: Provides utility-first styling with the latest Tailwind version for maximum flexibility
- **Design Token System**: Uses CSS custom properties (variables) for theming with OKLCH color space for better color consistency
- **Dark Mode Support**: Built-in dark mode theming with `.dark` class variant system
- **Component Library**: Custom design system based on shadcn/ui patterns with Radix UI primitives

**Component Architecture**
- **Design System Separation**: Components organized in `design-system/` directory for modularity and reusability
- **Compound Components**: Card components use compound component pattern (Card, CardHeader, CardTitle, etc.) for flexible composition
- **Radix UI Primitives**: Uses unstyled, accessible components from Radix UI (@radix-ui/react-dialog, react-label, react-slider, react-slot) as foundation
- **Class Variance Authority**: Implements CVA for variant-based component styling (button variants, sizes)
- **Utility Function**: `cn()` utility combines clsx and tailwind-merge for efficient className handling

**State Management**
- **React Hooks**: Uses built-in useState for local component state
- **No External State Library**: Simple application state doesn't require Redux/Zustand/etc.

### Application Structure

**Path Aliasing Configuration**
- **TypeScript Paths**: Configured `@/*` alias pointing to both root and `design-system/` directories
- **Rationale**: Simplifies imports and allows flexible component location without deep relative paths

**Page Structure**
- **Single Page Application**: Main functionality contained in `app/page.tsx`
- **Model Results Display**: Displays 8 AI models with performance metrics in card format
- **API Integration**: Fetches real data from FastAPI backend when "Run Test" button is clicked

### Build and Development Configuration

**Next.js Configuration**
- **Replit Integration**: Custom `allowedDevOrigins` configuration for Replit environment compatibility
- **Development Server**: Configured to run on port 5000 with 0.0.0.0 hostname for Replit accessibility

**TypeScript Configuration**
- **Target**: ES6 for broad compatibility
- **Module Resolution**: Uses bundler mode for modern build tools
- **Strict Mode**: Enabled for maximum type safety
- **JSX**: Preserve mode for Next.js transformation

**Build System**
- **Next.js Built-in**: Uses Next.js internal webpack/turbopack bundling
- **No Custom Webpack Config**: Relies on Next.js defaults for optimal performance

### Backend Architecture

**Framework Choice: FastAPI (Python)**
- **Rationale**: Lightweight, fast, and modern Python web framework for building APIs
- **CORS Middleware**: Configured to allow all origins, methods, and headers for development
- **Type Safety**: Uses Pydantic for request/response validation (implicit through FastAPI)

**API Endpoints**
- **GET /api/run-test**: Executes concurrent tests on 4 LLM models and returns performance metrics
  - Tests: gpt-4o-mini, claude-3-5-haiku-20241022, gemini-2.0-flash-exp, deepseek-chat
  - Response format: `{"results": [{"model": str, "provider": str, "display_name": str, "latency_s": float, "tps": float, "cost_usd": float, "in_tokens": int, "out_tokens": int, "error": str|null}, ...]}`
  - Stores results in PostgreSQL `results` table for historical tracking
- **GET /api/history**: Returns historical test results with time-range filtering
  - Query params: `model` (optional), `range` (24h/7d/30d)
  - Response format: `{"history": [{"ts": str, "provider": str, "model": str, "latency_s": float, "tps": float, "cost_usd": float, ...}], "range": str, "model": str|null}`

**Server Configuration**
- **Host**: 0.0.0.0 (accessible from all network interfaces)
- **Port**: 8000 (mapped to external port 8000 in Replit)
- **ASGI Server**: Uvicorn with standard extras for WebSocket and HTTP/2 support

**Frontend-Backend Communication**
- **URL Construction**: Frontend uses `${window.location.protocol}//${window.location.hostname}:8000/api/run-test`
- **Port Mapping**: Replit exposes both port 5000 (frontend/webview) and port 8000 (backend API)
- **Cross-Origin**: CORS enabled on backend allows requests from frontend domain

### External Dependencies

**Core Framework**
- **next**: ^15.2.3 - React framework with server-side rendering and routing
- **react**: ^19.0.0 - UI library (latest version)
- **react-dom**: ^19.0.0 - React DOM rendering

**UI Component Libraries**
- **@radix-ui/react-dialog**: ^1.1.15 - Accessible dialog/modal primitives
- **@radix-ui/react-label**: ^2.1.7 - Accessible label components
- **@radix-ui/react-slider**: ^1.3.6 - Accessible slider/range input
- **@radix-ui/react-slot**: ^1.2.3 - Component composition utility
- **lucide-react**: ^0.544.0 - Icon library (Zap, RefreshCw, TrendingUp, DollarSign, Gauge icons used)
- **recharts**: ^3.2.1 - Composable charting library for React (LineChart for performance history)

**Styling Dependencies**
- **tailwindcss**: ^4.0.15 - Utility-first CSS framework
- **tailwind-merge**: ^3.3.1 - Utility for merging Tailwind classes intelligently
- **clsx**: ^2.1.1 - Conditional className utility
- **class-variance-authority**: ^0.7.1 - Variant-based component styling system

**Development Tools**
- **typescript**: ^5.8.2 - Type system and compiler
- **eslint**: ^9.23.0 - Code linting
- **eslint-config-next**: ^15.2.3 - Next.js specific ESLint rules
- **@types/node**: ^22.13.11 - Node.js type definitions
- **@types/react**: ^19.0.12 - React type definitions
- **@types/react-dom**: ^19.0.4 - React DOM type definitions

**Backend Dependencies (Python)**
- **fastapi**: ^0.118.0 - Modern Python web framework for building APIs
- **uvicorn[standard]**: ^0.37.0 - ASGI server with WebSocket and HTTP/2 support
- **pydantic**: ^2.11.10 (dependency of FastAPI) - Data validation using Python type annotations
- **psycopg2-binary**: ^2.9.x - PostgreSQL database adapter for Python
- **openai**: Latest - OpenAI API client for GPT-4o Mini testing
- **anthropic**: Latest - Anthropic API client for Claude 3.5 Haiku testing
- **google-generativeai**: Latest - Google GenAI API client for Gemini 2.0 Flash testing
- **httpx**: Latest - HTTP client for DeepSeek API calls

**Database Schema**
- **Table: results** - Stores LLM test results with the following columns:
  - `id`: serial primary key (auto-incrementing)
  - `ts`: timestamp with time zone (defaults to CURRENT_TIMESTAMP)
  - `provider`: varchar (model provider: OpenAI, Anthropic, Google, DeepSeek)
  - `model`: varchar (model identifier: gpt-4o-mini, claude-3-5-haiku-20241022, etc.)
  - `latency_s`: numeric (test latency in seconds)
  - `tps`: numeric (tokens per second)
  - `cost_usd`: numeric (cost in USD)
  - `in_tokens`: integer (input token count)
  - `out_tokens`: integer (output token count)
  - `error`: text (error message if test failed, null if successful)

**Platform Integration**
- **Replit Environment**: Configured for Replit hosting with appropriate domain and port settings
- **Parallel Workflows**: 
  - Frontend: Next.js dev server on port 5000 (webview output)
  - Backend: FastAPI/Uvicorn server on port 8000 (console output)
- **Port Configuration**: Replit exposes both port 5000 (frontend) and port 8000 (backend API)
- **PostgreSQL Database**: Replit PostgreSQL database configured with environment variables (DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT)
- **Real LLM Testing**: Backend makes actual API calls to OpenAI, Anthropic, Google GenAI, and DeepSeek providers with results persisted to database

### Future Extensibility Considerations

The application is structured to easily add:
- Real API integrations with AI model providers (replacing mock backend data)
- Additional backend endpoints for specific model testing or benchmarking
- Database integration for result persistence (would likely use PostgreSQL with Drizzle ORM)
- Authentication system for user-specific testing and result tracking
- Historical comparison features and trend analysis
- Caching layer for API responses (Redis or in-memory caching)