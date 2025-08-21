import { EntityManager } from './ecs/index.js';
import { TileMap } from './tiles/index.js';
import { FlowField } from './pathfinding/index.js';
import { Renderer } from './rendering/index.js';
import { MovementSystem, AttackSystem, ProjectileSystem } from './systems/index.js';
import { createBasicTower, createBasicEnemy } from './entities/index.js';

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
    
    this.renderer.renderer.domElement.addEventListener('click', (event) => {
      this.handleCanvasClick(event);
    });
  }
  
  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.renderer.renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const worldPos = this.screenToWorld(x, y);
    const tileX = Math.floor(worldPos.x / 40);
    const tileY = Math.floor(worldPos.y / 40);
    
    if (this.placingTower) {
      this.placeTower(tileX, tileY);
    } else if (this.removingTower) {
      this.removeTower(tileX, tileY);
    }
  }
  
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const canvas = this.renderer.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    const normalizedX = (screenX / rect.width) * 2 - 1;
    const normalizedY = -(screenY / rect.height) * 2 + 1;
    
    const viewSize = Math.max(this.tileMap.width, this.tileMap.height) * 40;
    const aspect = rect.width / rect.height;
    
    const worldX = (normalizedX * viewSize * aspect / 2) + (this.tileMap.width * 20);
    const worldY = (-normalizedY * viewSize / 2) + (this.tileMap.height * 20);
    
    return { x: worldX, y: worldY };
  }
  
  private placeTower(tileX: number, tileY: number): void {
    if (!this.tileMap.isBuildable(tileX, tileY)) {
      console.log('Cannot build on this tile');
      return;
    }
    
    const worldX = tileX * 40;
    const worldY = tileY * 40;
    
    const existingTower = this.findTowerAt(worldX, worldY);
    if (existingTower) {
      console.log('Tower already exists here');
      return;
    }
    
    const tower = createBasicTower(`tower_${this.towerIdCounter++}`, worldX, worldY);
    this.entityManager.addEntity(tower);
    
    this.placingTower = false;
    document.getElementById('place-tower-btn')?.classList.remove('active');
    const status = document.getElementById('status');
    if (status) status.textContent = 'Tower placed!';
  }
  
  private removeTower(tileX: number, tileY: number): void {
    const worldX = tileX * 40;
    const worldY = tileY * 40;
    
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
        const enemy = createBasicEnemy(
          `enemy_${this.enemyIdCounter++}`,
          spawn.x * 40,
          spawn.y * 40
        );
        this.entityManager.addEntity(enemy);
      }, i * 1000);
    }
  }
}