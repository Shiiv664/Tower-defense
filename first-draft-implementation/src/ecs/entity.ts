import type { Component } from './component.js';

/**
 * Entity ID type for type safety
 */
export type EntityId = number;

/**
 * Entity class representing game objects in the ECS
 */
export class Entity {
  private static nextId = 1;
  private components = new Map<string, Component>();

  public readonly id: EntityId;

  constructor() {
    this.id = Entity.nextId++;
  }

  /**
   * Add a component to this entity
   */
  addComponent<T extends Component>(component: T): this {
    this.components.set(component.__componentType, component);
    return this;
  }

  /**
   * Get a component from this entity
   */
  getComponent<T extends Component>(componentType: string): T | undefined {
    return this.components.get(componentType) as T;
  }

  /**
   * Check if entity has a specific component
   */
  hasComponent(componentType: string): boolean {
    return this.components.has(componentType);
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(componentType: string): boolean {
    return this.components.delete(componentType);
  }

  /**
   * Get all components on this entity
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Get component types this entity has
   */
  getComponentTypes(): string[] {
    return Array.from(this.components.keys());
  }
}