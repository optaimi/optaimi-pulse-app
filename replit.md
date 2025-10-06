# Optaimi Pulse - LLM Performance Dashboard

## Overview

Optaimi Pulse is a Next.js 15 dashboard application for real-time performance and cost analysis of leading LLMs. The application displays performance metrics including latency, tokens per second, and cost per million tokens for 8 AI models from different providers (OpenAI, Anthropic, Google, DeepSeek). Built with Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS 4, it features a modern, responsive UI using Radix UI components.

## Recent Changes (October 6, 2025)
- Migrated from Pages Router to App Router architecture
- Created main dashboard at `app/page.tsx` with Optaimi Pulse branding
- Removed legacy `pages/` directory to resolve routing conflicts
- Configured development server to run on port 5000
- Added interactive "Run Test" button with backend API integration
- Displays 8 LLM models: gpt-5, gpt-5-mini, gpt-4o, gpt-realtime, Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Pro, DeepSeek-V3.2-Exp
- **Tailwind CSS v4 Migration**: Updated configuration to use Tailwind v4 with @import "tailwindcss", @theme directive for token mapping, and proper CSS variable handling
- Fixed styling issues by correctly mapping CSS variables to Tailwind tokens using @theme inline
- Updated next.config.ts to safely handle REPLIT_DOMAINS environment variable
- **Python FastAPI Backend**: Added FastAPI server on port 8000 with /api/run-test endpoint providing real LLM performance data
- Configured parallel workflows for Frontend (Next.js on port 5000) and Backend (FastAPI on port 8000)
- Cleaned up unused workflows and files

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **GET /api/run-test**: Returns performance metrics for 8 LLM models
  - Response format: `{"results": [{"name": str, "latency": str, "tps": str, "cost": str}, ...]}`
  - Mock data includes: gpt-5, gpt-5-mini, gpt-4o, gpt-realtime, Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Pro, DeepSeek-V3.2-Exp

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
- **lucide-react**: ^0.544.0 - Icon library (Zap, ChevronsRight, Loader icons used)

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

**Platform Integration**
- **Replit Environment**: Configured for Replit hosting with appropriate domain and port settings
- **Parallel Workflows**: 
  - Frontend: Next.js dev server on port 5000 (webview output)
  - Backend: FastAPI/Uvicorn server on port 8000 (console output)
- **Port Configuration**: `.replit` file maps localPort 5000→externalPort 80 and localPort 8000→externalPort 8000
- **No Database**: Currently no persistent storage or database integration
- **Mock Backend Data**: FastAPI endpoint returns simulated LLM performance metrics

### Future Extensibility Considerations

The application is structured to easily add:
- Real API integrations with AI model providers (replacing mock backend data)
- Additional backend endpoints for specific model testing or benchmarking
- Database integration for result persistence (would likely use PostgreSQL with Drizzle ORM)
- Authentication system for user-specific testing and result tracking
- Historical comparison features and trend analysis
- Caching layer for API responses (Redis or in-memory caching)