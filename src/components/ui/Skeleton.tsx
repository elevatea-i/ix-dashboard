import React from 'react';

const bar = 'rounded bg-enchanted-green/[0.07] dark:bg-white/[0.06] animate-shimmer';

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-paper dark:bg-paper-dark ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] p-6 space-y-4">
          <div className={`${bar} h-2.5 w-24`} />
          <div className={`${bar} h-7 w-40`} />
          <div className={`${bar} h-2.5 w-32`} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-paper dark:bg-paper-dark ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] overflow-hidden">
      <div className="h-12 border-b border-enchanted-green/[0.07] dark:border-white/[0.06]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-6 h-16 border-b last:border-b-0 border-enchanted-green/[0.05] dark:border-white/[0.04]">
          <div className={`${bar} h-3 w-16`} />
          <div className={`${bar} h-3 flex-1 max-w-[220px]`} />
          <div className={`${bar} h-3 w-24 ml-auto`} />
          <div className={`${bar} h-3 w-20 hidden md:block`} />
        </div>
      ))}
    </div>
  );
}
