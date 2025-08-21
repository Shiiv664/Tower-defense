# Entity Component System (ECS) Architecture

## Overview

This tower defense game uses an Entity Component System (ECS) architecture to achieve maximum modularity and performance. ECS separates data (Components) from logic (Systems) and uses Entities as simple containers, enabling flexible composition and efficient processing.

## Core ECS Concepts

### Entity
- **Definition**: A unique identifier (ID) that groups components together
- **Purpose**: Represents a game object (tower, enemy, projectile, etc.)
- **Structure**: Just an ID - contains no data or logic itself

```typescript
interface Entity {
  id: string;
  components: Map<string, Component>;
}
```

### Component
- **Definition**: Pure data containers with no logic or methods
- **Purpose**: Stores specific aspects of an entity (position, health, damage, etc.)
- **Rule**: Components are just data - no behavior, no methods, no inheritance

```typescript
interface PositionComponent {
  x: number;
  y: number;
}

interface HealthComponent {
  current: number;
  maximum: number;
}

interface AttackComponent {
  damage: number;
  range: number;
  cooldown: number; // in milliseconds
}

interface DeterministicTimingComponent {
  lastTriggerFrame: number;
  cooldownFrames: number;
}

interface ReplayComponent {
  recordEvents: boolean;
  eventTypes: string[];
}
```

### System
- **Definition**: Logic processors that operate on entities with specific components
- **Purpose**: Contains all game behavior and rules
- **Operation**: Queries for entities with required components, then processes them

```typescript
class AttackSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    // Query entities with attack capabilities
    const attackers = entities.withComponents(['Position', 'Attack', 'Targeting']);
    
    for (const attacker of attackers) {
      this.processAttack(attacker, deltaTime);
    }
  }
}
```

## Tower Defense ECS Examples

### Basic Tower Entity (Deterministic)
```typescript
// Tower Entity ID: "tower_123"
const towerComponents = {
  Position: { x: 5, y: 3 },
  Health: { current: 100, maximum: 100 },
  Attack: { damage: 25, range: 150, cooldown: 1000 },
  DeterministicTiming: { lastTriggerFrame: 0, cooldownFrames: 60 }, // 1000ms = 60 frames at 60fps
  Targeting: { strategy: "closest", currentTarget: null },
  Upgrade: { level: 1, experience: 0 },
  Visual: { sprite: "basic_tower", rotation: 0 },
  Replay: { recordEvents: true, eventTypes: ["attack", "target_acquired", "upgrade"] }
};
```

### Enemy Entity with Status Effects
```typescript
// Enemy Entity ID: "enemy_456"
const enemyComponents = {
  Position: { x: 0, y: 3 },
  Health: { current: 80, maximum: 80 },
  Movement: { baseSpeed: 2, currentSpeed: 2, path: [...] },
  StatusEffects: [
    { type: "slow", duration: 3000, speedMultiplier: 0.5 },
    { type: "poison", duration: 5000, damagePerSecond: 2 }
  ],
  Reward: { gold: 10, experience: 5 },
  Visual: { sprite: "orc_enemy", animation: "walking" }
};
```

### Projectile Entity
```typescript
// Projectile Entity ID: "projectile_789"
const projectileComponents = {
  Position: { x: 5.2, y: 3.1 },
  Movement: { speed: 8, direction: { x: 1, y: 0 } },
  Damage: { amount: 25, type: "physical" },
  Target: { entityId: "enemy_456" },
  Lifetime: { remaining: 2000 },
  Visual: { sprite: "arrow", trail: true }
};
```

## Core Systems

All systems are designed to be deterministic and support replay functionality. They use frame-based timing instead of real-time clocks and seeded randomization for consistent behavior across different platforms and sessions.

### MovementSystem
```typescript
class MovementSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    const movableEntities = entities.withComponents(['Position', 'Movement']);
    
    for (const entity of movableEntities) {
      const pos = entity.Position;
      const movement = entity.Movement;
      
      // Apply status effects to movement
      let finalSpeed = movement.baseSpeed;
      if (entity.StatusEffects) {
        finalSpeed = this.applySpeedModifiers(entity.StatusEffects, finalSpeed);
      }
      
      // Update position
      pos.x += movement.direction.x * finalSpeed * deltaTime;
      pos.y += movement.direction.y * finalSpeed * deltaTime;
    }
  }
}
```

