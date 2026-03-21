# Project Libraries and Dependencies

## Prerequisites

Before installing project dependencies, ensure you have the following tools installed.

### Git

Git is required to clone the repository. To check if you have it, run `git --version` in your terminal.

**Installing Git**

- **macOS**: Run `xcode-select --install` in Terminal, or download from [git-scm.com](https://git-scm.com/download/mac). Git also comes bundled with Xcode.
- **Windows**: Download the installer from [git-scm.com](https://git-scm.com/download/win). During setup, choose "Git from the command line and also from 3rd-party software" when prompted.
- **Linux**: Run `sudo apt install git` (Debian/Ubuntu) or `sudo dnf install git` (Fedora/RHEL).

**Connecting Git to VS Code**

VS Code has built-in Git support, but it needs Git installed on your system first.

1. Install Git using the steps above, then restart VS Code.
2. Open the Source Control panel with `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (macOS) — you should see your repository's changes listed there.
3. If VS Code can't find Git, open Settings (`Ctrl+,` / `Cmd+,`), search for `git.path`, and set it to your Git executable path (e.g. `C:\Program Files\Git\bin\git.exe` on Windows).
4. The recommended **GitLens** extension (search in the Extensions panel, `Ctrl+Shift+X`) adds helpful features like inline blame, history views, and branch management.

---

### Node.js and npm

npm is bundled with Node.js, so installing Node gives you both. To check if you already have them, run `node --version` and `npm --version`.

**Installing Node.js / npm**

The recommended approach is to use a version manager so you can switch Node versions per project.

- **nvm (macOS/Linux)**: Install via `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash`, then restart your terminal and run `nvm install --lts` to install the latest LTS version.
- **nvm-windows (Windows)**: Download the installer from the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases), then run `nvm install lts` and `nvm use lts`.
- **Direct install**: If you prefer not to use a version manager, download the LTS installer directly from [nodejs.org](https://nodejs.org).

Once installed, verify everything is working with:

```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

This project's frontend requires Node 18 or higher. If you're on an older version, run `nvm install --lts && nvm use --lts` to upgrade.

---

### Docker

Docker is required to run the backend using the recommended setup. To check if you have it, run `docker --version` in your terminal.

**Installing Docker**

- **macOS**: Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/). It includes Docker Engine, Docker Compose, and a GUI dashboard. Supports both Intel and Apple Silicon (M1/M2/M3).
- **Windows**: Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/). Requires WSL 2 (Windows Subsystem for Linux) — the installer will prompt you to set this up if needed.
- **Linux**: Install Docker Engine via your package manager. For Ubuntu/Debian run `sudo apt install docker.io docker-compose-plugin`, then add your user to the docker group with `sudo usermod -aG docker $USER` and restart your session. For other distros, follow the [official Docker Engine install docs](https://docs.docker.com/engine/install/).

Once installed, verify everything is working with:

```bash
docker --version         # should print Docker version 24.x.x or higher
docker compose version   # should print Docker Compose version v2.x.x or higher
```

> **Note**: This project uses `docker compose` (V2, no hyphen). If you're on an older system with only `docker-compose` (V1), consider upgrading Docker Desktop or installing the `docker-compose-plugin` package.

---

## Installation

### Frontend (Mobile) - npm
```bash
HugATree/ cd mobile
HugATree/mobile/ npm install
HugATree/mobile/ npx expo start
```

- `npm install` - Installs 31 production dependencies and 4 development dependencies from `package.json` (includes react-native-maps, react-native-map-clustering, etc.)
- `npx expo start` - Starts the Expo development server

### Backend (API) - Composer

**Option 1: Docker (Recommended)**
```bash
HugATree/ docker-compose up
```

This starts two services:
- **api** - PHP backend on `http://localhost:8000`
- **db** - PostgreSQL database on `localhost:5432`

Dependencies are installed automatically in the Docker container. The database will be initialized with schema from `db/init/`.

To stop the services:
```bash
docker compose down
```

To nuke the local db and rebuild fresh:
```bash
docker compose down -v
docker compose up --build
```

**Option 2: Local Installation**
```bash
cd api
composer install
```

This installs 4 core PHP dependencies from `composer.json` locally.

---

## Backend (API) - PHP/Composer

| Library | Version | Purpose |
|---------|---------|---------|
| slim/slim | ^4.0 | Lightweight PHP web framework for building REST APIs |
| slim/psr7 | ^1.6 | PSR-7: HTTP message interfaces implementation |
| vlucas/phpdotenv | ^5.6 | Environment variable loader for configuration management |
| firebase/php-jwt | ^6.10 | JWT (JSON Web Token) creation and verification |

## Frontend (Mobile) - JavaScript/Node.js

### Runtime & Framework Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.33 | Build system and runtime for React Native apps |
| expo-router | ~6.0.23 | File-based routing for Expo applications |
| react | 19.1.0 | JavaScript UI library |
| react-native | 0.81.5 | Framework for building native apps with React |
| react-native-web | ~0.21.0 | React Native components for web |
| react-dom | 19.1.0 | React package for DOM manipulation |

### Navigation & UI

| Library | Version | Purpose |
|---------|---------|---------|
| @react-navigation/native | ^7.1.8 | Navigation library core |
| @react-navigation/bottom-tabs | ^7.4.0 | Bottom tab navigation component |
| @react-navigation/elements | ^2.6.3 | Navigation UI elements |
| @expo/vector-icons | ^15.0.3 | Icon library (Material Design, etc.) |
| react-native-screens | ~4.16.0 | Native screen navigation support |
| react-native-safe-area-context | ~5.6.0 | Safe area handling for notched devices |

### Maps & Location

| Library | Version | Purpose |
|---------|---------|---------|
| react-native-maps | 1.20.1 | Map component for React Native |
| react-native-map-clustering | ^4.0.0 | Marker clustering for maps |
| expo-location | ~19.0.8 | Device location access |

### Utilities & Interactions

| Library | Version | Purpose |
|---------|---------|---------|
| react-native-gesture-handler | ~2.28.0 | Gesture recognition (swipes, presses, etc.) |
| react-native-reanimated | ~4.1.1 | Animation library for React Native |
| react-native-worklets | 0.5.1 | Worklets for performance-critical code |
| expo-haptics | ~15.0.8 | Haptic feedback (vibrations) |
| expo-web-browser | ~15.0.10 | Web browser opening |

### Media & UI Components

| Library | Version | Purpose |
|---------|---------|---------|
| expo-image | ~3.0.11 | Image handling and optimization |
| expo-font | ~14.0.11 | Custom font loading |
| expo-splash-screen | ~31.0.13 | Splash screen customization |
| expo-status-bar | ~3.0.9 | Status bar customization |
| expo-symbols | ~1.0.8 | Symbol icons |
| expo-system-ui | ~6.0.9 | System UI customization |

### Configuration & Storage

| Library | Version | Purpose |
|---------|---------|---------|
| expo-constants | ~18.0.13 | App configuration and constants |
| expo-secure-store | ~15.0.8 | Secure credential storage |
| expo-linking | ~8.0.11 | Deep linking support |

### Development Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| typescript | ~5.9.2 | TypeScript compiler and type checking |
| @types/react | ~19.1.0 | TypeScript types for React |
| eslint | ^9.25.0 | Code linting tool |
| eslint-config-expo | ~10.0.0 | ESLint configuration for Expo projects |

## Summary

- **Backend**: 4 core dependencies (Slim framework, JWT, environment config)
- **Frontend**: 31 production dependencies + 4 development dependencies (Expo-based React Native)

The project uses a modern microservices-like architecture with a PHP REST API backend and a React Native Expo app for cross-platform mobile development.