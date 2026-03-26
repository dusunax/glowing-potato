// Displays current world conditions (season, weather, time, day) and the End Turn button.

import type { WorldConditions } from '../../types/conditions';
import { TIME_PERIOD_EMOJIS } from '../../constants/timePeriods';
import { getSeasonColor } from '../../utils/time';
import type { GameEvent } from '../../types/events';

interface ConditionsPanelProps {
  conditions: WorldConditions;
  onAdvanceTime: () => void;
  onCollect: () => void;
  events: GameEvent[];
}

const WEATHER_EMOJIS: Record<string, string> = {
  Sunny: '☀️', Rainy: '🌧️', Cloudy: '☁️', Foggy: '🌫️', Snowy: '❄️',
};

export function ConditionsPanel({ conditions, onAdvanceTime, onCollect, events }: ConditionsPanelProps) {
  const tpEmoji = TIME_PERIOD_EMOJIS[conditions.timePeriod];
  const seasonColor = getSeasonColor(conditions.season);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tpEmoji}</span>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Time</div>
            <div className="font-semibold">{conditions.timePeriod}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{WEATHER_EMOJIS[conditions.weather]}</span>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Weather</div>
            <div className="font-semibold">{conditions.weather}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍃</span>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Season</div>
            <div className={`font-semibold ${seasonColor}`}>{conditions.season}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Day</div>
            <div className="font-semibold">{conditions.day}</div>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onCollect}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
          >
            🌿 Collect
          </button>
          <button
            onClick={onAdvanceTime}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors"
          >
            ⏭ End Turn
          </button>
        </div>
      </div>
      {events.length > 0 && (
        <div className="space-y-1">
          {events.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              className={`text-sm px-3 py-1 rounded-md ${
                ev.type === 'success' ? 'bg-emerald-900/50 text-emerald-300' :
                ev.type === 'warning' ? 'bg-amber-900/50 text-amber-300' :
                'bg-slate-800 text-slate-300'
              }`}
            >
              {ev.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
