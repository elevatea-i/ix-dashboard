import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Expense, PorImpactar } from '../types';
import { formatCurrency } from '../utils';

interface EliminarGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  linkedPorImpactar: PorImpactar | null;
  onConfirmDelete: (expenseId: string, revertPorImpactarId: string | null) => void;
}

export default function EliminarGastoModal({
  isOpen,
  onClose,
  expense,
  linkedPorImpactar,
  onConfirmDelete
}: EliminarGastoModalProps) {
  if (!isOpen || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDelete(expense.id, linkedPorImpactar ? linkedPorImpactar.id : null);
  };

  return (
    <div
      id="eliminar-gasto-modal-container"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#051A14]/45 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        id="eliminar-gasto-modal-card"
        role="dialog"
        aria-modal="true"
        className="bg-paper dark:bg-paper-dark w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl ring-1 ring-cranberry/20 dark:ring-cranberry-300/20 shadow-[0_24px_64px_-16px_rgba(5,26,20,0.35)] overflow-hidden"
      >
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-enchanted-green/[0.07] dark:border-white/[0.06] flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-cranberry dark:text-cranberry-300">Acción irreversible</p>
            <h3 className="font-serif text-[24px] leading-tight font-medium text-enchanted-green dark:text-light-ivory mt-1.5">
              Eliminar gasto
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-9 w-9 -mr-2 inline-flex items-center justify-center rounded-lg text-ink-mute dark:text-light-ivory/50 hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3.5 border-l-2 border-cranberry dark:border-cranberry-300 pl-4 py-1">
            <AlertTriangle className="text-cranberry dark:text-cranberry-300 shrink-0 mt-0.5" size={19} strokeWidth={1.7} />
            <div className="space-y-2">
              <p className="eyebrow text-cranberry dark:text-cranberry-300">
                {linkedPorImpactar ? 'Advertencia de reversión' : 'Confirmación de eliminación'}
              </p>
              <p className="text-[15px] font-medium text-enchanted-green dark:text-light-ivory">
                {expense.concepto} <span className="num text-ink-mute dark:text-light-ivory/60">{formatCurrency(expense.total)}</span>
              </p>
              {linkedPorImpactar ? (
                <p className="text-[14px] leading-relaxed text-ink-soft dark:text-light-ivory/75">
                  Este gasto se generó al resolver “{linkedPorImpactar.descripcion}”. Al eliminarlo, ese registro volverá a estado pendiente.
                </p>
              ) : (
                <p className="text-[14px] leading-relaxed text-ink-soft dark:text-light-ivory/75">
                  Esta acción afectará los cálculos de Rentabilidad e IVA del proyecto y no se puede deshacer.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-enchanted-green/[0.07] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 inline-flex items-center justify-center px-4 rounded-lg border border-enchanted-green/[0.15] dark:border-white/[0.12] text-[14px] font-medium text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/[0.04] dark:hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-cranberry text-white text-[14px] font-medium hover:bg-cranberry-700 transition-colors"
            >
              <Trash2 size={15} strokeWidth={1.7} />
              Eliminar gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
