import { EntityManager } from './ecs/index.js';
import { TileMap } from './tiles/index.js';
import { FlowField } from './pathfinding/index.js';
import { Renderer } from './rendering/index.js';
import { MovementSystem, AttackSystem, ProjectileSystem } from './systems/index.js';
import { createBasicTower, createBasicEnemy } from './entities/index.js';
import { ConfigManager } from './config/index.js';
import { CoordinateSystem } from './utils/CoordinateSystem.js';

export class Game {
  private entityManager: EntityManager;
  private tileMap: TileMap;
  private flowField: FlowField;
  private renderer: Renderer;
  
  private movementSystem: MovementSystem;
  private attackSystem: AttackSystem;
  private projectileSystem: ProjectileSystem;
  
  private lastTime = 0;
  private isRunning = false;
  private enemyIdCounter = 0;
  private towerIdCounter = 0;
  
  private placingTower = false;
  private removingTower = false;
  
  constructor(container: HTMLElement) {
    this.entityManager = new EntityManager();
    
    // Initialize with default dimensions - will be updated in initialize()
    this.tileMap = new TileMap(20, 15);
    
    const goal = this.tileMap.findGoalPoint();
    if (!goal) throw new Error('No goal point found');
    
    this.flowField = new FlowField(this.tileMap, goal.x, goal.y);
    
    this.renderer = new Renderer(container, this.tileMap.width, this.tileMap.height);
    this.renderer.initializeTiles(this.tileMap);
    
    this.movementSystem = new MovementSystem(this.flowField);
    this.attackSystem = new AttackSystem();
    this.projectileSystem = new ProjectileSystem();
    
    this.setupEventListeners();
  }
  
