// Main application layout. Wires all panels together using useGameState.
// Does not contain game logic — delegates to hooks.

import { useGameState } from './hooks/useGameState';
import { ConditionsPanel } from './components/panels/ConditionsPanel';
import { InventoryPanel } from './components/panels/InventoryPanel';
import { CraftingPanel } from './components/panels/CraftingPanel';
import { DiscoveryPanel } from './components/panels/DiscoveryPanel';
import { SpawnPanel } from './components/panels/SpawnPanel';

export default function App() {
  const {
    conditions,
    inventory,
    discovered,
    events,
    recipes,
    getQuantity,
    canCraft,
    handleCollect,
    handleAdvanceTime,
    handleCraft,
  } = useGameState();

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#1a1a2e' }}>
      <header className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">🌿 Glowing Potato</h1>
        <p className="text-slate-400 text-sm mt-1">A cozy 2D collection game</p>
      </header>

      <div className="max-w-7xl mx-auto space-y-4">
        <ConditionsPanel
          conditions={conditions}
          onAdvanceTime={handleAdvanceTime}
          onCollect={handleCollect}
          events={events}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ minHeight: '520px' }}>
          <InventoryPanel inventory={inventory} />
          <CraftingPanel
            recipes={recipes}
            canCraft={canCraft}
            onCraft={handleCraft}
            getQuantity={getQuantity}
          />
          <DiscoveryPanel discovered={discovered} />
          <SpawnPanel conditions={conditions} />
        </div>
      </div>
    </div>
  );
}
