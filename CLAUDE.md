# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a commercial tower defense game built as a Progressive Web App (PWA) targeting app stores. The game uses a deterministic Entity Component System (ECS) architecture with Three.js for WebGL graphics and includes sophisticated features like replay systems, leaderboards, and modding support.

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server on localhost:5173 (with network access)
- `npm run build` - TypeScript compilation followed by production build
- `npm run preview` - Preview production build locally

### Development Server Management (Background Mode)
To avoid blocking the terminal during development, use these background server commands:

**Start Development Server in Background:**
```bash
nohup npm run dev > vite-dev.log 2>&1 &
```

**Check if Development Server is Running:**
```bash
ps aux | grep "npm run dev" | grep -v grep
# OR check for Vite process specifically:
ps aux | grep vite | grep -v grep
```

**View Development Server Logs:**
```bash
tail -f vite-dev.log
# OR view last few lines:
tail vite-dev.log
```

**Stop Development Server:**
```bash
pkill -f "npm run dev"
# OR kill all node processes (more aggressive):
pkill -f node
```

**Complete Workflow Example:**
```bash
# Start server in background
nohup npm run dev > vite-dev.log 2>&1 &

# Check it's running (should show process info)
ps aux | grep "npm run dev" | grep -v grep

# Check logs for server URL
tail vite-dev.log

# When done, stop the server
pkill -f "npm run dev"
```

This approach allows continuous development while keeping the terminal free for other commands and provides full logging for debugging.

### Testing Development Server
After starting the dev server, test that the game loads properly:
- Open http://localhost:5173 in browser
- Verify Three.js canvas renders the tile grid
- Test UI buttons: Place Tower, Remove Tower, Start Wave
- Click on buildable tiles to place towers
- Click Start Wave to spawn enemies and verify pathfinding

## Architecture Overview

### Entity Component System (ECS)
The game uses a strict ECS pattern where:
- **Entities** are simple ID containers (no logic)
- **Components** are pure data structures (no methods)
- **Systems** contain all game logic and operate on entities with specific components

Key ECS files:
- `src/ecs/` - Core ECS framework (Entity, EntityManager, System, Components)
- `src/systems/` - Game logic systems (Movement, Attack, Projectile)
- `src/entities/` - Entity factory functions for towers, enemies, projectiles

### Deterministic Architecture
Critical for replay systems and leaderboards:
- **Frame-based timing** instead of real-time clocks
- **Seeded randomization** using GameRNG instead of Math.random()
- **Event recording** via ReplayRecorder for critical game events
- **DeterministicTiming** components for cooldowns and intervals

### Core Systems
- **TileMap & FlowField** (`src/tiles/`, `src/pathfinding/`) - Grid-based world with flow field pathfinding
- **Renderer** (`src/rendering/`) - Three.js WebGL rendering layer
- **Game** (`src/Game.ts`) - Main game loop and coordination

### Important Technical Details
- **Tile size**: 40x40 pixels for all calculations
- **Grid-based positioning**: All entities snap to tile coordinates
- **Component caching**: EntityManager caches queries for performance
- **Modding support**: Systems can be registered dynamically, components are data-driven

## Working with the Codebase

### Adding New Components
Create pure data interfaces in `src/ecs/Components.ts`:
```typescript
interface NewComponent {
  property: number;
  // No methods allowed - pure data only
}
```

### Adding New Systems
1. Implement the `System` interface in `src/systems/`
2. Register in `Game.ts` constructor and update loop
3. Use frame-based timing and seeded RNG for deterministic behavior
4. Record critical events for replay system

### Entity Creation
Use factory functions in `src/entities/` to maintain consistency:
- Follow existing patterns for component composition
- Ensure entities have required components for their intended systems
- Use proper IDs (`tower_N`, `enemy_N`, `projectile_N`)

### Performance Considerations
- Avoid adding/removing components during gameplay (breaks query cache)
- Use StatusEffects arrays instead of dynamic component addition
- Cache frequently used entity queries
- Profile system execution order for performance

### Modding Architecture
The ECS enables extensive modding:
- New components can be defined in TypeScript
- Custom systems can be registered at runtime
- Behavior components can reference external scripts
- All mod systems must follow deterministic principles

## Development Workflow

### Before Making Changes
1. Understand which systems will be affected
2. Check if changes impact deterministic behavior
3. Consider modding compatibility if modifying core ECS

### Testing Changes
1. Start dev server and verify basic functionality
2. Test tower placement and enemy spawning
3. Verify pathfinding and combat systems work
4. Check that deterministic timing systems function correctly

### Key Files to Review
- `doc/initial/ECS_ARCHITECTURE.md` - Detailed ECS design patterns
- `doc/initial/DETERMINISTIC_ARCHITECTURE.md` - Replay and timing requirements
- `doc/initial/PATHFINDING_ARCHITECTURE.md` - Flow field implementation
- `doc/initial/MODDING_ARCHITECTURE.md` - Extensibility design

## Critical Implementation Notes

### Deterministic Requirements
- Use `GameClock.instance.getFrames()` instead of `Date.now()` for timing
- Use `GameRNG.next()` instead of `Math.random()` for randomization
- Record critical events with `ReplayRecorder.instance.recordEvent()`
- Convert millisecond cooldowns to frame counts (60fps assumed)

### ECS Best Practices
- Never add methods to components - keep them as pure data
- Use composition over inheritance for entity design
- Systems should have single responsibilities
- Query for entities once per frame, cache results when possible

### Three.js Integration
- Renderer creates and manages Three.js scene, camera, and WebGL context
- Coordinate system: World coordinates map to tile grid (40px per tile)
- Screen-to-world coordinate conversion handled in Game.ts
- Visual components reference sprites/materials for rendering

This architecture supports the game's commercial goals of performance, deterministic replay systems, extensive modding capabilities, and cross-platform deployment as a PWA.