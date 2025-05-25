# TrueNamePath - Context-Aware Identity Management API

**University Final Project (CM3035 Advanced Web Design)**

A context-aware identity management API that ensures the **right name** appears to the **right audience** every time. TrueNamePath solves the critical problem of multi-name identity management in global, diverse digital environments while maintaining GDPR compliance and privacy-by-design principles.

## 🚀 Quick Start

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd uni-final-project
yarn install

# Start Supabase local development
supabase start

# Generate database types
yarn db:types

# Start development server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see TrueNamePath in action!

## 🎯 The Problem TrueNamePath Solves

In our hyper-connected world, most digital platforms treat a **name** as a single, unchanging string. This breaks down when:

- **Jędrzej Lewandowski** appears in Gmail but everyone knows him as **JJ** on Slack  
- **李伟** (Li Wei) uses different name variants for HR vs. public forums
- **Alex Smith** goes by **@CodeAlex** in developer communities

**Result**: Misrouted emails, onboarding friction, and real harm from being mislabeled.

**TrueNamePath Solution**: Context-aware API that delivers the **right name variant** to each application based on audience, purpose, and user consent.

## 🏗️ Project Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, Mantine UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **TypeScript**: Full type safety across the entire stack
- **Testing**: Playwright for E2E tests with database integration
- **Monorepo**: Turbo + Yarn workspaces for scalable development

### Database Schema
This project implements a sophisticated **multi-name identity system**:

- **Profiles**: Core user entities with email and metadata
- **Names**: Multiple names per profile with different types and visibility levels
  - Types: `legal`, `preferred`, `nickname`, `alias`
  - Visibility: `public`, `internal`, `restricted`, `private`
- **Audit Trail**: Automatic tracking of all data changes
- **Row Level Security**: Comprehensive privacy and access controls

## 📦 Monorepo Structure

```
uni-final-project/
├── apps/
│   └── web/# Next.js frontend application
├── packages/
│   ├── ui/ # Shared Mantine components & theme
│   ├── database/   # Supabase client & generated types
│   ├── utils/  # Validation & formatting utilities
│   └── config/ # Shared ESLint & TypeScript configs
├── tests/e2e/  # Playwright integration tests
├── supabase/   # Database schema & migrations
└── .github/workflows/  # CI/CD automation
```

## 🛠️ Development Commands

### Root Level (All Packages)
```bash
yarn dev   # Start all development servers
yarn build # Build all packages
yarn lint  # Lint all packages
yarn lint:fix  # Fix linting issues
yarn type-check# TypeScript compilation check
yarn test:e2e  # Run Playwright tests
yarn test:e2e:ui   # Run tests in UI mode
yarn format# Format code with Prettier
```

### Database Operations
```bash
yarn db:types  # Generate TypeScript types from Supabase
supabase start # Start local Supabase stack
supabase stop  # Stop local services
supabase db reset  # Reset database with fresh migrations
```

### Package-Specific Commands
```bash
cd apps/web && yarn dev  # Next.js development server
cd packages/ui && yarn build # Build shared UI package
```

## 🧪 Testing Strategy

### Playwright E2E Tests
- **Database Integration**: Tests use real Supabase data
- **Multi-Browser**: Chrome, Firefox, Safari, Mobile
- **Page Objects**: Reusable test helpers and fixtures
- **CI Integration**: Automated testing on every PR

```bash
yarn test:e2e# Run all E2E tests
yarn test:e2e:ui # Interactive test runner
yarn test:e2e:headed # Run with browser UI visible
```

### Test Structure
```
tests/e2e/
├── auth/# Authentication flows
├── profiles/# Profile management tests  
├── names/   # Multi-name system tests
├── fixtures/# Test data and helpers
└── utils/   # Database and auth helpers
```

## 📋 Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature-name
   yarn dev  # Start development
   # Make your changes...
   yarn lint && yarn type-check  # Verify code quality
   yarn test:e2e # Run integration tests
   ```

2. **Adding Shared Code**
   - UI components → `packages/ui/src/`
   - Database utilities → `packages/database/src/`
   - Validation logic → `packages/utils/src/`

3. **Database Changes**
   ```bash
   supabase migration new your_migration_name
   # Edit the migration file
   supabase db reset # Test migration
   yarn db:types # Update TypeScript types
   ```

4. **Import Packages**
   ```typescript
   import { theme } from '@uni-final-project/ui';
   import { supabase } from '@uni-final-project/database';
   import { isValidEmail } from '@uni-final-project/utils';
   ```

## 🔗 Integration Setup

See [SETUP.md](./SETUP.md) for detailed instructions on:
- Supabase project configuration
- Vercel deployment setup
- GitHub Actions secrets
- Environment variables
- Production database setup

## 📝 Key Features

### Multi-Name Identity System
- Support for complex naming scenarios (legal vs. preferred names)
- Privacy controls for different contexts (professional vs. personal)
- Comprehensive audit trail for compliance
- Flexible name types and visibility levels

### Developer Experience
- **Hot Reload**: Instant feedback during development
- **Type Safety**: End-to-end TypeScript coverage
- **Code Quality**: Automated linting and formatting
- **Testing**: Comprehensive E2E test coverage
- **CI/CD**: Automated testing and deployment

### Production Ready
- **Performance**: Optimized builds with Turbo caching
- **Security**: Row Level Security and audit logging
- **Scalability**: Modular package architecture
- **Monitoring**: Structured logging and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Complete deployment setup
- [Architecture Decision Records](./docs/adr/) - Design decisions
- [API Documentation](./docs/api/) - Database schema and endpoints
- [Testing Guide](./docs/testing.md) - Writing and running tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for university final project demonstrating modern full-stack development practices.