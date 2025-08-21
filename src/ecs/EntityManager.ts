import { Entity } from './Entity.js';

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private componentIndex: Map<string, Set<string>> = new Map();
  private queryCache: Map<string, Entity[]> = new Map();

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.updateComponentIndex(entity);
    this.invalidateQueryCache();
  }

  removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.removeFromComponentIndex(entity);
      this.entities.delete(id);
      this.invalidateQueryCache();
    }
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  withComponents(componentTypes: string[]): Entity[] {
    const queryKey = componentTypes.sort().join(',');
    
    if (this.queryCache.has(queryKey)) {
      return this.queryCache.get(queryKey)!;
    }
    
    const result = this.executeQuery(componentTypes);
    this.queryCache.set(queryKey, result);
    return result;
  }

  private executeQuery(componentTypes: string[]): Entity[] {
    const result: Entity[] = [];
    
    for (const entity of this.entities.values()) {
      if (componentTypes.every(type => entity.components.has(type))) {
        result.push(entity);
      }
    }
    
    return result;
  }

  private updateComponentIndex(entity: Entity): void {
    for (const componentType of entity.components.keys()) {
      if (!this.componentIndex.has(componentType)) {
        this.componentIndex.set(componentType, new Set());
      }
      this.componentIndex.get(componentType)!.add(entity.id);
    }
  }

  private removeFromComponentIndex(entity: Entity): void {
    for (const componentType of entity.components.keys()) {
      const entitySet = this.componentIndex.get(componentType);
      if (entitySet) {
        entitySet.delete(entity.id);
        if (entitySet.size === 0) {
          this.componentIndex.delete(componentType);
        }
      }
    }
  }

  private invalidateQueryCache(): void {
    this.queryCache.clear();
  }
}