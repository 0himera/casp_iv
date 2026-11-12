'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface ViewfinderFrameProps {
  children: ReactNode;
  stamp?: string;
  tone?: 'paper' | 'lavender' | 'cyan' | 'sage';
  className?: string;
}

export function ViewfinderFrame({ children, stamp, className, tone = 'paper' }: ViewfinderFrameProps) {
  return (
    <div
      data-tone={tone}
      className={cn(
        'print-panel relative rounded-lg border border-border bg-surface-default p-5 sm:p-6',
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
