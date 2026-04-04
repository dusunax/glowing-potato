// Main lobby screen. Displays all mini-games in a slot-style carousel and
// full-page (100vh) introduction sections for each available game.

import { useState, useEffect, useRef, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { MINI_GAMES } from '../data/minigames';
import type { MiniGame } from '../types/minigame';
import { Button } from '@glowing-potato/ui';
import { UserEditPopup } from './UserEditPopup';
import { GameLobbyCarouselSection } from './GameLobbyCarouselSection';
import type { NicknameUpdateResult } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { CarouselApi } from '@glowing-potato/ui';

// Per-game introduction content shown in the full-page intro sections.
const GAME_INTROS: Record<string, { tagline: string; features: { icon: string; text: string }[] }> = {
  'dont-say-it': {
    tagline: 'A multiplayer game where saying the forbidden word makes you lose',
    features: [
      { icon: '🔑', text: 'Receive a secret banned word' },
      { icon: '💬', text: 'Talk freely while dodging your forbidden word' },
      { icon: '🕵️', text: 'Infer other players&apos; forbidden words' },
      { icon: '👑', text: 'The last player standing wins' },
    ],
  },
  'halli-galli': {
    tagline: '과일 합계가 5가 되는 순간 가장 빠르게 벨을 울려라!',
    features: [
      { icon: '🃏', text: '차례로 과일 카드를 뒤집어요' },
      { icon: '🔢', text: '한 종류의 과일 합계가 정확히 5개가 되면' },
      { icon: '🔔', text: '누구보다 빠르게 벨을 눌러요' },
      { icon: '🏆', text: '90초 후 가장 많이 맞힌 플레이어 승리' },
    ],
  },
  collection: {
    tagline: 'A seasonal collection and survival exploration game',
    features: [
      { icon: '🗺️', text: 'Explore an 8×8 biome map' },
      { icon: '🍄', text: 'Collect seasonal items' },
      { icon: '⚗️', text: 'Craft rare items' },
      { icon: '📖', text: 'Fill the discovery log and chase top scores' },
    ],
  },
};

interface GameLobbyProps {
  onSelectGame: (gameId: string) => void;
  user?: User | null;
  nickname?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onUpdateNickname?: (nickname: string) => Promise<NicknameUpdateResult>;
}

export function GameLobby({
  onSelectGame,
  user,
  nickname,
  onSignIn,
  onSignOut,
  onUpdateNickname,
}: GameLobbyProps) {
  const mainGameIndex = MINI_GAMES.findIndex((game) => game.id === 'dont-say-it');
  const total = MINI_GAMES.length;
  const getSafeIndex = (index: number) => {
    if (total <= 0) return 0;
    if (index < 0) return 0;
    if (index > total - 1) return total - 1;
    return index;
  };

  const getCarouselIndex = (gameIndex: number) => {
    if (total <= 0) return 0;
    return getSafeIndex(gameIndex) + 1;
  };

  const getGameIndexFromCarouselIndex = (carouselIndex: number) => {
    if (total <= 0) return 0;
    if (carouselIndex <= 0) return 0;
    if (carouselIndex >= total + 1) return total - 1;
    return carouselIndex - 1;
  };

  const [activeIndex, setActiveIndex] = useState<number>(() => getSafeIndex(mainGameIndex >= 0 ? mainGameIndex : 0));
  const [spinning, setSpinning] = useState(false);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const spinStepRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const setActiveIndexAndScroll = (nextIndex: number) => {
    const normalizedIndex = getSafeIndex(nextIndex);
    setActiveIndex(normalizedIndex);
    if (carouselApi) {
      carouselApi.scrollTo(getCarouselIndex(normalizedIndex), true);
    }
  };

  const selectedGameId = MINI_GAMES[activeIndex]?.id;
  const { records: leaderboard, loading: leaderboardLoading } = useLeaderboard(10, selectedGameId);
  const isWinBasedLeaderboard = selectedGameId === 'dont-say-it' || selectedGameId === 'halli-galli';
  const scoreLabel = isWinBasedLeaderboard ? 'wins' : 'pts';
  const leaderboardRows = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const record = leaderboard[index];
      if (record) return { type: 'record' as const, record, index };
      return { type: 'empty' as const, index };
    });
  }, [leaderboard]);

  // Clean up any running spin timer on unmount.
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      const selected = carouselApi.selectedScrollSnap();
      const nextActive = getGameIndexFromCarouselIndex(selected);
      if (selected <= 0 || selected >= total + 1) {
        carouselApi.scrollTo(getCarouselIndex(nextActive), true);
      }
      setActiveIndex(nextActive);
      setCanScrollPrev(nextActive > 0);
      setCanScrollNext(nextActive < total - 1);
    };
    carouselApi.on('select', onSelect);
    carouselApi.on('reInit', onSelect);
    onSelect();
    return () => {
      carouselApi.off('select', onSelect);
      carouselApi.off('reInit', onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    const target = getCarouselIndex(activeIndex);
    if (carouselApi.selectedScrollSnap() !== target) {
      carouselApi.scrollTo(target, true);
    }
  }, [carouselApi, activeIndex, total]);

  useEffect(() => {
    return () => {
      if (spinStepRef.current !== null) {
        clearTimeout(spinStepRef.current);
      }
    };
  }, []);

  function prev() {
    if (spinning) return;
    if (!canScrollPrev) return;
    setActiveIndexAndScroll(activeIndex - 1);
  }

  function next() {
    if (spinning) return;
    if (!canScrollNext) return;
    setActiveIndexAndScroll(activeIndex + 1);
  }

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);
    let ticks = 0;
    const maxTicks = 12 + Math.floor(Math.random() * 8);
    const step = () => {
      setActiveIndex((current) => {
        const next = getSafeIndex(current + 1);
        if (carouselApi) {
          carouselApi.scrollTo(getCarouselIndex(next), true);
        }
        return next;
      });
      ticks++;
      if (ticks >= maxTicks) {
        if (spinStepRef.current !== null) clearTimeout(spinStepRef.current);
        spinStepRef.current = null;
        setSpinning(false);
        setActiveIndex((i) => {
          if (total <= 1) return i;
          let next = i;
          while (next === i) {
            next = Math.floor(Math.random() * total);
          }
          if (carouselApi) {
            carouselApi.scrollTo(getCarouselIndex(next), true);
          }
          return next;
        });
        return;
      }
      const delay = 80 + ticks * 8;
      spinStepRef.current = setTimeout(step, delay);
    };
    spinStepRef.current = setTimeout(step, 0);
  }

  function handlePlay(game: MiniGame) {
    if (game.status !== 'available') return;
    onSelectGame(game.id);
  }

  const active = MINI_GAMES[activeIndex];
  const userDisplayName = user ? (nickname || user.displayName || '') : '';


  return (
    <div className="bg-gp-bg h-screen overflow-y-auto scroll-smooth">
      {/* Fixed top-right auth controls — always visible while scrolling */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gp-bg/80 backdrop-blur-sm rounded-full px-1 py-1">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => setShowUserEdit(true)}
              aria-label="Edit profile"
              title={userDisplayName || 'Profile'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gp-accent/30 text-gp-mint/70 hover:text-gp-mint hover:border-gp-accent/60 hover:bg-gp-accent/10 transition-colors text-sm"
            >
              <span className="w-6 h-6 rounded-full bg-gp-surface flex items-center justify-center text-xs font-bold text-gp-mint">
                {(userDisplayName || '?')[0].toUpperCase()}
              </span>
              <span className="max-w-24 truncate">{userDisplayName}</span>
              <span className="text-xs opacity-60">✎</span>
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Sign out"
                className="px-2 py-1.5 rounded-lg border border-gp-accent/20 text-gp-mint/50 hover:text-gp-mint/80 hover:border-gp-accent/40 transition-colors text-xs"
              >
                Sign out
              </button>
            )}
          </>
        ) : (
          onSignIn && (
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gp-accent/30 text-gp-mint/70 hover:text-gp-mint hover:border-gp-accent/60 hover:bg-gp-accent/10 transition-colors text-sm font-medium"
            >
              <span>G</span>
              Sign in
            </button>
          )
        )}
      </div>

      {/* User edit popup */}
      {showUserEdit && user && onUpdateNickname && (
        <UserEditPopup
          currentNickname={userDisplayName}
          onSave={onUpdateNickname}
          onClose={() => setShowUserEdit(false)}
        />
      )}

      <GameLobbyCarouselSection
        games={MINI_GAMES}
        activeIndex={activeIndex}
        spinning={spinning}
        canScrollPrev={canScrollPrev}
        canScrollNext={canScrollNext}
        startIndex={getCarouselIndex(mainGameIndex >= 0 ? mainGameIndex : 0)}
        setCarouselApi={setCarouselApi}
        onSelectIndex={setActiveIndexAndScroll}
        onPrev={prev}
        onNext={next}
        onSpin={handleSpin}
        onPlay={handlePlay}
      />

      {/* === Sections 2+: per-game introduction (100vh each) === */}
      <div>
        {MINI_GAMES.filter((g) => g.status === 'available').map((game) => (
          <GameIntroSection
            key={game.id}
            game={game}
            intro={GAME_INTROS[game.id]}
            onPlay={() => onSelectGame(game.id)}
            user={user}
            onSignIn={onSignIn}
          />
        ))}
      </div>

      {/* === All Games === */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <h2 className="text-xs font-semibold text-gp-accent uppercase tracking-widest mb-4 text-center">
          All Games
        </h2>
        <div className="flex justify-center gap-3 flex-wrap">
          {MINI_GAMES.map((game, i) => (
            <button
              key={game.id}
              type="button"
              onClick={() => !spinning && setActiveIndexAndScroll(i)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 w-32 ${
                i === activeIndex
                  ? 'border-gp-mint/50 bg-gp-surface'
                  : 'border-gp-accent/20 bg-gp-surface/30 hover:border-gp-accent/50 hover:bg-gp-surface/60'
              }`}
            >
              <span className="text-2xl">{game.emoji}</span>
              <span className="text-xs text-gp-mint font-medium text-center leading-tight">
                {game.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* === Leaderboard (bottom) === */}
      <section className="px-6 pb-16 w-full max-w-3xl mx-auto">
        <h2 className="text-xs font-semibold text-gp-accent uppercase tracking-widest mb-4 text-center">
          🏆 Leaderboard — {active?.name ?? 'Game'}
        </h2>
        {leaderboardLoading ? (
          <div className="rounded-xl border-2 border-gp-accent/40 bg-gp-surface/90 overflow-hidden">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={`leaderboard-skeleton-${index}`}
                className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-gp-accent/10 last:border-b-0 ${
                  index === 0 ? 'bg-gp-bg/55' : 'bg-gp-surface/45'
                }`}
              >
                <span className={`w-6 text-center font-bold text-gp-mint/40 ${getRankColorClass(index)}`}>
                  {getRankLabel(index)}
                </span>
                <div className="h-3 flex-1 rounded bg-gp-accent/20 animate-pulse" />
                <div className="h-3 w-20 rounded bg-gp-accent/20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-gp-accent/40 bg-gp-surface/90 overflow-hidden">
            {leaderboardRows.map((row) => {
              if (row.type === 'record') {
                const record = row.record;
                return (
                  <div
                    key={record.id ?? row.index}
                    className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-gp-accent/10 last:border-b-0 ${
                      row.index === 0 ? 'bg-gp-bg/75' : 'bg-gp-surface/65'
                    }`}
                  >
                    <span className={`w-6 text-center font-bold ${getRankColorClass(row.index)}`}>
                      {getRankLabel(row.index)}
                    </span>
                    <span className="flex-1 font-medium text-gp-mint truncate">{record.displayName}</span>
                    <span className="font-bold text-gp-mint">{record.score.toLocaleString()} {scoreLabel}</span>
                    {!isWinBasedLeaderboard && (
                      <>
                        <span className="text-gp-mint/50 text-xs hidden sm:block">Day {record.survivalDays}</span>
                        <span className="text-gp-mint/50 text-xs hidden sm:block">Lv.{record.level}</span>
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={`empty-slot-${row.index}`}
                  className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-gp-accent/10 last:border-b-0 ${
                    row.index === 0 ? 'bg-gp-bg/55' : 'bg-gp-surface/45'
                  }`}
                >
                  <span className={`w-6 text-center font-bold text-gp-mint/40 ${getRankColorClass(row.index)}`}>
                    {getRankLabel(row.index)}
                  </span>
                  <span className="flex-1 font-medium text-gp-mint/40">-</span>
                </div>
              );
            })}
          </div>
        )}
        {!user && (
          <p className="text-center text-gp-mint/40 text-xs mt-3">
            Sign in with Google to save your scores.
          </p>
        )}
      </section>
    </div>
  );
}

