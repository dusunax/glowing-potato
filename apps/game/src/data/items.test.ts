import { describe, expect, it } from 'vitest';
import { getItemById, ITEMS } from './items';

describe('items data', () => {
  it('gets item by valid id', () => {
    const item = getItemById('branch');

    expect(item).not.toBeUndefined();
    expect(item?.name).toBe('Branch');
    expect(item?.rarity).toBe(1);
  });

  it('returns undefined for unknown ids', () => {
    expect(getItemById('does_not_exist')).toBeUndefined();
  });

  it('contains expected special spawnable item ids', () => {
    const ids = new Set(ITEMS.map((item) => item.id));
    expect(ids.has('grilled_meat')).toBe(true);
    expect(ids.has('bone_spear')).toBe(true);
    expect(ids.has('apple_herb_salad')).toBe(true);
  });

  it('assigns sequential itemNo values for all items', () => {
    expect(ITEMS[0]?.itemNo).toBe(1);
    expect(ITEMS[ITEMS.length - 1]?.itemNo).toBe(ITEMS.length);
    expect(new Set(ITEMS.map((item) => item.itemNo)).size).toBe(ITEMS.length);
  });
});
