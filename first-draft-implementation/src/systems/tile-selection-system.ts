import * as THREE from 'three';
import { System } from '../ecs/system.js';
import { TilePositionComponent, TileRaycastComponent, HoverComponent, SelectionComponent, TouchInteractionComponent } from '../components/tile-components.js';

export interface PointerEvent {
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
  type: 'mouse' | 'touch';
  id?: number; // For multi-touch
}

/**
 * System for handling tile selection via raycasting
 */
export class TileSelectionSystem extends System {
  readonly componentTypes = ['TilePosition', 'TileRaycast', 'Hover'];
  
  private camera!: THREE.Camera;
  private raycaster = new THREE.Raycaster();
  private currentPointer: PointerEvent | null = null;
  private hoveredEntity: any = null;
  private selectedEntity: any = null;

  // Touch interaction constants
  private readonly HOVER_TOUCH_DURATION = 500; // ms
  // private pointerMoveThreshold = 0.05; // Normalized units - unused for now

  constructor(camera: THREE.Camera) {
    super();
    this.camera = camera;
  }

  /**
   * Handle pointer move events (mouse move or touch move)
   */
  onPointerMove(event: PointerEvent): void {
    this.currentPointer = event;
  }

  /**
   * Handle pointer down events (mouse down or touch start)
   */
  onPointerDown(event: PointerEvent): void {
    const entities = this.getEntities();
    
    for (const entity of entities) {
      const touchComponent = entity.getComponent('TouchInteraction') as TouchInteractionComponent | undefined;
      if (touchComponent && event.type === 'touch') {
        touchComponent.touchStartTime = Date.now();
        touchComponent.touchId = event.id || 0;
      }
    }
  }

  /**
   * Handle pointer up events (mouse up or touch end)
   */
  onPointerUp(_event: PointerEvent): void {
    if (this.hoveredEntity) {
      this.selectTile(this.hoveredEntity);
    }
  }

  update(_deltaTime: number): void {
    if (!this.currentPointer) return;

    this.updateRaycasting();
    this.updateTouchHoverState();
  }

  private updateRaycasting(): void {
    if (!this.currentPointer) return;

    // Set up raycaster
    this.raycaster.setFromCamera(
      new THREE.Vector2(this.currentPointer.x, this.currentPointer.y),
      this.camera
    );

    // Clear previous hover states
    this.clearHoverStates();

    // Get all raycastable meshes
    const entities = this.getEntities();
    const meshes: THREE.Mesh[] = [];
    const entityMeshMap = new Map<THREE.Mesh, any>();

    for (const entity of entities) {
      const raycastComponent = entity.getComponent('TileRaycast') as TileRaycastComponent | undefined;
      if (raycastComponent) {
        meshes.push(raycastComponent.mesh);
        entityMeshMap.set(raycastComponent.mesh, entity);
      }
    }

    // Perform raycasting
    const intersects = this.raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const hitEntity = entityMeshMap.get(hitMesh);
      
      if (hitEntity) {
        this.setHoverState(hitEntity);
      }
    }
  }

  private updateTouchHoverState(): void {
    if (!this.currentPointer || this.currentPointer.type !== 'touch') return;

    const entities = this.getEntities();
    const currentTime = Date.now();

    for (const entity of entities) {
      const touchComponent = entity.getComponent('TouchInteraction') as TouchInteractionComponent | undefined;
      const hoverComponent = entity.getComponent('Hover') as HoverComponent | undefined;
      
      if (touchComponent && hoverComponent && hoverComponent.isHovered) {
        const touchDuration = currentTime - touchComponent.touchStartTime;
        
        if (touchDuration >= this.HOVER_TOUCH_DURATION && !touchComponent.isTouchHover) {
          touchComponent.isTouchHover = true;
          // Trigger haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      }
    }
  }

  private clearHoverStates(): void {
    const entities = this.getEntities();
    
    for (const entity of entities) {
      const hoverComponent = entity.getComponent('Hover') as HoverComponent | undefined;
      if (hoverComponent) {
        hoverComponent.isHovered = false;
        hoverComponent.intensity = 0;
      }
    }
    
    this.hoveredEntity = null;
  }

  private setHoverState(hoveredEntity: any): void {
    this.hoveredEntity = hoveredEntity;
    
    const hoveredPosition = hoveredEntity.getComponent('TilePosition') as TilePositionComponent | undefined;
    const hoveredHover = hoveredEntity.getComponent('Hover') as HoverComponent | undefined;
    
    if (!hoveredPosition || !hoveredHover) return;

    // Set main hover state
    hoveredHover.isHovered = true;
    hoveredHover.intensity = 1.0;
    hoveredHover.hoverStartTime = Date.now();

    // Set adjacent tiles with decreasing intensity
    const entities = this.getEntities();
    
    for (const entity of entities) {
      if (entity === hoveredEntity) continue;
      
      const position = entity.getComponent('TilePosition') as TilePositionComponent | undefined;
      const hover = entity.getComponent('Hover') as HoverComponent | undefined;
      
      if (position && hover) {
        const distance = Math.abs(position.x - hoveredPosition.x) + Math.abs(position.y - hoveredPosition.y);
        
        if (distance === 1) {
          // Adjacent tiles
          hover.intensity = 0.6;
        } else if (distance === 2) {
          // Two tiles away
          hover.intensity = 0.3;
        }
      }
    }
  }

  private selectTile(entity: any): void {
    // Clear previous selection
    if (this.selectedEntity) {
      const prevSelection = this.selectedEntity.getComponent('Selection') as SelectionComponent | undefined;
      if (prevSelection) {
        prevSelection.isSelected = false;
      }
    }

    // Set new selection
    this.selectedEntity = entity;
    let selectionComponent = entity.getComponent('Selection') as SelectionComponent | undefined;
    
    if (!selectionComponent) {
      selectionComponent = new SelectionComponent();
      entity.addComponent(selectionComponent);
    }
    
    selectionComponent.isSelected = true;
    selectionComponent.selectedTime = Date.now();

    // Emit selection event for UI system
    this.onTileSelected(entity);
  }

  /**
   * Override this method to handle tile selection events
   */
  protected onTileSelected(_entity: any): void {
    // Will be implemented by UI system integration
  }

  /**
   * Handle two-finger touch to cancel hover (mobile)
   */
  onTwoFingerTouch(): void {
    this.clearHoverStates();
    
    const entities = this.getEntities();
    for (const entity of entities) {
      const touchComponent = entity.getComponent('TouchInteraction') as TouchInteractionComponent | undefined;
      if (touchComponent) {
        touchComponent.isTouchHover = false;
      }
    }
  }
}