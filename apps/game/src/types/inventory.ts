// Inventory types for tracking collected items.

import type { ItemId } from './items';

export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
}

export type Inventory = InventorySlot[];