  async initialize(): Promise<void> {
    const configManager = ConfigManager.getInstance();
    await configManager.initialize();
    
    // Load map configuration and recreate map with correct dimensions
    const mapConfig = configManager.getMapConfig('basic_map');
    if (mapConfig) {
      console.log('Loading map configuration:', mapConfig);
      
      // Create new tile map with configured dimensions and spawn/goal positions
      this.tileMap = new TileMap(mapConfig.width, mapConfig.height, mapConfig.spawn, mapConfig.goal);
      
      // Recreate flow field with new map
      const goal = this.tileMap.findGoalPoint();
      if (!goal) throw new Error('No goal point found in configured map');
      
      this.flowField = new FlowField(this.tileMap, goal.x, goal.y);
      
      // Update renderer with new dimensions and reinitialize tiles
      this.renderer.updateDimensions(this.tileMap.width, this.tileMap.height);
      this.renderer.initializeTiles(this.tileMap);
      
      // Recreate movement system with new flow field
      this.movementSystem = new MovementSystem(this.flowField);
      
      console.log(`Map loaded: ${mapConfig.width}x${mapConfig.height}, spawn: ${mapConfig.spawn.x},${mapConfig.spawn.y}, goal: ${mapConfig.goal.x},${mapConfig.goal.y}`);
    } else {
      console.warn('Failed to load map config, using default dimensions');
    }
    
    console.log('Game configuration system initialized');
  }
  
  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  stop(): void {
    this.isRunning = false;
  }
  
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(this.gameLoop);
  };
  
  private update(deltaTime: number): void {
    this.movementSystem.update(this.entityManager, deltaTime);
    this.attackSystem.update(this.entityManager, deltaTime);
    this.projectileSystem.update(this.entityManager, deltaTime);
  }
  
  private render(): void {
    this.renderer.render(this.entityManager);
  }
  
  private setupEventListeners(): void {
    const placeTowerBtn = document.getElementById('place-tower-btn');
    const removeTowerBtn = document.getElementById('remove-tower-btn');
    const startWaveBtn = document.getElementById('start-wave-btn');
    const status = document.getElementById('status');
    
    if (placeTowerBtn) {
      placeTowerBtn.addEventListener('click', () => {
        this.placingTower = !this.placingTower;
        this.removingTower = false;
        placeTowerBtn.classList.toggle('active', this.placingTower);
        removeTowerBtn?.classList.remove('active');
        if (status) status.textContent = this.placingTower ? 'Click to place tower' : 'Ready';
      });
    }
    
    if (removeTowerBtn) {
      removeTowerBtn.addEventListener('click', () => {
        this.removingTower = !this.removingTower;
        this.placingTower = false;
        removeTowerBtn.classList.toggle('active', this.removingTower);
        placeTowerBtn?.classList.remove('active');
        if (status) status.textContent = this.removingTower ? 'Click to remove tower' : 'Ready';
      });
    }
    
    if (startWaveBtn) {
      startWaveBtn.addEventListener('click', () => {
        this.spawnWave();
        if (status) status.textContent = 'Wave started!';
      });
    }
    
    this.renderer.getDOMElement().addEventListener('click', (event) => {
      this.handleCanvasClick(event);
    });
  }
  
  private handleCanvasClick(event: MouseEvent): void {
    const coordinateSystem = CoordinateSystem.getInstance();
    const tileCoords = coordinateSystem.screenToTileCoordinates(
      event.clientX,
      event.clientY,
      this.renderer.getCamera(),
      this.renderer.getDOMElement()
    );
    
    if (this.placingTower) {
      this.placeTower(tileCoords.x, tileCoords.y);
    } else if (this.removingTower) {
      this.removeTower(tileCoords.x, tileCoords.y);
    }
  }
  
  
  private placeTower(tileX: number, tileY: number): void {
    if (!this.tileMap.isBuildable(tileX, tileY)) {
      return;
    }
    
    const coordinateSystem = CoordinateSystem.getInstance();
    const worldCenter = coordinateSystem.getTileCenterWorld(tileX, tileY);
    const worldX = worldCenter.x;
    const worldY = worldCenter.y;
    
    const existingTower = this.findTowerAt(worldX, worldY);
    if (existingTower) {
      return;
    }
    
    const tower = createBasicTower(`tower_${this.towerIdCounter++}`, worldX, worldY);
    this.entityManager.addEntity(tower);
    
    // Don't automatically disable placing mode - let user place multiple towers
    const status = document.getElementById('status');
    if (status) status.textContent = `Tower placed!`;
  }
  
  private removeTower(tileX: number, tileY: number): void {
    const coordinateSystem = CoordinateSystem.getInstance();
    const worldCoords = coordinateSystem.tileToWorldCoordinates(tileX, tileY);
    const worldX = worldCoords.x;
    const worldY = worldCoords.y;
    
    const tower = this.findTowerAt(worldX, worldY);
    if (tower) {
      this.entityManager.removeEntity(tower.id);
      
      this.removingTower = false;
      document.getElementById('remove-tower-btn')?.classList.remove('active');
      const status = document.getElementById('status');
      if (status) status.textContent = 'Tower removed!';
    }
  }
  
  private findTowerAt(x: number, y: number) {
    const towers = this.entityManager.withComponents(['Position', 'Attack']);
    
    for (const tower of towers) {
      const pos = tower.components.get('Position') as any;
      const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      if (distance < 20) {
        return tower;
      }
    }
    
    return null;
  }
  
  private spawnWave(): void {
    const spawn = this.tileMap.findSpawnPoint();
    if (!spawn) return;
    
    const enemyCount = 5;
    
    for (let i = 0; i < enemyCount; i++) {
      setTimeout(() => {
        const coordinateSystem = CoordinateSystem.getInstance();
        const spawnWorldCoords = coordinateSystem.tileToWorldCoordinates(spawn.x, spawn.y);
        const enemy = createBasicEnemy(
          `enemy_${this.enemyIdCounter++}`,
          spawnWorldCoords.x,
          spawnWorldCoords.y
        );
        this.entityManager.addEntity(enemy);
      }, i * 1000);
    }
  }
}