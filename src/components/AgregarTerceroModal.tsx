import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AgregarTerceroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; intermediario: string | null }) => Promise<{ success: boolean; error?: string }>;
}

export default function AgregarTerceroModal({ isOpen, onClose, onSubmit }: AgregarTerceroModalProps) {
  const [nombre, setNombre] = useState('');
  const [intermediario, setIntermediario] = useState('');
  const [dbError, setDbError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNombre('');
    setIntermediario('');
    setDbError('');
    setSaving(false);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || saving) return;

    setSaving(true);
    setDbError('');

    const result = await onSubmit({
      nombre: nombre.trim(),
      intermediario: intermediario.trim() || null,
    });

    if (result.success) {
      onClose();
    } else {
      setDbError(result.error || 'Ocurrió un error al guardar el tercero.');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-[#0E1A16] border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden font-sans"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gold bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-semibold text-enchanted-green dark:text-light-ivory flex items-center space-x-2">
                  <UserPlus size={20} className="text-elevated-gold" />
                  <span>Agregar tercero</span>
                </h3>
                <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-semibold mt-0.5">
                  Catálogo de Terceros
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-enchanted-green/80 dark:text-light-ivory/80 hover:text-cranberry dark:hover:text-[#DFBDB5] hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* DB Error */}
              {dbError && (
                <div className="flex items-start space-x-2.5 bg-cranberry/5 dark:bg-cranberry/10 border border-cranberry/25 rounded p-3">
                  <AlertCircle size={16} className="text-cranberry shrink-0 mt-0.5" />
                  <p className="text-xs text-cranberry dark:text-rose-linen font-semibold leading-relaxed">
                    {dbError}
                  </p>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Nombre del tercero <span className="text-cranberry font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Logística del Norte"
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                />
              </div>

              {/* Intermediario */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5">
                  Intermediario (Opcional)
                </label>
                <input
                  type="text"
                  value={intermediario}
                  onChange={(e) => setIntermediario(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs"
                />
              </div>

              {/* Footer */}
              <div className="pt-5 border-t border-enchanted-green/10 dark:border-light-ivory/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 border border-enchanted-green/20 dark:border-light-ivory/20 hover:border-cranberry hover:text-cranberry text-xs uppercase tracking-wider font-medium rounded transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-xs uppercase tracking-wider font-bold rounded flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  <span>{saving ? 'Guardando…' : 'Guardar tercero'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
