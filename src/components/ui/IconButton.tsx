import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  tone?: 'default' | 'danger';
  icon: ReactNode;
};

export default function IconButton({
  label,
  tone = 'default',
  icon,
  type = 'button',
  className = '',
  ...rest
}: IconButtonProps) {
  const toneClass = tone === 'danger' ? 'hover:text-risk' : 'hover:text-ink';
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-ink/5 ${toneClass} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
