// Realtime Firebase implementation for the "Don't Say It" mini-game.
// Rooms, players, chat, votes, and phase transitions are synchronized through
// Realtime Database listeners.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  onValue,
  push,
  ref,
  onDisconnect,
  get,
  runTransaction,
  set,
  remove,
} from 'firebase/database';
import { addDoc, collection as fsCollection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type {
  DsiRoomSummary,
  DsiPlayer,
  DsiChatMessage,
  DsiGameState,
  DsiWordSlot,
  GamePhase,
  RoomVisibility,
} from '../types';
import { pickWords } from '../data/words';
import {
  getFirestoreDb,
  getRealtimeDb,
  hasRealtimeDbConfig,
} from '../lib/firebase';

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
const SLOTS_PER_PLAYER = 1;
const VOTING_SECONDS = 10;
const PLAY_SECONDS = 60;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const ROOM_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const RTDB_GAME_PATH = 'games/dont_say_it';
const RTDB_ROOMS_PATH = `${RTDB_GAME_PATH}/rooms`;
const FIRESTORE_HISTORY_COLLECTION = 'game_histories';
const FIRESTORE_HISTORY_GAME_TYPE = 'dont_say_it';
const FIRESTORE_HISTORY_DOC_COLLECTION = 'rooms';
const DONT_SAY_IT_LEADERBOARD_GAME_ID = 'dont-say-it';
const DONT_SAY_IT_RECORD_COLLECTION = 'records';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DbWordSlot {
  candidates: string[];
  finalWord?: string | null;
  votesByWord?: number[];
}

interface DbPlayer {
  name: string;
  isOut: boolean;
  isBot: boolean;
  wordSlots: DbWordSlot[];
  isInRoom?: boolean;
}

interface DbVoteMap {
  [targetId: string]: {
    [slotIdx: string]: {
      [voterId: string]: number;
    };
  };
}

interface DbRoom {
  title: string;
  visibility: RoomVisibility;
  maxPlayers: number;
  hostId: string;
  phase: GamePhase;
  winnerId: string | null;
  votingTimeLeft: number;
  gameTimeLeft: number;
  players: Record<string, DbPlayer>;
  messages?: Record<string, DsiChatMessage>;
  votes?: DbVoteMap;
}

type DbRooms = Record<string, DbRoom>;

interface GameHistoryPlayerSnapshot {
  id: string;
  name: string;
  isBot: boolean;
  isOut: boolean;
  finalWords: (string | null)[];
}

interface GameHistorySnapshot {
  gameType: 'dont_say_it';
  roomId: string;
  roomTitle: string;
  roomVisibility: RoomVisibility;
  maxPlayers: number;
  hostId: string;
  winnerId: string | null;
  players: GameHistoryPlayerSnapshot[];
  messages: DsiChatMessage[];
  eliminationOrder: string[];
  recordedAt: ReturnType<typeof serverTimestamp>;
  endedAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;
function uid(): string {
  return `${Date.now()}-${++_idCounter}`;
}

function randomRoomId(length = 6) {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ROOM_ID_CHARS.length);
    result += ROOM_ID_CHARS[idx];
  }
  return result;
}

function firstPlayerId(players: Record<string, DbPlayer>): string | null {
  const id = Object.keys(players)[0];
  return id ? id : null;
}

function sanitizePlayerName(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 18) : 'You';
}

function normalizeMaxPlayers(value: number): number {
  const maxPlayers = Math.floor(Number(value));
  if (!Number.isFinite(maxPlayers)) return MAX_PLAYERS;
  return Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, maxPlayers));
}

function localPlayerStorageId() {
  if (typeof window === 'undefined') return uid();
  const key = 'dsi-player-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = uid();
  window.localStorage.setItem(key, next);
  return next;
}

function hiddenWordSlots(): DsiWordSlot[] {
  return [
    {
      candidates: ['***', '***', '***'],
      votesByWord: Array(CANDIDATES_PER_SLOT).fill(0) as number[],
      finalWord: null,
    },
  ];
}

type AnyWordSlot = DbWordSlot | DsiWordSlot;

