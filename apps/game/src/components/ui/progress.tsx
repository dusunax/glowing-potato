// shadcn-style Progress component (no external dependency).
// Displays a horizontal fill bar indicating a value from 0–100.

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value, 0–100. */
  value?: number;
  /** Extra classes for the inner indicator bar. */
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-gp-surface',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 bg-gp-mint transition-all duration-1000 ease-linear',
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';

export { Progress };
