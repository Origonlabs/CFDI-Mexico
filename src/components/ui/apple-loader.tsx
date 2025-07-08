import React from 'react';
import { cn } from '@/lib/utils';

interface AppleLoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppleLoader({ className, ...props }: AppleLoaderProps) {
  return (
    <div className={cn('apple-loader', className)} {...props}>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}
