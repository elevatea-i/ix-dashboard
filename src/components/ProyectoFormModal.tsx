/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Sparkles } from 'lucide-react';
import { Client, Project } from '../types';

interface ProyectoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; codigo: string; clienteId: string; ejecutivoId: 'San' | 'Ale' }) => void;
  initialData: Project | null;
  clients: Client[];
}

/**
 * Modal form for creating and editing projects in the system.
 */
export default function ProyectoFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  clients
}: ProyectoFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [ejecutivoId, setEjecutivoId] = useState<'San' | 'Ale'>('San');
  const [errors, setErrors] = useState<{ nombre?: string; codigo?: string; clienteId?: string }>({});

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre);
      setCodigo(initialData.codigo);
      setClienteId(initialData.clienteId);
      setEjecutivoId(initialData.ejecutivoId);
    } else {
      setNombre('');
      setCodigo('');
      // Set first client as default if available
      setClienteId(clients.length > 0 ? clients[0].id : '');
      setEjecutivoId('San');
    }
    setErrors({});
  }, [initialData, isOpen, clients]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { nombre?: string; codigo?: string; clienteId?: string } = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del proyecto es obligatorio';
    }

    if (!codigo.trim()) {
      newErrors.codigo = 'El código del proyecto es obligatorio';
    }

    if (!clienteId) {
      newErrors.clienteId = 'Debe seleccionar un cliente contratante';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      nombre: nombre.trim(),
      codigo: codigo.trim().toUpperCase(),
      clienteId,
      ejecutivoId
    });
    onClose();
  };

  const hasClients = clients.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden transition-colors duration-300 font-sans">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold"></div>

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-rocky-gray/20 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-semibold text-enchanted-green dark:text-light-ivory">
              {initialData ? 'Editar Proyecto' : 'Registrar Nuevo Proyecto'}
            </h3>
            <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-semibold">
              Consola Operativa de Control
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-enchanted-green/60 dark:text-light-ivory/60 hover:text-cranberry dark:hover:text-[#DFBDB5] hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        {!hasClients ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-cranberry/10 flex items-center justify-center text-cranberry">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-base font-serif font-semibold text-enchanted-green dark:text-light-ivory">
              No hay clientes registrados
            </h4>
            <p className="text-xs text-rocky-gray dark:text-rose-linen/80 max-w-sm mx-auto leading-relaxed">
              Para registrar un proyecto, primero debes dar de alta al menos un cliente en el módulo **Catálogo de Clientes**.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-xs uppercase tracking-wider font-bold rounded transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nombre del Proyecto */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                Nombre del Proyecto <span className="text-cranberry font-bold">*</span>
              </label>
              <input
                id="input-project-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Pop Up Autrica, 10 Carpas, etc."
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-cranberry dark:text-rose-linen flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Código del Proyecto */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                Código del Proyecto <span className="text-cranberry font-bold">*</span>
              </label>
              <input
                id="input-project-codigo"
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. PROY-2026-001"
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors font-mono"
              />
              {errors.codigo && (
                <p className="mt-1 text-xs text-cranberry dark:text-rose-linen flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.codigo}
                </p>
              )}
            </div>

            {/* Cliente Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                Cliente Contratante <span className="text-cranberry font-bold">*</span>
              </label>
              <select
                id="select-project-cliente"
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="text-enchanted-green dark:text-light-ivory dark:bg-[#0E1A16]">
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errors.clienteId && (
                <p className="mt-1 text-xs text-cranberry dark:text-rose-linen flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.clienteId}
                </p>
              )}
            </div>

            {/* Ejecutivo Asignado Selector */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1.5">
                Ejecutivo Responsable <span className="text-cranberry font-bold">*</span>
              </label>
              <select
                id="select-project-ejecutivo"
                required
                value={ejecutivoId}
                onChange={(e) => setEjecutivoId(e.target.value as 'San' | 'Ale')}
                className="w-full px-3.5 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
              >
                <option value="San" className="text-enchanted-green dark:text-light-ivory dark:bg-[#0E1A16]">San</option>
                <option value="Ale" className="text-enchanted-green dark:text-light-ivory dark:bg-[#0E1A16]">Ale</option>
              </select>
            </div>

            {/* Buttons Footer */}
            <div className="mt-6 pt-5 border-t border-rocky-gray/20 dark:border-white/10 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-enchanted-green/20 dark:border-light-ivory/20 hover:border-cranberry hover:text-cranberry text-xs uppercase tracking-wider font-medium rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-project-submit"
                type="submit"
                className="px-4 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-xs uppercase tracking-wider font-bold rounded flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Save size={14} />
                <span>{initialData ? 'Actualizar Proyecto' : 'Guardar Proyecto'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
