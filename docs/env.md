# Development Configuration (iOS – Expo Go + Docker Backend)

## Environment File

Update the following file:
/HugATree/mobile/.env

Add or update:

EXPO_PUBLIC_API_URL=http://{ip}:8000

## How to Get Your Local IP Address (macOS)

1. Open **Terminal**
2. Run:
ipconfig getifaddr en0
3. Copy the returned IP address.
4. Replace `{ip}` in the `.env` file with that value.

## When to Use Local IP vs `localhost`

### ✅ Using **Expo Go on a Physical iPhone**

If you are running the app through **Expo Go on a real device**, you must use your Mac’s **local network IP address**.

Example:
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000

**Why?**  
The phone is a separate device on your network.  
`localhost` would point to the phone itself — not your Mac running Docker.

### ✅ Using the **iOS Simulator**

If you are running the app in the **iOS Simulator on your Mac**, you should use:

EXPO_PUBLIC_API_URL=http://localhost:8000

**Why?**  
The simulator runs on your Mac, so `localhost` correctly refers to your local machine where Docker is running.

## Summary


| Environment              | API URL Setting                         |
|--------------------------|------------------------------------------|
| Physical iPhone (Expo)  | `http://<your-mac-ip>:8000`              |
| iOS Simulator           | `http://localhost:8000`                  |

## Purpose

This configuration defines where the mobile app sends API requests during local development when:

- The backend is running in Docker
- The frontend is running in Expo (physical device or simulator)

This setup applies **only to the development environment**.