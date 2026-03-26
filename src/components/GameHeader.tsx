import type { WorldConditions } from '../types/game';

interface Props {
  conditions: WorldConditions;
  paused: boolean;
  onTogglePause: () => void;
  discoveredCount: number;
  totalItems: number;
}

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️'
};
const TIME_EMOJI: Record<string, string> = {
  dawn: '🌅', morning: '🌤️', afternoon: '🌞', dusk: '🌆', night: '🌙', midnight: '⭐'
};

export function GameHeader({ conditions, paused, onTogglePause, discoveredCount, totalItems }: Props) {
  return (
    <header className="bg-green-900/80 border-b-4 border-green-600 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-green-300 text-sm md:text-base font-pixel tracking-wider">
            🌿 Petal Grove
          </h1>
          <p className="text-green-500 text-xs mt-1 font-pixel">Day {conditions.dayCount}</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-pixel">
          <span className="text-yellow-300">
            {SEASON_EMOJI[conditions.season]} {conditions.season}
          </span>
          <span className="text-blue-300">
            {TIME_EMOJI[conditions.timeOfDay]} {conditions.timeOfDay}
          </span>
          <span className="text-purple-300">
            📖 {discoveredCount}/{totalItems}
          </span>
          <button
            onClick={onTogglePause}
            className="pixel-btn bg-green-800 text-green-200 px-3 py-1 text-xs rounded border-green-500"
          >
            {paused ? '▶ Play' : '⏸ Pause'}
          </button>
        </div>
      </div>
    </header>
  );
}
