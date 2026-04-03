// Displays a single action card in the player's hand.
import { Badge } from '@glowing-potato/ui';
// Movement cards: explore/sprint — blue
// Forage cards: forage/lucky_forage/windfall — green
// Skill cards: rest/scout/weather_shift — purple
const TYPE_THEME = {
    explore: { base: 'bg-[#295d9e]', selected: 'bg-blue-900 ring-blue-400', border: 'border-[#295d9e]/40' },
    sprint: { base: 'bg-[#295d9e]', selected: 'bg-blue-900 ring-blue-400', border: 'border-[#295d9e]/40' },
    forage: { base: 'bg-[#684213]', selected: 'bg-orange-900 ring-orange-400', border: 'border-[#684213]/40' },
    lucky_forage: { base: 'bg-[#684213]', selected: 'bg-orange-900 ring-orange-400', border: 'border-[#684213]/40' },
    windfall: { base: 'bg-[#684213]', selected: 'bg-orange-900 ring-orange-400', border: 'border-[#684213]/40' },
    rest: { base: 'bg-[#443352]', selected: 'bg-violet-900 ring-violet-400', border: 'border-[#443352]/40' },
    scout: { base: 'bg-[#443352]', selected: 'bg-violet-900 ring-violet-400', border: 'border-[#443352]/40' },
    weather_shift: { base: 'bg-[#443352]', selected: 'bg-violet-900 ring-violet-400', border: 'border-[#443352]/40' },
};
const RARITY_BADGE = {
    common: 'muted',
    uncommon: 'success',
    rare: 'warning',
};
export function ActionCardDisplay({ card, isSelected, isHighlighted = false, onClick, className = '', style, }) {
    const theme = TYPE_THEME[card.type];
    const badgeVariant = RARITY_BADGE[card.rarity] ?? 'muted';
    return (<div className='h-full'>
      <div className='absolute inset-0 rounded-xl ring-1 ring-gp-mint -top-1.5 bg-black pointer-events-none'/>
      <div className='absolute inset-0 rounded-xl ring-1 ring-gp-mint -top-1 bg-black pointer-events-none'/>
      <div className='absolute inset-0 rounded-xl ring-1 ring-gp-mint -top-0.5 bg-black pointer-events-none'/>
      <button onClick={onClick} style={style} className={[
            'flex flex-col h-full gap-1 p-4 rounded-xl border w-full relative z-1 ',
            'transition-all duration-200 cursor-pointer focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-gp-mint',
            theme.border,
            isSelected
                ? `${theme.selected} ring-2 scale-[1.04] shadow-lg ${isHighlighted ? 'animate-pulse ring-offset-2 ring-offset-gp-surface/30' : ''}`
                : `${theme.base} hover:-top-0.5`,
            className,
        ].join(' ')} aria-pressed={isSelected}>
        <span className="text-3xl text-left">{card.emoji}</span>
        <div className="flex-1">
          {/* font-semibold text-gp-mint on gp-surface: ~5.5:1 ✓ */}
          <div className="font-semibold text-gp-mint text-sm leading-tight text-left">{card.name}</div>
          {/* text-gp-mint/70 on gp-surface: ~3.65:1 — acceptable for small hint text ✓ */}
          <div className="text-xs text-gp-mint/70 mt-1 text-left">{card.description}</div>
        </div>
        <Badge label={card.rarity} variant={badgeVariant} className='justify-center'/>
      </button>
    </div>);
}
