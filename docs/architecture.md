# Architecture

This repo is a production-minded demo app that starts with authentication and is designed to be extended with map-based features (pins, clustering, pin details, etc.).

- Frontend: Expo (React Native) + Expo Router
- Backend: PHP + Slim REST API (Clean Architecture)
- Auth: JWT access tokens + rotating refresh tokens stored as DB sessions
- Database: PostgreSQL
- Local dev: Docker Compose (API + DB)

---

## High-level flow

1. User opens the mobile app.
2. App checks whether a valid session exists by calling `GET /me` using `authFetch`.
3. If access token is expired, the client automatically calls `POST /auth/refresh` (refresh lock prevents double refresh), then retries the original request.
4. If authenticated:
   - user is routed into protected `(tabs)` pages
5. If not authenticated:
   - user is routed into `(auth)` pages (login/register)

---

# Backend architecture (PHP Slim + Clean Architecture)

## Layering

Backend is structured with Clean Architecture principles:

- **Http layer** (Slim routes, middleware): parses requests, returns responses
- **Application layer** (use cases + ports): business logic, depends only on interfaces
- **Infrastructure layer** (DB/JWT/password): implementation details for ports
- **Domain layer** (optional/simple in this project): entities/rules (kept minimal)

Dependency direction: **infrastructure → application → domain**  
HTTP is an adapter around the application use cases.

## Suggested folder structure
api/
public/
index.php # composition root (wiring)
src/
Http/
Json.php # JSON response helper
Middleware/
AuthMiddleware.php # verifies JWT and sets request auth claims
Routes/
AuthRoutes.php # /auth/* endpoints
MeRoutes.php # /me endpoint
Application/
Ports/
UserRepository.php
SessionRepository.php
PasswordHasher.php
TokenService.php
UseCase/
Tokens.php # refresh token generation + hashing
RegisterUser.php
LoginUser.php
RefreshSession.php
LogoutSession.php
GetMe.php
Infrastructure/
Persistence/
DbConnection.php # creates PDO connection
PdoUserRepository.php
PdoSessionRepository.php
Security/
PhpPasswordHasher.php
JwtTokenService.php


## Composition root

`api/public/index.php` is the **only place** where dependencies are wired together:

- loads env vars
- constructs PDO
- constructs repositories (UserRepository, SessionRepository)
- constructs services (PasswordHasher, TokenService)
- constructs use cases
- registers routes

Routes and use cases are not aware of Slim’s container (plain Slim).

## Authentication model

### Access token
- JWT (short lived, e.g. 15 minutes)
- Sent via `Authorization: Bearer <token>`
- Verified by `AuthMiddleware`

### Refresh token
- Long lived random string (e.g. 30 days)
- Stored in `sessions` table **hashed** (sha256)
- Client holds plaintext refresh token
- Refresh token is **rotated** on refresh:
  - old session revoked
  - new session inserted
  - new refresh token returned

## Key endpoints

- `GET /health`
  - health check (DB connectivity)

- `POST /auth/register`
  - creates a user
  - returns created user

- `POST /auth/login`
  - verifies password
  - returns `{ accessToken, refreshToken, user }`
  - creates a session record for refresh token

- `POST /auth/refresh`
  - validates refresh token session
  - revokes old session
  - creates new session + new refresh token
  - returns `{ accessToken, refreshToken }`

- `POST /auth/logout`
  - revokes refresh token session (server-side)
  - client should also clear local tokens

- `GET /me`
  - protected (JWT required)
  - returns logged-in user

## Database model (auth)

- `users`: email + password_hash + metadata
- `sessions`: refresh token sessions (hashed token + expiry + device label etc.)

---

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