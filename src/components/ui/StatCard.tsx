import React from 'react';

type Tone = 'default' | 'positive' | 'alert';

interface StatCardProps {
  label: string;
  value: string;
  context?: React.ReactNode;
  tone?: Tone;
  featured?: boolean;
  id?: string;
}

const valueTone: Record<Tone, string> = {
  default: 'text-enchanted-green dark:text-light-ivory',
  positive: 'text-enchanted-green dark:text-light-ivory',
  alert: 'text-cranberry dark:text-cranberry-300',
};

export default function StatCard({ label, value, context, tone = 'default', featured = false, id }: StatCardProps) {
  if (featured) {
    return (
      <div
        id={id}
        className="relative overflow-hidden rounded-xl bg-enchanted-green dark:bg-paper-dark-raised text-light-ivory p-6 sm:p-7 ring-1 ring-black/5 dark:ring-white/[0.06] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <span aria-hidden className="absolute inset-x-6 sm:inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-elevated-gold/70 to-transparent" />
        <p className="eyebrow text-gold-300">{label}</p>
        <p className="num font-serif text-[40px] sm:text-[46px] font-medium leading-none mt-4">{value}</p>
        {context && <div className="text-[13px] text-light-ivory/65 mt-3">{context}</div>}
      </div>
    );
  }

  return (
    <div
      id={id}
      className="rounded-xl bg-paper dark:bg-paper-dark ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(11,61,46,0.18)]"
    >
      <p className="eyebrow text-ink-mute dark:text-light-ivory/45">{label}</p>
      <p className={`num text-[26px] font-semibold leading-none mt-4 ${valueTone[tone]}`}>{value}</p>
      {context && <div className="text-[13px] text-ink-soft dark:text-light-ivory/55 mt-3">{context}</div>}
    </div>
  );
}
