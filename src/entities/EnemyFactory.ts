import { createEntity, addComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  HealthComponent, 
  MovementComponent, 
  RenderComponent,
  EntityTypeComponent
} from '../ecs/index.js';
import { ConfigManager } from '../config/index.js';

export function createEnemy(id: string, enemyTypeId: string, x: number, y: number) {
  const configManager = ConfigManager.getInstance();
  const config = configManager.getEnemyConfig(enemyTypeId);
  
  if (!config) {
    throw new Error(`Enemy configuration not found for type: ${enemyTypeId}`);
  }
  
  const enemy = createEntity(id);
  
  addComponent<PositionComponent>(enemy, 'Position', { x, y });
  
  addComponent<HealthComponent>(enemy, 'Health', {
    current: config.health.maximum,
    maximum: config.health.maximum
  });
  
  addComponent<MovementComponent>(enemy, 'Movement', {
    baseSpeed: config.movement.baseSpeed,
    currentSpeed: config.movement.baseSpeed,
    direction: { x: 1, y: 0 }
  });
  
  addComponent<RenderComponent>(enemy, 'Render', {
    type: 'enemy',
    color: config.render.color,
    size: config.render.size,
    visible: true
  });

  addComponent<EntityTypeComponent>(enemy, 'EntityType', {
    type: config.entityType.type,
    faction: config.entityType.faction
  });
  
  return enemy;
}

// Convenience function for backward compatibility
export function createBasicEnemy(id: string, x: number, y: number) {
  return createEnemy(id, 'basic_enemy', x, y);
}