import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] font-mono text-xs font-semibold tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#FFB800] text-[#170205] font-bold hover:bg-[#E5A500] shadow-[0_0_20px_rgba(255,184,0,0.25)]',
        destructive:
          'border border-[#D9534F]/40 bg-[#D9534F]/15 text-[#E57368] hover:bg-[#D9534F]/25',
        outline:
          'border border-white/14 bg-white/[0.03] text-[#CBD5E1] hover:bg-white/[0.07] hover:border-white/25',
        secondary:
          'border border-[rgba(126,178,204,0.28)] bg-[rgba(126,178,204,0.08)] text-[#A5C9DC] hover:bg-[rgba(126,178,204,0.14)]',
        ghost: 'text-[#94A0B3] hover:bg-white/[0.05] hover:text-[#F5F5F7]',
      },
      size: {
        default: 'h-9 px-5 py-2.5 text-[12px]',
        sm: 'h-7 px-3 text-[11px]',
        lg: 'h-10 px-6 text-[13px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
