export const GAME_CONSTANTS = {
  TILE_SIZE: 40,
} as const;

export type GameConstants = typeof GAME_CONSTANTS;