// Main application. Shows the GameLobby by default; navigates into a specific
// mini-game when the player selects one.
// Does not contain game logic — delegates to hooks and child components.

import { useState } from 'react';
import { GameLobby } from './components/GameLobby';
import { useGameState } from './hooks/useGameState';
import { ConditionsPanel } from './components/panels/ConditionsPanel';
import { InventoryPanel } from './components/panels/InventoryPanel';
import { CraftingPanel } from './components/panels/CraftingPanel';
import { DiscoveryPanel } from './components/panels/DiscoveryPanel';
import { SpawnPanel } from './components/panels/SpawnPanel';
import { DontSayIt } from './components/dont-say-it/DontSayIt';
import { Button } from '@glowing-potato/ui';

// --- Collection game screen ---

function CollectionGame({ onBack }: { onBack: () => void }) {
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
    <div className="min-h-screen p-4 md:p-6 bg-gp-bg">
      <header className="mb-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Lobby
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold text-gp-mint tracking-tight">🌿 Glowing Potato</h1>
          {/* text-gp-mint/70 on gp-bg: ~9.8:1 contrast ✓ */}
          <p className="text-gp-mint/70 text-sm mt-0.5">A cozy 2D collection game</p>
        </div>
        {/* spacer so title stays centred */}
        <div className="w-20" />
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

// --- Root ---

export default function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'collection') {
    return <CollectionGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'dont-say-it') {
    return <DontSayIt onBack={() => setActiveGame(null)} />;
  }

  return <GameLobby onSelectGame={setActiveGame} />;
}
