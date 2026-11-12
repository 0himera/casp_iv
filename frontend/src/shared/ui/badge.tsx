import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 font-mono text-[11px] font-medium tracking-[0.04em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[rgba(126,178,204,0.28)] bg-[rgba(126,178,204,0.08)] text-[#A5C9DC]',
        secondary: 'border-white/10 bg-[#1D2230] text-[#CBD5E1]',
        destructive: 'border-[#D9534F]/35 bg-[#D9534F]/10 text-[#E57368]',
        lavender: 'border-[#4B74B5]/35 bg-[#4B74B5]/12 text-[#8EB0E0]',
        outline: 'border-white/12 bg-white/[0.02] text-[#94A0B3]',
        success: 'border-[#4E9F76]/35 bg-[#4E9F76]/12 text-[#7AC49D]',
        warning: 'border-[#D98A3C]/35 bg-[#D98A3C]/12 text-[#E2A96F]',
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
