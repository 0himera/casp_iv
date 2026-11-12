'use client';

import { cn } from '@/shared/lib/utils';

interface LivePingProps {
  tone?: 'cyan' | 'red' | 'emerald';
  className?: string;
}

const COLORS = {
  cyan: 'bg-accent-cyan',
  red: 'bg-destructive',
  emerald: 'bg-status-success',
};

export function LivePing({ tone = 'emerald', className }: LivePingProps) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0 items-center justify-center', className)}>
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full ring-2 ring-current/20', COLORS[tone])} />
    </span>
  );
}
