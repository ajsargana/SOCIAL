# FlowPulse

## Overview

FlowPulse is an AI-driven autonomous social media posting platform designed for influencers and brands. The system automatically detects posting gaps, generates on-brand captions using LLMs, learns brand voice over time, and either auto-posts or requests user approval before publishing. It's built to handle 1,000–10,000 users with 2–4 connected social accounts each.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme featuring glassmorphism and gradient accents
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful JSON APIs under `/api` prefix
- **Build Process**: Custom esbuild script bundles server with select dependencies for faster cold starts

### Core Engine Components (server/src/)
- **Decision Engine**: Evaluates when to post based on user settings, posting gaps, and engagement patterns
- **Policy Engine**: Validates content and enforces posting rules (rate limits, approval requirements)
- **Action Orchestrator**: Executes decisions by generating captions and scheduling posts
- **Scheduler**: Background job processing for evaluations, posting, and analytics
- **Memory System**: 
  - MemoryReader: Builds brand profiles from post history
  - MemoryWriter: Records posts and engagement for learning

### AI Integration (server/src/ai/)
- **LLM Client**: Abstraction layer for LLM API calls (configured for OpenAI-compatible endpoints)
- **Caption Generator**: Platform-specific caption generation with hashtag support and brand voice adaptation

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Key Tables**: users, social_accounts, posts, autopilot_settings, decisions, waitlist_entries
- **Migrations**: Managed via drizzle-kit (`db:push` command)

### Design System
- Dark theme with radial gradient backgrounds
- Glassmorphism effects using backdrop-blur
- Primary gradient: emerald (#22c55e) to blue (#3b82f6)
- Glass surfaces with semi-transparent overlays
- Detailed specifications in `design_guidelines.md`

## External Dependencies

### Database
- PostgreSQL (required, connection via DATABASE_URL environment variable)
- Drizzle ORM for type-safe queries
- connect-pg-simple for session storage

### AI/LLM Services
- OpenAI API (or compatible endpoints) for caption generation
- Configuration via environment variables (API key, base URL)

### Third-Party Libraries
- Radix UI: Accessible component primitives
- TanStack Query: Data fetching and caching
- react-hook-form with zod: Form validation
- date-fns: Date manipulation
- embla-carousel: Carousel functionality
- recharts: Charting library

### Development Tools
- Vite: Frontend development server with HMR
- esbuild: Server bundling for production
- TypeScript: Type checking across full stack
- Replit-specific plugins for development banners and error overlays