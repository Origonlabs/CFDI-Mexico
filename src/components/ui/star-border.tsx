'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
  speed?: string;
  thickness?: number;
  borderRadius?: number;
  children: React.ReactNode;
}

const StarBorder = React.forwardRef<HTMLDivElement, StarBorderProps>(
  (
    {
      className,
      color = 'hsl(var(--primary))',
      speed = '4s',
      thickness = 1,
      borderRadius = 12,
      children,
      ...props
    },
    ref
  ) => {
    const outerRadius = borderRadius;
    const innerRadius = outerRadius - thickness;

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden bg-transparent',
          className
        )}
        style={{
          borderRadius: `${outerRadius}px`,
          padding: `${thickness}px`,
          ...props.style,
        }}
        {...props}
      >
        <div
          className="absolute inset-[-1000%] animate-border-spin"
          style={{
            background: `conic-gradient(from 90deg at 50% 50%, #2A2A2A, ${color}, #2A2A2A)`,
            animationDuration: speed,
          }}
        />
        <div
          className="relative z-10 h-full w-full bg-[#2A2A2A] focus-within:bg-[#1A1A1A] transition-colors"
          style={{
            borderRadius: `${innerRadius > 0 ? innerRadius : 0}px`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);
StarBorder.displayName = 'StarBorder';

export { StarBorder };
