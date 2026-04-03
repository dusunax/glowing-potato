// In-room view for "Don't Say It".
// Handles: waiting, voting (word selection + countdown), playing (chat + STT),
// and finished (winner announcement) phases.

import { useState, useRef, useEffect } from 'react';
import type { DsiGameState, DsiPlayer, DsiChatMessage } from '../types';
import { Button } from '@glowing-potato/ui';

interface GameRoomProps {
  game: DsiGameState;
  onLeave: () => void;
  onSendMessage: (text: string) => void;
  onStartGame: () => void;
  onCastVote: (targetPlayerId: string, slotIndex: number, wordIndex: number, previousWordIndex?: number) => void;
  sttSupported: boolean;
  sttActive: boolean;
  sttError: string | null;
  onToggleStt: () => void;
  sttInterim: string;
  onSignOut?: () => void;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  cameraEnabled: boolean;
  cameraError: string | null;
  onToggleCamera: () => Promise<void>;
}

export function GameRoom({
  game,
  onLeave,
  onSendMessage,
  onStartGame,
  onCastVote,
  sttSupported,
  sttActive,
  sttError,
  onToggleStt,
  sttInterim,
  onSignOut,
  localStream,
  remoteStreams,
  cameraEnabled,
  cameraError,
  onToggleCamera,
}: GameRoomProps) {
  const privateRoomCode = game.roomVisibility === 'private' ? game.roomId : null;
  const [copied, setCopied] = useState(false);
  const [showReplayModal, setShowReplayModal] = useState(false);

  function handleCopyRoomCode() {
    if (!privateRoomCode) return;
    navigator.clipboard.writeText(privateRoomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => {
      window.alert(`Room code: ${privateRoomCode}`);
    });
  }

  return (
    <div className="h-screen min-h-screen max-h-screen flex flex-col overflow-hidden bg-gp-bg">
      <>
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gp-accent/20 bg-gp-surface/30">
          {game.phase !== 'playing' && (
            <Button variant="ghost" size="sm" onClick={onLeave}>← Leave</Button>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-gp-mint font-semibold text-sm truncate block">{game.roomTitle}</span>
          </div>
          <span className="text-gp-mint/60 text-xs">
            {game.roomVisibility === 'private' ? `🔒 ${game.roomId}` : `🌐 Room #${game.roomId}`}
          </span>
          {privateRoomCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyRoomCode}
              title="Copy private room code"
              className="h-7 px-3 gap-1 border-gp-mint/50 text-gp-mint hover:bg-gp-accent/20"
            >
              📋 {copied ? 'Copied!' : 'Copy room code'}
            </Button>
          )}
          {/* Camera toggle */}
          <button
            type="button"
            onClick={onToggleCamera}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            className={`px-2 py-1.5 rounded-lg border transition-colors text-xs ${
              cameraEnabled
                ? 'border-gp-accent bg-gp-accent/20 text-gp-mint'
                : 'border-gp-accent/20 text-gp-mint/50 hover:text-gp-mint/80 hover:border-gp-accent/40'
            }`}
          >
            {cameraEnabled ? '📹' : '📷'}
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="px-2 py-1.5 rounded-lg border border-gp-accent/20 text-gp-mint/50 hover:text-gp-mint/80 hover:border-gp-accent/40 transition-colors text-xs"
            >
              Sign out
            </button>
          )}
        </header>

        {/* Camera error */}
        {cameraError && (
          <div className="px-4 py-1.5 bg-red-900/30 border-b border-red-800/40 text-red-300 text-xs">
            {cameraError}
          </div>
        )}

        {/* Camera strip – shown whenever at least one participant has a stream */}
        {(localStream || remoteStreams.size > 0) && (
          <CameraStrip
            game={game}
            localStream={localStream}
            remoteStreams={remoteStreams}
          />
        )}

        {/* Phase views */}
        {game.phase === 'waiting' && <WaitingView game={game} onStartGame={onStartGame} />}
        {game.phase === 'voting' && <VotingView game={game} onCastVote={onCastVote} />}
        {game.phase === 'playing' && (
          <PlayingView
            game={game}
            onSendMessage={onSendMessage}
            sttSupported={sttSupported}
            sttActive={sttActive}
            sttError={sttError}
            onToggleStt={onToggleStt}
            sttInterim={sttInterim}
            onLeave={onLeave}
          />
        )}
        {game.phase === 'finished' && (
          <FinishedView game={game} onLeave={onLeave} onShowReplay={() => setShowReplayModal(true)} />
        )}
      </>
      {game.phase === 'finished' && showReplayModal && (
        <ChatReplayPage game={game} onClose={() => setShowReplayModal(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Camera strip
// ---------------------------------------------------------------------------

interface CameraStripProps {
  game: DsiGameState;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
}

function CameraStrip({ game, localStream, remoteStreams }: CameraStripProps) {
  return (
    <div
      className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-gp-accent/20 bg-gp-bg/60 gp-scrollbar"
      role="region"
      aria-label="Camera feeds"
      tabIndex={0}
    >
      {localStream && (
        <VideoTile
          stream={localStream}
          label="You"
          mirrored
        />
      )}
      {game.players
        .filter((p) => p.id !== game.localPlayerId && remoteStreams.has(p.id))
        .map((p) => (
          <VideoTile
            key={p.id}
            stream={remoteStreams.get(p.id)!}
            label={p.name}
          />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video tile
// ---------------------------------------------------------------------------

interface VideoTileProps {
  stream: MediaStream;
  label: string;
  mirrored?: boolean;
}

function VideoTile({ stream, label, mirrored = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative flex-shrink-0 w-24 h-[72px] rounded-lg overflow-hidden bg-gp-surface/40 border border-gp-accent/20">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label={`${label}'s camera`}
        className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
      />
      <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] text-white/80 bg-black/40 truncate px-1">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waiting view
// ---------------------------------------------------------------------------

function WaitingView({ game, onStartGame }: { game: DsiGameState; onStartGame: () => void }) {
  const isHost = game.isHost;
  const canStart = isHost && game.players.length >= 2;
  const maxPlayers = game.maxPlayers || 4;

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col items-center justify-center gap-6 p-6 overflow-y-auto gp-scrollbar">
      <div className="text-5xl animate-pulse">⏳</div>
      <div className="text-center">
        <p className="text-gp-mint font-semibold text-lg">Waiting for players…</p>
        <p className="text-gp-mint/50 text-sm mt-1">
          {game.players.length} / {maxPlayers} — need at least 2 to start
        </p>
      </div>
      {isHost && (
        <Button
          variant={canStart ? 'primary' : 'secondary'}
          size="md"
          onClick={onStartGame}
          disabled={!canStart}
        >
          {canStart ? '▶ Start Game' : 'Need at least 2 players'}
        </Button>
      )}
      {!isHost && <p className="text-gp-mint/50 text-xs">Waiting for the host to start.</p>}
      {/* Player list */}
      <div className="w-full max-w-xs space-y-2">
        {game.players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gp-surface/50 border border-gp-accent/20">
            <span className="text-lg">{p.isBot ? '🤖' : '👤'}</span>
            <span className="text-gp-mint text-sm font-medium flex-1">
              {p.id === game.localPlayerId ? `${p.name} (you)` : p.name}
            </span>
            {game.isHost && p.id === game.localPlayerId && (
              <span className="text-sm" title="Room creator">
                👑
              </span>
            )}
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, maxPlayers - game.players.length) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gp-surface/20 border border-dashed border-gp-accent/20">
            <span className="text-lg opacity-30">👤</span>
            <span className="text-gp-mint/30 text-sm">Waiting for player…</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voting view
// ---------------------------------------------------------------------------

interface VotingViewProps {
  game: DsiGameState;
  onCastVote: (targetPlayerId: string, slotIndex: number, wordIndex: number, previousWordIndex?: number) => void;
}

function VotingView({ game, onCastVote }: VotingViewProps) {
  // Track which (player, slot, word) this local player has voted for
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});

  function voteKey(playerId: string, slotIdx: number) {
    return `${playerId}-${slotIdx}`;
  }

  function handleVote(player: DsiPlayer, slotIdx: number, wordIdx: number) {
    if (player.id === game.localPlayerId) return; // can't vote on own words
    const key = voteKey(player.id, slotIdx);
    const previous = myVotes[key];
    if (previous === wordIdx) return; // same choice no-op
    setMyVotes((prev) => ({ ...prev, [key]: wordIdx }));
    onCastVote(player.id, slotIdx, wordIdx, previous);
  }

  const otherPlayers = game.players.filter((p) => p.id !== game.localPlayerId);
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId)!;

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto p-4 space-y-5 gp-scrollbar">
      {/* Countdown */}
      <div className="text-center py-2">
        <p className="text-gp-mint/70 text-xs uppercase tracking-widest mb-1">Voting closes in</p>
        <p className="text-4xl font-bold text-yellow-400">{game.votingTimeLeft}s</p>
        <p className="text-gp-mint/50 text-xs mt-1">
          Vote for each opponent's single forbidden word.
        </p>
      </div>

      {/* Your own words (hidden) */}
      <div className="bg-gp-surface/30 border border-gp-accent/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">👤</span>
          <span className="text-gp-mint font-semibold text-sm">You (your words are hidden)</span>
        </div>
        <div className="flex gap-2">
          {localPlayer.wordSlots.map((slot, si) => (
            <div key={si} className="flex-1 rounded-lg bg-gp-bg/60 border border-gp-accent/20 p-2 text-center">
              <span className="text-gp-mint/30 text-sm">🔒</span>
              {/* Show vote dots for transparency */}
              <VoteDots votes={slot.votesByWord} />
            </div>
          ))}
        </div>
      </div>

      {/* Other players */}
      {otherPlayers.map((player) => (
        <div key={player.id} className="bg-gp-surface/50 border border-gp-accent/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{player.isBot ? '🤖' : '👤'}</span>
            <span className="text-gp-mint font-semibold text-sm">{player.name}</span>
            <span className="text-gp-mint/40 text-xs ml-auto">vote for their words</span>
          </div>
          <div className="space-y-3">
            {player.wordSlots.map((slot, si) => (
              <div key={si}>
                <p className="text-gp-mint/40 text-xs mb-1">Forbidden word</p>
                <div className="flex gap-2">
                  {slot.candidates.map((word, wi) => {
                    const key = voteKey(player.id, si);
                    const isMyVote = myVotes[key] === wi;
                    const totalVotes = slot.votesByWord.reduce((a, b) => a + b, 0);
                    const votePct = totalVotes > 0 ? Math.round((slot.votesByWord[wi] / totalVotes) * 100) : 0;
                    return (
                  <button
                    key={wi}
                    onClick={() => handleVote(player, si, wi)}
                    className={`flex-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                      isMyVote
                        ? 'bg-gp-accent/30 border-gp-accent text-gp-mint'
                        : 'bg-gp-bg/50 border-gp-accent/20 text-gp-mint/70 hover:border-gp-accent/50 hover:text-gp-mint'
                    }`}
                  >
                    <span className="block capitalize">{word}</span>
                        <VoteDots votes={slot.votesByWord} highlightIndex={wi} />
                        {totalVotes > 0 && (
                          <span className="block text-gp-mint/40 text-[10px] mt-0.5">{votePct}%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Render vote count as small dots (max 8 shown). */
function VoteDots({ votes, highlightIndex }: { votes: number[]; highlightIndex?: number }) {
  const total = votes.reduce((a, b) => a + b, 0);
  if (total === 0) return <span className="block h-2" />;
  const display = Math.min(total, 8);
  return (
    <span className="flex justify-center gap-0.5 mt-1 h-2">
      {Array.from({ length: display }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            highlightIndex !== undefined ? 'bg-gp-accent' : 'bg-gp-mint/40'
          }`}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Playing view
// ---------------------------------------------------------------------------

interface PlayingViewProps {
  game: DsiGameState;
  onSendMessage: (text: string) => void;
  sttSupported: boolean;
  sttActive: boolean;
  sttError: string | null;
  onToggleStt: () => void;
  sttInterim: string;
  onLeave: () => void;
}

function PlayingView({
  game,
  onSendMessage,
  sttSupported,
  sttActive,
  sttError,
  onToggleStt,
  sttInterim,
  onLeave,
}: PlayingViewProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId)!;
  const isOut = localPlayer.isOut;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [game.messages, sttInterim]);

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
  }

  function handleQuit() {
    setShowQuitConfirm(true);
  }

  function confirmQuit() {
    onLeave();
  }

  const activePlrs = game.players.filter((p) => !p.isOut);

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      {/* Players bar */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gp-accent/20 bg-gp-surface/20">
        {game.players.map((p) => (
          <PlayerChip key={p.id} player={p} isLocal={p.id === game.localPlayerId} />
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-gp-accent/20 bg-gp-surface/20">
            <div className="text-center">
              <p className="text-gp-mint/50 text-[10px] uppercase tracking-widest">Time left</p>
              <p className="text-2xl font-bold text-gp-mint">{game.gameTimeLeft}s</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-10 gp-scrollbar">
            {game.messages.length === 0 && (
              <p className="text-gp-mint/30 text-xs text-center pt-8">
                Game started! Chat freely — but don't say your forbidden words!
              </p>
            )}
            {game.messages.map((msg) => {
              const isLocal = msg.playerId === game.localPlayerId;
              return (
                <div key={msg.id} className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'}`}>
                  <span className="text-gp-mint/50 text-[10px] px-1 mb-0.5">{msg.playerName}</span>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm max-w-[75%] break-words ${
                      msg.triggeredWord
                        ? 'bg-red-900/50 border border-red-500/50 text-red-200'
                        : isLocal
                        ? 'bg-gp-accent/30 text-gp-mint'
                        : 'bg-gp-surface text-gp-mint/90'
                    }`}
                  >
                    {msg.triggeredWord
                      ? highlightWord(msg.text, msg.triggeredWord)
                      : msg.text}
                  </div>
                  {msg.triggeredWord && (
                    <span className="text-red-400 text-xs mt-0.5 px-1">
                      ❌ Said &ldquo;{msg.triggeredWord}&rdquo; — OUT!
                    </span>
                  )}
                </div>
              );
            })}
            {sttInterim && (
              <div className="flex flex-col items-end">
                <span className="text-gp-mint/30 text-[10px] px-1 mb-0.5">You (speaking…)</span>
                <div className="px-3 py-1.5 rounded-xl text-sm bg-gp-surface/40 text-gp-mint/50 italic max-w-[75%]">
                  {sttInterim}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gp-accent/20 bg-gp-bg">
            {isOut ? (
              <div className="text-center text-red-400 text-sm py-2">
                ❌ You're out! Watch how the others do.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sttError && (
                  <p className="text-red-400 text-xs px-1">{sttError}</p>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type carefully…"
                    className="flex-1 bg-gp-surface/40 border border-gp-accent/30 rounded-lg px-3 py-2 text-sm text-gp-mint placeholder:text-gp-mint/30 focus:outline-none focus:ring-2 focus:ring-gp-mint/40"
                  />
                  {sttSupported && (
                    <Button
                      variant={sttActive ? 'destructive' : 'secondary'}
                      size="icon"
                      onClick={onToggleStt}
                      title={sttActive ? 'Stop speech recognition' : 'Start speech recognition'}
                      className="flex-shrink-0"
                    >
                      {sttActive ? '🎙️' : '🎤'}
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={handleSend} disabled={!inputText.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="h-4 shrink-0" aria-hidden="true" />
        </div>

        {/* Sidebar: forbidden words of OTHER players */}
        <aside className="hidden md:flex flex-col w-48 border-l border-gp-accent/20 bg-gp-surface/10 overflow-y-auto p-3 gap-3 gp-scrollbar">
          <p className="text-gp-accent text-[10px] uppercase tracking-widest">Others' words</p>
          {game.players
            .filter((p) => p.id !== game.localPlayerId)
            .map((p) => (
              <PlayerWordCard key={p.id} player={p} />
            ))}
          <p className="text-gp-mint/30 text-[10px] mt-2">
            Your own words are hidden. Don't say them!
          </p>
          <div className="mt-auto space-y-2">
            <div className="text-center">
              <p className="text-gp-mint/50 text-[10px]">Active</p>
              <p className="text-gp-mint font-bold text-xl">{activePlrs.length}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleQuit} className="w-full">
              Quit
            </Button>
          </div>
        </aside>
      </div>

      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" onClick={() => setShowQuitConfirm(false)}>
          <div
            className="w-full max-w-sm rounded-xl border border-gp-accent/30 bg-gp-surface p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-gp-mint font-semibold mb-2">Leave game?</h3>
            <p className="text-gp-mint/70 text-sm mb-4">Are you sure you want to quit this game?</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuitConfirm(false)}
                className="border-gp-mint/70 text-gp-mint hover:bg-gp-mint/10"
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmQuit}>
                Quit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Highlight a specific word in a message string. */
function highlightWord(text: string, word: string) {
  const parts = text.split(new RegExp(`(\\b${word}\\b)`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <mark key={i} className="bg-red-500/40 text-red-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Player chip (active players bar)
// ---------------------------------------------------------------------------

function PlayerChip({ player, isLocal }: { player: DsiPlayer; isLocal: boolean }) {
  return (
    <div
      className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${
        player.isOut
          ? 'bg-red-900/30 border-red-800/50 text-red-400 line-through'
          : isLocal
          ? 'bg-gp-accent/20 border-gp-accent text-gp-mint'
          : 'bg-gp-surface/50 border-gp-accent/30 text-gp-mint/80'
      }`}
    >
      <span>{player.isBot ? '🤖' : isLocal ? '👤' : '🙂'}</span>
      <span>{isLocal ? 'You' : player.name}</span>
      {player.isOut && <span>❌</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player word card (sidebar)
// ---------------------------------------------------------------------------

function PlayerWordCard({ player }: { player: DsiPlayer }) {
  const words = player.wordSlots.map((s) => s.finalWord).filter(Boolean) as string[];
  return (
    <div
      className={`rounded-lg p-2 border text-xs ${
        player.isOut
          ? 'border-red-800/30 bg-red-900/10 opacity-50'
          : 'border-gp-accent/20 bg-gp-bg/40'
      }`}
    >
      <div className="flex items-center gap-1 mb-1.5 text-gp-mint/70 font-medium">
        <span>{player.isBot ? '🤖' : '🙂'}</span>
        <span className={player.isOut ? 'line-through' : ''}>{player.name}</span>
        {player.isOut && <span className="text-red-400">❌</span>}
      </div>
      {words.length > 0 ? (
        <div className="space-y-0.5">
          {words.map((w) => (
            <span
              key={w}
              className="block rounded px-1.5 py-0.5 bg-gp-accent/10 text-gp-mint capitalize"
            >
              {w}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-gp-mint/30">—</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Finished view
// ---------------------------------------------------------------------------

function FinishedView({
  game,
  onLeave,
  onShowReplay,
}: {
  game: DsiGameState;
  onLeave: () => void;
  onShowReplay: () => void;
}) {
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId);
  const localName = localPlayer?.name ?? 'You';
  const winner =
    game.players.find((p) => p.id === game.winnerId && !p.isOut) ??
    (game.players.filter((p) => !p.isOut).length === 1 ? game.players.find((p) => !p.isOut) : null);
  const winnerId = winner?.id ?? null;
  const isLocalWinner = winnerId === game.localPlayerId;
  const ranking = getRanking(game);

  function getResultText() {
    if (isLocalWinner) return `Congratulations ${localName} — you were the last one standing!`;
    if (winner) return `${winner.name} was the last one to avoid saying their forbidden words.`;
    return 'Everyone said their forbidden word. Well played all!';
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">{isLocalWinner ? '🏆' : winner ? '🙁' : '🤝'}</div>
      <div>
        <h2 className="text-3xl font-bold text-gp-mint mb-2">
          {winner ? (isLocalWinner ? `${localName} Wins!` : `${winner.name} Wins!`) : 'It\'s a Draw!'}
        </h2>
        <p className="text-gp-mint/60 text-sm">
          {getResultText()}
        </p>
      </div>

      <div className="w-full max-w-2xl border border-gp-accent/30 rounded-xl bg-gp-surface/20 p-3">
        <p className="text-gp-accent text-xs uppercase tracking-widest mb-3">Ranking & Final Words</p>
        <div className="space-y-1.5">
          {ranking.map((entry) => {
            const finalWord = entry.finalWords.join(', ');
            const outedWord = entry.word ?? 'unknown';

            return (
              <div
                key={entry.player.id}
                className="bg-gp-surface/50 rounded-lg border border-gp-accent/20 px-3 py-2 text-sm flex items-center gap-2"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gp-accent/20 text-gp-mint text-xs font-bold border border-gp-accent/40 shrink-0">
                  {entry.rank}
                </span>
                <span className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                  <span>{entry.player.isBot ? '🤖' : '👤'}</span>
                  <span className={`truncate ${entry.player.isOut ? 'text-red-400 line-through' : 'text-gp-mint'}`}>
                    {entry.player.name}
                    {entry.player.id === winnerId ? ' 🏆' : ''}
                  </span>
                </span>
                <span className="text-xs shrink-0">
                  {entry.outed ? (
                    <>
                      <span className="text-red-400">Out by </span>
                      <span className="text-red-400 font-bold">"{outedWord}"</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gp-mint/60">Not saying </span>
                      <span className="text-gp-mint/60 font-bold">"{finalWord ? finalWord : '—'}"</span>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg" 
          onClick={onShowReplay}
          title="Chat Replay"
          aria-label="Chat Replay"
        >
          <span aria-hidden="true">📜 </span>
          <span className="ml-1.5">Chat Replay</span>
        </Button>
        <Button variant="primary" size="lg" onClick={onLeave}>
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}

interface ChatReplayPageProps {
  game: DsiGameState;
  onClose: () => void;
}

function ChatReplayPage({ game, onClose }: ChatReplayPageProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 p-3 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] bg-gp-bg border border-gp-accent/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gp-accent/20 bg-gp-surface/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Back to Result"
            aria-label="Back to Result"
          >
            X
          </Button>
          <div className="flex-1 min-w-0">
            <span className="text-gp-mint font-semibold text-sm truncate block">Chat Replay</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6 space-y-2 gp-scrollbar">
          {game.messages.length === 0 && (
            <p className="text-gp-mint/30 text-sm text-center py-10">No messages were sent.</p>
          )}
          {game.messages.map((msg) => {
            const isLocal = msg.playerId === game.localPlayerId;
            return (
              <div key={msg.id} className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'}`}>
                <span className="text-gp-mint/50 text-[10px] px-1 mb-0.5">{msg.playerName}</span>
                <div
                  className={`px-3 py-1.5 rounded-xl text-sm max-w-[75%] break-words ${
                    msg.triggeredWord
                      ? 'bg-red-900/50 border border-red-500/50 text-red-200'
                      : isLocal
                      ? 'bg-gp-accent/30 text-gp-mint'
                      : 'bg-gp-surface text-gp-mint/90'
                  }`}
                >
                  {msg.triggeredWord ? highlightWord(msg.text, msg.triggeredWord) : msg.text}
                </div>
                {msg.triggeredWord && (
                  <span className="text-xs mt-0.5 px-1">
                    {msg.playerName}'s word was
                    <span className="text-red-400"> "{msg.triggeredWord}"</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PlayerRankEntry {
  player: DsiPlayer;
  rank: number;
  outed: boolean;
  word: string | null;
  finalWords: string[];
}

function getRanking(game: DsiGameState): PlayerRankEntry[] {
  const firstOutByPlayer = new Map<string, DsiChatMessage>();

  game.messages.forEach((msg) => {
    if (!msg.triggeredWord) return;
    if (!firstOutByPlayer.has(msg.playerId)) {
      firstOutByPlayer.set(msg.playerId, msg);
    }
  });

  const survivors: PlayerRankEntry[] = [];
  const outs: Array<PlayerRankEntry & { order: number }> = [];

  game.players.forEach((player, order) => {
    const elimination = firstOutByPlayer.get(player.id);
    if (player.isOut && elimination) {
      outs.push({
        player,
        rank: 0,
        outed: true,
        word: elimination.triggeredWord ?? null,
        order,
        finalWords: player.wordSlots.map((slot) => slot.finalWord).filter(Boolean) as string[],
      });
    } else {
      survivors.push({
        player,
        rank: 1,
        outed: false,
        word: null,
        finalWords: player.wordSlots.map((slot) => slot.finalWord).filter(Boolean) as string[],
      });
    }
  });

  const outSorted = [...outs].sort((a, b) => {
    const first = game.messages.findIndex((m) => m === (firstOutByPlayer.get(a.player.id) as DsiChatMessage));
    const second = game.messages.findIndex((m) => m === (firstOutByPlayer.get(b.player.id) as DsiChatMessage));
    return first - second;
  });
  const sorted: PlayerRankEntry[] = [
    ...survivors.sort((a, b) => a.player.name.localeCompare(b.player.name)),
    ...outSorted.map((entry, idx) => ({
      ...entry,
      rank: game.players.length - idx,
      outed: true,
    })),
  ];

  return sorted;
}
