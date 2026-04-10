import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiscoveryPanel } from './DiscoveryPanel';
import { ITEMS } from '../../data/items';

describe('DiscoveryPanel', () => {
  it('marks discovered and undiscovered items with state attributes', () => {
    const discovered = new Set(['branch', 'sunberry']);

    render(<DiscoveryPanel discovered={discovered} />);

    expect(screen.getByTestId('discovery-item-branch').getAttribute('data-state')).toBe('found');
    expect(screen.getByTestId('discovery-item-sunberry').getAttribute('data-state')).toBe('found');
    expect(screen.getByTestId('discovery-item-herb').getAttribute('data-state')).toBe('undiscovered');
  });

  it('renders discoverability state for every item definition', () => {
    const discovered = new Set(['sunberry']);
    render(<DiscoveryPanel discovered={discovered} />);

    const renderedItems = screen.getAllByTestId(/^discovery-item-(?!no-)/);
    expect(renderedItems).toHaveLength(ITEMS.length);

    const foundCount = ITEMS.filter((item) => discovered.has(item.id)).length;
    const states = ITEMS.map((item) => screen.getByTestId(`discovery-item-${item.id}`).getAttribute('data-state'));
    const foundStateCount = states.filter((state) => state === 'found').length;

    expect(foundStateCount).toBe(foundCount);

    const itemNoNodes = ITEMS.map((item) => screen.getByTestId(`discovery-item-no-${item.id}`));
    expect(itemNoNodes).toHaveLength(ITEMS.length);
  });
});
