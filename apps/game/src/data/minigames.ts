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
    id: 'halli-galli',
    name: '할리갈리',
    emoji: '🔔',
    description: '과일 카드를 뒤집어 합계가 5가 되면 빠르게 벨을 눌러요! 실시간 멀티플레이어 과일 반응 게임.',
    status: 'available',
    color: '#ca8a04',
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
