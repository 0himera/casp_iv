import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 font-mono text-[11px] font-medium tracking-[0.04em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[rgba(0,240,255,0.25)] bg-[rgba(0,240,255,0.05)] text-[#00F0FF]',
        secondary: 'border-white/10 bg-[#1D2230] text-[#CBD5E1]',
        destructive: 'border-[#FF3B1D]/35 bg-[#FF3B1D]/10 text-[#FF3B1D]',
        lavender: 'border-[#255BFF]/35 bg-[#255BFF]/10 text-[#60A5FA]',
        outline: 'border-white/12 bg-white/[0.02] text-[#A1A6B4]',
        success: 'border-[#10B981]/35 bg-[#10B981]/10 text-[#B8FF01]',
        warning: 'border-[#FF8A00]/35 bg-[#FF8A00]/10 text-[#FF8A00]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
