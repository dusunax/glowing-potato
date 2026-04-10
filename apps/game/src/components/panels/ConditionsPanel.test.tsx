import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import type { WorldConditions } from '../../types/conditions';
import { ConditionsPanel } from './ConditionsPanel';
import type { GameEvent } from '../../types/events';

describe('ConditionsPanel', () => {
  const baseConditions: WorldConditions = {
    season: 'Spring',
    weather: 'Sunny',
    timePeriod: 'Morning',
    day: 3,
  };

  it('calls action callbacks without asserting UI text', () => {
    const onAdvanceTime = vi.fn();
    const onCollect = vi.fn();
    const events: GameEvent[] = [
      {
        id: 'ev-1',
        message: 'Event payload',
        type: 'info',
        timestamp: 100,
        turn: 1,
      },
    ];

    render(
      <ConditionsPanel
        conditions={baseConditions}
        onAdvanceTime={onAdvanceTime}
        onCollect={onCollect}
        events={events}
      />,
    );

    fireEvent.click(screen.getByTestId('conditions-collect-btn'));
    fireEvent.click(screen.getByTestId('conditions-end-turn-btn'));
    expect(onCollect).toHaveBeenCalledTimes(1);
    expect(onAdvanceTime).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('conditions-event-ev-1')).toBeDefined();
  });

  it('renders at most three event lines even when more events exist', () => {
    const onAdvanceTime = vi.fn();
    const onCollect = vi.fn();
    const events: GameEvent[] = [
      { id: 'e1', message: 'A', type: 'info', timestamp: 1 },
      { id: 'e2', message: 'B', type: 'info', timestamp: 2 },
      { id: 'e3', message: 'C', type: 'success', timestamp: 3 },
      { id: 'e4', message: 'D', type: 'warning', timestamp: 4 },
    ];

    render(
      <ConditionsPanel
        conditions={baseConditions}
        onAdvanceTime={onAdvanceTime}
        onCollect={onCollect}
        events={events}
      />,
    );

    const renderedEvents = screen.getAllByTestId(/^conditions-event-/);
    expect(renderedEvents).toHaveLength(3);
    expect(screen.queryByTestId('conditions-event-e4')).toBeNull();
  });

  it('does not render event section without game events', () => {
    const onAdvanceTime = vi.fn();
    const onCollect = vi.fn();

    render(
      <ConditionsPanel
        conditions={baseConditions}
        onAdvanceTime={onAdvanceTime}
        onCollect={onCollect}
        events={[]}
      />,
    );

    expect(screen.queryByTestId(/^conditions-event-/)).toBeNull();
  });
});
