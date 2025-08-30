import * as THREE from 'three';
import { World } from './ecs/world.js';
import { 
  TilePositionComponent, 
  TileRaycastComponent, 
  HoverComponent, 
  TileDataComponent,
  TouchInteractionComponent 
} from './components/tile-components.js';

export interface TileGridConfig {
  width: number;
  height: number;
  tileSize: number;
  spacing: number;
}

/**
 * Creates a grid of tiles in the 3D scene and ECS world
 */
export class TileGrid {
  private scene: THREE.Scene;
  private world: World;
  private config: TileGridConfig;

  constructor(scene: THREE.Scene, world: World, config: TileGridConfig) {
    this.scene = scene;
    this.world = world;
    this.config = config;
  }

  /**
   * Generate the tile grid
   */
  generateGrid(): void {
    const { width, height, tileSize, spacing } = this.config;
    
    // Calculate grid offset to center it
    const gridWidth = (width - 1) * (tileSize + spacing);
    const gridHeight = (height - 1) * (tileSize + spacing);
    const offsetX = -gridWidth / 2;
    const offsetZ = -gridHeight / 2;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        this.createTile(x, y, offsetX, offsetZ);
      }
    }
  }

  private createTile(gridX: number, gridY: number, offsetX: number, offsetZ: number): void {
    // Calculate world position
    const worldX = offsetX + gridX * (this.config.tileSize + this.config.spacing);
    const worldZ = offsetZ + gridY * (this.config.tileSize + this.config.spacing);

    // Create tile geometry and material
    const geometry = new THREE.PlaneGeometry(this.config.tileSize, this.config.tileSize);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x2d5a27, // Dark green
      side: THREE.DoubleSide 
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to lie flat
    mesh.position.set(worldX, 0, worldZ);
    
    // Add to scene
    this.scene.add(mesh);

    // Create ECS entity
    const entity = this.world.createEntity();
    
    // Add components
    entity.addComponent(new TilePositionComponent(gridX, gridY, worldX, worldZ));
    entity.addComponent(new TileRaycastComponent(mesh, material));
    entity.addComponent(new HoverComponent());
    entity.addComponent(new TouchInteractionComponent());
    entity.addComponent(new TileDataComponent(this.randomTileType(), false, false, 0));
  }

  private randomTileType(): 'grass' | 'rock' | 'water' | 'path' {
    const types: ('grass' | 'rock' | 'water' | 'path')[] = ['grass', 'grass', 'grass', 'rock', 'water', 'path'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Clear all tiles from scene and world
   */
  clearGrid(): void {
    const entities = this.world.getAllEntities();
    
    for (const entity of entities) {
      const raycastComponent = entity.getComponent('TileRaycast') as TileRaycastComponent | undefined;
      if (raycastComponent) {
        this.scene.remove(raycastComponent.mesh);
        raycastComponent.mesh.geometry.dispose();
        (raycastComponent.material as THREE.Material).dispose();
      }
      this.world.removeEntity(entity.id);
    }
  }

  /**
   * Get tile entity at grid coordinates
   */
  getTileAt(x: number, y: number): any {
    const entities = this.world.getAllEntities();
    return entities.find(entity => {
      const position = entity.getComponent('TilePosition') as TilePositionComponent | undefined;
      return position && position.x === x && position.y === y;
    });
  }
}