import { System, EntityManager, getComponent } from '../ecs/index.js';
import type { PositionComponent, MovementComponent } from '../ecs/index.js';
import { FlowField } from '../pathfinding/index.js';

export class MovementSystem implements System {
  constructor(private flowField: FlowField) {}
  
  update(entityManager: EntityManager, deltaTime: number): void {
    const enemies = entityManager.withComponents(['Position', 'Movement']);
    
    for (const enemy of enemies) {
      const position = getComponent<PositionComponent>(enemy, 'Position')!;
      const movement = getComponent<MovementComponent>(enemy, 'Movement')!;
      
      const flowDirection = this.flowField.getFlowDirection(position.x, position.y);
      if (flowDirection) {
        movement.direction.x = flowDirection.x;
        movement.direction.y = flowDirection.y;
      }
      
      const deltaTimeInSeconds = deltaTime / 1000;
      position.x += movement.direction.x * movement.currentSpeed * deltaTimeInSeconds;
      position.y += movement.direction.y * movement.currentSpeed * deltaTimeInSeconds;
    }
  }
}