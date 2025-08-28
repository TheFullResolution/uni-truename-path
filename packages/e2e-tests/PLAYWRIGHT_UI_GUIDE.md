# Playwright UI Mode Guide

This guide explains how to use Playwright UI mode with the TrueNamePath project.

## Background

Due to Playwright UI's architectural limitations with project dependencies, we use a separate configuration file for UI mode that ensures all tests are visible in the interface.

## Quick Start

### Option 1: Use Existing Authentication (Recommended)

If authentication state already exists:

```bash
# From project root
yarn test:e2e:ui
```

### Option 2: Fresh Setup

If no authentication state exists or you need fresh credentials:

```bash
# From project root
yarn workspace @uni-final/e2e-tests test:ui:with-setup
```

## Available Commands

### From Project Root

- `yarn test:e2e:ui` - Launch UI mode with all tests visible
- `yarn test:e2e` - Run all tests in CLI (with automatic setup)
- `yarn test:e2e:headed` - Run tests in headed mode

### From packages/e2e-tests Directory

- `yarn test:ui` - Launch UI mode with all tests visible
- `yarn test:ui:with-setup` - Run setup then launch UI
- `yarn test:setup` - Run authentication setup only
- `yarn test` - Run all tests in CLI

## How It Works

### Configuration Files

- `playwright.config.ts` - Main config with setup dependencies (for CLI/CI)
- `playwright.config.ui.ts` - UI-specific config without dependencies (for UI mode)

### Authentication State

- Authentication state is stored in `playwright/.auth/user.json`
- Created automatically by setup project
- Reused across UI sessions for performance
- Expires after ~2 hours (refresh by running setup again)

## Troubleshooting

### "No tests visible in UI"

Run setup first:

```bash
yarn test:setup
yarn test:ui
```

### "Authentication failed in UI"

The auth state may be expired. Run:

```bash
yarn test:ui:with-setup
```

### "Tests failing with auth errors"

Delete old auth state and recreate:

```bash
rm -f playwright/.auth/user.json
yarn test:setup
yarn test:ui
```

## Development Workflow

1. **First time setup**:

   ```bash
   yarn test:ui:with-setup
   ```

2. **Daily development**:

   ```bash
   yarn test:e2e:ui  # Uses existing auth
   ```

3. **When auth expires** (~2 hours):
   ```bash
   yarn test:setup
   yarn test:ui
   ```

## Test Coverage

The UI now shows all 20 tests across 6 files:

- ✅ Demo HR OAuth Integration (4 tests)
- ✅ OAuth Complete Flow (5 tests)
- ✅ Dashboard Layout and Navigation (6 tests)
- ✅ User Signup Flow (3 tests)
- ✅ Context Constraints (1 test)
- ✅ Setup authentication (1 test)

## Why Two Configs?

Playwright UI mode has a known limitation where it doesn't handle project dependencies like CLI mode does. The separate UI config removes dependencies so all tests are visible, while the main config keeps dependencies for automated execution.

This gives us:

- **UI Mode**: All tests visible for development and debugging
- **CLI Mode**: Optimized execution with automatic setup for CI/automation
- **Best of both worlds**: Developer experience + automation reliability
