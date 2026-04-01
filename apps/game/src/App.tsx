// Main application. Shows the GameLobby by default; navigates into a specific
// mini-game when the player selects one.
// Does not contain game logic — delegates to hooks and child components.

import { useState, useMemo } from 'react';
import { GameLobby } from './components/GameLobby';
import { useGameState } from './hooks/useGameState';
import { useAuth } from './hooks/useAuth';
import { InventoryPanel } from './components/panels/InventoryPanel';
import { CraftingPanel } from './components/panels/CraftingPanel';
import { DiscoveryPanel } from './components/panels/DiscoveryPanel';
import { SpawnPanel } from './components/panels/SpawnPanel';
import { DontSayIt } from './features/dont-say-it';
import { MapPanel } from './components/panels/MapPanel';
import { ActionCardDisplay } from './components/ui/ActionCardDisplay';
import { Button } from '@glowing-potato/ui';
import { TIME_PERIOD_EMOJIS } from './constants/timePeriods';
import { WEATHER_EMOJIS } from './constants/weather';
import { getSeasonColor } from './utils/time';
import { tileKey } from './hooks/useMap';
import type { ActionCard } from './types/actionCard';

// ── Small inline condition badge ─────────────────────────────────────────────

function CondPill({ emoji, label, labelClass = '' }: { emoji: string; label: string; labelClass?: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gp-bg/40 border border-gp-accent/20">
      <span>{emoji}</span>
      <span className={`text-xs font-semibold ${labelClass || 'text-gp-mint'}`}>{label}</span>
    </div>
  );
}

// ── Collection game screen ────────────────────────────────────────────────────

type Tab = 'inventory' | 'crafting' | 'discovery' | 'spawnable';

const TABS: { id: Tab; label: string }[] = [
  { id: 'inventory',  label: '🎒 Inventory' },
  { id: 'crafting',   label: '⚗️ Crafting' },
  { id: 'discovery',  label: '📖 Discovery' },
  { id: 'spawnable',  label: '🌍 Spawnable' },
];

