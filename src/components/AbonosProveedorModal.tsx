import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, AlertCircle, Lock, Trash2, Calendar } from 'lucide-react';
import { AbonoProveedor, ProviderPayment, Project } from '../types';
import { getMexicoCityDate, formatLiveCurrency, parseCurrencyInput, formatCurrency } from '../utils';
import { getAbonosResumen } from '../utils/abonos';

function formatDbErrorMessage(message: string): string {
  return message.replace(
    /(saldo)(:\s*)(\d+(?:\.\d{1,2})?)/gi,
    (_match, label: string, separator: string, amount: string) =>
      `${label}${separator}${formatCurrency(Number(amount))}`
  );
}

type ActionResult = Promise<{ success: boolean; error?: string }>;

interface AbonosProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: ProviderPayment | null;
  project: Project | undefined;
  abonos: AbonoProveedor[];
  readOnly: boolean;
  onCreate: (
    pagoId: string,
    data: { monto: number; fechaPago: string; complementoEmitido: boolean; nota: string | null }
  ) => ActionResult;
  onDelete: (abonoId: string) => ActionResult;
  onToggleComplemento: (abonoId: string) => ActionResult;
}

const TIPO_STYLES: Record<AbonoProveedor['tipo'], string> = {
  Anticipo: 'bg-elevated-gold/15 text-[#8C7853] dark:text-elevated-gold border-elevated-gold/30',
  Parcialidad: 'bg-enchanted-green/10 text-enchanted-green dark:bg-white/10 dark:text-light-ivory border-enchanted-green/20 dark:border-white/15',
  Finiquito: 'bg-[#0B3D2E] text-light-ivory border-[#0B3D2E] dark:bg-elevated-gold dark:text-[#070D0C] dark:border-elevated-gold',
};

