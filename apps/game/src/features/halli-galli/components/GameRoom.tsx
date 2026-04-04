// Active game room for Halli Galli.
// Shows player cards, a flip button for the local player, and
// the central bell button. Uses the shadcn-style Progress component
// for the countdown timer bar.

import { useState, useEffect } from 'react';
import type { HgGameState, HgPlayer } from '../types';
import { FRUIT_EMOJI, FRUIT_NAME_KO, FRUITS, parseCard, calcFruitTotals } from '../data/cards';
import type { Fruit } from '../data/cards';
import { Button } from '@glowing-potato/ui';
import { Progress } from '../../../components/ui/progress';
import { useLeaderboard } from '../../../hooks/useLeaderboard';

const PLAY_SECONDS = 90;
const DECK_SIZE = 20;

interface GameRoomProps {
  game: HgGameState;
  onLeave: () => void;
  onRestart: () => void;
  onStartGame: () => void;
  onFlipCard: () => void;
  onRingBell: () => void;
  onSignOut?: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FruitCard({ code, size = 'md' }: { code: string | null; size?: 'sm' | 'md' | 'lg' }) {
  if (!code) {
    const dim =
      size === 'lg' ? 'w-24 h-32' : size === 'md' ? 'w-16 h-20' : 'w-10 h-14';
    return (
      <div
        className={`${dim} rounded-xl border-2 border-dashed border-gp-surface/40 flex items-center justify-center`}
      >
        <span className="text-gp-mint/20 text-xl">?</span>
      </div>
    );
  }
  const card = parseCard(code);
  if (!card) return null;
  const emoji = FRUIT_EMOJI[card.fruit];
  const dim =
    size === 'lg' ? 'w-24 h-32 text-3xl' : size === 'md' ? 'w-16 h-20 text-xl' : 'w-10 h-14 text-base';

  // Arrange fruit emoji in a grid
  const counts = Array.from({ length: card.count }, (_, i) => i);
  return (
    <div
      className={`${dim} rounded-xl border-2 border-gp-surface bg-gp-bg/80 flex flex-wrap items-center justify-center gap-0.5 p-1 shadow-lg`}
    >
      {counts.map((i) => (
        <span key={i} className="leading-none">
          {emoji}
        </span>
      ))}
    </div>
  );
}

function PlayerSlot({
  player,
  isLocal,
  onFlip,
  canFlip,
  highlighted,
}: {
  player: HgPlayer;
  isLocal: boolean;
  onFlip?: () => void;
  canFlip: boolean;
  highlighted: boolean;
}) {
  const cardCode = player.topCard;
  const remaining = DECK_SIZE - player.deckIndex;

  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
        highlighted
          ? 'bg-gp-accent/20 ring-2 ring-gp-accent'
          : 'bg-gp-surface/10'
      } ${!player.isInRoom ? 'opacity-40' : ''}`}
    >
      {/* Name + score */}
      <div className="text-center">
        <p className="text-gp-mint text-sm font-semibold truncate max-w-[6rem]">
          {isLocal ? `${player.name} (나)` : player.name}
        </p>
        <p className="text-gp-mint/60 text-xs">
          {player.score}점 &middot; {remaining}장 남음
        </p>
      </div>

      {/* Card display */}
      <FruitCard code={cardCode} size="md" />

      {/* Flip button (local player only) */}
      {isLocal && (
        <Button
          variant={canFlip ? 'primary' : 'ghost'}
          size="sm"
          disabled={!canFlip}
          onClick={onFlip}
          className="text-xs px-3 py-1"
        >
          {cardCode !== null
            ? '✋ 뒤집기 불가'
            : remaining === 0
            ? '카드 없음'
            : '🃏 뒤집기'}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fruit totals bar (shows current sums)
// ---------------------------------------------------------------------------

function FruitTotalsBar({ players }: { players: HgPlayer[] }) {
  const topCards = players.map((p) => p.topCard);
  const totals = calcFruitTotals(topCards);

  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {FRUITS.map((fruit) => {
        const count = totals[fruit];
        const isWinning = count === 5;
        return (
          <div
            key={fruit}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
              isWinning
                ? 'bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400 scale-110'
                : 'bg-gp-surface/20 text-gp-mint/70'
            }`}
          >
            <span>{FRUIT_EMOJI[fruit]}</span>
            <span>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bell result overlay
