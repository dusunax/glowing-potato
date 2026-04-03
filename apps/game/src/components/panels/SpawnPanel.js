// Shows which items can currently spawn given world conditions.
import { ITEMS } from '../../data/items';
import { getSpawnableItems } from '../../utils/spawning';
import { Badge, CardTitle } from '@glowing-potato/ui';
const RARITY_BADGE_MAP = {
    common: 'muted',
    uncommon: 'success',
    rare: 'default',
    legendary: 'warning',
};
export function SpawnPanel({ conditions }) {
    const spawnable = getSpawnableItems(ITEMS, conditions);
    const EMPTY_SLOT_CLASS = 'min-h-[62px] border border-dashed border-gp-mint/55 rounded-lg';
    const EMPTY_SLOT_STYLE = {
        background: 'linear-gradient(180deg, rgba(var(--gp-bg), 0.82) 0%, rgba(var(--gp-bg), 0.65) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(var(--gp-accent), 0.25)',
    };
    return (<div className="flex flex-col">
      <CardTitle className="mb-0.5">🌍 Spawnable Now</CardTitle>
      {/* text-gp-mint/70 on gp-surface: ~3.65:1 — acceptable for small hint text ✓ */}
      <p className="text-xs text-gp-mint/70 mb-3">{spawnable.length} item(s) available</p>
      {spawnable.length === 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto">
          {Array.from({ length: 4 }).map((_, index) => (<div key={`empty-spawn-${index}`} className={EMPTY_SLOT_CLASS} style={EMPTY_SLOT_STYLE}/>))}
        </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto">
          {spawnable.map((item) => (<div key={item.id} className="flex items-center gap-2 bg-gp-bg/30 rounded-lg p-2 border border-gp-accent/20">
              <span className="text-xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gp-mint truncate">{item.name}</div>
              </div>
              <Badge label={item.rarity} variant={RARITY_BADGE_MAP[item.rarity] ?? 'muted'}/>
            </div>))}
        </div>)}
    </div>);
}
