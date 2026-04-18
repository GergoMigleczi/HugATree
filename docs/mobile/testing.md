# Mobile Testing Guide

## Overview

This document covers the testing strategy for the HugATree mobile app, the libraries used, how to install them, and how to run the test suite.

Testing is embedded into the development workflow — tests are written alongside features within each sprint, not as a separate phase at the end. A passing test suite is part of the definition of done for every user story.

---

## Strategy

### Levels of Testing

**Unit Tests**
Test pure functions and use-case modules in isolation with no UI or network involved. These are the fastest tests to write and run.

Examples: `regionToBbox()`, `getPublicTreeUrl()`, `createTree()`

**Component Tests**
Test React Native components render correctly and respond to user interaction. Components are tested from the user's perspective — querying by what is visible on screen rather than internal implementation.

Examples: `LoginScreen`, `RegisterScreen`, `HomeTile`, `EmptyState`

**Hook Tests**
Test custom hooks and their state transitions (idle → loading → success/error) with the network layer mocked.

Examples: `usePinsInBbox`, `useSpeciesOptions`

**API Layer Tests**
Test that the correct URL, HTTP method, and request body are sent for each endpoint, and that errors are handled correctly.

Examples: `loginApi`, `registerApi`, `getTreesInBboxApi`

**Snapshot Tests**
Capture a rendered component's output and fail if it changes unexpectedly. Used for stable, presentational UI to catch unintended visual regressions.

### Manual Testing Complement

For flows that are difficult to automate (camera, map interactions, QR sharing), the team uses **session-based exploratory testing** — structured, timeboxed sessions (max 90 minutes) with notes recorded on what was explored and found. These feed into sprint retrospectives.

---

## Libraries

| Library | Purpose |
|---|---|
| `jest` | Test runner and assertion framework |
| `jest-expo` | Jest preset that handles all Expo/React Native configuration and native module mocking automatically |
| `@testing-library/react-native` | Renders components and provides queries (`getByText`, `getByPlaceholderText`, `getByTestId`) to test from the user's perspective |
| `@types/jest` | TypeScript type definitions for Jest |

---

## Installation

From the `mobile/` directory:

```bash
npx expo install jest jest-expo @types/jest @testing-library/react-native --dev
```

If you hit a peer dependency error, use:

```bash
npm install --save-dev jest jest-expo @types/jest @testing-library/react-native --legacy-peer-deps
```

### Required configuration

**`mobile/package.json`**
```json
{
  "scripts": {
    "test": "jest --watchAll",
    "test:ci": "jest --coverage"
  },
  "jest": {
    "preset": "jest-expo",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    },
    "collectCoverage": true,
    "collectCoverageFrom": [
      "**/*.{ts,tsx}",
      "!**/coverage/**",
      "!**/node_modules/**",
      "!**/.expo/**",
      "!**/expo-env.d.ts"
    ]
  }
}
```

**`mobile/tsconfig.json`** — add `"jest"` to the types array:
```json
{
  "compilerOptions": {
    "types": ["jest"]
  }
}
```

---

## Running Tests

All commands should be run from inside the `mobile/` directory.

```bash
# Watch mode — re-runs tests on file save (use during development)
npm run test

# Single run with coverage report (use before committing / in CI)
npm run test:ci

# Run a specific test file
npx jest app/\(auth\)/__tests__/login-test.tsx --no-coverage

# Update snapshots after an intentional UI change
npx jest --updateSnapshot
```

---

## File Structure

Tests live in `__tests__` subdirectories next to the code they test:

```
src/features/auth/
  AuthProvider.tsx
  __tests__/
    AuthProvider-test.tsx

app/(auth)/
  login.tsx
  register.tsx
  __tests__/
    login-test.tsx
    register-test.tsx
```

### Naming conventions

- Test files: `<subject>-test.ts` or `<subject>-test.tsx`
- `describe` block: name of the component or function, e.g. `<LoginScreen />`
- `test` label: plain English describing expected behaviour, e.g. `shows Missing fields alert when email is empty`

---

## Coverage Reports

Running `npm run test:ci` generates an HTML coverage report at:

```
mobile/coverage/lcov-report/index.html
```

Open this in a browser to see exactly which lines, branches, and functions are covered.

The `coverage/` directory is **excluded from git** — do not commit it.

### Current targets

| Area | Target |
|---|---|
| Utility functions | 100% |
| Use-case modules | 90%+ |
| API modules | 80%+ |
| Hooks | 70%+ |
| UI Components | 60%+ |

---

## Current Test Coverage

| File | Tests | Coverage |
|---|---|---|
| `app/(auth)/login.tsx` | 14 | 100% statements |
| `app/(auth)/register.tsx` | 16 | 100% statements |

---

## Notes

- The `act(...)` warnings printed by `@expo/vector-icons` during test runs are a known upstream issue with how the library loads fonts asynchronously. They do not affect test correctness and can be ignored.
- Snapshot files (`__snapshots__/`) **should** be committed — they are the reference used by future test runs to detect unintended UI changes. If a snapshot fails after an intentional change, run `npx jest --updateSnapshot` and commit the updated snapshot alongside the code change.
