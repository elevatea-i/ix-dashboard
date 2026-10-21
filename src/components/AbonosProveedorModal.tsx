import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, AlertCircle, Lock, Calendar } from 'lucide-react';
import { AbonoProveedor, AbonoEstatus, ProviderPayment, Project } from '../types';
import { getMexicoCityDate, formatLiveCurrency, parseCurrencyInput, formatCurrency } from '../utils';
import { getAbonosResumen } from '../utils/abonos';
import AbonoProveedorRow from './AbonoProveedorRow';

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
    data: { monto: number; estatus: AbonoEstatus; fechaPago: string | null; complementoEmitido: boolean; nota: string | null }
  ) => ActionResult;
  onDelete: (abonoId: string) => ActionResult;
  onToggleComplemento: (abonoId: string) => ActionResult;
  onMarcarPagado: (abonoId: string, fechaPago: string) => ActionResult;
  onRevertirPendiente: (abonoId: string) => ActionResult;
  onEditarNota: (abonoId: string, nota: string | null) => ActionResult;
}

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
  onMarcarPagado,
  onRevertirPendiente,
  onEditarNota,
}: AbonosProveedorModalProps) {
  const [monto, setMonto] = useState('');
  const [estatus, setEstatus] = useState<AbonoEstatus>('Pendiente');
  const [fechaPago, setFechaPago] = useState('');
  const [complementoEmitido, setComplementoEmitido] = useState(false);
  const [nota, setNota] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const resetForm = () => {
    setMonto('');
    setEstatus('Pendiente');
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
    } else if (parsedMonto > resumen.sinAutorizar) {
      newErrors.monto = `El monto no puede superar lo que falta por autorizar (${formatCurrency(resumen.sinAutorizar)})`;
    }
    if (estatus === 'Pagado' && !fechaPago) {
      newErrors.fechaPago = 'La fecha de pago es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setDbError(null);
    setSubmitting(true);
    const pagado = estatus === 'Pagado';
    const result = await onCreate(payment.id, {
      monto: parsedMonto,
      estatus,
      fechaPago: pagado ? fechaPago : null,
      complementoEmitido: pagado ? complementoEmitido : false,
      nota: nota.trim() || null,
    });
    setSubmitting(false);

    if (result.success) {
      resetForm();
    } else if (result.error) {
      setDbError(result.error);
    }
  };

  const runRowAction = async (abonoId: string, action: () => ActionResult): Promise<boolean> => {
    setBusyId(abonoId);
    setDbError(null);
    const result = await action();
    setBusyId(null);
    if (!result.success && result.error) setDbError(result.error);
    return result.success;
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: payment.total, tone: 'text-[#0B3D2E] dark:text-light-ivory' },
                  { label: 'Pagado', value: resumen.pagado, tone: 'text-enchanted-green dark:text-emerald-300' },
                  { label: 'Autorizado por pagar', value: resumen.autorizadoPorPagar, tone: 'text-[#8C7853] dark:text-elevated-gold' },
                  { label: 'Sin autorizar', value: resumen.sinAutorizar, tone: 'text-rocky-gray dark:text-light-ivory/70' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded border border-enchanted-green/15 dark:border-white/10"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rocky-gray dark:text-light-ivory/60 block">
                      {item.label}
                    </span>
                    <span className={`text-base font-mono font-bold block mt-0.5 ${item.tone}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <div className="h-1.5 w-full bg-enchanted-green/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-elevated-gold rounded-full transition-all duration-500"
                    style={{ width: `${resumen.porcentaje}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-rocky-gray dark:text-light-ivory/60 text-right font-mono">
                  {resumen.porcentaje.toFixed(0)}% pagado
                </p>
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
                          <th className="px-3 py-2 font-bold">Estatus</th>
                          <th className="px-3 py-2 font-bold">Fecha de pago</th>
                          <th className="px-3 py-2 font-bold text-right">Monto</th>
                          <th className="px-3 py-2 font-bold text-right">IVA</th>
                          <th className="px-3 py-2 font-bold">Complemento</th>
                          <th className="px-3 py-2 font-bold">Nota</th>
                          {!readOnly && <th className="px-3 py-2" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-enchanted-green/10 dark:divide-white/10">
                        {resumen.abonos.map(abono => (
                          <React.Fragment key={abono.id}>
                          <AbonoProveedorRow
                            abono={abono}
                            readOnly={readOnly}
                            busy={busyId === abono.id}
                            tieneFactura={payment.tieneFactura}
                            run={runRowAction}
                            onDelete={onDelete}
                            onToggleComplemento={onToggleComplemento}
                            onMarcarPagado={onMarcarPagado}
                            onRevertirPendiente={onRevertirPendiente}
                            onEditarNota={onEditarNota}
                          />
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!readOnly && resumen.sinAutorizar > 0 && (
                <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-elevated-gold/30 bg-elevated-gold/5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold">
                      Registrar abono
                    </h3>
                    <p className="text-[10px] text-rocky-gray dark:text-light-ivory/60 mt-0.5">
                      El tipo y el IVA de cada abono los calcula el sistema. Un abono pendiente queda autorizado y se marca como pagado cuando se realice el pago.
                    </p>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#082019] dark:text-light-ivory/90 mb-1">Estatus</span>
                    <div role="radiogroup" className="inline-flex rounded border border-enchanted-green/30 dark:border-light-ivory/20 overflow-hidden">
                      {(['Pendiente', 'Pagado'] as AbonoEstatus[]).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={estatus === opt}
                          onClick={() => setEstatus(opt)}
                          className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                            estatus === opt
                              ? 'bg-enchanted-green text-light-ivory dark:bg-elevated-gold dark:text-[#070D0C]'
                              : 'bg-white text-enchanted-green hover:bg-enchanted-green/5 dark:bg-[#070D0C] dark:text-light-ivory/80 dark:hover:bg-white/5'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={`grid grid-cols-1 gap-4 ${estatus === 'Pagado' ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
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
                        onClick={() => setMonto(formatLiveCurrency(resumen.sinAutorizar.toFixed(2)))}
                        className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#8C7853] dark:text-elevated-gold hover:underline"
                      >
                        Autorizar resto
                      </button>
                      {errors.monto && (
                        <p className="text-[10px] text-cranberry mt-1 font-semibold">{errors.monto}</p>
                      )}
                    </div>
                    {estatus === 'Pagado' && (
                      <>
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
                      </>
                    )}
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
