/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { getMexicoCityDate } from '../utils';

interface RecibirDineroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fechaRecibido: string) => void;
  concepto: string;
}

export default function RecibirDineroModal({
  isOpen,
  onClose,
  onConfirm,
  concepto
}: RecibirDineroModalProps) {
  const [fechaRecibido, setFechaRecibido] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFechaRecibido(getMexicoCityDate());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaRecibido) return;
    onConfirm(fechaRecibido);
  };

  return (
    <div id="recibir-dinero-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div id="recibir-dinero-modal-card" className="bg-white dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory flex items-center space-x-2">
            <Calendar size={18} className="text-elevated-gold" />
            <span>Confirmar Recepción de Dinero</span>
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
            ¿Confirmas que has recibido el dinero para el pago a terceros: <strong className="text-elevated-gold">{concepto}</strong>?
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
              Fecha de Recepción <span className="text-cranberry font-bold">*</span>
            </label>
            <input
              type="date"
              required
              value={fechaRecibido}
              onChange={(e) => setFechaRecibido(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
            />
            <p className="text-[10px] text-rocky-gray mt-1.5 font-medium">
              Por defecto se selecciona el día de hoy en la zona horaria de la Ciudad de México. Puede cambiarla si el dinero fue entregado en otra fecha.
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
              className="px-4 py-2 text-white dark:text-enchanted-green font-bold text-xs rounded bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-colors shadow"
            >
              Marcar como Recibido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