function normalizeDbWordSlot(slot: AnyWordSlot): DsiWordSlot {
  return {
    candidates: slot.candidates,
    finalWord: slot.finalWord ?? null,
    votesByWord: Array.isArray(slot.votesByWord)
      ? slot.votesByWord
      : Array(slot.candidates.length).fill(0) as number[],
  };
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

function voteCountsForSlot(
  slot: DsiWordSlot,
  slotVotes: Record<string, number> | undefined,
): number[] {
  const votesByWord = Array(slot.candidates.length).fill(0) as number[];
  if (!slotVotes) return votesByWord;
  Object.values(slotVotes).forEach((wordIdx) => {
    if (Number.isInteger(wordIdx) && wordIdx >= 0 && wordIdx < votesByWord.length) {
      votesByWord[wordIdx] += 1;
    }
  });
  return votesByWord;
}

function resolveWordSlot(slot: DsiWordSlot, votesByWord: number[]): DsiWordSlot {
  const max = Math.max(...votesByWord);
  const ties = votesByWord.map((v, idx) => ({ v, idx })).filter((item) => item.v === max);
  const winnerIdx = ties[Math.floor(Math.random() * Math.max(1, ties.length))]?.idx ?? 0;
  return {
    ...slot,
    votesByWord,
    finalWord: slot.candidates[winnerIdx] ?? null,
  };
}

function containsWord(text: string, word: string): boolean {
  const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedWord = normalize(word);
  const normalizedText = normalize(text);
  if (!normalizedWord || !normalizedText) return false;
  return normalizedText.includes(normalizedWord);
}

function getUniqueOutOrder(messages: DsiChatMessage[]): string[] {
  const outPlayers = new Set<string>();
  return messages.reduce((acc, msg) => {
    if (!msg.triggeredWord) return acc;
    if (!outPlayers.has(msg.playerId)) {
      outPlayers.add(msg.playerId);
      acc.push(msg.playerId);
    }
    return acc;
  }, [] as string[]);
}

function buildGameHistory(game: DsiGameState): GameHistorySnapshot {
  return {
    gameType: 'dont_say_it',
    roomId: game.roomId,
    roomTitle: game.roomTitle,
    roomVisibility: game.roomVisibility,
    maxPlayers: game.maxPlayers,
    hostId: game.hostId,
    winnerId: game.winnerId,
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      isOut: player.isOut,
      finalWords: player.wordSlots.map((slot) => slot.finalWord),
    })),
    messages: game.messages,
    eliminationOrder: getUniqueOutOrder(game.messages),
    recordedAt: serverTimestamp(),
    endedAt: Date.now(),
  };
}

function roomPath(roomId: string): string {
  return `${RTDB_ROOMS_PATH}/${roomId}`;
}

function findTriggeredWordFromState(players: DsiPlayer[], playerId: string, text: string): string | null {
  const player = players.find((p) => p.id === playerId);
  if (!player) return null;
  for (const slot of player.wordSlots) {
    if (slot.finalWord && containsWord(text, slot.finalWord)) return slot.finalWord;
  }
  return null;
}

function normalizeRoomSummary(rooms: DbRooms): DsiRoomSummary[] {
  return Object.entries(rooms)
    .map(([id, room]) => ({
      id,
      title: room.title,
      visibility: room.visibility,
      playerCount: Object.keys(room.players ?? {}).length,
      maxPlayers: room.maxPlayers,
    }))
    .sort((a, b) => b.playerCount - a.playerCount);
}

function derivePlayerRows(
  roomPlayers: Record<string, DbPlayer> | undefined,
  votes: DbVoteMap | undefined,
): DsiPlayer[] {
  if (!roomPlayers) return [];
  return Object.entries(roomPlayers).map(([id, player]) => {
    const filteredVotes = Object.fromEntries(
      Object.entries(votes?.[id] ?? {}).map(([slotIdx, slotVotes]) => [
        slotIdx,
        Object.fromEntries(
          Object.entries(slotVotes).filter(([voterId]) => voterId in roomPlayers),
        ),
      ]),
    );
    const nextWordSlots = (player.wordSlots ?? []).map((slot, slotIdx) => {
      const normalizedSlot = normalizeDbWordSlot(slot);
      return {
        ...normalizedSlot,
        votesByWord: voteCountsForSlot(normalizedSlot, filteredVotes?.[String(slotIdx)]),
      };
    });
    return {
      id,
      name: player.name,
      isOut: player.isOut,
      isBot: player.isBot,
      isInRoom: player.isInRoom,
      wordSlots: nextWordSlots,
    };
  });
}

function markPlayersInRoom(players: Record<string, DbPlayer>, isInRoom: boolean): Record<string, DbPlayer> {
  const nextPlayers: Record<string, DbPlayer> = {};
  Object.entries(players).forEach(([id, player]) => {
    nextPlayers[id] = {
      ...player,
      isInRoom,
    };
  });
  return nextPlayers;
}

