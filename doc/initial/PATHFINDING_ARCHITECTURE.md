# Pathfinding Architecture - Flow Fields with Organic Movement

## Overview

This tower defense game uses a flow field pathfinding system enhanced with organic movement behaviors to create natural, lifelike enemy movement. The system combines deterministic flow field navigation with configurable spreading and randomization effects.

## Core Architecture

### Flow Field System

#### FlowField Class
```typescript
class FlowField {
  private grid: Vector2[][];
  private width: number;
  private height: number;
  private goalPosition: Vector2;
  
  constructor(tileMap: TileMap, goalX: number, goalY: number) {
    this.width = tileMap.width;
    this.height = tileMap.height;
    this.goalPosition = { x: goalX, y: goalY };
    this.grid = [];
    this.generateFlowField(tileMap);
  }
  
  getFlowDirection(x: number, y: number): Vector2 | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.grid[y][x];
  }
  
  private generateFlowField(tileMap: TileMap): void {
    // Implementation generates flow vectors using Dijkstra's algorithm
    // Each tile gets a direction vector pointing toward the optimal path to goal
  }
}
```

#### Flow Field Generation Process
1. **Distance Map Creation**: Use Dijkstra's algorithm to calculate distance from goal to every walkable tile
2. **Flow Vector Calculation**: For each tile, calculate direction to neighbor with lowest distance
3. **Normalization**: Ensure all flow vectors are unit vectors for consistent movement speed
4. **Obstacle Handling**: Flow around non-walkable tiles, create natural paths

### Movement Enhancement Systems

#### 1. Local Spreading Forces
Prevents enemy clustering by adding separation forces between nearby enemies.

```typescript
interface SeparationComponent {
  radius: number;        // How far to check for nearby enemies
  strength: number;      // How strong the separation force is
  maxNeighbors: number;  // Limit neighbors to check for performance
}

class SeparationSystem implements System {
  update(entities: EntityManager, deltaTime: number): void {
    const enemies = entities.withComponents(['Position', 'Movement', 'Separation']);
    
    for (const enemy of enemies) {
      const separationForce = this.calculateSeparationForce(enemy, enemies);
      
      // Blend separation with flow field movement
      const flowForce = this.getFlowFieldForce(enemy);
      const finalForce = this.blendForces(flowForce, separationForce, 0.7, 0.3);
      
      // Apply to movement
      enemy.Movement.direction = this.normalizeVector(finalForce);
    }
  }
}
```

#### 2. Random Offset System
Adds deterministic randomization to create natural variation in movement paths.

```typescript
interface RandomOffsetComponent {
  offsetStrength: number;    // How much random deviation to apply
  offsetFrequency: number;   // How often to change offset (in frames)
  currentOffset: Vector2;    // Current random offset vector
  lastUpdateFrame: number;   // Frame of last offset update
  personalSeed: number;      // Unique seed for this enemy's randomization
}

class RandomOffsetSystem implements System {
  update(entities: EntityManager, deltaTime: number): void {
    const enemies = entities.withComponents(['Position', 'Movement', 'RandomOffset']);
    
    for (const enemy of enemies) {
      const offset = enemy.RandomOffset;
      const currentFrame = GameClock.instance.getFrames();
      
      // Update offset periodically using deterministic randomization
      if (currentFrame - offset.lastUpdateFrame >= offset.offsetFrequency) {
        const rng = new SeededRNG(offset.personalSeed + currentFrame);
        
        offset.currentOffset = {
          x: (rng.next() - 0.5) * 2 * offset.offsetStrength,
          y: (rng.next() - 0.5) * 2 * offset.offsetStrength
        };
        offset.lastUpdateFrame = currentFrame;
      }
      
      // Apply offset perpendicular to main flow direction
      const flowDirection = this.getFlowFieldForce(enemy);
      const perpendicularOffset = this.getPerpendicularOffset(flowDirection, offset.currentOffset);
      
      // Blend with flow field movement
      const finalDirection = this.blendVectors(flowDirection, perpendicularOffset, 0.8, 0.2);
      enemy.Movement.direction = this.normalizeVector(finalDirection);
    }
  }
}
```

### Movement Strategy Selection

#### PathfindingMode Component
```typescript
interface PathfindingMode {
  type: 'flow_field' | 'flow_with_separation' | 'flow_with_offset' | 'flow_with_both';
  flowFieldWeight: number;      // 0.0 - 1.0
  separationWeight: number;     // 0.0 - 1.0  
  offsetWeight: number;         // 0.0 - 1.0
}

// Hard-coded mode selection for testing
const PATHFINDING_CONFIG = {
  DEFAULT_MODE: 'flow_with_both' as const,
  FLOW_FIELD_WEIGHT: 0.6,
  SEPARATION_WEIGHT: 0.25,
  OFFSET_WEIGHT: 0.15
};
```

