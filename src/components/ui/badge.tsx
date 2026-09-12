import { cn } from '@/lib/utils';
import type * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-amber-500 text-slate-950': variant === 'default',
          'border-transparent bg-slate-800 text-slate-200': variant === 'secondary',
          'border-transparent bg-red-600/90 text-white': variant === 'destructive',
          'border-transparent bg-emerald-600 text-white': variant === 'success',
          'border-transparent bg-amber-600/90 text-white': variant === 'warning',
          'border-slate-700 text-slate-300': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
