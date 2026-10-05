import Money from './Money';

interface SummaryItem {
  id?: string;
  label: string;
  value: number;
  note?: string;
  primary?: boolean;
}

interface SummaryStripProps {
  items: SummaryItem[];
}

export default function SummaryStrip({ items }: SummaryStripProps) {
  return (
    <div className="flex flex-wrap rounded-lg border border-line bg-panel">
      {items.map((item, index) => (
        <div
          key={item.label}
          id={item.id}
          className={`min-w-[200px] px-6 py-5 ${item.primary ? 'flex-[1.5]' : 'flex-1'} ${
            index > 0 ? 'border-l border-line' : ''
          }`}
        >
          <p className="text-[13px] text-ink-muted">{item.label}</p>
          <div className="mt-2">
            <Money value={item.value} size={item.primary ? 'lg' : 'md'} />
          </div>
          {item.note && <p className="mt-1 text-[13px] text-ink-muted">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}
