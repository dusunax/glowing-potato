// Static list of mini-games available in the lobby.

import type { MiniGame } from '../types/minigame';

export const MINI_GAMES: MiniGame[] = [
  {
    id: 'collection',
    name: 'Glowing Potato',
    emoji: '🌿',
    description: 'Collect seasonal items, craft rare goods, and fill your discovery journal.',
    status: 'available',
    color: '#16a34a',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    emoji: '🃏',
    description: 'Flip cards and match pairs before time runs out.',
    status: 'coming-soon',
    color: '#7c3aed',
  },
  {
    id: 'puzzle',
    name: 'Rune Puzzle',
    emoji: '🧩',
    description: 'Arrange ancient rune tiles to unlock mysterious patterns.',
    status: 'coming-soon',
    color: '#b45309',
  },
  {
    id: 'trivia',
    name: 'Nature Quiz',
    emoji: '🌍',
    description: 'Test your knowledge of the natural world across all seasons.',
    status: 'coming-soon',
    color: '#0e7490',
  },
  {
    id: 'clicker',
    name: 'Harvest Rush',
    emoji: '🌾',
    description: 'Click fast to harvest as many crops as possible before sunset.',
    status: 'coming-soon',
    color: '#ca8a04',
  },
];
