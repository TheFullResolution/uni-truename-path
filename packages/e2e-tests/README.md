# TrueNamePath E2E Testing Suite

End-to-end tests for the TrueNamePath project using Playwright.

## Quick Start

```bash
# Run all tests
yarn test:e2e

# Run UI mode
yarn test:ui
```

## Commands

| Command | Purpose  |
| ***REMOVED***------ | ***REMOVED******REMOVED******REMOVED***- |
| `yarn test:e2e` | Run all tests|
| `yarn test:ui`  | Launch UI mode for debugging |

## File Structure

```
tests/
├── e2e/
│   ├── *.spec.ts  # Test files
│   └── auth.setup.ts  # Authentication setup
└── utils/
└── auth-helpers.ts # Authentication utilities
```

## Environment

Tests run against local servers:

- Main App: http://localhost:3000
- Demo HR: http://localhost:4000
- Demo Chat: http://localhost:4500
