# TrueNamePath - Context-Aware Identity Management API

**University Final Project (CM3035 Advanced Web Development)**

## Overview

TrueNamePath is an innovative context-aware identity management system that addresses name-based discrimination in digital environments. The system allows users to control how their names are presented to different audiences while maintaining privacy and GDPR compliance.

### Problem Statement

Many individuals face discrimination based on their names in professional and social contexts. Traditional identity systems present static name information regardless of context, potentially exposing users to bias. This project demonstrates a technical solution that enables dynamic, context-appropriate name presentation while preserving user privacy and control.

### Technical Innovation

The system implements OAuth/OIDC-compliant context-aware name resolution, allowing external applications to receive appropriate name variants based on user-defined contexts and consent preferences. This represents a novel application of existing identity provider patterns to address social discrimination issues.

## Prerequisites

- Node.js (v18 or later)
- Yarn package manager
- Supabase account access

## Installation

1. Clone the repository
2. Install dependencies: `yarn install`
3. Configure environment variables (see Authentication Setup below)
4. Create demo users: `node scripts/create-demo-users.js`
5. Start development server: `yarn dev`

## Authentication Setup

This project uses official Supabase SSR (Server-Side Rendering) patterns for authentication with the `@supabase/ssr` package. The system implements cookie-based session management for secure, production-ready authentication. To run the application locally with working authentication, you must first create the required demo users in your Supabase instance.

### 1. Prerequisites

Create a `.env.local` file in the project root with your Supabase project credentials. You'll need to create a Supabase project and obtain these values from your project dashboard.

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

> **Security Warning**: The `SUPABASE_SERVICE_ROLE_KEY` provides administrative access to your Supabase project. **Never** commit this key to version control or expose it in client-side code.

### 2. Create Demo Users

We have a script that securely creates the demo users using the Supabase Admin API. This script reads your `.env.local` file for credentials.

Run the script from the project root:

```bash
node ./scripts/create-demo-users.js
```

**Expected Outcome**: You should see a success message in your terminal for each user created:

```
Successfully created user: JJ Adams (jj@truename.test)
Successfully created user: Li Wei (liwei@truename.test)
Successfully created user: Alex Reiter (alex@truename.test)
All demo users created successfully.
```

**Troubleshooting**:

- **Error: `AuthApiError: Database error saving new user`**: Verify that your `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is correct and has not been revoked.
- **Error: `TypeError: fetch failed`**: Check your internet connection and ensure `NEXT_PUBLIC_SUPABASE_URL` is correct and reachable.
- **"User already exists" error**: Users were created successfully in a previous run - you can proceed to testing.

### 3. Test Login Functionality

After creating the demo users, you can test the login flow in the running application.

1. Start the development server: `yarn dev`
2. Navigate to `http://localhost:3000/auth/login`
3. Use one of the following credentials:
   - **Email**: `jj@truename.test`, **Password**: `demo123!`
   - **Email**: `liwei@truename.test`, **Password**: `demo123!`
   - **Email**: `alex@truename.test`, **Password**: `demo123!`

Upon successful login, you should be redirected to the `/dashboard`.

### 4. Verify Context-Aware Name Resolution

1. After logging in, navigate to `http://localhost:3000/demo`
2. You should see different names displayed based on the selected audience context
3. Try different personas to see how names change contextually

### 5. Run Authentication E2E Tests

The project includes a comprehensive suite of Playwright tests for the authentication flow. To run them, use the following command:

```bash
yarn test:e2e tests/e2e/auth/
```

This will execute all 7 test files located in the `tests/e2e/auth/` directory, covering UI, functionality, and integration scenarios.

**Expected**: Comprehensive test scenarios should pass, validating the authentication system across multiple browsers.

## Development Commands

### Root Level (Turbo monorepo)

- `yarn dev` - Start development servers for all apps
- `yarn build` - Build all packages
- `yarn test` - Run unit tests for all packages
- `yarn test:e2e` - Run Playwright end-to-end tests
- `yarn lint` - Lint all packages
- `yarn format` - Format code with Prettier

### Authentication-Specific Testing

- `yarn test:e2e tests/e2e/auth/` - Run only authentication E2E tests
- `yarn test:e2e:ui` - Run Playwright tests with UI mode
- `yarn test:e2e:headed` - Run Playwright tests in headed mode

