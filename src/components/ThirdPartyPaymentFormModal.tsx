/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calculator, Calendar, Tag, ShieldCheck, HelpCircle } from 'lucide-react';
import { Project, ThirdPartyPayment } from '../types';
import { getMexicoCityDate } from '../utils';

interface ThirdPartyPaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    proyectoId: string | null;
    concepto: string;
    saldoOriginal: number;
    comisionIntermediario: number;
    gananciaIxAdicional: number;
    montoADepositar: number;
    estatusPago: 'Pagado' | 'Pendiente';
    fecha: string;
  }) => void;
  initialData: ThirdPartyPayment | null;
  projects: Project[];
}

/**
 * Calculates the financial split for Third Party Payments (Yazu/Xiomara).
 * 
 * - Intermediary commission is exactly 7.2727% of original balance.
 * - Additional IX gain is exactly 1.8182% of original balance.
 * - Net amount to deposit is original balance minus commission and additional gain.
 * 
 * @param saldoOriginal Entry amount to be split.
 * @returns Object with commission, additional gain, and amount to deposit rounded to two decimals.
 */
export function calculateThirdPartySplit(saldoOriginal: number) {
  const comisionIntermediario = saldoOriginal * 0.072727;
  const gananciaIxAdicional = saldoOriginal * 0.018182;
  const montoADepositar = Math.max(0, saldoOriginal - comisionIntermediario - gananciaIxAdicional);

  return {
    comisionIntermediario: Number(comisionIntermediario.toFixed(2)),
    gananciaIxAdicional: Number(gananciaIxAdicional.toFixed(2)),
    montoADepositar: Number(montoADepositar.toFixed(2))
  };
}

/**
 * ThirdPartyPaymentFormModal provides an entry form for Yazu/Xiomara third-party transfers.
 * Computes split distributions on-the-fly and presents them transparently.
 */
