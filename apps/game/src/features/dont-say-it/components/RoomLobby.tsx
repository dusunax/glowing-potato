// Room lobby for "Don't Say It". Shows public/private rooms, create-room form,
// and join-by-ID form for private rooms.

import { useState, useEffect, useRef } from 'react';
import type { DsiRoomSummary, RoomVisibility } from '../types';
import { Button, Card, CardHeader, CardBody, CardTitle, CardDescription } from '@glowing-potato/ui';

interface RoomLobbyProps {
  rooms: DsiRoomSummary[];
  onJoinRoom: (roomId: string, playerName: string) => void;
  onJoinPrivate: (roomId: string, playerName: string) => 'ok' | 'not-found' | 'full';
  onCreateRoom: (title: string, visibility: RoomVisibility, maxPlayers: number, playerName: string) => void;
  onBack: () => void;
}

export function RoomLobby({ rooms, onJoinRoom, onJoinPrivate, onCreateRoom, onBack }: RoomLobbyProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState<RoomVisibility>('public');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === 'undefined') return 'You';
    return localStorage.getItem('dsi-player-name') || 'You';
  });
  const [draftPlayerName, setDraftPlayerName] = useState(playerName);
  const [privateId, setPrivateId] = useState('');
  const [privateError, setPrivateError] = useState('');

  const createTitleRef = useRef<HTMLInputElement | null>(null);
  const joinPrivateInputRef = useRef<HTMLInputElement | null>(null);
  const nicknameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showCreate) {
      createTitleRef.current?.focus();
    }
  }, [showCreate]);

  useEffect(() => {
    if (showJoinPrivate) {
      joinPrivateInputRef.current?.focus();
    }
  }, [showJoinPrivate]);

  useEffect(() => {
    if (showNicknamePopup) {
      nicknameInputRef.current?.focus();
    }
  }, [showNicknamePopup]);

  useEffect(() => {
    if (showNicknamePopup) {
      setDraftPlayerName(playerName);
    }
  }, [showNicknamePopup, playerName]);

  function handleCreate() {
    const title = newTitle.trim() || 'My Room';
    onCreateRoom(title, newVisibility, maxPlayers, playerName);
    setShowCreate(false);
    setNewTitle('');
    setNewVisibility('public');
    setMaxPlayers(4);
  }

  function closeCreateRoom() {
    setShowCreate(false);
    setNewTitle('');
    setNewVisibility('public');
    setMaxPlayers(4);
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const trimmed = playerName.trim();
      const nextName = trimmed.length > 0 ? trimmed : 'You';
      localStorage.setItem('dsi-player-name', nextName);
    }
  }, [playerName]);

  function handleJoinPrivate() {
    const result = onJoinPrivate(privateId.trim(), playerName);
    if (result === 'not-found') {
      setPrivateError('Room not found. Check the room ID and try again.');
    } else if (result === 'full') {
      setPrivateError('Room is full.');
    } else {
      setShowJoinPrivate(false);
      setPrivateId('');
      setPrivateError('');
    }
  }

  function closeJoinPrivate() {
    setShowJoinPrivate(false);
    setPrivateId('');
    setPrivateError('');
  }

  function closeNicknamePopup() {
    setShowNicknamePopup(false);
  }

  function saveNickname() {
    const nextName = draftPlayerName.trim() || 'You';
    setPlayerName(nextName);
    setShowNicknamePopup(false);
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gp-bg">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Lobby
          </Button>
          <button
            type="button"
            onClick={() => setShowNicknamePopup(true)}
            aria-label="닉네임 설정"
            className="w-8 h-8 rounded-full border border-gp-accent/30 text-gp-mint/70 hover:text-gp-mint hover:border-gp-accent/60 hover:bg-gp-accent/10 flex items-center justify-center transition-colors"
            title={`Nickname: ${playerName || 'You'}`}
          >
            ✎
          </button>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-gp-accent uppercase mb-1">
            Mini-Game
          </p>
          <h1 className="text-4xl font-bold text-gp-mint tracking-tight">🤐 Don't Say It</h1>
          <p className="text-gp-accent mt-2 text-sm max-w-md mx-auto">
            Each player has 1 secret forbidden word. Say it and you're out! Last one standing wins.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="primary" size="md" onClick={() => { setShowCreate(true); setShowJoinPrivate(false); }}>
            ＋ Create Room
          </Button>
          <Button variant="outline" size="md" onClick={() => { setShowJoinPrivate(true); setShowCreate(false); }}>
            🔒 Join Private Room
          </Button>
        </div>

        {showNicknamePopup && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
            onClick={closeNicknamePopup}
          >
            <Card className="w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-gp-mint font-semibold text-base">Nickname</h2>
                <button
                  type="button"
                  onClick={closeNicknamePopup}
                  className="text-gp-mint/70 hover:text-gp-mint text-lg leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <label className="block text-xs text-gp-mint/70 mb-1">Your Nickname</label>
                <input
                  type="text"
                  value={draftPlayerName}
                  ref={nicknameInputRef}
                  onChange={(e) => setDraftPlayerName(e.target.value)}
                  placeholder="You"
                  maxLength={18}
                  className="w-full bg-gp-bg border border-gp-accent/40 rounded-lg px-3 py-2 text-sm text-gp-mint placeholder:text-gp-mint/30 focus:outline-none focus:ring-2 focus:ring-gp-mint/40"
                  onKeyDown={(e) => e.key === 'Enter' && saveNickname()}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={closeNicknamePopup}>Close</Button>
                <Button variant="primary" size="sm" onClick={saveNickname}>Save</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Create room panel */}
        {/* Create room panel */}
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
            onClick={closeCreateRoom}
          >
            <Card className="w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-gp-mint font-semibold text-base">New Room</h2>
                <button
                  type="button"
                  onClick={closeCreateRoom}
                  className="text-gp-mint/70 hover:text-gp-mint text-lg leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gp-mint/70 mb-1">Room Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    ref={createTitleRef}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Game Night 🎉"
                    maxLength={40}
                    className="w-full bg-gp-bg border border-gp-accent/40 rounded-lg px-3 py-2 text-sm text-gp-mint placeholder:text-gp-mint/30 focus:outline-none focus:ring-2 focus:ring-gp-mint/40"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gp-mint/70 mb-2">Visibility</label>
                  <div className="flex gap-3">
                    {(['public', 'private'] as RoomVisibility[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setNewVisibility(v)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          newVisibility === v
                            ? 'bg-gp-accent/20 border-gp-accent text-gp-mint'
                            : 'bg-transparent border-gp-accent/30 text-gp-mint/60 hover:border-gp-accent/60'
                        }`}
                      >
                        {v === 'public' ? '🌐 Public' : '🔒 Private'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gp-mint/70 mb-2">Room Size (2~4)</label>
                  <div className="flex gap-3">
                    {[2, 3, 4].map((size) => (
                      <button
                        key={size}
                        onClick={() => setMaxPlayers(size)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          maxPlayers === size
                            ? 'bg-gp-accent/20 border-gp-accent text-gp-mint'
                            : 'bg-transparent border-gp-accent/30 text-gp-mint/60 hover:border-gp-accent/60'
                        }`}
                      >
                        {size} Players
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={closeCreateRoom}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleCreate}>Create</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Join private room panel */}
        {showJoinPrivate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
            onClick={closeJoinPrivate}
          >
            <Card className="w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-gp-mint font-semibold text-base">Join Private Room</h2>
                <button
                  type="button"
                  onClick={closeJoinPrivate}
                  className="text-gp-mint/70 hover:text-gp-mint text-lg leading-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gp-mint/70 mb-1">Room ID</label>
                  <input
                    type="text"
                    value={privateId}
                    ref={joinPrivateInputRef}
                    onChange={(e) => { setPrivateId(e.target.value.toUpperCase()); setPrivateError(''); }}
                    placeholder="e.g. ABC123"
                    maxLength={6}
                    className="w-full bg-gp-bg border border-gp-accent/40 rounded-lg px-3 py-2 text-sm text-gp-mint placeholder:text-gp-mint/30 focus:outline-none focus:ring-2 focus:ring-gp-mint/40 tracking-widest uppercase"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinPrivate()}
                  />
                  {privateError && (
                    <p className="text-red-400 text-xs mt-1">{privateError}</p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={closeJoinPrivate}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleJoinPrivate} disabled={privateId.length < 4}>
                    Join
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Room list */}
        <div>
          <h2 className="text-xs font-semibold text-gp-accent uppercase tracking-widest mb-3">
            Public Rooms
          </h2>
          {rooms.filter((r) => r.visibility === 'public').length === 0 ? (
            <p className="text-gp-mint/40 text-sm text-center py-6">No public rooms yet. Create one!</p>
          ) : (
            <div className="space-y-2">
              {rooms.filter((r) => r.visibility === 'public').map((room) => (
            <RoomRow key={room.id} room={room} onJoin={() => onJoinRoom(room.id, playerName)} />
              ))}
            </div>
          )}
        </div>

        {/* How to play */}
        <Card accent>
          <CardHeader>
            <CardTitle className="text-base">How to Play</CardTitle>
          </CardHeader>
          <CardBody>
            <CardDescription className="space-y-1 leading-relaxed">
              <span className="block">1. Join or create a room (2–4 players).</span>
              <span className="block">2. Each player is secretly assigned 1 forbidden word — you can't see your own!</span>
              <span className="block">3. Vote for which word others get during the 10-second window.</span>
              <span className="block">4. Chat and talk — but don't say your forbidden words!</span>
              <span className="block">5. Say a forbidden word and you're <strong className="text-red-400">OUT</strong>. Last one standing wins! 🏆</span>
            </CardDescription>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// --- Sub-component ---

interface RoomRowProps {
  room: DsiRoomSummary;
  onJoin: () => void;
}

function RoomRow({ room, onJoin }: RoomRowProps) {
  const full = room.playerCount >= room.maxPlayers;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gp-surface/50 border border-gp-accent/20 hover:border-gp-accent/50 transition-colors">
      <span className="text-xl">{room.visibility === 'public' ? '🌐' : '🔒'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-gp-mint text-sm font-medium truncate">{room.title}</div>
        <div className="text-gp-mint/50 text-xs">{room.playerCount}/{room.maxPlayers} players</div>
      </div>
      <Button
        variant={full ? 'ghost' : 'secondary'}
        size="sm"
        onClick={onJoin}
        disabled={full}
      >
        {full ? 'Full' : 'Join'}
      </Button>
    </div>
  );
}
