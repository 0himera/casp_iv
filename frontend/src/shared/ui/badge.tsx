import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-primary/10 text-primary',
        secondary: 'border-border bg-secondary/80 text-secondary-foreground',
        destructive:
          'border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 text-[var(--status-danger)]',
        lavender:
          'border-[var(--accent-lavender)]/25 bg-[var(--accent-lavender)]/10 text-[var(--accent-lavender)]',
        outline: 'border-border text-muted-foreground bg-card/60',
        success:
          'border-[var(--status-success)]/25 bg-[var(--status-success)]/10 text-[var(--status-success)]',
        warning:
          'border-[var(--status-warning)]/25 bg-[var(--status-warning)]/10 text-[var(--status-warning)]',
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
