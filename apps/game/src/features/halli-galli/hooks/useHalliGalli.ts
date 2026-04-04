// Realtime Firebase implementation for the Halli Galli mini-game.
// All room/player state is synchronized through Realtime Database.
// Firestore is used for the win-record leaderboard.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  onValue,
  ref,
  onDisconnect,
  get,
  runTransaction,
  set,
  remove,
  update,
} from 'firebase/database';
import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import type {
  HgRoomSummary,
  HgPlayer,
  HgGameState,
  HgGamePhase,
  RoomVisibility,
} from '../types';
import { findWinningFruit, generatePlayerDeck, cardToCode } from '../data/cards';
import {
  getFirestoreDb,
  getRealtimeDb,
} from '../lib/firebase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAY_SECONDS = 90;
const MIN_PLAYERS = 2;
const BELL_CLEAR_DELAY_MS = 1800; // how long the bell-result overlay stays
const ROOM_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DECK_SIZE = 20; // 4 fruits × 5 counts
const RTDB_GAME_PATH = 'games/halli_galli';
const RTDB_ROOMS_PATH = `${RTDB_GAME_PATH}/rooms`;
const FIRESTORE_HISTORY_COLLECTION = 'game_histories';
const FIRESTORE_HISTORY_GAME_TYPE = 'halli_galli';
const LEADERBOARD_RECORD_COLLECTION = 'records';
const HALLI_GALLI_GAME_ID = 'halli-galli';

// ---------------------------------------------------------------------------
// Database shapes
// ---------------------------------------------------------------------------

interface DbPlayer {
  name: string;
  topCard: string | null;
  deckIndex: number;
  score: number;
  isInRoom: boolean;
}

interface DbBellRing {
  playerId: string;
  timestamp: number;
}

interface DbBellResult {
  playerId: string;
  isCorrect: boolean;
  fruit: string | null;
  resolvedAt: number;
}

interface DbRoom {
  title: string;
  visibility: RoomVisibility;
  maxPlayers: number;
  hostId: string;
  phase: HgGamePhase;
  winnerId: string | null;
  gameTimeLeft: number;
  gameSeed: string;
  players: Record<string, DbPlayer>;
  bellRing?: DbBellRing | null;
  bellResult?: DbBellResult | null;
}

type DbRooms = Record<string, DbRoom>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRoomId(): string {
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)];
  }
  return id;
}

