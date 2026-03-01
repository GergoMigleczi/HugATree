# Frontend architecture (Expo Router + feature modules)

## Principles

- `app/` contains **routes** and **layouts** only (thin screens).
- `src/` contains:
  - stateful logic (auth provider, hooks)
  - API client code (authFetch + endpoints)
  - reusable UI components

Routing-level auth checks are centralised in layouts:
- `(auth)` screens should only be reachable when logged out
- `(tabs)` screens should only be reachable when logged in

## Folder structure
mobile/
app/
_layout.tsx # ThemeProvider + AuthProvider + root Stack
(auth)/
_layout.tsx # redirects to (tabs) if logged in
login.tsx
register.tsx
(tabs)/
_layout.tsx # redirects to (auth) if logged out
index.tsx # Home route shell
map.tsx # Map route shell
modal.tsx # optional (pin details modal route)
src/
config/
index.ts # API_URL and other config
api/
client.ts # apiPost/apiGet (public endpoints)
authFetch.ts # auth fetch + refresh + retry + logout + lock
auth/
AuthProvider.tsx # session state, login/logout, refreshUser
tokens.ts # SecureStore wrapper


## Auth routing and guards (Expo Router)

- `app/_layout.tsx`
  - wraps the app in ThemeProvider (dark/light) and AuthProvider
  - defines a root Stack with `(auth)` and `(tabs)` groups

- `app/(auth)/_layout.tsx`
  - if logged in → `<Redirect href="/(tabs)" />`
  - else render auth Stack

- `app/(tabs)/_layout.tsx`
  - if logged out → `<Redirect href="/(auth)/login" />`
  - else render Tabs

This prevents repeating auth checks on every screen.

## AuthProvider responsibilities

`src/auth/AuthProvider.tsx` provides:

- `loading`: initial session check in progress
- `user`: user object or null
- `isLoggedIn`: derived boolean
- `login(email, password)`:
  - calls `POST /auth/login`
  - saves tokens in SecureStore
  - calls `refreshUser()` (GET /me)
- `refreshUser()`:
  - calls `GET /me` via `authFetch`
  - sets user or clears session on failure
- `logout()`:
  - calls `POST /auth/logout`
  - clears tokens
  - clears user state

## API client strategy

- `src/api/client.ts`
  - handles non-auth requests (login/register)
  - JSON parsing and error mapping

- `src/api/authFetch.ts`
  - attaches access token
  - if 401:
    - refreshes tokens with `POST /auth/refresh`
    - **refresh lock** prevents multiple refresh calls at once
    - retries original request once
  - includes `authLogout()` helper to revoke refresh token and clear local storage

## Feature modules

Mobile is organized into feature modules, each containing domain-specific logic:

### Auth feature (`src/features/auth/`)
- `AuthProvider.tsx` - session state management and login/logout
- `auth.api.ts` - login/register/logout endpoints
- `auth.session.ts` - session persistence in SecureStore
- `auth.types.ts` - TypeScript interfaces (User, AuthResult, etc.)
- `tokens.ts` - token handling and rotation

### Home feature (`src/features/home/`)
- `HomeGrid.tsx` - grid layout for home tiles
- `HomeTile.tsx` - reusable tile component
- `home.types.ts` - TypeScript types for home page
- `home.layout.ts` - layout configuration

### Map feature (`src/features/map/`)
- **Components**:
  - `MapImpl.ios.tsx` / `MapImpl.android.tsx` - platform-specific map implementations
  - `ClusterMarker.tsx` - clustered marker rendering
  - `BackToCurrentLocationButton.tsx` - location button
  - `MapPreviewTile.tsx` - map preview in home feed
- **Hooks**:
  - `usePinPress.ts` - pin interaction logic
- **API & Config**:
  - `map.api.ts` - map-related endpoints (fetch pins, etc.)
  - `googleMapStyle.ts` - Google Maps styling
  - `mapDefaults.ts` - default map center, zoom, etc.
  - `map.types.ts` - Pin, Cluster, MapRegion types

### Location feature (`src/features/location/`)
- `useLiveLocation.ts` - hook for real-time device location tracking

## Screens and routing

### Auth screens (`app/(auth)/`)
- `login.tsx` - login form and submission
- `register.tsx` - registration form

### Tab screens (`app/(tabs)/`)
- `index.tsx` - home screen with feed/grid
- `map.tsx` - full-screen map with pins
- `_layout.tsx` - tab navigation (home + map tabs)

### Shell screens
- `modal.tsx` - optional modal routes (e.g., pin details)
- `_layout.tsx` - root layout wrapping auth + tabs

## Styling and design system

- `constants/theme.ts` - colors and theme (dark/light modes)
- `hooks/use-color-scheme.ts` - system color scheme detection
- `hooks/use-theme-color.ts` - theme color utility

## Shared components

- `components/themed-text.tsx` - text with theme support
- `components/themed-view.tsx` - view with theme support
- `components/ui/` - lower-level UI primitives
  - `icon-symbol.tsx` - icon rendering
  - `collapsible.tsx` - collapsible sections

## Data flow (Map feature example)

1. User opens `(tabs)/map.tsx`
2. Component renders `MapImpl.ios/android` based on platform
3. Pins are fetched via `map.api.ts` → `authFetch` → backend
4. `useLiveLocation` hook provides user's current location
5. Map shows pins with `ClusterMarker` for clustering
6. Tap pin → `usePinPress` listener triggered
7. Trigger modal or navigate to pin details (future extension)