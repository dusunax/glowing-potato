import { useGameClock } from './hooks/useGameClock';
import { useGameState } from './hooks/useGameState';
import { GameHeader } from './components/GameHeader';
import { ConditionsPanel } from './components/ConditionsPanel';
import { SpawnArea } from './components/SpawnArea';
import { InventoryPanel } from './components/InventoryPanel';
import { CraftingPanel } from './components/CraftingPanel';
import { DiscoveryLog } from './components/DiscoveryLog';
import { ITEMS } from './data/items';

function App() {
  const { conditions, paused, setPaused } = useGameClock();
  const { inventory, discoveries, log, tryCollect, canCraft, craft, spawnCount } = useGameState();

  const totalCollectibleItems = ITEMS.filter(i => i.category !== 'crafted').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-teal-950 to-blue-950">
      <GameHeader
        conditions={conditions}
        paused={paused}
        onTogglePause={() => setPaused(p => !p)}
        discoveredCount={discoveries.length}
        totalItems={totalCollectibleItems}
      />

      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <ConditionsPanel
              conditions={conditions}
              spawnCount={spawnCount(conditions)}
            />
            <SpawnArea
              conditions={conditions}
              onCollect={() => tryCollect(conditions)}
            />
          </div>

          {/* Middle Column */}
          <div className="space-y-4">
            <InventoryPanel inventory={inventory} />
            <CraftingPanel
              inventory={inventory}
              canCraft={canCraft}
              onCraft={craft}
            />
          </div>

          {/* Right Column */}
          <div>
            <DiscoveryLog
              discoveries={discoveries}
              log={log}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
