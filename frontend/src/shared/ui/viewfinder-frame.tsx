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
    <div className={cn('relative p-3 bg-card/55 rounded-lg border border-[var(--border-subtle)]', className)}>
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-t border-l border-[var(--border-strong)] rounded-tl-[4px]" />
      <span aria-hidden="true" className="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 border-t border-r border-[var(--border-strong)] rounded-tr-[4px]" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-[var(--border-strong)] rounded-bl-[4px]" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-[var(--border-strong)] rounded-br-[4px]" />
      {stamp && (
        <span className="absolute -top-2.5 left-3 bg-background px-1.5 font-mono text-[10px] tracking-wider text-muted-foreground">
          {stamp}
        </span>
      )}
      {children}
    </div>
  );
}
