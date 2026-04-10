import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import type { Inventory } from '../../types/inventory';
import { InventoryPanel } from './InventoryPanel';

describe('InventoryPanel', () => {
  const beltSlots: Array<string | null> = ['branch', null, 'apple', null, null, null, null, null];

  it('emits belt slot selection by index', () => {
    const inventory: Inventory = [];
    const onSelectBeltSlot = vi.fn();

    render(
      <InventoryPanel
        inventory={inventory}
        beltSlots={Array.from({ length: 8 }).map(() => null)}
        selectedBeltSlot={0}
        onSelectBeltSlot={onSelectBeltSlot}
        onAssignToBelt={() => {}}
        onClearBeltSlot={() => {}}
        canUseInBelt={() => true}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-belt-slot-3'));
    expect(onSelectBeltSlot).toHaveBeenCalledWith(3);
  });

  it('shows hidden slot placeholder when belt slot is empty', () => {
    const inventory: Inventory = [];
    render(
      <InventoryPanel
        inventory={inventory}
        beltSlots={beltSlots}
        selectedBeltSlot={1}
        onSelectBeltSlot={() => {}}
        onAssignToBelt={() => {}}
        onClearBeltSlot={() => {}}
        canUseInBelt={() => true}
      />,
    );

    expect(screen.getByTestId('inventory-empty-slot-1')).toBeDefined();
  });

  it('assigns inventory item to selected belt slot only when usable', () => {
    const inventory: Inventory = [
      { itemId: 'branch', quantity: 1 },
      { itemId: 'sunberry', quantity: 1 },
    ];
    const onAssignToBelt = vi.fn();
    const onClearBeltSlot = vi.fn();

    const canUseInBelt = (itemId: string) => itemId === 'branch';

    render(
      <InventoryPanel
        inventory={inventory}
        beltSlots={beltSlots}
        selectedBeltSlot={1}
        onSelectBeltSlot={() => {}}
        onAssignToBelt={onAssignToBelt}
        onClearBeltSlot={onClearBeltSlot}
        canUseInBelt={canUseInBelt}
      />,
    );

    const assignBranch = screen.getByTestId('inventory-assign-0-branch');
    const hiddenSlotForSunberry = screen.queryByTestId('inventory-assign-1-sunberry');

    fireEvent.click(assignBranch);
    expect(onAssignToBelt).toHaveBeenCalledWith(1, 'branch');
    expect(hiddenSlotForSunberry).toBeNull();
    expect(onClearBeltSlot).not.toHaveBeenCalled();
  });

  it('cannot show assign action for an unusable inventory item', () => {
    const inventory: Inventory = [
      { itemId: 'branch', quantity: 1 },
      { itemId: 'sunberry', quantity: 1 },
    ];

    render(
      <InventoryPanel
        inventory={inventory}
        beltSlots={beltSlots}
        selectedBeltSlot={1}
        onSelectBeltSlot={() => {}}
        onAssignToBelt={() => {}}
        onClearBeltSlot={() => {}}
        canUseInBelt={(itemId) => itemId === 'branch'}
      />,
    );

    expect(screen.queryByTestId('inventory-assign-1-sunberry')).toBeNull();
    expect(screen.getByTestId('inventory-assign-0-branch')).toBeDefined();
  });

  it('clears currently equipped item from selected slot', () => {
    const inventory: Inventory = [{ itemId: 'branch', quantity: 1 }];
    const onClearBeltSlot = vi.fn();

    render(
      <InventoryPanel
        inventory={inventory}
        beltSlots={['branch', null, null, null, null, null, null, null]}
        selectedBeltSlot={0}
        onSelectBeltSlot={() => {}}
        onAssignToBelt={() => {}}
        onClearBeltSlot={onClearBeltSlot}
        canUseInBelt={() => true}
      />,
    );

    fireEvent.click(screen.getByTestId('inventory-clear-0-branch'));
    expect(onClearBeltSlot).toHaveBeenCalledWith(0);
  });

  it('keeps clear button tied to selected slot', () => {
    const inventory: Inventory = [{ itemId: 'branch', quantity: 1 }];
    const onClearBeltSlot = vi.fn();

    render(
      <InventoryPanel
        inventory={inventory}
        beltSlots={['branch', null, null, null, null, null, null, null]}
        selectedBeltSlot={2}
        onSelectBeltSlot={() => {}}
        onAssignToBelt={() => {}}
        onClearBeltSlot={onClearBeltSlot}
        canUseInBelt={() => true}
      />,
    );

    expect(screen.queryByTestId('inventory-clear-0-branch')).toBeNull();
  });
});
