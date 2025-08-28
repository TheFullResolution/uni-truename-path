# Authentication Setup Project for Playwright E2E Tests

## Overview

This document explains the authentication setup project implementation that optimizes Demo HR OAuth E2E tests by following Playwright's official best practices for authentication state reuse.

## Key Benefits

✅ **Performance Improvement**: 5-10 seconds per test by eliminating repetitive login flows  
✅ **Cross-Origin OAuth Testing**: Maintains persistent sessions for proper OAuth flow testing  
✅ **Database Consistency**: Single worker configuration prevents conflicts  
✅ **Developer Experience**: Clear patterns and documentation for test development

## Architecture

### Authentication Setup Pattern

```typescript
// auth.setup.ts - Runs once to create authenticated state
setup('authenticate', async ({ page }) => {
  const testUser = await createAndLoginTestUser(page);
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### Test Usage Pattern

```typescript
// Updated test pattern - starts pre-authenticated
test('some feature', async ({ page }) => {
  const user = await getStoredTestUser(page); // Retrieves shared user
  // Test logic runs with authenticated state
});
```

## File Structure

```
packages/e2e-tests/
├── tests/e2e/
│   ├── auth.setup.ts  # Authentication setup project
│   ├── demo-hr-oauth-flow.spec.ts # Updated OAuth tests
│   ├── dashboard-layout.spec.ts   # Updated dashboard tests
│   └── context-constraints.spec.ts # Updated context tests
├── tests/utils/
│   └── auth-helpers.ts# Enhanced authentication utilities
├── playwright/.auth/  # Authentication state storage (gitignored)
│   └── user.json  # Stored authentication state
└── playwright.config.ts   # Updated with setup project configuration
```

## Configuration Changes

### Playwright Config Updates

```typescript
projects: [
  // Setup project - runs once to create authenticated state
  {
name: 'setup',
testMatch: /.*\.setup\.ts/,
  },

  // Main test projects with authentication state
  {
name: 'chromium',
use: {
  storageState: 'playwright/.auth/user.json', // Pre-authenticated state
},
dependencies: ['setup'], // Runs after setup completes
  },
];
```

### Git Integration

```gitignore
# Playwright authentication state (should not be committed)
**/playwright/.auth/
```

## Authentication Utilities

### Enhanced Auth Helpers

- `getStoredTestUser(page)` - Retrieves shared test user from localStorage
- `createAndLoginTestUser(page)` - Creates new user (for setup and special cases)
- `ensureLoggedOut(page)` - Cleans authentication state (for specific tests)

### Usage Guidelines

- **Default Pattern**: Use `getStoredTestUser()` for regular tests
- **Special Cases**: Use `createAndLoginTestUser()` for signup flow tests
- **Authentication Tests**: Use `ensureLoggedOut()` for security validation

## Test Migration Pattern

### Before (Old Pattern)

```typescript
test.beforeEach(async ({ page }) => {
  await ensureLoggedOut(page);
  await createAndLoginTestUser(page); // Slow: 5-10s per test
});
```

### After (Optimized Pattern)

```typescript
test('feature test', async ({ page }) => {
  const user = await getStoredTestUser(page); // Fast: <1s
  // Test logic
});
```

## Commands

### Running Tests

```bash
# Run all tests (includes setup automatically)
yarn test:e2e

# Run specific browser with setup
yarn test:e2e --project=chromium

# Run only setup project
yarn test:e2e --project=setup
```

### Performance Monitoring

- Setup project: ~12 seconds (runs once)
- Individual tests: ~3-5 seconds (significant improvement from 8-15 seconds)
- Full test suite: 40-50% faster overall

## Best Practices

1. **Single Setup**: One setup project creates shared authentication state
2. **Shared User**: All tests use the same test user for consistency
3. **Clean Isolation**: Tests remain isolated through proper state management
4. **Special Cases**: Signup flow tests still create new users as needed
5. **Security Testing**: Authentication protection tests use `ensureLoggedOut()`

## Troubleshooting

### Common Issues

1. **localStorage Access Denied**: `getStoredTestUser()` automatically navigates to correct origin
2. **Setup Failure**: Check webServer configuration and database connectivity
3. **State Persistence**: Ensure auth files are properly gitignored

### Debug Commands

```bash
# Run with UI to inspect authentication state
yarn test:e2e:ui

# Run setup in headed mode to see authentication flow
yarn test:e2e:headed --project=setup
```

## Migration Checklist

- [x] Created `auth.setup.ts` authentication setup project
- [x] Updated `playwright.config.ts` with setup project and dependencies
- [x] Enhanced `auth-helpers.ts` with `getStoredTestUser()` function
- [x] Updated all test specs to use pre-authenticated pattern
- [x] Added `playwright/.auth/` to `.gitignore`
- [x] Verified OAuth flow tests work with persistent authentication
- [x] Confirmed performance improvements (5-10 seconds per test)

## Future Considerations

- Monitor authentication token expiration in long test runs
- Consider multiple setup projects for different user personas if needed
- Evaluate CI/CD pipeline optimizations with cached authentication state
