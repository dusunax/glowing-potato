// Static list of mini-games available in the lobby.

import type { MiniGame } from '../types/minigame';

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'dont-say-it',
    name: "Don't Say It",
    emoji: '🤐',
    description: "Chat freely — but don't say your secret forbidden words! Last one standing wins.",
    status: 'available',
    color: '#be185d',
  },
  {
    id: 'collection',
    name: 'Glowing Potato',
    emoji: '🌿',
    description: 'Collect seasonal items, craft rare goods, and fill your discovery journal.',
    status: 'available',
    color: '#16a34a',
  },
];
