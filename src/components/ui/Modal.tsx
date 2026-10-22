import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  id: string;
  cardId: string;
  closeButtonId?: string;
  eyebrow: string;
  title: string;
  onClose: () => void;
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

export default function Modal({ id, cardId, closeButtonId, eyebrow, title, onClose, size = 'md', children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#051A14]/45 dark:bg-black/60 animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        id={cardId}
        role="dialog"
        aria-modal="true"
        className={`w-full ${size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-md'} max-h-[94vh] flex flex-col bg-paper dark:bg-paper-dark-raised rounded-t-2xl sm:rounded-2xl ring-1 ring-enchanted-green/[0.08] dark:ring-white/[0.08] shadow-[0_24px_64px_-16px_rgba(5,26,20,0.35)]`}
      >
        <div className="px-6 sm:px-8 pt-6 pb-5 flex items-start justify-between gap-4 border-b border-enchanted-green/[0.07] dark:border-white/[0.06]">
          <div>
            <p className="eyebrow text-elevated-gold dark:text-gold-300">{eyebrow}</p>
            <h3 className="font-serif text-[24px] leading-tight font-medium text-enchanted-green dark:text-light-ivory mt-1.5">{title}</h3>
          </div>
          <button
            id={closeButtonId}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-9 w-9 -mr-2 inline-flex items-center justify-center rounded-lg text-ink-mute dark:text-light-ivory/50 hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 sm:px-8 py-4 border-t border-enchanted-green/[0.07] dark:border-white/[0.06] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
      {children}
    </div>
  );
}

type NoticeTone = 'alert' | 'gold';

const noticeTone: Record<NoticeTone, string> = {
  alert: 'border-cranberry dark:border-cranberry-300',
  gold: 'border-elevated-gold dark:border-gold-300',
};

const noticeTitleTone: Record<NoticeTone, string> = {
  alert: 'text-cranberry dark:text-cranberry-300',
  gold: 'text-elevated-gold dark:text-gold-300',
};

export function Notice({ tone, title, children }: { tone: NoticeTone; title: string; children: React.ReactNode }) {
  return (
    <div className={`border-l-2 pl-4 py-1 space-y-2 ${noticeTone[tone]}`}>
      <p className={`eyebrow ${noticeTitleTone[tone]}`}>{title}</p>
      <div className="text-[14px] leading-relaxed text-ink-soft dark:text-light-ivory/75 space-y-3">{children}</div>
    </div>
  );
}

export const fieldLabel = 'block text-[13px] font-medium text-enchanted-green dark:text-light-ivory/85 mb-2';

export const fieldInput =
  'w-full h-11 px-3.5 rounded-lg bg-white dark:bg-paper-dark border border-enchanted-green/[0.14] dark:border-white/10 text-[14px] text-enchanted-green dark:text-light-ivory placeholder:text-ink-mute dark:placeholder:text-light-ivory/35 focus:outline-none focus:border-elevated-gold focus:ring-2 focus:ring-elevated-gold/15 transition-colors dark:[&>option]:bg-paper-dark';

export const fieldHint = 'text-[12px] text-ink-mute dark:text-light-ivory/45 mt-2 leading-relaxed';

export const fieldError = 'text-[12px] text-cranberry dark:text-cranberry-300 mt-1.5 font-medium';

const buttonBase = 'h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg text-[14px] font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed';

export const buttonSecondary = `${buttonBase} border border-enchanted-green/[0.15] dark:border-white/[0.12] text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/[0.04] dark:hover:bg-white/[0.05]`;

export const buttonPrimary = `${buttonBase} bg-enchanted-green dark:bg-light-ivory text-light-ivory dark:text-enchanted-green hover:bg-green-500 dark:hover:bg-white disabled:hover:bg-enchanted-green dark:disabled:hover:bg-light-ivory`;

export const buttonDanger = `${buttonBase} bg-cranberry text-white hover:bg-cranberry-700`;
