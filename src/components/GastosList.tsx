import React, { useState, useMemo } from 'react';
import { Expense, Project, ExpenseCategory } from '../types';
import { Plus, Search, PencilLine, Trash2, Coins, Tag, RefreshCcw, X } from 'lucide-react';
import { formatCurrency, formatShortDate } from '../utils';
import PageHeader from './ui/PageHeader';
import StatCard from './ui/StatCard';
import StatusPill from './ui/StatusPill';
import { StatCardsSkeleton, TableSkeleton } from './ui/Skeleton';

interface GastosListProps {
  expenses: Expense[];
  projects: Project[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (id: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Pago a proveedores',
  'Pagos a terceros',
  'Transporte (gasolina, peajes, Uber)',
  'Viáticos',
  'Comidas internas',
  'Compras en línea (Amazon, Mercado Libre)',
  'Compras generales (tiendas físicas)',
  'Pago de comisiones',
  'Pago de impuestos',
  'Contadora y servicios profesionales',
  'Oficina y coworking',
  'Otros / sin clasificar'
];

export default function GastosList({
  expenses,
  projects,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick
}: GastosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOrigen, setFilterOrigen] = useState<string>('all');
  const [filterProyecto, setFilterProyecto] = useState<string>('all');
  const [filterEstatus, setFilterEstatus] = useState<string>('all');

  const getProjectDisplay = (projId: string | null) => {
    if (!projId) return null;
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto desconocido';
  };

  const totalGastos = expenses.reduce((sum, exp) => sum + exp.total, 0);
  const totalPagado = expenses.filter(exp => exp.estatusPago === 'Pagado').reduce((sum, exp) => sum + exp.total, 0);
  const totalPendiente = totalGastos - totalPagado;
  const pendienteCount = expenses.filter(exp => exp.estatusPago !== 'Pagado').length;
  const pagadoPct = totalGastos > 0 ? Math.round((totalPagado / totalGastos) * 100) : 0;

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterOrigen('all');
    setFilterProyecto('all');
    setFilterEstatus('all');
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch =
        exp.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.categoriaId.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (filterCategory !== 'all' && exp.categoriaId !== filterCategory) return false;
      if (filterOrigen !== 'all' && exp.cuentaOrigen !== filterOrigen) return false;
      if (filterProyecto !== 'all') {
        if (filterProyecto === 'operativo') {
          if (exp.tipo !== 'Operativo') return false;
        } else {
          if (exp.proyectoId !== filterProyecto) return false;
        }
      }
      if (filterEstatus !== 'all' && exp.estatusPago !== filterEstatus) return false;
      return true;
    });
  }, [expenses, searchTerm, filterCategory, filterOrigen, filterProyecto, filterEstatus]);

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || filterOrigen !== 'all' || filterProyecto !== 'all' || filterEstatus !== 'all';

  const selectClass =
    'h-10 pl-3 pr-8 rounded-lg bg-transparent border border-enchanted-green/[0.12] dark:border-white/10 text-[13px] font-medium text-enchanted-green dark:text-light-ivory hover:border-enchanted-green/25 dark:hover:border-white/20 focus:outline-none focus:border-elevated-gold transition-colors cursor-pointer dark:[&>option]:bg-paper-dark';

  const actionButton =
    'h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-mute dark:text-light-ivory/50 transition-colors';

  return (
    <div id="gastos-module-container" className="space-y-8 animate-fade-in">
      <PageHeader
        eyebrow="Cuentas por pagar"
        title="Gastos pagados"
        description="Costos operativos, pagos a proveedores por proyecto y control de cuentas de egresos."
        action={
          <button
            id="btn-add-expense"
            onClick={onAddClick}
            className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-enchanted-green dark:bg-light-ivory text-light-ivory dark:text-enchanted-green text-[14px] font-medium shadow-[0_1px_2px_rgba(11,61,46,0.2)] hover:bg-green-500 dark:hover:bg-white transition-colors"
          >
            <Plus size={16} strokeWidth={1.75} />
            Registrar gasto
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
            id="kpi-total-gastos"
            featured
            label="Total acumulado"
            value={formatCurrency(totalGastos)}
            context={`${expenses.length} ${expenses.length === 1 ? 'egreso registrado' : 'egresos registrados'}`}
          />
        </div>
        <StatCard
          id="kpi-gastos-pendiente"
          tone="alert"
          label="Pendientes de pago"
          value={formatCurrency(totalPendiente)}
          context={
            pendienteCount === 0
              ? 'Todos los egresos están pagados'
              : `${pendienteCount} ${pendienteCount === 1 ? 'egreso por pagar' : 'egresos por pagar'}`
          }
        />
        <StatCard
          id="kpi-gastos-pagado"
          label="Pagado"
          value={formatCurrency(totalPagado)}
          tone="positive"
          context={
            <div className="space-y-2">
              <span>{pagadoPct}% del total</span>
              <div className="h-[3px] w-full rounded-full bg-enchanted-green/[0.08] dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-elevated-gold transition-[width] duration-700 ease-out"
                  style={{ width: `${pagadoPct}%` }}
                />
              </div>
            </div>
          }
        />
      </div>

      <div className="space-y-4">
      <div className="rounded-xl bg-paper dark:bg-paper-dark ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="eyebrow text-ink-mute dark:text-light-ivory/45">Filtrar gastos</p>
            <p className="text-[13px] text-ink-soft dark:text-light-ivory/55 mt-1">
              Busca por concepto o combina los filtros para encontrar un egreso.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-ink-mute dark:text-light-ivory/45 num whitespace-nowrap">
              {filteredExpenses.length} de {expenses.length}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-mute dark:text-light-ivory/50 hover:text-enchanted-green dark:hover:text-light-ivory transition-colors whitespace-nowrap"
              >
                <X size={14} strokeWidth={1.5} />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search size={17} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute dark:text-light-ivory/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por concepto o categoría"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-3 rounded-lg bg-transparent border border-enchanted-green/[0.12] dark:border-white/10 text-[14px] text-enchanted-green dark:text-light-ivory placeholder:text-ink-mute dark:placeholder:text-light-ivory/35 focus:outline-none focus:border-elevated-gold transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(190px,1fr)_minmax(170px,0.8fr)_minmax(260px,1.35fr)_minmax(170px,0.8fr)] gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`${selectClass} w-full`}
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterOrigen}
            onChange={(e) => setFilterOrigen(e.target.value)}
            className={`${selectClass} w-full`}
          >
            <option value="all">Todas las cuentas</option>
            <option value="San">San</option>
            <option value="Ale">Ale</option>
            <option value="Empresa">Empresa</option>
            <option value="Juan Carlos">Juan Carlos</option>
          </select>

          <select
            value={filterProyecto}
            onChange={(e) => setFilterProyecto(e.target.value)}
            className={`${selectClass} w-full`}
          >
            <option value="all">Todos los proyectos</option>
            <option value="operativo">Solo operativos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>[{p.codigo}] {p.nombre}</option>
            ))}
          </select>

          <select
            value={filterEstatus}
            onChange={(e) => setFilterEstatus(e.target.value)}
            className={`${selectClass} w-full`}
          >
            <option value="all">Todos los estatus</option>
            <option value="Pagado">Pagados</option>
            <option value="Pendiente">Pendientes</option>
          </select>
        </div>
      </div>

        {filteredExpenses.length === 0 ? (
          <div id="empty-gastos-state" className="rounded-xl ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] bg-paper dark:bg-paper-dark px-6 py-20 text-center">
            <div className="max-w-sm mx-auto">
              <span aria-hidden className="block mx-auto h-px w-10 bg-elevated-gold mb-6" />
              <h3 className="font-serif text-[26px] font-medium text-enchanted-green dark:text-light-ivory">
                {hasActiveFilters ? 'Sin resultados' : 'Aún no hay gastos'}
              </h3>
              <p className="text-[14px] text-ink-soft dark:text-light-ivory/55 mt-2">
                {hasActiveFilters
                  ? 'Ningún gasto coincide con la búsqueda o los filtros seleccionados.'
                  : 'Registra el primer egreso operativo o pago a proveedor para comenzar el control de cuentas.'}
              </p>
              <button
                onClick={hasActiveFilters ? handleResetFilters : onAddClick}
                className="mt-6 h-10 inline-flex items-center gap-2 px-4 rounded-lg border border-enchanted-green/20 dark:border-white/15 text-[14px] font-medium text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/[0.04] dark:hover:bg-white/[0.05] transition-colors"
              >
                {hasActiveFilters ? 'Limpiar filtros' : (<><Plus size={15} strokeWidth={1.75} /> Registrar gasto</>)}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-paper dark:bg-paper-dark ring-1 ring-enchanted-green/[0.07] dark:ring-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-enchanted-green/[0.08] dark:border-white/[0.07]">
                    <th className="eyebrow px-6 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Concepto</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Categoría</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Clasificación</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Origen</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45 text-right">Total</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Fecha</th>
                    <th className="eyebrow px-4 py-4 font-semibold text-ink-mute dark:text-light-ivory/45">Estado</th>
                    <th className="px-6 py-4"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => {
                    const isPaid = exp.estatusPago === 'Pagado';
                    return (
                      <tr
                        key={exp.id}
                        className="group border-b last:border-b-0 border-enchanted-green/[0.05] dark:border-white/[0.04] hover:bg-enchanted-green/[0.025] dark:hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-[14px] font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            {exp.concepto}
                            {exp.esReembolsable && (
                              <span className="bg-elevated-gold/15 text-[#8C7853] dark:text-[#DFBDB5] text-[9px] px-1 py-0.2 rounded font-bold" title="Este gasto es reembolsable">
                                REEMBOLSABLE
                              </span>
                            )}
                          </p>
                          {exp.tieneFactura && (
                            <p className="text-[12px] text-ink-mute dark:text-light-ivory/45 mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-enchanted-green dark:bg-elevated-gold" />
                              Factura XML/PDF vinculada
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft dark:text-light-ivory/60">
                            <Tag size={12} className="text-elevated-gold" strokeWidth={1.5} />
                            {exp.categoriaId}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {exp.tipo === 'Operativo' ? (
                            <span className="text-[11px] font-semibold tracking-tight uppercase text-ink-mute dark:text-light-ivory/50">
                              Operativo
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-semibold tracking-tight uppercase text-enchanted-green dark:text-light-ivory">
                                Por proyecto
                              </p>
                              <p className="text-[11px] font-mono text-ink-mute dark:text-light-ivory/45">
                                {getProjectDisplay(exp.proyectoId)}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-[13px] font-medium text-enchanted-green dark:text-light-ivory">
                            {exp.cuentaOrigen}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <p className="num text-[14px] font-semibold text-enchanted-green dark:text-light-ivory">{formatCurrency(exp.total)}</p>
                          {(exp.isrRetenido > 0 || exp.ivaRetenido > 0) && (
                            <p className="num text-[12px] text-ink-mute dark:text-light-ivory/45 mt-0.5">Con retenciones</p>
                          )}
                        </td>

                        <td className="num px-4 py-4 whitespace-nowrap text-[13px] text-ink-soft dark:text-light-ivory/65">
                          {formatShortDate(exp.fecha)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {isPaid
                            ? <StatusPill tone="positive">PAGADO</StatusPill>
                            : <StatusPill tone="alert">PENDIENTE</StatusPill>}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Editar gasto"
                              onClick={() => onEditClick(exp)}
                              className={`${actionButton} hover:text-enchanted-green hover:bg-enchanted-green/[0.06] dark:hover:text-light-ivory dark:hover:bg-white/[0.06]`}
                            >
                              <PencilLine size={15} strokeWidth={1.5} />
                            </button>
                            <button
                              title="Eliminar gasto"
                              onClick={() => onDeleteClick(exp.id)}
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
