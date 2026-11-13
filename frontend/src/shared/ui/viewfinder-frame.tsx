'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface ViewfinderFrameProps {
  children: ReactNode;
  stamp?: string;
  className?: string;
}

export function ViewfinderFrame({ children, stamp, className }: ViewfinderFrameProps) {
  return (
    <div
      className={cn(
        'relative rounded-[var(--card-radius)] border border-[var(--glass-edge)] bg-[var(--glass-card)] p-5 sm:p-6',
        className
      )}
    >
      {stamp && (
        <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent-cyan)]">
          {stamp}
        </span>
      )}
      {children}
    </div>
  );
}
