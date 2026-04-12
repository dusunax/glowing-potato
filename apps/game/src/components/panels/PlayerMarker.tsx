import { memo } from 'react';

export type PlayerActionState = 'idle' | 'move' | 'skill' | 'discover' | 'attack';

interface PlayerMarkerProps {
  mode: PlayerActionState;
  equippedWeaponEmoji?: string;
  equippedWeaponName?: string;
}

function PlayerMarker({ mode, equippedWeaponEmoji, equippedWeaponName }: PlayerMarkerProps) {
  const modeConfig: Record<
    PlayerActionState,
    {
      ringClass: string;
      ringMotionClass: string;
      bodyClass: string;
      statusLabel: string | null;
      statusColor: string;
    }
  > = {
    idle: {
      ringClass: 'ring-2 ring-gp-mint/55',
      ringMotionClass: 'bg-gp-accent/25',
      bodyClass: 'bg-gp-paper/95',
      statusLabel: null,
      statusColor: 'text-gp-mint',
    },
    move: {
      ringClass: 'ring-2 ring-sky-200/95',
      ringMotionClass: 'bg-sky-500/35 animate-pulse',
      bodyClass: 'bg-sky-200/95',
      statusLabel: 'MOVE',
      statusColor: 'text-sky-200',
    },
    skill: {
      ringClass: 'ring-2 ring-amber-200/95',
      ringMotionClass: 'bg-amber-500/35',
      bodyClass: 'bg-amber-200/95',
      statusLabel: 'SKILL',
      statusColor: 'text-amber-200',
    },
    discover: {
      ringClass: 'ring-2 ring-emerald-200/95',
      ringMotionClass: 'bg-emerald-500/35 animate-pulse',
      bodyClass: 'bg-emerald-200/95',
      statusLabel: 'DISCOVER',
      statusColor: 'text-emerald-200',
    },
    attack: {
      ringClass: 'ring-2 ring-red-200/95',
      ringMotionClass: 'bg-red-500/35 animate-pulse',
      bodyClass: 'bg-red-200/95',
      statusLabel: 'ATTACK',
      statusColor: 'text-red-200',
    },
  };

  const config = modeConfig[mode];

  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span
        data-testid="player-marker-badge"
        className={`absolute -top-1 px-1.5 py-[1px] rounded-full border border-white/25 text-[8px] font-bold ${config.statusColor} ${
          mode === 'idle' ? 'opacity-0' : 'opacity-100'
        } transition-opacity`}
      >
        {config.statusLabel}
      </span>
      <span
        data-state={mode}
        data-testid="player-marker-body"
        className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/40 shadow ${config.ringClass} ${config.ringMotionClass}`}
        title={equippedWeaponName ? `Weapon: ${equippedWeaponName}` : 'Player'}
      >
        <span className="absolute left-[3px] top-[2px] h-[10px] w-[10px] rounded-full bg-gp-paper/95 shadow" />
        <span className="absolute left-[6px] top-[16px] h-[3px] w-[7px] rounded-sm bg-gp-paper/95" />
        <span className="absolute left-[2px] top-[15px] h-[3px] w-[11px] rounded-sm bg-gp-paper/90" />
        <span className={`absolute left-[1px] top-[16px] h-[4px] w-[3px] rounded-sm ${config.bodyClass}`} />
        <span className={`absolute left-[5px] top-[1px] h-[4px] w-[6px] rounded-sm ${config.bodyClass} opacity-80`} />
        <span className="absolute left-[1px] top-[6px] h-[2px] w-[2px] rounded-full bg-gp-bg/80" />
        <span className="absolute left-[4px] top-[6px] h-[2px] w-[2px] rounded-full bg-gp-bg/80" />
        <span className="absolute left-[5px] top-[10px] h-[2px] w-[2px] rounded-full bg-gp-bg/80" />
        {equippedWeaponEmoji && (
          <span
            data-testid="player-marker-weapon"
            className="absolute -right-2 -bottom-2 text-[10px] leading-none"
            title={equippedWeaponName}
          >
            {equippedWeaponEmoji}
          </span>
        )}
      </span>
    </span>
  );
}

export default memo(PlayerMarker);
