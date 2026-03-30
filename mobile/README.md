# BrindaWorld Mobile App

Expo React Native app for iOS and Android.

## Setup
```bash
cd mobile
npm install
npx expo start
```

## Running Locally
- **iOS Simulator**: Press `i` after `npx expo start`
- **Android Emulator**: Press `a` after `npx expo start`
- **Physical device**: Scan QR code with Expo Go app

## Building for Stores
```bash
npm install -g eas-cli
eas login
eas build --platform all
eas submit
```

## Screens
| Screen | Description |
|--------|-------------|
| Splash | Loading screen with BrindaWorld branding |
| Home | Landing with sign-in/register buttons |
| Login | Email + password sign-in |
| Register | Parent registration form |
| Dashboard | Child profiles + activity stats |
| Learn | Placeholder — redirects to web for full games |
| She Can Be | 12 profession cards |

## Notes
- Game content (chess, coding, geography) currently opens in the web browser
- The mobile app focuses on dashboard, progress tracking, and She Can Be content
- Full native game integration planned for future versions
- Replace `assets/*.placeholder` files with actual PNG images before building
