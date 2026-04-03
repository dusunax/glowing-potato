// WebRTC hook for camera video sharing in the "Don't Say It" game.
// Uses Firebase Realtime Database for WebRTC signaling (offer / answer / ICE).

import { useCallback, useEffect, useRef, useState } from 'react';
import { onChildAdded, onValue, push, ref, remove, set } from 'firebase/database';
import { getRealtimeDb } from '../lib/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RTDB_ROOMS_BASE = 'games/dont_say_it/rooms';

const STUN_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function webrtcRoot(roomId: string) {
  return `${RTDB_ROOMS_BASE}/${roomId}/webrtc`;
}

/** Deterministic call key: lexicographically smaller ID first, separated by __ */
function callKey(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

/** The player with the smaller ID always creates the WebRTC offer. */
function isOfferer(localId: string, remoteId: string): boolean {
  return localId < remoteId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseWebRtcResult {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  cameraEnabled: boolean;
  cameraError: string | null;
  toggleCamera: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useWebRTC(
  roomId: string | null,
  localPlayerId: string | null,
): UseWebRtcResult {
  const db = getRealtimeDb();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stable refs – mutated without triggering re-renders
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const signalUnsubsRef = useRef<Array<() => void>>([]);

  // ── Close one peer connection ───────────────────────────────────────────────

  const closePc = useCallback(
    (remoteId: string, cleanSignals: boolean) => {
      const pc = pcsRef.current.get(remoteId);
      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.close();
        pcsRef.current.delete(remoteId);
      }
      setRemoteStreams((prev) => {
        if (!prev.has(remoteId)) return prev;
        const next = new Map(prev);
        next.delete(remoteId);
        return next;
      });
      if (cleanSignals && db && roomId && localPlayerId) {
        const key = callKey(localPlayerId, remoteId);
        remove(ref(db, `${webrtcRoot(roomId)}/signals/${key}`)).catch(() => {});
      }
    },
    [db, roomId, localPlayerId],
  );

  // ── Stop camera + all peer connections ─────────────────────────────────────

  const stopAll = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setCameraEnabled(false);
    setRemoteStreams(new Map());

    signalUnsubsRef.current.forEach((unsub) => unsub());
    signalUnsubsRef.current = [];

    const remoteIds = [...pcsRef.current.keys()];
    remoteIds.forEach((id) => closePc(id, true));

    if (db && roomId && localPlayerId) {
      await remove(ref(db, `${webrtcRoot(roomId)}/cameraStates/${localPlayerId}`)).catch(() => {});
    }
  }, [db, roomId, localPlayerId, closePc]);

  // ── Create a peer connection with one remote player ─────────────────────────

  const createPc = useCallback(
    async (remoteId: string) => {
      if (!db || !roomId || !localPlayerId) return;
      if (pcsRef.current.has(remoteId)) return; // already connected

      const key = callKey(localPlayerId, remoteId);
      const offerer = isOfferer(localPlayerId, remoteId);

      const localIcePath = offerer
        ? `${webrtcRoot(roomId)}/signals/${key}/callerCandidates`
        : `${webrtcRoot(roomId)}/signals/${key}/calleeCandidates`;
      const remoteIcePath = offerer
        ? `${webrtcRoot(roomId)}/signals/${key}/calleeCandidates`
        : `${webrtcRoot(roomId)}/signals/${key}/callerCandidates`;

      const pc = new RTCPeerConnection(STUN_CONFIG);
      pcsRef.current.set(remoteId, pc);

      // Attach local video track
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) =>
          pc.addTrack(track, localStreamRef.current!),
        );
      }

      // Remote track → update state
      pc.ontrack = (ev) => {
        const stream = ev.streams[0];
        if (stream) {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.set(remoteId, stream);
            return next;
          });
        }
      };

      // Local ICE candidates → push to Firebase
      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          push(ref(db, localIcePath), ev.candidate.toJSON()).catch(() => {});
        }
      };

      // Helper: subscribe to remote ICE candidates via onChildAdded so that
      // both pre-existing and future candidates are delivered exactly once.
      function listenForRemoteIce() {
        const unsubIce = onChildAdded(ref(db, remoteIcePath), (snap) => {
          if (!snap.exists() || pc.signalingState === 'closed') return;
          pc.addIceCandidate(new RTCIceCandidate(snap.val() as RTCIceCandidateInit)).catch(() => {});
        });
        signalUnsubsRef.current.push(unsubIce);
      }

      if (offerer) {
        // Create offer → Firebase, then wait for answer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await set(ref(db, `${webrtcRoot(roomId)}/signals/${key}/offer`), {
          type: offer.type,
          sdp: offer.sdp,
        });

        const unsubAnswer = onValue(
          ref(db, `${webrtcRoot(roomId)}/signals/${key}/answer`),
          async (snap) => {
            if (!snap.exists() || pc.remoteDescription || pc.signalingState === 'closed') return;
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(snap.val() as RTCSessionDescriptionInit),
              );
              // Start listening for callee ICE only after remoteDescription is set
              listenForRemoteIce();
            } catch (err) {
              console.warn('[WebRTC] Failed to set remote description (answer):', err);
            }
          },
        );
        signalUnsubsRef.current.push(unsubAnswer);
      } else {
        // Wait for offer → create answer → Firebase
        const unsubOffer = onValue(
          ref(db, `${webrtcRoot(roomId)}/signals/${key}/offer`),
          async (snap) => {
            if (!snap.exists() || pc.remoteDescription || pc.signalingState === 'closed') return;
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(snap.val() as RTCSessionDescriptionInit),
              );
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await set(ref(db, `${webrtcRoot(roomId)}/signals/${key}/answer`), {
                type: answer.type,
                sdp: answer.sdp,
              });
              // Start listening for caller ICE only after remoteDescription is set
              listenForRemoteIce();
            } catch (err) {
              console.warn('[WebRTC] Failed to handle offer / create answer:', err);
            }
          },
        );
        signalUnsubsRef.current.push(unsubOffer);
      }
    },
    [db, roomId, localPlayerId],
  );

  // ── Listen for remote camera-state changes ──────────────────────────────────

  useEffect(() => {
    if (!db || !roomId || !localPlayerId || !cameraEnabled) return;

    const unsub = onValue(
      ref(db, `${webrtcRoot(roomId)}/cameraStates`),
      (snap) => {
        const states: Record<string, boolean> = snap.exists() ? snap.val() : {};

        // Initiate connections with newly enabled cameras
        Object.entries(states).forEach(([pid, enabled]) => {
          if (pid !== localPlayerId && enabled && !pcsRef.current.has(pid)) {
            createPc(pid);
          }
        });

        // Close connections for players who disabled their camera
        [...pcsRef.current.keys()].forEach((pid) => {
          if (!states[pid]) closePc(pid, false);
        });
      },
    );

    return () => unsub();
  }, [db, roomId, localPlayerId, cameraEnabled, createPc, closePc]);

  // ── Auto-stop when room is left ─────────────────────────────────────────────

  useEffect(() => {
    if ((!roomId || !localPlayerId) && localStreamRef.current) {
      stopAll();
    }
  }, [roomId, localPlayerId, stopAll]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    // Capture the Map reference at mount time. The Map is mutated in-place
    // (never replaced), so pcs.values() at cleanup time reflects all connections.
    const pcs = pcsRef.current;
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      signalUnsubsRef.current.forEach((unsub) => unsub());
      [...pcs.values()].forEach((pc) => pc.close());
      // Best-effort cleanup of camera state in Firebase
      if (db && roomId && localPlayerId) {
        remove(ref(db, `${webrtcRoot(roomId)}/cameraStates/${localPlayerId}`)).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty – run only on unmount

  // ── Public toggle ───────────────────────────────────────────────────────────

  const toggleCamera = useCallback(async () => {
    if (!db || !roomId || !localPlayerId) return;

    if (cameraEnabled) {
      await stopAll();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCameraEnabled(true);
        setCameraError(null);
        // Publishing camera state triggers connections from other enabled players
        await set(ref(db, `${webrtcRoot(roomId)}/cameraStates/${localPlayerId}`), true);
      } catch {
        setCameraError('카메라 접근이 거부되었거나 사용할 수 없습니다.');
      }
    }
  }, [db, roomId, localPlayerId, cameraEnabled, stopAll]);

  return { localStream, remoteStreams, cameraEnabled, cameraError, toggleCamera };
}
