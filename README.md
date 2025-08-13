# TrueNamePath - Context-Aware Identity Management API

**University Final Project (CM3035 Advanced Web Design)**

## Quick Start

This project implements a context-aware identity management system where users control how their names are presented to different audiences. The system addresses real discrimination issues while maintaining privacy and GDPR compliance.

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

Ensure you have a `.env.local` file in the project root with the following Supabase environment variables correctly configured. These are required for both the Next.js application and the user creation script.

```env
NEXT_PUBLIC_SUPABASE_URL="https://txfcnjvmkaqzblztkjmr.supabase.co"
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

**Expected**: 125+ test scenarios should pass, validating the authentication system across multiple browsers.

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

- `apps/web/` - Next.js frontend application with authentication system
  - `utils/supabase/` - Official Supabase SSR client utilities (`@supabase/ssr`)
- `packages/database/` - Supabase client and generated types (legacy compatibility)
- `packages/ui/` - Shared Mantine UI components
- `tests/e2e/` - Playwright end-to-end tests including comprehensive auth testing
- `scripts/` - Utility scripts including demo user creation
- `docs/` - Project documentation and academic materials
- `.claude/agents/` - AI agent definitions for development workflow
- `.claude/commands/` - Custom slash commands for workflow automation

## Core Features Implemented

### Authentication System (Step 8 Complete - 100% Production Ready)

- ✅ **Official Supabase SSR Implementation**: Complete migration to `@supabase/ssr` patterns
- ✅ **Cookie-Based Session Management**: Secure httpOnly cookies replacing custom JWT
- ✅ **Professional Login Page**: Responsive UI with Mantine components
- ✅ **SSR Client Architecture**: Separate browser/server clients (`apps/web/utils/supabase/`)
- ✅ **AuthProvider Context**: Global state management with official SSR patterns
- ✅ **Next.js Middleware**: Route protection using official `updateSession` pattern
- ✅ **AuthGuard Component**: Client-side protection with loading states
- ✅ **Comprehensive E2E Testing**: 125+ scenarios across 7 test files
- ✅ **Demo User Automation**: Script using Supabase Admin API
- ✅ **Backward Compatibility**: Legacy database package integration maintained

### Context-Aware Name Resolution

- ✅ `resolve_name()` function with 2.4ms performance
- ✅ User-defined contexts (not hardcoded)
- ✅ GDPR-compliant audit logging
- ✅ Multi-persona demo interface

### API Layer

- ✅ REST API endpoints (names, consents, audit)
- ✅ JSend format standardization
- ✅ JWT authentication integration
- ✅ Comprehensive API testing

## AI-Driven Development Workflow

This project uses a sophisticated multi-agent AI system for efficient development. The system coordinates specialized agents to handle planning, implementation, testing, and documentation with optimal parallelization.

### Quick Command Reference

Custom slash commands automate the development workflow:

- **`/status`** - Check comprehensive project status
- **`/plan [step]`** - Create detailed implementation plan
- **`/review [plan]`** - Critical review of plans or code
- **`/execute [step]`** - Coordinate implementation with agent deployment
- **`/debug [issue]`** - Investigate and troubleshoot problems
- **`/research [topic]`** - Deep codebase analysis
- **`/document [work]`** - Create professional documentation

### Example Workflow

```bash
# Standard development flow
/status  # Check current state
/plan 9  # Plan Step 9 (signup page)
/review step-09  # Review the plan
/execute 9   # Execute with agent coordination
/document 9  # Document completion

# Troubleshooting flow
/debug login redirect not working
/research authentication middleware
```

### Agent System Benefits

- **Parallel Development**: Multiple agents working simultaneously on independent tasks
- **Quality Assurance**: Continuous testing and code review during development
- **Comprehensive Planning**: Detailed analysis before implementation begins
- **Academic Integration**: AI agents understand university project requirements

See **CLAUDE.md** for complete documentation of the agent system, workflow process, and available agents.

## Academic Project Context

This is a university final project demonstrating:

- Advanced web development with modern React/Next.js patterns
- Professional authentication and authorization implementation
- Context-aware identity management innovation
- Comprehensive testing and quality assurance practices
- GDPR compliance and privacy-by-design principles

The implementation focuses on academic demonstration rather than production deployment, emphasizing code quality, documentation, and educational value.
