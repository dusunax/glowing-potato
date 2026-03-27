// Generic button component for the Glowing Potato design system.
// Variants follow shadcn/ui naming conventions.

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gp-accent hover:bg-gp-accent/80 text-gp-mint border-transparent',
  secondary:
    'bg-gp-surface hover:bg-gp-surface/70 text-gp-mint border-gp-accent/30',
  ghost:
    'bg-transparent hover:bg-gp-surface/50 text-gp-mint border-transparent',
  outline:
    'bg-transparent hover:bg-gp-accent/10 text-gp-mint border-gp-accent',
  destructive:
    'bg-red-800/60 hover:bg-red-700/60 text-red-200 border-transparent',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  icon: 'w-10 h-10 p-0 text-base rounded-full flex items-center justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint/50 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <button
      disabled={disabled}
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
