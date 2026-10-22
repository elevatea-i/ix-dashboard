import React, { useState, useEffect } from 'react';
import { getMexicoCityDate } from '../utils';
import Modal, { ModalFooter, Notice, fieldLabel, fieldInput, fieldHint, buttonPrimary, buttonSecondary } from './ui/Modal';

interface MarcarPagadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fechaPago: string) => void;
  folio: string;
  facturadoPor?: 'IX' | 'Juan Carlos';
}

export default function MarcarPagadaModal({
  isOpen,
  onClose,
  onConfirm,
  folio,
  facturadoPor = 'IX'
}: MarcarPagadaModalProps) {
  const [fechaPago, setFechaPago] = useState('');
  const [confirmTransfer, setConfirmTransfer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFechaPago(getMexicoCityDate());
      setConfirmTransfer(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isJuanCarlos = facturadoPor === 'Juan Carlos';
  const blocked = isJuanCarlos && !confirmTransfer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaPago || blocked) return;
    onConfirm(fechaPago);
  };

  return (
    <Modal
      id="marcar-pagada-modal-container"
      cardId="marcar-pagada-modal-card"
      eyebrow="Cobranza"
      title="Registrar pago"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
        <div className="px-6 sm:px-8 py-6 space-y-6 overflow-y-auto">
          <p className="text-[14px] leading-relaxed text-ink-soft dark:text-light-ivory/75">
            La factura <span className="num font-semibold text-enchanted-green dark:text-light-ivory">{folio}</span> quedará registrada como pagada.
          </p>

          {isJuanCarlos && (
            <Notice tone="alert" title="Facturada por Juan Carlos">
              <p>
                Márcala como pagada únicamente cuando él ya te haya transferido el dinero, no cuando el cliente le pague a él.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmTransfer}
                  onChange={(e) => setConfirmTransfer(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-cranberry/50 text-cranberry accent-cranberry focus:ring-cranberry/30"
                />
                <span className="text-[13px] font-medium text-enchanted-green dark:text-light-ivory">
                  Confirmo que Juan Carlos ya transfirió el dinero a la cuenta principal.
                </span>
              </label>
            </Notice>
          )}

          <div>
            <label className={fieldLabel}>Fecha real de pago</label>
            <input
              type="date"
              required
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className={`${fieldInput} num`}
            />
            <p className={fieldHint}>
              Se propone la fecha de hoy (hora de Ciudad de México). Cámbiala si el cobro ocurrió otro día.
            </p>
          </div>
        </div>

        <ModalFooter>
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancelar</button>
          <button type="submit" disabled={blocked} className={buttonPrimary}>Confirmar pago</button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
