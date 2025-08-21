# Modular Tower Defense Game - Modding Architecture

## Overview
This tower defense game is designed from the ground up to support extensive modding capabilities. The architecture follows modular design principles to allow players to easily add, modify, or replace any game element through a comprehensive plugin system.

## Core Architectural Principles

### Event-Driven Architecture
- **Central Event Bus**: All game actions (tower placement, enemy spawning, combat, wave progression) communicate through a central event system
- **Loose Coupling**: Systems communicate via events rather than direct references
- **Mod Integration**: Mods can listen to and emit events to interact with core systems
- **Deterministic Events**: All events are frame-ordered and reproducible for replay compatibility

### Component-Based Design
- **Entity Component System (ECS)**: Towers, enemies, and game objects use ECS pattern for maximum flexibility
- **Modular Components**: Behavior, rendering, stats, and logic separated into discrete components
- **Dynamic Composition**: Mods can add new components or modify existing ones
- **Deterministic Components**: All mod components must support deterministic behavior for replay system

### Data-Driven Configuration
- **JSON/YAML Configs**: All game content defined in easily editable configuration files
- **Hot Reloading**: Changes to configs can be applied without restarting the game
- **Validation**: Automatic validation ensures mod configs are valid, safe, and deterministic
- **Seed Compatibility**: Configs must not break deterministic gameplay when loaded

## Modular System Design

### 1. Core Engine Layer
**Game Loop Manager**
- Handles update/render cycles and frame timing
- Provides hooks for mods to inject custom logic

**Event Bus**
- Central message/event system for all game communication
- Type-safe event definitions with TypeScript support
- Event filtering and prioritization

**Resource Manager**
- Asset loading and caching for textures, sounds, and data files
- Support for mod asset overrides and additions
- Lazy loading for performance optimization

**Plugin Registry**
- Dynamic loading and management of mods
- Dependency resolution between mods
- Version compatibility checking

### 2. Game Systems Layer (All Modular)

**Tower System**
- JSON-based tower definitions with behavior scripts
- Modular upgrade trees and evolution paths
- Pluggable targeting algorithms and special abilities

**Enemy System**
- Modular enemy creation with interchangeable components:
  - Movement patterns (ground, air, teleporting)
  - Visual modules (body, effects, animations)
  - Behavior modules (shields, healing, splitting)
  - Stat modules (health, speed, armor, resistances)

**Combat System**
- Extensible damage types and resistance systems
- Pluggable projectile behaviors and effects
- Custom status effects and debuffs

**Wave System**
- Configurable wave patterns and enemy compositions
- Dynamic difficulty scaling
- Special event waves and boss encounters

**Map System**
- Grid-based tile system with special tile types
- Custom map loading with validation
- Interactive map elements and environmental hazards

**Economy System**
- Flexible resource and currency management
- Custom scoring and reward systems
- Economic balance validation tools

### 3. Deterministic Mod API Design

**Tower API (Deterministic)**
```javascript
// Register new tower type with deterministic constraints
registerTower({
  id: "ice_tower",
  name: "Frost Tower",
  config: "towers/ice_tower.json",
  behavior: "towers/ice_tower_behavior.js",
  upgrades: ["frost_upgrade", "freeze_upgrade"],
  deterministic: {
    usesRNG: true,        // Declares RNG usage for validation
    recordEvents: ["attack", "freeze", "upgrade"] // Events to record for replay
  }
});
```

**Enemy API (Deterministic)**
```javascript
// Create modular enemy with deterministic behavior
registerEnemy({
  id: "armored_flyer",
  components: {
    movement: "flying",
    armor: "heavy",
    special: "magic_shield"
  },
  deterministic: {
    usesRNG: true,             // Uses RNG for movement variations
    usesFrameTiming: true,     // Uses frame-based timing
    recordEvents: ["spawn", "death", "special_ability"]
  }
});
```

**Wave API**
```javascript
// Define custom wave patterns
registerWavePattern({
  id: "boss_rush",
  waves: [...],
  difficulty: "extreme"
});
```

**Map API**
```javascript
// Add custom tile types
registerTileType({
  id: "lava_tile",
  effects: ["damage_over_time"],
  visual: "lava_animation"
});
```

**UI API**
```javascript
// Add custom UI elements
registerUIComponent({
  id: "tower_stats_panel",
  position: "sidebar",
  component: CustomStatsPanel
});
```

## Implementation Structure

