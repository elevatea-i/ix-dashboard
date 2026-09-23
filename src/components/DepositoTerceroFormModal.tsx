import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Banknote, AlertCircle } from 'lucide-react';
import { getMexicoCityDate, formatLiveCurrency, parseCurrencyInput, formatCurrency } from '../utils';

function formatDbErrorMessage(message: string): string {
  return message.replace(
    /(disponible|depositado)(:\s*)(\d+(?:\.\d{1,2})?)/gi,
    (_match, label: string, separator: string, amount: string) =>
      `${label}${separator}${formatCurrency(Number(amount))}`
  );
}

interface DepositoTerceroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: { monto: number; fecha: string; nota: string | null },
    editId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  initialData: { id: string; monto: number; fecha: string; nota: string | null } | null;
  disponibleParaDepositar: number;
}

export default function DepositoTerceroFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  disponibleParaDepositar,
}: DepositoTerceroFormModalProps) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [nota, setNota] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = initialData !== null;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setDbError(null);
      setSubmitting(false);
      if (initialData) {
        setMonto(formatLiveCurrency(initialData.monto.toString()));
        setFecha(initialData.fecha);
        setNota(initialData.nota ?? '');
      } else {
        setMonto('');
        setFecha(getMexicoCityDate());
        setNota('');
      }
    }
  }, [isOpen, initialData]);

  const clearDbError = () => {
    if (dbError) setDbError(null);
  };

  const handleMontoChange = (val: string) => {
    setMonto(formatLiveCurrency(val));
    clearDbError();
  };

  const handleFechaChange = (val: string) => {
    setFecha(val);
    clearDbError();
  };

  const handleNotaChange = (val: string) => {
    setNota(val);
    clearDbError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const cleanMonto = parseCurrencyInput(monto);
    const parsedMonto = parseFloat(cleanMonto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      newErrors.monto = 'Ingrese un monto mayor a 0';
    }

    if (!fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const result = await onSubmit(
      {
        monto: Number(parsedMonto.toFixed(2)),
        fecha,
        nota: nota.trim() || null,
      },
      isEdit ? initialData!.id : undefined
    );

    setSubmitting(false);

    if (result.success) {
      onClose();
    } else if (result.error) {
      setDbError(result.error);
    }
  };

  const disponibleFormatted = disponibleParaDepositar.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="deposito-tercero-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="deposito-tercero-card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.12 } }}
            className="bg-white dark:bg-[#051A14] w-full max-w-lg rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col"
          >
            {/* Top accent bar */}
            <div className="h-[3px] bg-elevated-gold" />

            {/* Header */}
            <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between bg-white dark:bg-[#051A14]">
              <div className="flex items-center space-x-2">
                <Banknote className="text-elevated-gold" size={18} />
                <h2 className="text-xl font-serif font-bold text-enchanted-green dark:text-light-ivory">
                  {isEdit ? 'Editar depósito' : 'Registrar depósito'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 font-sans">
              {/* Disponible para depositar */}
              <div className="flex items-center justify-between p-3.5 bg-enchanted-green/5 dark:bg-white/5 rounded border border-enchanted-green/15 dark:border-white/10">
                <span className="text-xs font-bold text-enchanted-green dark:text-light-ivory">
                  Disponible para depositar
                </span>
                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-[#0B3D2E] dark:text-elevated-gold">
                    ${disponibleFormatted}
                  </span>
                  <span className="text-[9px] text-rocky-gray dark:text-light-ivory/60 block font-bold uppercase tracking-tight">
                    MXN
                  </span>
                </div>
              </div>

              {/* DB Error - shown exactly as returned */}
              {dbError && (
                <div className="p-3.5 bg-cranberry/10 dark:bg-cranberry/15 text-cranberry dark:text-cranberry border border-cranberry/30 dark:border-cranberry/40 rounded text-xs flex items-start gap-2 font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-cranberry" />
                  <span>{formatDbErrorMessage(dbError)}</span>
                </div>
              )}

              {/* Monto */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Monto <span className="text-cranberry font-bold">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monto}
                  onChange={(e) => handleMontoChange(e.target.value)}
                  placeholder="$0.00"
                  className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs ${
                    errors.monto
                      ? 'border-cranberry'
                      : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  }`}
                />
                {errors.monto && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.monto}</p>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Fecha <span className="text-cranberry font-bold">*</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs dark:[color-scheme:dark] ${
                    errors.fecha
                      ? 'border-cranberry'
                      : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  }`}
                />
                {errors.fecha && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.fecha}</p>
                )}
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Nota{' '}
                  <span className="text-rocky-gray dark:text-rose-linen/50 font-normal normal-case tracking-normal">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={nota}
                  onChange={(e) => handleNotaChange(e.target.value)}
                  rows={3}
                  placeholder="Ej. Depósito parcial correspondiente a factura #42"
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs resize-none"
                />
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-enchanted-green/10 dark:border-light-ivory/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-transparent border border-rocky-gray/40 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-enchanted-green dark:text-light-ivory px-4 py-2 rounded text-xs uppercase tracking-wider font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-[#0B3D2E] dark:hover:bg-elevated-gold/90 px-5 py-2 rounded text-xs uppercase tracking-wider font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
