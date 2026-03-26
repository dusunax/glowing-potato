// GameEvent type for messages shown to the player.
// Events are ephemeral and displayed in the UI temporarily.

export interface GameEvent {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
}
