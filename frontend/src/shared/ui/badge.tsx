import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive:
          'border-destructive/40 bg-destructive/15 text-destructive',
        outline: 'border-border text-foreground',
        success:
          'border-[var(--status-success)]/40 bg-[var(--status-success)]/15 text-[var(--status-success)]',
        warning:
          'border-[var(--status-warning)]/40 bg-[var(--status-warning)]/15 text-[var(--status-warning)]',
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

