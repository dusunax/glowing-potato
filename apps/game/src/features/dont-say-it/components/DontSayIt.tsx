// Top-level component for the "Don't Say It" mini-game.
// Routes between the room lobby and an active game room.

import { useDontSayIt } from '../hooks/useDontSayIt';
import { RoomLobby } from './RoomLobby';
import { GameRoom } from './GameRoom';
import { Button } from '@glowing-potato/ui';

interface DontSayItProps {
  onBack: () => void;
  nickname?: string;
  isLoggedIn?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onUpdateNickname?: (nickname: string) => Promise<'success' | 'error'>;
}

export function DontSayIt({ onBack, nickname, isLoggedIn, onSignIn, onSignOut, onUpdateNickname }: DontSayItProps) {
  const {
    rooms,
    createRoom,
    joinRoom,
    joinPrivateRoom,
    leaveRoom,
    game,
    sendMessage,
    startGame,
    castVote,
    sttSupported,
    sttActive,
    sttError,
    toggleStt,
    sttInterim,
  } = useDontSayIt();

  async function handleSignOut() {
    if (game) await leaveRoom();
    onSignOut?.();
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gp-bg p-6">
        <div className="text-center space-y-2">
          <p className="text-4xl">🔒</p>
          <p className="text-gp-mint font-semibold text-lg">로그인이 필요합니다</p>
          <p className="text-gp-mint/50 text-sm">Don't Say It을 플레이하려면 로그인해주세요.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>← 뒤로</Button>
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
        onSendMessage={sendMessage}
        onStartGame={startGame}
        onCastVote={castVote}
        sttSupported={sttSupported}
        sttActive={sttActive}
        sttError={sttError}
        onToggleStt={toggleStt}
        sttInterim={sttInterim}
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
