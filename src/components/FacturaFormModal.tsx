/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, Invoice } from '../types';
import { X, AlertCircle } from 'lucide-react';

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    folio: string;
    proyectoId: string;
    subtotal: number;
    iva: number;
    retencionIsr: number;
    retencionIva: number;
    metodoPago: 'PUE' | 'PPD';
    complementoEmitido?: boolean;
    fechaEmision: string;
  }) => void;
  initialData: Invoice | null;
  projects: Project[];
}

export default function FacturaFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects
}: FacturaFormModalProps) {
  const [folio, setFolio] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [subtotal, setSubtotal] = useState<number>(0);
  const [iva, setIva] = useState<number>(0);
  const [retencionIsr, setRetencionIsr] = useState<number>(0);
  const [retencionIva, setRetencionIva] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'PUE' | 'PPD'>('PUE');
  const [complementoEmitido, setComplementoEmitido] = useState<boolean>(false);
  const [fechaEmision, setFechaEmision] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Auto-calculate 16% IVA when subtotal changes
  const handleSubtotalChange = (val: number) => {
    setSubtotal(val);
    // Calculated as exactly 16% of subtotal
    const calculatedIva = Number((val * 0.16).toFixed(2));
    setIva(calculatedIva);
  };

  // Recalculate total for read-only preview display
  const calculatedTotal = Number(
    (subtotal + iva - retencionIsr - retencionIva).toFixed(2)
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFolio(initialData.folio);
        setProyectoId(initialData.proyectoId);
        setSubtotal(initialData.subtotal);
        setIva(initialData.iva);
        setRetencionIsr(initialData.retencionIsr);
        setRetencionIva(initialData.retencionIva);
        setMetodoPago(initialData.metodoPago);
        setComplementoEmitido(initialData.complementoEmitido ?? false);
        setFechaEmision(initialData.fechaEmision);
      } else {
        setFolio('');
        setProyectoId(projects.length > 0 ? projects[0].id : '');
        setSubtotal(0);
        setIva(0);
        setRetencionIsr(0);
        setRetencionIva(0);
        setMetodoPago('PUE');
        setComplementoEmitido(false);
        setFechaEmision('');
      }
      setErrors({});
    }
  }, [isOpen, initialData, projects]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!folio.trim()) {
      newErrors.folio = 'El folio del CFDI es requerido.';
    }
    if (!proyectoId) {
      newErrors.proyectoId = 'Debe seleccionar un proyecto.';
    }
    if (subtotal <= 0) {
      newErrors.subtotal = 'El subtotal debe ser un número mayor a 0.';
    }
    if (iva < 0) {
      newErrors.iva = 'El IVA no puede ser negativo.';
    }
    if (retencionIsr < 0) {
      newErrors.retencionIsr = 'La retención de ISR no puede ser negativa.';
    }
    if (retencionIva < 0) {
      newErrors.retencionIva = 'La retención de IVA no puede ser negativa.';
    }
    if (!fechaEmision) {
      newErrors.fechaEmision = 'Debe seleccionar la fecha de emisión de la factura.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      folio: folio.trim(),
      proyectoId,
      subtotal,
      iva,
      retencionIsr,
      retencionIva,
      metodoPago,
      complementoEmitido: metodoPago === 'PPD' ? complementoEmitido : undefined,
      fechaEmision
    });
  };

  return (
    <div id="invoice-form-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-enchanted-green/80 dark:bg-black/80 backdrop-blur-sm">
      <div id="invoice-form-modal-card" className="bg-light-ivory dark:bg-[#051A14] w-full max-w-3xl rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-lg font-medium text-enchanted-green dark:text-light-ivory">
            {initialData ? 'Editar Factura / CFDI' : 'Registrar Nueva Factura CFDI'}
          </h3>
          <button
            id="close-invoice-modal-btn"
            onClick={onClose}
            className="text-enchanted-green/60 dark:text-light-ivory/60 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {projects.length === 0 ? (
            <div id="no-projects-warning" className="p-5 border border-cranberry/20 bg-rose-linen/20 rounded-lg flex flex-col items-center text-center space-y-3">
              <AlertCircle size={32} className="text-cranberry" />
              <div>
                <p className="text-sm font-semibold text-cranberry">No hay proyectos registrados</p>
                <p className="text-xs text-enchanted-green/80 dark:text-light-ivory/80 mt-1">
                  Debe registrar al menos un proyecto en el catálogo para poder emitir o registrar facturas vinculadas.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-cranberry text-white text-xs font-semibold rounded hover:bg-cranberry/90 transition-colors"
              >
                Entendido
              </button>
            </div>
          ) : (
            <>
              {/* Folio y Proyecto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                    Folio CFDI <span className="text-cranberry">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    placeholder="Ej. IX01, B-452"
                    className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                  />
                  {errors.folio && (
                    <p className="text-xs text-cranberry mt-1 font-medium">{errors.folio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                    Proyecto Asociado <span className="text-cranberry">*</span>
                  </label>
                  <select
                    value={proyectoId}
                    onChange={(e) => setProyectoId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id} className="bg-light-ivory dark:bg-[#051A14]">
                        [{proj.codigo}] {proj.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.proyectoId && (
                    <p className="text-xs text-cranberry mt-1 font-medium">{errors.proyectoId}</p>
                  )}
                </div>
              </div>

              {/* Fecha Emisión y Método Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                    Fecha de Emisión <span className="text-cranberry">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                  />
                  {errors.fechaEmision && (
                    <p className="text-xs text-cranberry mt-1 font-medium">{errors.fechaEmision}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                    Método de Pago <span className="text-cranberry">*</span>
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as 'PUE' | 'PPD')}
                    className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors font-mono font-bold"
                  >
                    <option value="PUE" className="bg-light-ivory dark:bg-[#051A14]">PUE</option>
                    <option value="PPD" className="bg-light-ivory dark:bg-[#051A14]">PPD</option>
                  </select>
                </div>
              </div>

              {/* Condicional: Complemento Emitido si es PPD */}
              {metodoPago === 'PPD' && (
                <div className="p-3 border border-elevated-gold/20 bg-elevated-gold/5 rounded flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory">Complemento de Pago Emitido</p>
                    <p className="text-[10px] text-rocky-gray">¿Se ha emitido y timbrado el complemento de pago correspondiente?</p>
                  </div>
                  <select
                    value={complementoEmitido ? 'si' : 'no'}
                    onChange={(e) => setComplementoEmitido(e.target.value === 'si')}
                    className="px-3 py-1.5 bg-light-ivory dark:bg-[#070D0C] border border-enchanted-green/20 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold"
                  >
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                  </select>
                </div>
              )}

              {/* Cifras Financieras */}
              <div className="pt-3 border-t border-enchanted-green/10 dark:border-white/10 space-y-4">
                <p className="text-xs uppercase font-bold tracking-wider text-elevated-gold">Valores del CFDI</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                      Subtotal <span className="text-cranberry">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-sm text-rocky-gray">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={subtotal || ''}
                        onChange={(e) => handleSubtotalChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                      />
                    </div>
                    {errors.subtotal && (
                      <p className="text-xs text-cranberry mt-1 font-medium">{errors.subtotal}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                      IVA (16% pre-calculado, editable)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-sm text-rocky-gray">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={iva || ''}
                        onChange={(e) => setIva(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                      />
                    </div>
                    {errors.iva && (
                      <p className="text-xs text-cranberry mt-1 font-medium">{errors.iva}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                      Retención ISR (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-sm text-rocky-gray">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={retencionIsr || ''}
                        onChange={(e) => setRetencionIsr(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                      />
                    </div>
                    {errors.retencionIsr && (
                      <p className="text-xs text-cranberry mt-1 font-medium">{errors.retencionIsr}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                      Retención IVA (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-sm text-rocky-gray">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={retencionIva || ''}
                        onChange={(e) => setRetencionIva(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
                      />
                    </div>
                    {errors.retencionIva && (
                      <p className="text-xs text-cranberry mt-1 font-medium">{errors.retencionIva}</p>
                    )}
                  </div>
                </div>

                {/* Total Visualizer Display Box */}
                <div className="p-3.5 bg-enchanted-green/5 dark:bg-[#071310] border border-enchanted-green/15 dark:border-light-ivory/10 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80">Total del CFDI</p>
                    <p className="text-[10px] text-rocky-gray">Calculado como: subtotal + iva - retenciones</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono font-bold text-enchanted-green dark:text-light-ivory">
                      ${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-elevated-gold tracking-wider uppercase font-semibold">Solo lectura</p>
                  </div>
                </div>
              </div>

              {/* Buttons Footer */}
              <div className="mt-6 pt-5 border-t border-rocky-gray/20 dark:border-white/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-transparent text-sm font-medium text-enchanted-green dark:text-light-ivory border border-enchanted-green/20 dark:border-light-ivory/20 hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green font-semibold text-sm hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 rounded shadow transition-colors"
                >
                  {initialData ? 'Guardar Cambios' : 'Registrar Factura'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