export default function ThirdPartyPaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects
}: ThirdPartyPaymentFormModalProps) {
  const [proyectoId, setProyectoId] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [saldoOriginal, setSaldoOriginal] = useState<string>('');
  const [estatusPago, setEstatusPago] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [fecha, setFecha] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setProyectoId(initialData.proyectoId || 'ninguno');
        setConcepto(initialData.concepto);
        setSaldoOriginal(initialData.saldoOriginal.toString());
        setEstatusPago(initialData.estatusPago);
        setFecha(initialData.fecha);
      } else {
        setProyectoId('ninguno');
        setConcepto('');
        setSaldoOriginal('');
        setEstatusPago('Pagado');
        setFecha(getMexicoCityDate());
      }
    }
  }, [isOpen, initialData, projects]);

  const numSaldo = parseFloat(saldoOriginal) || 0;
  const splitCalculado = calculateThirdPartySplit(numSaldo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!concepto.trim()) {
      newErrors.concepto = 'El concepto es requerido';
    }

    const s = parseFloat(saldoOriginal);
    if (isNaN(s) || s <= 0) {
      newErrors.saldoOriginal = 'Ingrese un saldo original mayor a 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      proyectoId: proyectoId === 'ninguno' ? null : proyectoId,
      concepto: concepto.trim(),
      saldoOriginal: Number(numSaldo.toFixed(2)),
      comisionIntermediario: splitCalculado.comisionIntermediario,
      gananciaIxAdicional: splitCalculado.gananciaIxAdicional,
      montoADepositar: splitCalculado.montoADepositar,
      estatusPago,
      fecha
    });
  };

  if (!isOpen) return null;

  return (
    <div id="third-party-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051A14]/80 backdrop-blur-sm">
      <div id="third-party-modal-card" className="bg-light-ivory dark:bg-[#051A14] w-full max-w-2xl rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
              {initialData ? 'Editar Pago a Terceros' : 'Registrar Pago a Terceros (Yazu / Xiomara)'}
            </h3>
            <p className="text-xs text-rocky-gray dark:text-rose-linen/60 mt-0.5">
              Distribución de comisiones de intermediario, ganancias IX adicionales y depósitos netos.
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Concepto */}
            <div>
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5">
                Concepto / Referencia <span className="text-cranberry">*</span>
              </label>
              <input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="ej. Distribución Xiomara Lote A"
                className={`w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                  errors.concepto ? 'border-cranberry' : 'border-enchanted-green/20 dark:border-light-ivory/20'
                }`}
              />
              {errors.concepto && (
                <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.concepto}</p>
              )}
            </div>

            {/* Optional Project Picker */}
            <div>
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5">
                Proyecto Asociado <span className="text-rocky-gray dark:text-rose-linen/50">(Opcional)</span>
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              >
                <option value="ninguno" className="bg-light-ivory dark:bg-[#051A14]">Sin proyecto asociado (Operativo / Libre)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-light-ivory dark:bg-[#051A14]">
                    [{p.codigo}] {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Saldo Original */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5 flex items-center gap-1">
                <Calculator size={13} className="text-[#8C7853]" />
                <span>Saldo Original (Monto Entrada) <span className="text-cranberry">*</span></span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-rocky-gray font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={saldoOriginal}
                  onChange={(e) => setSaldoOriginal(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-6 pr-3 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors ${
                    errors.saldoOriginal ? 'border-cranberry' : 'border-enchanted-green/20 dark:border-light-ivory/20'
                  }`}
                />
              </div>
              {errors.saldoOriginal && (
                <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.saldoOriginal}</p>
              )}
            </div>

            {/* Estatus */}
            <div>
              <label className="block text-xs font-bold text-enchanted-green dark:text-rose-linen mb-1.5">
                Estatus de Pago <span className="text-cranberry">*</span>
              </label>
              <select
                value={estatusPago}
                onChange={(e) => setEstatusPago(e.target.value as 'Pagado' | 'Pendiente')}
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              >
                <option value="Pagado" className="bg-light-ivory dark:bg-[#051A14]">Pagado</option>
                <option value="Pendiente" className="bg-light-ivory dark:bg-[#051A14]">Pendiente</option>
              </select>
            </div>

            {/* Fecha */}
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

          {/* Autocalculated split section */}
          <div className="bg-white/50 dark:bg-[#070D0C]/30 rounded-lg p-4 border border-enchanted-green/10 dark:border-light-ivory/10 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>Cálculos de Comisión y Ganancia Distribuidos</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Comision Intermediario (7.2727%) */}
              <div className="p-3 bg-light-ivory/50 dark:bg-black/10 rounded border border-enchanted-green/5">
                <span className="text-[10px] font-bold text-rocky-gray block uppercase">Comisión Intermediario (7.2727%)</span>
                <span className="text-xs text-rocky-gray block mt-0.5">Calculado automáticamente</span>
                <span className="text-base font-mono font-bold text-enchanted-green dark:text-light-ivory block mt-1">
                  ${splitCalculado.comisionIntermediario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Ganancia adicional IX (1.8182%) */}
              <div className="p-3 bg-light-ivory/50 dark:bg-black/10 rounded border border-enchanted-green/5">
                <span className="text-[10px] font-bold text-rocky-gray block uppercase">Ganancia IX Adicional (1.8182%)</span>
                <span className="text-xs text-rocky-gray block mt-0.5">Calculado automáticamente</span>
                <span className="text-base font-mono font-bold text-enchanted-green dark:text-light-ivory block mt-1">
                  ${splitCalculado.gananciaIxAdicional.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Monto Neto a Depositar */}
            <div className="p-3.5 bg-enchanted-green/5 dark:bg-white/5 rounded border border-enchanted-green/15 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-enchanted-green dark:text-light-ivory block">Monto Neto a Depositar</span>
                <span className="text-[10px] text-rocky-gray block mt-0.5">Saldo Original − Comisión Intermediario − Ganancia IX</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-[#0B3D2E] dark:text-elevated-gold block">
                  ${splitCalculado.montoADepositar.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-rocky-gray uppercase tracking-tight font-bold">MXN</span>
              </div>
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
              className="px-5 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-enchanted-green text-sm font-bold rounded shadow hover:bg-[#0B3D2E] dark:hover:bg-elevated-gold/80 transition-all"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Distribución'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
