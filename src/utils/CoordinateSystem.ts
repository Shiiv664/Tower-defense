import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants/GameConstants.js';

export interface WorldCoordinates {
  x: number;
  y: number;
}

export interface TileCoordinates {
  x: number;
  y: number;
}

export class CoordinateSystem {
  private static instance: CoordinateSystem;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private intersectionPlane: THREE.Plane;
  
  private constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.intersectionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  }
  
  static getInstance(): CoordinateSystem {
    if (!CoordinateSystem.instance) {
      CoordinateSystem.instance = new CoordinateSystem();
    }
    return CoordinateSystem.instance;
  }
  
  screenToWorldCoordinates(
    screenX: number, 
    screenY: number, 
    camera: THREE.OrthographicCamera,
    canvasElement: HTMLCanvasElement
  ): WorldCoordinates {
    const rect = canvasElement.getBoundingClientRect();
    
    this.mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, camera);
    
    const intersectionPoint = new THREE.Vector3();
    
    if (this.raycaster.ray.intersectPlane(this.intersectionPlane, intersectionPoint)) {
      return {
        x: intersectionPoint.x,
        y: intersectionPoint.y
      };
    }
    
    return { x: 0, y: 0 };
  }
  
  worldToTileCoordinates(worldX: number, worldY: number): TileCoordinates {
    return {
      x: Math.floor(worldX / GAME_CONSTANTS.TILE_SIZE),
      y: Math.floor(worldY / GAME_CONSTANTS.TILE_SIZE)
    };
  }
  
  tileToWorldCoordinates(tileX: number, tileY: number): WorldCoordinates {
    return {
      x: tileX * GAME_CONSTANTS.TILE_SIZE,
      y: tileY * GAME_CONSTANTS.TILE_SIZE
    };
  }
  
  getTileCenterWorld(tileX: number, tileY: number): WorldCoordinates {
    const halfTile = GAME_CONSTANTS.TILE_SIZE / 2;
    return {
      x: tileX * GAME_CONSTANTS.TILE_SIZE + halfTile,
      y: tileY * GAME_CONSTANTS.TILE_SIZE + halfTile
    };
  }
  
  screenToTileCoordinates(
    screenX: number, 
    screenY: number, 
    camera: THREE.OrthographicCamera,
    canvasElement: HTMLCanvasElement
  ): TileCoordinates {
    const worldCoords = this.screenToWorldCoordinates(screenX, screenY, camera, canvasElement);
    return this.worldToTileCoordinates(worldCoords.x, worldCoords.y);
  }
}