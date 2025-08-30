# Tower Defense - First Draft Implementation

Interactive tile-based tower defense game built with TypeScript, Three.js, and Vite.

## Features

- **Interactive Tile System**: 10x10 grid with hover effects and selection
- **Cross-Platform Controls**: Mouse and touch support for desktop and mobile
- **ECS Architecture**: Entity-Component-System for modular game logic
- **Responsive UI**: HTML overlay with CSS for tile details panel
- **PWA Ready**: Progressive Web App capabilities for mobile installation

## Development

### Prerequisites
- Node.js 18+ (20+ recommended for builds)
- Java 17 (for Android builds)

### Local Development
```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to test the tile interaction system.

### Building for Production
```bash
npm run build
npx cap sync
```

## Android APK Generation

### Automated Build (Recommended)
APKs are automatically built via GitHub Actions on push to main branch.

1. Push changes to main branch
2. Check the [Actions tab](../../actions) for build progress
3. Download APK from artifacts or releases

### Manual Build (Requires Android SDK)
```bash
# Build web assets
npm run build

# Sync with Android project  
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug
```

APK will be available at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Installation & Testing

### PWA Installation
1. Visit the app URL in Chrome
2. Click "Install" in address bar
3. App installs like a native application

### Android APK Installation
1. Download APK from GitHub releases
2. Enable "Install from unknown sources" in Android settings
3. Install APK on device

## Architecture

- **ECS Core**: `src/ecs/` - Entity-Component-System foundation
- **Components**: `src/components/` - Tile-specific components
- **Systems**: `src/systems/` - Game logic (selection, rendering, UI)
- **Grid Generation**: `src/tile-grid.ts` - 3D tile grid creation
- **Main App**: `src/main.ts` - Application entry point

## Project Structure

```
src/
├── ecs/                 # Entity-Component-System core
├── components/          # Tile components
├── systems/            # Game systems
├── tile-grid.ts        # Tile grid generation
├── main.ts             # Application entry
└── style.css           # UI styling

android/                # Capacitor Android project
├── app/                # Android app source
└── gradle/             # Build configuration
```

## Implementation Notes

This is a first-draft implementation focusing on:
- Core tile interaction mechanics
- Cross-platform input handling
- Modular architecture for future expansion
- Mobile-first responsive design

Built with ARM64 Chromebook compatibility in mind, using GitHub Actions for APK generation to bypass local build tool limitations.