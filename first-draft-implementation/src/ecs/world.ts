import { Entity } from './entity.js';
import type { EntityId } from './entity.js';
import { System } from './system.js';

/**
 * World manages entities and systems in the ECS
 */
export class World {
  private entities = new Map<EntityId, Entity>();
  private systems: System[] = [];

  /**
   * Create a new entity
   */
  createEntity(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Remove an entity from the world
   */
  removeEntity(entityId: EntityId): boolean {
    return this.entities.delete(entityId);
  }

  /**
   * Get an entity by ID
   */
  getEntity(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Get all entities in the world
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities that have all specified components
   */
  getEntitiesWithComponents(componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter(entity =>
      componentTypes.every(type => entity.hasComponent(type))
    );
  }

  /**
   * Add a system to the world
   */
  addSystem(system: System): this {
    system.init(this);
    this.systems.push(system);
    system.onAdded();
    return this;
  }

  /**
   * Remove a system from the world
   */
  removeSystem(systemType: typeof System): boolean {
    const index = this.systems.findIndex(system => system instanceof systemType);
    if (index !== -1) {
      const system = this.systems[index];
      system.onRemoved();
      this.systems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update all systems (called every frame)
   */
  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  /**
   * Get system by type
   */
  getSystem<T extends System>(systemType: new () => T): T | undefined {
    return this.systems.find(system => system instanceof systemType) as T;
  }

  /**
   * Clear all entities and systems
   */
  clear(): void {
    this.entities.clear();
    this.systems.length = 0;
  }
}