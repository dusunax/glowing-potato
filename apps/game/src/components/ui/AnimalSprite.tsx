import { useEffect, useMemo, useState } from 'react';
import type { AnimalSpriteSource } from '../../types/animal';

interface AnimalSpriteProps {
  name: string;
  emoji: string;
  sprite?: AnimalSpriteSource;
  className?: string;
}

function resolveSpriteSource(sprite?: AnimalSpriteSource): string {
  if (!sprite) return '';
  if (typeof sprite === 'string') return sprite;
  if (sprite.kind === 'gif') return sprite.src;
  if (sprite.kind === 'spriteSheet') return sprite.src;
  return sprite.frames[0] ?? '';
}

function getFrameIntervalMs(sprite?: AnimalSpriteSource): number {
  if (!sprite || typeof sprite === 'string') return 0;
  if (sprite.kind === 'gif') return 0;
  return sprite.frameDurationMs ?? 250;
}

function getFrames(sprite?: AnimalSpriteSource): string[] {
  if (!sprite || typeof sprite === 'string') return [];
  if (sprite.kind !== 'frames') return [];
  return sprite.frames;
}

function getSpriteSheet(sprite?: AnimalSpriteSource) {
  if (!sprite || typeof sprite === 'string') return null;
  return sprite.kind === 'spriteSheet' ? sprite : null;
}

function getFrameCount(sprite?: AnimalSpriteSource): number {
  if (!sprite || typeof sprite === 'string') return 0;
  if (sprite.kind === 'frames') return sprite.frameCount ?? sprite.frames.length;
  if (sprite.kind === 'spriteSheet') {
    if (Array.isArray(sprite.frameIndexes) && sprite.frameIndexes.length > 0) return sprite.frameIndexes.length;
    return sprite.frameCount ?? sprite.columns * sprite.rows;
  }
  return 0;
}

function getSpriteSheetFrameSequence(sprite?: AnimalSpriteSource): number[] {
  const spriteSheet = getSpriteSheet(sprite);
  if (!spriteSheet) return [];

  const totalCells = Math.max(spriteSheet.columns * spriteSheet.rows, 0);
  if (totalCells <= 0 || spriteSheet.frameWidth <= 0 || spriteSheet.frameHeight <= 0) return [];

  if (Array.isArray(spriteSheet.frameIndexes) && spriteSheet.frameIndexes.length > 0) {
    return spriteSheet.frameIndexes
      .map((frame) => Number(frame))
      .filter((frame) => Number.isInteger(frame) && frame >= 0 && frame < totalCells);
  }

  const totalFrames = getFrameCount(spriteSheet);
  if (totalFrames <= 1) return [];

  const startFrame = spriteSheet.row == null ? 0 : Math.max(spriteSheet.row, 0) * spriteSheet.columns;
  const endExclusive = Math.min(startFrame + Math.max(totalFrames, 0), totalCells);

  if (endExclusive <= startFrame) return [];

  return Array.from({ length: endExclusive - startFrame }, (_, index) => startFrame + index);
}

export function AnimalSprite({ name, emoji, sprite, className }: AnimalSpriteProps) {
  const frames = getFrames(sprite);
  const frameCount = getFrameCount(sprite);
  const spriteSheet = getSpriteSheet(sprite);
  const intervalMs = getFrameIntervalMs(sprite);
  const initialSource = resolveSpriteSource(sprite);
  const frameSequence = useMemo(() => getSpriteSheetFrameSequence(sprite), [sprite]);
  const [frameIndex, setFrameIndex] = useState(0);
  const hasFrames = frameSequence.length > 1 || frames.length > 1 || frameCount > 1;

  useEffect(() => {
    setFrameIndex(0);
  }, [sprite]);

  useEffect(() => {
    const effectiveFrameCount = spriteSheet ? frameSequence.length : frameCount;
    if (!hasFrames || effectiveFrameCount <= 1) return;

    const timer = window.setInterval(() => {
      setFrameIndex((prev) => {
        const next = (prev + 1) % effectiveFrameCount;
        return next;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [frameCount, frameSequence.length, intervalMs, hasFrames, spriteSheet]);

  if (spriteSheet) {
    const frameSource = frameSequence.length > 0 ? frameSequence : [];
    const clampedFrameIndex = frameSource.length > 0 ? frameSource[frameIndex % frameSource.length] : 0;
    const absoluteFrameIndex = clampedFrameIndex;
    const row = Math.floor(absoluteFrameIndex / spriteSheet.columns);
    const column = absoluteFrameIndex % spriteSheet.columns;
    const clampedRow = Math.min(row, Math.max(spriteSheet.rows - 1, 0));
    const clampedColumn = Math.min(column, Math.max(spriteSheet.columns - 1, 0));

    return (
      <span className={`inline-flex items-center justify-center overflow-hidden ${className || ''}`.trim()}>
        <span
          aria-hidden="true"
          data-animal-emoji={emoji}
          className="block h-full w-full rounded-sm"
          style={{
            backgroundImage: `url(${spriteSheet.src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${spriteSheet.columns * 100}% ${spriteSheet.rows * 100}%`,
            backgroundPosition: `${-(clampedColumn * (100 / spriteSheet.columns))}% ${-(clampedRow * (100 / spriteSheet.rows))}%`,
            imageRendering: 'pixelated',
            width: '100%',
            height: '100%',
          }}
        />
      </span>
    );
  }

  if (!sprite) {
    return <span className={className ? `leading-none ${className}` : 'leading-none text-sm'}>{emoji}</span>;
  }

  const totalFrames = frameCount || frames.length || 1;
  const src = hasFrames ? frames[frameIndex % totalFrames] : initialSource;
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${name} monster`}
      className={`object-contain rounded-sm ${className || ''}`.trim()}
      aria-hidden="true"
      data-animal-emoji={emoji}
    />
  );
}
