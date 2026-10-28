import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-40 disabled:pointer-events-none select-none tracking-normal';

    const variants = {
      primary:
        'bg-white text-neutral-950 hover:bg-neutral-200 active:bg-neutral-300 shadow-sm font-semibold',
      secondary:
        'bg-white/[0.06] text-white hover:bg-white/[0.1] active:bg-white/[0.12] border border-white/[0.08]',
      outline:
        'bg-transparent text-neutral-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.12] active:bg-white/[0.08]',
      ghost:
        'bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05] active:bg-white/[0.08]',
      danger:
        'bg-rose-500/15 text-rose-300 border border-rose-500/25 hover:bg-rose-500/25 active:bg-rose-500/30 font-medium',
      success:
        'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 active:bg-emerald-500/30 font-medium',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.08 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
