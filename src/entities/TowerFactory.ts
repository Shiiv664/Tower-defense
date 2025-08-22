import { createEntity, addComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  HealthComponent, 
  AttackComponent, 
  RenderComponent, 
  TargetingComponent,
  TimingComponent,
  EntityTypeComponent
} from '../ecs/index.js';
import { ConfigManager } from '../config/index.js';

export function createTower(id: string, towerTypeId: string, x: number, y: number) {
  const configManager = ConfigManager.getInstance();
  const config = configManager.getTowerConfig(towerTypeId);
  
  if (!config) {
    throw new Error(`Tower configuration not found for type: ${towerTypeId}`);
  }
  
  const tower = createEntity(id);
  
  addComponent<PositionComponent>(tower, 'Position', { x, y });
  
  addComponent<HealthComponent>(tower, 'Health', {
    current: config.health.maximum,
    maximum: config.health.maximum
  });
  
  addComponent<AttackComponent>(tower, 'Attack', {
    damage: config.attack.damage,
    range: config.attack.range,
    cooldown: config.attack.cooldown
  });
  
  addComponent<RenderComponent>(tower, 'Render', {
    type: 'tower',
    color: config.render.color,
    size: config.render.size,
    visible: true
  });
  
  addComponent<TargetingComponent>(tower, 'Targeting', {
    strategy: config.targeting.strategy,
    currentTarget: null,
    lastTargetingTime: 0
  });
  
  addComponent<TimingComponent>(tower, 'Timing', {
    lastAttackTime: 0
  });

  addComponent<EntityTypeComponent>(tower, 'EntityType', {
    type: config.entityType.type,
    faction: config.entityType.faction
  });
  
  return tower;
}

// Convenience function for backward compatibility
export function createBasicTower(id: string, x: number, y: number) {
  return createTower(id, 'basic_tower', x, y);
}