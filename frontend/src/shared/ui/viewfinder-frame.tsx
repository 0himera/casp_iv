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
        'relative rounded-[6px] border border-[rgba(255,255,255,0.08)] bg-[#181B25] p-5 sm:p-6',
        className
      )}
    >
      {stamp && (
        <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.1em] text-[#00F0FF]">
          {stamp}
        </span>
      )}
      {children}
    </div>
  );
}
