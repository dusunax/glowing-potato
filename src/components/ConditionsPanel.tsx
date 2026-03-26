import type { WorldConditions } from '../types/game';
import { WORLD_EVENTS, SEASON_DESCRIPTIONS, WEATHER_DESCRIPTIONS } from '../data/events';

interface Props {
  conditions: WorldConditions;
  spawnCount: number;
}

const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '🌨️', misty: '🌫️'
};

export function ConditionsPanel({ conditions, spawnCount }: Props) {
  const activeEvents = WORLD_EVENTS.filter(event => {
    const c = event.conditions;
    if (c.seasons && !c.seasons.includes(conditions.season)) return false;
    if (c.weathers && !c.weathers.includes(conditions.weather)) return false;
    if (c.timeOfDay && !c.timeOfDay.includes(conditions.timeOfDay)) return false;
    return true;
  });

  return (
    <div className="bg-blue-950/60 border-2 border-blue-700 rounded p-3 space-y-3">
      <h2 className="text-blue-300 text-xs font-pixel border-b border-blue-700 pb-2">
        🌍 World Conditions
      </h2>

      <div className="grid grid-cols-2 gap-2 text-xs font-pixel">
        <div className="bg-blue-900/40 rounded p-2">
          <div className="text-blue-400 mb-1">Season</div>
          <div className="text-white capitalize">{conditions.season}</div>
        </div>
        <div className="bg-blue-900/40 rounded p-2">
          <div className="text-blue-400 mb-1">Weather</div>
          <div className="text-white">
            {WEATHER_EMOJI[conditions.weather]} {conditions.weather}
          </div>
        </div>
        <div className="bg-blue-900/40 rounded p-2">
          <div className="text-blue-400 mb-1">Time</div>
          <div className="text-white capitalize">{conditions.timeOfDay}</div>
        </div>
        <div className="bg-blue-900/40 rounded p-2">
          <div className="text-blue-400 mb-1">Spawnable</div>
          <div className="text-green-300">{spawnCount} items</div>
        </div>
      </div>

      <div className="text-xs font-pixel text-gray-400 italic">
        {SEASON_DESCRIPTIONS[conditions.season]}
      </div>
      <div className="text-xs font-pixel text-gray-400 italic">
        {WEATHER_DESCRIPTIONS[conditions.weather]}
      </div>

      {activeEvents.length > 0 && (
        <div className="space-y-2">
          <div className="text-yellow-400 text-xs font-pixel">✨ Active Events</div>
          {activeEvents.map(event => (
            <div key={event.id} className="bg-yellow-900/30 border border-yellow-700/50 rounded p-2">
              <div className="text-yellow-300 text-xs font-pixel">{event.name}</div>
              <div className="text-yellow-100/70 text-xs mt-1">{event.effect}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
