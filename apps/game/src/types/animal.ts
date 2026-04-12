// Type definitions for wild animals that roam the game world.

import type { ItemRarity } from './items';

export type AnimalBehavior = 'hostile' | 'neutral';

export interface AnimalSpriteFrameSource {
  kind: 'frames';
  frames: string[];
  frameCount?: number;
  frameDurationMs?: number;
}

export interface AnimalSpriteGifSource {
  kind: 'gif';
  src: string;
}

export interface AnimalSpriteSheetSource {
  kind: 'spriteSheet';
  src: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  row?: number;
  frameIndexes?: number[];
  frameCount?: number;
  frameDurationMs?: number;
}

export type AnimalSpriteSource = string | AnimalSpriteGifSource | AnimalSpriteFrameSource | AnimalSpriteSheetSource;

export interface AnimalTemplate {
  name: string;
  emoji: string;
  /** Optional sprite image URL (loaded from characters assets). */
  sprite?: AnimalSpriteSource;
  behavior: AnimalBehavior;
  maxHp: number;
  /** Damage dealt to player when attacking */
  attack: number;
  /** Experience awarded when defeated */
  experienceReward: number;
  rarity: ItemRarity;
}

export interface WildAnimal extends AnimalTemplate {
  /** Unique instance id */
  id: string;
  position: { x: number; y: number };
  hp: number;
  alive: boolean;
}
