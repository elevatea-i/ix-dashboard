import React from 'react';

type Tone = 'positive' | 'pending' | 'alert' | 'neutral';

const dotTone: Record<Tone, string> = {
  positive: 'bg-success-500 dark:bg-success-300',
  pending: 'bg-warning-500 dark:bg-warning-300',
  alert: 'bg-cranberry dark:bg-cranberry-300',
  neutral: 'bg-ink-mute dark:bg-light-ivory/40',
};

const textTone: Record<Tone, string> = {
  positive: 'text-enchanted-green dark:text-light-ivory',
  pending: 'text-enchanted-green dark:text-light-ivory',
  alert: 'text-cranberry dark:text-cranberry-300',
  neutral: 'text-ink-soft dark:text-light-ivory/60',
};

export default function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] font-medium ${textTone[tone]}`}>
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotTone[tone]}`} />
      {children}
    </span>
  );
}