function generateSeed(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function mapDbPlayerToHgPlayer(id: string, p: DbPlayer): HgPlayer {
  return {
    id,
    name: p.name,
    topCard: p.topCard ?? null,
    deckCount: Math.max(0, DECK_SIZE - (p.deckIndex ?? 0)),
    deckIndex: p.deckIndex ?? 0,
    score: p.score ?? 0,
    isInRoom: p.isInRoom !== false,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHalliGalli(currentUserId: string | null) {
  const [rooms, setRooms] = useState<HgRoomSummary[]>([]);
  const [game, setGame] = useState<HgGameState | null>(null);

  const localRoomId = useRef<string | null>(null);
  const localPlayerId = useRef<string | null>(null);

  // The host's interval for decrementing the game timer
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Prevents archiving the game result more than once
  const archivedRooms = useRef<Set<string>>(new Set());
  // Tracks bell resolution to avoid double-processing
  const resolvedBells = useRef<Set<number>>(new Set());

  // Per-client local deck (generated from gameSeed + localPlayerId)
  const localDeckRef = useRef<ReturnType<typeof generatePlayerDeck> | null>(null);
  const localDeckSeedRef = useRef<string>('');

  // ---------------------------------------------------------------------------
  // Public rooms subscription (lobby)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const db = getRealtimeDb();
    if (!db) return;
    const roomsRef = ref(db, RTDB_ROOMS_PATH);
    const unsub = onValue(roomsRef, (snap) => {
      if (!snap.exists()) {
        setRooms([]);
        return;
      }
      const raw = snap.val() as DbRooms;
      const summaries: HgRoomSummary[] = Object.entries(raw)
        .filter(([, room]) => room.visibility === 'public')
        .map(([id, room]) => ({
          id,
          title: room.title,
          visibility: room.visibility,
          playerCount: Object.values(room.players ?? {}).filter((p) => p.isInRoom !== false).length,
          maxPlayers: room.maxPlayers,
        }));
      setRooms(summaries);
    });
    return () => unsub();
  }, []);

  // ---------------------------------------------------------------------------
  // Room subscription (in-game)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const db = getRealtimeDb();
    const roomId = localRoomId.current;
    const playerId = localPlayerId.current;
    if (!db || !roomId || !playerId) return;

    const roomRef = ref(db, `${RTDB_ROOMS_PATH}/${roomId}`);
    const unsub = onValue(roomRef, (snap) => {
      if (!snap.exists()) {
        // Room was deleted – return to lobby
        setGame(null);
        localRoomId.current = null;
        localPlayerId.current = null;
        return;
      }
      const raw = snap.val() as DbRoom;
      const players = Object.entries(raw.players ?? {}).map(([id, p]) =>
        mapDbPlayerToHgPlayer(id, p),
      );

      // Generate local deck when game starts
      if (raw.gameSeed && raw.gameSeed !== localDeckSeedRef.current) {
        localDeckSeedRef.current = raw.gameSeed;
        localDeckRef.current = generatePlayerDeck(raw.gameSeed, playerId);
      }

      const gameState: HgGameState = {
        phase: raw.phase,
        roomId,
        roomTitle: raw.title,
        roomVisibility: raw.visibility,
        hostId: raw.hostId,
        localPlayerId: playerId,
        isHost: raw.hostId === playerId,
        maxPlayers: raw.maxPlayers,
        players,
        gameTimeLeft: raw.gameTimeLeft ?? 0,
        winnerId: raw.winnerId ?? null,
        bellRing: raw.bellRing ?? null,
        bellResult: raw.bellResult ?? null,
        gameSeed: raw.gameSeed ?? '',
      };
      setGame(gameState);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRoomId.current, localPlayerId.current]);

  // ---------------------------------------------------------------------------
  // Host: bell resolution
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const db = getRealtimeDb();
    if (!game || !db) return;
    if (!game.isHost) return;
    if (!game.bellRing) return;
    if (game.bellResult) return; // already resolved
    if (game.phase !== 'playing') return;

    const { bellRing } = game;
    if (resolvedBells.current.has(bellRing.timestamp)) return;
    resolvedBells.current.add(bellRing.timestamp);

    const topCards = game.players.map((p) => p.topCard);
    const winningFruit = findWinningFruit(topCards);
    const isCorrect = winningFruit !== null;
    const ringer = game.players.find((p) => p.id === bellRing.playerId);
    if (!ringer) return;

    const roomRef = ref(db, `${RTDB_ROOMS_PATH}/${game.roomId}`);

    const resolveBell = async () => {
      // Write result
      const result: DbBellResult = {
        playerId: bellRing.playerId,
        isCorrect,
        fruit: winningFruit,
        resolvedAt: Date.now(),
      };

      const updates: Record<string, unknown> = {
        bellResult: result,
      };

      // Update score
      if (isCorrect) {
        updates[`players/${bellRing.playerId}/score`] = (ringer.score ?? 0) + 1;
      } else {
        updates[`players/${bellRing.playerId}/score`] = Math.max(0, (ringer.score ?? 0) - 1);
      }

      await update(roomRef, updates);

      // After overlay delay: clear table cards and bell state
      setTimeout(async () => {
        const clearUpdates: Record<string, unknown> = {
          bellRing: null,
          bellResult: null,
        };
        for (const player of game.players) {
          if (player.isInRoom) {
            clearUpdates[`players/${player.id}/topCard`] = null;
          }
        }
        await update(roomRef, clearUpdates);
      }, BELL_CLEAR_DELAY_MS);
    };

    resolveBell().catch(console.error);
  }, [game]);

  // ---------------------------------------------------------------------------
  // Host: game timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const db = getRealtimeDb();
    if (!game || !db) return;
    if (!game.isHost || game.phase !== 'playing') {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    if (timerIntervalRef.current !== null) return; // already running

    const roomRef = ref(db, `${RTDB_ROOMS_PATH}/${game.roomId}`);
    const intervalId = setInterval(async () => {
      const snap = await get(roomRef);
      if (!snap.exists()) {
        clearInterval(intervalId);
        timerIntervalRef.current = null;
        return;
      }
      const raw = snap.val() as DbRoom;
      if (raw.phase !== 'playing') {
        clearInterval(intervalId);
        timerIntervalRef.current = null;
        return;
      }

      const newTime = (raw.gameTimeLeft ?? 0) - 1;
      if (newTime <= 0) {
        clearInterval(intervalId);
        timerIntervalRef.current = null;
        await finishGame(raw);
      } else {
        await update(roomRef, { gameTimeLeft: newTime });
      }
    }, 1000);
    timerIntervalRef.current = intervalId;

    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.isHost, game?.phase, game?.roomId]);

  // ---------------------------------------------------------------------------
  // Host: finish game
  // ---------------------------------------------------------------------------

  const finishGame = useCallback(
    async (raw: DbRoom) => {
      const db = getRealtimeDb();
      if (!db || !localRoomId.current) return;

      const players = Object.entries(raw.players ?? {}).map(([id, p]) =>
        mapDbPlayerToHgPlayer(id, p),
      );
      const inRoom = players.filter((p) => p.isInRoom);
      const winner =
        inRoom.length > 0
          ? inRoom.reduce((best, p) => (p.score > best.score ? p : best))
          : null;

      const roomRef = ref(db, `${RTDB_ROOMS_PATH}/${localRoomId.current}`);
      await update(roomRef, {
        phase: 'finished' as HgGamePhase,
        winnerId: winner?.id ?? null,
        gameTimeLeft: 0,
        bellRing: null,
        bellResult: null,
      });

      archiveGame(raw, players, winner?.id ?? null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---------------------------------------------------------------------------
  // Archive game to Firestore
  // ---------------------------------------------------------------------------

  const archiveGame = useCallback(
    (raw: DbRoom, players: HgPlayer[], winnerId: string | null) => {
      const db = getFirestoreDb();
      const roomId = localRoomId.current;
      const myId = localPlayerId.current;
      if (!db || !roomId || archivedRooms.current.has(roomId)) return;
      archivedRooms.current.add(roomId);

      const historyDoc = doc(db, FIRESTORE_HISTORY_COLLECTION, FIRESTORE_HISTORY_GAME_TYPE, 'rooms', roomId);
      setDoc(historyDoc, {
        gameType: FIRESTORE_HISTORY_GAME_TYPE,
        roomId,
        roomTitle: raw.title,
        roomVisibility: raw.visibility,
        maxPlayers: raw.maxPlayers,
        hostId: raw.hostId,
        winnerId,
        players: players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
        recordedAt: serverTimestamp(),
        endedAt: Date.now(),
      }).catch(console.error);

      // Record win for the local player if they won
      if (myId && winnerId === myId && currentUserId) {
        const recordRef = doc(
          db,
          FIRESTORE_HISTORY_COLLECTION,
          FIRESTORE_HISTORY_GAME_TYPE,
          LEADERBOARD_RECORD_COLLECTION,
          currentUserId,
        );
        const localPlayer = players.find((p) => p.id === myId);
        setDoc(
          recordRef,
          {
            userId: currentUserId,
            nickname: localPlayer?.name ?? '',
            gameId: HALLI_GALLI_GAME_ID,
            score: increment(1),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        ).catch(console.error);
      }
    },
    [currentUserId],
  );

  // ---------------------------------------------------------------------------
  // Archive trigger for non-host clients when phase → finished
  // ---------------------------------------------------------------------------

  const prevPhaseRef = useRef<HgGamePhase | null>(null);

  useEffect(() => {
    if (!game) return;
    if (game.phase === 'finished' && prevPhaseRef.current !== 'finished') {
      if (!game.isHost) {
        // Non-host: archive only their own win record
        const db = getFirestoreDb();
        const roomId = localRoomId.current;
        const myId = localPlayerId.current;
        if (
          db &&
          roomId &&
          myId &&
          currentUserId &&
          game.winnerId === myId &&
          !archivedRooms.current.has(roomId + '-win')
        ) {
          archivedRooms.current.add(roomId + '-win');
          const localPlayer = game.players.find((p) => p.id === myId);
          const recordRef = doc(
            db,
            FIRESTORE_HISTORY_COLLECTION,
            FIRESTORE_HISTORY_GAME_TYPE,
            LEADERBOARD_RECORD_COLLECTION,
            currentUserId,
          );
          setDoc(
            recordRef,
            {
              userId: currentUserId,
              nickname: localPlayer?.name ?? '',
              gameId: HALLI_GALLI_GAME_ID,
              score: increment(1),
              createdAt: serverTimestamp(),
            },
            { merge: true },
          ).catch(console.error);
        }
      }
    }
    prevPhaseRef.current = game.phase;
  }, [game, currentUserId]);

  // ---------------------------------------------------------------------------
  // Public actions
  // ---------------------------------------------------------------------------

  const createRoom = useCallback(
    async (title: string, visibility: RoomVisibility, maxPlayers: number, playerName: string) => {
      const db = getRealtimeDb();
      if (!db) return;

      let roomId = generateRoomId();
      // Ensure unique ID
      for (let tries = 0; tries < 5; tries++) {
        const exists = (await get(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`))).exists();
        if (!exists) break;
        roomId = generateRoomId();
      }

      const playerId = currentUserId ?? `guest-${generateRoomId()}`;
      const room: DbRoom = {
        title: title.trim() || 'My Room',
        visibility,
        maxPlayers,
        hostId: playerId,
        phase: 'waiting',
        winnerId: null,
        gameTimeLeft: PLAY_SECONDS,
        gameSeed: '',
        players: {
          [playerId]: {
            name: playerName,
            topCard: null,
            deckIndex: 0,
            score: 0,
            isInRoom: true,
          },
        },
      };

      await set(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`), room);

      // Mark player as disconnected on close
      onDisconnect(ref(db, `${RTDB_ROOMS_PATH}/${roomId}/players/${playerId}/isInRoom`)).set(false);

      localRoomId.current = roomId;
      localPlayerId.current = playerId;

      // Subscribe to the room
      subscribeToRoom(roomId, playerId);
    },
    [currentUserId],
  );

  const joinRoom = useCallback(
    async (roomId: string, playerName: string) => {
      const db = getRealtimeDb();
      if (!db) return;

      const playerId = currentUserId ?? `guest-${generateRoomId()}`;
      const playerRef = ref(db, `${RTDB_ROOMS_PATH}/${roomId}/players/${playerId}`);
      await set(playerRef, {
        name: playerName,
        topCard: null,
        deckIndex: 0,
        score: 0,
        isInRoom: true,
      });
      onDisconnect(ref(db, `${RTDB_ROOMS_PATH}/${roomId}/players/${playerId}/isInRoom`)).set(false);

      localRoomId.current = roomId;
      localPlayerId.current = playerId;
      subscribeToRoom(roomId, playerId);
    },
    [currentUserId],
  );

  const joinPrivateRoom = useCallback(
    async (roomId: string, playerName: string): Promise<'ok' | 'not-found' | 'full'> => {
      const db = getRealtimeDb();
      if (!db) return 'not-found';

      const snap = await get(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`));
      if (!snap.exists()) return 'not-found';

      const raw = snap.val() as DbRoom;
      const activePlayers = Object.values(raw.players ?? {}).filter((p) => p.isInRoom !== false);
      if (activePlayers.length >= raw.maxPlayers) return 'full';

      await joinRoom(roomId, playerName);
      return 'ok';
    },
    [joinRoom],
  );

  const leaveRoom = useCallback(async () => {
    const db = getRealtimeDb();
    const roomId = localRoomId.current;
    const playerId = localPlayerId.current;
    if (!db || !roomId || !playerId) return;

    // Stop timer
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const roomRef = ref(db, `${RTDB_ROOMS_PATH}/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      setGame(null);
      localRoomId.current = null;
      localPlayerId.current = null;
      return;
    }

    const raw = snap.val() as DbRoom;
    const remaining = Object.entries(raw.players ?? {}).filter(
      ([id, p]) => id !== playerId && p.isInRoom !== false,
    );

    if (remaining.length === 0) {
      // Last player – delete the room
      await remove(roomRef);
    } else {
      const updates: Record<string, unknown> = {
        [`players/${playerId}/isInRoom`]: false,
      };
      // Elect new host if needed
      if (raw.hostId === playerId) {
        const [[newHostId]] = remaining;
        updates['hostId'] = newHostId;
      }
      await update(roomRef, updates);
    }

    setGame(null);
    localRoomId.current = null;
    localPlayerId.current = null;
    localDeckRef.current = null;
    localDeckSeedRef.current = '';
  }, []);

  const startGame = useCallback(async () => {
    const db = getRealtimeDb();
    const roomId = localRoomId.current;
    const playerId = localPlayerId.current;
    if (!db || !roomId || !playerId) return;

    const snap = await get(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`));
    if (!snap.exists()) return;
    const raw = snap.val() as DbRoom;
    if (raw.hostId !== playerId) return;

    const activePlayers = Object.entries(raw.players ?? {}).filter(([, p]) => p.isInRoom !== false);
    if (activePlayers.length < MIN_PLAYERS) return;

    const gameSeed = generateSeed();
    const resetPlayers: Record<string, unknown> = {};
    for (const [id] of activePlayers) {
      resetPlayers[`players/${id}/topCard`] = null;
      resetPlayers[`players/${id}/deckIndex`] = 0;
      resetPlayers[`players/${id}/score`] = 0;
    }

    await update(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`), {
      phase: 'playing' as HgGamePhase,
      gameSeed,
      gameTimeLeft: PLAY_SECONDS,
      winnerId: null,
      bellRing: null,
      bellResult: null,
      ...resetPlayers,
    });
  }, []);

  const flipCard = useCallback(async () => {
    const db = getRealtimeDb();
    const roomId = localRoomId.current;
    const playerId = localPlayerId.current;
    if (!db || !roomId || !playerId) return;

    const snap = await get(ref(db, `${RTDB_ROOMS_PATH}/${roomId}/players/${playerId}`));
    if (!snap.exists()) return;
    const playerData = snap.val() as DbPlayer;

    // Can only flip when no card is showing and deck has cards left
    if (playerData.topCard !== null) return;
    const currentIndex = playerData.deckIndex ?? 0;
    if (currentIndex >= DECK_SIZE) return;

    // Ensure local deck is ready
    const roomSnap = await get(ref(db, `${RTDB_ROOMS_PATH}/${roomId}/gameSeed`));
    const seed = roomSnap.val() as string;
    if (seed && seed !== localDeckSeedRef.current) {
      localDeckSeedRef.current = seed;
      localDeckRef.current = generatePlayerDeck(seed, playerId);
    }

    if (!localDeckRef.current) return;
    const card = localDeckRef.current[currentIndex];
    if (!card) return;

    await runTransaction(ref(db, `${RTDB_ROOMS_PATH}/${roomId}/players/${playerId}`), (data) => {
      if (!data) return data;
      if (data.topCard !== null) return; // abort: another flip already happened
      return {
        ...data,
        topCard: cardToCode(card),
        deckIndex: currentIndex + 1,
      };
    });
  }, []);

  const ringBell = useCallback(async () => {
    const db = getRealtimeDb();
    const roomId = localRoomId.current;
    const playerId = localPlayerId.current;
    if (!db || !roomId || !playerId) return;

    const snap = await get(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`));
    if (!snap.exists()) return;
    const raw = snap.val() as DbRoom;
    if (raw.phase !== 'playing') return;
    if (raw.bellRing) return; // bell already ringing

    const bellRing: DbBellRing = { playerId, timestamp: Date.now() };
    await update(ref(db, `${RTDB_ROOMS_PATH}/${roomId}`), { bellRing });
  }, []);

  const restartGame = useCallback(async () => {
    const db = getRealtimeDb();
    const roomId = localRoomId.current;
    const playerId = localPlayerId.current;
    if (!db || !roomId || !playerId) return;

    await update(ref(db, `${RTDB_ROOMS_PATH}/${roomId}/players/${playerId}`), {
      isInRoom: true,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Internal: subscribe to room (sets up onValue listener & re-attaches onDisconnect)
  // ---------------------------------------------------------------------------

  const subscribeToRoom = useCallback((roomId: string, playerId: string) => {
    const db = getRealtimeDb();
    if (!db) return;

    const roomRef = ref(db, `${RTDB_ROOMS_PATH}/${roomId}`);
    const unsub = onValue(roomRef, (snap) => {
      if (!snap.exists()) {
        setGame(null);
        localRoomId.current = null;
        localPlayerId.current = null;
        return;
      }
      const raw = snap.val() as DbRoom;
      if (raw.gameSeed && raw.gameSeed !== localDeckSeedRef.current) {
        localDeckSeedRef.current = raw.gameSeed;
        localDeckRef.current = generatePlayerDeck(raw.gameSeed, playerId);
      }

      const players = Object.entries(raw.players ?? {}).map(([id, p]) =>
        mapDbPlayerToHgPlayer(id, p),
      );
      const gameState: HgGameState = {
        phase: raw.phase,
        roomId,
        roomTitle: raw.title,
        roomVisibility: raw.visibility,
        hostId: raw.hostId,
        localPlayerId: playerId,
        isHost: raw.hostId === playerId,
        maxPlayers: raw.maxPlayers,
        players,
        gameTimeLeft: raw.gameTimeLeft ?? 0,
        winnerId: raw.winnerId ?? null,
        bellRing: raw.bellRing ?? null,
        bellResult: raw.bellResult ?? null,
        gameSeed: raw.gameSeed ?? '',
      };
      setGame(gameState);
    });

    // Cleanup on unmount
    return unsub;
  }, []);

  return {
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
  };
}
