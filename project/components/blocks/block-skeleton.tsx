'use client';

import { cn } from '@/lib/utils';

export function BlockSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-3 p-4', className)}>
      <div className="h-4 w-1/3 rounded bg-[#1F1F1F]" />
      <div className="h-3 w-full rounded bg-[#1F1F1F]" />
      <div className="h-3 w-5/6 rounded bg-[#1F1F1F]" />
      <div className="h-3 w-4/6 rounded bg-[#1F1F1F]" />
    </div>
  );
}
