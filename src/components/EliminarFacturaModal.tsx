/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Invoice, ProfitDistribution } from '../types';
import { formatCurrency } from '../utils';

interface EliminarFacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  invoices: Invoice[];
  profitDistributions: ProfitDistribution[];
  onConfirmDelete: (invoiceId: string, distributionIdsToDelete?: string[]) => void;
}

export default function EliminarFacturaModal({
  isOpen,
  onClose,
  invoice,
  invoices,
  profitDistributions,
  onConfirmDelete
}: EliminarFacturaModalProps) {
  if (!isOpen || !invoice) return null;

  const projId = invoice.proyectoId;
  const projectDists = profitDistributions.filter(pd => pd.proyectoId === projId);

  const affectedDists = projectDists.filter(pd => {
    if (!pd.facturaIdsNuevas) return true; // Comportamiento seguro para registros antiguos sin este campo
    return pd.facturaIdsNuevas.includes(invoice.id);
  });

  const totalReverting = affectedDists.reduce((sum, pd) => sum + (pd.gananciaTotal || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const distributionIds = affectedDists.map(pd => pd.id);
    onConfirmDelete(invoice.id, distributionIds);
  };

  return (
    <div id="eliminar-factura-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div id="eliminar-factura-modal-card" className="bg-white dark:bg-[#051A14] w-full max-w-md rounded-lg shadow-2xl border border-cranberry/30 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-cranberry flex items-center space-x-2">
            <Trash2 size={18} className="text-cranberry" />
            <span>Eliminar Factura</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-enchanted-green/60 dark:text-light-ivory/60 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {affectedDists.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[#082019] dark:text-light-ivory/90 leading-relaxed">
                ¿Está seguro de que desea eliminar la factura con folio <strong className="font-mono text-elevated-gold">{invoice.folio}</strong>?
              </p>
              <p className="text-xs text-rocky-gray dark:text-light-ivory/60">
                Esta acción no se puede deshacer y ajustará el estatus de facturación del proyecto.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-cranberry/5 p-3.5 rounded border border-cranberry/25">
                <AlertTriangle className="text-cranberry shrink-0 mt-0.5" size={18} />
                <div className="space-y-2 w-full">
                  <p className="text-xs font-bold text-cranberry uppercase tracking-wide">
                    Advertencia de Cascada
                  </p>
                  <p className="text-xs text-[#082019] dark:text-light-ivory/90 leading-relaxed">
                    Esta acción eliminará también {affectedDists.length} {affectedDists.length === 1 ? 'distribución' : 'distribuciones'} de utilidades {affectedDists.length === 1 ? 'relacionada' : 'relacionadas'}:
                  </p>
                  
                  {/* List of affected distributions */}
                  <div className="bg-white/50 dark:bg-black/30 rounded border border-cranberry/10 p-2 max-h-32 overflow-y-auto space-y-1">
                    {affectedDists.map((dist, idx) => (
                      <div key={dist.id} className="flex justify-between text-[11px] font-mono text-[#082019] dark:text-light-ivory/90">
                        <span>Dist. #{idx + 1} ({dist.fechaCreacion}):</span>
                        <span className="font-bold text-cranberry">{formatCurrency(dist.gananciaTotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1.5 border-t border-cranberry/10 flex justify-between text-xs font-bold text-cranberry uppercase tracking-wide">
                    <span>Total Revertido:</span>
                    <span>{formatCurrency(totalReverting)}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-rocky-gray leading-relaxed">
                Esta acción eliminará la factura con folio <strong className="font-mono">{invoice.folio}</strong> y el reparto de utilidades que generó directamente. Otros repartos de utilidades de este proyecto no se ven afectados.
              </p>
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
              className="px-4 py-2 bg-cranberry text-white font-bold text-xs hover:bg-cranberry/90 rounded transition-colors shadow"
            >
              {affectedDists.length > 0 ? 'Confirmar Eliminación Cascada' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
