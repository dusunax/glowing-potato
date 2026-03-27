// Generic badge / pill component for the Glowing Potato design system.

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'outline';

const VARIANT_CLASSES: Record<Variant, string> = {
  // default: mint text on semi-transparent accent bg — readable on surfaces ✓
  default: 'bg-gp-accent/20 text-gp-mint border-gp-accent/40',
  success: 'bg-emerald-800/40 text-emerald-200 border-emerald-600/40',
  warning: 'bg-amber-800/40 text-amber-200 border-amber-600/40',
  danger: 'bg-red-800/40 text-red-200 border-red-600/40',
  // muted: mint/80 text on semi-transparent surface — ~4.4:1 contrast on surfaces ✓
  muted: 'bg-gp-surface/50 text-gp-mint/80 border-gp-accent/20',
  outline: 'bg-transparent text-gp-mint border-gp-accent/60',
};

export interface BadgeProps {
  label: string;
  variant?: Variant;
  className?: string;
}

export function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {label}
    </span>
  );
}