### AttackSystem (Deterministic)
```typescript
class AttackSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    const attackers = entities.withComponents(['Position', 'Attack', 'Targeting', 'DeterministicTiming']);
    
    for (const attacker of attackers) {
      const attack = attacker.Attack;
      const timing = attacker.DeterministicTiming;
      const currentFrame = GameClock.instance.getFrames();
      
      // Use frame-based timing instead of Date.now() for deterministic behavior
      const framesSinceLastAttack = currentFrame - timing.lastTriggerFrame;
      const cooldownFrames = Math.floor(attack.cooldown / 1000 * 60); // Convert ms to frames (60fps)
      
      if (framesSinceLastAttack >= cooldownFrames) {
        // Find target using deterministic targeting
        const target = this.findTarget(attacker, entities);
        if (!target) continue;
        
        // Create projectile with seeded randomization for damage variance
        this.createProjectile(attacker, target);
        timing.lastTriggerFrame = currentFrame;
        
        // Record event for replay system
        if (ReplayRecorder.instance.isRecording()) {
          ReplayRecorder.instance.recordEvent({
            type: 'tower_attack',
            frame: currentFrame,
            entityId: attacker.id,
            data: { targetId: target.id, damage: attack.damage }
          });
        }
      }
    }
  }
}
```

### StatusEffectSystem
```typescript
class StatusEffectSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    const affectedEntities = entities.withComponents(['StatusEffects']);
    
    for (const entity of affectedEntities) {
      const effects = entity.StatusEffects;
      
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        
        // Process effect
        this.applyEffect(entity, effect, deltaTime);
        
        // Update duration
        effect.duration -= deltaTime;
        
        // Remove expired effects
        if (effect.duration <= 0) {
          effects.splice(i, 1);
        }
      }
    }
  }
}
```

## Performance Optimizations

### Component Indexing and Caching
```typescript
class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private componentIndex: Map<string, Set<string>> = new Map();
  private queryCache: Map<string, Entity[]> = new Map();
  
  addEntity(entity: Entity) {
    this.entities.set(entity.id, entity);
    this.updateComponentIndex(entity);
    this.invalidateQueryCache(entity);
  }
  
  withComponents(componentTypes: string[]): Entity[] {
    const queryKey = componentTypes.sort().join(',');
    
    // Return cached result if available
    if (this.queryCache.has(queryKey)) {
      return this.queryCache.get(queryKey)!;
    }
    
    // Build and cache query result
    const result = this.executeQuery(componentTypes);
    this.queryCache.set(queryKey, result);
    return result;
  }
}
```

### Avoiding Structural Changes
To maintain performance with cached queries, avoid adding/removing components during gameplay:

#### ❌ Bad: Dynamic Component Addition
```typescript
// This changes the entity's archetype - expensive!
enemy.SlowEffect = { duration: 3000, slowAmount: 0.5 };
```

#### ✅ Good: Status Effect System
```typescript
// This keeps the archetype stable - fast!
enemy.StatusEffects.push({ type: "slow", duration: 3000, slowAmount: 0.5 });
```

#### ✅ Good: Component Pooling
```typescript
// Pre-allocate components, just activate/deactivate them
enemy.SlowEffect = { active: true, duration: 3000, slowAmount: 0.5 };
```

## Modding Support

### System Registration
Mods can register entirely new systems without modifying core code. All mod systems must follow deterministic principles:

```typescript
// Mod registers custom system (must be deterministic)
class LaserAttackSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    const laserTowers = entities.withComponents(['Position', 'LaserWeapon', 'DeterministicTiming']);
    
    for (const tower of laserTowers) {
      const timing = tower.DeterministicTiming;
      const currentFrame = GameClock.instance.getFrames();
      
      // Use frame-based timing and seeded RNG
      if (currentFrame - timing.lastTriggerFrame >= tower.LaserWeapon.chargeFrames) {
        const damage = tower.LaserWeapon.baseDamage * (0.8 + GameRNG.next() * 0.4);
        
        // Record critical events for replay
        ReplayRecorder.instance.recordEvent({
          type: 'laser_attack',
          frame: currentFrame,
          entityId: tower.id,
          data: { damage }
        });
      }
    }
  }
}

// Register with game engine
gameEngine.registerSystem(new LaserAttackSystem());
```

