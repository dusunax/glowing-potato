// Generic card container for the Glowing Potato design system.

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional accent border on the left edge */
  accent?: boolean;
  children: ReactNode;
}

export function Card({ accent = false, className = '', children, ...rest }: CardProps) {
  const base =
    'bg-gp-surface border border-gp-accent/30 rounded-xl transition-colors duration-150';
  const accentClass = accent ? 'border-l-gp-accent border-l-2' : '';

  return (
    <div className={`${base} ${accentClass} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className = '', children, ...rest }: CardHeaderProps) {
  return (
    <div className={`p-5 pb-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardBody({ className = '', children, ...rest }: CardBodyProps) {
  return (
    <div className={`px-5 pb-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className = '', children, ...rest }: CardTitleProps) {
  return (
    <h2 className={`font-semibold text-gp-mint text-lg leading-tight ${className}`} {...rest}>
      {children}
    </h2>
  );
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ className = '', children, ...rest }: CardDescriptionProps) {
  // text-gp-mint/85 on gp-surface: ~4.55:1 — passes WCAG AA for small text ✓
  return (
    <p className={`text-sm text-gp-mint/85 mt-0.5 ${className}`} {...rest}>
      {children}
    </p>
  );
}
