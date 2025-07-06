'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: string;
  thickness?: number;
  children: React.ReactNode;
}

const StarBorder = React.forwardRef<HTMLDivElement, StarBorderProps>(
  (
    {
      className,
      color = 'hsl(var(--primary))',
      speed = '6s',
      thickness = 1,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-[12px] bg-transparent',
          className
        )}
        style={{
          padding: `${thickness}px`,
          ...props.style,
        }}
        {...props}
      >
        <div
          className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        ></div>
        <div
          className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        ></div>
        <div className="relative z-10 h-full w-full rounded-[11px] bg-[#2A2A2A] focus-within:bg-[#1A1A1A] transition-colors">
          {children}
        </div>
      </div>
    );
  }
);
StarBorder.displayName = 'StarBorder';

export { StarBorder };
