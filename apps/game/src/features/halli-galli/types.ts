// Type definitions for the Halli Galli mini-game.
// Players flip fruit cards and ring the bell when any single fruit
// totals exactly 5 across all visible table cards.

export type RoomVisibility = 'public' | 'private';
export type HgGamePhase = 'waiting' | 'playing' | 'finished';

/** Summary of a room as shown in the lobby list. */
export interface HgRoomSummary {
  id: string;
  title: string;
  visibility: RoomVisibility;
  playerCount: number;
  maxPlayers: number;
}

/** A player inside the game room. */
export interface HgPlayer {
  id: string;
  name: string;
  /** Currently visible card code ("strawberry-3"), null when not flipped or table cleared. */
  topCard: string | null;
  /** Remaining cards in the player's deck. */
  deckCount: number;
  /** Index of the next card to draw from the seeded deck. */
  deckIndex: number;
  /** Number of correct bell rings. */
  score: number;
  /** False when the player has disconnected or left. */
  isInRoom: boolean;
}

/** A pending bell-ring event (written by the ringing player, resolved by host). */
export interface HgBellRing {
  playerId: string;
  timestamp: number;
}

/** The result of a bell-ring event, written by the host after validation. */
export interface HgBellResult {
  playerId: string;
  isCorrect: boolean;
  /** The fruit that summed to 5, or null if the ring was wrong. */
  fruit: string | null;
  resolvedAt: number;
}

/** Full game state for an active room session (derived from RTDB snapshot). */
export interface HgGameState {
  phase: HgGamePhase;
  roomId: string;
  roomTitle: string;
  roomVisibility: RoomVisibility;
  hostId: string;
  localPlayerId: string;
  isHost: boolean;
  maxPlayers: number;
  players: HgPlayer[];
  gameTimeLeft: number;
  winnerId: string | null;
  bellRing: HgBellRing | null;
  bellResult: HgBellResult | null;
  /** Shared seed used to deterministically generate each player's deck. */
  gameSeed: string;
}
