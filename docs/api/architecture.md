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