function CollectionGame({ onBack }: { onBack: () => void }) {
  const {
    conditions,
    playerHp,
    maxPlayerHp,
    inventory,
    discovered,
    events,
    recipes,
    getQuantity,
    canCraft,
    handleCraft,
    position,
    currentBiomeInfo,
    visitedTiles,
    knownTiles,
    canMoveTo,
    getTileResources,
    getReachableTiles,
    getAnimalsAt,
    getAdjacentAnimals,
    hand,
    selectedCard,
    selectCard,
    handlePlayCard,
    deckSize,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<Tab>('inventory');

  const seasonColorClass = getSeasonColor(conditions.season);

  // Compute adjacent animals for attack targeting
  const adjacentAnimals = useMemo(() => getAdjacentAnimals(position), [getAdjacentAnimals, position]);

  // Build the set of attack-target tiles (adjacent tiles that have an alive animal)
  const attackTargetTiles = useMemo(() => {
    if (selectedCard?.type !== 'attack') return new Set<string>();
    const tiles = new Set<string>();
    for (const a of adjacentAnimals) {
      tiles.add(tileKey(a.position.x, a.position.y));
    }
    return tiles;
  }, [selectedCard, adjacentAnimals]);

  function onCardClick(card: ActionCard) {
    if (card.type === 'explore' || card.type === 'sprint' || card.type === 'attack') {
      // Toggle selection — requires a map tile target
      selectCard(card);
    } else {
      // Execute immediately
      handlePlayCard(card);
    }
  }

  function onTileClick(x: number, y: number) {
    if (!selectedCard) return;
    if (selectedCard.type === 'explore' || selectedCard.type === 'sprint') {
      handlePlayCard(selectedCard, { x, y });
    } else if (selectedCard.type === 'attack') {
      // Find animal on that tile
      const target = adjacentAnimals.find((a) => a.position.x === x && a.position.y === y);
      if (target) handlePlayCard(selectedCard, undefined, target.id);
    }
  }

  const isTargetingCard = selectedCard && (
    selectedCard.type === 'explore' || selectedCard.type === 'sprint' || selectedCard.type === 'attack'
  );

  // HP bar colour
  const hpRatio = playerHp / maxPlayerHp;
  const hpColor = hpRatio > 0.6 ? 'bg-emerald-400' : hpRatio > 0.3 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gp-bg flex flex-col">
      {/* ── Compact header with conditions ─────────────────────────────────── */}
      <header className="bg-gp-surface border-b border-gp-accent/30 px-4 py-2.5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Lobby
          </Button>
          <h1 className="text-base font-bold text-gp-mint">🌿 Glowing Potato</h1>

          {/* Conditions row */}
          <div className="flex items-center gap-2 ml-2 flex-wrap flex-1">
            <CondPill emoji={TIME_PERIOD_EMOJIS[conditions.timePeriod]} label={conditions.timePeriod} />
            <CondPill emoji={WEATHER_EMOJIS[conditions.weather] ?? '🌤️'} label={conditions.weather} />
            <CondPill emoji="🍃" label={conditions.season} labelClass={seasonColorClass} />

            {/* Player HP */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gp-bg/40 border border-gp-accent/20">
              <span>❤️</span>
              <div className="flex items-center gap-1">
                <div className="w-14 h-2 bg-gp-bg/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${hpColor}`}
                    style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gp-mint">{playerHp}/{maxPlayerHp}</span>
              </div>
            </div>
          </div>

          {/* Date — right side */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gp-accent/20 border border-gp-mint/20 ml-auto">
            <span>📅</span>
            <span className="text-sm font-bold text-gp-mint">Day {conditions.day}</span>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 space-y-4">

        {/* Top row: Map + Cards/Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* World map */}
          <MapPanel
            position={position}
            selectedCard={selectedCard}
            onTileClick={onTileClick}
            currentBiomeInfo={currentBiomeInfo}
            canMoveTo={canMoveTo}
            visitedTiles={visitedTiles}
            knownTiles={knownTiles}
            getTileResources={getTileResources}
            getAnimalsAt={getAnimalsAt}
            getReachableTiles={getReachableTiles}
            attackTargetTiles={attackTargetTiles}
          />

          {/* Right column: action cards + event log */}
          <div className="flex flex-col gap-4">

            {/* ── Action card hand ─────────────────────────────────────────── */}
            <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gp-mint text-lg">🃏 Action Cards</h2>
                <span className="text-xs text-gp-mint/60">{deckSize} left in deck</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {hand.map((card) => (
                  <ActionCardDisplay
                    key={card.id}
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => onCardClick(card)}
                  />
                ))}
              </div>
              {isTargetingCard && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <p className="text-xs text-gp-mint/70">
                    {selectedCard.type === 'attack'
                      ? 'Click an adjacent animal tile to attack'
                      : 'Click a highlighted tile on the map to move there'}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => selectCard(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* ── Nearby animals ───────────────────────────────────────────── */}
            {adjacentAnimals.length > 0 && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-red-300 mb-2">⚠️ Nearby Animals</h3>
                <div className="flex flex-wrap gap-2">
                  {adjacentAnimals.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gp-bg/40 border border-red-500/20">
                      <span>{a.emoji}</span>
                      <span className="text-xs text-gp-mint/85">{a.name}</span>
                      <span className={`text-xs font-bold ${a.behavior === 'hostile' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {a.behavior === 'hostile' ? '⚔️' : '🕊️'}
                      </span>
                      <span className="text-xs text-gp-mint/60">{a.hp}/{a.maxHp}HP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Event log ────────────────────────────────────────────────── */}
            <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4 flex-1">
              <h2 className="font-semibold text-gp-mint text-lg mb-3">📋 Event Log</h2>
              {events.length === 0 ? (
                <p className="text-gp-mint/85 text-sm">
                  No events yet. Play a card to start!
                </p>
              ) : (
                <div className="space-y-1.5 overflow-y-auto max-h-44">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-sm px-3 py-1.5 rounded-lg ${
                        ev.type === 'success'
                          ? 'bg-gp-accent/20 text-gp-mint'
                          : ev.type === 'warning'
                          ? 'bg-amber-900/40 text-amber-200'
                          : 'bg-gp-bg/40 text-gp-mint'
                      }`}
                    >
                      {ev.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabbed bottom panels ──────────────────────────────────────────── */}
        <div className="bg-gp-surface border border-gp-accent/30 rounded-xl overflow-hidden">
          <div className="flex border-b border-gp-accent/30 overflow-x-auto">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={[
                  'px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors flex-1 min-w-0',
                  activeTab === id
                    ? 'text-gp-mint bg-gp-accent/20 border-b-2 border-gp-mint'
                    : 'text-gp-mint/60 hover:text-gp-mint hover:bg-gp-accent/10',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-4 min-h-40">
            {activeTab === 'inventory' && <InventoryPanel inventory={inventory} />}
            {activeTab === 'crafting' && (
              <CraftingPanel recipes={recipes} canCraft={canCraft} onCraft={handleCraft} getQuantity={getQuantity} />
            )}
            {activeTab === 'discovery' && <DiscoveryPanel discovered={discovered} />}
            {activeTab === 'spawnable' && <SpawnPanel conditions={conditions} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const { user, nickname, loading, signInWithGoogle, signOut, updateNickname } = useAuth();

  async function handleSignIn() {
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('popup-closed')) return;
      setSignInError('로그인에 실패했어요. 다시 시도해주세요.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gp-bg">
        <span className="text-gp-mint/50 text-sm">Loading…</span>
      </div>
    );
  }

  if (activeGame === 'collection') {
    return <CollectionGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'dont-say-it') {
    return <DontSayIt onBack={() => setActiveGame(null)} nickname={nickname} isLoggedIn={!!user} onSignIn={handleSignIn} onSignOut={signOut} onUpdateNickname={updateNickname} />;
  }

  return (
    <>
      {signInError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          {signInError}
        </div>
      )}
      <GameLobby
        onSelectGame={setActiveGame}
        user={user}
        nickname={nickname}
        onSignIn={handleSignIn}
        onSignOut={signOut}
        onUpdateNickname={updateNickname}
      />
    </>
  );
}
