import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap leading-none select-none shrink-0 rounded-[2px] border px-2 py-1 font-mono text-[11px] font-medium tracking-[0.02em] transition-colors [&>svg]:size-3.5 [&>svg]:shrink-0 [&>span]:truncate [&>span]:leading-none',
  {
    variants: {
      variant: {
        default: 'border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan',
        secondary: 'border-border bg-surface-low text-secondary-foreground',
        destructive: 'border-destructive/35 bg-destructive/10 text-destructive',
        lavender: 'border-lavender/30 bg-lavender/10 text-lavender',
        outline: 'border-border bg-transparent text-muted-foreground',
        success: 'border-status-success/35 bg-status-success/10 text-status-success',
        warning: 'border-status-warning/35 bg-status-warning/10 text-status-warning',
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

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}
