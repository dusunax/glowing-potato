// Type definitions for the "Don't Say It" mini-game.

export type RoomVisibility = 'public' | 'private';
export type GamePhase = 'waiting' | 'voting' | 'playing' | 'finished';

/** Summary of a chat room as shown in the lobby list. */
export interface DsiRoomSummary {
  id: string;
  title: string;
  visibility: RoomVisibility;
  playerCount: number;
  maxPlayers: number;
}

/**
 * One forbidden-word slot per player.
 * During the voting phase other players see the candidate words and vote;
 * the candidate with the most votes becomes the final forbidden word.
 * The owning player never sees their own word.
 */
export interface DsiWordSlot {
  candidates: string[];      // 3 options presented to voters
  votesByWord: number[];     // vote count per candidate (same length as candidates)
  finalWord: string | null;  // set after voting resolves
}

/** A player inside the game room. */
export interface DsiPlayer {
  id: string;
  name: string;
  /** One word slot with 3 candidates and vote tallies. */
  wordSlots: DsiWordSlot[];
  isOut: boolean;
  isBot: boolean;
  isInRoom?: boolean;
}

/** A single line in the in-game chat. */
export interface DsiChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  /** Set to the forbidden word when this message caused the player to be eliminated. */
  triggeredWord?: string;
}

/** Full game state for an active room session. */
export interface DsiGameState {
  phase: GamePhase;
  roomId: string;
  roomTitle: string;
  roomVisibility: RoomVisibility;
  localPlayerId: string;
  /** True when the local player is the one who created this room. */
  isHost: boolean;
  players: DsiPlayer[];
  messages: DsiChatMessage[];
  /** Seconds remaining in the voting phase countdown. */
  votingTimeLeft: number;
  winnerId: string | null;
}
