import React, { useState, useMemo } from 'react';
import { Invoice, Project, Client } from '../types';
import { Plus, Search, PencilLine, Trash2, Check, X } from 'lucide-react';
import { formatCurrency, formatShortDate } from '../utils';
import PageHeader from './ui/PageHeader';
import StatCard from './ui/StatCard';
import StatusPill from './ui/StatusPill';
import { StatCardsSkeleton, TableSkeleton } from './ui/Skeleton';

interface FacturasListProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (invoice: Invoice) => void;
  onDeleteClick: (id: string) => void;
  onMarkAsPaidClick: (invoice: Invoice) => void;
}

const numeroFolio = (folio: string) => parseInt(folio.replace(/\D/g, ''), 10) || 0;

export default function FacturasList({
  invoices,
  projects,
  clients,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onMarkAsPaidClick
}: FacturasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPpdNoComplement, setFilterPpdNoComplement] = useState(false);
  const [filterClienteId, setFilterClienteId] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<'todas' | 'facturada' | 'pagada'>('todas');

  // Obtain project object by ID
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.nombre : 'Proyecto desconocido';
  };

  // Obtain client ID for an invoice via its project
  const getClienteIdForInvoice = (inv: Invoice): string | null => {
    const proj = projects.find(p => p.id === inv.proyectoId);
    return proj ? proj.clienteId : null;
  };

  // KPI Calculations (based on all invoices, not filtered)
  const totalFacturado = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPagado = invoices.filter(inv => inv.estado === 'pagada').reduce((sum, inv) => sum + inv.total, 0);
  const totalPendiente = totalFacturado - totalPagado;

  // Sort invoices by folio number descending (IX100 above IX99, etc.)
  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => numeroFolio(b.folio) - numeroFolio(a.folio)),
    [invoices]
  );

  // Filtered invoices — all filters combined
  const filteredInvoices = useMemo(() => {
    return sortedInvoices.filter(inv => {
      // Search match: folio or project name
      const projectName = getProjectName(inv.proyectoId).toLowerCase();
      const matchesSearch =
        inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectName.includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Client filter
      if (filterClienteId !== 'todos') {
        const invClienteId = getClienteIdForInvoice(inv);
        if (invClienteId !== filterClienteId) return false;
      }

      // Status filter
      if (filterEstado !== 'todas') {
        if (inv.estado !== filterEstado) return false;
      }

      // PPD sin complemento filter
      if (filterPpdNoComplement) {
        if (!(inv.metodoPago === 'PPD' && !inv.complementoEmitido)) return false;
      }

      return true;
    });
  }, [sortedInvoices, searchTerm, filterClienteId, filterEstado, filterPpdNoComplement, projects]);

  // Count for PPD badge — respects other active filters
  const ppdCount = useMemo(
    () =>
      sortedInvoices.filter(inv => {
        const projectName = getProjectName(inv.proyectoId).toLowerCase();
        const matchesSearch =
          inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          projectName.includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filterClienteId !== 'todos' && getClienteIdForInvoice(inv) !== filterClienteId) return false;
        if (filterEstado !== 'todas' && inv.estado !== filterEstado) return false;
        return inv.metodoPago === 'PPD' && !inv.complementoEmitido;
      }).length,
    [sortedInvoices, searchTerm, filterClienteId, filterEstado]
  );

  const hasActiveFilters = searchTerm || filterPpdNoComplement || filterClienteId !== 'todos' || filterEstado !== 'todas';

  const pendingCount = invoices.filter(inv => inv.estado !== 'pagada').length;
  const cobradoPct = totalFacturado > 0 ? Math.round((totalPagado / totalFacturado) * 100) : 0;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPpdNoComplement(false);
    setFilterClienteId('todos');
    setFilterEstado('todas');
  };

  const selectClass =
    'h-10 pl-3 pr-8 rounded-lg bg-transparent border border-enchanted-green/[0.12] dark:border-white/10 text-[13px] font-medium text-enchanted-green dark:text-light-ivory hover:border-enchanted-green/25 dark:hover:border-white/20 focus:outline-none focus:border-elevated-gold transition-colors cursor-pointer dark:[&>option]:bg-paper-dark';

  const actionButton =
    'h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-mute dark:text-light-ivory/50 transition-colors';

  return (
    <div id="facturas-module-container" className="space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Cuentas por cobrar"
        title="Facturación"
        description="Comprobantes fiscales emitidos, cobranza y complementos de pago."
        action={
          <button
            id="btn-add-invoice"
            onClick={onAddClick}
            className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-enchanted-green dark:bg-light-ivory text-light-ivory dark:text-enchanted-green text-[14px] font-medium shadow-[0_1px_2px_rgba(11,61,46,0.2)] hover:bg-green-500 dark:hover:bg-white transition-colors"
          >
            <Plus size={16} strokeWidth={1.75} />
            Registrar factura
          </button>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <StatCardsSkeleton />
          <TableSkeleton />
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr] gap-4">
        <div className="md:col-span-2 lg:col-span-1">
          <StatCard
            id="kpi-total-pendiente"
            featured
            label="Pendiente de cobro"
            value={formatCurrency(totalPendiente)}
            context={
              pendingCount === 0
                ? 'Toda la cartera está cobrada'
                : `${pendingCount} ${pendingCount === 1 ? 'factura por cobrar' : 'facturas por cobrar'}`
            }
          />
        </div>
        <StatCard
          id="kpi-total-facturado"
          label="Total facturado"
          value={formatCurrency(totalFacturado)}
          context={`${invoices.length} ${invoices.length === 1 ? 'CFDI emitido' : 'CFDIs emitidos'}`}
        />
        <StatCard
          id="kpi-total-pagado"
          label="Cobrado"
          value={formatCurrency(totalPagado)}
          tone="positive"
          context={
            <div className="space-y-2">
              <span>{cobradoPct}% de lo facturado</span>
              <div className="h-[3px] w-full rounded-full bg-enchanted-green/[0.08] dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-elevated-gold transition-[width] duration-700 ease-out"
                  style={{ width: `${cobradoPct}%` }}
                />
              </div>
            </div>
          }
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 lg:max-w-sm">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute dark:text-light-ivory/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por folio o proyecto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-paper dark:bg-paper-dark border border-enchanted-green/[0.12] dark:border-white/10 text-[14px] text-enchanted-green dark:text-light-ivory placeholder:text-ink-mute dark:placeholder:text-light-ivory/35 focus:outline-none focus:border-elevated-gold transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              id="filter-cliente"
              value={filterClienteId}
              onChange={(e) => setFilterClienteId(e.target.value)}
              className={selectClass}
            >
              <option value="todos">Todos los clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            <select
              id="filter-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as 'todas' | 'facturada' | 'pagada')}
              className={selectClass}
            >
              <option value="todas">Todos los estados</option>
              <option value="facturada">Por cobrar</option>
              <option value="pagada">Pagadas</option>
            </select>

            <button
              id="filter-ppd-no-comp-btn"
              onClick={() => setFilterPpdNoComplement(prev => !prev)}
              aria-pressed={filterPpdNoComplement}
              className={`h-10 inline-flex items-center gap-2 px-3.5 rounded-lg border text-[13px] font-medium transition-colors ${
                filterPpdNoComplement
                  ? 'border-cranberry/40 bg-cranberry-100 text-cranberry dark:bg-cranberry/15 dark:border-cranberry-300/40 dark:text-cranberry-300'
                  : 'border-enchanted-green/[0.12] dark:border-white/10 text-enchanted-green dark:text-light-ivory hover:border-enchanted-green/25 dark:hover:border-white/20'
              }`}
            >
              PPD sin complemento
              <span className={`num min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold ${
                filterPpdNoComplement
                  ? 'bg-cranberry text-white dark:bg-cranberry-300 dark:text-[#051A14]'
                  : 'bg-enchanted-green/[0.07] text-ink-soft dark:bg-white/[0.08] dark:text-light-ivory/70'
              }`}>
                {ppdCount}
              </span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-10 inline-flex items-center gap-1.5 px-2.5 text-[13px] text-ink-mute dark:text-light-ivory/50 hover:text-enchanted-green dark:hover:text-light-ivory transition-colors"
              >
                <X size={14} strokeWidth={1.5} />
                Limpiar
              </button>
            )}
          </div>

          <p className="lg:ml-auto text-[13px] text-ink-mute dark:text-light-ivory/45 num">
            {filteredInvoices.length} de {invoices.length}
          </p>
        </div>

        {filteredInvoices.length === 0 ? (
          <div id="empty-invoices-state" className="rounded-xl ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] bg-paper dark:bg-paper-dark px-6 py-20 text-center">
            <div className="max-w-sm mx-auto">
              <span aria-hidden className="block mx-auto h-px w-10 bg-elevated-gold mb-6" />
              <h3 className="font-serif text-[26px] font-medium text-enchanted-green dark:text-light-ivory">
                {hasActiveFilters ? 'Sin resultados' : 'Aún no hay facturas'}
              </h3>
              <p className="text-[14px] text-ink-soft dark:text-light-ivory/55 mt-2">
                {hasActiveFilters
                  ? 'Ninguna factura coincide con la búsqueda o los filtros seleccionados.'
                  : 'Registra el primer comprobante y vincúlalo a un proyecto para comenzar el control de cobranza.'}
              </p>
              <button
                onClick={hasActiveFilters ? clearFilters : onAddClick}
                className="mt-6 h-10 inline-flex items-center gap-2 px-4 rounded-lg border border-enchanted-green/20 dark:border-white/15 text-[14px] font-medium text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/[0.04] dark:hover:bg-white/[0.05] transition-colors"
              >
                {hasActiveFilters ? 'Limpiar filtros' : (<><Plus size={15} strokeWidth={1.75} /> Registrar factura</>)}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-paper dark:bg-paper-dark ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead>
                  <tr className="border-b border-enchanted-green/[0.08] dark:border-white/[0.07]">
                    <th className="eyebrow px-6 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Folio</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Proyecto</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45 text-right">Total</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Método</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Estado</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Emisión</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Pago</th>
                    <th className="px-6 py-4"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const isPaid = inv.estado === 'pagada';
                    const sinComplemento = inv.metodoPago === 'PPD' && !inv.complementoEmitido;
                    return (
                      <tr
                        key={inv.id}
                        className="group border-b last:border-b-0 border-enchanted-green/[0.05] dark:border-white/[0.04] hover:bg-enchanted-green/[0.025] dark:hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="num text-[14px] font-semibold text-enchanted-green dark:text-light-ivory">{inv.folio}</p>
                          <p className={`text-[12px] mt-0.5 ${inv.facturado_por === 'Juan Carlos' ? 'text-elevated-gold dark:text-gold-300' : 'text-ink-mute dark:text-light-ivory/45'}`}>
                            {inv.facturado_por || 'IX'}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-[14px] text-enchanted-green dark:text-light-ivory max-w-[240px] truncate" title={getProjectName(inv.proyectoId)}>
                            {getProjectName(inv.proyectoId)}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <p className="num text-[14px] font-semibold text-enchanted-green dark:text-light-ivory">{formatCurrency(inv.total)}</p>
                          <p className="num text-[12px] text-ink-mute dark:text-light-ivory/45 mt-0.5">Subtotal {formatCurrency(inv.subtotal)}</p>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-medium text-enchanted-green dark:text-light-ivory tracking-wide">{inv.metodoPago}</p>
                          {inv.metodoPago === 'PPD' && (
                            <p className={`text-[12px] mt-0.5 ${sinComplemento ? 'text-cranberry dark:text-cranberry-300' : 'text-ink-mute dark:text-light-ivory/45'}`}>
                              {sinComplemento ? 'Sin complemento' : 'Con complemento'}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {isPaid
                            ? <StatusPill tone="positive">Pagada</StatusPill>
                            : <StatusPill tone="pending">Por cobrar</StatusPill>}
                        </td>

                        <td className="num px-4 py-4 whitespace-nowrap text-[13px] text-ink-soft dark:text-light-ivory/65">
                          {formatShortDate(inv.fechaEmision)}
                        </td>

                        <td className="num px-4 py-4 whitespace-nowrap text-[13px]">
                          {inv.fechaPago
                            ? <span className="text-ink-soft dark:text-light-ivory/65">{formatShortDate(inv.fechaPago)}</span>
                            : <span className="text-ink-mute/70 dark:text-light-ivory/30">—</span>}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity duration-200">
                            {!isPaid && (
                              <button
                                title="Marcar como pagada"
                                onClick={() => onMarkAsPaidClick(inv)}
                                className="h-8 inline-flex items-center gap-1.5 px-2.5 mr-1 rounded-md border border-enchanted-green/15 dark:border-white/12 text-[12px] font-medium text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green hover:text-light-ivory hover:border-enchanted-green dark:hover:bg-light-ivory dark:hover:text-enchanted-green transition-colors"
                              >
                                <Check size={13} strokeWidth={2} />
                                Cobrada
                              </button>
                            )}
                            <button
                              title="Editar factura"
                              onClick={() => onEditClick(inv)}
                              className={`${actionButton} hover:text-enchanted-green hover:bg-enchanted-green/[0.06] dark:hover:text-light-ivory dark:hover:bg-white/[0.06]`}
                            >
                              <PencilLine size={15} strokeWidth={1.5} />
                            </button>
                            <button
                              title="Eliminar factura"
                              onClick={() => onDeleteClick(inv.id)}
                              className={`${actionButton} hover:text-cranberry hover:bg-cranberry/[0.07] dark:hover:text-cranberry-300 dark:hover:bg-cranberry/15`}
                            >
                              <Trash2 size={15} strokeWidth={1.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