export default function AbonosProveedorModal({
  isOpen,
  onClose,
  payment,
  project,
  abonos,
  readOnly,
  onCreate,
  onDelete,
  onToggleComplemento,
}: AbonosProveedorModalProps) {
  const [monto, setMonto] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [complementoEmitido, setComplementoEmitido] = useState(false);
  const [nota, setNota] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setMonto('');
    setFechaPago(getMexicoCityDate());
    setComplementoEmitido(false);
    setNota('');
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setDbError(null);
      setSubmitting(false);
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  }, [isOpen, payment?.id]);

  const resumen = payment ? getAbonosResumen(payment, abonos) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !resumen) return;
    const newErrors: { [key: string]: string } = {};

    const parsedMonto = Number((parseFloat(parseCurrencyInput(monto)) || 0).toFixed(2));
    if (parsedMonto <= 0) {
      newErrors.monto = 'Ingrese un monto mayor a 0';
    } else if (parsedMonto > resumen.saldo) {
      newErrors.monto = `El monto no puede superar el saldo (${formatCurrency(resumen.saldo)})`;
    }
    if (!fechaPago) {
      newErrors.fechaPago = 'La fecha de pago es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setDbError(null);
    setSubmitting(true);
    const result = await onCreate(payment.id, {
      monto: parsedMonto,
      fechaPago,
      complementoEmitido,
      nota: nota.trim() || null,
    });
    setSubmitting(false);

    if (result.success) {
      resetForm();
    } else if (result.error) {
      setDbError(result.error);
    }
  };

  const runRowAction = async (abonoId: string, action: (id: string) => ActionResult) => {
    setBusyId(abonoId);
    setDbError(null);
    const result = await action(abonoId);
    setBusyId(null);
    setConfirmDeleteId(null);
    if (!result.success && result.error) setDbError(result.error);
  };

  return (
    <AnimatePresence>
      {isOpen && payment && resumen && (
        <motion.div
          key="abonos-proveedor-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="abonos-proveedor-card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.12 } }}
            className="bg-white dark:bg-[#051A14] w-full max-w-3xl rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="h-[3px] bg-elevated-gold" />

            <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-start justify-between bg-white dark:bg-[#051A14]">
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <Wallet className="text-elevated-gold shrink-0" size={18} />
                  <h2 className="text-xl font-serif font-bold text-enchanted-green dark:text-light-ivory truncate">
                    Abonos · {payment.proveedor}
                  </h2>
                </div>
                <p className="text-xs text-rocky-gray dark:text-rose-linen/60 mt-1 truncate">
                  {project ? `[${project.codigo}] ${project.nombre}` : 'Proyecto no encontrado'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 font-sans">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: payment.total, accent: false },
                  { label: 'Pagado', value: resumen.pagado, accent: false },
                  { label: 'Saldo', value: resumen.saldo, accent: true },
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded border border-enchanted-green/15 dark:border-white/10"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rocky-gray dark:text-light-ivory/60 block">
                      {item.label}
                    </span>
                    <span
                      className={`text-base font-mono font-bold block mt-0.5 ${
                        item.accent ? 'text-[#8C7853] dark:text-elevated-gold' : 'text-[#0B3D2E] dark:text-light-ivory'
                      }`}
                    >
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 w-full bg-enchanted-green/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-elevated-gold rounded-full transition-all duration-500"
                  style={{ width: `${resumen.porcentaje}%` }}
                />
              </div>

              {readOnly && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-linen/30 dark:bg-cranberry/10 border border-cranberry/30 rounded text-xs text-cranberry font-medium">
                  <Lock size={14} className="shrink-0" />
                  <span>Este proyecto está cerrado y no se puede modificar.</span>
                </div>
              )}

              {dbError && (
                <div className="p-3.5 bg-cranberry/10 dark:bg-cranberry/15 text-cranberry border border-cranberry/30 dark:border-cranberry/40 rounded text-xs flex items-start gap-2 font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-cranberry" />
                  <span>{formatDbErrorMessage(dbError)}</span>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold mb-2">
                  Abonos registrados
                </h3>
                {resumen.abonos.length === 0 ? (
                  <p className="text-xs text-rocky-gray dark:text-light-ivory/60 py-4 text-center border border-dashed border-enchanted-green/20 dark:border-white/10 rounded">
                    Aún no hay abonos registrados para este pago.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-enchanted-green/10 dark:border-white/10 rounded">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-enchanted-green/5 dark:bg-white/5 text-[10px] uppercase tracking-wider text-rocky-gray dark:text-light-ivory/60">
                        <tr>
                          <th className="px-3 py-2 font-bold">Tipo</th>
                          <th className="px-3 py-2 font-bold">Fecha de pago</th>
                          <th className="px-3 py-2 font-bold text-right">Monto</th>
                          <th className="px-3 py-2 font-bold text-right">IVA</th>
                          <th className="px-3 py-2 font-bold">Complemento</th>
                          <th className="px-3 py-2 font-bold">Nota</th>
                          {!readOnly && <th className="px-3 py-2" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-enchanted-green/10 dark:divide-white/10">
                        {resumen.abonos.map(abono => {
                          const busy = busyId === abono.id;
                          return (
                            <tr key={abono.id} className="text-enchanted-green dark:text-light-ivory">
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${TIPO_STYLES[abono.tipo]}`}>
                                  {abono.tipo}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono whitespace-nowrap">{abono.fechaPago}</td>
                              <td className="px-3 py-2 font-mono text-right whitespace-nowrap font-bold">{formatCurrency(abono.monto)}</td>
                              <td className="px-3 py-2 font-mono text-right whitespace-nowrap">{formatCurrency(abono.iva)}</td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={abono.complementoEmitido}
                                  disabled={readOnly || busy}
                                  onClick={() => runRowAction(abono.id, onToggleComplemento)}
                                  className="flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <span
                                    className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${
                                      abono.complementoEmitido ? 'bg-enchanted-green dark:bg-elevated-gold' : 'bg-rocky-gray/40'
                                    }`}
                                  >
                                    <span
                                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                                        abono.complementoEmitido ? 'translate-x-3.5' : 'translate-x-0.5'
                                      }`}
                                    />
                                  </span>
                                  <span className="text-[10px] font-bold">{abono.complementoEmitido ? 'Sí' : 'No'}</span>
                                </button>
                              </td>
                              <td className="px-3 py-2 max-w-[160px] truncate text-rocky-gray dark:text-light-ivory/70" title={abono.nota ?? ''}>
                                {abono.nota || '—'}
                              </td>
                              {!readOnly && (
                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                  {confirmDeleteId === abono.id ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-cranberry">¿Borrar?</span>
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => runRowAction(abono.id, onDelete)}
                                        className="px-2 py-0.5 rounded bg-cranberry text-white text-[10px] font-bold hover:bg-cranberry/90 disabled:opacity-50"
                                      >
                                        {busy ? '…' : 'Sí'}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-0.5 rounded border border-rocky-gray/40 text-[10px] font-bold hover:bg-black/5 dark:hover:bg-white/5"
                                      >
                                        No
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(abono.id)}
                                      title="Borrar abono"
                                      className="p-1 text-cranberry/80 hover:text-cranberry hover:bg-cranberry/10 rounded transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!readOnly && resumen.saldo > 0 && (
                <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-elevated-gold/30 bg-elevated-gold/5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold">
                      Registrar abono
                    </h3>
                    <p className="text-[10px] text-rocky-gray dark:text-light-ivory/60 mt-0.5">
                      El tipo y el IVA de cada abono los calcula el sistema.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#082019] dark:text-light-ivory/90 mb-1">
                        Monto <span className="text-cranberry font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={monto}
                        onChange={(e) => setMonto(formatLiveCurrency(e.target.value))}
                        placeholder="$0.00"
                        className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold transition-colors shadow-xs ${
                          errors.monto ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setMonto(formatLiveCurrency(resumen.saldo.toFixed(2)))}
                        className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold hover:underline"
                      >
                        Liquidar saldo
                      </button>
                      {errors.monto && (
                        <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.monto}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#082019] dark:text-light-ivory/90 mb-1 flex items-center gap-1">
                        <Calendar size={12} className="text-[#8C7853] dark:text-elevated-gold" />
                        <span>Fecha de pago <span className="text-cranberry font-bold">*</span></span>
                      </label>
                      <input
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        className={`w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border rounded text-sm text-enchanted-green dark:text-light-ivory font-mono focus:outline-none focus:border-elevated-gold transition-colors shadow-xs [color-scheme:light] dark:[color-scheme:dark] ${
                          errors.fechaPago ? 'border-cranberry' : 'border-enchanted-green/40 dark:border-light-ivory/30'
                        }`}
                      />
                      {errors.fechaPago && (
                        <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.fechaPago}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#082019] dark:text-light-ivory/90 mb-1">
                        Complemento emitido
                      </label>
                      <select
                        value={complementoEmitido ? 'si' : 'no'}
                        onChange={(e) => setComplementoEmitido(e.target.value === 'si')}
                        className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold shadow-xs"
                      >
                        <option value="no" className="bg-white dark:bg-[#051A14]">No</option>
                        <option value="si" className="bg-white dark:bg-[#051A14]">Sí</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#082019] dark:text-light-ivory/90 mb-1">
                      Nota <span className="text-rocky-gray font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Ej. Transferencia SPEI"
                      className="w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors shadow-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-[#0B3D2E] dark:hover:bg-elevated-gold/90 px-5 py-2 rounded text-xs uppercase tracking-wider font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Guardando…' : 'Registrar abono'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-3 border-t border-enchanted-green/10 dark:border-light-ivory/10 flex justify-end bg-white dark:bg-[#051A14]">
              <button
                type="button"
                onClick={onClose}
                className="bg-transparent border border-rocky-gray/40 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-enchanted-green dark:text-light-ivory px-4 py-2 rounded text-xs uppercase tracking-wider font-semibold transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
