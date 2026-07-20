/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calculator, Calendar, Tag, CreditCard, Layers } from 'lucide-react';
import { Project, Expense, ExpenseCategory } from '../types';
import { getMexicoCityDate, formatLiveCurrency, parseCurrencyInput } from '../utils';

interface GastoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    tipo: 'Operativo' | 'Proveedor por Proyecto';
    proyectoId: string | null;
    categoriaId: ExpenseCategory;
    concepto: string;
    subtotal: number;
    iva: number;
    isrRetenido: number;
    ivaRetenido: number;
    cuentaOrigen: 'San' | 'Ale' | 'Empresa' | 'Juan Carlos';
    esReembolsable: boolean;
    tieneFactura: boolean;
    metodoPago: 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo';
    estatusPago: 'Pagado' | 'Pendiente';
    fecha: string;
  }) => void;
  initialData: Expense | null;
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
 * GastoFormModal is a fully responsive, double-column React modal component 
 * for registering or editing a CFDI or operational expense.
 * It includes automatic live recalculations for IVA and totals.
 */
export default function GastoFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects
}: GastoFormModalProps) {
  const [tipo, setTipo] = useState<'Operativo' | 'Proveedor por Proyecto'>('Operativo');
  const [proyectoId, setProyectoId] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<ExpenseCategory>('Pago a proveedores');
  const [concepto, setConcepto] = useState<string>('');
  const [subtotal, setSubtotal] = useState<string>('');
  const [iva, setIva] = useState<string>('');
  const [isrRetenido, setIsrRetenido] = useState<string>('0');
  const [ivaRetenido, setIvaRetenido] = useState<string>('0');
  const [cuentaOrigen, setCuentaOrigen] = useState<'San' | 'Ale' | 'Empresa' | 'Juan Carlos'>('Empresa');
  const [esReembolsable, setEsReembolsable] = useState<boolean>(false);
  const [tieneFactura, setTieneFactura] = useState<boolean>(false);
  const [metodoPago, setMetodoPago] = useState<'Transferencia' | 'Tarjeta de Débito' | 'Efectivo'>('Transferencia');
  const [estatusPago, setEstatusPago] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [fecha, setFecha] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form or populate with initialData
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setTipo(initialData.tipo);
        setProyectoId(initialData.proyectoId || '');
        setCategoriaId(initialData.categoriaId);
        setConcepto(initialData.concepto);
        setSubtotal(formatLiveCurrency(initialData.subtotal.toString()));
        setIva(initialData.iva.toString());
        setIsrRetenido(initialData.isrRetenido.toString());
        setIvaRetenido(initialData.ivaRetenido.toString());
        setCuentaOrigen(initialData.cuentaOrigen);
        setEsReembolsable(initialData.esReembolsable);
        setTieneFactura(initialData.tieneFactura);
        setMetodoPago(initialData.metodoPago);
        setEstatusPago(initialData.estatusPago);
        setFecha(initialData.fecha);
      } else {
        setTipo('Operativo');
        setProyectoId(projects.length > 0 ? projects[0].id : '');
        setCategoriaId('Pago a proveedores');
        setConcepto('');
        setSubtotal('');
        setIva('');
        setIsrRetenido('0');
        setIvaRetenido('0');
        setCuentaOrigen('Empresa');
        setEsReembolsable(false);
        setTieneFactura(false);
        setMetodoPago('Transferencia');
        setEstatusPago('Pagado');
        setFecha(getMexicoCityDate());
      }
    }
  }, [isOpen, initialData, projects]);

  // Handle automatic IVA calculation (16% of subtotal)
  const handleSubtotalChange = (val: string) => {
    const formatted = formatLiveCurrency(val);
    setSubtotal(formatted);
    const cleanSub = parseCurrencyInput(formatted);
    const num = parseFloat(cleanSub);
    if (!isNaN(num) && num >= 0) {
      const calcIva = (num * 0.16).toFixed(2);
      setIva(calcIva);
    } else {
      setIva('');
    }
  };

  // Live total calculation
  const cleanSubtotal = parseCurrencyInput(subtotal);
  const numSubtotal = parseFloat(cleanSubtotal) || 0;
  const numIva = parseFloat(iva) || 0;
  const numIsrRet = parseFloat(isrRetenido) || 0;
  const numIvaRet = parseFloat(ivaRetenido) || 0;
  const totalCalculado = Math.max(0, numSubtotal + numIva - numIsrRet - numIvaRet);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!concepto.trim()) {
      newErrors.concepto = 'El concepto es requerido';
    }
    
    const sub = parseFloat(cleanSubtotal);
    if (isNaN(sub) || sub < 0) {
      newErrors.subtotal = 'Ingrese un subtotal válido (igual o mayor a 0)';
    }

    const ivVal = parseFloat(iva);
    if (isNaN(ivVal) || ivVal < 0) {
      newErrors.iva = 'Ingrese un IVA válido (igual o mayor a 0)';
    }

    if (tipo === 'Proveedor por Proyecto' && !proyectoId) {
      newErrors.proyectoId = 'Debe vincular un proyecto existente';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      tipo,
      proyectoId: tipo === 'Proveedor por Proyecto' ? proyectoId : null,
      categoriaId,
      concepto,
      subtotal: Number(numSubtotal.toFixed(2)),
      iva: Number(numIva.toFixed(2)),
      isrRetenido: Number(numIsrRet.toFixed(2)),
      ivaRetenido: Number(numIvaRet.toFixed(2)),
      cuentaOrigen,
      esReembolsable,
      tieneFactura,
      metodoPago,
      estatusPago,
      fecha
    });
  };

  if (!isOpen) return null;

  return (
    <div id="gasto-form-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div id="gasto-form-modal-card" className="bg-light-ivory dark:bg-[#051A14] w-full max-w-3xl rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
              {initialData ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
            </h3>
            <p className="text-xs text-[#3c3b3b] dark:text-[#3c3b3b] mt-0.5">
              Control de egresos, egresos operativos y facturación de proveedores.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. Tipo de Gasto & Proyecto */}
          <div className="bg-white/90 dark:bg-black/20 rounded-lg p-4 border border-enchanted-green/20 dark:border-light-ivory/10 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold flex items-center gap-1.5">
              <Layers size={14} />
              <span>Clasificación del Gasto</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Tipo de Gasto <span className="text-cranberry">*</span>
                </label>
                <select
                  value={tipo}
                  onChange={(e) => {
                    const nextTipo = e.target.value as 'Operativo' | 'Proveedor por Proyecto';
                    setTipo(nextTipo);
                    if (nextTipo === 'Proveedor por Proyecto' && projects.length > 0 && !proyectoId) {
                      setProyectoId(projects[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                >
                  <option value="Operativo" className="bg-light-ivory dark:bg-[#051A14]">Operativo (Sin Proyecto)</option>
                  <option value="Proveedor por Proyecto" className="bg-light-ivory dark:bg-[#051A14]">Proveedor por Proyecto</option>
                </select>
              </div>

              {tipo === 'Proveedor por Proyecto' && (
                <div>
                  <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                    Proyecto Asociado <span className="text-cranberry">*</span>
                  </label>
                  {projects.length === 0 ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-linen/30 border border-cranberry/30 rounded text-xs text-cranberry">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>No hay proyectos creados. Primero registre un proyecto.</span>
                    </div>
                  ) : (
                    <select
                      value={proyectoId}
                      onChange={(e) => setProyectoId(e.target.value)}
                      className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs ${
                        errors.proyectoId ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
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
              )}
            </div>
          </div>

          {/* 2. Detalles Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Categoría <span className="text-cranberry">*</span>
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
              >
                {CATEGORIES.map((cat, index) => (
                  <option key={cat} value={cat} className="bg-light-ivory dark:bg-[#051A14]">
                    {index + 1}. {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Concepto / Establecimiento <span className="text-cranberry">*</span>
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="ej. Walmart, Gasolinera Pemex, Proveedor de Carpas"
                className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs ${
                  errors.concepto ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                }`}
              />
              {errors.concepto && (
                <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.concepto}</p>
              )}
            </div>
          </div>

          {/* 3. Desglose Financiero */}
          <div className="bg-white/95 dark:bg-black/20 rounded-lg p-4 border border-enchanted-green/20 dark:border-light-ivory/10 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold flex items-center gap-1.5">
              <Calculator size={14} />
              <span>Importes & Retenciones (MXN)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Subtotal <span className="text-cranberry">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subtotal}
                    onChange={(e) => handleSubtotalChange(e.target.value)}
                    placeholder="$0.00"
                    className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs ${
                      errors.subtotal ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                    }`}
                  />
                </div>
                {errors.subtotal && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.subtotal}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  IVA (16%) <span className="text-[#8C7853] dark:text-elevated-gold">(Autocalculado)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={iva}
                    onChange={(e) => setIva(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-6 pr-3 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs ${
                      errors.iva ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                    }`}
                  />
                </div>
                {errors.iva && (
                  <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.iva}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Retención ISR (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={isrRetenido}
                    onChange={(e) => setIsrRetenido(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Retención IVA (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-rocky-gray font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ivaRetenido}
                    onChange={(e) => setIvaRetenido(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Total Display Block */}
            <div className="flex items-center justify-between p-3.5 bg-enchanted-green/5 dark:bg-white/5 rounded-lg border border-enchanted-green/10 dark:border-white/5">
              <div>
                <p className="text-xs font-semibold text-[#111111] dark:text-[#111111]">Total Recalculado en Tiempo Real</p>
                <p className="text-[10px] text-[#626060] dark:text-[#626060] mt-0.5">Subtotal + IVA - Retención ISR - Retención IVA</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-[#0B3D2E] dark:text-elevated-gold">
                  ${totalCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-rocky-gray dark:text-rose-linen/60 block font-bold uppercase tracking-tight">MXN</span>
              </div>
            </div>
          </div>

          {/* 4. Cuenta Origen & Opciones de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold flex items-center gap-1.5">
                <CreditCard size={14} />
                <span>Medio & Origen de Pago</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Cuenta Origen <span className="text-cranberry">*</span>
                </label>
                <select
                  value={cuentaOrigen}
                  onChange={(e) => setCuentaOrigen(e.target.value as 'San' | 'Ale' | 'Empresa' | 'Juan Carlos')}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                >
                  <option value="San" className="bg-light-ivory dark:bg-[#051A14]">San</option>
                  <option value="Ale" className="bg-light-ivory dark:bg-[#051A14]">Ale</option>
                  <option value="Empresa" className="bg-light-ivory dark:bg-[#051A14]">Empresa</option>
                  <option value="Juan Carlos" className="bg-light-ivory dark:bg-[#051A14]">Juan Carlos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                    Método de Pago <span className="text-cranberry">*</span>
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo')}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                  >
                    <option value="Transferencia" className="bg-light-ivory dark:bg-[#051A14]">Transferencia</option>
                    <option value="Tarjeta de Débito" className="bg-light-ivory dark:bg-[#051A14]">Tarjeta de Débito</option>
                    <option value="Efectivo" className="bg-light-ivory dark:bg-[#051A14]">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                    Estatus de Pago <span className="text-cranberry">*</span>
                  </label>
                  <select
                    value={estatusPago}
                    onChange={(e) => setEstatusPago(e.target.value as 'Pagado' | 'Pendiente')}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                  >
                    <option value="Pagado" className="bg-light-ivory dark:bg-[#051A14]">Pagado</option>
                    <option value="Pendiente" className="bg-light-ivory dark:bg-[#051A14]">Pendiente</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Fecha & Comprobantes</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Fecha <span className="text-cranberry">*</span>
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors font-mono shadow-xs"
                />
              </div>

              {/* Toggles & Checkboxes */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-2.5 bg-white/30 dark:bg-black/10 rounded border border-enchanted-green/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-enchanted-green dark:text-light-ivory">¿Es Reembolsable?</span>
                    <span className="text-[10px] text-rocky-gray">Marcar si aplica devolución o reintegro</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEsReembolsable(!esReembolsable)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      esReembolsable ? 'bg-enchanted-green' : 'bg-rocky-gray/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-light-ivory shadow ring-0 transition duration-200 ease-in-out ${
                        esReembolsable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white/30 dark:bg-black/10 rounded border border-enchanted-green/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-enchanted-green dark:text-light-ivory">¿Tiene Factura XML/PDF?</span>
                    <span className="text-[10px] text-rocky-gray">Comprobante fiscal recibido</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tieneFactura}
                    onChange={(e) => setTieneFactura(e.target.checked)}
                    className="h-4 w-4 rounded border-enchanted-green/20 dark:border-light-ivory/20 text-enchanted-green focus:ring-elevated-gold cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={tipo === 'Proveedor por Proyecto' && projects.length === 0}
              className="px-5 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-enchanted-green text-sm font-bold rounded shadow hover:bg-[#0B3D2E] dark:hover:bg-elevated-gold/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Gasto'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