```
src/
├── core/              # Core engine systems
│   ├── events/        # Event bus and event definitions
│   ├── resources/     # Resource management and loading
│   ├── plugins/       # Plugin system and mod loader
│   └── rendering/     # Rendering engine and graphics
├── systems/           # Game systems (all modular)
│   ├── towers/        # Tower management and behaviors
│   ├── enemies/       # Enemy system and AI
│   ├── combat/        # Combat calculations and effects
│   ├── waves/         # Wave generation and management
│   ├── maps/          # Map loading and tile system
│   └── economy/       # Resource and scoring system
├── api/              # Mod API interfaces and utilities
│   ├── interfaces/    # TypeScript definitions for mods
│   ├── validators/    # Config validation utilities
│   ├── helpers/       # Common mod development helpers
│   └── examples/      # Example mod implementations
├── data/             # Base game data and configurations
│   ├── towers/        # Default tower definitions
│   ├── enemies/       # Default enemy configurations
│   ├── waves/         # Default wave patterns
│   └── maps/          # Default map definitions
├── mods/             # Mod loading directory
│   ├── enabled/       # Active mods
│   ├── available/     # Available but inactive mods
│   └── examples/      # Example mods for learning
└── ui/               # User interface components
    ├── game/          # In-game UI elements
    ├── menus/         # Menu and settings UI
    └── modding/       # Mod management interface
```

## Mod Support Features

### Hot Reloading
- Mods can be updated without restarting the game
- Real-time config changes for rapid iteration
- Safe reload mechanisms to prevent crashes

### Type Safety & Deterministic Validation
- Complete TypeScript definitions for all APIs
- IntelliSense support in modern editors
- Compile-time validation for mod scripts
- Runtime validation of deterministic behavior
- Automatic detection of non-deterministic code patterns

### Validation System
- Automatic validation of mod configurations
- Runtime checks for mod compatibility and deterministic behavior  
- Clear error messages for debugging
- Replay compatibility verification for all mod code
- Detection of banned functions (Date.now, Math.random, etc.)

### Sandboxing
- Safe execution environment for mod scripts
- Resource limits to prevent system abuse
- API access controls and permissions

### Development Tools
- Mod creation wizard and templates
- Live debugging and inspection tools
- Performance profiling for mod optimization

### Documentation & Community
- Comprehensive API documentation with examples
- Video tutorials for common modding tasks
- Community mod sharing platform integration
- Version control integration for mod development

## Modding Workflow

1. **Setup**: Install mod development tools and templates
2. **Create**: Use wizard to generate mod structure
3. **Develop**: Edit configs and scripts with full IDE support
4. **Test**: Hot reload changes in development mode
5. **Validate**: Automatic testing and validation
6. **Package**: Bundle mod for distribution
7. **Share**: Upload to community platform

## Deterministic Modding Constraints

### Required Guidelines for Mod Developers

#### 1. Timing Requirements
```javascript
// ❌ FORBIDDEN: Real-time based timing
function updateTower() {
  if (Date.now() - this.lastAttack > this.cooldown) {
    this.attack();
  }
}

// ✅ REQUIRED: Frame-based timing
function updateTower() {
  const currentFrame = GameClock.instance.getFrames();
  if (currentFrame - this.lastAttackFrame >= this.cooldownFrames) {
    this.attack();
  }
}
```

#### 2. Randomization Requirements
```javascript
// ❌ FORBIDDEN: Non-seeded randomization
function calculateDamage() {
  return this.baseDamage * (0.8 + Math.random() * 0.4);
}

// ✅ REQUIRED: Seeded randomization
function calculateDamage() {
  return this.baseDamage * (0.8 + GameRNG.next() * 0.4);
}
```

#### 3. Event Recording Requirements
```javascript
// ✅ REQUIRED: Record critical events
function performSpecialAttack(target) {
  // Execute the attack
  const damage = this.calculateDamage();
  target.takeDamage(damage);
  
  // Record for replay system
  ReplayRecorder.instance.recordEvent({
    type: 'special_attack',
    frame: GameClock.instance.getFrames(),
    entityId: this.id,
    data: { targetId: target.id, damage }
  });
}
```

### Mod Validation Pipeline

1. **Static Analysis**: Scan mod code for banned functions
2. **Deterministic Testing**: Run mod with same seed multiple times
3. **Replay Verification**: Ensure mod behavior is reproducible
4. **Performance Testing**: Check frame timing consistency
5. **Integration Testing**: Verify compatibility with replay system

### Banned Functions & Patterns

**Forbidden APIs:**
- `Date.now()`, `performance.now()`
- `Math.random()`
- `setTimeout()`, `setInterval()`
- Browser-specific timing APIs
- Network requests during gameplay

**Required Replacements:**
- Use `GameClock.instance` for all timing
- Use `GameRNG` for all randomization
- Use game event system for delayed actions
- Use deterministic data sources only

This architecture ensures that every aspect of the tower defense game can be extended, modified, or completely replaced by mods while maintaining stability, performance, deterministic behavior, and replay compatibility.