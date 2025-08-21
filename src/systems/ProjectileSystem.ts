import { System, EntityManager, getComponent } from '../ecs/index.js';
import type { 
  PositionComponent, 
  ProjectileComponent,
  HealthComponent 
} from '../ecs/index.js';

export class ProjectileSystem implements System {
  update(entityManager: EntityManager, deltaTime: number): void {
    const projectiles = entityManager.withComponents(['Position', 'Projectile']);
    const entitiesToRemove: string[] = [];
    
    for (const projectile of projectiles) {
      const position = getComponent<PositionComponent>(projectile, 'Position')!;
      const projectileComp = getComponent<ProjectileComponent>(projectile, 'Projectile')!;
      
      projectileComp.lifetime -= deltaTime;
      if (projectileComp.lifetime <= 0) {
        entitiesToRemove.push(projectile.id);
        continue;
      }
      
      const target = entityManager.getEntity(projectileComp.targetId);
      if (!target) {
        entitiesToRemove.push(projectile.id);
        continue;
      }
      
      const targetPos = getComponent<PositionComponent>(target, 'Position')!;
      const dx = targetPos.x - position.x;
      const dy = targetPos.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 5) {
        const targetHealth = getComponent<HealthComponent>(target, 'Health')!;
        targetHealth.current -= projectileComp.damage;
        
        if (targetHealth.current <= 0) {
          entitiesToRemove.push(target.id);
        }
        
        entitiesToRemove.push(projectile.id);
        continue;
      }
      
      const deltaTimeInSeconds = deltaTime / 1000;
      const directionX = dx / distance;
      const directionY = dy / distance;
      
      position.x += directionX * projectileComp.speed * deltaTimeInSeconds;
      position.y += directionY * projectileComp.speed * deltaTimeInSeconds;
    }
    
    for (const id of entitiesToRemove) {
      entityManager.removeEntity(id);
    }
  }
}