# Project Libraries and Dependencies

## Installation

### Frontend (Mobile) - npm
```bash
cd mobile
npm install
npx expo start
```

- `npm install` - Installs 31 production dependencies and 4 development dependencies from `package.json` (includes react-native-maps, react-native-map-clustering, etc.)
- `npx expo start` - Starts the Expo development server

### Backend (API) - Composer

**Option 1: Docker (Recommended)**
```bash
docker-compose up
```

Dependencies are installed automatically in the Docker container. No need to install Composer or PHP locally.

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
