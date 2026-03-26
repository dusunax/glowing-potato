// Type definition for a mini-game entry shown in the lobby.

export interface MiniGame {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: 'available' | 'coming-soon';
  color: string; // CSS hex color used for the card accent and glow shadow
}
