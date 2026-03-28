// Core state hook for the "Don't Say It" mini-game.
// Manages: room lobby list, room creation/joining, game phases (waiting → voting
// → playing → finished), bot AI, voting timer, and Web Speech API integration.

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  DsiRoomSummary,
  DsiPlayer,
  DsiChatMessage,
  DsiGameState,
  DsiWordSlot,
  GamePhase,
  RoomVisibility,
} from '../types/dont-say-it';
import { pickWords } from '../data/words';

// ---------------------------------------------------------------------------
// Web Speech API minimal types (not universally available in lib.dom.d.ts)
// ---------------------------------------------------------------------------

interface SpeechRecognitionResultItem {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANDIDATES_PER_SLOT = 3;
const SLOTS_PER_PLAYER = 3;
const VOTING_SECONDS = 10;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

const BOT_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];

const BOT_MESSAGES = [
  "what do you think about this game?",
  "i really enjoy playing games like this",
  "that's a great point, i agree",
  "hmm let me think about that for a second",
  "this is so much fun!",
  "i love the design of this game",
  "have you tried the other games in the lobby?",
  "i can't believe how fast the time goes",
  "let's keep the conversation going",
  "nice, i didn't know that",
  "oh interesting, tell me more",
  "i was just thinking the same thing",
  "can you give me a hint?",
  "i remember reading a book about that",
  "my dog would love this game",
  "it reminds me of a card game",
  "the weather outside is beautiful today",
  "i'd like some coffee right now",
  "spring is my favourite time of year",
  "the sky looks really blue today",
  "i saw a bird on my way here",
  "did you sleep well last night?",
  "i dreamed about a forest last night",
  "the music in this game is nice",
  "i could eat pizza every day",
  "the sun is so bright this morning",
  "let's dance if we win!",
  "i hope nobody gets out too soon",
  "watch out, choose your words carefully",
  "this round is getting exciting",
  "i've been playing games all day",
  "my friend introduced me to this",
  "are you ready for the next round?",
  "good luck everyone!",
  "almost there, stay focused",
  "exciting stuff happening here",
  "i wonder who will win this round",
  "last one standing wins, right?",
  "three more seconds, don't slip up",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;
function uid(): string {
  return `${Date.now()}-${++_idCounter}`;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function buildWordSlots(allAssigned: string[]): DsiWordSlot[] {
  return Array.from({ length: SLOTS_PER_PLAYER }, () => {
    const candidates = pickWords(CANDIDATES_PER_SLOT, allAssigned);
    allAssigned.push(...candidates);
    return {
      candidates,
      votesByWord: Array(CANDIDATES_PER_SLOT).fill(0) as number[],
      finalWord: null,
    };
  });
}

function resolveSlots(player: DsiPlayer): DsiPlayer {
  const resolvedSlots = player.wordSlots.map((slot) => {
    const max = Math.max(...slot.votesByWord);
    const tiedIndices = slot.votesByWord
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v === max)
      .map(({ i }) => i);
    const winnerIdx = tiedIndices[Math.floor(Math.random() * tiedIndices.length)];
    return { ...slot, finalWord: slot.candidates[winnerIdx] };
  });
  return { ...player, wordSlots: resolvedSlots };
}

function getActivePlayers(players: DsiPlayer[]): DsiPlayer[] {
  return players.filter((p) => !p.isOut);
}

function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

function findTriggeredWord(player: DsiPlayer, text: string): string | null {
  for (const slot of player.wordSlots) {
    if (slot.finalWord && containsWord(text, slot.finalWord)) return slot.finalWord;
  }
  return null;
}

function applyMessage(prev: DsiGameState, speakerId: string, text: string): DsiGameState {
  const player = prev.players.find((p) => p.id === speakerId);
  if (!player || player.isOut) return prev;

  const triggered = findTriggeredWord(player, text);
  const msg: DsiChatMessage = {
    id: uid(),
    playerId: speakerId,
    playerName: player.name,
    text,
    timestamp: Date.now(),
    triggeredWord: triggered ?? undefined,
  };

  let newPlayers = prev.players;
  let newPhase: GamePhase = prev.phase;
  let newWinnerId = prev.winnerId;

  if (triggered) {
    newPlayers = prev.players.map((p) =>
      p.id === speakerId ? { ...p, isOut: true } : p
    );
    const remaining = getActivePlayers(newPlayers);
    if (remaining.length === 1) {
      newPhase = 'finished';
      newWinnerId = remaining[0].id;
    } else if (remaining.length === 0) {
      newPhase = 'finished';
    }
  }

  return { ...prev, messages: [...prev.messages, msg], players: newPlayers, phase: newPhase, winnerId: newWinnerId };
}

// ---------------------------------------------------------------------------
// Initial lobby rooms
// ---------------------------------------------------------------------------

const INITIAL_ROOMS: DsiRoomSummary[] = [
  { id: 'LOBBY1', title: 'Chill Vibes 🌿', visibility: 'public', playerCount: 1, maxPlayers: MAX_PLAYERS },
  { id: 'LOBBY2', title: 'Word Masters 📚', visibility: 'public', playerCount: 2, maxPlayers: MAX_PLAYERS },
  { id: 'SECRET', title: 'Secret Room 🔒', visibility: 'private', playerCount: 1, maxPlayers: MAX_PLAYERS },
];

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseDontSayItReturn {
  rooms: DsiRoomSummary[];
  createRoom: (title: string, visibility: RoomVisibility) => void;
  joinRoom: (roomId: string) => void;
  joinPrivateRoom: (roomId: string) => 'ok' | 'not-found';
  leaveRoom: () => void;
  game: DsiGameState | null;
  sendMessage: (text: string) => void;
  castVote: (targetPlayerId: string, slotIndex: number, wordIndex: number) => void;
  toggleReady: () => void;
  startGame: () => void;
  sttSupported: boolean;
  sttActive: boolean;
  sttError: string | null;
  toggleStt: () => void;
  sttInterim: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDontSayIt(): UseDontSayItReturn {
  const [rooms, setRooms] = useState<DsiRoomSummary[]>(INITIAL_ROOMS);
  const [game, setGame] = useState<DsiGameState | null>(null);

  const [sttActive, setSttActive] = useState(false);
  const [sttInterim, setSttInterim] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sttSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const votingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botJoinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const botChatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (votingTimerRef.current) clearInterval(votingTimerRef.current);
      botJoinTimersRef.current.forEach(clearTimeout);
      if (botChatTimerRef.current) clearTimeout(botChatTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Voting timer
  // ---------------------------------------------------------------------------
  const startVotingTimer = useCallback(() => {
    if (votingTimerRef.current) clearInterval(votingTimerRef.current);
    votingTimerRef.current = setInterval(() => {
      setGame((prev) => {
        if (!prev || prev.phase !== 'voting') {
          clearInterval(votingTimerRef.current!);
          return prev;
        }
        const newTime = prev.votingTimeLeft - 1;
        if (newTime <= 0) {
          clearInterval(votingTimerRef.current!);
          return { ...prev, votingTimeLeft: 0, phase: 'playing', players: prev.players.map(resolveSlots) };
        }
        return { ...prev, votingTimeLeft: newTime };
      });
    }, 1000);
  }, []);

  // ---------------------------------------------------------------------------
  // Bot chat
  // ---------------------------------------------------------------------------
  const scheduleBotChat = useCallback(() => {
    if (botChatTimerRef.current) clearTimeout(botChatTimerRef.current);
    botChatTimerRef.current = setTimeout(() => {
      setGame((prev) => {
        if (!prev || prev.phase !== 'playing') return prev;
        const bots = getActivePlayers(prev.players).filter((p) => p.isBot);
        if (bots.length === 0) return prev;
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const text = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
        return applyMessage(prev, bot.id, text);
      });
      scheduleBotChat();
    }, 4000 + Math.random() * 6000);
  }, []);

  useEffect(() => {
    if (game?.phase === 'playing') {
      scheduleBotChat();
    } else {
      if (botChatTimerRef.current) clearTimeout(botChatTimerRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.phase]);

  // ---------------------------------------------------------------------------
  // Bot joins
  // ---------------------------------------------------------------------------
  function scheduleBotJoins(allAssigned: string[]) {
    const usedBotNames = new Set<string>();
    botJoinTimersRef.current.forEach(clearTimeout);
    botJoinTimersRef.current = [];

    function addNextBot() {
      setGame((prev) => {
        if (!prev || prev.phase !== 'waiting') return prev;
        if (prev.players.length >= MAX_PLAYERS) return prev;

        const availableNames = BOT_NAMES.filter((n) => !usedBotNames.has(n));
        if (availableNames.length === 0) return prev;

        const name = availableNames[Math.floor(Math.random() * availableNames.length)];
        usedBotNames.add(name);

        const botSlots = buildWordSlots([...allAssigned]);
        botSlots.forEach((s) => allAssigned.push(...s.candidates));

        // Bots are always ready immediately on joining.
        const bot: DsiPlayer = { id: uid(), name, wordSlots: botSlots, isOut: false, isBot: true, isReady: true };
        return { ...prev, players: [...prev.players, bot] };
      });
    }

    botJoinTimersRef.current = [1500, 3000, 4500].map((d) => setTimeout(addNextBot, d));
  }

  // ---------------------------------------------------------------------------
  // Room enter helper
  // ---------------------------------------------------------------------------
  const enterRoom = useCallback(
    (roomId: string, title: string, visibility: RoomVisibility, isHost: boolean) => {
      const localId = uid();
      const allAssigned: string[] = [];
      const localPlayer: DsiPlayer = {
        id: localId,
        name: 'You',
        wordSlots: buildWordSlots(allAssigned),
        isOut: false,
        isBot: false,
        isReady: false,
      };
      setGame({
        phase: 'waiting',
        roomId,
        roomTitle: title,
        roomVisibility: visibility,
        isHost,
        localPlayerId: localId,
        players: [localPlayer],
        messages: [],
        votingTimeLeft: VOTING_SECONDS,
        winnerId: null,
      });
      scheduleBotJoins(allAssigned);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startVotingTimer]
  );

  const createRoom = useCallback(
    (title: string, visibility: RoomVisibility) => {
      const roomId = randomId();
      const trimmedTitle = title.trim() || 'My Room';
      // Add the new room to the list so it's visible in the lobby
      setRooms((prev) => [
        ...prev,
        { id: roomId, title: trimmedTitle, visibility, playerCount: 1, maxPlayers: MAX_PLAYERS },
      ]);
      enterRoom(roomId, trimmedTitle, visibility, true);
    },
    [enterRoom]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      const room = rooms.find((r) => r.id === roomId);
      enterRoom(roomId, room?.title ?? `Room ${roomId}`, room?.visibility ?? 'public', false);
    },
    [enterRoom, rooms]
  );

  const joinPrivateRoom = useCallback(
    (roomId: string): 'ok' | 'not-found' => {
      const upper = roomId.trim().toUpperCase();
      if (!rooms.some((r) => r.id === upper)) return 'not-found';
      joinRoom(upper);
      return 'ok';
    },
    [joinRoom, rooms]
  );

  const leaveRoom = useCallback(() => {
    if (votingTimerRef.current) clearInterval(votingTimerRef.current);
    botJoinTimersRef.current.forEach(clearTimeout);
    if (botChatTimerRef.current) clearTimeout(botChatTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setSttActive(false);
    setSttInterim('');
    setGame(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------------
  const castVote = useCallback(
    (targetPlayerId: string, slotIndex: number, wordIndex: number) => {
      setGame((prev) => {
        if (!prev || prev.phase !== 'voting') return prev;
        const newPlayers = prev.players.map((p) => {
          if (p.id !== targetPlayerId) return p;
          const newSlots = p.wordSlots.map((slot, si) => {
            if (si !== slotIndex) return slot;
            const newVotes = [...slot.votesByWord];
            newVotes[wordIndex] = (newVotes[wordIndex] ?? 0) + 1;
            return { ...slot, votesByWord: newVotes };
          });
          return { ...p, wordSlots: newSlots };
        });
        return { ...prev, players: newPlayers };
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setGame((prev) => {
      if (!prev || prev.phase !== 'playing') return prev;
      return applyMessage(prev, prev.localPlayerId, trimmed);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Ready / Start (waiting phase)
  // ---------------------------------------------------------------------------

  /** Toggle the local player's ready status. */
  const toggleReady = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'waiting') return prev;
      const newPlayers = prev.players.map((p) =>
        p.id === prev.localPlayerId ? { ...p, isReady: !p.isReady } : p
      );
      return { ...prev, players: newPlayers };
    });
  }, []);

  /**
   * Host-only: start the game.
   * Allowed only when ≥2 players are present and every player is ready.
   */
  const startGame = useCallback(() => {
    setGame((prev) => {
      if (!prev || prev.phase !== 'waiting') return prev;
      if (!prev.isHost) return prev;
      if (prev.players.length < MIN_PLAYERS) return prev;
      if (!prev.players.every((p) => p.isReady)) return prev;
      startVotingTimer();
      return { ...prev, phase: 'voting', votingTimeLeft: VOTING_SECONDS };
    });
  }, [startVotingTimer]);

  // ---------------------------------------------------------------------------
  // STT
  // ---------------------------------------------------------------------------
  const stopStt = useCallback(() => {
    if (recognitionRef.current) {
      // stop() may throw if the recognition has already ended; safe to ignore.
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setSttActive(false);
    setSttInterim('');
  }, []);

  const startStt = useCallback(() => {
    if (!sttSupported) return;
    const win = window as WindowWithSpeech;
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) return;

    setSttError(null);
    const recognition: SpeechRecognitionInstance = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      setSttInterim(interim);
      if (finalText.trim()) {
        setSttInterim('');
        setGame((prev) => {
          if (!prev || prev.phase !== 'playing') return prev;
          return applyMessage(prev, prev.localPlayerId, finalText.trim());
        });
      }
    };

    recognition.onerror = () => {
      setSttError('Microphone access denied or speech recognition unavailable.');
      stopStt();
    };
    recognition.onend = () => {
      setSttActive((active) => { if (active) recognition.start(); return active; });
    };

    recognitionRef.current = recognition;
    recognition.start();
    setSttActive(true);
  }, [sttSupported, stopStt]);

  const toggleStt = useCallback(() => {
    if (sttActive) stopStt(); else startStt();
  }, [sttActive, startStt, stopStt]);

  useEffect(() => {
    if (game?.phase !== 'playing' && sttActive) stopStt();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.phase]);

  return { rooms, createRoom, joinRoom, joinPrivateRoom, leaveRoom, game, sendMessage, castVote, toggleReady, startGame, sttSupported, sttActive, sttError, toggleStt, sttInterim };
}
