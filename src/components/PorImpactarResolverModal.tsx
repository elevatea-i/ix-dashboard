/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calculator, Calendar, Tag, CreditCard, Layers } from 'lucide-react';
import { Project, PorImpactar, ExpenseCategory } from '../types';
import { getMexicoCityDate } from '../utils';

interface PorImpactarResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Callback fired when the user completes the form to resolve a Por Impactar entry.
   * Creates a corresponding Expense object in memory.
   */
  onResolve: (
    recordId: string,
    expenseData: {
      proyectoId: string;
      categoriaId: ExpenseCategory;
      concepto: string;
      subtotal: number;
      iva: number;
      isrRetenido: number;
      ivaRetenido: number;
      cuentaOrigen: 'San' | 'Ale' | 'Empresa';
      esReembolsable: boolean;
      tieneFactura: boolean;
      metodoPago: 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo';
      estatusPago: 'Pagado' | 'Pendiente';
      fecha: string;
    }
  ) => void;
  recordToResolve: PorImpactar | null;
  projects: Project[];
}

const CATEGORIES: ExpenseCategory[] = [
  'Pago a proveedores',
  'Pagos a terceros',
  'Transporte (gasolina, peajes, Uber)',
  'Viáticos',
  'Comidas internas',
  'Compras en línea (Amazon, Mercado Libre)',
  'Compras generales (tiendas físicas)',
  'Pago de comisiones',
  'Pago de impuestos',
  'Contadora y servicios profesionales',
  'Oficina y coworking',
  'Otros / sin clasificar'
];

/**
 * PorImpactarResolverModal enables the user to resolve a pending item
 * by converting it into a project expense ("Proveedor por Proyecto").
 * It inherits specific pre-filled values and allows the remaining Gasto metadata
 * to be input before final confirmation.
 */