#### Unified Pathfinding System
```typescript
class PathfindingSystem implements System {
  private flowField: FlowField;
  private separationSystem: SeparationSystem;
  private offsetSystem: RandomOffsetSystem;
  
  update(entities: EntityManager, deltaTime: number): void {
    const enemies = entities.withComponents(['Position', 'Movement', 'PathfindingMode']);
    
    for (const enemy of enemies) {
      const mode = enemy.PathfindingMode;
      let finalDirection: Vector2;
      
      switch (mode.type) {
        case 'flow_field':
          finalDirection = this.getFlowFieldForce(enemy);
          break;
          
        case 'flow_with_separation':
          finalDirection = this.combineFlowAndSeparation(enemy, entities);
          break;
          
        case 'flow_with_offset':
          finalDirection = this.combineFlowAndOffset(enemy);
          break;
          
        case 'flow_with_both':
          finalDirection = this.combineAllForces(enemy, entities);
          break;
      }
      
      enemy.Movement.direction = this.normalizeVector(finalDirection);
    }
  }
  
  private combineAllForces(enemy: Entity, entities: EntityManager): Vector2 {
    const flowForce = this.getFlowFieldForce(enemy);
    const separationForce = this.calculateSeparationForce(enemy, entities);
    const offsetForce = this.calculateOffsetForce(enemy);
    
    return this.blendVectors(
      flowForce, 
      separationForce, 
      offsetForce,
      PATHFINDING_CONFIG.FLOW_FIELD_WEIGHT,
      PATHFINDING_CONFIG.SEPARATION_WEIGHT,
      PATHFINDING_CONFIG.OFFSET_WEIGHT
    );
  }
}
```

## Integration with Game Systems

### Enemy Entity Configuration
```typescript
// Enemy with full pathfinding capabilities
const createEnemyWithPathfinding = (id: string, x: number, y: number): Entity => ({
  id,
  components: new Map([
    ['Position', { x, y }],
    ['Movement', { 
      baseSpeed: 60,  // pixels per second (converted to integer units)
      currentSpeed: 60,
      direction: { x: 1, y: 0 }
    }],
    ['PathfindingMode', {
      type: PATHFINDING_CONFIG.DEFAULT_MODE,
      flowFieldWeight: PATHFINDING_CONFIG.FLOW_FIELD_WEIGHT,
      separationWeight: PATHFINDING_CONFIG.SEPARATION_WEIGHT,
      offsetWeight: PATHFINDING_CONFIG.OFFSET_WEIGHT
    }],
    ['Separation', {
      radius: 30,
      strength: 0.8,
      maxNeighbors: 8
    }],
    ['RandomOffset', {
      offsetStrength: 15,
      offsetFrequency: 30, // Update every 0.5 seconds at 60fps
      currentOffset: { x: 0, y: 0 },
      lastUpdateFrame: 0,
      personalSeed: GameRNG.range(1, 1000000) // Unique seed per enemy
    }]
  ])
});
```

### Tile System Integration
```typescript
// Flow field respects tile properties
const WALKABLE_TILES = new Set(['grass', 'dirt', 'stone']);
const GOAL_TILES = new Set(['castle', 'base', 'exit']);

class FlowFieldGenerator {
  generateFromTileMap(tileMap: TileMap): FlowField {
    // Find goal tiles
    const goals = this.findGoalTiles(tileMap);
    
    // Generate distance map using only walkable tiles
    const distanceMap = this.dijkstraFromGoals(tileMap, goals);
    
    // Create flow vectors pointing toward lower-distance neighbors
    return this.generateFlowVectors(distanceMap, tileMap);
  }
  
  private isWalkable(tile: TileDefinition): boolean {
    return tile.getProperty<boolean>('walkable', false);
  }
}
```

## Deterministic Guarantees

### Seeded Randomization
- All random offsets use `GameRNG` with enemy-specific seeds
- Same game seed produces identical enemy movement patterns
- Personal seeds ensure variety while maintaining reproducibility

### Frame-based Timing
- Offset updates use frame counters, not real-time
- Separation calculations use fixed timesteps
- Movement speeds converted to integer units internally

