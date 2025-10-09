# Optaimi Pulse - LLM Performance Dashboard

## Overview

Optaimi Pulse is a Next.js 15 dashboard for real-time performance and cost analysis of leading LLMs. It displays metrics like latency, tokens per second, and cost per million tokens for 8 AI models from various providers (OpenAI, Anthropic, Google, DeepSeek). The project's ambition is to provide a modern, responsive UI for comprehensive LLM performance monitoring and cost analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

Optaimi Pulse uses Next.js 15 with the App Router for its modern routing and server components. Styling is handled by Tailwind CSS 4, leveraging CSS variables for theming with OKLCH color space and built-in dark mode support. The component library is a custom design system based on shadcn/ui patterns, utilizing Radix UI primitives for accessibility. State management primarily uses React Hooks, with no external state library.

### Backend Architecture

The backend is built with FastAPI (Python), chosen for its speed and lightweight nature. It includes CORS middleware for development flexibility. API endpoints handle concurrent LLM tests and provide historical data with time-range filtering. The server uses Uvicorn as an ASGI server. Frontend-backend communication is managed via URL construction and Replit's port mapping.

### Authentication System

The application features an internal database-based authentication system, migrating from Replit Auth. It supports email/password login (with bcryptjs hashing), email verification via Brevo, passwordless magic links, and a full password reset flow. Secure, 32-byte random session IDs are stored in PostgreSQL with server-side validation and 7-day expiration.

### System Design Choices

*   **Multi-Currency Support**: Includes GBP/USD toggle with ExchangeRate-API integration and localStorage persistence for user settings.
*   **Selective Model Testing**: Backend API allows testing only enabled models.
*   **Blended Cost Per Mtok**: Displays cost calculation dynamically based on selected currency.
*   **Historical Charts**: Uses Recharts for visualizing latency and tokens/sec trends with time-range filtering (24h/7d/30d).
*   **Real-time Metrics**: Displays average latency, TPS, and cost in summary tiles.
*   **Scheduled Testing**: `scheduler.py` configures automated 15-minute testing intervals.
*   **Branding**: Integrated "Optaimi Spark" branding with official logo and favicon applied to both landing page and dashboard.
*   **Alert Settings Navigation**: Dashboard header includes Bell icon button linking to `/alerts` page for alert configuration.
*   **Auto-Refresh System**: Dashboard automatically refreshes LLM performance data every 2 hours for all enabled models to ensure historical charts remain up-to-date.
*   **User Session Management**: Logout button in dashboard header terminates session and redirects to sign-in page with error handling.

### Deployment Configuration

*   **Production Deployment**: Autoscale deployment running both frontend (Next.js on port 5000) and backend (FastAPI on port 8000) in the same container.
*   **Run Command**: `uvicorn main:app --host 0.0.0.0 --port 8000 & npm run start -- --port 5000 & wait`
*   **Build Command**: `npm run build`
*   **Critical**: Both services must run together in production for the application to function correctly. The frontend proxies all backend requests.

## External Dependencies

*   **Frameworks**: Next.js 15, React 19, FastAPI, Uvicorn
*   **Styling**: Tailwind CSS 4, Radix UI (dialog, label, slider, slot), Lucide React (icons), Recharts (charting)
*   **Utilities**: `tailwind-merge`, `clsx`, `class-variance-authority`
*   **Database**: PostgreSQL (`psycopg2-binary`)
    *   **Table: `results`**: Stores LLM test data (`id`, `ts`, `provider`, `model`, `latency_s`, `tps`, `cost_usd`, `in_tokens`, `out_tokens`, `error`).
*   **LLM Providers**: OpenAI, Anthropic, Google Generative AI, DeepSeek
*   **Email Service**: Brevo (for authentication emails)
*   **Currency Exchange**: ExchangeRate-API
*   **Development Tools**: TypeScript, ESLint