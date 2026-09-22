import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';

interface EliminarDepositoTerceroModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposito: { id: string; monto: number; fecha: string; nota: string | null } | null;
  onConfirmDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function EliminarDepositoTerceroModal({
  isOpen,
  onClose,
  deposito,
  onConfirmDelete
}: EliminarDepositoTerceroModalProps) {
  const [saving, setSaving] = useState(false);

  if (!deposito) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirmDelete(deposito.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="eliminar-deposito-tercero-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="eliminar-deposito-tercero-card"
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
                <span>Eliminar Depósito</span>
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
                      Depósito de {formatCurrency(deposito.monto)} — Fecha: {formatDate(deposito.fecha)}
                    </p>
                    <p className="text-xs text-[#082019] dark:text-light-ivory/90 leading-relaxed font-semibold font-sans">
                      ¿Estás seguro de que deseas eliminar este depósito? Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
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
                  <span>{saving ? 'Eliminando…' : 'Eliminar depósito'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