// ---------------------------------------------------------------------------

function BellOverlay({ game }: { game: HgGameState }) {
  const { bellResult, players } = game;
  if (!bellResult) return null;
  const ringer = players.find((p) => p.id === bellResult.playerId);
  const isLocalRinger = bellResult.playerId === game.localPlayerId;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
      <div
        className={`rounded-3xl px-8 py-6 text-center shadow-2xl animate-bounce ${
          bellResult.isCorrect ? 'bg-green-900/90 border border-green-400' : 'bg-red-900/90 border border-red-500'
        }`}
      >
        <div className="text-5xl mb-2">{bellResult.isCorrect ? '✅' : '❌'}</div>
        <p className="text-white font-bold text-xl">
          {bellResult.isCorrect ? '정답!' : '오답!'}
        </p>
        <p className="text-white/70 text-sm mt-1">
          {isLocalRinger ? '나' : ringer?.name ?? '?'} 가 벨을 눌렀어요
        </p>
        {bellResult.isCorrect && bellResult.fruit && (
          <p className="text-yellow-300 text-sm mt-1">
            {FRUIT_EMOJI[bellResult.fruit as Fruit]}{' '}
            {FRUIT_NAME_KO[bellResult.fruit as Fruit]} 5개!
          </p>
        )}
        <p className={`font-bold text-lg mt-2 ${bellResult.isCorrect ? 'text-green-300' : 'text-red-300'}`}>
          {bellResult.isCorrect ? '+1점' : '-1점'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard view
// ---------------------------------------------------------------------------

function LeaderboardView({ onClose }: { onClose: () => void }) {
  const { records, loading } = useLeaderboard(10, 'halli-galli');

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gp-bg border border-gp-surface rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-gp-mint font-bold text-lg">🏆 리더보드</h2>
          <button onClick={onClose} className="text-gp-mint/50 hover:text-gp-mint">✕</button>
        </div>
        {loading ? (
          <p className="text-gp-mint/50 text-center text-sm py-4">불러오는 중…</p>
        ) : records.length === 0 ? (
          <p className="text-gp-mint/50 text-center text-sm py-4">기록이 없어요.</p>
        ) : (
          <ol className="space-y-2">
            {records.map((r, i) => (
              <li
                key={r.userId}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gp-surface/20"
              >
                <span className="text-gp-mint/50 text-sm w-5 text-right">{i + 1}</span>
                <span className="text-gp-mint text-sm flex-1 truncate">
                  {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}
                  {r.displayName}
                </span>
                <span className="text-gp-mint font-bold text-sm">{r.score}승</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase: Waiting
// ---------------------------------------------------------------------------

function WaitingView({
  game,
  onStartGame,
  onLeave,
}: {
  game: HgGameState;
  onStartGame: () => void;
  onLeave: () => void;
}) {
  const activePlayers = game.players.filter((p) => p.isInRoom);
  const canStart = game.isHost && activePlayers.length >= 2;
  const roomCode = game.roomVisibility === 'private' ? game.roomId : null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6">
      <div className="text-center space-y-2">
        <p className="text-5xl">🔔</p>
        <h2 className="text-gp-mint font-bold text-2xl">{game.roomTitle}</h2>
        {roomCode && (
          <p className="text-gp-mint/60 text-sm font-mono bg-gp-surface/30 px-4 py-1 rounded-full inline-block">
            방 코드: <strong className="text-gp-mint tracking-widest">{roomCode}</strong>
          </p>
        )}
        <p className="text-gp-mint/50 text-sm">
          {activePlayers.length} / {game.maxPlayers} 명 참가 중
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: game.maxPlayers }, (_, i) => {
          const p = activePlayers[i];
          return (
            <div
              key={i}
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm ${
                p ? 'bg-gp-surface/40 text-gp-mint' : 'border-2 border-dashed border-gp-surface/30 text-gp-mint/20'
              }`}
            >
              {p ? (
                <>
                  <span className="text-2xl">😊</span>
                  <span className="text-xs truncate max-w-[4.5rem] text-center">{p.name}</span>
                </>
              ) : (
                <span className="text-xl">+</span>
              )}
            </div>
          );
        })}
      </div>

      {game.isHost ? (
        <div className="space-y-2 text-center">
          <Button
            variant="primary"
            size="sm"
            disabled={!canStart}
            onClick={onStartGame}
          >
            {canStart ? '🔔 게임 시작!' : `2명 이상 필요해요 (현재 ${activePlayers.length}명)`}
          </Button>
          {!canStart && activePlayers.length < 2 && (
            <p className="text-gp-mint/40 text-xs">다른 플레이어가 참가하길 기다리는 중…</p>
          )}
        </div>
      ) : (
        <p className="text-gp-mint/50 text-sm">호스트가 게임을 시작하길 기다리는 중…</p>
      )}

      <button onClick={onLeave} className="text-gp-mint/30 hover:text-gp-mint/60 text-xs transition-colors">
        방 나가기
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase: Playing
// ---------------------------------------------------------------------------

function PlayingView({
  game,
  onFlipCard,
  onRingBell,
  onLeave,
}: {
  game: HgGameState;
  onFlipCard: () => void;
  onRingBell: () => void;
  onLeave: () => void;
}) {
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId);
  const bellDisabled = !!game.bellRing; // bell already ringing
  const canFlip =
    !!localPlayer &&
    localPlayer.topCard === null &&
    localPlayer.deckIndex < DECK_SIZE &&
    !game.bellRing;

  const timerPct = (game.gameTimeLeft / PLAY_SECONDS) * 100;
  const timerClass =
    game.gameTimeLeft <= 10
      ? 'bg-red-400'
      : game.gameTimeLeft <= 30
      ? 'bg-yellow-400'
      : undefined;

  const activePlayers = game.players.filter((p) => p.isInRoom);

  return (
    <div className="flex flex-col flex-1 gap-4 p-4 relative">
      {/* Timer */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gp-mint/60">
          <span>남은 시간</span>
          <span className={game.gameTimeLeft <= 10 ? 'text-red-400 font-bold' : ''}>
            {game.gameTimeLeft}초
          </span>
        </div>
        <Progress
          value={timerPct}
          indicatorClassName={timerClass}
        />
      </div>

      {/* Fruit totals */}
      <FruitTotalsBar players={activePlayers} />

      {/* Player cards */}
      <div
        className={`grid gap-3 ${
          activePlayers.length <= 2
            ? 'grid-cols-2'
            : activePlayers.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {activePlayers.map((player) => (
          <PlayerSlot
            key={player.id}
            player={player}
            isLocal={player.id === game.localPlayerId}
            onFlip={onFlipCard}
            canFlip={canFlip && player.id === game.localPlayerId}
            highlighted={!!game.bellResult && game.bellResult.playerId === player.id}
          />
        ))}
      </div>

      {/* Bell button */}
      <div className="flex flex-col items-center gap-2 mt-auto py-4">
        <button
          disabled={bellDisabled}
          onClick={onRingBell}
          className={`w-32 h-32 rounded-full text-6xl transition-all shadow-xl active:scale-95 font-bold
            ${
              bellDisabled
                ? 'bg-gp-surface/20 cursor-not-allowed opacity-50'
                : 'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-yellow-900 hover:scale-105 shadow-yellow-400/30'
            }`}
          aria-label="벨 울리기"
        >
          🔔
        </button>
        <p className="text-gp-mint/40 text-xs">
          {bellDisabled ? '잠깐 기다려요…' : '과일이 5개면 벨을 눌러요!'}
        </p>
      </div>

      {/* Leave button */}
      <button
        onClick={onLeave}
        className="absolute top-2 right-3 text-gp-mint/20 hover:text-gp-mint/50 text-xs transition-colors"
      >
        나가기
      </button>

      {/* Bell result overlay */}
      <BellOverlay game={game} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase: Finished
// ---------------------------------------------------------------------------

function FinishedView({
  game,
  onRestart,
  onLeave,
}: {
  game: HgGameState;
  onRestart: () => void;
  onLeave: () => void;
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const winner = game.players.find((p) => p.id === game.winnerId);
  const isLocalWinner = game.winnerId === game.localPlayerId;

  const sorted = [...game.players].sort((a, b) => b.score - a.score);

  // Players who re-joined after restart
  const returningCount = game.players.filter((p) => p.isInRoom).length;

  return (
    <div className="flex flex-col items-center flex-1 gap-6 p-6">
      <div className="text-center space-y-2">
        <p className="text-6xl">{isLocalWinner ? '🏆' : '🎮'}</p>
        {winner ? (
          <>
            <h2 className="text-gp-mint font-bold text-xl">
              {isLocalWinner ? '🎉 축하해요! 승리!' : `${winner.name} 승리!`}
            </h2>
            <p className="text-gp-mint/60 text-sm">
              {winner.score}번의 정답 벨
            </p>
          </>
        ) : (
          <h2 className="text-gp-mint font-bold text-xl">무승부!</h2>
        )}
      </div>

      {/* Rankings */}
      <div className="w-full max-w-xs space-y-2">
        <h3 className="text-gp-mint/60 text-xs font-semibold uppercase tracking-widest text-center">
          최종 순위
        </h3>
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
              p.id === game.winnerId
                ? 'bg-yellow-400/10 border border-yellow-400/30'
                : 'bg-gp-surface/20'
            }`}
          >
            <span className="text-lg">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span className="text-gp-mint flex-1 text-sm">
              {p.id === game.localPlayerId ? `${p.name} (나)` : p.name}
            </span>
            <span className="text-gp-mint font-bold text-sm">{p.score}점</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 items-center w-full max-w-xs">
        <Button variant="primary" size="sm" onClick={onRestart} className="w-full">
          🔄 다시 하기 ({returningCount}/{game.players.length}명 준비)
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowLeaderboard(true)} className="w-full">
          🏆 리더보드 보기
        </Button>
        <button onClick={onLeave} className="text-gp-mint/30 hover:text-gp-mint/60 text-xs transition-colors">
          로비로 돌아가기
        </button>
      </div>

      {showLeaderboard && <LeaderboardView onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main GameRoom component
// ---------------------------------------------------------------------------

export function GameRoom({
  game,
  onLeave,
  onRestart,
  onStartGame,
  onFlipCard,
  onRingBell,
  onSignOut,
}: GameRoomProps) {
  // Restart: when all players have re-joined, host auto-starts
  useEffect(() => {
    if (game.phase !== 'finished') return;
    if (!game.isHost) return;
    const active = game.players.filter((p) => p.isInRoom);
    if (active.length >= 2 && active.length === game.players.length) {
      onStartGame();
    }
  }, [game, onStartGame]);

  return (
    <div className="min-h-screen bg-gp-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gp-surface/50 shrink-0">
        <span className="text-gp-mint font-bold text-base">🔔 할리갈리</span>
        <span className="text-gp-mint/50 text-xs">
          {game.roomTitle}
          {game.roomVisibility === 'private' && (
            <span className="ml-2 font-mono text-gp-mint/30">#{game.roomId}</span>
          )}
        </span>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="text-gp-mint/30 hover:text-gp-mint/60 text-xs transition-colors"
          >
            로그아웃
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {game.phase === 'waiting' && (
          <WaitingView game={game} onStartGame={onStartGame} onLeave={onLeave} />
        )}
        {game.phase === 'playing' && (
          <PlayingView
            game={game}
            onFlipCard={onFlipCard}
            onRingBell={onRingBell}
            onLeave={onLeave}
          />
        )}
        {game.phase === 'finished' && (
          <FinishedView game={game} onRestart={onRestart} onLeave={onLeave} />
        )}
      </div>
    </div>
  );
}
