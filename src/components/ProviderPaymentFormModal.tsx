/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, Layers, CreditCard, Calculator } from 'lucide-react';
import { Project, ProviderPayment } from '../types';
import { getMexicoCityDate } from '../utils';

interface ProviderPaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    proyectoId: string;
    proveedor: string;
    subtotal: number;
    iva: number;
    isrRetenido: number;
    ivaRetenido: number;
    total: number;
    tieneFactura: boolean;
    estatus: 'Pagado' | 'Pendiente';
    fecha: string;
  }) => void;
  initialData: ProviderPayment | null;
  projects: Project[];
}

/**
 * ProviderPaymentFormModal is a highly polished React modal dialog
 * for creating and updating payments to event suppliers with a complete fiscal breakdown.
 */
export default function ProviderPaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects
}: ProviderPaymentFormModalProps) {
  const [proyectoId, setProyectoId] = useState<string>('');
  const [proveedor, setProveedor] = useState<string>('');
  
  // Fiscal Breakdown States
  const [subtotal, setSubtotal] = useState<string>('');
  const [iva, setIva] = useState<string>('');
  const [isrRetenido, setIsrRetenido] = useState<string>('0.00');
  const [ivaRetenido, setIvaRetenido] = useState<string>('0.00');

  const [tieneFactura, setTieneFactura] = useState<boolean>(false);
  const [estatus, setEstatus] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [fecha, setFecha] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setProyectoId(initialData.proyectoId);
        setProveedor(initialData.proveedor);
        setSubtotal(initialData.subtotal.toString());
        setIva(initialData.iva.toString());
        setIsrRetenido(initialData.isrRetenido.toString());
        setIvaRetenido(initialData.ivaRetenido.toString());
        setTieneFactura(initialData.tieneFactura);
        setEstatus(initialData.estatus);
        setFecha(initialData.fecha);
      } else {
        setProyectoId(projects.length > 0 ? projects[0].id : '');
        setProveedor('');
        setSubtotal('');
        setIva('');
        setIsrRetenido('0.00');
        setIvaRetenido('0.00');
        setTieneFactura(false);
        setEstatus('Pagado');
        setFecha(getMexicoCityDate());
      }
    }
  }, [isOpen, initialData, projects]);

  const handleSubtotalChange = (val: string) => {
    setSubtotal(val);
    const sub = parseFloat(val);
    if (!isNaN(sub) && sub >= 0) {
      setIva((sub * 0.16).toFixed(2));
    } else {
      setIva('');
    }
  };

  const numSubtotal = parseFloat(subtotal) || 0;
  const numIva = parseFloat(iva) || 0;
  const numIsrRetenido = parseFloat(isrRetenido) || 0;
  const numIvaRetenido = parseFloat(ivaRetenido) || 0;
  const computedTotal = Math.max(0, numSubtotal + numIva - numIsrRetenido - numIvaRetenido);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!proyectoId) {
      newErrors.proyectoId = 'Debe seleccionar un proyecto válido';
    }
    if (!proveedor.trim()) {
      newErrors.proveedor = 'El nombre del proveedor es requerido';
    }
    if (isNaN(numSubtotal) || numSubtotal <= 0) {
      newErrors.subtotal = 'Ingrese un subtotal mayor a 0';
    }
    if (isNaN(numIva) || numIva < 0) {
      newErrors.iva = 'Ingrese un IVA válido o deje 0';
    }
    if (isNaN(numIsrRetenido) || numIsrRetenido < 0) {
      newErrors.isrRetenido = 'Ingrese una retención válida o deje 0';
    }
    if (isNaN(numIvaRetenido) || numIvaRetenido < 0) {
      newErrors.ivaRetenido = 'Ingrese una retención válida o deje 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      proyectoId,
      proveedor: proveedor.trim(),
      subtotal: Number(numSubtotal.toFixed(2)),
      iva: Number(numIva.toFixed(2)),
      isrRetenido: Number(numIsrRetenido.toFixed(2)),
      ivaRetenido: Number(numIvaRetenido.toFixed(2)),
      total: Number(computedTotal.toFixed(2)),
      tieneFactura,
      estatus,
      fecha
    });
  };

  if (!isOpen) return null;

  return (
    <div id="provider-payment-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051A14]/80 backdrop-blur-sm">
      <div id="provider-payment-modal-card" className="bg-light-ivory dark:bg-[#051A14] w-full max-w-2xl rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
              {initialData ? 'Editar Pago a Proveedor' : 'Registrar Pago a Proveedor'}
            </h3>
            <p className="text-xs text-rocky-gray dark:text-rose-linen/60 mt-0.5">
              Control fiscal granular de egresos directos a subcontratistas y proveedores por evento.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Picker */}
          <div>
            <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5 flex items-center gap-1">
              <Layers size={13} className="text-[#8C7853] dark:text-elevated-gold" />
              <span>Proyecto Vinculado <span className="text-cranberry">*</span></span>
            </label>
            {projects.length === 0 ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-linen/30 border border-cranberry/30 rounded text-xs text-cranberry">
                <AlertTriangle size={14} className="shrink-0" />
                <span>No hay proyectos creados. Primero registre un proyecto para poder asignarle pagos de proveedores.</span>
              </div>
            ) : (
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className={`w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                  errors.proyectoId ? 'border-cranberry' : 'border-enchanted-green/20 dark:border-light-ivory/20'
                }`}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-light-ivory dark:bg-[#051A14]">
                    [{p.codigo}] {p.nombre}
                  </option>
                ))}
              </select>
            )}
            {errors.proyectoId && (
              <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.proyectoId}</p>
            )}
          </div>

          {/* Supplier Name */}
          <div>
            <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5">
              Nombre del Proveedor <span className="text-cranberry">*</span>
            </label>
            <input
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="ej. Carpas del Norte, Mobiliario Eventos SA"
              className={`w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                errors.proveedor ? 'border-cranberry' : 'border-enchanted-green/20 dark:border-light-ivory/20'
              }`}
            />
            {errors.proveedor && (
              <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.proveedor}</p>
            )}
          </div>

          {/* Fiscal Breakdown Grid */}
          <div className="bg-white/50 dark:bg-[#070D0C]/30 p-4 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold flex items-center gap-1.5">
              <Calculator size={14} />
              <span>Desglose de Impuestos y Totales</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subtotal */}
              <div>
                <label className="block text-[11px] font-bold text-enchanted-green dark:text-rose-linen mb-1">
                  Subtotal <span className="text-cranberry">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={subtotal}
                    onChange={(e) => handleSubtotalChange(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-6 pr-3 py-1.5 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-xs text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                      errors.subtotal ? 'border-cranberry' : 'border-enchanted-green/15 dark:border-light-ivory/15'
                    }`}
                  />
                </div>
                {errors.subtotal && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.subtotal}</p>
                )}
              </div>

              {/* IVA (Auto + Editable) */}
              <div>
                <label className="block text-[11px] font-bold text-enchanted-green dark:text-rose-linen mb-1">
                  IVA (16% Autocalculado)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={iva}
                    onChange={(e) => setIva(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-6 pr-3 py-1.5 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-xs text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                      errors.iva ? 'border-cranberry' : 'border-enchanted-green/15 dark:border-light-ivory/15'
                    }`}
                  />
                </div>
                {errors.iva && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.iva}</p>
                )}
              </div>

              {/* Retención ISR */}
              <div>
                <label className="block text-[11px] font-bold text-enchanted-green dark:text-rose-linen mb-1">
                  Retención ISR (Opcional, manual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={isrRetenido}
                    onChange={(e) => setIsrRetenido(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-6 pr-3 py-1.5 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-xs text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                      errors.isrRetenido ? 'border-cranberry' : 'border-enchanted-green/15 dark:border-light-ivory/15'
                    }`}
                  />
                </div>
                {errors.isrRetenido && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.isrRetenido}</p>
                )}
              </div>

              {/* Retención IVA */}
              <div>
                <label className="block text-[11px] font-bold text-enchanted-green dark:text-rose-linen mb-1">
                  Retención IVA (Opcional, manual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ivaRetenido}
                    onChange={(e) => setIvaRetenido(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-6 pr-3 py-1.5 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-xs text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                      errors.ivaRetenido ? 'border-cranberry' : 'border-enchanted-green/15 dark:border-light-ivory/15'
                    }`}
                  />
                </div>
                {errors.ivaRetenido && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.ivaRetenido}</p>
                )}
              </div>
            </div>

            {/* Computed Total View */}
            <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded border border-enchanted-green/15 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-enchanted-green dark:text-light-ivory block">Monto Total Calculado</span>
                <span className="text-[10px] text-rocky-gray block mt-0.5">Fórmula: Subtotal + IVA − ISR Retenido − IVA Retenido</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-[#0B3D2E] dark:text-elevated-gold block">
                  ${computedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-rocky-gray uppercase tracking-tight font-bold">MXN (Solo Lectura)</span>
              </div>
            </div>
          </div>

          {/* Invoice Verification, Status & Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5">
                Facturado
              </label>
              <div className="flex items-center justify-between p-2 bg-white/30 dark:bg-black/10 rounded border border-enchanted-green/5 h-10">
                <span className="text-xs font-bold text-enchanted-green dark:text-light-ivory">¿Tiene Factura?</span>
                <input
                  type="checkbox"
                  checked={tieneFactura}
                  onChange={(e) => setTieneFactura(e.target.checked)}
                  className="h-4 w-4 rounded border-enchanted-green/20 dark:border-light-ivory/20 text-enchanted-green focus:ring-elevated-gold cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5">
                Estatus de Pago <span className="text-cranberry">*</span>
              </label>
              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value as 'Pagado' | 'Pendiente')}
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              >
                <option value="Pagado" className="bg-light-ivory dark:bg-[#051A14]">Pagado</option>
                <option value="Pendiente" className="bg-light-ivory dark:bg-[#051A14]">Pendiente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5 flex items-center gap-1">
                <Calendar size={13} className="text-[#8C7853]" />
                <span>Fecha <span className="text-cranberry">*</span></span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors font-mono"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={projects.length === 0}
              className="px-5 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-enchanted-green text-sm font-bold rounded shadow hover:bg-[#0B3D2E] dark:hover:bg-elevated-gold/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Pago'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
