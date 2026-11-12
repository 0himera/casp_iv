'use client';

import { cn } from '@/shared/lib/utils';

interface LivePingProps {
  tone?: 'cyan' | 'red' | 'emerald';
  className?: string;
}

const COLORS = {
  cyan: 'bg-[#5CE1E6]',
  red: 'bg-[#FFB800]',
  emerald: 'bg-[#4ADE80]',
};

export function LivePing({ tone = 'emerald', className }: LivePingProps) {
  return (
    <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', COLORS[tone], className)} />
  );
}
