import * as THREE from 'three';
import type { Component } from '../ecs/component.js';

/**
 * Component for tile position in the grid
 */
export class TilePositionComponent implements Component {
  readonly __componentType = 'TilePosition';

  constructor(
    public x: number = 0,
    public y: number = 0,
    public worldX: number = 0,
    public worldZ: number = 0
  ) {}
}

/**
 * Component for tile raycasting mesh references
 */
export class TileRaycastComponent implements Component {
  readonly __componentType = 'TileRaycast';

  constructor(
    public mesh: THREE.Mesh,
    public material: THREE.Material
  ) {}
}

/**
 * Component for hover state and intensity
 */
export class HoverComponent implements Component {
  readonly __componentType = 'Hover';

  constructor(
    public isHovered: boolean = false,
    public intensity: number = 0, // 0-1, strongest on hovered tile, decreasing on adjacent
    public hoverStartTime: number = 0
  ) {}
}

/**
 * Component for tile selection state
 */
export class SelectionComponent implements Component {
  readonly __componentType = 'Selection';

  constructor(
    public isSelected: boolean = false,
    public selectedTime: number = 0
  ) {}
}

/**
 * Component for touch interaction timing and gestures
 */
export class TouchInteractionComponent implements Component {
  readonly __componentType = 'TouchInteraction';

  constructor(
    public touchStartTime: number = 0,
    public isTouchHover: boolean = false,
    public touchId: number | null = null
  ) {}
}

/**
 * Component for tile content and properties
 */
export class TileDataComponent implements Component {
  readonly __componentType = 'TileData';

  constructor(
    public tileType: 'grass' | 'rock' | 'water' | 'path' = 'grass',
    public basePresent: boolean = false,
    public towerPresent: boolean = false,
    public enemyCount: number = 0,
    public metadata: Record<string, any> = {}
  ) {}
}