### Replay System Integration
```typescript
// Critical pathfinding events recorded for replay validation
interface PathfindingEvent {
  type: 'enemy_spawn' | 'pathfinding_mode_change' | 'flow_field_update';
  frame: number;
  entityId: string;
  data: {
    position?: Vector2;
    mode?: string;
    personalSeed?: number;
  };
}

class PathfindingReplaySystem implements System {
  update(entities: EntityManager, deltaTime: number): void {
    // Record significant pathfinding state changes
    const enemies = entities.withComponents(['Position', 'PathfindingMode', 'ReplayTracking']);
    
    for (const enemy of enemies) {
      if (this.hasSignificantMovementChange(enemy)) {
        ReplayRecorder.instance.recordEvent({
          type: 'pathfinding_state',
          frame: GameClock.instance.getFrames(),
          entityId: enemy.id,
          data: {
            position: { ...enemy.Position },
            direction: { ...enemy.Movement.direction },
            mode: enemy.PathfindingMode.type
          }
        });
      }
    }
  }
}
```

## Performance Optimizations

### Spatial Partitioning for Separation
```typescript
class SpatialGrid {
  private cells: Map<string, Entity[]> = new Map();
  private cellSize: number = 64; // pixels
  
  addEntity(entity: Entity): void {
    const cellKey = this.getCellKey(entity.Position.x, entity.Position.y);
    if (!this.cells.has(cellKey)) {
      this.cells.set(cellKey, []);
    }
    this.cells.get(cellKey)!.push(entity);
  }
  
  getNearbyEntities(x: number, y: number, radius: number): Entity[] {
    // Only check entities in nearby cells, not entire entity list
    const cellsToCheck = this.getCellsInRadius(x, y, radius);
    const nearby: Entity[] = [];
    
    for (const cellKey of cellsToCheck) {
      const entities = this.cells.get(cellKey) || [];
      nearby.push(...entities);
    }
    
    return nearby;
  }
}
```

### Flow Field Caching
```typescript
class FlowFieldCache {
  private cache: Map<string, FlowField> = new Map();
  
  getFlowField(tileMapHash: string, goalX: number, goalY: number): FlowField {
    const cacheKey = `${tileMapHash}_${goalX}_${goalY}`;
    
    if (!this.cache.has(cacheKey)) {
      const flowField = new FlowField(tileMap, goalX, goalY);
      this.cache.set(cacheKey, flowField);
    }
    
    return this.cache.get(cacheKey)!;
  }
}
```

## Testing Configuration

### Hard-coded Mode Selection
For initial testing, pathfinding modes can be switched by modifying constants:

```typescript
// Testing different pathfinding approaches
const TESTING_CONFIG = {
  // Test pure flow field
  PURE_FLOW: {
    type: 'flow_field',
    flowFieldWeight: 1.0,
    separationWeight: 0.0,
    offsetWeight: 0.0
  },
  
  // Test flow + separation
  FLOW_SEPARATION: {
    type: 'flow_with_separation',
    flowFieldWeight: 0.7,
    separationWeight: 0.3,
    offsetWeight: 0.0
  },
  
  // Test flow + offset
  FLOW_OFFSET: {
    type: 'flow_with_offset',
    flowFieldWeight: 0.8,
    separationWeight: 0.0,
    offsetWeight: 0.2
  },
  
  // Test all combined
  FULL_ORGANIC: {
    type: 'flow_with_both',
    flowFieldWeight: 0.6,
    separationWeight: 0.25,
    offsetWeight: 0.15
  }
};

// Switch active config here for testing
const ACTIVE_CONFIG = TESTING_CONFIG.FULL_ORGANIC;
```

## Benefits

### Gameplay Benefits
- **Natural Movement**: Enemies don't follow rigid paths, creating organic flow
- **Strategic Depth**: Players must consider enemy spreading when placing towers
- **Visual Appeal**: Varied movement patterns keep gameplay visually interesting
- **Performance**: Flow fields handle hundreds of enemies efficiently

### Technical Benefits  
- **Deterministic**: All randomization is seeded and reproducible
- **Moddable**: Easy to add new movement behaviors via component system
- **Scalable**: Spatial partitioning and caching optimize performance
- **Replay-Compatible**: Full integration with replay recording system

### Development Benefits
- **Testable**: Hard-coded mode selection allows easy comparison
- **Configurable**: Weight-based blending enables fine-tuning
- **Debuggable**: Clear separation between different force types
- **Extensible**: New movement behaviors can be added as new systems

This pathfinding architecture provides a solid foundation for natural enemy movement while maintaining the deterministic requirements for replay functionality and competitive integrity.