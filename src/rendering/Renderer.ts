import * as THREE from 'three';
import { EntityManager, getComponent } from '../ecs/index.js';
import type { PositionComponent, RenderComponent } from '../ecs/index.js';
import { TileMap } from '../tiles/index.js';

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private entityMeshes: Map<string, THREE.Mesh> = new Map();
  private tileMeshes: THREE.Mesh[] = [];
  
  constructor(container: HTMLElement, mapWidth: number, mapHeight: number) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2c3e50);
    
    const aspect = container.clientWidth / container.clientHeight;
    const viewSize = Math.max(mapWidth, mapHeight) * 40;
    
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect / 2,
      viewSize * aspect / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    
    this.camera.position.set(mapWidth * 20, mapHeight * 20, 100);
    this.camera.lookAt(mapWidth * 20, mapHeight * 20, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    container.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', () => this.onWindowResize(container));
  }
  
  initializeTiles(tileMap: TileMap): void {
    this.clearTiles();
    
    const tileSize = 40;
    const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
    
    for (let y = 0; y < tileMap.height; y++) {
      for (let x = 0; x < tileMap.width; x++) {
        const tile = tileMap.getTile(x, y);
        if (!tile) continue;
        
        const color = tile.getProperty<number>('color', 0x4CAF50);
        const material = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(x * tileSize, y * tileSize, 0);
        this.scene.add(mesh);
        this.tileMeshes.push(mesh);
      }
    }
  }
  
  render(entityManager: EntityManager): void {
    const renderableEntities = entityManager.withComponents(['Position', 'Render']);
    const currentEntityIds = new Set<string>();
    
    for (const entity of renderableEntities) {
      currentEntityIds.add(entity.id);
      const position = getComponent<PositionComponent>(entity, 'Position')!;
      const render = getComponent<RenderComponent>(entity, 'Render')!;
      
      if (!render.visible) {
        continue;
      }
      
      let mesh = this.entityMeshes.get(entity.id);
      
      if (!mesh) {
        mesh = this.createEntityMesh(render);
        this.entityMeshes.set(entity.id, mesh);
        this.scene.add(mesh);
      }
      
      mesh.position.set(position.x, position.y, 1);
    }
    
    for (const [entityId, mesh] of this.entityMeshes) {
      if (!currentEntityIds.has(entityId)) {
        this.scene.remove(mesh);
        this.entityMeshes.delete(entityId);
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  private createEntityMesh(render: RenderComponent): THREE.Mesh {
    const size = render.size || 20;
    let geometry: THREE.BufferGeometry;
    
    switch (render.type) {
      case 'tower':
        geometry = new THREE.BoxGeometry(size, size, size);
        break;
      case 'enemy':
        geometry = new THREE.SphereGeometry(size / 2, 8, 6);
        break;
      case 'projectile':
        geometry = new THREE.SphereGeometry(size / 2, 4, 3);
        break;
      default:
        geometry = new THREE.BoxGeometry(size, size, size);
    }
    
    const material = new THREE.MeshBasicMaterial({ color: render.color });
    return new THREE.Mesh(geometry, material);
  }
  
  private clearTiles(): void {
    for (const mesh of this.tileMeshes) {
      this.scene.remove(mesh);
    }
    this.tileMeshes = [];
  }
  
  private onWindowResize(container: HTMLElement): void {
    const aspect = container.clientWidth / container.clientHeight;
    const viewSize = 400;
    
    this.camera.left = -viewSize * aspect / 2;
    this.camera.right = viewSize * aspect / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }

  dispose(): void {
    this.renderer.dispose();
  }
}