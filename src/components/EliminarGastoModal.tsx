/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
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
    <div id="eliminar-gasto-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-enchanted-green/80 dark:bg-black/80 backdrop-blur-sm">
      <div id="eliminar-gasto-modal-card" className="bg-light-ivory dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-cranberry/30 overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-cranberry flex items-center space-x-2">
            <Trash2 size={18} className="text-cranberry animate-pulse" />
            <span>Eliminar Gasto Vinculado</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-enchanted-green/60 dark:text-light-ivory/60 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 bg-cranberry/5 p-3.5 rounded border border-cranberry/25">
              <AlertTriangle className="text-cranberry shrink-0 mt-0.5" size={18} />
              <div className="space-y-2 w-full">
                <p className="text-xs font-bold text-cranberry uppercase tracking-wide">
                  Advertencia de Reversión
                </p>
                <p className="text-xs text-enchanted-green dark:text-light-ivory leading-relaxed">
                  Este gasto se generó al resolver un registro de Por Impactar (<strong>'{linkedPorImpactar?.descripcion}'</strong>, {linkedPorImpactar ? formatCurrency(linkedPorImpactar.monto) : ''}).
                </p>
                <p className="text-xs text-enchanted-green dark:text-light-ivory/90 leading-relaxed">
                  Al eliminarlo, ese registro volverá a estado Pendiente. ¿Confirmar?
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory border border-rocky-gray/20 rounded hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-cranberry hover:bg-cranberry/90 text-white rounded shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Trash2 size={14} />
              <span>Confirmar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
