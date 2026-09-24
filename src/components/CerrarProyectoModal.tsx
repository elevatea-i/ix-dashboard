import React, { useState, useEffect, useMemo } from 'react';
import { X, Lock, AlertTriangle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Project, Invoice } from '../types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils';

interface CerrarProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  invoices: Invoice[];
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface ResumenCierre {
  gananciaTotal: number;
  yaRepartido: number;
  pendientePorRepartir: number;
}

interface FilaDistribucion {
  destino: string;
  porcentaje: string;
}

type Step = 'resumen' | 'distribucion' | 'confirmacion';

export default function CerrarProyectoModal({
  isOpen,
  onClose,
  project,
  invoices,
  onSuccess,
  showToast,
}: CerrarProyectoModalProps) {
  const [step, setStep] = useState<Step>('resumen');
  const [resumen, setResumen] = useState<ResumenCierre | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [filas, setFilas] = useState<FilaDistribucion[]>([
    { destino: 'San', porcentaje: '65' },
    { destino: 'Ale', porcentaje: '30' },
    { destino: 'Diploma', porcentaje: '5' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('resumen');
      setResumen(null);
      setErrorMsg(null);
      setSubmitting(false);
      setFilas([
        { destino: 'San', porcentaje: '65' },
        { destino: 'Ale', porcentaje: '30' },
        { destino: 'Diploma', porcentaje: '5' },
      ]);
      return;
    }
    loadResumen();
  }, [isOpen, project.id]);

  const loadResumen = async () => {
    setLoadingResumen(true);
    setErrorMsg(null);
    const { data, error } = await supabase.rpc('calcular_resumen_cierre', {
      p_proyecto_id: project.id,
    });
    if (error) {
      setErrorMsg(error.message);
      setLoadingResumen(false);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setResumen({
        gananciaTotal: Number(row.ganancia_total),
        yaRepartido: Number(row.ya_repartido),
        pendientePorRepartir: Number(row.pendiente_por_repartir),
      });
    }
    setLoadingResumen(false);
  };

  const sumaPorcentajes = useMemo(() => {
    return filas.reduce((sum, f) => sum + (parseFloat(f.porcentaje) || 0), 0);
  }, [filas]);

  const sumaValida = sumaPorcentajes >= 99.99 && sumaPorcentajes <= 100.01;

  const montosPrevio = useMemo(() => {
    if (!resumen || resumen.pendientePorRepartir <= 0) return [];
    return filas.map((f) => {
      const pct = parseFloat(f.porcentaje) || 0;
      return Math.round(resumen.pendientePorRepartir * pct) / 100;
    });
  }, [filas, resumen]);

  const hayFacturasSinCobrar = useMemo(() => {
    return invoices.some(
      (inv) => inv.proyectoId === project.id && inv.estado !== 'pagada'
    );
  }, [invoices, project.id]);

  const handleUpdateFila = (idx: number, field: 'destino' | 'porcentaje', value: string) => {
    setFilas((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f))
    );
    setErrorMsg(null);
  };

  const handleConfirmarCierre = async () => {
    if (!resumen) return;
    setSubmitting(true);
    setErrorMsg(null);

    const distribucion =
      resumen.pendientePorRepartir > 0
        ? filas.map((f) => ({
            destino: f.destino.trim(),
            porcentaje: parseFloat(f.porcentaje) || 0,
          }))
        : [];

    const { error } = await supabase.rpc('cerrar_proyecto', {
      p_proyecto_id: project.id,
      p_distribucion: distribucion,
    });

    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    showToast('Proyecto cerrado exitosamente');
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const tienePendiente = resumen && resumen.pendientePorRepartir > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0E1A16] border border-enchanted-green/20 dark:border-light-ivory/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-cranberry" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-enchanted-green/10 dark:border-light-ivory/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cranberry/10 rounded-lg">
              <Lock size={18} className="text-cranberry" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-enchanted-green dark:text-light-ivory">
                Cerrar Proyecto
              </h3>
              <p className="text-xs text-rocky-gray font-mono">{project.codigo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rocky-gray hover:text-cranberry rounded-full hover:bg-cranberry/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Loading */}
          {loadingResumen && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-enchanted-green dark:text-light-ivory text-sm">
                Calculando resumen de cierre...
              </div>
            </div>
          )}

          {/* Error state */}
          {!loadingResumen && errorMsg && step === 'resumen' && (
            <div className="p-3 bg-cranberry/10 border border-cranberry/20 rounded-lg text-xs text-cranberry font-medium">
              {errorMsg}
            </div>
          )}

          {/* STEP: resumen */}
          {!loadingResumen && resumen && step === 'resumen' && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-enchanted-green/5 dark:bg-white/5 rounded-lg p-3 border border-enchanted-green/10 dark:border-light-ivory/10">
                  <p className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold">
                    Ganancia total
                  </p>
                  <p className="text-lg font-mono font-bold text-enchanted-green dark:text-light-ivory mt-1">
                    {formatCurrency(resumen.gananciaTotal)}
                  </p>
                </div>
                <div className="bg-enchanted-green/5 dark:bg-white/5 rounded-lg p-3 border border-enchanted-green/10 dark:border-light-ivory/10">
                  <p className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold">
                    Ya repartido
                  </p>
                  <p className="text-lg font-mono font-bold text-enchanted-green dark:text-light-ivory mt-1">
                    {formatCurrency(resumen.yaRepartido)}
                  </p>
                </div>
                <div className={`rounded-lg p-3 border ${
                  resumen.pendientePorRepartir > 0
                    ? 'bg-elevated-gold/10 border-elevated-gold/30'
                    : 'bg-cranberry/10 border-cranberry/20'
                }`}>
                  <p className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold">
                    Pendiente
                  </p>
                  <p className={`text-lg font-mono font-bold mt-1 ${
                    resumen.pendientePorRepartir > 0
                      ? 'text-enchanted-green dark:text-light-ivory'
                      : 'text-cranberry'
                  }`}>
                    {formatCurrency(resumen.pendientePorRepartir)}
                  </p>
                </div>
              </div>

              {/* No-distribution branch */}
              {!tienePendiente && (
                <div className="p-4 bg-cranberry/10 border border-cranberry/20 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-cranberry mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-cranberry font-medium leading-relaxed">
                      {resumen.pendientePorRepartir === 0
                        ? 'Este proyecto no tiene ganancia pendiente por repartir. Todo fue distribuido en repartos anteriores.'
                        : 'Este proyecto tiene ganancia negativa o ya se repartio de mas en repartos anteriores. No hay monto pendiente por distribuir.'}
                    </div>
                  </div>
                  <p className="text-[11px] text-cranberry/80">
                    Puedes cerrar el proyecto sin generar un nuevo reparto.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory border border-rocky-gray/30 dark:border-light-ivory/20 rounded hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                {tienePendiente ? (
                  <button
                    onClick={() => setStep('distribucion')}
                    disabled={hayFacturasSinCobrar}
                    title={hayFacturasSinCobrar ? 'No se puede cerrar: hay facturas sin cobrar.' : ''}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green rounded shadow hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Configurar reparto
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('confirmacion')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-cranberry text-white rounded shadow hover:bg-cranberry/90 transition-colors"
                  >
                    Cerrar sin repartir
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP: distribucion */}
          {step === 'distribucion' && resumen && tienePendiente && (
            <>
              <div className="text-xs text-rocky-gray mb-1">
                <span className="font-bold text-enchanted-green dark:text-light-ivory">
                  Pendiente por repartir:
                </span>{' '}
                <span className="font-mono font-bold">
                  {formatCurrency(resumen.pendientePorRepartir)}
                </span>
              </div>

              <div className="space-y-3">
                {filas.map((fila, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-enchanted-green/[0.03] dark:bg-white/[0.03] p-3 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold block mb-1">
                        Destino
                      </label>
                      <input
                        type="text"
                        value={fila.destino}
                        onChange={(e) => handleUpdateFila(idx, 'destino', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#070D0C] border border-enchanted-green/30 dark:border-light-ivory/20 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold block mb-1">
                        %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={fila.porcentaje}
                        onChange={(e) => handleUpdateFila(idx, 'porcentaje', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#070D0C] border border-enchanted-green/30 dark:border-light-ivory/20 rounded text-sm font-mono text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors text-right"
                      />
                    </div>
                    <div className="w-28 text-right">
                      <label className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold block mb-1">
                        Estimado
                      </label>
                      <p className="text-sm font-mono font-bold text-enchanted-green dark:text-light-ivory py-1.5">
                        {formatCurrency(montosPrevio[idx] ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sum indicator */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold ${
                sumaValida
                  ? 'bg-enchanted-green/10 text-enchanted-green dark:text-light-ivory'
                  : 'bg-cranberry/10 text-cranberry'
              }`}>
                <span>Suma de porcentajes:</span>
                <span className="font-mono">
                  {sumaPorcentajes.toFixed(2)}%
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-cranberry/10 border border-cranberry/20 rounded-lg text-xs text-cranberry font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => { setStep('resumen'); setErrorMsg(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory border border-rocky-gray/30 dark:border-light-ivory/20 rounded hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver
                </button>
                <button
                  onClick={() => { setStep('confirmacion'); setErrorMsg(null); }}
                  disabled={!sumaValida || filas.some((f) => !f.destino.trim())}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green rounded shadow hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Revisar y confirmar
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* STEP: confirmacion */}
          {step === 'confirmacion' && resumen && (
            <>
              <div className="bg-enchanted-green/5 dark:bg-white/5 rounded-lg p-4 border border-enchanted-green/10 dark:border-light-ivory/10 space-y-3">
                <h4 className="text-xs font-bold text-enchanted-green dark:text-light-ivory uppercase tracking-wider">
                  Resumen final
                </h4>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-rocky-gray">Ganancia total:</span>
                  <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">
                    {formatCurrency(resumen.gananciaTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-rocky-gray">Ya repartido antes:</span>
                  <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">
                    {formatCurrency(resumen.yaRepartido)}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1 border-t border-rocky-gray/10 pt-2">
                  <span className="text-rocky-gray font-bold">Pendiente por repartir:</span>
                  <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">
                    {formatCurrency(resumen.pendientePorRepartir)}
                  </span>
                </div>

                {tienePendiente && (
                  <div className="space-y-1.5 pt-2 border-t border-rocky-gray/10">
                    <p className="text-[10px] text-rocky-gray uppercase tracking-wider font-bold">
                      Distribucion
                    </p>
                    {filas.map((f, i) => (
                      <div key={i} className="flex justify-between text-xs py-0.5">
                        <span className="text-enchanted-green dark:text-light-ivory font-medium">
                          {f.destino}
                        </span>
                        <span className="font-mono text-rocky-gray">
                          {f.porcentaje}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-cranberry/10 border border-cranberry/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-cranberry mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-cranberry font-medium leading-relaxed">
                    Esta accion no se puede deshacer. El proyecto quedara cerrado permanentemente.
                    No se podran agregar, editar ni eliminar facturas, gastos, pagos a proveedores
                    ni pagos a terceros de este proyecto.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-cranberry/10 border border-cranberry/20 rounded-lg text-xs text-cranberry font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(tienePendiente ? 'distribucion' : 'resumen');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory border border-rocky-gray/30 dark:border-light-ivory/20 rounded hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver
                </button>
                <button
                  onClick={handleConfirmarCierre}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-cranberry text-white rounded shadow hover:bg-cranberry/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="animate-pulse">Cerrando proyecto...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      Confirmar cierre
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
