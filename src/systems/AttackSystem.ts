import { System, EntityManager, getComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  AttackComponent, 
  TargetingComponent, 
  TimingComponent,
  HealthComponent 
} from '../ecs/index.js';
import { createProjectile } from '../entities/index.js';

export class AttackSystem implements System {
  private projectileIdCounter = 0;
  
  update(entityManager: EntityManager, deltaTime: number): void {
    const towers = entityManager.withComponents(['Position', 'Attack', 'Targeting', 'Timing']);
    const enemies = entityManager.withComponents(['Position', 'Health']);
    
    for (const tower of towers) {
      const position = getComponent<PositionComponent>(tower, 'Position')!;
      const attack = getComponent<AttackComponent>(tower, 'Attack')!;
      const targeting = getComponent<TargetingComponent>(tower, 'Targeting')!;
      const timing = getComponent<TimingComponent>(tower, 'Timing')!;
      
      const currentTime = Date.now();
      
      if (currentTime - timing.lastAttackTime < attack.cooldown) {
        continue;
      }
      
      const target = this.findTarget(position, attack.range, enemies);
      if (!target) {
        targeting.currentTarget = null;
        continue;
      }
      
      targeting.currentTarget = target.id;
      timing.lastAttackTime = currentTime;
      
      const projectile = createProjectile(
        `projectile_${this.projectileIdCounter++}`,
        position.x,
        position.y,
        target.id,
        attack.damage
      );
      
      entityManager.addEntity(projectile);
    }
  }
  
  private findTarget(towerPos: PositionComponent, range: number, enemies: any[]) {
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const enemyPos = getComponent<PositionComponent>(enemy, 'Position')!;
      const distance = Math.sqrt(
        Math.pow(enemyPos.x - towerPos.x, 2) + 
        Math.pow(enemyPos.y - towerPos.y, 2)
      );
      
      if (distance <= range && distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    return closestEnemy;
  }
}