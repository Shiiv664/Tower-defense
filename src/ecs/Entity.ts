export interface Component {
  [key: string]: any;
}

export interface Entity {
  id: string;
  components: Map<string, Component>;
}

export function createEntity(id: string): Entity {
  return {
    id,
    components: new Map<string, Component>()
  };
}

export function addComponent<T extends Component>(entity: Entity, name: string, component: T): void {
  entity.components.set(name, component);
}

export function getComponent<T extends Component>(entity: Entity, name: string): T | undefined {
  return entity.components.get(name) as T | undefined;
}

export function hasComponent(entity: Entity, name: string): boolean {
  return entity.components.has(name);
}

export function removeComponent(entity: Entity, name: string): void {
  entity.components.delete(name);
}