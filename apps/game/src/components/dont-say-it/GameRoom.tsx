// In-room view for "Don't Say It".
// Handles: waiting, voting (word selection + countdown), playing (chat + STT),
// and finished (winner announcement) phases.

import { useState, useRef, useEffect } from 'react';
import type { DsiGameState, DsiPlayer } from '../../types/dont-say-it';
import { Button } from '@glowing-potato/ui';

interface GameRoomProps {
  game: DsiGameState;
  onLeave: () => void;
  onSendMessage: (text: string) => void;
  onCastVote: (targetPlayerId: string, slotIndex: number, wordIndex: number) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  sttSupported: boolean;
  sttActive: boolean;
  sttError: string | null;
  onToggleStt: () => void;
  sttInterim: string;
}

export function GameRoom({
  game,
  onLeave,
  onSendMessage,
  onCastVote,
  onToggleReady,
  onStartGame,
  sttSupported,
  sttActive,
  sttError,
  onToggleStt,
  sttInterim,
}: GameRoomProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gp-bg">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gp-accent/20 bg-gp-surface/30">
        <Button variant="ghost" size="sm" onClick={onLeave}>← Leave</Button>
        <div className="flex-1 min-w-0">
          <span className="text-gp-mint font-semibold text-sm truncate block">{game.roomTitle}</span>
          <span className="text-gp-mint/50 text-xs">
            {game.roomVisibility === 'private' ? `🔒 ${game.roomId}` : `🌐 Room #${game.roomId}`}
          </span>
        </div>
        <PhaseTag phase={game.phase} />
      </header>

      {/* Phase views */}
      {game.phase === 'waiting' && (
        <WaitingView
          game={game}
          onToggleReady={onToggleReady}
          onStartGame={onStartGame}
        />
      )}
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
        />
      )}
      {game.phase === 'finished' && <FinishedView game={game} onLeave={onLeave} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase tag
// ---------------------------------------------------------------------------

function PhaseTag({ phase }: { phase: DsiGameState['phase'] }) {
  const map: Record<DsiGameState['phase'], { label: string; cls: string }> = {
    waiting: { label: '⏳ Waiting', cls: 'text-gp-mint/60' },
    voting:  { label: '🗳️ Voting',  cls: 'text-yellow-400' },
    playing: { label: '🎮 Playing', cls: 'text-green-400' },
    finished:{ label: '🏆 Finished',cls: 'text-gp-accent' },
  };
  const { label, cls } = map[phase];
  return <span className={`text-xs font-semibold ${cls}`}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Waiting view
// ---------------------------------------------------------------------------

interface WaitingViewProps {
  game: DsiGameState;
  onToggleReady: () => void;
  onStartGame: () => void;
}

function WaitingView({ game, onToggleReady, onStartGame }: WaitingViewProps) {
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId)!;
  const allReady = game.players.length >= 2 && game.players.every((p) => p.isReady);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      <div className="text-5xl animate-pulse">⏳</div>
      <div className="text-center">
        <p className="text-gp-mint font-semibold text-lg">Waiting for players…</p>
        <p className="text-gp-mint/50 text-sm mt-1">
          {game.players.length} / 4 players
          {game.isHost
            ? ' — press Start when everyone is ready'
            : ' — wait for the host to start'}
        </p>
      </div>

      {/* Player list with ready badges */}
      <div className="w-full max-w-xs space-y-2">
        {game.players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gp-surface/50 border border-gp-accent/20">
            <span className="text-lg">{p.isBot ? '🤖' : '👤'}</span>
            <span className="text-gp-mint text-sm font-medium flex-1">
              {p.id === game.localPlayerId ? `${p.name} (you)` : p.name}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              p.isReady
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gp-accent/10 text-gp-mint/40 border border-gp-accent/20'
            }`}>
              {p.isReady ? '✓ Ready' : 'Not ready'}
            </span>
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - game.players.length) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gp-surface/20 border border-dashed border-gp-accent/20">
            <span className="text-lg opacity-30">👤</span>
            <span className="text-gp-mint/30 text-sm">Waiting for player…</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {/* Ready toggle — always visible for the local human player */}
        <Button
          variant={localPlayer.isReady ? 'secondary' : 'primary'}
          size="lg"
          onClick={onToggleReady}
          className="w-full"
        >
          {localPlayer.isReady ? '↩ Cancel Ready' : '✓ Ready'}
        </Button>

        {/* Start button — only visible to the host */}
        {game.isHost && (
          <Button
            variant="primary"
            size="lg"
            onClick={onStartGame}
            disabled={!allReady}
            className="w-full"
            title={!allReady ? 'All players must be ready to start' : undefined}
          >
            ▶ Start Game
          </Button>
        )}

        {!allReady && game.players.length >= 2 && (
          <p className="text-gp-mint/40 text-xs text-center">
            Waiting for all players to ready up…
          </p>
        )}
        {game.players.length < 2 && (
          <p className="text-gp-mint/40 text-xs text-center">
            Need at least 2 players to start.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voting view
// ---------------------------------------------------------------------------

interface VotingViewProps {
  game: DsiGameState;
  onCastVote: (targetPlayerId: string, slotIndex: number, wordIndex: number) => void;
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
    if (myVotes[key] === wordIdx) return; // already voted for this
    setMyVotes((prev) => ({ ...prev, [key]: wordIdx }));
    onCastVote(player.id, slotIdx, wordIdx);
  }

  const otherPlayers = game.players.filter((p) => p.id !== game.localPlayerId);
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId)!;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
      {/* Countdown */}
      <div className="text-center py-2">
        <p className="text-gp-mint/70 text-xs uppercase tracking-widest mb-1">Voting closes in</p>
        <p className="text-4xl font-bold text-yellow-400">{game.votingTimeLeft}s</p>
        <p className="text-gp-mint/50 text-xs mt-1">
          Vote to choose which forbidden words the other players get!
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
                <p className="text-gp-mint/40 text-xs mb-1">Slot {si + 1}</p>
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
}

function PlayingView({ game, onSendMessage, sttSupported, sttActive, sttError, onToggleStt, sttInterim }: PlayingViewProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId)!;
  const isOut = localPlayer.isOut;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [game.messages]);

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
  }

  const activePlrs = game.players.filter((p) => !p.isOut);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Players bar */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-gp-accent/20 bg-gp-surface/20">
        {game.players.map((p) => (
          <PlayerChip key={p.id} player={p} isLocal={p.id === game.localPlayerId} />
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
        </div>

        {/* Sidebar: forbidden words of OTHER players */}
        <aside className="hidden md:flex flex-col w-48 border-l border-gp-accent/20 bg-gp-surface/10 overflow-y-auto p-3 gap-3">
          <p className="text-gp-accent text-[10px] uppercase tracking-widest">Others' words</p>
          {game.players
            .filter((p) => p.id !== game.localPlayerId)
            .map((p) => (
              <PlayerWordCard key={p.id} player={p} />
            ))}
          <p className="text-gp-mint/30 text-[10px] mt-2">
            Your own words are hidden. Don't say them!
          </p>
          <div className="mt-auto text-center">
            <p className="text-gp-mint/50 text-[10px]">Active</p>
            <p className="text-gp-mint font-bold text-xl">{activePlrs.length}</p>
          </div>
        </aside>
      </div>
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

function FinishedView({ game, onLeave }: { game: DsiGameState; onLeave: () => void }) {
  const winner = game.players.find((p) => p.id === game.winnerId);
  const isLocalWinner = game.winnerId === game.localPlayerId;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">{isLocalWinner ? '🏆' : winner ? '🎉' : '🤝'}</div>
      <div>
        <h2 className="text-3xl font-bold text-gp-mint mb-2">
          {winner ? (isLocalWinner ? 'You Win!' : `${winner.name} Wins!`) : 'It\'s a Draw!'}
        </h2>
        <p className="text-gp-mint/60 text-sm">
          {isLocalWinner
            ? 'Congratulations — you were the last one standing!'
            : winner
            ? `${winner.name} was the last one to avoid saying their forbidden words.`
            : 'Everyone said their forbidden word. Well played all!'}
        </p>
      </div>

      {/* Final word reveal */}
      <div className="w-full max-w-sm space-y-2">
        <p className="text-gp-accent text-xs uppercase tracking-widest mb-3">Final Words</p>
        {game.players.map((p) => {
          const isLocal = p.id === game.localPlayerId;
          const words = p.wordSlots.map((s) => s.finalWord).filter(Boolean) as string[];
          return (
            <div key={p.id} className="flex items-center gap-2 text-sm bg-gp-surface/40 rounded-lg px-3 py-2">
              <span>{p.isBot ? '🤖' : '👤'}</span>
              <span className={`font-medium flex-1 text-left ${p.isOut ? 'text-red-400 line-through' : 'text-gp-mint'}`}>
                {isLocal ? 'You' : p.name}
                {p.id === game.winnerId && ' 🏆'}
              </span>
              <span className="text-gp-mint/50 capitalize text-xs">{words.join(', ')}</span>
            </div>
          );
        })}
      </div>

      <Button variant="primary" size="lg" onClick={onLeave}>
        Back to Lobby
      </Button>
    </div>
  );
}
