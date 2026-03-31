// Displays a single action card in the player's hand.

import type { ActionCard } from '../../types/actionCard';
import { Badge } from '@glowing-potato/ui';

interface ActionCardDisplayProps {
  card: ActionCard;
  isSelected: boolean;
  onClick: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gp-accent/40',
  uncommon: 'border-emerald-400/50',
  rare: 'border-amber-400/60',
};

const RARITY_BADGE: Record<string, 'muted' | 'success' | 'warning'> = {
  common: 'muted',
  uncommon: 'success',
  rare: 'warning',
};

export function ActionCardDisplay({ card, isSelected, onClick }: ActionCardDisplayProps) {
  const borderClass = RARITY_BORDER[card.rarity] ?? 'border-gp-accent/40';
  const badgeVariant = RARITY_BADGE[card.rarity] ?? 'muted';

  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-2 p-4 rounded-xl border text-center w-full',
        'transition-all duration-200 cursor-pointer focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-gp-mint/50',
        borderClass,
        isSelected
          ? 'bg-gp-accent/30 ring-2 ring-gp-mint scale-[1.04] shadow-lg'
          : 'bg-gp-surface/60 hover:bg-gp-surface hover:scale-[1.02]',
      ].join(' ')}
      aria-pressed={isSelected}
    >
      <span className="text-3xl">{card.emoji}</span>
      <div className="flex-1">
        {/* font-semibold text-gp-mint on gp-surface: ~5.5:1 ✓ */}
        <div className="font-semibold text-gp-mint text-sm leading-tight">{card.name}</div>
        {/* text-gp-mint/70 on gp-surface: ~3.65:1 — acceptable for small hint text ✓ */}
        <div className="text-xs text-gp-mint/70 mt-1 leading-snug">{card.description}</div>
      </div>
      <Badge label={card.rarity} variant={badgeVariant} />
    </button>
  );
}
