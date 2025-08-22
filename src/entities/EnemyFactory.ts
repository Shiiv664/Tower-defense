import { createEntity, addComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  HealthComponent, 
  MovementComponent, 
  RenderComponent,
  EntityTypeComponent
} from '../ecs/index.js';

export function createBasicEnemy(id: string, x: number, y: number) {
  const enemy = createEntity(id);
  
  addComponent<PositionComponent>(enemy, 'Position', { x, y });
  
  addComponent<HealthComponent>(enemy, 'Health', {
    current: 50,
    maximum: 50
  });
  
  addComponent<MovementComponent>(enemy, 'Movement', {
    baseSpeed: 30,
    currentSpeed: 30,
    direction: { x: 1, y: 0 }
  });
  
  addComponent<RenderComponent>(enemy, 'Render', {
    type: 'enemy',
    color: 0xF44336,
    size: 15,
    visible: true
  });

  addComponent<EntityTypeComponent>(enemy, 'EntityType', {
    type: 'enemy',
    faction: 'enemy'
  });
  
  return enemy;
}