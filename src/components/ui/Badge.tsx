// Generic badge/pill component for displaying rarity, tags, etc.

import type { ItemRarity } from '../../types/items';

interface BadgeProps {
  label: string;
  rarity?: ItemRarity;
  className?: string;
}

const RARITY_CLASSES: Record<ItemRarity, string> = {
  common: 'bg-slate-600 text-slate-200',
  uncommon: 'bg-emerald-700 text-emerald-100',
  rare: 'bg-violet-700 text-violet-100',
  legendary: 'bg-amber-600 text-amber-100',
};

export function Badge({ label, rarity, className = '' }: BadgeProps) {
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-semibold';
  const color = rarity ? RARITY_CLASSES[rarity] : 'bg-slate-500 text-white';
  return <span className={`${base} ${color} ${className}`}>{label}</span>;
}