## Project Structure

This is a monorepo using Turborepo and Yarn workspaces:

- `apps/web/` - Next.js main application with authentication and dashboard
  - `utils/supabase/` - Supabase SSR client utilities (`@supabase/ssr`)
- `apps/demo-hr/` - Demo HR application showcasing professional context
- `apps/demo-chat/` - Demo chat application showcasing casual context
- `packages/database/` - Supabase client and generated types
- `packages/ui/` - Shared Mantine UI components
- `packages/e2e-tests/` - Playwright end-to-end test suite
- `packages/truename-oauth/` - Shared OAuth integration library
- `scripts/` - Utility scripts including demo user creation
- `docs/` - Project documentation and academic materials
- `supabase/` - Database migrations and SQL functions

## Core Features

### Authentication System

- ✅ **Supabase SSR Implementation**: Built with official `@supabase/ssr` patterns
- ✅ **Cookie-Based Session Management**: Secure httpOnly cookies for session handling
- ✅ **Responsive Login Interface**: Professional UI built with Mantine components
- ✅ **SSR Client Architecture**: Separate browser/server clients for optimal performance
- ✅ **Global Authentication Context**: Centralized state management
- ✅ **Route Protection**: Next.js middleware with session validation
- ✅ **Comprehensive Testing**: End-to-end test coverage for all authentication flows
- ✅ **Demo User Management**: Automated user creation for testing and demonstration

### Context-Aware Name Resolution

- ✅ **OAuth/OIDC Compliance**: Standards-compliant identity resolution
- ✅ **User-Defined Contexts**: Flexible context system without hardcoded values
- ✅ **Privacy-by-Design**: GDPR-compliant audit logging and consent management
- ✅ **Multi-Persona Interface**: Demonstration of different identity presentations

### API Architecture

- ✅ **RESTful Endpoints**: Complete API for names, contexts, and consent management
- ✅ **Standardized Responses**: JSend format for consistent API responses
- ✅ **Secure Authentication**: JWT-based API authentication
- ✅ **Comprehensive Testing**: Full test coverage for all API endpoints

### Demo Applications

- ✅ **HR Application**: Professional context demonstration
- ✅ **Chat Application**: Casual context demonstration
- ✅ **OAuth Integration**: Complete OAuth flows for external applications

## Academic Project Context

This project was developed as the final project for the Bachelor of Computer Science degree at the University of London (CM3035 Advanced Web Development), demonstrating:

- **Modern Web Development**: Advanced React/Next.js patterns and TypeScript implementation
- **Authentication Systems**: Professional-grade authentication and authorization
- **Technical Innovation**: Novel application of OAuth/OIDC for context-aware identity management
- **Quality Assurance**: Comprehensive testing strategies and quality assurance practices
- **Privacy Engineering**: GDPR compliance and privacy-by-design principles
- **Full-Stack Development**: Complete system from database design to user interface

The project emphasizes technical excellence, innovative problem-solving, and professional software engineering practices suitable for academic evaluation and portfolio presentation.

## Technologies Used

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Mantine UI** - Professional component library
- **SWR** - Data fetching and caching

### Backend & Database

- **Supabase** - PostgreSQL database with real-time features
- **PostgreSQL** - Relational database with custom functions
- **Supabase Auth** - Authentication with SSR support

### Testing & Quality

- **Playwright** - End-to-end testing framework
- **Vitest** - Unit testing framework
- **ESLint & Prettier** - Code quality and formatting

### DevOps & Tooling

- **Turborepo** - Monorepo build system
- **Yarn Workspaces** - Package management
- **Vercel** - Deployment platform for demo applications

## Getting Started

To run this project locally, you'll need to:

1. Set up a Supabase project and configure environment variables
2. Run the database migrations
3. Create demo users for testing
4. Start the development server

Follow the detailed setup instructions in the Authentication Setup section above for complete configuration steps.

## Demo Applications

The project includes two deployed demo applications that showcase different identity contexts:

- **Demo HR Application**: Demonstrates professional identity presentation in corporate environments
- **Demo Chat Application**: Shows casual identity presentation in social contexts

Both applications integrate with the main TrueNamePath API using OAuth flows to demonstrate context-aware name resolution in real-world scenarios.
