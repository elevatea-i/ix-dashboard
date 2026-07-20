/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Client } from '../types';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; razonSocial: string; rfc: string; contacto: string }) => void;
  initialData: Client | null;
}

export default function ClienteFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: ClienteFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [rfc, setRfc] = useState('');
  const [contacto, setContacto] = useState('');
  const [errors, setErrors] = useState<{ nombre?: string; rfc?: string }>({});

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre);
      setRazonSocial(initialData.razonSocial);
      setRfc(initialData.rfc);
      setContacto(initialData.contacto);
    } else {
      setNombre('');
      setRazonSocial('');
      setRfc('');
      setContacto('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Mexican RFC pattern verification (Subtle helper, no hard blocker but warnings are nice)
  const validateRFC = (value: string) => {
    if (!value) return true; // optional
    const rfcPattern = /^[A-Z&Ññ]{3,4}\d{6}[A-Z0-9]{3}$/i;
    return rfcPattern.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { nombre?: string; rfc?: string } = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del cliente es obligatorio';
    }

    if (rfc.trim() && !validateRFC(rfc.trim())) {
      newErrors.rfc = 'Formato de RFC inválido (Ej: AAAA000000XXX)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      nombre: nombre.trim(),
      razonSocial: razonSocial.trim(),
      rfc: rfc.trim().toUpperCase(),
      contacto: contacto.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0E1A16] border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden transition-colors duration-300 font-sans">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold"></div>

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-semibold text-enchanted-green dark:text-light-ivory">
              {initialData ? 'Editar Cliente Interno' : 'Registrar Nuevo Cliente'}
            </h3>
            <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-semibold">
              Expediente del Contratante
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-enchanted-green/80 dark:text-light-ivory/80 hover:text-cranberry dark:hover:text-[#DFBDB5] hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre (Requerido) */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
              Nombre o Alías Comercial <span className="text-cranberry font-bold">*</span>
            </label>
            <input
              id="input-client-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Nupec o Heineken México"
              className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-cranberry dark:text-rose-linen flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Razón Social */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
              Razón Social (Opcional)
            </label>
            <input
              id="input-client-razon"
              type="text"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Ej. Comercializadora de Alimentos S.A. de C.V."
              className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
            />
          </div>

          {/* RFC & Contacto Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RFC */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                RFC (Opcional)
              </label>
              <input
                id="input-client-rfc"
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="Ej. COCO800101XYZ"
                maxLength={13}
                className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors font-mono shadow-xs"
              />
              {errors.rfc && (
                <p className="mt-1 text-xs text-cranberry dark:text-rose-linen flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.rfc}
                </p>
              )}
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                Contacto (Nombre, Correo o Tel)
              </label>
              <input
                id="input-client-contacto"
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ej. Ing. Carlos - carlos@correo.com"
                className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="mt-6 pt-5 border-t border-enchanted-green/10 dark:border-light-ivory/10 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-enchanted-green/20 dark:border-light-ivory/20 hover:border-cranberry hover:text-cranberry text-xs uppercase tracking-wider font-medium rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-client-submit"
              type="submit"
              className="px-4 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-xs uppercase tracking-wider font-bold rounded flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Save size={14} />
              <span>{initialData ? 'Actualizar Cliente' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
