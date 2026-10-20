# Fitness Tracker

A fitness tracker where you log workouts manually and see daily and weekly progress.

Built for the **CodeAlpha App Development Internship**.

## Internship task
Task 3: Fitness Tracker App

## Features
- Log activities manually: type, duration, calories burned and steps
- Dashboard with daily progress bars against goals (10,000 steps, 500 kcal, 30 active minutes)
- Last-7-days bar chart with a Steps / Calories / Active minutes switch, plus weekly total and daily average
- History tab with delete
- Saved on the device with AsyncStorage
- Input validation, loading state, empty state and a **Load sample week** button for demos

## Technologies used
React Native, Expo, TypeScript, AsyncStorage

## Project structure
```
App.tsx            # screens: Dashboard, Log, History
utils.ts           # date, totals, validation and sample-data logic
utils.test.ts      # unit tests for utils.ts
index.ts           # Expo entry point
app.json           # Expo configuration
```

## Prerequisites
- Node.js 20 or newer and npm
- The **Expo Go** app on your phone (or an Android emulator / iOS simulator)

## Installation and running
```bash
npm install
npx expo start
```
Scan the QR code with Expo Go, or press `a` (Android emulator) / `i` (iOS simulator).
This project uses Expo SDK 58, so use an Expo Go version that supports it.

## Screenshots
Add screenshots here (for example a `screenshots/` folder).

## Testing details
- `npm test`: unit tests for date keys, totals, weekly series and validation pass
- `npx tsc --noEmit`: passes with no errors
- `npx expo export --platform android`: bundles successfully
- Not tested: running on a physical device or emulator (screens and chart were not viewed)

## Known limitations
- Goals are fixed constants in `utils.ts`
- No cloud sync (SQLite or Firebase were optional in the task)
- Entries are always logged for the current day
