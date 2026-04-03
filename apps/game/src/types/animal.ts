// Type definitions for wild animals that roam the game world.

export type AnimalBehavior = 'hostile' | 'neutral';

export interface AnimalTemplate {
  name: string;
  emoji: string;
  behavior: AnimalBehavior;
  maxHp: number;
  /** Damage dealt to player when attacking */
  attack: number;
}

export interface WildAnimal extends AnimalTemplate {
  /** Unique instance id */
  id: string;
  position: { x: number; y: number };
  hp: number;
  alive: boolean;
}
