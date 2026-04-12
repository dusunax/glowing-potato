import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import PlayerMarker from './PlayerMarker';

describe('PlayerMarker', () => {
  it('shows attack mode state label when player attacks', () => {
    const { getByTestId } = render(
      <PlayerMarker mode="attack" equippedWeaponEmoji="🗡️" equippedWeaponName="Iron Knife" />,
    );

    expect(getByTestId('player-marker-badge')).toHaveTextContent('ATTACK');
    expect(getByTestId('player-marker-weapon')).toBeInTheDocument();
    expect(getByTestId('player-marker-weapon').getAttribute('title')).toBe('Iron Knife');
    expect(getByTestId('player-marker-body').getAttribute('data-state')).toBe('attack');
  });

  it('uses skill state metadata', () => {
    const { getByTestId } = render(<PlayerMarker mode="skill" />);
    const marker = getByTestId('player-marker-body');

    expect(marker).toBeInTheDocument();
    expect(marker.getAttribute('data-state')).toBe('skill');
  });

  it('shows move state with move badge', () => {
    const { getByTestId } = render(<PlayerMarker mode="move" />);
    const badge = getByTestId('player-marker-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('MOVE');
  });

  it('shows discover state with discover badge', () => {
    const { getByTestId } = render(<PlayerMarker mode="discover" />);
    const badge = getByTestId('player-marker-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('DISCOVER');
  });

  it('does not show state badge for idle mode', () => {
    const { getByTestId } = render(<PlayerMarker mode="idle" />);
    const badge = getByTestId('player-marker-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('opacity-0');
  });
});
