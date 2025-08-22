import { createEntity, addComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  ProjectileComponent, 
  RenderComponent,
  EntityTypeComponent
} from '../ecs/index.js';
import { ConfigManager } from '../config/index.js';

export function createProjectile(id: string, projectileTypeId: string, x: number, y: number, targetId: string, overrideDamage?: number) {
  const configManager = ConfigManager.getInstance();
  const config = configManager.getProjectileConfig(projectileTypeId);
  
  if (!config) {
    throw new Error(`Projectile configuration not found for type: ${projectileTypeId}`);
  }
  
  const projectile = createEntity(id);
  
  addComponent<PositionComponent>(projectile, 'Position', { x, y });
  
  addComponent<ProjectileComponent>(projectile, 'Projectile', {
    targetId,
    speed: config.speed,
    damage: overrideDamage ?? config.damage,
    lifetime: config.lifetime
  });
  
  addComponent<RenderComponent>(projectile, 'Render', {
    type: 'projectile',
    color: config.render.color,
    size: config.render.size,
    visible: true
  });

  addComponent<EntityTypeComponent>(projectile, 'EntityType', {
    type: config.entityType.type,
    faction: config.entityType.faction
  });
  
  return projectile;
}

// Convenience function for backward compatibility
export function createBasicProjectile(id: string, x: number, y: number, targetId: string, damage?: number) {
  return createProjectile(id, 'basic_projectile', x, y, targetId, damage);
}