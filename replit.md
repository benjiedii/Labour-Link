# Overview

This is a full-stack web application for restaurant labor management, designed to track employee check-ins, calculate labor hours, and monitor revenue center performance. The application provides real-time dashboards for managing staffing efficiency across different restaurant areas (dining, lounge, patio) with sales tracking and labor cost analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot module reloading with Vite integration for full-stack development

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Development Storage**: In-memory storage implementation for local development
- **Data Validation**: Zod schemas for runtime type checking and API validation

## Core Data Models
- **Employees**: Track staff with check-in times, revenue center assignments, and active status
- **Revenue Centers**: Manage different restaurant areas with sales data and efficiency divisors
- **Time Tracking**: Real-time calculation of labor hours since employee check-in

## External Dependencies

### Database & ORM
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: TypeScript ORM for database operations
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

### UI Framework & Styling
- **@radix-ui/***: Accessible, unstyled UI primitives for all interactive components
- **tailwindcss**: Utility-first CSS framework with custom design system
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library for consistent iconography

### State Management & Forms
- **@tanstack/react-query**: Server state management with caching and synchronization
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Validation resolver for Zod integration

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: URL-safe unique ID generator
- **zod**: Runtime type validation and schema definition