# Leads Exchange Platform

## Overview

This is a comprehensive leads exchange platform built as a full-stack web application. The platform enables users to submit, browse, and manage business leads with a credit-based viewing system. It features role-based access control with three user types: regular users, admins, and superadmins. The application uses a modern tech stack with React frontend, Express backend, and PostgreSQL database, all designed to run within a single Replit project.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: JWT token-based authentication with context provider for user state
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Middleware**: Custom authentication middleware with role-based access control
- **API Design**: RESTful endpoints organized by feature (auth, leads, admin, superadmin)

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Core Tables**: 
  - Users table with role-based permissions (user, admin, superadmin)
  - Leads table with status tracking (pending, approved, rejected)
  - Lead views table for tracking credit usage
  - Credit transactions table for audit trail
- **Relationships**: Proper foreign key relationships between users, leads, and transactions

### Authentication & Authorization
- **JWT Implementation**: Stateless authentication with 7-day token expiration
- **Role Hierarchy**: Three-tier system (user < admin < superadmin) with progressive permissions
- **Protected Routes**: Frontend route protection based on user roles
- **Middleware Protection**: Server-side endpoint protection with role validation

### Credit System Architecture
- **Credit Economy**: Users consume credits to view leads submitted by others
- **Transaction Tracking**: Complete audit trail of all credit additions, deductions, and administrative changes
- **Automatic Deduction**: Real-time credit deduction when viewing leads with immediate UI updates
- **Administrative Control**: Superadmin capabilities for credit management and user administration

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **@tanstack/react-query**: Server state management and data synchronization
- **wouter**: Lightweight routing library for single-page application navigation

### UI and Styling
- **@radix-ui/**: Complete set of accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Modern icon library with React components

### Authentication and Security
- **jsonwebtoken**: JWT token generation and verification for stateless authentication
- **bcryptjs**: Password hashing library for secure credential storage
- **zod**: Runtime type validation for API inputs and form validation

### Development Tools
- **typescript**: Static type checking for improved developer experience
- **vite**: Modern build tool with hot module replacement
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution environment for development server

### Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Code navigation and project mapping
- **@replit/vite-plugin-dev-banner**: Development environment indicators