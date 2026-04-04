// Top-level component for the Halli Galli mini-game.
// Routes between the room lobby and an active game room,
// and shows a login prompt when the user is not authenticated.

import { useHalliGalli } from '../hooks/useHalliGalli';
import { RoomLobby } from './RoomLobby';
import { GameRoom } from './GameRoom';
import { Button } from '@glowing-potato/ui';

interface HalliGalliProps {
  onBack: () => void;
  nickname?: string;
  isLoggedIn?: boolean;
  currentUserId?: string | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onUpdateNickname?: (nickname: string) => Promise<'success' | 'error'>;
}

export function HalliGalli({
  onBack,
  nickname,
  isLoggedIn,
  currentUserId,
  onSignIn,
  onSignOut,
  onUpdateNickname,
}: HalliGalliProps) {
  const {
    rooms,
    game,
    createRoom,
    joinRoom,
    joinPrivateRoom,
    leaveRoom,
    startGame,
    flipCard,
    ringBell,
    restartGame,
  } = useHalliGalli(currentUserId ?? null);

  async function handleSignOut() {
    if (game) await leaveRoom();
    onSignOut?.();
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gp-bg p-6">
        <div className="text-center space-y-2">
          <p className="text-5xl">🔔</p>
          <p className="text-gp-mint font-semibold text-lg">로그인이 필요해요</p>
          <p className="text-gp-mint/50 text-sm">할리갈리를 플레이하려면 로그인하세요.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>← 돌아가기</Button>
          {onSignIn && (
            <Button variant="primary" size="sm" onClick={onSignIn}>Google로 로그인</Button>
          )}
        </div>
      </div>
    );
  }

  if (game) {
    return (
      <GameRoom
        game={game}
        onLeave={leaveRoom}
        onRestart={restartGame}
        onStartGame={startGame}
        onFlipCard={flipCard}
        onRingBell={ringBell}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <RoomLobby
      rooms={rooms}
      onJoinRoom={joinRoom}
      onJoinPrivate={joinPrivateRoom}
      onCreateRoom={createRoom}
      onBack={onBack}
      nickname={nickname}
      onSignOut={handleSignOut}
      onUpdateNickname={onUpdateNickname}
    />
  );
}
