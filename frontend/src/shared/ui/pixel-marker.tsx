'use client';

import { cn } from '@/shared/lib/utils';

type PixelCell = 'solid' | 'outline' | 'accent';

const PATTERNS: Record<'telemetry' | 'verified' | 'ai' | 'alert', PixelCell[]> = {
  telemetry: ['solid', 'outline', 'solid', 'outline', 'accent', 'outline', 'solid', 'outline', 'accent'],
  verified: ['accent', 'solid', 'outline', 'solid', 'accent', 'solid', 'outline', 'solid', 'solid'],
  ai: ['outline', 'accent', 'solid', 'accent', 'solid', 'outline', 'solid', 'outline', 'accent'],
  alert: ['accent', 'outline', 'accent', 'outline', 'solid', 'outline', 'accent', 'solid', 'outline'],
};

const ACCENT_CLASSES: Record<'telemetry' | 'verified' | 'ai' | 'alert', string> = {
  telemetry: 'bg-[var(--status-success)]',
  verified: 'bg-[var(--status-success)]',
  ai: 'bg-[var(--accent-lavender)]',
  alert: 'bg-[var(--status-danger)]',
};

interface PixelMarkerProps {
  variant?: 'telemetry' | 'verified' | 'ai' | 'alert';
  className?: string;
}

export function PixelMarker({ variant = 'telemetry', className }: PixelMarkerProps) {
  const cells = PATTERNS[variant];
  return (
    <span aria-hidden="true" className={cn('inline-grid grid-cols-3 gap-[2px] shrink-0', className)}>
      {cells.map((cell, idx) => (
        <span
          key={idx}
          className={cn(
            'h-[4px] w-[4px] rounded-[1px]',
            cell === 'solid' && 'bg-foreground/90',
            cell === 'outline' && 'border border-foreground/35 bg-transparent',
            cell === 'accent' && ACCENT_CLASSES[variant]
          )}
        />
      ))}
    </span>
  );
}

