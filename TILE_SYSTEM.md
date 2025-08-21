# Tile System Architecture

## Overview
The tile system provides a flexible, extensible foundation for the game world using a property-based approach that supports modding and customization.

## Core Architecture

### TileDefinition Class
```typescript
class TileDefinition {
  constructor(
    public type: string,
    public properties: Map<string, any>
  ) {}
  
  hasProperty(key: string): boolean {
    return this.properties.has(key);
  }
  
  getProperty<T>(key: string, defaultValue?: T): T {
    return this.properties.get(key) ?? defaultValue;
  }
}
```

### TileMap Class
```typescript
class TileMap {
  grid: TileDefinition[][];
  width: number;
  height: number;
  
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = [];
    // Initialize grid...
  }
  
  getTile(x: number, y: number): TileDefinition | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.grid[y][x];
  }
  
  setTile(x: number, y: number, tile: TileDefinition): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x] = tile;
    }
  }
}
```

## Tile Type Examples

### Basic Terrain
```typescript
const GRASS = new TileDefinition("grass", new Map([
  ["walkable", true],
  ["buildable", true]
]));

const STONE = new TileDefinition("stone", new Map([
  ["walkable", false],
  ["buildable", false]
]));

const WATER = new TileDefinition("water", new Map([
  ["walkable", false],
  ["buildable", false]
]));
```

### Resource Tiles
```typescript
const GOLD_DEPOSIT = new TileDefinition("gold", new Map([
  ["walkable", true],
  ["buildable", true],
  ["mineable", true],
  ["resourceType", "gold"],
  ["buildingTypes", ["mine"]]
]));

const IRON_DEPOSIT = new TileDefinition("iron", new Map([
  ["walkable", true],
  ["buildable", true],
  ["mineable", true],
  ["resourceType", "iron"],
  ["buildingTypes", ["mine"]]
]));
```

## Property System

### Core Properties
The system uses string-based properties for maximum flexibility:
- `walkable`: boolean - Can enemies move through this tile
- `buildable`: boolean - Can players place buildings here
- `mineable`: boolean - Can resources be extracted
- `resourceType`: string - Type of resource available
- `buildingTypes`: string[] - Specific building types allowed

### Property Constants (Optional)
For commonly used properties, constants can provide some safety:
```typescript
export const TILE_PROPERTIES = {
  WALKABLE: "walkable",
  BUILDABLE: "buildable",
  MINEABLE: "mineable",
  RESOURCE_TYPE: "resourceType",
  BUILDING_TYPES: "buildingTypes"
} as const;
```

## Modding Support

### JSON-Based Tile Definitions
```json
{
  "type": "magical_crystal",
  "properties": {
    "walkable": true,
    "buildable": false,
    "manaGeneration": 10,
    "glowIntensity": 0.8,
    "magicalResonance": true
  }
}
```

### Loading Custom Tiles
```typescript
class TileLoader {
  static loadFromJson(json: string): TileDefinition {
    const data = JSON.parse(json);
    const properties = new Map(Object.entries(data.properties));
    return new TileDefinition(data.type, properties);
  }
}
```

## System Integration

### Building Placement Validation
```typescript
canPlaceBuilding(x: number, y: number, buildingType: string): boolean {
  const tile = this.getTile(x, y);
  if (!tile) return false;
  
  if (!tile.getProperty<boolean>("buildable", false)) {
    return false;
  }
  
  const allowedTypes = tile.getProperty<string[]>("buildingTypes");
  if (allowedTypes && !allowedTypes.includes(buildingType)) {
    return false;
  }
  
  return true;
}
```

### Resource System Integration
```typescript
getMineableResource(x: number, y: number): string | null {
  const tile = this.getTile(x, y);
  if (!tile?.getProperty<boolean>("mineable", false)) {
    return null;
  }
  
  return tile.getProperty<string>("resourceType", null);
}
```

## Rendering Separation

The tile system is designed to be completely separate from rendering concerns. Rendering systems should:
1. Query tile types and properties
2. Handle auto-tiling and sprite selection based on tile type
3. Manage visual transitions between different tile types
4. Apply appropriate visual effects based on tile properties

This separation allows for:
- Multiple rendering backends (2D sprites, 3D models, etc.)
- Easy art style changes
- Mod-friendly visual customization
- Performance optimizations in the rendering layer

## Benefits

- **Extensible**: New properties can be added without code changes
- **Moddable**: JSON-based tile definitions
- **Type-safe**: Generic getProperty method with type inference
- **Flexible**: Any combination of properties possible
- **Performant**: Simple Map-based property storage
- **Clean**: Clear separation between logic and rendering