export default function PorImpactarResolverModal({
  isOpen,
  onClose,
  onResolve,
  recordToResolve,
  projects
}: PorImpactarResolverModalProps) {
  const [proyectoId, setProyectoId] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<ExpenseCategory>('Pago a proveedores');
  const [concepto, setConcepto] = useState<string>('');
  const [subtotal, setSubtotal] = useState<string>('');
  const [iva, setIva] = useState<string>('0');
  const [isrRetenido, setIsrRetenido] = useState<string>('0');
  const [ivaRetenido, setIvaRetenido] = useState<string>('0');
  const [cuentaOrigen, setCuentaOrigen] = useState<'San' | 'Ale' | 'Empresa'>('Empresa');
  const [esReembolsable, setEsReembolsable] = useState<boolean>(false);
  const [tieneFactura, setTieneFactura] = useState<boolean>(false);
  const [metodoPago, setMetodoPago] = useState<'Transferencia' | 'Tarjeta de Débito' | 'Efectivo'>('Transferencia');
  const [estatusPago, setEstatusPago] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [fecha, setFecha] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && recordToResolve) {
      setErrors({});
      // Set default project selection to first project or empty
      setProyectoId(projects.length > 0 ? projects[0].id : '');
      setCategoriaId('Pago a proveedores');
      setConcepto(recordToResolve.descripcion);
      setSubtotal(recordToResolve.monto.toString());
      const computedIva = Number((recordToResolve.monto * 0.16).toFixed(2));
      setIva(computedIva.toString());
      setIsrRetenido('0');
      setIvaRetenido('0');
      setCuentaOrigen(recordToResolve.socioResponsable);
      setEsReembolsable(false);
      setTieneFactura(false);
      setMetodoPago('Transferencia');
      setEstatusPago('Pagado');
      setFecha(getMexicoCityDate());
    }
  }, [isOpen, recordToResolve, projects]);

  if (!isOpen || !recordToResolve) return null;

  // Auto-calculate 16% IVA when the user clicks the helper button
  const handleAutoCalculateIva = () => {
    const sub = parseFloat(subtotal) || 0;
    const computedIva = Number((sub * 0.16).toFixed(2));
    setIva(computedIva.toString());
  };

  const total = (parseFloat(subtotal) || 0) + (parseFloat(iva) || 0) - (parseFloat(isrRetenido) || 0) - (parseFloat(ivaRetenido) || 0);

  /**
   * Processes form submission, validates inputs, and triggers the onResolve function
   * to convert this "Por Impactar" item to a Gasto.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!proyectoId) {
      newErrors.proyectoId = 'El proyecto de destino es requerido para resolver';
    }
    if (!concepto.trim()) {
      newErrors.concepto = 'El concepto es requerido';
    }
    const subVal = parseFloat(subtotal);
    if (isNaN(subVal) || subVal <= 0) {
      newErrors.subtotal = 'El subtotal debe ser mayor a 0';
    }
    const ivaVal = parseFloat(iva);
    if (isNaN(ivaVal) || ivaVal < 0) {
      newErrors.iva = 'El IVA debe ser un número igual o mayor a 0';
    }
    const isrRetVal = parseFloat(isrRetenido);
    if (isNaN(isrRetVal) || isrRetVal < 0) {
      newErrors.isrRetenido = 'El ISR retenido debe ser un número igual o mayor a 0';
    }
    const ivaRetVal = parseFloat(ivaRetenido);
    if (isNaN(ivaRetVal) || ivaRetVal < 0) {
      newErrors.ivaRetenido = 'El IVA retenido debe ser un número igual o mayor a 0';
    }
    if (!fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onResolve(recordToResolve.id, {
      proyectoId,
      categoriaId,
      concepto: concepto.trim(),
      subtotal: subVal,
      iva: ivaVal,
      isrRetenido: isrRetVal,
      ivaRetenido: ivaRetVal,
      cuentaOrigen,
      esReembolsable,
      tieneFactura,
      metodoPago,
      estatusPago,
      fecha
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-[#070D0C] w-full max-w-2xl rounded-lg shadow-xl overflow-hidden border border-rocky-gray/30 dark:border-white/10">
        <div className="h-[3px] bg-elevated-gold"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rocky-gray/20 dark:border-white/5 bg-white dark:bg-[#0E1A16]">
          <div className="flex items-center space-x-2">
            <Layers className="text-elevated-gold" size={18} />
            <h2 className="text-xl font-serif font-bold text-enchanted-green dark:text-light-ivory">
              Resolver &gt; Convertir en Gasto Real
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info panel explaining origin */}
        <div className="bg-elevated-gold/5 dark:bg-elevated-gold/5 px-6 py-3 border-b border-rocky-gray/20 dark:border-white/5 text-xs text-rocky-gray dark:text-rose-linen/80 flex flex-col sm:flex-row sm:justify-between">
          <span><strong>Registro Origen:</strong> {recordToResolve.descripcion}</span>
          <span className="mt-1 sm:mt-0"><strong>Monto original:</strong> ${recordToResolve.monto.toFixed(2)} ({recordToResolve.socioResponsable})</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo (Disabled/Fixed) */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green dark:text-light-ivory mb-1.5">
                Tipo de Gasto
              </label>
              <input
                type="text"
                disabled
                value="Proveedor por Proyecto (Vinculado)"
                className="w-full bg-rocky-gray/10 dark:bg-white/5 border border-rocky-gray/30 dark:border-white/5 text-sm rounded px-3 py-2 text-rocky-gray cursor-not-allowed font-medium"
              />
            </div>

            {/* Proyecto Destino */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Proyecto de Destino <span className="text-cranberry font-bold">*</span>
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className={`w-full bg-white dark:bg-[#0E1A16] border ${
                  errors.proyectoId ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                } text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs`}
              >
                <option value="">-- Seleccionar proyecto --</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    [{proj.codigo}] {proj.nombre}
                  </option>
                ))}
              </select>
              {errors.proyectoId && (
                <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{errors.proyectoId}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Concepto */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Concepto del Gasto <span className="text-cranberry font-bold">*</span>
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className={`w-full bg-white dark:bg-[#0E1A16] border ${
                  errors.concepto ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                } text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs`}
                placeholder="Concepto detallado"
              />
              {errors.concepto && (
                <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{errors.concepto}</span>
                </p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Categoría
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value as ExpenseCategory)}
                className="w-full bg-white dark:bg-[#0E1A16] border border-enchanted-green/40 dark:border-light-ivory/30 text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-rocky-gray/5 dark:bg-white/5 p-4 rounded border border-rocky-gray/20 dark:border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-enchanted-green dark:text-light-ivory mb-3 flex items-center space-x-1">
              <Calculator size={14} className="text-elevated-gold" />
              <span>Desglose Fiscal (MXN)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Subtotal */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-rocky-gray dark:text-rose-linen/80 mb-1">
                  Subtotal *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.subtotal ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-xs rounded px-2.5 py-1.5 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold shadow-xs`}
                />
              </div>

              {/* IVA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-rocky-gray dark:text-rose-linen/80">
                    IVA *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateIva}
                    className="text-[9px] text-elevated-gold hover:underline focus:outline-none"
                    title="Calcular 16% IVA"
                  >
                    +16%
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={iva}
                  onChange={(e) => setIva(e.target.value)}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.iva ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-xs rounded px-2.5 py-1.5 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold shadow-xs`}
                />
              </div>

              {/* ISR Retenido */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-rocky-gray dark:text-rose-linen/80 mb-1">
                  ISR Ret. (-)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={isrRetenido}
                  onChange={(e) => setIsrRetenido(e.target.value)}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.isrRetenido ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-xs rounded px-2.5 py-1.5 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold shadow-xs`}
                />
              </div>

              {/* IVA Retenido */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-rocky-gray dark:text-rose-linen/80 mb-1">
                  IVA Ret. (-)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ivaRetenido}
                  onChange={(e) => setIvaRetenido(e.target.value)}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.ivaRetenido ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-xs rounded px-2.5 py-1.5 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold shadow-xs`}
                />
              </div>
            </div>

            {/* Total Display */}
            <div className="mt-3 pt-3 border-t border-rocky-gray/20 dark:border-white/5 flex justify-between items-center text-xs font-semibold text-enchanted-green dark:text-light-ivory">
              <span>Total final calculado:</span>
              <span className="text-sm font-bold text-elevated-gold">${total.toFixed(2)} MXN</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cuenta Origen */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Origen de Fondos
              </label>
              <select
                value={cuentaOrigen}
                onChange={(e) => setCuentaOrigen(e.target.value as 'San' | 'Ale' | 'Empresa')}
                className="w-full bg-white dark:bg-[#0E1A16] border border-enchanted-green/40 dark:border-light-ivory/30 text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none shadow-xs"
              >
                <option value="Empresa">Empresa</option>
                <option value="San">San</option>
                <option value="Ale">Ale</option>
              </select>
            </div>

            {/* Método Pago */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo')}
                className="w-full bg-white dark:bg-[#0E1A16] border border-enchanted-green/40 dark:border-light-ivory/30 text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none shadow-xs"
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            {/* Estatus Pago */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Estatus de Pago
              </label>
              <select
                value={estatusPago}
                onChange={(e) => setEstatusPago(e.target.value as 'Pagado' | 'Pendiente')}
                className="w-full bg-white dark:bg-[#0E1A16] border border-enchanted-green/40 dark:border-light-ivory/30 text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none shadow-xs"
              >
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Fecha del Gasto */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Fecha del Gasto <span className="text-cranberry font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.fecha ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none shadow-xs`}
                />
              </div>
              {errors.fecha && (
                <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{errors.fecha}</span>
                </p>
              )}
            </div>

            {/* Tiene Factura */}
            <div className="flex items-center space-x-3 mt-6 sm:mt-8">
              <input
                type="checkbox"
                id="tieneFacturaResolve"
                checked={tieneFactura}
                onChange={(e) => setTieneFactura(e.target.checked)}
                className="w-4 h-4 text-enchanted-green border-rocky-gray/40 rounded focus:ring-elevated-gold"
              />
              <label htmlFor="tieneFacturaResolve" className="text-xs font-bold text-enchanted-green dark:text-light-ivory select-none">
                ¿Tiene Factura CFDI?
              </label>
            </div>

            {/* Es Reembolsable */}
            <div className="flex items-center space-x-3 mt-4 sm:mt-8">
              <input
                type="checkbox"
                id="esReembolsableResolve"
                checked={esReembolsable}
                onChange={(e) => setEsReembolsable(e.target.checked)}
                className="w-4 h-4 text-enchanted-green border-rocky-gray/40 rounded focus:ring-elevated-gold"
              />
              <label htmlFor="esReembolsableResolve" className="text-xs font-bold text-enchanted-green dark:text-light-ivory select-none">
                ¿Es Reembolsable?
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-rocky-gray/20 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border border-rocky-gray/40 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-enchanted-green dark:text-light-ivory px-4 py-2 rounded text-xs uppercase tracking-wider font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 px-5 py-2 rounded text-xs uppercase tracking-wider font-bold shadow-md transition-all"
            >
              Confirmar y Registrar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
