# Optaimi Pulse - LLM Performance Dashboard

## Overview

Optaimi Pulse is a Next.js 15 dashboard application for real-time performance and cost analysis of leading LLMs. The application displays performance metrics including latency, tokens per second, and cost per million tokens for 8 AI models from different providers (OpenAI, Anthropic, Google, DeepSeek). Built with Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS 4, it features a modern, responsive UI using Radix UI components.

## Recent Changes (October 6, 2025)
- Migrated from Pages Router to App Router architecture
- Created main dashboard at `app/page.tsx` with Optaimi Pulse branding
- Removed legacy `pages/` directory to resolve routing conflicts
- Configured development server to run on port 5000
- Added interactive "Run Test" button with simulated API testing (2-second delay)
- Displays 8 LLM models: gpt-5, gpt-5-mini, gpt-4o, gpt-realtime, Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Pro, DeepSeek-V3.2-Exp

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
- **Mock Data**: Currently uses simulated data with setTimeout (2 second delay) for demonstration

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

**Platform Integration**
- **Replit Environment**: Configured for Replit hosting with appropriate domain and port settings
- **Development Workflow**: Server workflow runs on port 5000 with `npm run dev`
- **No Database**: Currently no persistent storage or database integration
- **No API Integrations**: Mock data only; no actual AI model API calls implemented yet (simulated with 2-second setTimeout)

### Future Extensibility Considerations

The application is structured to easily add:
- Real API integrations with AI model providers
- Backend API routes in `pages/api/` or `app/api/` for server-side processing
- Database integration (would likely use Drizzle ORM based on common patterns)
- Authentication system for user-specific testing
- Result persistence and historical comparison features