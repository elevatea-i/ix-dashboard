import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { PorImpactar } from '../types';
import { formatCurrency, getMexicoCityDate } from '../utils';

export interface MarcarPagadoPorImpactarData {
  fechaPago: string;
  tieneFactura: boolean;
  iva: number;
}

interface MarcarPagadoPorImpactarModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PorImpactar | null;
  onConfirm: (recordId: string, data: MarcarPagadoPorImpactarData) => void;
}

export default function MarcarPagadoPorImpactarModal({
  isOpen,
  onClose,
  record,
  onConfirm
}: MarcarPagadoPorImpactarModalProps) {
  const [fechaPago, setFechaPago] = useState('');
  const [tieneFactura, setTieneFactura] = useState(false);
  const [iva, setIva] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const defaultIva = (rec: PorImpactar) =>
    rec.iva > 0 ? rec.iva : Number((rec.monto * 0.16).toFixed(2));

  useEffect(() => {
    if (isOpen && record) {
      setErrors({});
      setFechaPago(getMexicoCityDate());
      setTieneFactura(record.tieneFactura);
      setIva(defaultIva(record).toString());
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const handleAutoCalculateIva = () => {
    setIva(Number((record.monto * 0.16).toFixed(2)).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fechaPago) {
      newErrors.fechaPago = 'La fecha de pago es requerida';
    }
    const parsedIva = parseFloat(iva);
    if (tieneFactura && (isNaN(parsedIva) || parsedIva < 0)) {
      newErrors.iva = 'El IVA debe ser un número igual o mayor a 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(record.id, {
      fechaPago,
      tieneFactura,
      iva: tieneFactura ? Number(parsedIva.toFixed(2)) : 0
    });
  };

  return (
    <div id="marcar-pagado-por-impactar-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div id="marcar-pagado-por-impactar-modal-card" className="bg-white dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden">
        <div className="h-[3px] bg-elevated-gold"></div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory flex items-center space-x-2">
            <Calendar size={18} className="text-elevated-gold" />
            <span>Marcar pagado al proveedor</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
          <div className="p-3 rounded bg-enchanted-green/5 dark:bg-white/5 border border-enchanted-green/10 dark:border-white/5">
            <p className="text-sm font-semibold text-enchanted-green dark:text-light-ivory">{record.descripcion}</p>
            <p className="text-xs text-rocky-gray dark:text-rose-linen/80 mt-0.5">
              Monto (sin IVA): <span className="font-mono font-bold text-enchanted-green dark:text-elevated-gold">{formatCurrency(record.monto)}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
              Fecha Real de Pago <span className="text-cranberry font-bold">*</span>
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border ${
                errors.fechaPago ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
              } rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs [color-scheme:light] dark:[color-scheme:dark]`}
            />
            {errors.fechaPago ? (
              <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                <AlertTriangle size={12} />
                <span>{errors.fechaPago}</span>
              </p>
            ) : (
              <p className="text-[10px] text-rocky-gray mt-1.5 font-medium">
                Por defecto es hoy (Ciudad de México). Si tiene factura, el IVA cuenta en el mes de esta fecha.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="tieneFacturaMarcarPagado"
              checked={tieneFactura}
              onChange={(e) => setTieneFactura(e.target.checked)}
              className="w-4 h-4 text-enchanted-green border-rocky-gray/40 rounded focus:ring-elevated-gold"
            />
            <label htmlFor="tieneFacturaMarcarPagado" className="text-xs font-bold text-enchanted-green dark:text-light-ivory select-none">
              ¿Tiene factura CFDI?
            </label>
          </div>

          {tieneFactura && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90">
                  IVA <span className="text-cranberry font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoCalculateIva}
                  className="text-[10px] font-semibold text-elevated-gold hover:underline focus:outline-none"
                  title="Calcular 16% sobre el monto"
                >
                  +16%
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border ${
                  errors.iva ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                } rounded text-sm font-mono text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs`}
              />
              {errors.iva && (
                <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{errors.iva}</span>
                </p>
              )}
            </div>
          )}

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
              className="px-4 py-2 bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-white dark:text-enchanted-green font-bold text-xs rounded transition-colors shadow"
            >
              Confirmar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
