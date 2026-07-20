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
  facturadoPor?: 'IX' | 'Juan Carlos';
}

export default function MarcarPagadaModal({
  isOpen,
  onClose,
  onConfirm,
  folio,
  facturadoPor = 'IX'
}: MarcarPagadaModalProps) {
  const [fechaPago, setFechaPago] = useState('');
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFechaPago(getMexicoCityDate());
      setConfirmTransfer(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaPago) return;
    if (facturadoPor === 'Juan Carlos' && !confirmTransfer) {
      return;
    }
    onConfirm(fechaPago);
  };

  return (
    <div id="marcar-pagada-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div id="marcar-pagada-modal-card" className="bg-white dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory flex items-center space-x-2">
            <Calendar size={18} className="text-elevated-gold" />
            <span>Registrar Pago de Factura</span>
          </h3>
          <button
            onClick={onClose}
            className="text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-enchanted-green/90 dark:text-light-ivory/90 leading-relaxed">
            Se registrará la factura con folio <strong className="font-mono text-elevated-gold">{folio}</strong> como <span className="font-semibold text-[#0B3D2E] dark:text-[#8C7853]">PAGADA</span>.
          </div>

          {facturadoPor === 'Juan Carlos' && (
            <div className="p-4 bg-cranberry/10 border border-cranberry/30 rounded-lg space-y-3">
              <p className="text-xs text-cranberry dark:text-rose-linen/90 font-medium leading-relaxed">
                ⚠️ <strong>Aviso Importante:</strong> Esta factura fue emitida bajo la razón social de Juan Carlos. Márcala como Pagada únicamente cuando él ya te haya transferido el dinero — no cuando el cliente le pague a él. ¿Confirmar que el dinero ya fue transferido?
              </p>
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmTransfer}
                  onChange={(e) => setConfirmTransfer(e.target.checked)}
                  className="mt-0.5 rounded border-cranberry text-cranberry focus:ring-cranberry/30"
                />
                <span className="text-[11px] font-bold text-cranberry dark:text-rose-linen">
                  Sí, confirmo que el dinero ya fue transferido por Juan Carlos a la cuenta principal.
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
              Fecha Real de Pago <span className="text-cranberry font-bold">*</span>
            </label>
            <input
              type="date"
              required
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
            />
            <p className="text-[10px] text-rocky-gray mt-1.5 font-medium">
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
              disabled={facturadoPor === 'Juan Carlos' && !confirmTransfer}
              className={`px-4 py-2 text-white dark:text-enchanted-green font-bold text-xs rounded transition-colors shadow ${
                facturadoPor === 'Juan Carlos' && !confirmTransfer
                  ? 'bg-rocky-gray/50 cursor-not-allowed text-white/50'
                  : 'bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90'
              }`}
            >
              Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
