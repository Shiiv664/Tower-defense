import { createEntity, addComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  ProjectileComponent, 
  RenderComponent 
} from '../ecs/index.js';

export function createProjectile(id: string, x: number, y: number, targetId: string, damage: number) {
  const projectile = createEntity(id);
  
  addComponent<PositionComponent>(projectile, 'Position', { x, y });
  
  addComponent<ProjectileComponent>(projectile, 'Projectile', {
    targetId,
    speed: 200,
    damage,
    lifetime: 3000
  });
  
  addComponent<RenderComponent>(projectile, 'Render', {
    type: 'projectile',
    color: 0xFFEB3B,
    size: 5,
    visible: true
  });
  
  return projectile;
}