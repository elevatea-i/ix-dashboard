/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { getMexicoCityDate } from '../utils';

interface MarcarPagadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fechaPago: string) => void;
  folio: string;
}

export default function MarcarPagadaModal({
  isOpen,
  onClose,
  onConfirm,
  folio
}: MarcarPagadaModalProps) {
  const [fechaPago, setFechaPago] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFechaPago(getMexicoCityDate());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaPago) return;
    onConfirm(fechaPago);
  };

  return (
    <div id="marcar-pagada-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-enchanted-green/80 dark:bg-black/80 backdrop-blur-sm">
      <div id="marcar-pagada-modal-card" className="bg-light-ivory dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-enchanted-green dark:text-light-ivory flex items-center space-x-2">
            <Calendar size={18} className="text-elevated-gold" />
            <span>Registrar Pago de Factura</span>
          </h3>
          <button
            onClick={onClose}
            className="text-enchanted-green/60 dark:text-light-ivory/60 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-enchanted-green/90 dark:text-light-ivory/90 leading-relaxed">
            Se registrará la factura con folio <strong className="font-mono text-elevated-gold">{folio}</strong> como <span className="font-semibold text-[#0B3D2E] dark:text-[#8C7853]">PAGADA</span>.
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
              Fecha Real de Pago <span className="text-cranberry">*</span>
            </label>
            <input
              type="date"
              required
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            />
            <p className="text-[10px] text-rocky-gray mt-1.5">
              Por defecto se selecciona el día de hoy en la zona horaria de la Ciudad de México. Puede cambiarla si el cobro se efectuó en otra fecha.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-rocky-gray/15 dark:border-white/10 flex justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-transparent text-xs font-semibold text-enchanted-green dark:text-light-ivory border border-enchanted-green/20 dark:border-light-ivory/20 hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green font-bold text-xs hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 rounded transition-colors shadow"
            >
              Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
