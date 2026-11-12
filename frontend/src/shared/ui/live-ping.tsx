'use client';

import { cn } from '@/shared/lib/utils';

interface LivePingProps {
  tone?: 'cyan' | 'red' | 'emerald';
  className?: string;
}

const COLORS = {
  cyan: 'bg-[#7EB2CC]',
  red: 'bg-[#D94E34]',
  emerald: 'bg-[#4E9F76]',
};

export function LivePing({ tone = 'emerald', className }: LivePingProps) {
  return (
    <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', COLORS[tone], className)} />
  );
}
