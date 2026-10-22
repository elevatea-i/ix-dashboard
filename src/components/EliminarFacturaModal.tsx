import React from 'react';
import { Invoice, ProfitDistribution } from '../types';
import { formatCurrency, formatShortDate } from '../utils';
import Modal, { ModalFooter, Notice, buttonDanger, buttonSecondary } from './ui/Modal';

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
  profitDistributions,
  onConfirmDelete
}: EliminarFacturaModalProps) {
  if (!isOpen || !invoice) return null;

  const projectDists = profitDistributions.filter(pd => pd.proyectoId === invoice.proyectoId);

  const affectedDists = projectDists.filter(pd => {
    // Registros antiguos sin facturaIdsNuevas se tratan como afectados por seguridad
    if (!pd.facturaIdsNuevas) return true;
    return pd.facturaIdsNuevas.includes(invoice.id);
  });

  const totalReverting = affectedDists.reduce((sum, pd) => sum + (pd.gananciaTotal || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmDelete(invoice.id, affectedDists.map(pd => pd.id));
  };

  return (
    <Modal
      id="eliminar-factura-modal-container"
      cardId="eliminar-factura-modal-card"
      eyebrow="Acción permanente"
      title="Eliminar factura"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
        <div className="px-6 sm:px-8 py-6 space-y-6 overflow-y-auto">
          <div className="flex items-baseline justify-between gap-4 pb-5 border-b border-enchanted-green/[0.07] dark:border-white/[0.06]">
            <div>
              <p className="eyebrow text-ink-mute dark:text-light-ivory/45">Folio</p>
              <p className="num text-[16px] font-semibold text-enchanted-green dark:text-light-ivory mt-1">{invoice.folio}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-ink-mute dark:text-light-ivory/45">Total</p>
              <p className="num text-[16px] font-semibold text-enchanted-green dark:text-light-ivory mt-1">{formatCurrency(invoice.total)}</p>
            </div>
          </div>

          {affectedDists.length === 0 ? (
            <Notice tone="alert" title="No se puede deshacer">
              <p>Eliminar esta factura cambia el estado de facturación del proyecto y los cálculos de rentabilidad.</p>
            </Notice>
          ) : (
            <Notice tone="alert" title="También se eliminarán repartos">
              <p>
                Se {affectedDists.length === 1 ? 'eliminará 1 reparto de utilidades generado' : `eliminarán ${affectedDists.length} repartos de utilidades generados`} por esta factura. Otros repartos del proyecto no se ven afectados.
              </p>
              <div className="rounded-lg ring-1 ring-enchanted-green/[0.08] dark:ring-white/[0.07] divide-y divide-enchanted-green/[0.06] dark:divide-white/[0.05] max-h-40 overflow-y-auto">
                {affectedDists.map((dist, idx) => (
                  <div key={dist.id} className="flex justify-between gap-4 px-3.5 py-2.5 text-[13px]">
                    <span className="text-ink-soft dark:text-light-ivory/65">
                      Reparto {idx + 1} · <span className="num">{formatShortDate(dist.fechaCreacion)}</span>
                    </span>
                    <span className="num font-medium text-enchanted-green dark:text-light-ivory">{formatCurrency(dist.gananciaTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="font-medium text-enchanted-green dark:text-light-ivory">Total revertido</span>
                <span className="num font-semibold text-cranberry dark:text-cranberry-300">{formatCurrency(totalReverting)}</span>
              </div>
            </Notice>
          )}
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancelar</button>
          <button type="submit" className={buttonDanger}>
            {affectedDists.length > 0 ? 'Eliminar factura y repartos' : 'Eliminar factura'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
