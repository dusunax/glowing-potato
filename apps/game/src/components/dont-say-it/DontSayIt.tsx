// Top-level component for the "Don't Say It" mini-game.
// Routes between the room lobby and an active game room.

import { useDontSayIt } from '../../hooks/useDontSayIt';
import { RoomLobby } from './RoomLobby';
import { GameRoom } from './GameRoom';

interface DontSayItProps {
  onBack: () => void;
}

export function DontSayIt({ onBack }: DontSayItProps) {
  const {
    rooms,
    createRoom,
    joinRoom,
    joinPrivateRoom,
    leaveRoom,
    game,
    sendMessage,
    castVote,
    sttSupported,
    sttActive,
    toggleStt,
    sttInterim,
  } = useDontSayIt();

  if (game) {
    return (
      <GameRoom
        game={game}
        onLeave={leaveRoom}
        onSendMessage={sendMessage}
        onCastVote={castVote}
        sttSupported={sttSupported}
        sttActive={sttActive}
        onToggleStt={toggleStt}
        sttInterim={sttInterim}
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
    />
  );
}
