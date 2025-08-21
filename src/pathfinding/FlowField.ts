import { TileMap } from '../tiles/index.js';

export interface Vector2 {
  x: number;
  y: number;
}

export class FlowField {
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
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return null;
    }
    return this.grid[tileY][tileX];
  }
  
  private generateFlowField(tileMap: TileMap): void {
    const distanceMap = this.generateDistanceMap(tileMap);
    
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        if (!tileMap.isWalkable(x, y)) {
          this.grid[y][x] = { x: 0, y: 0 };
          continue;
        }
        
        const currentDistance = distanceMap[y][x];
        if (currentDistance === Infinity) {
          this.grid[y][x] = { x: 0, y: 0 };
          continue;
        }
        
        let bestDirection = { x: 0, y: 0 };
        let lowestDistance = currentDistance;
        
        const neighbors = [
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
          { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const { dx, dy } of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const neighborDistance = distanceMap[ny][nx];
            if (neighborDistance < lowestDistance) {
              lowestDistance = neighborDistance;
              bestDirection = { x: dx, y: dy };
            }
          }
        }
        
        const length = Math.sqrt(bestDirection.x * bestDirection.x + bestDirection.y * bestDirection.y);
        if (length > 0) {
          bestDirection.x /= length;
          bestDirection.y /= length;
        }
        
        this.grid[y][x] = bestDirection;
      }
    }
  }
  
  private generateDistanceMap(tileMap: TileMap): number[][] {
    const distanceMap: number[][] = [];
    const queue: { x: number; y: number; distance: number }[] = [];
    
    for (let y = 0; y < this.height; y++) {
      distanceMap[y] = [];
      for (let x = 0; x < this.width; x++) {
        distanceMap[y][x] = Infinity;
      }
    }
    
    distanceMap[this.goalPosition.y][this.goalPosition.x] = 0;
    queue.push({ x: this.goalPosition.x, y: this.goalPosition.y, distance: 0 });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      const neighbors = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
      ];
      
      for (const { dx, dy } of neighbors) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (tileMap.isWalkable(nx, ny)) {
            const newDistance = current.distance + 1;
            if (newDistance < distanceMap[ny][nx]) {
              distanceMap[ny][nx] = newDistance;
              queue.push({ x: nx, y: ny, distance: newDistance });
            }
          }
        }
      }
    }
    
    return distanceMap;
  }
}