import { System } from '../ecs/system.js';
import { TilePositionComponent, TileDataComponent, SelectionComponent } from '../components/tile-components.js';

/**
 * System for managing HTML overlay UI
 */
export class GameUISystem extends System {
  readonly componentTypes = ['Selection', 'TilePosition', 'TileData'];

  private detailPanel!: HTMLElement;
  private titleElement!: HTMLElement;
  private coordinatesElement!: HTMLElement;
  private typeElement!: HTMLElement;
  private contentElement!: HTMLElement;
  private closeButton!: HTMLElement;

  private isInitialized = false;

  init(world: any): void {
    super.init(world);
    this.initializeUIElements();
  }

  private initializeUIElements(): void {
    // Get UI elements
    this.detailPanel = document.getElementById('tile-detail-panel')!;
    this.titleElement = document.getElementById('tile-title')!;
    this.coordinatesElement = document.getElementById('tile-coordinates')!;
    this.typeElement = document.getElementById('tile-type')!;
    this.contentElement = document.getElementById('tile-content')!;
    this.closeButton = document.getElementById('close-panel')!;

    if (!this.detailPanel) {
      console.error('Required UI elements not found');
      return;
    }

    // Set up event listeners
    this.closeButton?.addEventListener('click', () => this.closeTilePanel());
    
    // Close panel when clicking outside
    document.addEventListener('click', (event) => {
      if (!this.detailPanel.contains(event.target as Node) && 
          !this.detailPanel.classList.contains('hidden')) {
        // Only close if click is not on the canvas (to allow tile selection)
        const canvas = document.getElementById('game-canvas');
        if (canvas && !canvas.contains(event.target as Node)) {
          this.closeTilePanel();
        }
      }
    });

    this.isInitialized = true;
  }

  update(_deltaTime: number): void {
    if (!this.isInitialized) return;

    const entities = this.getEntities();
    const selectedEntity = entities.find(entity => {
      const selection = entity.getComponent('Selection') as SelectionComponent | undefined;
      return selection?.isSelected;
    });

    if (selectedEntity) {
      this.showTileDetails(selectedEntity);
    }
  }

  private showTileDetails(entity: any): void {
    const position = entity.getComponent('TilePosition') as TilePositionComponent | undefined;
    const data = entity.getComponent('TileData') as TileDataComponent | undefined;

    if (!position || !data) return;

    // Update panel content
    this.titleElement.textContent = `Tile (${position.x}, ${position.y})`;
    this.coordinatesElement.textContent = `Coordinates: ${position.x}, ${position.y}`;
    this.typeElement.textContent = `Terrain: ${this.capitalizeFirst(data.tileType)}`;
    
    // Build content description
    const contentParts: string[] = [];
    
    if (data.basePresent) {
      contentParts.push('Base');
    }
    if (data.towerPresent) {
      contentParts.push('Tower');
    }
    if (data.enemyCount > 0) {
      contentParts.push(`${data.enemyCount} Enemy${data.enemyCount > 1 ? 'ies' : ''}`);
    }
    
    this.contentElement.textContent = contentParts.length > 0 
      ? `Contains: ${contentParts.join(', ')}`
      : 'Empty';

    // Show panel
    this.detailPanel.classList.remove('hidden');
  }

  private closeTilePanel(): void {
    this.detailPanel.classList.add('hidden');
    
    // Clear selection from all entities
    const entities = this.world.getAllEntities();
    for (const entity of entities) {
      const selection = entity.getComponent('Selection') as SelectionComponent | undefined;
      if (selection) {
        selection.isSelected = false;
      }
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Public method to show tile details (can be called from other systems)
   */
  public displayTileInfo(entity: any): void {
    this.showTileDetails(entity);
  }

  /**
   * Public method to hide tile panel
   */
  public hideTilePanel(): void {
    this.closeTilePanel();
  }

  /**
   * Check if panel is currently visible
   */
  public isPanelVisible(): boolean {
    return !this.detailPanel.classList.contains('hidden');
  }
}