import './style.css';
import * as THREE from 'three';
import { World } from './ecs/world.js';
import { TileSelectionSystem } from './systems/tile-selection-system.js';
import { HighlightRenderingSystem } from './systems/highlight-rendering-system.js';
import { GameUISystem } from './systems/game-ui-system.js';
import { TileGrid } from './tile-grid.js';

/**
 * Main Tower Defense First Draft Application
 */
class TowerDefenseApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private world!: World;
  private tileGrid!: TileGrid;
  private tileSelectionSystem!: TileSelectionSystem;
  private highlightRenderingSystem!: HighlightRenderingSystem;
  private gameUISystem!: GameUISystem;
  private canvas!: HTMLCanvasElement;
  
  private lastTime = 0;
  private isRunning = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupThreeJS();
    this.setupECS();
    this.setupInputHandling();
    this.setupTileGrid();
    this.start();
  }

  private setupThreeJS(): void {
    // Get canvas element
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x001122);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupECS(): void {
    this.world = new World();

    // Create and add systems
    this.tileSelectionSystem = new TileSelectionSystem(this.camera);
    this.highlightRenderingSystem = new HighlightRenderingSystem();
    this.gameUISystem = new GameUISystem();

    this.world.addSystem(this.tileSelectionSystem);
    this.world.addSystem(this.highlightRenderingSystem);
    this.world.addSystem(this.gameUISystem);
  }

  private setupInputHandling(): void {
    // Mouse events
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.tileSelectionSystem.onPointerMove({ x, y, type: 'mouse' });
    });

    this.canvas.addEventListener('mousedown', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.tileSelectionSystem.onPointerDown({ x, y, type: 'mouse' });
    });

    this.canvas.addEventListener('mouseup', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      this.tileSelectionSystem.onPointerUp({ x, y, type: 'mouse' });
    });

    // Touch events
    this.canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const rect = this.canvas.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.tileSelectionSystem.onPointerDown({ x, y, type: 'touch', id: touch.identifier });
      }
    });

    this.canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const rect = this.canvas.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.tileSelectionSystem.onPointerMove({ x, y, type: 'touch', id: touch.identifier });
      }
    });

    this.canvas.addEventListener('touchend', (event) => {
      event.preventDefault();
      
      // Handle two-finger touch cancellation
      if (event.touches.length >= 2) {
        this.tileSelectionSystem.onTwoFingerTouch();
        return;
      }
      
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const rect = this.canvas.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.tileSelectionSystem.onPointerUp({ x, y, type: 'touch', id: touch.identifier });
      }
    });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private setupTileGrid(): void {
    this.tileGrid = new TileGrid(this.scene, this.world, {
      width: 10,
      height: 10,
      tileSize: 1,
      spacing: 0.1
    });
    
    this.tileGrid.generateGrid();
  }

  private start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update ECS world
    this.world.update(deltaTime);

    // Render
    this.renderer.render(this.scene, this.camera);

    // Continue loop
    requestAnimationFrame(this.gameLoop);
  };

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public stop(): void {
    this.isRunning = false;
  }

  public destroy(): void {
    this.stop();
    this.tileGrid.clearGrid();
    this.world.clear();
    this.renderer.dispose();
  }
}

// Start the application
new TowerDefenseApp();
