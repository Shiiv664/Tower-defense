import * as THREE from 'three';
import { System } from '../ecs/system.js';
import { HoverComponent, SelectionComponent, TileRaycastComponent } from '../components/tile-components.js';

/**
 * System for updating tile visual effects (hover highlights, selection indicators)
 */
export class HighlightRenderingSystem extends System {
  readonly componentTypes = ['TileRaycast', 'Hover'];

  // Base colors for different tile states
  private readonly BASE_COLOR = new THREE.Color(0x2d5a27); // Dark green
  private readonly HOVER_COLOR = new THREE.Color(0x4a9d42); // Bright green
  private readonly SELECTION_COLOR = new THREE.Color(0xffd700); // Gold

  update(_deltaTime: number): void {
    const entities = this.getEntities();

    for (const entity of entities) {
      const raycastComponent = entity.getComponent('TileRaycast') as TileRaycastComponent | undefined;
      const hoverComponent = entity.getComponent('Hover') as HoverComponent | undefined;
      const selectionComponent = entity.getComponent('Selection') as SelectionComponent | undefined;

      if (!raycastComponent || !hoverComponent) continue;

      this.updateTileVisuals(raycastComponent, hoverComponent, selectionComponent);
    }
  }

  private updateTileVisuals(
    raycastComponent: TileRaycastComponent,
    hoverComponent: HoverComponent,
    selectionComponent?: SelectionComponent
  ): void {
    const material = raycastComponent.material as THREE.MeshBasicMaterial;
    if (!material || !material.color) return;

    let targetColor = this.BASE_COLOR.clone();

    // Apply selection highlight (highest priority)
    if (selectionComponent?.isSelected) {
      targetColor = this.SELECTION_COLOR.clone();
    }
    // Apply hover highlight
    else if (hoverComponent.intensity > 0) {
      // Interpolate between base and hover color based on intensity
      targetColor.lerp(this.HOVER_COLOR, hoverComponent.intensity);
    }

    // Smooth color transitions
    material.color.lerp(targetColor, 0.1);

    // Add subtle pulsing animation for selected tiles
    if (selectionComponent?.isSelected) {
      const time = Date.now() * 0.005;
      const pulse = Math.sin(time) * 0.1 + 0.9;
      const pulsingColor = this.SELECTION_COLOR.clone().multiplyScalar(pulse);
      material.color.copy(pulsingColor);
    }
  }

  /**
   * Reset all tile materials to base state
   */
  resetAllTiles(): void {
    const entities = this.getEntities();

    for (const entity of entities) {
      const raycastComponent = entity.getComponent('TileRaycast') as TileRaycastComponent | undefined;
      if (raycastComponent) {
        const material = raycastComponent.material as THREE.MeshBasicMaterial;
        if (material?.color) {
          material.color.copy(this.BASE_COLOR);
        }
      }
    }
  }

  /**
   * Set custom colors for tile states
   */
  setColors(base?: THREE.Color, hover?: THREE.Color, selection?: THREE.Color): void {
    if (base) this.BASE_COLOR.copy(base);
    if (hover) this.HOVER_COLOR.copy(hover);
    if (selection) this.SELECTION_COLOR.copy(selection);
  }
}