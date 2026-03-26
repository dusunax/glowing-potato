// Main lobby screen. Displays all mini-games in a slot-style carousel so the
// player can pick which game to play.

import { useState, useEffect, useRef } from 'react';
import { MINI_GAMES } from '../data/minigames';
import type { MiniGame } from '../types/minigame';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#1a1a2e' }}>
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-100 tracking-tight">🎰 Mini-Game Arcade</h1>
        <p className="text-slate-400 mt-2">Spin to discover a game, or pick one yourself</p>
      </header>

      {/* Slot machine carousel */}
      <div className="w-full max-w-3xl">
        {/* Track */}
        <div className="relative flex items-center justify-center gap-4 mb-6 select-none">
          {/* Left ghost card */}
          <div className="hidden sm:block w-44 opacity-30 scale-90 transition-all duration-300 flex-shrink-0">
            <GameCard game={prevGame} dim />
          </div>

          {/* Active card */}
          <div
            className={`flex-shrink-0 w-72 transition-all duration-300 ${spinning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}
          >
            <GameCard game={active} active />
          </div>

          {/* Right ghost card */}
          <div className="hidden sm:block w-44 opacity-30 scale-90 transition-all duration-300 flex-shrink-0">
            <GameCard game={nextGame} dim />
          </div>

          {/* Slot frame overlay */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-72 pointer-events-none border-2 border-yellow-400/40 rounded-2xl ring-2 ring-yellow-400/10" />
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {MINI_GAMES.map((_, i) => (
            <button
              key={i}
              onClick={() => !spinning && setActiveIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? 'bg-yellow-400 scale-125' : 'bg-slate-600 hover:bg-slate-400'
              }`}
              aria-label={`Go to game ${i + 1}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={prev}
            disabled={spinning}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-xl transition-colors"
            aria-label="Previous game"
          >
            ◀
          </button>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-900 font-bold text-lg transition-colors shadow-lg shadow-yellow-500/30"
          >
            {spinning ? '🎰 Spinning…' : '🎰 Spin'}
          </button>

          <button
            onClick={next}
            disabled={spinning}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-xl transition-colors"
            aria-label="Next game"
          >
            ▶
          </button>
        </div>

        {/* Play button for current game */}
        <div className="flex justify-center mt-6">
          {active.status === 'available' ? (
            <button
              onClick={() => handlePlay(active)}
              className="px-8 py-3 rounded-xl font-bold text-lg text-white transition-colors shadow-lg"
              style={{ background: active.color, boxShadow: `0 4px 20px ${active.color}66` }}
            >
              ▶ Play {active.name}
            </button>
          ) : (
            <span className="px-8 py-3 rounded-xl text-lg font-bold text-slate-500 bg-slate-800 border border-slate-700">
              🔒 Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* All games list */}
      <div className="mt-12 w-full max-w-3xl">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 text-center">
          All Games
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {MINI_GAMES.map((game, i) => (
            <button
              key={game.id}
              onClick={() => !spinning && setActiveIndex(i)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-150 ${
                i === activeIndex
                  ? 'border-yellow-400/60 bg-slate-800'
                  : 'border-slate-700 bg-slate-900 hover:border-slate-500'
              } ${game.status === 'coming-soon' ? 'opacity-50' : ''}`}
            >
              <span className="text-2xl">{game.emoji}</span>
              <span className="text-xs text-slate-300 font-medium text-center leading-tight">{game.name}</span>
              {game.status === 'coming-soon' && (
                <span className="text-[10px] text-slate-500">Soon</span>
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
  dim?: boolean;
}

function GameCard({ game, active, dim }: GameCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 flex flex-col items-center gap-3 border transition-all duration-300 ${
        active
          ? 'bg-slate-800 border-slate-600 shadow-2xl'
          : 'bg-slate-900 border-slate-700'
      } ${dim ? 'pointer-events-none' : ''}`}
      style={active ? { boxShadow: `0 0 40px ${game.color}44` } : {}}
    >
      <span className="text-5xl">{game.emoji}</span>
      <div className="text-center">
        <div className="font-bold text-slate-100 text-lg leading-tight">{game.name}</div>
        <div className="text-slate-400 text-sm mt-1 leading-snug">{game.description}</div>
      </div>
      {game.status === 'coming-soon' && (
        <span className="text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-700 rounded-full px-3 py-1">
          Coming Soon
        </span>
      )}
      {game.status === 'available' && active && (
        <span
          className="text-xs font-semibold rounded-full px-3 py-1"
          style={{ background: `${game.color}33`, color: game.color }}
        >
          ● Available
        </span>
      )}
    </div>
  );
}
