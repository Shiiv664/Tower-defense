import { createEntity, addComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  HealthComponent, 
  AttackComponent, 
  RenderComponent, 
  TargetingComponent,
  TimingComponent 
} from '../ecs/index.js';

export function createBasicTower(id: string, x: number, y: number) {
  const tower = createEntity(id);
  
  addComponent<PositionComponent>(tower, 'Position', { x, y });
  
  addComponent<HealthComponent>(tower, 'Health', {
    current: 100,
    maximum: 100
  });
  
  addComponent<AttackComponent>(tower, 'Attack', {
    damage: 25,
    range: 100,
    cooldown: 1000
  });
  
  addComponent<RenderComponent>(tower, 'Render', {
    type: 'tower',
    color: 0x8BC34A,
    size: 20,
    visible: true
  });
  
  addComponent<TargetingComponent>(tower, 'Targeting', {
    strategy: 'closest',
    currentTarget: null,
    lastTargetingTime: 0
  });
  
  addComponent<TimingComponent>(tower, 'Timing', {
    lastAttackTime: 0
  });
  
  return tower;
}