import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
      <div className="min-w-0">
        <p className="eyebrow text-elevated-gold">{eyebrow}</p>
        <h1 className="font-serif text-[34px] sm:text-[40px] font-medium tracking-[-0.01em] text-enchanted-green dark:text-light-ivory mt-2">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-ink-soft dark:text-light-ivory/55 mt-1.5 max-w-xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
