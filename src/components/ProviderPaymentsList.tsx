/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProviderPayment, Project } from '../types';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Filter, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Layers, 
  RefreshCcw 
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface ProviderPaymentsListProps {
  payments: ProviderPayment[];
  projects: Project[];
  onAddClick: () => void;
  onEditClick: (payment: ProviderPayment) => void;
  onDeleteClick: (id: string) => void;
}

/**
 * ProviderPaymentsList is a clean, responsive component implementing
 * supplier/contractor expenses and payments.
 * Includes status filter, search by provider name, and live statistics with fiscal breakdown.
 */
export default function ProviderPaymentsList({
  payments,
  projects,
  onAddClick,
  onEditClick,
  onDeleteClick
}: ProviderPaymentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEstatus, setFilterEstatus] = useState('all');

  const getProjectDisplay = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto desconocido';
  };

  // KPI Computations using "total" instead of "monto"
  const totalPagado = payments
    .filter(p => p.estatus === 'Pagado')
    .reduce((sum, p) => sum + p.total, 0);

  const totalPendiente = payments
    .filter(p => p.estatus === 'Pendiente')
    .reduce((sum, p) => sum + p.total, 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterProject('all');
    setFilterEstatus('all');
  };

  const filteredPayments = payments.filter(pay => {
    const matchesSearch = pay.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterProject !== 'all' && pay.proyectoId !== filterProject) {
      return false;
    }

    if (filterEstatus !== 'all' && pay.estatus !== filterEstatus) {
      return false;
    }

    return true;
  });

  return (
    <div id="provider-payments-container" className="space-y-6 animate-fade-in">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Pagos a Proveedores
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Gestión y seguimiento de desembolsos contratados para proveedores de eventos y logística de proyectos.
          </p>
        </div>
        <button
          id="btn-add-provider-payment"
          onClick={onAddClick}
          className="inline-flex items-center justify-center space-x-2 bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-white dark:text-enchanted-green font-semibold text-sm px-4 py-2.5 rounded shadow transition-all duration-200"
        >
          <Plus size={16} />
          <span>Nuevo Pago a Proveedor</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Pagado */}
        <div id="kpi-pp-total-pagado" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-rocky-gray">Total Pagado a Proveedores</p>
            <p className="text-2xl font-mono font-bold text-[#0B3D2E] dark:text-elevated-gold">
              {formatCurrency(totalPagado)}
            </p>
            <p className="text-[10px] text-rocky-gray">Egresos liquidados exitosamente</p>
          </div>
          <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-full text-[#0B3D2E] dark:text-elevated-gold">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Total Pendiente */}
        <div id="kpi-pp-total-pendiente" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-cranberry/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-cranberry">Total Pendiente de Pago</p>
            <p className="text-2xl font-mono font-bold text-cranberry">
              {formatCurrency(totalPendiente)}
            </p>
            <p className="text-[10px] text-rocky-gray">Pagos comprometidos por liquidar</p>
          </div>
          <div className="p-3 bg-rose-linen/25 dark:bg-rose-linen/10 rounded-full text-cranberry">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 space-y-4">
        <div className="flex items-center justify-between border-b border-enchanted-green/5 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-enchanted-green dark:text-light-ivory uppercase tracking-wider">
            <Filter size={14} className="text-[#8C7853] dark:text-elevated-gold" />
            <span>Filtros de Búsqueda</span>
          </div>
          {(searchTerm || filterProject !== 'all' || filterEstatus !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-cranberry dark:text-rose-linen uppercase hover:underline"
            >
              <RefreshCcw size={10} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Provider Name Search */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-rocky-gray">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            >
              <option value="all">Todos los proyectos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>[{p.codigo}] {p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={filterEstatus}
              onChange={(e) => setFilterEstatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            >
              <option value="all">Todos los estatus</option>
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid or Table */}
      <div id="provider-payments-table-wrapper" className="bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center text-rocky-gray mb-3.5">
              <Wallet size={22} />
            </div>
            <h3 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory">Sin pagos a proveedores</h3>
            <p className="text-xs text-rocky-gray mt-1 max-w-md">
              {payments.length === 0 
                ? 'No se han registrado pagos a proveedores todavía.'
                : 'Ningún pago a proveedor coincide con los filtros aplicados en este momento.'}
            </p>
            {payments.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-4 px-3.5 py-1.5 border border-[#8C7853] dark:border-elevated-gold/40 hover:bg-[#8C7853]/10 text-[#8C7853] dark:text-elevated-gold text-xs font-bold rounded transition-all"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-black/10">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Proveedor</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Proyecto Vinculado</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Monto (Fiscal)</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Fecha</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Factura</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Estatus</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enchanted-green/5 dark:divide-light-ivory/5">
                {filteredPayments.map((pay) => (
                  <tr 
                    key={pay.id} 
                    className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-all text-xs"
                  >
                    <td className="px-6 py-4 font-semibold text-enchanted-green dark:text-light-ivory">
                      {pay.proveedor}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-rocky-gray dark:text-rose-linen/70 font-mono">
                        <Layers size={12} className="text-[#8C7853]" />
                        <span>{getProjectDisplay(pay.proyectoId)}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-[#0B3D2E] dark:text-[#E8DCC4] text-sm">
                          {formatCurrency(pay.total)}
                        </span>
                        <span className="text-[10px] text-rocky-gray font-mono mt-0.5">
                          Sub: {formatCurrency(pay.subtotal)} | IVA: {formatCurrency(pay.iva)}
                          {(pay.isrRetenido > 0 || pay.ivaRetenido > 0) && (
                            <> | Ret: -{formatCurrency((pay.isrRetenido || 0) + (pay.ivaRetenido || 0))}</>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-rocky-gray">
                      {pay.fecha}
                    </td>

                    <td className="px-6 py-4">
                      {pay.tieneFactura ? (
                        <span className="bg-[#0B3D2E]/10 dark:bg-[#8C7853]/15 text-[#0B3D2E] dark:text-elevated-gold px-2 py-0.5 rounded text-[10px] font-bold">
                          SÍ
                        </span>
                      ) : (
                        <span className="bg-rocky-gray/10 dark:bg-white/5 text-rocky-gray px-2 py-0.5 rounded text-[10px] font-bold">
                          NO
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {pay.estatus === 'Pagado' ? (
                        <span className="bg-[#0B3D2E]/10 dark:bg-[#8C7853]/20 text-[#0B3D2E] dark:text-elevated-gold px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
                          Pagado
                        </span>
                      ) : (
                        <span className="bg-rose-linen/40 dark:bg-rose-linen/15 text-cranberry dark:text-rose-linen px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
                          Pendiente
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit */}
                        <button
                          title="Editar pago"
                          onClick={() => onEditClick(pay)}
                          className="p-1.5 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          title="Eliminar pago"
                          onClick={() => onDeleteClick(pay.id)}
                          className="p-1.5 text-rocky-gray hover:text-cranberry hover:bg-rose-linen/20 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
