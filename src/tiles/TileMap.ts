import { TileDefinition, GRASS, SPAWN, GOAL } from './TileDefinition.js';

export class TileMap {
  grid: TileDefinition[][];
  width: number;
  height: number;
  
  constructor(width: number, height: number, spawn?: { x: number; y: number }, goal?: { x: number; y: number }) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.initializeGrid(spawn, goal);
  }
  
  private initializeGrid(spawn?: { x: number; y: number }, goal?: { x: number; y: number }): void {
    // Use provided spawn/goal positions or fall back to default center positions
    const spawnPos = spawn || { x: 0, y: Math.floor(this.height / 2) };
    const goalPos = goal || { x: this.width - 1, y: Math.floor(this.height / 2) };
    
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        if (x === spawnPos.x && y === spawnPos.y) {
          this.grid[y][x] = SPAWN;
        } else if (x === goalPos.x && y === goalPos.y) {
          this.grid[y][x] = GOAL;
        } else {
          this.grid[y][x] = GRASS;
        }
      }
    }
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
  
  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.getProperty<boolean>("walkable", false) : false;
  }
  
  isBuildable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.getProperty<boolean>("buildable", false) : false;
  }
  
  findSpawnPoint(): { x: number; y: number } | null {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile?.getProperty<boolean>("isSpawn", false)) {
          return { x, y };
        }
      }
    }
    return null;
  }
  
  findGoalPoint(): { x: number; y: number } | null {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getTile(x, y);
        if (tile?.getProperty<boolean>("isGoal", false)) {
          return { x, y };
        }
      }
    }
    return null;
  }
}