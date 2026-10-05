import type { HTMLAttributes } from 'react';

export default function DataCard({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`overflow-hidden rounded-lg border border-line bg-panel ${className}`} {...rest}>
      {children}
    </div>
  );
}
