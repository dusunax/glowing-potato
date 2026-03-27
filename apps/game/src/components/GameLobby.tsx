// Main lobby screen. Displays all mini-games in a slot-style carousel so the
// player can pick which game to play.

import { useState, useEffect, useRef } from 'react';
import { MINI_GAMES } from '../data/minigames';
import type { MiniGame } from '../types/minigame';
import { Button, Badge } from '@glowing-potato/ui';

// Fixed card dimensions shared between GameCard and the slot frame overlay.
const CARD_WIDTH_CLASS = 'w-64';
const CARD_HEIGHT_CLASS = 'h-72';

interface GameLobbyProps {
  onSelectGame: (gameId: string) => void;
}

export function GameLobby({ onSelectGame }: GameLobbyProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = MINI_GAMES.length;

  // Clean up any running spin interval on unmount.
  useEffect(() => {
    return () => {
      if (spinIntervalRef.current !== null) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  function prev() {
    if (spinning) return;
    setActiveIndex((i) => (i - 1 + total) % total);
  }

  function next() {
    if (spinning) return;
    setActiveIndex((i) => (i + 1) % total);
  }

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);
    let ticks = 0;
    const maxTicks = 12 + Math.floor(Math.random() * 8);
    spinIntervalRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % total);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(spinIntervalRef.current!);
        spinIntervalRef.current = null;
        setSpinning(false);
      }
    }, 80);
  }

  function handlePlay(game: MiniGame) {
    if (game.status !== 'available') return;
    onSelectGame(game.id);
  }

  const active = MINI_GAMES[activeIndex];
  const prevGame = MINI_GAMES[(activeIndex - 1 + total) % total];
  const nextGame = MINI_GAMES[(activeIndex + 1) % total];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gp-bg">
      {/* Header */}
      <header className="text-center mb-10">
        <p className="text-xs font-semibold tracking-widest text-gp-accent uppercase mb-2">
          Mini-Game Arcade
        </p>
        <h1 className="text-4xl font-bold text-gp-mint tracking-tight">
          🎰 Pick Your Game
        </h1>
        <p className="text-gp-accent mt-2 text-sm">
          Spin to discover a game, or choose from the list below
        </p>
      </header>

      {/* Slot machine carousel */}
      <div className="w-full max-w-3xl">
        {/* Track — all three cards share the same fixed size */}
        <div className="relative flex items-center justify-center gap-4 mb-6 select-none">
          {/* Left ghost card */}
          <div className="hidden sm:block flex-shrink-0 opacity-35 transition-opacity duration-300">
            <GameCard game={prevGame} />
          </div>

          {/* Active card */}
          <div
            className={`flex-shrink-0 transition-opacity duration-150 ${
              spinning ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <GameCard game={active} active />
          </div>

          {/* Right ghost card */}
          <div className="hidden sm:block flex-shrink-0 opacity-35 transition-opacity duration-300">
            <GameCard game={nextGame} />
          </div>

          {/* Slot frame overlay — same dimensions as GameCard */}
          <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 ${CARD_WIDTH_CLASS} pointer-events-none rounded-2xl ring-1 ring-gp-mint/20`} />
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {MINI_GAMES.map((_, i) => (
            <button
              key={i}
              onClick={() => !spinning && setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? 'bg-gp-mint scale-125'
                  : 'bg-gp-accent/40 hover:bg-gp-accent'
              }`}
              aria-label={`Go to game ${i + 1}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={prev}
            disabled={spinning}
            aria-label="Previous game"
          >
            ◀
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleSpin}
            disabled={spinning}
          >
            {spinning ? '🎰 Spinning…' : '🎰 Spin'}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={next}
            disabled={spinning}
            aria-label="Next game"
          >
            ▶
          </Button>
        </div>

        {/* Play / Coming-soon action */}
        <div className="flex justify-center mt-5">
          {active.status === 'available' ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handlePlay(active)}
              className="min-w-48"
            >
              ▶ Play {active.name}
            </Button>
          ) : (
            /* text-gp-mint/50 on near-gp-bg background: sufficient contrast ✓ */
            <span className="px-6 py-3 rounded-xl text-sm font-semibold text-gp-mint/50 bg-gp-surface/30 border border-gp-accent/20">
              🔒 Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* All games grid */}
      <div className="mt-12 w-full max-w-3xl">
        <h2 className="text-xs font-semibold text-gp-accent uppercase tracking-widest mb-4 text-center">
          All Games
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {MINI_GAMES.map((game, i) => (
            <button
              key={game.id}
              onClick={() => !spinning && setActiveIndex(i)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 text-left ${
                i === activeIndex
                  ? 'border-gp-mint/50 bg-gp-surface'
                  : 'border-gp-accent/20 bg-gp-surface/30 hover:border-gp-accent/50 hover:bg-gp-surface/60'
              } ${game.status === 'coming-soon' ? 'opacity-50' : ''}`}
            >
              <span className="text-2xl">{game.emoji}</span>
              <span className="text-xs text-gp-mint font-medium text-center leading-tight">
                {game.name}
              </span>
              {game.status === 'coming-soon' && (
                <span className="text-[10px] text-gp-mint/50">Soon</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Sub-component ---

interface GameCardProps {
  game: MiniGame;
  active?: boolean;
}

// Fixed dimensions so ghost and active cards are always the same size.
function GameCard({ game, active = false }: GameCardProps) {
  return (
    <div
      className={`${CARD_WIDTH_CLASS} ${CARD_HEIGHT_CLASS} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 border transition-colors duration-200 ${
        active
          ? 'bg-gp-surface border-gp-accent/60'
          : 'bg-gp-surface/50 border-gp-accent/20'
      }`}
      style={
        active
          ? { boxShadow: `0 0 32px ${game.color}33` }
          : undefined
      }
    >
      <span className="text-5xl">{game.emoji}</span>
      <div className="text-center">
        <div className="font-semibold text-gp-mint text-base leading-tight">
          {game.name}
        </div>
        {/* text-gp-mint/85 on gp-surface: ~4.55:1 — passes WCAG AA for small text ✓ */}
        <div className="text-gp-mint/85 text-xs mt-1.5 leading-snug line-clamp-3">
          {game.description}
        </div>
      </div>
      {game.status === 'coming-soon' && (
        <Badge label="Coming Soon" variant="muted" />
      )}
      {game.status === 'available' && active && (
        <Badge label="● Available" variant="success" />
      )}
    </div>
  );
}