function resolveAllPlayerSlots(players: Record<string, DbPlayer>, votes: DbVoteMap | undefined): Record<string, DbPlayer> {
  const nextPlayers: Record<string, DbPlayer> = {};
  Object.entries(players).forEach(([id, player]) => {
    const filteredVotes = Object.fromEntries(
      Object.entries(votes?.[id] ?? {}).map(([slotIdx, slotVotes]) => [
        slotIdx,
        Object.fromEntries(
          Object.entries(slotVotes).filter(([voterId]) => voterId in players),
        ),
      ]),
    );
    const nextSlots = (player.wordSlots ?? hiddenWordSlots()).map((slot, slotIdx) => {
      const normalizedSlot = normalizeDbWordSlot(slot);
      const voteCounts = voteCountsForSlot(normalizedSlot, filteredVotes?.[String(slotIdx)]);
      return resolveWordSlot(normalizedSlot, voteCounts);
    });
    nextPlayers[id] = {
      ...player,
      wordSlots: nextSlots,
    };
  });
  return nextPlayers;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseDontSayItReturn {
  rooms: DsiRoomSummary[];
  createRoom: (title: string, visibility: RoomVisibility, maxPlayers: number, playerName: string) => Promise<void> | void;
  joinRoom: (roomId: string, playerName: string) => Promise<void> | void;
  joinPrivateRoom: (roomId: string, playerName: string) => Promise<'ok' | 'not-found' | 'full'> | 'ok' | 'not-found' | 'full';
  leaveRoom: () => Promise<void> | void;
  startGame: () => Promise<void> | void;
  restartGame: () => Promise<void> | void;
  game: DsiGameState | null;
  sendMessage: (text: string) => Promise<void> | void;
  castVote: (targetPlayerId: string, slotIndex: number, wordIndex: number, previousWordIndex?: number) => Promise<void> | void;
  sttSupported: boolean;
  sttActive: boolean;
  sttError: string | null;
  toggleStt: () => void;
  sttInterim: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDontSayIt(currentUserId: string | null = null): UseDontSayItReturn {
  const [rooms, setRooms] = useState<DsiRoomSummary[]>([]);
  const [game, setGame] = useState<DsiGameState | null>(null);
  const [localRoomId, setLocalRoomId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(currentUserId);

  const [sttActive, setSttActive] = useState(false);
  const [sttInterim, setSttInterim] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sttSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const db = getRealtimeDb();
  const firestoreDb = getFirestoreDb();
  const hostVotingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hostGameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomUnsubRef = useRef<(() => void) | null>(null);
  const roomListUnsubRef = useRef<(() => void) | null>(null);
  const onDisconnectRef = useRef<ReturnType<typeof onDisconnect> | null>(null);
  const roomCleanupDisconnectRef = useRef<ReturnType<typeof onDisconnect> | null>(null);
  const finishedGameArchiveRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);
  useEffect(() => {
    if (!hasRealtimeDbConfig() || !db) return;

    const roomsRef = ref(db, RTDB_ROOMS_PATH);
    roomListUnsubRef.current = onValue(roomsRef, (snapshot) => {
      const payload = snapshot.val() as DbRooms | null;
      if (!payload) {
        setRooms([]);
        return;
      }
      setRooms(normalizeRoomSummary(payload).filter((room) => room.playerCount <= room.maxPlayers));
    });

    return () => {
      roomListUnsubRef.current?.();
    };
  }, [db]);

  const stopHostTimers = useCallback(() => {
    if (hostVotingTimerRef.current) clearInterval(hostVotingTimerRef.current);
    if (hostGameTimerRef.current) clearInterval(hostGameTimerRef.current);
    hostVotingTimerRef.current = null;
    hostGameTimerRef.current = null;
  }, []);

  const setDisconnectCleanup = useCallback(
    async (roomId: string, playerId: string) => {
      if (!db) return;
      if (onDisconnectRef.current) {
        try {
          await onDisconnectRef.current.cancel();
        } catch {
          // Ignore cleanup errors.
        }
      }

      const playerPathRef = ref(db, `${roomPath(roomId)}/players/${playerId}`);
      onDisconnectRef.current = onDisconnect(playerPathRef);
      try {
        await onDisconnectRef.current.remove();
      } catch {
        onDisconnectRef.current = null;
      }
    },
    [db],
  );

  const clearRoomCleanupDisconnect = useCallback(async () => {
    if (!roomCleanupDisconnectRef.current) return;
    try {
      await roomCleanupDisconnectRef.current.cancel();
    } catch {
      /* ignore */
    }
    roomCleanupDisconnectRef.current = null;
  }, []);

  const setRoomCleanupDisconnect = useCallback(
    async (roomId: string) => {
      if (!db) return;
      if (roomCleanupDisconnectRef.current) {
        try {
          await roomCleanupDisconnectRef.current.cancel();
        } catch {
          /* ignore */
        }
      }
      roomCleanupDisconnectRef.current = onDisconnect(ref(db, roomPath(roomId)));
      try {
        await roomCleanupDisconnectRef.current.remove();
      } catch {
        roomCleanupDisconnectRef.current = null;
      }
    },
    [db],
  );

  const clearDisconnectCleanup = useCallback(async () => {
    if (!onDisconnectRef.current) return;
    try {
      await onDisconnectRef.current.cancel();
    } catch {
      /* ignore */
    }
    onDisconnectRef.current = null;
    await clearRoomCleanupDisconnect();
  }, [clearRoomCleanupDisconnect]);

  const upsertUserProfile = useCallback(
    async (playerId: string, playerName: string, roomId: string | null) => {
      if (!firestoreDb || !playerId) return;
      const docRef = doc(firestoreDb, 'users', playerId);
      const normalized = sanitizePlayerName(playerName);
      await setDoc(
        docRef,
        {
          playerId,
          lastNickname: normalized,
          lastRoomId: roomId,
          lastSeenAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [firestoreDb],
  );

  const archiveFinishedGame = useCallback(async (targetGame: DsiGameState) => {
    if (!targetGame?.roomId) return;
    if (finishedGameArchiveRef.current.has(targetGame.roomId)) return;
    finishedGameArchiveRef.current.add(targetGame.roomId);

    setRooms((prev) => prev.filter((room) => room.id !== targetGame.roomId));

    if (firestoreDb) {
      const historyDoc = doc(
        firestoreDb,
        FIRESTORE_HISTORY_COLLECTION,
        FIRESTORE_HISTORY_GAME_TYPE,
        FIRESTORE_HISTORY_DOC_COLLECTION,
        targetGame.roomId,
      );
      const history = buildGameHistory(targetGame);
      try {
        await setDoc(historyDoc, history, { merge: true });
      } catch (error) {
        console.error('Failed to save finished game history to game_histories/dont_say_it/rooms', error);
      }

      if (targetGame.winnerId && targetGame.winnerId === targetGame.localPlayerId) {
        const winner = targetGame.players.find((player) => player.id === targetGame.winnerId);
        const winnerUserId = currentUserIdRef.current
          ? currentUserIdRef.current
          : `guest-${targetGame.localPlayerId}`;
        const safeWinnerUserId = String(winnerUserId || '').trim();
        if (!safeWinnerUserId) return;
        const leaderboardBucket = fsCollection(
          firestoreDb,
          FIRESTORE_HISTORY_COLLECTION,
          FIRESTORE_HISTORY_GAME_TYPE,
          DONT_SAY_IT_RECORD_COLLECTION,
        );
        try {
          await addDoc(
            leaderboardBucket,
            {
              userId: safeWinnerUserId,
              nickname: winner?.name,
              gameId: DONT_SAY_IT_LEADERBOARD_GAME_ID,
              score: 1,
              survivalDays: 0,
              level: 1,
              totalXpGained: 0,
              defeatedAnimals: [],
              inventorySnapshot: [],
              createdAt: serverTimestamp(),
            },
          );
        } catch (error) {
          console.error('Failed to save winner record to game_histories/dont_say_it/records (increment)', {
            code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : 'unknown',
            message: error instanceof Error ? error.message : String(error),
            winnerUserId: safeWinnerUserId,
          });
          try {
            await addDoc(
              leaderboardBucket,
              {
                userId: safeWinnerUserId,
                nickname: winner?.name,
                gameId: DONT_SAY_IT_LEADERBOARD_GAME_ID,
                score: 1,
                survivalDays: 0,
                level: 1,
                totalXpGained: 0,
                defeatedAnimals: [],
                inventorySnapshot: [],
                createdAt: serverTimestamp(),
              },
            );
            console.info('Recovered winner record save by writing base winner entry.');
          } catch (fallbackError) {
            console.error('Failed to save winner record to game_histories/dont_say_it/records (fallback payload)', {
              code:
                typeof fallbackError === 'object' && fallbackError !== null && 'code' in fallbackError
                  ? (fallbackError as { code?: string }).code
                  : 'unknown',
              message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
              winnerUserId: safeWinnerUserId,
            });
          }
        }
      }
    }

    if (!db) return;
  }, [db, firestoreDb]);

  const refreshLocalPlayer = useCallback(() => {
    setLocalPlayerId(localPlayerStorageId());
  }, []);

  useEffect(() => {
    refreshLocalPlayer();
  }, [refreshLocalPlayer]);

  useEffect(() => {
    if (!db || !localRoomId) {
      roomUnsubRef.current?.();
      roomUnsubRef.current = null;
      setGame(null);
      stopHostTimers();
      return;
    }

    const roomRef = ref(db, roomPath(localRoomId));
    roomUnsubRef.current = onValue(roomRef, (snapshot) => {
      const payload = snapshot.val() as DbRoom | null;
      if (!payload) {
        setGame((prev) => {
          if (prev?.phase === 'finished') {
            return prev;
          }
          setLocalRoomId((prevRoomId) => (prevRoomId === localRoomId ? null : prevRoomId));
          stopHostTimers();
          return null;
        });
        return;
      }

      const playersMap = payload.players ?? {};
      const playerCount = Object.keys(playersMap).length;

      const resolvedHostId = playersMap[payload.hostId] ? payload.hostId : firstPlayerId(playersMap);
      const isSinglePlayerInRoom = playerCount === 1 && !!localPlayerId && !!playersMap[localPlayerId];
      const isFinalHost =
        !!(
          localPlayerId &&
          resolvedHostId === localPlayerId &&
          playerCount === 1 &&
          payload.phase !== 'finished'
        );
      if (isFinalHost) {
        void setRoomCleanupDisconnect(localRoomId);
      } else if (!isSinglePlayerInRoom) {
        void clearRoomCleanupDisconnect();
      }

      if (playerCount === 0) {
        void remove(roomRef);
        setGame((prev) => (prev?.phase === 'finished' ? prev : null));
        setLocalRoomId((prevRoomId) => (prevRoomId === localRoomId ? null : prevRoomId));
        stopHostTimers();
        return;
      }

      if (payload.phase === 'voting' && playerCount < MIN_PLAYERS) {
        setRooms((prev) => prev.filter((room) => room.id !== localRoomId));
        setGame((prev) => (prev?.phase === 'finished' ? prev : null));
        setLocalRoomId((prevRoomId) => (prevRoomId === localRoomId ? null : prevRoomId));
        stopHostTimers();
        void remove(roomRef);
        return;
      }

      if (payload.hostId && !playersMap[payload.hostId]) {
        void runTransaction(roomRef, (current: DbRoom | null) => {
          if (!current || !current.players) return current;
          const hostId = current.hostId;
          if (hostId && current.players[hostId]) return current;
          const nextHostId = firstPlayerId(current.players);
          if (!nextHostId) return null;
          return {
            ...current,
            hostId: nextHostId,
          };
        });
      }

      const players = derivePlayerRows(playersMap, payload.votes);
      const messageList = Object.values(payload.messages ?? {})
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp);
      const selectedLocalId = localPlayerId;
      const localPlayer = players.find((p) => p.id === selectedLocalId);
      const baseGame: DsiGameState = {
        phase: payload.phase,
        roomId: localRoomId,
        roomTitle: payload.title,
        roomVisibility: payload.visibility,
        hostId: payload.hostId,
        localPlayerId: selectedLocalId ?? '',
        isHost: selectedLocalId === payload.hostId,
        maxPlayers: payload.maxPlayers,
        players,
        messages: messageList,
        votingTimeLeft: payload.votingTimeLeft,
        gameTimeLeft: payload.gameTimeLeft,
        winnerId: payload.winnerId,
      };

      if (payload.phase === 'finished' && localPlayer?.isInRoom) {
        setGame({
          ...baseGame,
          phase: 'waiting',
          winnerId: null,
          votingTimeLeft: VOTING_SECONDS,
          gameTimeLeft: PLAY_SECONDS,
          messages: [],
          players: players.map((player) => ({
            ...player,
            isOut: false,
            isInRoom: player.isInRoom,
            wordSlots: hiddenWordSlots(),
          })),
        });
        return;
      }

      setGame({
        ...baseGame,
      });

      if (!localPlayer) {
        setGame((prev) => {
          if (!prev) return prev;
          return { ...prev, localPlayerId: localPlayerId ?? '' };
        });
      }
    });

    return () => {
      roomUnsubRef.current?.();
      roomUnsubRef.current = null;
      stopHostTimers();
    };
  }, [
    db,
    localRoomId,
    localPlayerId,
    stopHostTimers,
    setRoomCleanupDisconnect,
    clearRoomCleanupDisconnect,
  ]);

  const startHostVotingTimer = useCallback(() => {
    if (!db || !localRoomId || !localPlayerId || hostVotingTimerRef.current) return;
    const roomRef = ref(db, roomPath(localRoomId));
    hostVotingTimerRef.current = setInterval(async () => {
      await runTransaction(roomRef, (current: DbRoom | null) => {
        if (!current || current.phase !== 'voting' || current.hostId !== localPlayerId) return current;
        const newLeft = Math.max(0, Number(current.votingTimeLeft || 0) - 1);
        if (newLeft > 0) {
          return { ...current, votingTimeLeft: newLeft };
        }

        const nextPlayers = resolveAllPlayerSlots(current.players, current.votes);
        return {
          ...current,
          phase: 'playing',
          votingTimeLeft: 0,
          gameTimeLeft: PLAY_SECONDS,
          players: nextPlayers,
          votes: {},
        };
      });
    }, 1000);
  }, [db, localPlayerId, localRoomId]);

  const startHostGameTimer = useCallback(() => {
    if (!db || !localRoomId || !localPlayerId || hostGameTimerRef.current) return;
    const roomRef = ref(db, roomPath(localRoomId));
    hostGameTimerRef.current = setInterval(async () => {
      await runTransaction(roomRef, (current: DbRoom | null) => {
        if (!current || current.phase !== 'playing' || current.hostId !== localPlayerId) return current;
        const next = Number(current.gameTimeLeft || 0) - 1;
        if (next > 0) {
          return { ...current, gameTimeLeft: next };
        }

        const alivePlayerIds = Object.entries(current.players ?? {}).filter(([, player]) => !player.isOut).map(([id]) => id);
        const winnerId = alivePlayerIds.length === 1 ? alivePlayerIds[0] : null;
        const nextPlayers = markPlayersInRoom(current.players ?? {}, false);
        return {
          ...current,
          phase: 'finished',
          players: nextPlayers,
          gameTimeLeft: 0,
          winnerId,
        };
      });
    }, 1000);
  }, [db, localPlayerId, localRoomId]);

  useEffect(() => {
    if (!game || !game.isHost || !localRoomId) {
      stopHostTimers();
      return;
    }

    if (game.phase === 'voting') {
      startHostVotingTimer();
    } else {
      stopHostTimers();
    }

    if (game.phase === 'playing') {
      startHostGameTimer();
    }

    return () => {
      stopHostTimers();
    };
  }, [game?.phase, game?.isHost, localRoomId, startHostVotingTimer, startHostGameTimer, stopHostTimers]);


  const createRoom = useCallback(
    async (title: string, visibility: RoomVisibility, maxPlayers: number, playerName: string) => {
      if (!db) return;
      const normalizedMaxPlayers = normalizeMaxPlayers(maxPlayers);
    const roomId = randomRoomId();
      const trimmedTitle = title.trim() || 'My Room';
      const normalizedPlayerName = sanitizePlayerName(playerName);
      const playerId = localPlayerStorageId();
      const payload: DbRoom = {
        title: trimmedTitle,
        visibility,
        maxPlayers: normalizedMaxPlayers,
        hostId: playerId,
        phase: 'waiting',
        winnerId: null,
        votingTimeLeft: VOTING_SECONDS,
        gameTimeLeft: PLAY_SECONDS,
        players: {
          [playerId]: {
            name: normalizedPlayerName,
            isOut: false,
            isBot: false,
            isInRoom: true,
            wordSlots: hiddenWordSlots(),
          },
        },
        messages: {},
        votes: {},
      };
      const roomsRef = ref(db, roomPath(roomId));
      await set(roomsRef, payload);
      await upsertUserProfile(playerId, normalizedPlayerName, roomId);
      void setDisconnectCleanup(roomId, playerId);
      void setRoomCleanupDisconnect(roomId);
      setLocalRoomId(roomId);
      setLocalPlayerId(playerId);
      stopHostTimers();
    },
    [db, stopHostTimers, upsertUserProfile, setDisconnectCleanup, setRoomCleanupDisconnect],
  );

  const addOrUpdatePlayerInRoom = useCallback(
    async (roomId: string, playerName: string) => {
      if (!db || !roomId) return false;
      const playerId = localPlayerStorageId();
      const normalizedName = sanitizePlayerName(playerName);
      const roomRef = ref(db, roomPath(roomId));
      const joinResult = await runTransaction(roomRef, (current: DbRoom | null) => {
        if (!current) return current;
        const players = current.players ?? {};
        if (!players[playerId]) {
          const currentCount = Object.keys(players).length;
          if (currentCount >= current.maxPlayers) {
            return;
          }
          players[playerId] = {
            name: normalizedName,
            isOut: false,
            isBot: false,
            isInRoom: true,
            wordSlots: hiddenWordSlots(),
          };
          current.players = players;
          return current;
        }
        players[playerId] = {
          ...players[playerId],
          isInRoom: true,
          name: normalizedName,
        };
        current.players = players;
        return current;
      });
      if (!joinResult.committed) return false;
      await upsertUserProfile(playerId, normalizedName, roomId);
      void setDisconnectCleanup(roomId, playerId);
      setLocalRoomId(roomId);
      setLocalPlayerId(playerId);
      return true;
    },
    [db, setDisconnectCleanup, upsertUserProfile],
  );

  const joinRoom = useCallback(
    async (roomId: string, playerName: string) => {
      await addOrUpdatePlayerInRoom(roomId, playerName);
    },
    [addOrUpdatePlayerInRoom],
  );

  const joinPrivateRoom = useCallback(
    async (roomId: string, playerName: string): Promise<'ok' | 'not-found' | 'full'> => {
      if (!db) return 'not-found';
      const roomRef = ref(db, roomPath(roomId.toUpperCase()));
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) return 'not-found';

      const room = snapshot.val() as DbRoom | null;
      if (!room) return 'not-found';
      if (Object.keys(room.players ?? {}).length >= room.maxPlayers) return 'full';

      const joined = await addOrUpdatePlayerInRoom(roomId.toUpperCase(), playerName);
      return joined ? 'ok' : 'full';
    },
    [addOrUpdatePlayerInRoom, db],
  );

  const startGame = useCallback(async () => {
    if (!db || !localRoomId || !localPlayerId) return;
    const roomRef = ref(db, roomPath(localRoomId));
    try {
      const result = await runTransaction(roomRef, (current: DbRoom | null) => {
        if (!current) return current;
        if (current.hostId !== localPlayerId) return current;
        if (current.phase !== 'waiting' && current.phase !== 'finished') return current;
        const inRoomPlayerIds = Object.entries(current.players ?? {}).filter(([, player]) => player.isInRoom !== false);
        if (inRoomPlayerIds.length < MIN_PLAYERS) return current;

        const allAssigned: string[] = [];
        const nextPlayers: Record<string, DbPlayer> = {};
        Object.entries(current.players).forEach(([id, player]) => {
          nextPlayers[id] = {
            ...player,
            isOut: false,
            isInRoom: true,
            wordSlots: buildWordSlots(allAssigned),
          };
        });
        return {
          ...current,
          phase: 'voting',
          winnerId: null,
          votingTimeLeft: VOTING_SECONDS,
          gameTimeLeft: PLAY_SECONDS,
          players: nextPlayers,
          messages: {},
          votes: {},
        };
      });

      if (!result.committed) {
        console.warn('Failed to start game (not committed).', {
          roomId: localRoomId,
          playerId: localPlayerId,
        });
      }
    } catch (error) {
      console.error('Failed to start game transaction.', {
        roomId: localRoomId,
        playerId: localPlayerId,
        code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : 'unknown',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [db, localPlayerId, localRoomId]);

  const restartGame = useCallback(async () => {
    if (!localRoomId || !localPlayerId || !game) return;
    if (db) {
      try {
        await set(ref(db, `${roomPath(localRoomId)}/players/${localPlayerId}/isInRoom`), true);
      } catch (error) {
        console.error('Failed to mark player as in room', error);
      }
    }
  }, [db, game, localPlayerId, localRoomId]);

  const leaveRoom = useCallback(async () => {
    if (!db || !localRoomId || !localPlayerId) {
      void clearDisconnectCleanup();
      setGame(null);
      setLocalRoomId(null);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    await clearDisconnectCleanup();

    await runTransaction(ref(db, roomPath(localRoomId)), (current: DbRoom | null) => {
      if (!current) return current;
      const players = { ...current.players };
      const votes = { ...(current.votes ?? {}) };

      if (!players[localPlayerId]) return current;
      delete players[localPlayerId];
      Object.keys(votes).forEach((targetId) => {
        if (votes[targetId]?.[String(localPlayerId)]) {
          delete votes[targetId][String(localPlayerId)];
        }
      });
      delete votes[localPlayerId];

      if (Object.keys(players).length === 0) {
        return null;
      }

      const nextHostId = firstPlayerId(players);
      const shouldRotateHost = current.hostId === localPlayerId || !(current.hostId in players);
      if (shouldRotateHost && nextHostId) {
        return {
          ...current,
          hostId: nextHostId,
          players,
          votes,
        };
      }

      return {
        ...current,
        players,
        votes,
      };
    });

    stopHostTimers();
    setSttActive(false);
    setSttInterim('');
    setGame(null);
    setLocalRoomId(null);
  }, [clearDisconnectCleanup, db, localPlayerId, localRoomId, stopHostTimers]);

  const castVote = useCallback(
    async (
      targetPlayerId: string,
      slotIndex: number,
      wordIndex: number,
    ) => {
      if (!db || !localRoomId || !localPlayerId || !game || game.phase !== 'voting') return;
      if (!Number.isInteger(wordIndex) || wordIndex < 0 || wordIndex >= CANDIDATES_PER_SLOT) return;
      if (!Number.isInteger(slotIndex) || slotIndex < 0) return;
      if (targetPlayerId === localPlayerId) return;
      const voteRef = ref(
        db,
        `${roomPath(localRoomId)}/votes/${targetPlayerId}/${slotIndex}/${localPlayerId}`,
      );
      await set(voteRef, wordIndex);
    },
    [db, game, localPlayerId, localRoomId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!db || !localRoomId || !localPlayerId || !game || game.phase !== 'playing') return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const localPlayer = game.players.find((p) => p.id === localPlayerId);
      if (!localPlayer || localPlayer.isOut) return;

      const roomMessagesRef = ref(db, `${roomPath(localRoomId)}/messages`);
      const messageRef = push(roomMessagesRef);
      if (!messageRef.key) return;
      setSttError(null);

      const triggeredWord = findTriggeredWordFromState(game.players, localPlayerId, trimmed);
      const message: DsiChatMessage = {
        id: messageRef.key,
        playerId: localPlayerId,
        playerName: localPlayer.name,
        text: trimmed,
        timestamp: Date.now(),
        ...(triggeredWord ? { triggeredWord } : {}),
      };

      try {
        await set(messageRef, message);
      } catch (error) {
        console.error('Failed to send message', error);
        setSttError('Failed to send message. Check your Firebase DB permissions.');
        return;
      }

      if (!triggeredWord) return;

      const result = await runTransaction(ref(db, roomPath(localRoomId)), (current: DbRoom | null) => {
        if (!current || current.phase !== 'playing') return current;
        const currentPlayer = current.players?.[localPlayerId];
        if (!currentPlayer || currentPlayer.isOut) return current;

        const nextPlayers: Record<string, DbPlayer> = { ...(current.players ?? {}) };
        nextPlayers[localPlayerId] = { ...currentPlayer, isOut: true };

        const activePlayerIds = Object.entries(nextPlayers).filter(([, p]) => !p.isOut).map(([id]) => id);
        if (activePlayerIds.length <= 1) {
          const finishedPlayers = markPlayersInRoom(nextPlayers, false);
          return {
            ...current,
            players: finishedPlayers,
            phase: 'finished',
            gameTimeLeft: 0,
            winnerId: activePlayerIds[0] ?? null,
          };
        }

        return {
          ...current,
          players: nextPlayers,
        };
      });

      if (!result.committed) {
        console.error('Failed to update player status for trigger message', result);
      }
    },
    [db, localPlayerId, localRoomId, game],
  );

  const stopStt = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
    setSttActive(false);
    setSttInterim('');
  }, []);

  const startStt = useCallback(() => {
    if (!game || !sttSupported || !db) return;
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
        void sendMessage(finalText.trim());
      }
    };

    recognition.onerror = () => {
      setSttError('Microphone access denied or speech recognition unavailable.');
      stopStt();
    };
    recognition.onend = () => {
      setSttActive((active) => {
        if (active) {
          recognition.start();
        }
        return active;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
    setSttActive(true);
  }, [db, game, sendMessage, stopStt, sttSupported]);

  const toggleStt = useCallback(() => {
    if (sttActive) stopStt();
    else startStt();
  }, [sttActive, startStt, stopStt]);

  useEffect(() => {
    if (game?.phase !== 'playing' || !sttSupported) {
      stopStt();
      return;
    }
    if (!sttActive) {
      startStt();
    }
    return () => {
      stopStt();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.phase, sttSupported]);

  useEffect(() => {
    if (game?.phase === 'finished') {
      void archiveFinishedGame(game);
    }
  }, [game?.phase, game?.roomId, archiveFinishedGame]);

  return {
    rooms,
    createRoom,
    joinRoom,
    joinPrivateRoom,
    leaveRoom,
    startGame,
    restartGame,
    game,
    sendMessage,
    castVote,
    sttSupported,
    sttActive,
    sttError,
    toggleStt,
    sttInterim,
  };
}