### Component Definition
Mods can define new component types:

```typescript
// Mod defines new components
interface LaserWeaponComponent {
  power: number;
  chargeTime: number;
  beamWidth: number;
}

interface ShieldComponent {
  strength: number;
  regenRate: number;
  isActive: boolean;
}
```

### Data-Driven Behavior
Components can reference external scripts for complex behaviors:

```typescript
interface BehaviorComponent {
  type: string;
  scriptPath: string;
  parameters: any;
}

// Behavior system loads and executes mod scripts
class BehaviorSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    const behaviorEntities = entities.withComponents(['Behavior']);
    
    for (const entity of behaviorEntities) {
      const behavior = entity.Behavior;
      const script = this.loadScript(behavior.scriptPath);
      script.execute(entity, behavior.parameters, deltaTime);
    }
  }
}
```

## Best Practices

### Component Design
1. **Keep components as pure data** - no methods or logic
2. **Use composition over inheritance** - combine small components
3. **Avoid deep nesting** - flatten data structures when possible
4. **Use enums/constants** for type safety

### System Design
1. **Single responsibility** - each system handles one aspect
2. **Query optimization** - cache frequently used queries
3. **Minimal coupling** - systems communicate via components or events
4. **Deterministic order** - define clear system execution order
5. **Frame-based timing** - use GameClock for consistent timing across platforms
6. **Seeded randomization** - use GameRNG instead of Math.random() for reproducible results
7. **Event recording** - integrate with ReplayRecorder for critical game events

### Performance Considerations
1. **Batch operations** - process similar entities together
2. **Avoid structural changes** during gameplay
3. **Use object pooling** for frequently created/destroyed entities
4. **Profile query performance** and optimize hot paths

### Modding Guidelines
1. **Provide clear component interfaces** with TypeScript definitions
2. **Document system execution order** for mod compatibility
3. **Use events for cross-system communication** when needed
4. **Validate mod components** to prevent crashes

## New Systems for Replay & Leaderboard

### ReplayRecordingSystem
```typescript
class ReplayRecordingSystem implements System {
  update(entities: EntityManager, deltaTime: number) {
    const replayableEntities = entities.withComponents(['Replay']);
    
    for (const entity of replayableEntities) {
      const replay = entity.Replay;
      if (!replay.recordEvents) continue;
      
      // Check if entity has changed significantly since last frame
      if (this.hasSignificantChanges(entity)) {
        ReplayRecorder.instance.recordEntityState(entity);
      }
    }
    
    // Take periodic snapshots for fast-forward capability
    if (ReplayRecorder.instance.shouldTakeSnapshot()) {
      ReplayRecorder.instance.takeSnapshot(entities);
    }
  }
}
```

### ReplayPlaybackSystem
```typescript
class ReplayPlaybackSystem implements System {
  private isPlayback: boolean = false;
  private replayPlayer: ReplayPlayer;
  
  startPlayback(replayData: ReplayData) {
    this.isPlayback = true;
    this.replayPlayer = new ReplayPlayer(replayData);
  }
  
  update(entities: EntityManager, deltaTime: number) {
    if (!this.isPlayback) return;
    
    // Step through replay events and apply them
    this.replayPlayer.step(entities);
  }
}
```

## Integration with Tower Defense

This deterministic ECS architecture enables:

- **Flexible tower designs**: Mix and match components for different tower types
- **Dynamic enemy behaviors**: Add/remove status effects without performance cost
- **Mod-friendly systems**: Easy to extend without core modifications with deterministic constraints
- **High performance**: Efficient queries and batch processing
- **Clear separation**: Data, logic, and presentation are cleanly separated
- **Replay functionality**: Complete game sessions can be recorded and played back
- **Score validation**: Deterministic behavior enables automated cheat detection
- **Cross-platform consistency**: Same seed produces identical results on any device

The result is a highly modular, performant, and extensible tower defense game that can support extensive modding while maintaining smooth gameplay even with hundreds of entities, plus full replay capabilities and competitive integrity through deterministic systems.