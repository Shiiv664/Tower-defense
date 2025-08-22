// Configuration interfaces for JSON-based entity definitions

export interface TowerConfig {
  id: string;
  name: string;
  description?: string;
  
  // Combat stats
  health: {
    maximum: number;
  };
  attack: {
    damage: number;
    range: number;
    cooldown: number; // milliseconds
  };
  
  // Rendering properties
  render: {
    color: number; // hex color
    size: number;
  };
  
  // Targeting behavior
  targeting: {
    strategy: 'closest' | 'strongest' | 'weakest';
  };
  
  // Game mechanics
  cost?: number;
  unlockLevel?: number;
  
  // Entity classification
  entityType: {
    type: 'tower';
    faction: 'player';
  };
}

export interface EnemyConfig {
  id: string;
  name: string;
  description?: string;
  
  // Combat stats
  health: {
    maximum: number;
  };
  
  // Movement properties
  movement: {
    baseSpeed: number;
  };
  
  // Rendering properties
  render: {
    color: number; // hex color
    size: number;
  };
  
  // Game mechanics
  reward?: number; // currency/points awarded when defeated
  spawnWeight?: number; // relative probability of spawning
  
  // Entity classification
  entityType: {
    type: 'enemy';
    faction: 'enemy';
  };
}

export interface ProjectileConfig {
  id: string;
  name: string;
  description?: string;
  
  // Combat stats
  damage: number;
  speed: number;
  lifetime: number; // frames or milliseconds
  
  // Rendering properties
  render: {
    color: number; // hex color
    size: number;
  };
  
  // Special effects
  piercing?: boolean;
  explosionRadius?: number;
  statusEffects?: Array<{
    type: string;
    duration: number;
    strength: number;
  }>;
  
  // Entity classification
  entityType: {
    type: 'projectile';
    faction: 'player' | 'enemy' | 'neutral';
  };
}

export interface MapConfig {
  id: string;
  name: string;
  description?: string;
  
  // Map dimensions
  width: number;
  height: number;
  
  // Tile layout - could be expanded later
  spawn: { x: number; y: number };
  goal: { x: number; y: number };
  
  // Gameplay properties
  difficulty?: number;
  waveCount?: number;
  startingMoney?: number;
}

// Union types for type safety
export type EntityConfig = TowerConfig | EnemyConfig | ProjectileConfig;
export type ConfigType = EntityConfig | MapConfig;

// Helper type guards
export function isTowerConfig(config: any): config is TowerConfig {
  return config?.entityType?.type === 'tower';
}

export function isEnemyConfig(config: any): config is EnemyConfig {
  return config?.entityType?.type === 'enemy';
}

export function isProjectileConfig(config: any): config is ProjectileConfig {
  return config?.entityType?.type === 'projectile';
}

export function isMapConfig(config: any): config is MapConfig {
  return config && typeof config.width === 'number' && typeof config.height === 'number';
}