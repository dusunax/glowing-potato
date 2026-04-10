// Displays current world conditions (season, weather, time, day) and the End Turn button.

import type { WorldConditions } from '../../types/conditions';
import { TIME_PERIOD_EMOJIS } from '../../constants/timePeriods';
import { getSeasonColor } from '../../utils/time';
import type { GameEvent } from '../../types/events';
import { Button } from '@glowing-potato/ui';

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
    <div
      className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4"
      data-testid="conditions-panel"
    >
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tpEmoji}</span>
          <div>
            {/* Label: text-gp-mint/60 on gp-surface ~3.3:1 — readable for uppercase tracking ✓ */}
            <div className="text-xs text-gp-mint/60 uppercase tracking-wide">Time</div>
            <div className="font-semibold text-gp-mint">{conditions.timePeriod}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{WEATHER_EMOJIS[conditions.weather]}</span>
          <div>
            <div className="text-xs text-gp-mint/60 uppercase tracking-wide">Weather</div>
            <div className="font-semibold text-gp-mint">{conditions.weather}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍃</span>
          <div>
            <div className="text-xs text-gp-mint/60 uppercase tracking-wide">Season</div>
            <div className={`font-semibold ${seasonColor}`}>{conditions.season}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <div>
            <div className="text-xs text-gp-mint/60 uppercase tracking-wide">Day</div>
            <div className="font-semibold text-gp-mint">{conditions.day}</div>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={onCollect}
            data-testid="conditions-collect-btn"
          >
            🌿 Collect
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onAdvanceTime}
            data-testid="conditions-end-turn-btn"
          >
            ⏭ End Turn
          </Button>
        </div>
      </div>
      {events.length > 0 && (
        <div className="space-y-1">
          {events.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              data-testid={`conditions-event-${ev.id}`}
              className={`text-sm px-3 py-1 rounded-md ${
                ev.type === 'success' ? 'bg-gp-accent/20 text-gp-mint' :
                ev.type === 'warning' ? 'bg-amber-900/40 text-amber-200' :
                /* info: text-gp-mint on semi-transparent surface — clearly readable ✓ */
                'bg-gp-surface/60 text-gp-mint'
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
