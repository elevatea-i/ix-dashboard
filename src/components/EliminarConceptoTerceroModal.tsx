import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';

interface EliminarConceptoTerceroModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepto: { id: string; concepto: string; saldoOriginal: number; montoADepositar: number; statusFac: 'Disponible' | 'Por pagar' } | null;
  restanteActual: number;
  onConfirmDelete: (id: string) => Promise<void>;
}

export default function EliminarConceptoTerceroModal({
  isOpen,
  onClose,
  concepto,
  restanteActual,
  onConfirmDelete
}: EliminarConceptoTerceroModalProps) {
  const [saving, setSaving] = useState(false);

  if (!concepto) return null;

  const nuevoRestante = concepto.statusFac === 'Disponible'
    ? restanteActual - concepto.montoADepositar
    : null;

  const showNegativeWarning = nuevoRestante !== null && nuevoRestante < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirmDelete(concepto.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="eliminar-concepto-tercero-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="eliminar-concepto-tercero-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-cranberry/30 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-cranberry flex items-center space-x-2">
                <AlertTriangle size={18} className="text-cranberry" />
                <span>Eliminar Concepto</span>
              </h3>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
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
                      Advertencia
                    </p>
                    <p className="text-sm text-[#082019] dark:text-light-ivory font-semibold">
                      {concepto.concepto} — Saldo original: {formatCurrency(concepto.saldoOriginal)}
                    </p>
                    <p className="text-xs text-[#082019] dark:text-light-ivory/90 leading-relaxed font-semibold font-sans">
                      ¿Estás seguro de que deseas eliminar este concepto? Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                {showNegativeWarning && (
                  <div className="flex items-start space-x-3 bg-cranberry/10 p-3.5 rounded border border-cranberry/40">
                    <AlertTriangle className="text-cranberry shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-cranberry leading-relaxed font-semibold font-sans">
                      Al eliminar este concepto, el restante de la cuenta quedará negativo ({formatCurrency(nuevoRestante)}). Esto indica que se ha depositado más de lo disponible.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory border border-rocky-gray/20 rounded hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-cranberry hover:bg-cranberry/90 text-white rounded shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{saving ? 'Eliminando…' : 'Eliminar concepto'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
