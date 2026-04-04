// Room lobby for Halli Galli. Shows public rooms, create-room form,
// and join-by-code form for private rooms.

import { useState, useEffect, useRef } from 'react';
import type { HgRoomSummary, RoomVisibility } from '../types';
import { Button, Card, CardHeader, CardBody, CardTitle, CardDescription } from '@glowing-potato/ui';
import type { NicknameUpdateResult } from '../../../hooks/useAuth';

const LOCAL_STORAGE_KEY = 'hg-player-name';
const MAX_ROOM_TITLE = 30;

interface RoomLobbyProps {
  rooms: HgRoomSummary[];
  onJoinRoom: (roomId: string, playerName: string) => void;
  onJoinPrivate: (
    roomId: string,
    playerName: string,
  ) => 'ok' | 'not-found' | 'full' | Promise<'ok' | 'not-found' | 'full'>;
  onCreateRoom: (
    title: string,
    visibility: RoomVisibility,
    maxPlayers: number,
    playerName: string,
  ) => void;
  onBack: () => void;
  nickname?: string;
  onSignOut?: () => void;
  onUpdateNickname?: (nickname: string) => Promise<NicknameUpdateResult>;
}

export function RoomLobby({
  rooms,
  onJoinRoom,
  onJoinPrivate,
  onCreateRoom,
  onBack,
  nickname,
  onSignOut,
  onUpdateNickname,
}: RoomLobbyProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState<RoomVisibility>('public');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [privateId, setPrivateId] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Local name used when no authenticated nickname is available
  const [localName, setLocalName] = useState(() => {
    if (typeof window === 'undefined') return '플레이어';
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '플레이어';
  });

  // Prefer the authenticated nickname if present
  const playerName = nickname ?? localName;

  const createTitleRef = useRef<HTMLInputElement | null>(null);
  const joinPrivateRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !nickname) {
      localStorage.setItem(LOCAL_STORAGE_KEY, localName.trim() || '플레이어');
    }
  }, [localName, nickname]);

  useEffect(() => {
    if (showCreate) createTitleRef.current?.focus();
  }, [showCreate]);

  useEffect(() => {
    if (showJoinPrivate) joinPrivateRef.current?.focus();
  }, [showJoinPrivate]);

  const publicRooms = rooms.filter((r) => r.visibility === 'public');
  const slots = [
    ...publicRooms,
    ...Array.from({ length: Math.max(0, 3 - publicRooms.length) }, () => null),
  ];

  function handleCreate() {
    onCreateRoom(newTitle.trim() || '내 방', newVisibility, maxPlayers, playerName);
    setShowCreate(false);
    setNewTitle('');
    setNewVisibility('public');
    setMaxPlayers(4);
  }

  async function handleJoinPrivate() {
    const id = privateId.trim().toUpperCase();
    if (!id) return;
    const result = await onJoinPrivate(id, playerName);
    if (result === 'not-found') {
      setPrivateError('방을 찾을 수 없어요.');
    } else if (result === 'full') {
      setPrivateError('방이 가득 찼어요.');
    }
  }

  async function handleSaveName() {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    if (onUpdateNickname) {
      setNameSaving(true);
      await onUpdateNickname(trimmed);
      setNameSaving(false);
    }
    setLocalName(trimmed);
    setEditingName(false);
  }

  return (
    <div className="min-h-screen bg-gp-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gp-surface/50">
        <button
          onClick={onBack}
          className="text-gp-mint/70 hover:text-gp-mint text-sm transition-colors"
        >
          ← 돌아가기
        </button>
        <span className="text-gp-mint font-bold text-lg">🔔 할리갈리</span>
        <div className="flex items-center gap-2">
          <button
            className="text-gp-mint/70 hover:text-gp-mint text-xs transition-colors"
            onClick={() => {
              setDraftName(playerName);
              setEditingName(true);
            }}
          >
            ✏️ {playerName}
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-gp-mint/40 hover:text-gp-mint/70 text-xs transition-colors"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreate(true)}
            className="flex-1"
          >
            + 방 만들기
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPrivateId('');
              setPrivateError('');
              setShowJoinPrivate(true);
            }}
            className="flex-1"
          >
            🔒 비밀 방 입장
          </Button>
        </div>

        {/* Public rooms */}
        <div>
          <h2 className="text-gp-mint/70 text-xs font-semibold uppercase tracking-widest mb-3">
            공개 방
          </h2>
          <div className="space-y-2">
            {slots.map((room, i) =>
              room ? (
                <Card key={room.id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm text-gp-mint">{room.title}</CardTitle>
                    <CardDescription className="text-xs text-gp-mint/50">
                      {room.playerCount} / {room.maxPlayers} 명
                    </CardDescription>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={room.playerCount >= room.maxPlayers}
                    onClick={() => onJoinRoom(room.id, playerName)}
                  >
                    입장
                  </Button>
                </Card>
              ) : (
                <div
                  key={i}
                  className="border border-gp-surface/30 rounded-xl p-3 text-center text-gp-mint/30 text-sm"
                >
                  빈 방
                </div>
              ),
            )}
          </div>
        </div>

        {/* Game rules */}
        <Card className="p-4 space-y-2">
          <CardHeader className="p-0">
            <CardTitle className="text-gp-mint text-sm">게임 방법</CardTitle>
          </CardHeader>
          <CardBody className="p-0 space-y-1 text-gp-mint/70 text-xs">
            <p>🍓🍋🍌🍇 카드를 한 장씩 뒤집어요.</p>
            <p>한 종류의 과일 합계가 정확히 <strong className="text-gp-mint">5개</strong>가 되면 빠르게 🔔 벨을 눌러요!</p>
            <p>정답 벨 = <span className="text-green-400">+1점</span> &nbsp;|&nbsp; 오답 벨 = <span className="text-red-400">-1점</span></p>
            <p>90초 후 가장 높은 점수의 플레이어가 승리해요.</p>
          </CardBody>
        </Card>
      </div>

      {/* Create room modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gp-bg border border-gp-surface rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-gp-mint font-bold text-lg">방 만들기</h2>

            <div className="space-y-1">
              <label className="text-gp-mint/70 text-xs">방 이름</label>
              <input
                ref={createTitleRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value.slice(0, MAX_ROOM_TITLE))}
                placeholder="내 방"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full bg-gp-surface/30 border border-gp-surface rounded-lg px-3 py-2 text-gp-mint text-sm outline-none focus:border-gp-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gp-mint/70 text-xs">공개 설정</label>
              <div className="flex gap-2">
                {(['public', 'private'] as RoomVisibility[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setNewVisibility(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newVisibility === v
                        ? 'bg-gp-accent text-gp-mint'
                        : 'bg-gp-surface/30 text-gp-mint/50 hover:bg-gp-surface/50'
                    }`}
                  >
                    {v === 'public' ? '🌐 공개' : '🔒 비공개'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gp-mint/70 text-xs">최대 인원: {maxPlayers}명</label>
              <input
                type="range"
                min={2}
                max={6}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-gp-accent"
              />
              <div className="flex justify-between text-gp-mint/30 text-xs">
                <span>2</span>
                <span>6</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="flex-1">
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreate} className="flex-1">
                만들기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join private room modal */}
      {showJoinPrivate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gp-bg border border-gp-surface rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-gp-mint font-bold text-lg">비밀 방 입장</h2>
            <div className="space-y-1">
              <label className="text-gp-mint/70 text-xs">방 코드 (6자리)</label>
              <input
                ref={joinPrivateRef}
                type="text"
                value={privateId}
                onChange={(e) => {
                  setPrivateId(e.target.value.toUpperCase().slice(0, 6));
                  setPrivateError('');
                }}
                placeholder="ABCDEF"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinPrivate()}
                className="w-full bg-gp-surface/30 border border-gp-surface rounded-lg px-3 py-2 text-gp-mint text-sm font-mono outline-none focus:border-gp-accent tracking-widest"
              />
              {privateError && <p className="text-red-400 text-xs">{privateError}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJoinPrivate(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleJoinPrivate}
                disabled={privateId.length < 6}
                className="flex-1"
              >
                입장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit name modal */}
      {editingName && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gp-bg border border-gp-surface rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-gp-mint font-bold text-lg">닉네임 변경</h2>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value.slice(0, 20))}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="w-full bg-gp-surface/30 border border-gp-surface rounded-lg px-3 py-2 text-gp-mint text-sm outline-none focus:border-gp-accent"
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingName(false)} className="flex-1">
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveName}
                disabled={nameSaving || !draftName.trim()}
                className="flex-1"
              >
                {nameSaving ? '저장 중…' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
