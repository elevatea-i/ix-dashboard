/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Coins } from 'lucide-react';
import { Project, PorImpactar } from '../types';
import { getMexicoCityDate, formatLiveCurrency, parseCurrencyInput } from '../utils';

interface PorImpactarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    descripcion: string;
    monto: number;
    socioResponsable: 'San' | 'Ale' | 'Empresa';
    proyectoOrigenId: string | null;
    fecha: string;
  }) => void;
  initialData: PorImpactar | null;
  projects: Project[];
}

/**
 * Modal to add or edit an entry in "Por Impactar" module.
 */
export default function PorImpactarFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects
}: PorImpactarFormModalProps) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [socioResponsable, setSocioResponsable] = useState<'San' | 'Ale' | 'Empresa'>('Empresa');
  const [proyectoOrigenId, setProyectoOrigenId] = useState<string>('general'); // 'general' represents null
  const [fecha, setFecha] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setDescripcion(initialData.descripcion);
        setMonto(formatLiveCurrency(initialData.monto.toString()));
        setSocioResponsable(initialData.socioResponsable);
        setProyectoOrigenId(initialData.proyectoOrigenId || 'general');
        setFecha(initialData.fecha);
      } else {
        setDescripcion('');
        setMonto('');
        setSocioResponsable('Empresa');
        setProyectoOrigenId('general');
        setFecha(getMexicoCityDate());
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const cleanMonto = parseCurrencyInput(monto);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }
    const parsedMonto = parseFloat(cleanMonto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      newErrors.monto = 'El monto debe ser un número mayor a 0';
    }
    if (!fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      descripcion: descripcion.trim(),
      monto: parsedMonto,
      socioResponsable,
      proyectoOrigenId: proyectoOrigenId === 'general' ? null : proyectoOrigenId,
      fecha
    });
  };

  const parsedMontoForPreview = parseFloat(cleanMonto) || 0;
  const totalConIva = parsedMontoForPreview * 1.16;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="por-impactar-form-container"
        className="relative bg-white dark:bg-[#070D0C] w-full max-w-lg rounded-lg shadow-xl overflow-hidden border border-rocky-gray/30 dark:border-white/10"
      >
        {/* Top Accent bar */}
        <div className="h-[3px] bg-elevated-gold"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rocky-gray/20 dark:border-white/5 bg-white dark:bg-[#0E1A16]">
          <div className="flex items-center space-x-2">
            <Coins className="text-elevated-gold" size={18} />
            <h2 className="text-xl font-serif font-bold text-enchanted-green dark:text-light-ivory">
              {initialData ? 'Editar Registro Por Impactar' : 'Nuevo Registro Por Impactar'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
          {/* Descripción */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
              Descripción <span className="text-cranberry font-bold">*</span>
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`w-full bg-white dark:bg-[#0E1A16] border ${
                errors.descripcion ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
              } text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs`}
              placeholder="Ej. Anticipo recibido de cliente externo"
            />
            {errors.descripcion && (
              <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                <AlertTriangle size={12} />
                <span>{errors.descripcion}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Monto <span className="text-cranberry font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={monto}
                  onChange={(e) => setMonto(formatLiveCurrency(e.target.value))}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.monto ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-sm rounded px-3.5 py-2 text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold transition-colors shadow-xs`}
                  placeholder="$0.00"
                />
              </div>
              <p className="text-[10px] text-rocky-gray dark:text-light-ivory/60 mt-1.5 leading-tight font-medium">
                Este monto se registrará como Subtotal (sin IVA) cuando se resuelva.
              </p>
              {errors.monto && (
                <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{errors.monto}</span>
                </p>
              )}

              {/* Preview Box style matching 'Total calculado' */}
              <div className="mt-3.5 flex items-center justify-between p-3 bg-enchanted-green/5 dark:bg-white/5 rounded border border-enchanted-green/10 dark:border-white/5">
                <div>
                  <p className="text-[10px] font-semibold text-rocky-gray dark:text-light-ivory/80">Total estimado con IVA</p>
                  <p className="text-[8px] text-rocky-gray/60 dark:text-light-ivory/40">Monto × 1.16</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-bold text-[#0B3D2E] dark:text-elevated-gold">
                    ${totalConIva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-rocky-gray dark:text-light-ivory/60 block font-bold uppercase tracking-tight">MXN</span>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Fecha <span className="text-cranberry font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={`w-full bg-white dark:bg-[#0E1A16] border ${
                    errors.fecha ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                  } text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs`}
                />
              </div>
              {errors.fecha && (
                <p className="text-xs text-cranberry mt-1 flex items-center space-x-1">
                  <AlertTriangle size={12} />
                  <span>{errors.fecha}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Socio Responsable */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Socio Responsable <span className="text-cranberry font-bold">*</span>
              </label>
              <select
                value={socioResponsable}
                onChange={(e) => setSocioResponsable(e.target.value as 'San' | 'Ale' | 'Empresa')}
                className="w-full bg-white dark:bg-[#0E1A16] border border-enchanted-green/40 dark:border-light-ivory/30 text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs"
              >
                <option value="Empresa">Empresa</option>
                <option value="San">San</option>
                <option value="Ale">Ale</option>
              </select>
            </div>

            {/* Proyecto Origen */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Proyecto Origen (Referencia)
              </label>
              <select
                value={proyectoOrigenId || 'general'}
                onChange={(e) => setProyectoOrigenId(e.target.value)}
                className="w-full bg-white dark:bg-[#0E1A16] border border-enchanted-green/40 dark:border-light-ivory/30 text-sm rounded px-3 py-2 text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs"
              >
                <option value="general">Sin proyecto / Gasto general</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    [{proj.codigo}] {proj.nombre}
                  </option>
                ))}
              </select>
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
              {initialData ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
