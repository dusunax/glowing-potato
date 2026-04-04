import type { MiniGame } from '../types/minigame';
import type { ReactNode } from 'react';
import { Button, type CarouselApi, Carousel, CarouselContent, CarouselItem } from '@glowing-potato/ui';

interface GameLobbyCarouselSectionProps {
  games: MiniGame[];
  activeIndex: number;
  spinning: boolean;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  startIndex: number;
  setCarouselApi: (api: CarouselApi | null) => void;
  onSelectIndex: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSpin: () => void;
  onPlay: (game: MiniGame) => void;
}

const CARD_WIDTH_CLASS = 'w-64';
const CARD_HEIGHT_CLASS = 'h-72';
const CARD_RADIUS_CLASS = 'rounded-2xl';
const CARD_SHARED_BASE_CLASS = `${CARD_WIDTH_CLASS} ${CARD_HEIGHT_CLASS} ${CARD_RADIUS_CLASS} overflow-hidden p-6 flex flex-col items-center justify-center gap-3 border transition-all duration-200`;

interface GameCardProps {
  game?: MiniGame;
  active?: boolean;
  children?: ReactNode;
}

function GameCard({ game, active = false }: GameCardProps) {
  if (!game) return null;

  return (
    <LobbySlotCard
      active={active}
      emphasisColor={active ? `${game.color}33` : undefined}
    >
      <span className="text-5xl">{game.emoji}</span>
      <div className="text-center">
        <div className="font-semibold text-gp-mint text-base leading-tight">{game.name}</div>
        <div className="text-gp-mint/85 text-xs mt-1.5 leading-snug line-clamp-3">{game.description}</div>
      </div>
    </LobbySlotCard>
  );
}

function EmptySlotCard() {
  return (
    <LobbySlotCard className="border-transparent bg-transparent">
      <div className="h-full w-full" />
    </LobbySlotCard>
  );
}

function LobbySlotCard({
  active = false,
  emphasisColor,
  children,
  className = '',
}: {
  active?: boolean;
  emphasisColor?: string;
  children?: ReactNode;
  className?: string;
}) {
  const borderClass = active
    ? 'border-2 border-gp-accent/80'
    : 'border border-gp-accent/20';

  return (
    <div
      className={`${CARD_SHARED_BASE_CLASS} ${borderClass} ${active ? 'bg-gp-surface' : 'bg-gp-surface/50'} ${className}`}
      style={active && emphasisColor ? { boxShadow: `0 0 32px ${emphasisColor}` } : undefined}
    >
      {children}
    </div>
  );
}

type CarouselSlide =
  | {
      kind: 'empty';
      key: string;
    }
  | {
      kind: 'game';
      key: string;
      game: MiniGame;
    };

export function GameLobbyCarouselSection({
  games,
  activeIndex,
  spinning,
  canScrollPrev,
  canScrollNext,
  startIndex,
  setCarouselApi,
  onSelectIndex,
  onPrev,
  onNext,
  onSpin,
  onPlay,
}: GameLobbyCarouselSectionProps) {
  const active = games[activeIndex];

  const slides: CarouselSlide[] = [
    { kind: 'empty', key: 'placeholder-left' },
    ...games.map((game) => ({ kind: 'game' as const, key: game.id, game })),
    { kind: 'empty', key: 'placeholder-right' },
  ];

  if (!games.length) return null;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      <header className="text-center mb-10">
        <p className="text-xs font-semibold tracking-widest text-gp-accent uppercase mb-2">
          Mini-Game Arcade
        </p>
        <h1 className="text-4xl font-bold text-gp-mint tracking-tight">🎰 Pick Your Game</h1>
        <p className="text-gp-accent mt-2 text-sm">Spin to discover a game, or choose from the list below</p>
      </header>

      <div className="w-full max-w-3xl mb-6">
        <Carousel
          opts={{ startIndex, loop: false, align: 'center', dragFree: false, containScroll: 'keepSnaps' }}
          setApi={setCarouselApi}
          className="w-full"
        >
          <CarouselContent className="cursor-grab select-none gap-1">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex + 1;
              return (
                <CarouselItem key={slide.key} className={`${CARD_WIDTH_CLASS} flex-shrink-0`}>
                  <div
                    className={`transition-transform duration-200 ${isActive ? 'z-10' : 'scale-95 opacity-80'}`}
                  >
                    {slide.kind === 'empty' ? <EmptySlotCard /> : <GameCard game={slide.game} active={isActive} />}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="flex justify-center gap-2 mt-5">
          {games.map((game, index) => (
            <button
              key={game.id}
              type="button"
              onClick={() => !spinning && onSelectIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === activeIndex ? 'bg-gp-mint scale-125' : 'bg-gp-accent/40 hover:bg-gp-accent'
              }`}
              aria-label={`Go to game ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center items-center gap-3">
        <Button variant="secondary" size="icon" onClick={onPrev} disabled={spinning || !canScrollPrev} aria-label="Previous game">
          ◀
        </Button>
        <Button variant="outline" size="lg" onClick={onSpin} disabled={spinning}>
          {spinning ? '🎰 Spinning…' : '🎰 Spin'}
        </Button>
        <Button variant="secondary" size="icon" onClick={onNext} disabled={spinning || !canScrollNext} aria-label="Next game">
          ▶
        </Button>
      </div>

      <div className="flex justify-center mt-5">
        {active.status === 'available' ? (
          <Button variant="primary" size="lg" onClick={() => onPlay(active)} className="min-w-48">
            ▶ Play {active.name}
          </Button>
        ) : (
          <span className="px-6 py-3 rounded-xl text-sm font-semibold text-gp-mint/50 bg-gp-surface/30 border border-gp-accent/20">
            🔒 Coming Soon
          </span>
        )}
      </div>

      <div className="mt-10 mb-4 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-gp-mint/30 text-xs tracking-widest uppercase">View Game Intro</span>
        <span className="text-gp-mint/30 text-lg">↓</span>
      </div>
    </section>
  );
}
