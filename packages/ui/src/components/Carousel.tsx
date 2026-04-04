import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';

type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];
type CarouselPlugins = Parameters<typeof useEmblaCarousel>[1];

export type CarouselApi = ReturnType<typeof useEmblaCarousel>[1];

type CarouselContextValue = {
  emblaRef: React.RefCallback<HTMLElement>;
  api: CarouselApi | null;
  orientation: 'horizontal' | 'vertical';
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within a Carousel component');
  }
  return context;
}

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugins;
  setApi?: (api: CarouselApi | null) => void;
  orientation?: 'horizontal' | 'vertical';
} & React.HTMLAttributes<HTMLDivElement>;

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ opts, plugins, setApi, orientation = 'horizontal', className = '', children, ...props }, ref) => {
    const [emblaRef, api] = useEmblaCarousel(opts, plugins);
    const value = React.useMemo(
      () => ({
        emblaRef: emblaRef as React.RefCallback<HTMLElement>,
        api: api ?? null,
        orientation,
      }),
      [api, emblaRef, orientation],
    );

    React.useEffect(() => {
      setApi?.(api ?? null);
      return () => {
        setApi?.(null);
      };
    }, [api, setApi]);

    return (
      <CarouselContext.Provider value={value}>
        <div
          ref={ref}
          role="region"
          aria-roledescription="carousel"
          className={`relative ${className}`}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);

Carousel.displayName = 'Carousel';

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    const { emblaRef, orientation } = useCarousel();
    return (
      <div ref={emblaRef} className="overflow-hidden">
        <div
          ref={ref}
          className={`-ml-4 flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} ${className}`}
          {...props}
        />
      </div>
    );
  },
);

CarouselContent.displayName = 'CarouselContent';

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={`pl-4 shrink-0 ${className}`}
        {...props}
      />
    );
  },
);

CarouselItem.displayName = 'CarouselItem';

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = '', ...props }, ref) => {
    const { api } = useCarousel();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => api?.scrollPrev()}
        disabled={!api?.canScrollPrev?.()}
        aria-label="Previous slide"
        className={className}
        {...props}
      />
    );
  },
);

CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className = '', ...props }, ref) => {
    const { api } = useCarousel();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => api?.scrollNext()}
        disabled={!api?.canScrollNext?.()}
        aria-label="Next slide"
        className={className}
        {...props}
      />
    );
  },
);

CarouselNext.displayName = 'CarouselNext';

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
