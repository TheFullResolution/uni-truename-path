# TrueNamePath E2E Testing Suite

This package contains end-to-end tests for the TrueNamePath project using Playwright.

## Quick Start

### CLI Mode (CI/CD and Normal Testing)

```bash
# Run all tests (recommended for CI)
yarn test:e2e

# Run specific tests
yarn test:e2e --grep "OAuth"
```

### UI Mode (Development and Debugging)

```bash
# First time setup - creates authentication state
yarn test:ui:setup

# Subsequent runs - reuse existing authentication
yarn test:ui

# If authentication expires, delete auth files and run setup again
rm -rf playwright/.auth && yarn test:ui:setup
```

## Authentication Architecture

Our test suite uses a **dual-mode authentication strategy** that works reliably in both CLI and UI modes:

### CLI Mode (Production)

- Uses Playwright setup projects with dependencies
- Runs `auth.setup.ts` once to create authenticated state
- All tests start pre-authenticated using `playwright/.auth/user.json`
- Fast execution (~10s saved per test)

### UI Mode (Development)

- Cannot use setup project dependencies (Playwright limitation)
- Tests use `getOrCreateTestUser()` with intelligent fallback
- Creates new user if stored authentication is unavailable
- Provides excellent debugging experience

## Key Commands

| Command  | Purpose   | When to Use  |
| ***REMOVED******REMOVED***-- | ***REMOVED******REMOVED***------- | ***REMOVED******REMOVED***------ |
| `yarn test:e2e`  | Run all tests in CLI mode | CI/CD, validation|
| `yarn test:ui`   | Launch UI mode| Development, debugging   |
| `yarn test:ui:setup` | Setup auth + launch UI| First time, auth expired |
| `yarn test:setup`| Run setup project only| Troubleshooting  |

## Architecture Differences

### Why CLI and UI Modes Work Differently

This is **intentional Playwright behavior**, not a bug:

1. **CLI Mode**: Optimized for CI/CD with setup project dependencies
2. **UI Mode**: Optimized for development with all tests visible

### How Our Solution Works

We use authentication helpers that adapt to both modes:

- **`getOrCreateTestUser()`**: Smart fallback (used by OAuth tests)
- **Tests updated**: All tests now use the resilient pattern
- **No breaking changes**: CLI mode performance maintained

## Troubleshooting

### "Test timeout in beforeEach hook"

This was the original UI mode issue. Now fixed with `getOrCreateTestUser()`.

**Before (Failed in UI mode):**

```typescript
const user = await getStoredTestUser(page); // Threw error in UI mode
```

**After (Works in both modes):**

```typescript
const user = await getOrCreateTestUser(page); // Graceful fallback
```

### "No test user found in storage"

Delete authentication files and run setup:

```bash
rm -rf playwright/.auth
yarn test:ui:setup
```

### Authentication Expires

Authentication tokens may expire. Simply rerun setup:

```bash
yarn test:ui:setup
```

## File Structure

```
packages/e2e-tests/
├── playwright.config.ts  # CLI mode configuration
├── playwright.config.ui.ts   # UI mode configuration
├── tests/
│   ├── e2e/
│   │   ├── *.spec.ts # Test files
│   │   └── auth.setup.ts # Authentication setup
│   └── utils/
│   └── auth-helpers.ts   # Authentication utilities
└── playwright/.auth/
└── user.json # Stored authentication state
```

## Best Practices

### For Development

1. Use `yarn test:ui:setup` for initial setup
2. Use `yarn test:ui` for ongoing development
3. Run individual tests in UI mode for focused debugging

### For CI/CD

1. Use `yarn test:e2e` for full test suite
2. Authentication setup runs automatically
3. All browsers tested in parallel

### For Debugging

1. UI mode provides excellent debugging tools
2. Time travel debugging available
3. Step-by-step execution with screenshots

## Migration Guide

If you're updating existing tests, replace:

```typescript
// OLD - Failed in UI mode
import { getStoredTestUser } from '@/utils/auth-helpers';
const user = await getStoredTestUser(page);

// NEW - Works in both modes
import { getOrCreateTestUser } from '@/utils/auth-helpers';
const user = await getOrCreateTestUser(page);
```

## Performance

- **CLI Mode**: ~10 seconds saved per test via setup project
- **UI Mode**: Minimal overhead with smart authentication caching
- **Both Modes**: Dynamic user creation prevents database conflicts

## Environment

Tests run against:

- **Main App**: http://localhost:3000 (TrueNamePath)
- **Demo HR**: http://localhost:4000 (OAuth integration)
- **Database**: Local Supabase instance

Both servers start automatically when tests run.

---

## Demo HR Server Management (Legacy)

The E2E test suite includes utilities for managing the Demo HR development server during testing. This allows for automated testing of OAuth integration flows between the TrueNamePath API and the Demo HR application.

### Usage

```typescript
import { createDemoHRServer, type DemoHRServer } from '../utils/demo-hr-server';

// In your test setup
let demoHRServer: DemoHRServer;

test.beforeAll(async () => {
  demoHRServer = createDemoHRServer();
  await demoHRServer.start();
  await demoHRServer.waitUntilReady();
});

test.afterAll(async () => {
  await demoHRServer.stop();
});

// In your tests
test('OAuth integration with Demo HR', async ({ page }) => {
  const isRunning = await demoHRServer.isRunning();
  expect(isRunning).toBe(true);

  await page.goto('http://localhost:4000');
  // Test Demo HR functionality
});
```

### API

- `createDemoHRServer()`: Creates a new server instance
- `server.start()`: Starts the Demo HR development server on port 4000
- `server.stop()`: Stops the server and cleans up processes
- `server.waitUntilReady()`: Waits for server to be ready to receive requests
- `server.isRunning()`: Checks if server is currently running

### Configuration

- **Port**: 4000 (fixed to avoid conflicts with main TrueNamePath app on port 3000)
- **Startup Timeout**: 30 seconds
- **Health Check Interval**: 500ms
- **Cleanup Timeout**: 5 seconds
