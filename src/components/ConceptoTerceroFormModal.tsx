import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ChevronDown, RefreshCw } from 'lucide-react';
import { ThirdPartyPayment, Invoice, Project } from '../types';
import { formatLiveCurrency, parseCurrencyInput, formatCurrency } from '../utils';
import { calcularDesgloseTercero } from '../utils/terceros';

interface ConceptoTerceroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    concepto: string;
    facturaId: string | null;
    proyectoId: string | null;
    saldoOriginal: number;
    comisionIntermediario: number;
    gananciaIxAdicional: number;
    montoADepositar: number;
    statusFac: 'Disponible' | 'Por pagar';
    fecha: string | null;
  }, editId?: string) => Promise<{ success: boolean; error?: string }>;
  initialData: ThirdPartyPayment | null;
  invoices: Invoice[];
  projects: Project[];
  restanteActual: number;
  intermediarioNombre: string | null;
}

/* ── Shared Tailwind fragments ─────────────────────────────── */
const labelCls = 'block text-xs uppercase tracking-wider font-bold text-[#082019] dark:text-light-ivory/90 mb-1.5';
const inputCls = 'w-full px-3.5 py-2 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/80 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors shadow-xs';

export default function ConceptoTerceroFormModal({
  isOpen, onClose, onSubmit, initialData, invoices, projects,
  restanteActual, intermediarioNombre,
}: ConceptoTerceroFormModalProps) {
  const [concepto, setConcepto] = useState('');
  const [facturaId, setFacturaId] = useState<string | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [saldoOriginal, setSaldoOriginal] = useState('');
  const [montoADepositar, setMontoADepositar] = useState('');
  const [comisionIntermediario, setComisionIntermediario] = useState('');
  const [gananciaIxAdicional, setGananciaIxAdicional] = useState('');
  const [statusFac, setStatusFac] = useState<'Disponible' | 'Por pagar'>('Por pagar');
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const num = (v: string) => parseFloat(parseCurrencyInput(v)) || 0;
  const isEditing = !!initialData;

  const selectedInvoice = facturaId ? invoices.find(i => i.id === facturaId) ?? null : null;

  const projectForInvoice = (inv: Invoice) => projects.find(p => p.id === inv.proyectoId);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setConcepto(initialData.concepto);
      setFacturaId(initialData.facturaId);
      setProyectoId(initialData.proyectoId);
      setSaldoOriginal(formatLiveCurrency(initialData.saldoOriginal.toString()));
      setMontoADepositar(formatLiveCurrency(initialData.montoADepositar.toString()));
      setComisionIntermediario(formatLiveCurrency(initialData.comisionIntermediario.toString()));
      setGananciaIxAdicional(formatLiveCurrency(initialData.gananciaIxAdicional.toString()));
      setStatusFac(initialData.statusFac);
      setFecha(initialData.fecha ?? '');
    } else {
      setConcepto(''); setFacturaId(null); setProyectoId(null);
      setSaldoOriginal(''); setMontoADepositar('');
      setComisionIntermediario(''); setGananciaIxAdicional('');
      setStatusFac('Por pagar'); setFecha('');
    }
    setDbError(null); setSaving(false);
    setInvoiceOpen(false); setInvoiceSearch('');
  }, [isOpen, initialData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setInvoiceOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (selectedInvoice) setProyectoId(selectedInvoice.proyectoId);
  }, [selectedInvoice]);

  const recalcular = (saldoStr: string) => {
    const saldo = num(saldoStr);
    if (saldo <= 0) { setMontoADepositar(''); setComisionIntermediario(''); setGananciaIxAdicional(''); return; }
    const d = calcularDesgloseTercero(saldo);
    setMontoADepositar(formatLiveCurrency(d.montoADepositar.toString()));
    setComisionIntermediario(formatLiveCurrency(d.comisionIntermediario.toString()));
    setGananciaIxAdicional(formatLiveCurrency(d.gananciaIxAdicional.toString()));
  };

  const handleSaldoChange = (v: string) => {
    const fmt = formatLiveCurrency(v);
    setSaldoOriginal(fmt); setDbError(null);
    recalcular(fmt);
  };

  const handleCurrencyField = (setter: (v: string) => void) => (v: string) => { setter(formatLiveCurrency(v)); setDbError(null); };

  const nMonto = num(montoADepositar);
  const nComision = num(comisionIntermediario);
  const nGanancia = num(gananciaIxAdicional);
  const nSaldo = num(saldoOriginal);
  const sumaParts = nMonto + nComision + nGanancia;
  const diffParts = Math.abs(sumaParts - nSaldo);
  const showSumWarning = nSaldo > 0 && diffParts > 0.01;

  // Negative restante warning
  const computeImpact = () => {
    const newDisp = statusFac === 'Disponible' ? nMonto : 0;
    const oldDisp = initialData && initialData.statusFac === 'Disponible' ? initialData.montoADepositar : 0;
    return isEditing ? newDisp - oldDisp : newDisp;
  };
  const nuevoRestante = restanteActual + computeImpact();
  const showNegativeWarning = nuevoRestante < -0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || nSaldo <= 0) return;
    setSaving(true); setDbError(null);
    const result = await onSubmit({
      concepto: concepto.trim(),
      facturaId,
      proyectoId,
      saldoOriginal: Number(nSaldo.toFixed(2)),
      comisionIntermediario: Number(nComision.toFixed(2)),
      gananciaIxAdicional: Number(nGanancia.toFixed(2)),
      montoADepositar: Number(nMonto.toFixed(2)),
      statusFac,
      fecha: fecha || null,
    }, initialData?.id);
    setSaving(false);
    if (!result.success) setDbError(result.error ?? 'Error desconocido al guardar.');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!invoiceSearch) return true;
    const q = invoiceSearch.toLowerCase();
    const proj = projectForInvoice(inv);
    return inv.folio.toLowerCase().includes(q) || (proj?.nombre.toLowerCase().includes(q));
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="concepto-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="concepto-card"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className="bg-light-ivory dark:bg-[#051A14] w-full max-w-2xl rounded-lg shadow-2xl border border-elevated-gold/30 overflow-hidden flex flex-col max-h-[95vh]"
          >
            <div className="px-6 py-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-enchanted-green dark:text-light-ivory">
                {isEditing ? 'Editar concepto' : 'Nuevo concepto'}
              </h3>
              <button type="button" onClick={onClose} className="text-enchanted-green/80 dark:text-light-ivory/80 hover:text-enchanted-green dark:hover:text-light-ivory p-1 rounded-full hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className={labelCls}>Concepto <span className="text-cranberry font-bold">*</span></label>
                <input type="text" required value={concepto} onChange={e => { setConcepto(e.target.value); setDbError(null); }} placeholder="Ej. Diseño editorial catálogo" className={inputCls} />
              </div>

              <div ref={dropdownRef} className="relative">
                <label className={labelCls}>Factura vinculada</label>
                <button
                  type="button"
                  onClick={() => setInvoiceOpen(!invoiceOpen)}
                  className={`${inputCls} flex items-center justify-between text-left`}
                >
                  {selectedInvoice ? (
                    <span className="truncate">
                      {selectedInvoice.folio} · {projectForInvoice(selectedInvoice)?.nombre ?? '—'} · {formatCurrency(selectedInvoice.total)}
                    </span>
                  ) : (
                    <span className="text-rocky-gray/80">Sin factura vinculada</span>
                  )}
                  <ChevronDown size={16} className={`shrink-0 ml-2 text-rocky-gray transition-transform ${invoiceOpen ? 'rotate-180' : ''}`} />
                </button>

                {invoiceOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-white dark:bg-[#070D0C] border border-enchanted-green/30 dark:border-light-ivory/20 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden">
                    <div className="flex items-center px-3 py-2 border-b border-enchanted-green/10 dark:border-light-ivory/10">
                      <Search size={14} className="text-rocky-gray shrink-0 mr-2" />
                      <input
                        type="text" autoFocus value={invoiceSearch}
                        onChange={e => setInvoiceSearch(e.target.value)}
                        placeholder="Buscar por folio o proyecto…"
                        className="flex-1 bg-transparent text-sm text-enchanted-green dark:text-light-ivory placeholder-rocky-gray/60 outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      <button type="button" onClick={() => { setFacturaId(null); setInvoiceOpen(false); setInvoiceSearch(''); setDbError(null); }}
                        className="w-full text-left px-3.5 py-2.5 text-sm text-rocky-gray hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors italic">
                        Sin factura vinculada
                      </button>
                      {filteredInvoices.map(inv => {
                        const proj = projectForInvoice(inv);
                        return (
                          <button key={inv.id} type="button"
                            onClick={() => { setFacturaId(inv.id); setInvoiceOpen(false); setInvoiceSearch(''); setDbError(null); }}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors ${facturaId === inv.id ? 'bg-elevated-gold/10' : ''}`}>
                            <div className="flex items-center gap-2 text-sm text-enchanted-green dark:text-light-ivory">
                              <span className="font-semibold">{inv.folio}</span>
                              <span className="text-rocky-gray">·</span>
                              <span className="truncate">{proj?.nombre ?? '—'}</span>
                              <span className="text-rocky-gray">·</span>
                              <span className="font-mono text-xs">{formatCurrency(inv.total)}</span>
                              <span className={`ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${inv.estado === 'pagada' ? 'bg-enchanted-green/10 text-enchanted-green dark:bg-enchanted-green/20 dark:text-emerald-300' : 'bg-elevated-gold/15 text-elevated-gold'}`}>
                                {inv.estado}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {filteredInvoices.length === 0 && (
                        <p className="px-3.5 py-4 text-xs text-rocky-gray text-center">Sin resultados</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Proyecto</label>
                {selectedInvoice ? (
                  <div className={`${inputCls} bg-enchanted-green/5 dark:bg-white/5 cursor-not-allowed opacity-75`}>
                    {projectForInvoice(selectedInvoice)?.nombre ?? '—'}
                    <span className="ml-2 text-[10px] text-rocky-gray">(vía factura)</span>
                  </div>
                ) : (
                  <select value={proyectoId ?? ''} onChange={e => { setProyectoId(e.target.value || null); setDbError(null); }} className={inputCls}>
                    <option value="">Sin proyecto</option>
                    {projects.filter(p => !p.cerrado || p.id === initialData?.proyectoId).map(p => <option key={p.id} value={p.id}>[{p.codigo}] {p.nombre}</option>)}
                  </select>
                )}
              </div>

              <div className="pt-3 border-t border-enchanted-green/10 dark:border-white/10 space-y-4">
                <p className="text-xs uppercase font-bold tracking-wider text-elevated-gold">Desglose financiero</p>

                <div>
                  <label className={labelCls}>Saldo original <span className="text-cranberry font-bold">*</span></label>
                  <input type="text" required value={saldoOriginal} onChange={e => handleSaldoChange(e.target.value)} placeholder="$0.00" className={`${inputCls} font-mono`} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Monto a depositar</label>
                    <input type="text" value={montoADepositar} onChange={e => handleCurrencyField(setMontoADepositar)(e.target.value)} placeholder="$0.00" className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Comisión {intermediarioNombre || 'intermediario'}</label>
                    <input type="text" value={comisionIntermediario} onChange={e => handleCurrencyField(setComisionIntermediario)(e.target.value)} placeholder="$0.00" className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Ganancia IX</label>
                    <input type="text" value={gananciaIxAdicional} onChange={e => handleCurrencyField(setGananciaIxAdicional)(e.target.value)} placeholder="$0.00" className={`${inputCls} font-mono`} />
                  </div>
                </div>

                <button type="button" onClick={() => recalcular(saldoOriginal)}
                  className="inline-flex items-center gap-1.5 text-xs text-elevated-gold hover:text-elevated-gold/80 font-semibold transition-colors">
                  <RefreshCw size={12} /> Recalcular desde saldo original
                </button>

                {showSumWarning && (
                  <div className="p-3 border border-elevated-gold/30 bg-elevated-gold/5 rounded-lg text-xs text-elevated-gold leading-relaxed">
                    La suma de las partes ({formatCurrency(sumaParts)}) no coincide con el saldo original ({formatCurrency(nSaldo)}).
                    Diferencia: {formatCurrency(diffParts)}.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-enchanted-green/10 dark:border-white/10">
                <div>
                  <label className={labelCls}>Status Fac</label>
                  {selectedInvoice ? (
                    <div className="flex items-center gap-2">
                      <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded ${statusFac === 'Disponible' ? 'bg-enchanted-green/10 text-enchanted-green dark:bg-enchanted-green/20 dark:text-[#f2e9df]' : 'bg-elevated-gold/15 text-elevated-gold dark:text-amber-200'}`}>
                        {statusFac}
                      </span>
                      <span className="text-[10px] text-rocky-gray">Automático según la factura</span>
                    </div>
                  ) : (
                    <select value={statusFac} onChange={e => { setStatusFac(e.target.value as 'Disponible' | 'Por pagar'); setDbError(null); }} className={inputCls}>
                      <option value="Disponible">Disponible</option>
                      <option value="Por pagar">Por pagar</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Fecha</label>
                  <input type="date" value={fecha} onChange={e => { setFecha(e.target.value); setDbError(null); }}
                    className={`${inputCls} dark:[color-scheme:dark]`} />
                </div>
              </div>

              {showNegativeWarning && (
                <div className="p-3 border border-cranberry/25 bg-cranberry/5 rounded-lg text-xs text-cranberry leading-relaxed">
                  Al guardar, el saldo restante del tercero quedaría en <strong>{formatCurrency(nuevoRestante)}</strong> (negativo). Esto significa que se ha depositado más de lo disponible.
                </div>
              )}

              {dbError && (
                <div className="p-3 border border-cranberry/25 bg-cranberry/5 rounded-lg text-xs text-cranberry font-medium">
                  {dbError}
                </div>
              )}

              <div className="pt-5 border-t border-rocky-gray/20 dark:border-white/10 flex justify-end space-x-3">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 bg-transparent text-sm font-medium text-enchanted-green dark:text-light-ivory border border-enchanted-green/20 dark:border-light-ivory/20 hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !concepto.trim() || nSaldo <= 0}
                  className="px-5 py-2 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green font-semibold text-sm hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 rounded shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
