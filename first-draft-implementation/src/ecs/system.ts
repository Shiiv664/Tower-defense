import { Entity } from './entity.js';
import { World } from './world.js';

/**
 * Base System class for ECS architecture
 */
export abstract class System {
  protected world!: World;

  /**
   * Component types this system is interested in
   */
  abstract readonly componentTypes: string[];

  /**
   * Initialize the system with a world reference
   */
  init(world: World): void {
    this.world = world;
  }

  /**
   * Update the system (called every frame)
   */
  abstract update(deltaTime: number): void;

  /**
   * Get entities that match this system's component requirements
   */
  protected getEntities(): Entity[] {
    return this.world.getEntitiesWithComponents(this.componentTypes);
  }

  /**
   * Called when system is added to world
   */
  onAdded(): void {
    // Override in subclasses if needed
  }

  /**
   * Called when system is removed from world
   */
  onRemoved(): void {
    // Override in subclasses if needed
  }
}