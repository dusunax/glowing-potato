// Displays the player's current inventory as a scrollable grid of ItemCards.

import type { Inventory } from '../../types/inventory';
import { ItemCard } from '../ui/ItemCard';
import { CardTitle } from '@glowing-potato/ui';
import { getItemById } from '../../data/items';

interface InventoryPanelProps {
  inventory: Inventory;
  beltSlots: Array<string | null>;
  selectedBeltSlot: number;
  onSelectBeltSlot: (slotIndex: number) => void;
  onAssignToBelt: (slotIndex: number, itemId: string) => void;
  onClearBeltSlot: (slotIndex: number) => void;
  canUseInBelt: (itemId: string) => boolean;
}

export function InventoryPanel({
  inventory,
  beltSlots,
  selectedBeltSlot,
  onSelectBeltSlot,
  onAssignToBelt,
  onClearBeltSlot,
  canUseInBelt,
}: InventoryPanelProps) {
  const EMPTY_SLOT_CLASS =
    'min-h-[74px] border border-dashed border-gp-mint/55 rounded-lg';
  const EMPTY_SLOT_STYLE = {
    background: 'linear-gradient(180deg, rgba(var(--gp-bg), 0.82) 0%, rgba(var(--gp-bg), 0.65) 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(var(--gp-accent), 0.25)',
  };
  const MIN_SLOTS = 8;
  const slots = Math.max(MIN_SLOTS, inventory.length);
  const selectedSlotItem = beltSlots[selectedBeltSlot];
  const selectedSlotLabel = `Slot ${selectedBeltSlot + 1}${selectedSlotItem ? ` (${getItemById(selectedSlotItem)?.name ?? 'Empty'})` : ' (Empty)'}`;

  return (
    <div className="flex flex-col h-full">
      <CardTitle className="mb-3">🎒 Inventory</CardTitle>
      <div className="mb-3 space-y-2">
        <div className="text-sm text-gp-mint/80">Assign Belt Slots</div>
        <div className="grid grid-cols-8 gap-2">
          {beltSlots.map((itemId, index) => {
            const item = itemId ? getItemById(itemId) : null;
            const isSelected = index === selectedBeltSlot;
            if (!item) {
              return (
                <button
                  key={`belt-slot-config-${index}`}
                  type="button"
                  onClick={() => onSelectBeltSlot(index)}
                  className={`relative w-full min-h-12 rounded-lg border transition-all ${isSelected ? 'ring-2 ring-gp-mint/80 border-gp-mint bg-gp-mint/15 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]' : 'border-gp-accent/30 bg-gp-bg/30 hover:border-gp-accent/70'}`}
                >
                  <div className={`h-full ${isSelected ? 'ring-1 ring-inset ring-gp-mint/50 bg-gp-mint/5' : ''}`}>
                    <div className={`${EMPTY_SLOT_CLASS} h-full`} style={EMPTY_SLOT_STYLE} />
                  </div>
                </button>
              );
            }
            return (
              <button
                key={`belt-slot-config-${index}`}
                type="button"
                onClick={() => onSelectBeltSlot(index)}
                className={`relative min-h-12 rounded-lg border transition-colors ${isSelected ? 'border-gp-mint bg-gp-mint/20 ring-2 ring-gp-mint/70' : 'border-gp-accent/30 bg-gp-bg/40 hover:border-gp-accent/70'} ${itemId ? 'text-gp-mint' : 'text-gp-mint/60'}`}
              >
                <div className="text-xs mb-1 text-left px-2 pt-1">#{index + 1}</div>
                <div className="text-[22px] leading-none text-center">{item?.emoji ?? '▢'}</div>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-gp-mint/60">Selected: {selectedSlotLabel}</div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto">
          {Array.from({ length: slots }).map((_, index) => {
            const slot = inventory[index];
            if (!slot) {
              return (
                <div
                  key={`empty-${index}`}
                  className={`${EMPTY_SLOT_CLASS} bg-gp-bg/10 flex items-center justify-center text-[11px] text-gp-mint/70 font-semibold uppercase tracking-wide`}
                  style={EMPTY_SLOT_STYLE}
                >
                  Empty
                </div>
              );
            }

            const isBeltItem = canUseInBelt(slot.itemId);
            return (
              <div key={slot.itemId} className="rounded-lg border border-gp-accent/30 bg-gp-bg/30 p-2 space-y-2">
                <ItemCard slot={slot} />
                <div className="flex items-center gap-2">
                  {isBeltItem && (
                    <button
                      type="button"
                      onClick={() => onAssignToBelt(selectedBeltSlot, slot.itemId)}
                      className="text-xs px-2 py-1 rounded bg-gp-accent/30 text-gp-mint hover:bg-gp-accent/50"
                    >
                      Assign to {selectedSlotLabel}
                    </button>
                  )}
                  {isBeltItem && selectedSlotItem === slot.itemId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearBeltSlot(selectedBeltSlot);
                      }}
                      className="text-xs px-2 py-1 rounded border border-amber-400/50 text-amber-200 hover:bg-amber-900/30"
                    >
                      Clear Selected
                    </button>
                    )}
                  {!isBeltItem && <span className="text-xs text-gp-mint/50">Not usable on belt</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