// --- Sub-component ---

function getRankColorClass(rank: number): string {
  if (rank === 0) return 'text-yellow-400';
  if (rank === 1) return 'text-gp-mint/70';
  if (rank === 2) return 'text-orange-400';
  return 'text-gp-mint/40';
}

function getRankLabel(rank: number): string {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `${rank + 1}`;
}

// --- GameIntroSection ---

interface GameIntroSectionProps {
  game: MiniGame;
  intro: { tagline: string; features: { icon: string; text: string }[] } | undefined;
  onPlay: () => void;
  user?: User | null;
  onSignIn?: () => void;
}

function GameIntroSection({ game, intro, onPlay, user, onSignIn }: GameIntroSectionProps) {
  if (!intro) return null;
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center p-8 relative border-t border-gp-accent/10"
      style={{ background: `radial-gradient(ellipse at 50% 60%, ${game.color}18 0%, transparent 65%)` }}
    >
      <div className="max-w-xl w-full text-center">
        <span className="text-8xl mb-6 block" role="img" aria-label={game.name}>
          {game.emoji}
        </span>
        <h2 className="text-4xl font-bold text-gp-mint mb-2">{game.name}</h2>
        <p className="text-gp-mint/70 text-lg mb-8">{intro.tagline}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left">
          {intro.features.map((feature) => (
            <div
              key={feature.text}
              className="flex items-center gap-3 p-4 rounded-xl bg-gp-surface/40 border border-gp-accent/20"
            >
              <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
                {feature.icon}
              </span>
              {/* text-gp-mint/85 on gp-surface/40 background: passes WCAG AA ✓ */}
              <span className="text-gp-mint/85 text-sm">{feature.text}</span>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" onClick={onPlay}>
          ▶ Play {game.name}
        </Button>
        {!user && onSignIn && (
          <p className="text-gp-mint/40 text-xs mt-3">Sign in with Google to save your scores.</p>
        )}
      </div>
    </section>
  );
}
