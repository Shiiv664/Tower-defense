import { EntityManager } from './EntityManager.js';

export interface System {
  update(entityManager: EntityManager, deltaTime: number): void;
}