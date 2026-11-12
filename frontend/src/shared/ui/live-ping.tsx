'use client';

import { cn } from '@/shared/lib/utils';

interface LivePingProps {
  tone?: 'cyan' | 'red' | 'emerald';
  className?: string;
}

const COLORS = {
  cyan: 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]',
  red: 'bg-[#FF3B1D] shadow-[0_0_8px_#FF3B1D]',
  emerald: 'bg-[#10B981] shadow-[0_0_8px_#10B981]',
};

export function LivePing({ tone = 'cyan', className }: LivePingProps) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)}>
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', COLORS[tone])} />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', COLORS[tone])} />
    </span>
  );
}

