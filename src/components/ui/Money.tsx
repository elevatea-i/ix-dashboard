import { formatCurrency } from '../../utils';

interface MoneyProps {
  value: number;
  size?: 'lg' | 'md' | 'sm';
}

const SIZE_CLASSES = {
  lg: 'text-[40px] font-semibold tracking-tight leading-[1.1]',
  md: 'text-[28px] font-semibold tracking-tight leading-[1.2]',
  sm: 'text-[15px] font-semibold',
};

export default function Money({ value, size = 'md' }: MoneyProps) {
  const formatted = formatCurrency(value);
  const dot = formatted.lastIndexOf('.');
  const whole = dot === -1 ? formatted : formatted.slice(0, dot);
  const decimals = dot === -1 ? '' : formatted.slice(dot);

  return (
    <span className={`whitespace-nowrap text-ink tabular-nums ${SIZE_CLASSES[size]}`}>
      {whole}
      {decimals && <span className="text-[0.6em] text-ink-muted">{decimals}</span>}
    </span>
  );
}
