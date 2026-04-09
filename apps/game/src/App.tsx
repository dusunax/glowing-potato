// Main application. Shows the GameLobby by default; navigates into a specific
// mini-game when the player selects one.
// Does not contain game logic — delegates to hooks and child components.

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GameLobby } from './components/GameLobby';
import { useGameState } from './hooks/useGameState';
import { useAuth } from './hooks/useAuth';
import { useScoreRecord } from './hooks/useScoreRecord';
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
import { getItemById } from './data/items';
import { TREASURE_TILE } from './data/map';
import { calculateScore } from './utils/score';
import { tileKey } from './hooks/useMap';
import { useLeaderboard } from './hooks/useLeaderboard';
import { LeaderboardPopup } from './features/leaderboard/LeaderboardPopup';
import type { ActionCard } from './types/actionCard';
import type { User } from 'firebase/auth';
import type { MapBiomePreset } from './types/map';

// ── Small inline condition badge ─────────────────────────────────────────────

function CondPill({ emoji, label, labelClass = '' }: { emoji: string; label: string; labelClass?: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gp-bg/40 border border-gp-accent/20">
      <span>{emoji}</span>
      <span className={`text-xs font-semibold ${labelClass || 'text-gp-mint'}`}>{label}</span>
    </div>
  );
}

function getCardStackTheme(type: ActionCard['type']) {
  switch (type) {
    case 'explore':
    case 'sprint':
      return {
        layer1: 'bg-blue-900',
        layer2: 'bg-blue-800',
        layer3: 'bg-blue-700',
        border: 'border-blue-600',
      };
    case 'forage':
    case 'lucky_forage':
    case 'windfall':
      return {
        layer1: 'bg-orange-900',
        layer2: 'bg-orange-800',
        layer3: 'bg-orange-700',
        border: 'border-orange-600',
      };
    case 'rest':
    case 'scout':
    case 'weather_shift':
    default:
      return {
        layer1: 'bg-violet-900',
        layer2: 'bg-violet-800',
        layer3: 'bg-violet-700',
        border: 'border-violet-600',
      };
  }
}

// ── Collection game screen ────────────────────────────────────────────────────

type Tab = 'game' | 'inventory' | 'crafting' | 'discovery' | 'spawnable';

const TABS: { id: Tab; label: string }[] = [
  { id: 'game',       label: '🧭 Game' },
  { id: 'inventory',  label: '🎒 Inventory' },
  { id: 'crafting',   label: '⚗️ Crafting' },
  { id: 'discovery',  label: '📖 Discovery' },
  { id: 'spawnable',  label: '🌍 Spawnable' },
];

