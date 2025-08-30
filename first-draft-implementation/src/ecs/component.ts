/**
 * Base Component interface for ECS architecture
 */
export interface Component {
  readonly __componentType: string;
}

/**
 * Component constructor type for type safety
 */
export type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;

/**
 * Component registry for type-safe component management
 */
class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components = new Map<string, ComponentConstructor>();

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  register<T extends Component>(componentClass: ComponentConstructor<T>): void {
    const instance = new componentClass();
    this.components.set(instance.__componentType, componentClass);
  }

  get<T extends Component>(componentType: string): ComponentConstructor<T> | undefined {
    return this.components.get(componentType) as ComponentConstructor<T>;
  }
}

export const componentRegistry = ComponentRegistry.getInstance();

/**
 * Decorator for component registration
 */
export function RegisterComponent<T extends ComponentConstructor>(target: T): T {
  componentRegistry.register(target);
  return target;
}