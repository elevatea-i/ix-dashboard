interface StatusDotProps {
  tone: 'ok' | 'risk' | 'neutral';
  label: string;
}

const DOT_CLASSES = {
  ok: 'bg-ok',
  risk: 'bg-risk',
  neutral: 'bg-ink-muted',
};

export default function StatusDot({ tone, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-ink">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}
