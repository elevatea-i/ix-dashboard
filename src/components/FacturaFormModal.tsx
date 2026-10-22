import React, { useState, useEffect } from 'react';
import { Project, Invoice } from '../types';
import { RotateCcw } from 'lucide-react';
import { formatLiveCurrency, parseCurrencyInput, formatCurrency } from '../utils';
import { supabase } from '../lib/supabase';
import Modal, { ModalFooter, Notice, fieldLabel, fieldInput, fieldHint, fieldError, buttonPrimary, buttonSecondary, buttonDanger } from './ui/Modal';

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    folio: string;
    proyectoId: string;
    subtotal: number;
    iva: number;
    retencionIsr: number;
    retencionIva: number;
    metodoPago: 'PUE' | 'PPD';
    complementoEmitido?: boolean;
    fechaEmision: string;
    facturado_por?: 'IX' | 'Juan Carlos';
    tieneFactura: boolean;
  }) => void;
  onRevertToFacturada: (invoiceId: string) => Promise<boolean>;
  initialData: Invoice | null;
  projects: Project[];
}

export default function FacturaFormModal({
  isOpen,
  onClose,
  onSubmit,
  onRevertToFacturada,
  initialData,
  projects
}: FacturaFormModalProps) {
  const [folio, setFolio] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [subtotal, setSubtotal] = useState<string>('');
  const [iva, setIva] = useState<number>(0);
  const [retencionIsr, setRetencionIsr] = useState<number>(0);
  const [retencionIva, setRetencionIva] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'PUE' | 'PPD'>('PUE');
  const [complementoEmitido, setComplementoEmitido] = useState<boolean>(false);
  const [fechaEmision, setFechaEmision] = useState('');
  const [facturadoPor, setFacturadoPor] = useState<'IX' | 'Juan Carlos'>('IX');
  const [tieneFactura, setTieneFactura] = useState<boolean>(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);
  const [revertAmount, setRevertAmount] = useState(0);
  const [revertChecking, setRevertChecking] = useState(false);

  const cleanSubtotal = parseCurrencyInput(subtotal);
  const numSubtotal = parseFloat(cleanSubtotal) || 0;

  // Auto-calculate 16% IVA when subtotal changes
  const handleSubtotalChange = (val: string) => {
    const formatted = formatLiveCurrency(val);
    setSubtotal(formatted);
    // Calculated as exactly 16% of subtotal
    const cleanVal = parseFloat(parseCurrencyInput(formatted)) || 0;
    const calculatedIva = Number((cleanVal * 0.16).toFixed(2));
    setIva(calculatedIva);
  };

  // Recalculate total for read-only preview display
  const calculatedTotal = Number(
    (numSubtotal + iva - retencionIsr - retencionIva).toFixed(2)
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFolio(initialData.folio);
        setProyectoId(initialData.proyectoId);
        setSubtotal(formatLiveCurrency(initialData.subtotal.toString()));
        setIva(initialData.iva);
        setRetencionIsr(initialData.retencionIsr);
        setRetencionIva(initialData.retencionIva);
        setMetodoPago(initialData.metodoPago);
        setComplementoEmitido(initialData.complementoEmitido ?? false);
        setFechaEmision(initialData.fechaEmision);
        setFacturadoPor(initialData.facturado_por || 'IX');
        setTieneFactura(initialData.tieneFactura);
      } else {
        setFolio('');
        setProyectoId(projects.length > 0 ? projects[0].id : '');
        setSubtotal('');
        setIva(0);
        setRetencionIsr(0);
        setRetencionIva(0);
        setMetodoPago('PUE');
        setComplementoEmitido(false);
        setFechaEmision('');
        setFacturadoPor('IX');
        setTieneFactura(true);
      }
      setErrors({});
      setShowRevertConfirm(false);
      setRevertAmount(0);
      setRevertLoading(false);
      setRevertChecking(false);
    }
  }, [isOpen, initialData, projects]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!folio.trim()) {
      newErrors.folio = 'El folio del CFDI es requerido.';
    }
    if (!proyectoId) {
      newErrors.proyectoId = 'Debe seleccionar un proyecto.';
    }
    const cleanSub = parseFloat(cleanSubtotal);
    if (isNaN(cleanSub) || cleanSub <= 0) {
      newErrors.subtotal = 'El subtotal debe ser un número mayor a 0.';
    }
    if (iva < 0) {
      newErrors.iva = 'El IVA no puede ser negativo.';
    }
    if (retencionIsr < 0) {
      newErrors.retencionIsr = 'La retención de ISR no puede ser negativa.';
    }
    if (retencionIva < 0) {
      newErrors.retencionIva = 'La retención de IVA no puede ser negativa.';
    }
    if (!fechaEmision) {
      newErrors.fechaEmision = 'Debe seleccionar la fecha de emisión de la factura.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      folio: folio.trim(),
      proyectoId,
      subtotal: Number(numSubtotal.toFixed(2)),
      iva,
      retencionIsr,
      retencionIva,
      metodoPago,
      complementoEmitido: metodoPago === 'PPD' ? complementoEmitido : undefined,
      fechaEmision,
      facturado_por: facturadoPor,
      tieneFactura,
    });
  };

  const handleRevertClick = async () => {
    if (!initialData) return;
    setRevertChecking(true);
    try {
      const { data: dists, error } = await supabase
        .from('repartos_utilidad')
        .select('ganancia_total')
        .filter('factura_ids_nuevas', 'cs', `{"${initialData.id}"}`);
      if (error) {
        setRevertChecking(false);
        setShowRevertConfirm(false);
        return;
      }
      const total = (dists || []).reduce((sum, d) => sum + Number(d.ganancia_total || 0), 0);
      setRevertAmount(total);
    } catch {
      setRevertAmount(0);
    }
    setRevertChecking(false);
    setShowRevertConfirm(true);
  };

  const handleConfirmRevert = async () => {
    if (!initialData) return;
    setRevertLoading(true);
    const success = await onRevertToFacturada(initialData.id);
    setRevertLoading(false);
    if (success) {
      setShowRevertConfirm(false);
    }
  };

  const isEditingPagada = initialData && initialData.estado === 'pagada';

  const moneyInput = `${fieldInput} num pl-7`;

  return (
    <Modal
      id="invoice-form-modal-container"
      cardId="invoice-form-modal-card"
      closeButtonId="close-invoice-modal-btn"
      eyebrow={initialData ? `Folio ${initialData.folio}` : 'Nuevo CFDI'}
      title={initialData ? 'Editar factura' : 'Registrar factura'}
      onClose={onClose}
      size="lg"
    >
      {projects.length === 0 ? (
        <div id="no-projects-warning" className="px-6 sm:px-8 py-14 text-center">
          <span aria-hidden className="block mx-auto h-px w-10 bg-elevated-gold mb-6" />
          <p className="font-serif text-[22px] font-medium text-enchanted-green dark:text-light-ivory">Aún no hay proyectos</p>
          <p className="text-[14px] text-ink-soft dark:text-light-ivory/60 mt-2 max-w-sm mx-auto">
            Registra al menos un proyecto en el catálogo para poder vincular facturas.
          </p>
          <button type="button" onClick={onClose} className={`${buttonSecondary} mt-6`}>Entendido</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="px-6 sm:px-8 py-6 space-y-8 overflow-y-auto">
            {isEditingPagada && !showRevertConfirm && (
              <Notice tone="gold" title="Factura marcada como pagada">
                <p>Si se marcó por error, puedes regresarla a “por cobrar”. Esto elimina el reparto de utilidades que generó.</p>
                <button
                  type="button"
                  onClick={handleRevertClick}
                  disabled={revertChecking}
                  className={`${buttonSecondary} disabled:cursor-wait`}
                >
                  <RotateCcw size={14} strokeWidth={1.75} className={revertChecking ? 'animate-spin' : ''} />
                  {revertChecking ? 'Consultando reparto…' : 'Revertir a por cobrar'}
                </button>
              </Notice>
            )}

            {isEditingPagada && showRevertConfirm && (
              <Notice tone="alert" title="Confirmar reversión">
                <p>
                  La factura regresará a “por cobrar” y se eliminará el reparto de utilidades de{' '}
                  <span className="num font-semibold text-cranberry dark:text-cranberry-300">{formatCurrency(revertAmount)}</span>. Esta acción no se puede deshacer.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setShowRevertConfirm(false)} disabled={revertLoading} className={buttonSecondary}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleConfirmRevert} disabled={revertLoading} className={`${buttonDanger} disabled:cursor-wait`}>
                    {revertLoading && <RotateCcw size={14} className="animate-spin" />}
                    {revertLoading ? 'Revirtiendo…' : 'Confirmar reversión'}
                  </button>
                </div>
              </Notice>
            )}

            <section className="space-y-5">
              <p className="eyebrow text-ink-mute dark:text-light-ivory/45">Datos del comprobante</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={fieldLabel}>Folio CFDI</label>
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    placeholder="Ej. IX01, B-452"
                    className={`${fieldInput} num`}
                  />
                  {errors.folio && <p className={fieldError}>{errors.folio}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>Proyecto</label>
                  <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} className={fieldInput}>
                    {projects.filter(p => !p.cerrado || p.id === initialData?.proyectoId).map((proj) => (
                      <option key={proj.id} value={proj.id}>[{proj.codigo}] {proj.nombre}</option>
                    ))}
                  </select>
                  {errors.proyectoId && <p className={fieldError}>{errors.proyectoId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={fieldLabel}>Fecha de emisión</label>
                  <input
                    type="date"
                    required
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className={`${fieldInput} num`}
                  />
                  {errors.fechaEmision && <p className={fieldError}>{errors.fechaEmision}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>Método de pago</label>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as 'PUE' | 'PPD')} className={fieldInput}>
                    <option value="PUE">PUE · Una sola exhibición</option>
                    <option value="PPD">PPD · Parcialidades o diferido</option>
                  </select>
                </div>

                <div>
                  <label className={fieldLabel}>Facturado por</label>
                  <select value={facturadoPor} onChange={(e) => setFacturadoPor(e.target.value as 'IX' | 'Juan Carlos')} className={fieldInput}>
                    <option value="IX">IX</option>
                    <option value="Juan Carlos">Juan Carlos</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl ring-1 ring-enchanted-green/[0.08] dark:ring-white/[0.07] divide-y divide-enchanted-green/[0.06] dark:divide-white/[0.05]">
                {metodoPago === 'PPD' && (
                  <label className="flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer">
                    <span>
                      <span className="block text-[14px] font-medium text-enchanted-green dark:text-light-ivory">Complemento de pago emitido</span>
                      <span className="block text-[12px] text-ink-mute dark:text-light-ivory/45 mt-0.5">El complemento ya fue emitido y timbrado</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={complementoEmitido}
                      onChange={(e) => setComplementoEmitido(e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-enchanted-green dark:accent-gold-300 cursor-pointer"
                    />
                  </label>
                )}
                <label className="flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer">
                  <span>
                    <span className="block text-[14px] font-medium text-enchanted-green dark:text-light-ivory">Tiene XML / PDF</span>
                    <span className="block text-[12px] text-ink-mute dark:text-light-ivory/45 mt-0.5">Comprobante fiscal recibido</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={tieneFactura}
                    onChange={(e) => setTieneFactura(e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-enchanted-green dark:accent-gold-300 cursor-pointer"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-5">
              <p className="eyebrow text-ink-mute dark:text-light-ivory/45">Importes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={fieldLabel}>Subtotal</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={subtotal}
                    onChange={(e) => handleSubtotalChange(e.target.value)}
                    placeholder="$0.00"
                    className={`${fieldInput} num`}
                  />
                  {errors.subtotal && <p className={fieldError}>{errors.subtotal}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>IVA</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-ink-mute pointer-events-none">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={iva || ''}
                      onChange={(e) => setIva(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={moneyInput}
                    />
                  </div>
                  <p className={fieldHint}>Se calcula al 16% del subtotal; puedes ajustarlo.</p>
                  {errors.iva && <p className={fieldError}>{errors.iva}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>Retención ISR <span className="text-ink-mute dark:text-light-ivory/40 font-normal">· opcional</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-ink-mute pointer-events-none">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={retencionIsr || ''}
                      onChange={(e) => setRetencionIsr(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={moneyInput}
                    />
                  </div>
                  {errors.retencionIsr && <p className={fieldError}>{errors.retencionIsr}</p>}
                </div>

                <div>
                  <label className={fieldLabel}>Retención IVA <span className="text-ink-mute dark:text-light-ivory/40 font-normal">· opcional</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-ink-mute pointer-events-none">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={retencionIva || ''}
                      onChange={(e) => setRetencionIva(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={moneyInput}
                    />
                  </div>
                  {errors.retencionIva && <p className={fieldError}>{errors.retencionIva}</p>}
                </div>
              </div>

              <div className="flex items-end justify-between gap-4 rounded-xl bg-enchanted-green/[0.035] dark:bg-white/[0.035] px-5 py-4">
                <div>
                  <p className="eyebrow text-ink-mute dark:text-light-ivory/45">Total del CFDI</p>
                  <p className="text-[12px] text-ink-mute dark:text-light-ivory/45 mt-1">Subtotal + IVA − retenciones</p>
                </div>
                <p className="num font-serif text-[30px] leading-none font-medium text-enchanted-green dark:text-light-ivory">
                  {formatCurrency(calculatedTotal)}
                </p>
              </div>
            </section>
          </div>

          <ModalFooter>
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancelar</button>
            <button type="submit" className={buttonPrimary}>{initialData ? 'Guardar cambios' : 'Registrar factura'}</button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
