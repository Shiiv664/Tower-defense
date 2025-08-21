export class TileDefinition {
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

export const GRASS = new TileDefinition("grass", new Map([
  ["walkable", true],
  ["buildable", true],
  ["color", 0x4CAF50]
]));

export const SPAWN = new TileDefinition("spawn", new Map([
  ["walkable", true],
  ["buildable", false],
  ["isSpawn", true],
  ["color", 0xFF5722]
]));

export const GOAL = new TileDefinition("goal", new Map([
  ["walkable", true],
  ["buildable", false],
  ["isGoal", true],
  ["color", 0x2196F3]
]));