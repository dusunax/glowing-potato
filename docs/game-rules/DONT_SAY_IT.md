# DON'T SAY IT — GAME RULES 

## 1. Core Setup

- Mini-game ID: `dont-say-it`
- Realtime DB path: `games/dont_say_it/rooms`
- Player count:
  - minimum: `2`
  - maximum: `4`
- Phases:
  - `waiting`
  - `voting`
  - `playing`
  - `finished`
- Each player has:
  - `name`
  - `isOut`
  - `isBot`
  - `isInRoom`
  - `wordSlots` (1 slot per player, each with 3 candidates)

## 2. Game Flow

### Waiting

- Host can start only when at least 2 players are currently marked `isInRoom`.
- New players can join if room is not full.
- Host can be rotated automatically if current host disconnects/left.

### Voting

- Voting phase lasts `10s`.
- For each opponent, each player votes on 3 candidate words.
- Voting result chooses final forbidden word per player.

### Playing

- Playing phase lasts `60s`.
- Players send text messages only (typing or speech-to-text when enabled).
- If a player says their own final forbidden word, they are eliminated.

### Finished

- Winner is the last non-out player.
- Game result is archived and leaderboard refresh is triggered.
- Players can open chat replay and leaderboard.

## 3. Matching Rule (Important)

- Matching is **substring contains**, not exact equality.
- Both message and target word are normalized:
  - lowercased
  - punctuation removed (`NFKC` normalization + strip non-alphanumeric)
- If the normalized forbidden word appears anywhere in the message, it is a hit.
- On hit:
  - The speaker is marked `isOut: true`
  - Message is logged with `triggeredWord`

## 4. Reconnect / `isInRoom` logic

- Player state includes `isInRoom`.
- On room return:
  - host can set player back to room-ready state.
  - waiting view uses `isInRoom` for “dimmed / active” slots.

## 5. Scoring and Records

- Match winner is written to:
  - `game_histories / dont_say_it / rooms / {roomId}`
  - `game_histories / dont_say_it / records / {userId}` with `score` increment

- Leaderboard reads:
  - `game_histories / dont_say_it / records`
  - sort by score descending
  - resolved display name from `users/{userId}`

## 6. Authentication / Access

- Unauthenticated users can join the room lobby only, not gameplay.
- User profiles are written in `users` for nickname persistence and leaderboard label sync.

## 7. Related files

- `src/features/dont-say-it/hooks/useDontSayIt.ts`
- `src/features/dont-say-it/components/GameRoom.tsx`
- `src/features/dont-say-it/types.ts`
- `src/features/dont-say-it/data/words.ts`
- `src/features/dont-say-it/index.ts`
- `src/hooks/useLeaderboard.ts`