const BIOME_PRESET_OPTIONS: Array<{ value: MapBiomePreset; label: string }> = [
  { value: 'meadow', label: 'Meadow' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'beach', label: 'Sea' },
  { value: 'desert', label: 'Desert' },
  { value: 'rock', label: 'Rock' },
];
const BIOME_DIFFICULTY_LABEL: Record<MapBiomePreset, string> = {
  meadow: 'Easy',
  mountain: 'Normal',
  beach: 'Hard',
  desert: 'Extreme',
  rock: 'Extreme',
};
const BIOME_PRESET_LABEL: Record<MapBiomePreset, string> = BIOME_PRESET_OPTIONS.reduce(
  (acc, option) => ({
    ...acc,
    [option.value]: option.label,
  }),
  {} as Record<MapBiomePreset, string>,
);
function CollectionGame({
  onBack,
  onRestart,
  mapBiome,
  user,
}: {
  onBack: () => void;
  onRestart: () => void;
  mapBiome: MapBiomePreset;
  user?: User | null;
}) {
  const guestScoreUserId = useMemo(() => {
    if (typeof window === 'undefined') return `guest-${Math.floor(Math.random() * 1000000000)}`;
    const storageKey = 'glowing-potato-guest-score-id';
    const cached = window.localStorage.getItem(storageKey);
    if (cached && cached.trim()) return cached.trim();
    const next = `guest-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    window.localStorage.setItem(storageKey, next);
    return next;
  }, []);

  const {
    conditions,
    playerHp,
    maxPlayerHp,
    playerLevel,
    playerXp,
    xpToNextLevel,
    isPlayerDead,
    inventory,
    discovered,
    events,
    recipes,
    getQuantity,
    canCraft,
    handleCraft,
    totalXpGained,
    defeatedAnimals,
    position,
    mapGrid,
    currentBiomeInfo,
    visitedTiles,
    knownTiles,
    canMoveTo,
    getTileResources,
    getReachableTiles,
    getAnimalsAt,
    getAdjacentAnimals,
    animals,
    deathCause,
    scoutRevealLevel,
    scoutPoints,
    spawnLayerUnlockedItemCounts,
    unlockSpawnLayer,
    unlockNextSpawnItemAtLayer,
    selectedSpawnLayer,
    setSelectedSpawnLayer,
    hand,
    selectedCard,
    selectCard,
  handlePlayCard,
  handleStrike,
  handleUseItem,
   grantTreasureReward,
  depleteTileResource,
  pushEvent,
  showDamageFlash,
  deckSize,
  } = useGameState(mapBiome);

  const recipesById = useMemo(() => {
    const lookup = new Map<string, (typeof recipes)[number]>();
    for (const recipe of recipes) {
      lookup.set(recipe.id, recipe);
    }
    return lookup;
  }, [recipes]);

  const { saveRecord } = useScoreRecord();
  const savedRef = useRef(false);
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const [showGameOverLog, setShowGameOverLog] = useState(false);
  const {
    records: leaderboardRecords,
    loading: leaderboardLoading,
    refresh: refreshLeaderboard,
    invalidate: invalidateLeaderboard,
  } = useLeaderboard(10, 'collection');
  const isTreasureTile = position.x === TREASURE_TILE.x && position.y === TREASURE_TILE.y;
  const [pendingTreasureRewardCard, setPendingTreasureRewardCard] = useState<ActionCard | null>(null);
  const [showTreasureRewardModal, setShowTreasureRewardModal] = useState(false);
  const [hasClaimedTreasureReward, setHasClaimedTreasureReward] = useState(false);

  const finalScore = useMemo(() => {
    if (!isPlayerDead) return 0;
      return calculateScore({
        survivalDays: conditions.day,
        level: playerLevel,
        totalXpGained,
        inventorySnapshot: inventory,
        getItemRarity: (id) => getItemById(id)?.rarity ?? 1,
    });
  }, [isPlayerDead, conditions.day, playerLevel, totalXpGained, inventory]);

  const canCollectFromCurrentTile = getTileResources(position.x, position.y) > 0;

  const isForageCard = useCallback((cardType: ActionCard['type']) =>
    cardType === 'forage' || cardType === 'lucky_forage' || cardType === 'windfall',
  []);

  useEffect(() => {
    if (!isPlayerDead || savedRef.current) return;
    savedRef.current = true;
    const recordUserId = user?.uid ?? guestScoreUserId;
    (async () => {
      await saveRecord({
        userId: recordUserId,
        gameId: 'collection',
        score: finalScore,
        survivalDays: conditions.day,
        level: playerLevel,
        totalXpGained,
        defeatedAnimals,
        inventorySnapshot: inventory,
      });
      await invalidateLeaderboard();
    })();
  }, [
    isPlayerDead,
    user,
    guestScoreUserId,
    finalScore,
    conditions.day,
    playerLevel,
    totalXpGained,
    defeatedAnimals,
    inventory,
    saveRecord,
    invalidateLeaderboard,
  ]);

  useEffect(() => {
    if (!showLeaderboardPopup) return;
    refreshLeaderboard();
  }, [showLeaderboardPopup, refreshLeaderboard]);

  const leaderboardRows = useMemo(() => {
    const rows = Array.from({ length: 10 }, (_, index) => {
      const record = leaderboardRecords[index];
      if (record) {
        return { type: 'record' as const, record, index };
      }
      return { type: 'empty' as const, index };
    });
    return rows;
  }, [leaderboardRecords]);

  const playerRankLabel = useMemo(() => {
    if (leaderboardRecords.length === 0) return null;
    const rank = leaderboardRecords.reduce((count, record) => count + (record.score > finalScore ? 1 : 0), 0) + 1;
    if (rank >= 100) return '100+';
    return String(rank);
  }, [leaderboardRecords, finalScore]);

  const BELT_SLOT_COUNT = 8;
  const WEAPON_BELT_SLOT_INDEX = 0;
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [beltSlots, setBeltSlots] = useState<(string | null)[]>(() =>
    Array.from({ length: BELT_SLOT_COUNT }, () => null as string | null)
  );
  const [selectedBeltSlot, setSelectedBeltSlot] = useState(0);
  const [moveCardFlash, setMoveCardFlash] = useState(false);
  const moveCardFlashTimer = useRef<number | null>(null);

  const seasonColorClass = getSeasonColor(conditions.season);
  const activeTabIndex = activeTab ? TABS.findIndex((tab) => tab.id === activeTab) : 0;
  const adjacentAnimals = useMemo(() => getAdjacentAnimals(position), [getAdjacentAnimals, position, animals]);

  const nearbyAnimals = useMemo(() => {
    const tiles = new Set<string>();
    for (const a of adjacentAnimals) {
      tiles.add(tileKey(a.position.x, a.position.y));
    }
    return tiles;
  }, [adjacentAnimals]);

  function onCardClick(card: ActionCard) {
    if (isPlayerDead) return;
    if (isForageCard(card.type)) {
      if (isTreasureTile && !hasClaimedTreasureReward && !showTreasureRewardModal && !pendingTreasureRewardCard) {
        depleteTileResource(position.x, position.y);
        setHasClaimedTreasureReward(true);
        setPendingTreasureRewardCard(card);
        setShowTreasureRewardModal(true);
        return;
      }
      if (!canCollectFromCurrentTile) return;
    }
    if (card.type === 'explore' || card.type === 'sprint') {
      // Toggle selection — requires a map tile target
      selectCard(card);
    } else {
      // Execute immediately
      handlePlayCard(card);
    }
  }

  const handleTreasureRewardChoice = useCallback(
    (rewardType: 'xp' | 'weapon' | 'gold_chunk') => {
      if (!pendingTreasureRewardCard || isPlayerDead) return;
      grantTreasureReward(rewardType);
      setHasClaimedTreasureReward(true);
      setShowTreasureRewardModal(false);
      handlePlayCard(pendingTreasureRewardCard, undefined, { skipTreasureCollect: true });
      setPendingTreasureRewardCard(null);
    },
    [grantTreasureReward, handlePlayCard, isPlayerDead, pendingTreasureRewardCard],
  );

  function onTileClick(x: number, y: number) {
    if (isPlayerDead) return;
    if (position.x === x && position.y === y) {
      const firstMoveCard = hand.find((card) => card.type === 'explore' || card.type === 'sprint');
      if (firstMoveCard) {
        if (moveCardFlashTimer.current) window.clearTimeout(moveCardFlashTimer.current);
        setMoveCardFlash(true);
        moveCardFlashTimer.current = window.setTimeout(() => {
          setMoveCardFlash(false);
        }, 900);
        selectCard(firstMoveCard);
      }
      return;
    }

    const target = adjacentAnimals.find((a) => a.position.x === x && a.position.y === y);
    if (target) {
      handleStrike(target.id);
      return;
    }

    if (!selectedCard) return;
    if (selectedCard.type === 'explore' || selectedCard.type === 'sprint') {
      handlePlayCard(selectedCard, { x, y });
    }
  }

  const isTargetingCard = selectedCard && (
    selectedCard.type === 'explore' || selectedCard.type === 'sprint'
  );
  const canUseItem = useCallback((itemId: string, slotIndex = 0) => {
    const item = getItemById(itemId);
    if (!item) return false;
    if (item.category === 'weapon') return slotIndex === WEAPON_BELT_SLOT_INDEX;
    const tags = item.tags ?? [];
    if (slotIndex === WEAPON_BELT_SLOT_INDEX) return false;
    return tags.includes('food') || tags.includes('cooking') || tags.includes('potion');
  }, []);
  const isConsumableBeltItem = useCallback((itemId: string) => {
    const item = getItemById(itemId);
    if (!item || item.category === 'weapon') return false;
    const tags = item.tags ?? [];
    return tags.includes('food') || tags.includes('cooking') || tags.includes('potion');
  }, []);
  const prevInventoryRef = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    const currentInventory = new Map(inventory.map((slot) => [slot.itemId, slot.quantity]));
    if (!prevInventoryRef.current) {
      prevInventoryRef.current = currentInventory;
      return;
    }

    const previousInventory = prevInventoryRef.current;
    const gainedItems = Array.from(currentInventory.entries())
      .filter(([itemId, qty]) => qty > (previousInventory.get(itemId) ?? 0));
    const gainedWeaponItems = gainedItems.filter(([itemId]) => {
      const item = getItemById(itemId);
      return item?.category === 'weapon';
    });
    const gainedConsumableItems = gainedItems.filter(([itemId]) => isConsumableBeltItem(itemId));

    if (gainedWeaponItems.length > 0 || gainedConsumableItems.length > 0) {
      setBeltSlots((prev) => {
        let next = [...prev];
        let updated = false;

        if (gainedWeaponItems.length > 0) {
          const currentWeaponItemId = next[WEAPON_BELT_SLOT_INDEX];
          const currentWeaponItem = currentWeaponItemId ? getItemById(currentWeaponItemId) : null;
          if (!currentWeaponItem || currentWeaponItem.category !== 'weapon') {
            next[WEAPON_BELT_SLOT_INDEX] = gainedWeaponItems[0][0];
            updated = true;
          }
        }

        for (const [itemId] of gainedConsumableItems) {
          const alreadyAssigned = next.some((assignedItemId, slotIndex) => slotIndex !== WEAPON_BELT_SLOT_INDEX && assignedItemId === itemId);
          if (alreadyAssigned) continue;

          const emptySlotIndex = next.findIndex((assignedItemId, slotIndex) => slotIndex !== WEAPON_BELT_SLOT_INDEX && !assignedItemId);
          if (emptySlotIndex === -1) continue;
          next = [...next];
          next[emptySlotIndex] = itemId;
          updated = true;
        }

        if (!updated) return prev;
        return next;
      });
    }

    prevInventoryRef.current = currentInventory;
  }, [inventory, isConsumableBeltItem]);
  const beltSlotData = useMemo(() => {
    const quantityByItemId = new Map(inventory.map((slot) => [slot.itemId, slot.quantity]));
    return beltSlots.map((slotItemId) => {
      if (!slotItemId) return undefined;
      const quantity = quantityByItemId.get(slotItemId) ?? 0;
      if (quantity <= 0) return undefined;
      return { itemId: slotItemId, quantity };
    });
  }, [beltSlots, inventory]);

  const canAssignSlot = useCallback(
    (slotIndex: number, itemId: string) => {
      const stock = getQuantity(itemId);
      if (stock <= 0) return false;
      const item = getItemById(itemId);
      if (!item) return false;
      if (slotIndex === WEAPON_BELT_SLOT_INDEX) {
        return item.category === 'weapon';
      }
      if (item.category === 'weapon') return false;
      if (!canUseItem(itemId, slotIndex)) return false;
      const alreadyUsed = beltSlots.reduce((total, assignedItemId, i) => {
        if (assignedItemId === itemId && i !== slotIndex) return total + 1;
        return total;
      }, 0);
      return alreadyUsed <= stock;
    },
    [beltSlots, canUseItem, getQuantity]
  );

  const handleSelectBeltSlot = useCallback((slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= BELT_SLOT_COUNT) return;
    setSelectedBeltSlot(slotIndex);
  }, []);

  const handleAssignBeltSlot = useCallback((slotIndex: number, itemId: string) => {
    if (!canAssignSlot(slotIndex, itemId)) return;
    setBeltSlots((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex((assignedItemId, idx) => idx !== slotIndex && assignedItemId === itemId);
      if (existingIndex >= 0) {
        next[existingIndex] = null;
      }
      next[slotIndex] = itemId;
      return next;
    });
  }, [canAssignSlot]);

  const handleCraftWithAutoEquip = useCallback(
    (recipeId: string): string => {
      const resultMessage: string = handleCraft(recipeId) ?? 'Failed to craft.';
      if (!resultMessage.startsWith('✨ Crafted:')) return resultMessage;

      const recipe = recipesById.get(recipeId);
      if (!recipe) return resultMessage;

      const craftedItem = getItemById(recipe.result.itemId);
      if (!craftedItem || craftedItem.category !== 'weapon') return resultMessage;

      setBeltSlots((prev) => {
        const next = [...prev];
        const currentWeapon = next[WEAPON_BELT_SLOT_INDEX] ? getItemById(next[WEAPON_BELT_SLOT_INDEX]) : null;
        if (currentWeapon?.category === 'weapon') return prev;
        next[WEAPON_BELT_SLOT_INDEX] = craftedItem.id;
        return next;
      });

      return resultMessage;
    },
    [handleCraft, recipesById],
  );

  const handleClearBeltSlot = useCallback((slotIndex: number) => {
    setBeltSlots((prev) => {
      if (slotIndex < 0 || slotIndex >= prev.length) return prev;
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  function handleBeltUse(itemId: string) {
    if (isPlayerDead) return;
    const stock = getQuantity(itemId);
    if (stock <= 0) return;

    const item = getItemById(itemId);
    if (!item) return;
    if (item.category === 'weapon') {
      pushEvent(`🗡️ Weapon ready: ${item.name}.`, 'success');
      return;
    }
    handleUseItem(itemId);
  }

  const eventLog = useMemo(() => [...events].reverse(), [events]);
  const compressedEventLog = useMemo(() => {
    const rows: Array<{
      type: 'success' | 'info' | 'warning';
      message: string;
      count: number;
      turn?: number;
    }> = [];
    for (const ev of eventLog) {
      const last = rows[rows.length - 1];
      if (
        last &&
        last.type === ev.type &&
        last.message === ev.message &&
        last.turn !== undefined &&
        ev.turn !== undefined &&
        last.turn === ev.turn
      ) {
        last.count += 1;
      } else {
        rows.push({ type: ev.type, message: ev.message, count: 1, turn: ev.turn });
      }
    }
    return rows;
  }, [eventLog]);
  const eventLogRef = useRef<HTMLDivElement | null>(null);
  const gameOverLogRef = useRef<HTMLDivElement | null>(null);
  const getEventTypeClass = useCallback((type: 'success' | 'info' | 'warning') => {
    return type === 'success'
      ? 'text-emerald-300 border-emerald-400/50'
      : type === 'warning'
        ? 'text-amber-200 border-amber-400/50'
        : 'text-gp-mint border-gp-mint/50';
  }, []);
  const renderEventLine = useCallback((ev: { type: 'success' | 'info' | 'warning'; message: string; count: number }) => {
    const isRestoreLog = ev.message.startsWith('🔄 Resources replenished after');
    const label = isRestoreLog ? '[RESTORE]' : ev.type.toUpperCase();

    return (
      <>
        <span
          className={`mr-2 shrink-0 w-16 text-center px-2 py-0.5 rounded-md border text-[10px] ${getEventTypeClass(ev.type)}`}
        >
          {label}
        </span>
        <span>
          {ev.message}
          {ev.count > 1 ? ` x${ev.count}` : ''}
        </span>
      </>
    );
  }, [getEventTypeClass]);
  const getLabeledAnimalDisplayName = useCallback((animalName: string) => {
    return `${BIOME_PRESET_LABEL[mapBiome]} ${animalName}`;
  }, [mapBiome]);

  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = 0;
    }
    if (gameOverLogRef.current) {
      gameOverLogRef.current.scrollTop = 0;
    }
  }, [compressedEventLog]);

  useEffect(() => {
    return () => {
      if (moveCardFlashTimer.current) {
        window.clearTimeout(moveCardFlashTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setBeltSlots((prev) => {
      const quantityByItemId = new Map(inventory.map((slot) => [slot.itemId, slot.quantity]));
      const next = prev.map((itemId, index) => {
        if (!itemId) return null;
        const quantity = quantityByItemId.get(itemId) ?? 0;
        if (quantity <= 0) return null;

        const item = getItemById(itemId);
        if (!item) return null;
        if (index === WEAPON_BELT_SLOT_INDEX && item.category !== 'weapon') return null;
        if (index !== WEAPON_BELT_SLOT_INDEX && item.category === 'weapon') return null;
        return itemId;
      });

      if (next.every((itemId, index) => itemId === prev[index])) return prev;
      return next;
    });
  }, [inventory, WEAPON_BELT_SLOT_INDEX]);

  useEffect(() => {
    if (!isPlayerDead) {
      setShowGameOverLog(false);
    }
  }, [isPlayerDead]);

  useEffect(() => {
    if (!isTreasureTile) {
      setShowTreasureRewardModal(false);
      setPendingTreasureRewardCard(null);
    }
  }, [isTreasureTile]);

  useEffect(() => {
    if (isPlayerDead) {
      setShowTreasureRewardModal(false);
      setPendingTreasureRewardCard(null);
    }
  }, [isPlayerDead]);

  useEffect(() => {
    const handleQuickUseKeydown = (event: KeyboardEvent) => {
      if (isPlayerDead || activeTab !== 'game') return;
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLElement &&
        (target.tagName.toLowerCase() === 'input' ||
          target.tagName.toLowerCase() === 'textarea' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key;
      if (key >= '1' && key <= '7') {
        if (event.repeat) return;
        const slotIndex = Number(key);
        const slot = beltSlotData[slotIndex];
        if (!slot) return;
        handleBeltUse(slot.itemId);
      }
    };

    window.addEventListener('keydown', handleQuickUseKeydown);
    return () => window.removeEventListener('keydown', handleQuickUseKeydown);
  }, [activeTab, isPlayerDead, beltSlotData, handleBeltUse]);

  const emptySlotClass = 'min-h-[64px] border border-dashed border-gp-mint/55 rounded-lg';
  const emptySlotStyle = {
    background: 'linear-gradient(180deg, rgba(var(--gp-bg), 0.82) 0%, rgba(var(--gp-bg), 0.65) 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(var(--gp-accent), 0.25)',
  };

  // HP bar colour
  const hpRatio = playerHp / maxPlayerHp;
  const hpColor = hpRatio > 0.6 ? 'bg-emerald-400' : hpRatio > 0.3 ? 'bg-amber-400' : 'bg-red-500';
  const gamePanel = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <div className="flex flex-col gap-3">
        <MapPanel
          position={position}
          selectedCard={selectedCard}
          isTreasureRewardClaimed={hasClaimedTreasureReward}
          mapGrid={mapGrid}
          showPlayerMoveHint={moveCardFlash}
          onTileClick={onTileClick}
          currentBiomeInfo={currentBiomeInfo}
          canMoveTo={canMoveTo}
          visitedTiles={visitedTiles}
          knownTiles={knownTiles}
          getTileResources={getTileResources}
          getAnimalsAt={getAnimalsAt}
          getReachableTiles={getReachableTiles}
          nearbyAnimalTiles={nearbyAnimals}
        />

        <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gp-mint">🎒 Belt</h3>
            <span className="text-xs text-gp-mint/70">Quick Use</span>
          </div>
        <div className="grid grid-cols-8 gap-2">
            {beltSlotData.map((slot, index) => {
              const isWeaponSlot = index === WEAPON_BELT_SLOT_INDEX;
              const slotLabel = isWeaponSlot ? 'W' : `${index}`;
              if (!slot) {
                return (
                  <button
                    key={`belt-empty-${index}`}
                    type="button"
                    className={`relative min-h-12 rounded-lg border transition-colors bg-gp-bg/20 ${isWeaponSlot ? 'border-gp-mint/80 bg-gp-mint/15' : 'border-gp-accent/30 hover:border-gp-accent/50'}`}
                  >
                    <span className="absolute left-1.5 top-1 text-[10px] font-semibold text-gp-mint/70">{slotLabel}</span>
                      <div className={`${emptySlotClass}`} style={emptySlotStyle} />
                  </button>
                );
              }

              const item = getItemById(slot.itemId);
              if (!item) return (
                <div
                  key={`belt-invalid-${slot.itemId}-${index}`}
                  className={emptySlotClass}
                  style={emptySlotStyle}
                />
              );

                const canUse = canUseItem(slot.itemId, index);
                const weaponAttackPower = item.attackPower;
                return (
                  <button
                    key={`belt-slot-${index}-${slot.itemId}`}
                    onClick={() => handleBeltUse(slot.itemId)}
                    disabled={!canUse || isPlayerDead}
                    title={item.name}
                  className={`relative h-full flex items-center justify-center rounded-lg border ${isWeaponSlot ? 'border-gp-mint/80 bg-gp-mint/10' : ''} ${canUse && !isPlayerDead ? 'border-gp-accent/60 bg-gp-bg/40 hover:border-gp-accent' : 'border-gp-accent/25 bg-gp-bg/20 opacity-60'} transition-colors`}
                >
                  <span className="absolute left-1.5 top-1 text-[10px] font-semibold text-gp-mint/70">{slotLabel}</span>
                  <span className='text-2xl leading-none text-center'>
                    {item.emoji}
                  </span>
                  <div className="absolute bottom-1 right-1 text-xs text-right flex flex-col items-end gap-0.5">
                    {typeof weaponAttackPower === 'number' ? (
                      <span className="text-emerald-300 font-bold">+{weaponAttackPower}</span>
                    ) : null}
                    {!item.category || item.category !== 'weapon' ? (
                      <span className="text-gp-mint font-semibold">×{slot.quantity}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gp-mint text-lg">🃏 Action Cards</h2>
            <span className="text-xs text-gp-mint/60">{deckSize} left in deck</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {hand.map((card, index) => {
              const isSelected = selectedCard?.id === card.id;
              const stackTheme = getCardStackTheme(card.type);
              const isForageDisabled = isForageCard(card.type) && !canCollectFromCurrentTile;
              return (
                <div key={card.id} className="relative min-h-[13rem]">
                  <div
                    className={`pointer-events-none absolute left-2 top-2 right-0 rounded-xl border ${stackTheme.border} ${stackTheme.layer1} h-full -z-20 rotate-3`}
                  />
                  <div
                    className={`pointer-events-none absolute left-1 top-1 right-1 rounded-xl border ${stackTheme.border} ${stackTheme.layer2} h-full -z-10 rotate-1`}
                  />
                  <div
                    className={`pointer-events-none absolute left-0.5 top-0.5 right-0.5 rounded-xl border ${stackTheme.border} ${stackTheme.layer3} h-full -z-0 rotate-[0.25deg]`}
                  />
                  <ActionCardDisplay
                    card={card}
                    isSelected={isSelected}
                    disabled={isForageDisabled || isPlayerDead}
                    isHighlighted={moveCardFlash && isSelected}
                    onClick={() => onCardClick(card)}
                    className={isPlayerDead ? 'opacity-60' : ''}
                    style={{ zIndex: isSelected ? 30 : 10 - index }}
                  />
                </div>
              );
            })}
          </div>
          {isTargetingCard && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <p className="text-xs text-gp-mint/70">
                Click a highlighted tile on the map to move there
              </p>
              <Button variant="ghost" size="sm" onClick={() => selectCard(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {adjacentAnimals.length > 0 && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3">
            <h3 className="text-sm font-semibold text-red-300 mb-2">⚠️ Nearby Animals</h3>
            <div className="flex flex-wrap gap-2">
              {adjacentAnimals.map((a, index) => (
                <div
                  key={`${a.id}-${a.position.x}-${a.position.y}-${index}`}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gp-bg/40 border border-red-500/20"
                >
                  <span>{a.emoji}</span>
                  <span className="text-xs text-gp-mint/85">
                    {getLabeledAnimalDisplayName(a.name)}
                  </span>
                  <span className={`text-xs font-bold ${a.behavior === 'hostile' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {a.behavior === 'hostile' ? '⚔️' : '🕊️'}
                  </span>
                  <span className="text-xs text-gp-mint/60">{a.hp}/{a.maxHp}HP</span>
                  <Button size="sm" variant="ghost" onClick={() => handleStrike(a.id)} disabled={isPlayerDead}>
                    Attack
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gp-surface border border-gp-accent/30 rounded-xl p-4 flex-1">
          <h2 className="font-semibold text-gp-mint text-lg mb-3">📋 Event Log</h2>
          {events.length === 0 ? (
            <p className="text-gp-mint/85 text-sm">
              No events yet. Play a card to start!
            </p>
          ) : (
            <div ref={eventLogRef} className="space-y-1.5 overflow-y-auto max-h-56">
              {compressedEventLog.map((ev, index) => (
                <div
                  key={`game-log-${index}-${ev.type}-${ev.message}`}
                  className={`text-sm px-3 py-1.5 rounded-lg ${
                    ev.type === 'success'
                      ? 'bg-gp-accent/20 text-gp-mint'
                      : ev.type === 'warning'
                      ? 'bg-amber-900/40 text-amber-200'
                      : 'bg-gp-bg/40 text-gp-mint'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {renderEventLine(ev)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gp-bg flex flex-col">
      {showDamageFlash ? <div className="pointer-events-none fixed inset-0 z-50 gp-damage-flash-overlay" /> : null}
      {showTreasureRewardModal && pendingTreasureRewardCard ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-xl border border-gp-accent/40 bg-gp-surface p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gp-mint">🏴‍☠️ Treasure Reward</h3>
            <p className="text-xs text-gp-mint/80">Choose one reward from this treasure chest.</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTreasureRewardChoice('xp')}
              >
                ✨ +XP
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTreasureRewardChoice('weapon')}
              >
                🗡️ Weapon
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleTreasureRewardChoice('gold_chunk')}
              >
                ⚜️ Gold
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowTreasureRewardModal(false);
                setPendingTreasureRewardCard(null);
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
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
            <div className="text-xs text-gp-mint/90 px-2 py-1 rounded-lg bg-gp-bg/40 border border-gp-accent/20">
              🗺️ Map Biome: {BIOME_PRESET_LABEL[mapBiome]}
            </div>

            {/* Player HP */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gp-bg/40 border border-gp-accent/20">
              <span>❤️</span>
              <span className="text-xs font-semibold text-gp-mint">Lv {playerLevel}</span>
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
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gp-bg/40 border border-gp-accent/20">
              <span>⭐</span>
              <span className="text-xs text-gp-mint">{playerXp}/{xpToNextLevel} XP</span>
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
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 space-y-4 flex flex-col min-h-0">
        <div className="bg-gp-surface border border-gp-accent/30 rounded-xl overflow-hidden shadow-lg shadow-black/20 flex-1 min-h-0 flex flex-col">
          <div className="relative px-1.5 py-1.5 border-b border-gp-accent/30">
            <div
              className="relative rounded-lg bg-black/20 p-1"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`, gap: '0.25rem' }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 rounded-md bg-gp-mint/25 border border-gp-mint/40 transition-transform duration-300"
                style={{
                  width: `calc(100% / ${TABS.length})`,
                  transform: `translateX(${activeTabIndex * 100}%)`,
                }}
              />
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab((prev) => (prev === id ? null : id))}
                  className={[
                    'relative z-10 py-2 px-2 text-xs md:text-sm font-semibold rounded-md transition-colors duration-200',
                    activeTab === id
                      ? 'text-gp-mint'
                      : 'text-gp-mint/65 hover:text-gp-mint',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`transition-all duration-300 flex-1 min-h-0 flex flex-col`}
          >
            <div className="p-4 transition-all duration-300 transform flex-1 min-h-0 flex flex-col">
              <div className="overflow-hidden flex-1 min-h-0 flex relative">
                {isPlayerDead && (
                  <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4">
                    <div className="bg-zinc-800 border border-red-500/50 rounded-xl p-5 text-center space-y-3 max-w-sm w-full relative">
                      {playerRankLabel && (
                        <div className="absolute right-4 top-4 flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gp-accent/30 bg-gp-bg/40 text-xs">
                          <span className="text-gp-mint">🏅</span>
                          <span className="font-semibold text-gp-mint">#{playerRankLabel}</span>
                        </div>
                      )}
                      <p className="text-red-300 font-bold text-xl">💀 You Died</p>
                      <div className="text-4xl font-black text-gp-mint">
                        {finalScore.toLocaleString()} pts
                      </div>
                      <p className="text-xs text-gp-mint/70">Survival report for this run</p>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gp-mint/80">
                        <div className="bg-gp-bg/40 rounded-lg p-2">
                          <div className="font-semibold text-gp-mint">📅 Day</div>
                          <div>{conditions.day}</div>
                        </div>
                        <div className="bg-gp-bg/40 rounded-lg p-2">
                          <div className="font-semibold text-gp-mint">⬆️ Level</div>
                          <div>{playerLevel}</div>
                        </div>
                        <div className="bg-gp-bg/40 rounded-lg p-2">
                          <div className="font-semibold text-gp-mint">✨ XP</div>
                          <div>{totalXpGained}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gp-mint/80 text-left">
                        Difficulty: <span className="font-semibold">{BIOME_DIFFICULTY_LABEL[mapBiome]}</span>
                      </div>
                      {deathCause ? (
                        <p className="text-xs text-red-300/90 text-left">
                          Cause: <span className="font-semibold">{deathCause}</span>
                        </p>
                      ) : null}
                      {defeatedAnimals.length > 0 && (
                        <div className="text-xs text-gp-mint/70">
                          <div className="font-semibold text-gp-mint mb-1">🐾 Animals defeated</div>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {defeatedAnimals.map((a, index) => (
                            <span
                              key={`${a.name}-${a.emoji}-${a.rarity}-${index}`}
                              className="px-2 py-0.5 rounded-full bg-gp-bg/40 border border-gp-accent/30 inline-flex items-center gap-1.5"
                            >
                              <span>{a.emoji}</span>
                              <span>{getLabeledAnimalDisplayName(a.name)}</span>
                              <span>×{a.count}</span>
                            </span>
                          ))}
                          </div>
                        </div>
                      )}
                    <p className="text-gp-mint/50 text-xs">
                        {user ? 'Score saved to the leaderboard.' : 'Score saved as Guest.'}
                      </p>
                    <Button variant="primary" size="sm" onClick={onRestart} className="w-full">
                        🔄 Restart
                      </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowGameOverLog((prev) => !prev)}
                      className="w-full"
                    >
                      {showGameOverLog ? '🙈 Hide Log' : '📜 View Log'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowLeaderboardPopup(true)} className="w-full">
                      View Leaderboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={onBack} className="w-full">
                      ↩ Return to lobby
                    </Button>
                  </div>
                  <LeaderboardPopup
                    isOpen={showLeaderboardPopup}
                    onClose={() => setShowLeaderboardPopup(false)}
                    title="🏆 Leaderboard"
                    loading={leaderboardLoading}
                    rows={leaderboardRows}
                    scoreSuffix="pts"
                    renderMeta={(record) => {
                      const survivalDays = typeof record.survivalDays === 'number' ? record.survivalDays : '-';
                      const level = typeof record.level === 'number' ? record.level : '-';
                      if (survivalDays === '-' && level === '-') return null;
                      return (
                        <div className="flex items-center gap-2 text-gp-mint/50 text-[10px]">
                          <span className="hidden sm:block">{`Day ${survivalDays}`}</span>
                          <span className="hidden sm:block">{`Lv.${level}`}</span>
                        </div>
                      );
                    }}
                  />
                  {showGameOverLog && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-10 pointer-events-none">
                      <div className="w-full max-w-xl pointer-events-auto rounded-xl border border-gp-accent/40 bg-zinc-900/95 p-4 shadow-2xl">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-gp-mint">📜 Game Log</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowGameOverLog(false)}
                            className="h-7 w-7 px-0 text-gp-mint"
                          >
                            ✕
                          </Button>
                        </div>
                        <div ref={gameOverLogRef} className="max-h-56 space-y-1 overflow-y-auto">
                          {compressedEventLog.length === 0 ? (
                            <p className="text-sm text-gp-mint/70">No events yet.</p>
                          ) : (
                            compressedEventLog.map((ev, index) => (
                              <div
                                key={`game-over-log-${index}-${ev.type}-${ev.message}`}
                                className="text-xs rounded-md px-2 py-1 bg-gp-bg/50 text-gp-mint/90"
                              >
                                <div className="flex items-start gap-2">
                                  {renderEventLine(ev)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                )}
                <div
                  className="flex transition-transform duration-300 ease-out h-full"
                  style={{
                    transform: `translateX(-${activeTabIndex * 100}%)`,
                  }}
                >
                  <section className="w-full shrink-0">
                    {gamePanel}
                  </section>
                  <section className="w-full shrink-0">
                    <InventoryPanel
                      inventory={inventory}
                      beltSlots={beltSlots}
                      selectedBeltSlot={selectedBeltSlot}
                      onSelectBeltSlot={handleSelectBeltSlot}
                      onAssignToBelt={handleAssignBeltSlot}
                      onClearBeltSlot={handleClearBeltSlot}
                      canUseInBelt={canUseItem}
                    />
                  </section>
                  <section className="w-full shrink-0">
                    <CraftingPanel recipes={recipes} canCraft={canCraft} onCraft={handleCraftWithAutoEquip} getQuantity={getQuantity} />
                  </section>
                  <section className="w-full shrink-0">
                    <DiscoveryPanel discovered={discovered} />
                  </section>
                  <section className="w-full shrink-0">
                    <SpawnPanel
                      conditions={conditions}
                      biomeType={currentBiomeInfo.type}
                      scoutPoints={scoutPoints}
                      scoutRevealLevel={scoutRevealLevel}
                      unlockedSpawnLayerItemCounts={spawnLayerUnlockedItemCounts}
                      onUnlockSpawnLayerItem={unlockNextSpawnItemAtLayer}
                      onUnlockSpawnLayer={unlockSpawnLayer}
                      selectedSpawnLayer={selectedSpawnLayer}
                      onSelectSpawnLayer={setSelectedSpawnLayer}
                    />
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [collectionGameSession, setCollectionGameSession] = useState(0);
  const [collectionGameReady, setCollectionGameReady] = useState(false);
  const [collectionBiome, setCollectionBiome] = useState<MapBiomePreset>('meadow');
  const [signInError, setSignInError] = useState<string | null>(null);
  const { user, nickname, loading, signInWithGoogle, signOut, updateNickname } = useAuth();

  async function handleSignIn() {
    setSignInError(null);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('popup-closed')) return;
      setSignInError('Sign in failed. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gp-bg">
        <span className="text-gp-mint/50 text-sm">Loading…</span>
      </div>
    );
  }

  function handleCollectionBiomeChange(nextBiome: MapBiomePreset) {
    setCollectionBiome(nextBiome);
    if (collectionGameReady) {
      setCollectionGameSession((prev) => prev + 1);
    }
  }

  function startCollectionGame() {
    setCollectionGameReady(true);
    setCollectionGameSession((prev) => prev + 1);
  }

  function openCollectionGame() {
    setCollectionGameReady(false);
    setActiveGame('collection');
  }

  if (activeGame === 'collection') {
    if (!collectionGameReady) {
      return (
        <div className="min-h-screen bg-gp-bg flex items-center justify-center p-4">
          <div className="bg-gp-surface rounded-xl border border-gp-accent/30 shadow-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-gp-mint">🌿 Glowing Potato</h2>
            <p className="text-sm text-gp-mint/80">Select a map biome before starting.</p>
            <label className="block">
              <span className="text-xs text-gp-mint/80">Map Biome</span>
              <select
                value={collectionBiome}
                onChange={(event) => handleCollectionBiomeChange(event.target.value as MapBiomePreset)}
                className="mt-2 w-full bg-gp-bg text-gp-mint border border-gp-accent/30 rounded-lg px-3 py-2"
              >
                {BIOME_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gp-bg">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-gp-accent/40 bg-gp-bg/55 px-3 py-2">
              <p className="text-xs text-gp-mint/75">Mode</p>
              <p className="text-sm font-bold text-gp-mint">
                {BIOME_PRESET_LABEL[collectionBiome]} · {BIOME_DIFFICULTY_LABEL[collectionBiome]}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setActiveGame(null); setCollectionGameReady(false); }} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={startCollectionGame} className="flex-1">
                Start
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <CollectionGame
        key={`${collectionGameSession}-${collectionBiome}`}
        onBack={() => {
          setActiveGame(null);
          setCollectionGameReady(false);
        }}
        onRestart={() => setCollectionGameSession((prev) => prev + 1)}
        mapBiome={collectionBiome}
        user={user}
      />
    );
  }

  if (activeGame === 'dont-say-it') {
    return (
      <DontSayIt
        onBack={() => setActiveGame(null)}
        nickname={nickname}
        isLoggedIn={!!user}
        currentUserId={user?.uid}
        onSignIn={handleSignIn}
        onSignOut={signOut}
        onUpdateNickname={updateNickname}
      />
    );
  }

  return (
    <>
      {signInError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          {signInError}
        </div>
      )}
      <GameLobby
        onSelectGame={(gameId) => {
          if (gameId === 'collection') {
            openCollectionGame();
            return;
          }
          setActiveGame(gameId);
        }}
        user={user}
        nickname={nickname}
        onSignIn={handleSignIn}
        onSignOut={signOut}
        onUpdateNickname={updateNickname}
      />
    </>
  );
}
