export interface PositionComponent {
  x: number;
  y: number;
}

export interface HealthComponent {
  current: number;
  maximum: number;
}

export interface AttackComponent {
  damage: number;
  range: number;
  cooldown: number;
}

export interface MovementComponent {
  baseSpeed: number;
  currentSpeed: number;
  direction: { x: number; y: number };
}

export interface RenderComponent {
  type: 'tower' | 'enemy' | 'projectile' | 'tile';
  color: number;
  size?: number;
  visible: boolean;
}

export interface TargetingComponent {
  strategy: 'closest' | 'strongest' | 'weakest';
  currentTarget: string | null;
  lastTargetingTime: number;
}

export interface ProjectileComponent {
  targetId: string;
  speed: number;
  damage: number;
  lifetime: number;
}

export interface TimingComponent {
  lastAttackTime: number;
}