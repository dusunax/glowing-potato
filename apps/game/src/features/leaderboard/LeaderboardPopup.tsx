import { Button } from '@glowing-potato/ui';
import type { ReactNode } from 'react';

export interface LeaderboardPopupRowRecord {
  id?: string;
  displayName: string;
  score: number;
  [key: string]: unknown;
}

export type LeaderboardPopupRow =
  | { type: 'record'; record: LeaderboardPopupRowRecord; index: number }
  | { type: 'empty'; index: number };

export function getRankLabel(rank: number): string {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `${rank + 1}`;
}

export function getRankColorClass(rank: number): string {
  if (rank === 0) return 'text-yellow-400';
  if (rank === 1) return 'text-gp-mint/70';
  if (rank === 2) return 'text-orange-400';
  return 'text-gp-mint/60';
}

interface LeaderboardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  rows: LeaderboardPopupRow[];
  scoreSuffix?: string;
  renderMeta?: (record: LeaderboardPopupRowRecord) => ReactNode;
  emptyLabel?: string;
}

export function LeaderboardPopup({
  isOpen,
  onClose,
  title,
  loading,
  rows,
  scoreSuffix = 'pts',
  renderMeta,
  emptyLabel = '-',
}: LeaderboardPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4">
      <div className="bg-gp-surface border-2 border-gp-accent/45 rounded-xl p-4 w-full max-w-md max-h-[82vh] flex flex-col shadow-[0_20px_60px_-30px_rgba(14,165,233,0.25)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gp-mint">{title}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            ×
          </Button>
        </div>
        {loading ? (
          <div className="overflow-y-auto max-h-96 space-y-1 pr-1">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={`leaderboard-skeleton-${index}`}
                className="h-[42px] flex items-center gap-2 px-2 py-2 border border-gp-accent/25 rounded-lg bg-gp-bg/55"
              >
                <span className={`w-6 text-center text-sm font-bold ${getRankColorClass(index)}`}>{getRankLabel(index)}</span>
                <div className="h-3 flex-1 rounded bg-gp-accent/20 animate-pulse" />
                <div className="h-3 w-20 rounded bg-gp-accent/20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-96 space-y-1 pr-1">
            {rows.map((row) => {
              if (row.type === 'record') {
                const rank = row.index;
                return (
                  <div
                    key={row.record.id ?? `${row.record.displayName}-${row.record.score}-${rank}`}
                    className="flex items-center gap-2 px-2 py-2 border border-gp-accent/25 rounded-lg bg-gp-bg/55"
                  >
                    <span className={`w-6 text-center text-sm font-bold ${getRankColorClass(rank)}`}>
                      {getRankLabel(rank)}
                    </span>
                    <span className="flex-1 text-left text-xs text-gp-mint truncate">{row.record.displayName}</span>
                    <span className="text-xs font-bold text-gp-mint">{row.record.score.toLocaleString()} {scoreSuffix}</span>
                    {renderMeta ? renderMeta(row.record) : null}
                  </div>
                );
              }

              return (
                <div
                  key={`empty-slot-${row.index}`}
                  className="flex items-center gap-2 px-2 py-2 border border-dashed border-gp-accent/30 rounded-lg bg-gp-bg/35"
                >
                  <span className={`w-6 text-center text-sm ${getRankColorClass(row.index)}`}>{getRankLabel(row.index)}</span>
                  <span className="flex-1 text-left text-xs text-gp-mint/40">{emptyLabel}</span>
                  <span className="text-xs font-bold text-gp-mint/20">--</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
