import React, { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, UserPlus, AlertTriangle, Banknote } from 'lucide-react';
import { Tercero, DepositoTercero, SaldoTercero, ThirdPartyPayment, Invoice, Project } from '../types';
import { formatCurrency } from '../utils';

/* ───────────────────── helpers ───────────────────── */

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/* ───────────────────── types ─────────────────────── */

interface PagosTercerosModuleProps {
  terceros: Tercero[];
  terceroActivo: string | null;
  onTerceroChange: (id: string) => void;
  saldos: SaldoTercero[];
  conceptos: ThirdPartyPayment[];
  depositos: DepositoTercero[];
  invoices: Invoice[];
  projects: Project[];
  loading: boolean;
  onAddConcepto: () => void;
  onEditConcepto: (c: ThirdPartyPayment) => void;
  onDeleteConcepto: (c: ThirdPartyPayment) => void;
  onAddDeposito: () => void;
  onEditDeposito: (d: DepositoTercero) => void;
  onDeleteDeposito: (d: DepositoTercero) => void;
  onAddTercero: () => void;
}

/* ═══════════════════ COMPONENT ═══════════════════ */

export default function PagosTercerosModule({
  terceros,
  terceroActivo,
  onTerceroChange,
  saldos,
  conceptos,
  depositos,
  invoices,
  projects,
  loading,
  onAddConcepto,
  onEditConcepto,
  onDeleteConcepto,
  onAddDeposito,
  onEditDeposito,
  onDeleteDeposito,
  onAddTercero,
}: PagosTercerosModuleProps) {
  /* ── local state ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Disponible' | 'Por pagar'>('Todos');

  /* ── derived data ── */
  const terceroObj = terceros.find((t) => t.id === terceroActivo) ?? null;
  const saldo: SaldoTercero | null = saldos.find((s) => s.terceroId === terceroActivo) ?? null;
  const intermediario = terceroObj?.intermediario ?? null;

  const filteredConceptos = useMemo(() => {
    let list = [...conceptos];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((c) => c.concepto.toLowerCase().includes(q));
    }
    if (filterStatus !== 'Todos') {
      list = list.filter((c) => c.statusFac === filterStatus);
    }
    list.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
    return list;
  }, [conceptos, searchTerm, filterStatus]);

  const sortedDepositos = useMemo(
    () => [...depositos].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [depositos],
  );

  /* look-ups */
  const invoiceMap = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const porCobrar =
    saldo != null ? saldo.totalMontoADepositar - saldo.totalMontoDisponible : 0;

  /* ───────────────────── render helpers ───────────────────── */

  const conceptoSubline = (c: ThirdPartyPayment) => {
    if (c.facturaId) {
      const inv = invoiceMap.get(c.facturaId);
      const proj = c.proyectoId ? projectMap.get(c.proyectoId) : null;
      return (
        <span className="text-[11px] text-rocky-gray leading-tight">
          {inv ? `Factura: ${inv.folio}` : 'Factura vinculada'}
          {proj ? ` · ${proj.nombre}` : ''}
        </span>
      );
    }
    if (c.esHistorico) return <span className="text-[11px] text-rocky-gray">Histórico</span>;
    if (c.proyectoId) {
      const proj = projectMap.get(c.proyectoId);
      return <span className="text-[11px] text-rocky-gray">{proj ? proj.nombre : 'Proyecto desconocido'}</span>;
    }
    return <span className="text-[11px] text-rocky-gray">Sin proyecto</span>;
  };

  /* ───────────────── LOADING skeleton ─────────────── */

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-enchanted-green/10 dark:bg-white/10 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-enchanted-green/5 dark:bg-white/5 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-enchanted-green/5 dark:bg-white/5 rounded-lg" />
      </div>
    );
  }

  /* ═══════════════════ JSX ═══════════════════════ */

  return (
    <div id="pagos-terceros-module" className="space-y-6 animate-fade-in">

      {/* ──────── A) Header ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Pagos a Terceros
          </h2>

          {/* Tercero selector */}
          {terceros.length <= 1 && terceroObj ? (
            <p className="text-sm text-rocky-gray mt-1">
              {terceroObj.nombre}
              {intermediario && <> · <span className="italic">Intermediaria: {intermediario}</span></>}
            </p>
          ) : (
            <select
              value={terceroActivo ?? ''}
              onChange={(e) => onTerceroChange(e.target.value)}
              className="mt-1 px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors font-medium"
            >
              {terceros.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.intermediario ? ` · Intermediaria: ${t.intermediario}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={onAddTercero}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-xs text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
        >
          <UserPlus size={14} />
          Agregar tercero
        </button>
      </div>

      {/* ──────── B) Totals strip ──────── */}
      {saldo && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Metric cards */}
            {([
              ['Saldo original', saldo.totalSaldoOriginal],
              [`Comisión${intermediario ? ` ${intermediario}` : ''}`, saldo.totalComision],
              ['Ganancia IX', saldo.totalGanancia],
              ['Monto a depositar', saldo.totalMontoADepositar],
              ['Pagos', saldo.totalDepositado],
            ] as [string, number][]).map(([label, value]) => (
              <div
                key={label}
                className="bg-white/60 dark:bg-[#0E1A16]/60 backdrop-blur-md border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-3 flex flex-col gap-1"
              >
                <span className="text-[11px] text-rocky-gray uppercase tracking-wider">{label}</span>
                <span className="text-base font-semibold tabular-nums text-enchanted-green dark:text-light-ivory">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}

            {/* Restante – prominent */}
            <div
              className={`bg-white/60 dark:bg-[#0E1A16]/60 backdrop-blur-md border rounded-lg p-3 flex flex-col gap-1 ${
                saldo.restante >= 0
                  ? 'border-enchanted-green/30 dark:border-enchanted-green/20'
                  : 'border-cranberry/30 dark:border-cranberry/20'
              }`}
            >
              <span className="text-[11px] text-rocky-gray uppercase tracking-wider">Restante</span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  saldo.restante >= 0
                    ? 'text-enchanted-green dark:text-enchanted-green'
                    : 'text-cranberry'
                }`}
              >
                {formatCurrency(saldo.restante)}
              </span>
            </div>
          </div>

          {/* Por cobrar note */}
          {porCobrar > 0 && (
            <p className="text-[11px] text-rocky-gray pl-1">
              En conceptos por cobrar al cliente: <span className="font-medium">{formatCurrency(porCobrar)}</span>
            </p>
          )}
        </div>
      )}

      {/* ──────── C) Negative-balance warning ──────── */}
      {saldo && saldo.restante < 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-cranberry/10 border border-cranberry/20 rounded-lg text-xs text-cranberry font-medium">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Lo depositado supera lo disponible por{' '}
            <span className="font-bold">{formatCurrency(Math.abs(saldo.restante))}</span>.
            Revisa si alguna factura se revirtió o si un concepto cambió a Por pagar.
          </span>
        </div>
      )}

      {/* ──────── D) Two tables ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">

        {/* ─── D1) Conceptos ─── */}
        <div className="bg-white/60 dark:bg-[#0E1A16]/60 backdrop-blur-md border border-enchanted-green/10 dark:border-light-ivory/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rocky-gray" />
              <input
                type="text"
                placeholder="Buscar concepto…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory placeholder:text-rocky-gray/60 focus:outline-none focus:border-elevated-gold transition-colors"
              />
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors font-medium"
            >
              <option value="Todos">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Por pagar">Por pagar</option>
            </select>

            {/* Add button */}
            <button
              onClick={onAddConcepto}
              className="flex items-center gap-1.5 px-4 py-2 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green font-bold text-xs hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 rounded transition-colors shadow whitespace-nowrap"
            >
              <Plus size={14} />
              Nuevo concepto
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-white/[0.02]">
                  <th className="text-left px-4 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Proyecto</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Saldo original</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">
                    Comisión{intermediario ? ` ${intermediario}` : ''}
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Ganancia</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">A depositar</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Status Fac</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredConceptos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-rocky-gray">
                      <Banknote size={28} className="mx-auto mb-2 opacity-30" />
                      {conceptos.length === 0
                        ? 'No hay conceptos registrados para este tercero.'
                        : 'Ningún concepto coincide con los filtros.'}
                    </td>
                  </tr>
                ) : (
                  filteredConceptos.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-enchanted-green/5 dark:border-light-ivory/5 hover:bg-enchanted-green/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Proyecto / concepto */}
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-enchanted-green dark:text-light-ivory leading-tight">
                            {c.concepto}
                          </span>
                          {conceptoSubline(c)}
                        </div>
                      </td>
                      {/* Saldo original */}
                      <td className="text-right px-3 py-2.5 tabular-nums text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(c.saldoOriginal)}
                      </td>
                      {/* Comisión */}
                      <td className="text-right px-3 py-2.5 tabular-nums text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(c.comisionIntermediario)}
                      </td>
                      {/* Ganancia */}
                      <td className="text-right px-3 py-2.5 tabular-nums text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(c.gananciaIxAdicional)}
                      </td>
                      {/* A depositar */}
                      <td className="text-right px-3 py-2.5 tabular-nums font-semibold text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(c.montoADepositar)}
                      </td>
                      {/* Status badge */}
                      <td className="text-center px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            c.statusFac === 'Disponible'
                              ? 'bg-enchanted-green/10 text-enchanted-green dark:bg-enchanted-green/20 dark:text-enchanted-green'
                              : 'bg-elevated-gold/15 text-elevated-gold dark:bg-elevated-gold/25 dark:text-elevated-gold'
                          }`}
                        >
                          {c.statusFac}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="text-center px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditConcepto(c)}
                            className="p-1.5 rounded hover:bg-enchanted-green/10 dark:hover:bg-white/10 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory transition-colors"
                            title="Editar concepto"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteConcepto(c)}
                            className="p-1.5 rounded hover:bg-cranberry/10 text-rocky-gray hover:text-cranberry transition-colors"
                            title="Eliminar concepto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── D2) Depósitos ─── */}
        <div className="bg-white/60 dark:bg-[#0E1A16]/60 backdrop-blur-md border border-enchanted-green/10 dark:border-light-ivory/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between gap-2">
            <h3 className="font-serif text-sm font-bold text-enchanted-green dark:text-light-ivory">Depósitos</h3>
            <button
              onClick={onAddDeposito}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green font-bold text-[11px] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 rounded transition-colors shadow whitespace-nowrap"
            >
              <Plus size={13} />
              Registrar depósito
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-white/[0.02]">
                  <th className="text-right px-4 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Pago</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Fecha</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-rocky-gray uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedDepositos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-rocky-gray">
                      <Banknote size={24} className="mx-auto mb-2 opacity-30" />
                      Sin depósitos registrados.
                    </td>
                  </tr>
                ) : (
                  sortedDepositos.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-enchanted-green/5 dark:border-light-ivory/5 hover:bg-enchanted-green/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Monto + nota */}
                      <td className="text-right px-4 py-2.5">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="tabular-nums font-semibold text-enchanted-green dark:text-light-ivory">
                            {formatCurrency(d.monto)}
                          </span>
                          {d.nota && (
                            <span className="text-[10px] text-rocky-gray italic leading-tight max-w-[140px] truncate" title={d.nota}>
                              {d.nota}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Fecha */}
                      <td className="text-left px-3 py-2.5 tabular-nums text-enchanted-green dark:text-light-ivory">
                        {formatDateDisplay(d.fecha)}
                      </td>
                      {/* Actions */}
                      <td className="text-center px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditDeposito(d)}
                            className="p-1.5 rounded hover:bg-enchanted-green/10 dark:hover:bg-white/10 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory transition-colors"
                            title="Editar depósito"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteDeposito(d)}
                            className="p-1.5 rounded hover:bg-cranberry/10 text-rocky-gray hover:text-cranberry transition-colors"
                            title="Eliminar depósito"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
