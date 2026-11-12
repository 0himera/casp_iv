import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5 text-[11px] font-medium font-mono tracking-tight transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/12 text-primary',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive:
          'border-destructive/35 bg-destructive/12 text-destructive',
        lavender:
          'border-[var(--accent-lavender)]/35 bg-[var(--accent-lavender)]/12 text-[var(--accent-lavender)]',
        outline: 'border-border text-foreground bg-background/60',
        success:
          'border-[var(--status-success)]/35 bg-[var(--status-success)]/12 text-[var(--status-success)]',
        warning:
          'border-[var(--status-warning)]/35 bg-[var(--status-warning)]/12 text-[var(--status-warning)]',
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
