/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice, Project } from '../types';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Filter, 
  Receipt,
  FileCheck2,
  CalendarCheck2
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface FacturasListProps {
  invoices: Invoice[];
  projects: Project[];
  onAddClick: () => void;
  onEditClick: (invoice: Invoice) => void;
  onDeleteClick: (id: string) => void;
  onMarkAsPaidClick: (invoice: Invoice) => void;
}

export default function FacturasList({
  invoices,
  projects,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onMarkAsPaidClick
}: FacturasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPpdNoComplement, setFilterPpdNoComplement] = useState(false);

  // Obtain project object by ID
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.nombre : 'Proyecto desconocido';
  };

  // KPI Calculations
  const totalFacturado = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPagado = invoices.filter(inv => inv.estado === 'pagada').reduce((sum, inv) => sum + inv.total, 0);
  const totalPendiente = totalFacturado - totalPagado;

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    // Search match: folio or project name
    const projectName = getProjectName(inv.proyectoId).toLowerCase();
    const matchesSearch = 
      inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) || 
      projectName.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filter "PPD sin complemento"
    if (filterPpdNoComplement) {
      return inv.metodoPago === 'PPD' && !inv.complementoEmitido;
    }

    return true;
  });

  return (
    <div id="facturas-module-container" className="space-y-6 animate-fade-in">
      
      {/* Module Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Facturación y CFDIs
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Gestión modular de comprobantes fiscales, retenciones, cobranza y conciliación de cobros.
          </p>
        </div>
        <button
          id="btn-add-invoice"
          onClick={onAddClick}
          className="inline-flex items-center justify-center space-x-2 bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-white dark:text-enchanted-green font-semibold text-sm px-4 py-2.5 rounded shadow transition-all duration-200"
        >
          <Plus size={16} />
          <span>Registrar Factura</span>
        </button>
      </div>

      {/* KPI Cards (Cuentas por Cobrar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Facturado */}
        <div id="kpi-total-facturado" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-rocky-gray">Total Facturado</p>
            <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
              {formatCurrency(totalFacturado)}
            </p>
            <p className="text-[10px] text-rocky-gray">Suma de todos los CFDIs emitidos</p>
          </div>
          <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-full text-enchanted-green dark:text-elevated-gold">
            <Receipt size={22} />
          </div>
        </div>

        {/* Total Pagado */}
        <div id="kpi-total-pagado" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-[#0B3D2E] dark:text-elevated-gold">Total Pagado / Cobrado</p>
            <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
              {formatCurrency(totalPagado)}
            </p>
            <p className="text-[10px] text-[#0B3D2E]/70 dark:text-light-ivory/70 font-medium">Conciliación bancaria exitosa</p>
          </div>
          <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-full text-enchanted-green dark:text-elevated-gold">
            <CalendarCheck2 size={22} />
          </div>
        </div>

        {/* Por Cobrar / Pendiente */}
        <div id="kpi-total-pendiente" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-cranberry/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-cranberry">Pendiente de Cobro</p>
            <p className="text-2xl font-mono font-bold text-cranberry">
              {formatCurrency(totalPendiente)}
            </p>
            <p className="text-[10px] text-rocky-gray">Cartera de cuentas por cobrar activa</p>
          </div>
          <div className="p-3 bg-rose-linen/25 dark:bg-rose-linen/10 rounded-full text-cranberry">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-2.5 text-rocky-gray">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por folio o proyecto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-sm text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="filter-ppd-no-comp-btn"
            onClick={() => setFilterPpdNoComplement(prev => !prev)}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded text-xs font-semibold border transition-all duration-200 ${
              filterPpdNoComplement
                ? 'bg-cranberry text-white border-cranberry shadow-sm'
                : 'bg-transparent text-enchanted-green dark:text-light-ivory border-enchanted-green/20 dark:border-light-ivory/20 hover:bg-enchanted-green/5 dark:hover:bg-white/5'
            }`}
          >
            <Filter size={14} />
            <span>PPD sin complemento</span>
            {filterPpdNoComplement && (
              <span className="ml-1 bg-white text-cranberry px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {invoices.filter(inv => inv.metodoPago === 'PPD' && !inv.complementoEmitido).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Invoices List Table */}
      {filteredInvoices.length === 0 ? (
        <div id="empty-invoices-state" className="bg-white dark:bg-[#051A14]/20 border border-dashed border-enchanted-green/15 dark:border-light-ivory/10 rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="inline-flex p-4 rounded-full bg-enchanted-green/5 dark:bg-white/5 text-enchanted-green/60 dark:text-light-ivory/60">
              <Receipt size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-semibold text-enchanted-green dark:text-light-ivory">
                {searchTerm || filterPpdNoComplement ? 'Sin facturas encontradas' : 'No hay facturas registradas'}
              </h3>
              <p className="text-xs text-rocky-gray max-w-sm mx-auto">
                {searchTerm || filterPpdNoComplement 
                  ? 'Intente modificar los criterios de búsqueda o desactivar el filtro de PPD.' 
                  : 'Aquí se concentrarán los comprobantes fiscales y el control de cuentas por cobrar. Registre su primera factura vinculándola a un proyecto.'}
              </p>
            </div>
            {!searchTerm && !filterPpdNoComplement && (
              <button
                onClick={onAddClick}
                className="inline-flex items-center space-x-2 text-xs font-semibold bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green px-4 py-2 rounded shadow hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-colors"
              >
                <Plus size={14} />
                <span>Registrar Primer CFDI</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#051A14]/30 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-white/[0.02]">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Folio CFDI</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Proyecto</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-right">Monto Total</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-center">Método</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-center">Estado</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Emisión</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Fecha Pago</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.estado === 'pagada';
                  return (
                    <tr key={inv.id} className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      {/* Folio */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-enchanted-green dark:text-light-ivory">
                          {inv.folio}
                        </span>
                      </td>

                      {/* Proyecto */}
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-enchanted-green dark:text-light-ivory max-w-[200px] truncate">
                          {getProjectName(inv.proyectoId)}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="font-mono text-sm font-bold text-enchanted-green dark:text-light-ivory">
                          {formatCurrency(inv.total)}
                        </div>
                        <div className="text-[10px] text-rocky-gray">
                          Subtotal: {formatCurrency(inv.subtotal)}
                        </div>
                      </td>

                      {/* Método de Pago */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-enchanted-green/5 dark:bg-white/5 text-enchanted-green dark:text-light-ivory">
                            {inv.metodoPago}
                          </span>
                          {inv.metodoPago === 'PPD' && (
                            <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded ${
                              inv.complementoEmitido 
                                ? 'bg-enchanted-green/10 text-enchanted-green dark:text-light-ivory' 
                                : 'bg-rose-linen/30 text-cranberry font-semibold'
                            }`}>
                              {inv.complementoEmitido ? 'Con Compl.' : 'Sin Compl.'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center space-x-1 bg-[#0B3D2E]/10 dark:bg-[#8C7853]/20 text-[#0B3D2E] dark:text-elevated-gold px-2.5 py-1 rounded-full text-xs font-bold tracking-tight uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0B3D2E] dark:bg-elevated-gold animate-pulse"></span>
                            <span>Pagada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-rose-linen/40 dark:bg-rose-linen/10 text-cranberry dark:text-rose-linen px-2.5 py-1 rounded-full text-xs font-bold tracking-tight uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-cranberry"></span>
                            <span>Facturada</span>
                          </span>
                        )}
                      </td>

                      {/* Emisión */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-enchanted-green dark:text-light-ivory font-mono">
                        {inv.fechaEmision}
                      </td>

                      {/* Fecha de Pago */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono">
                        {inv.fechaPago ? (
                          <span className="text-[#0B3D2E] dark:text-elevated-gold font-semibold">{inv.fechaPago}</span>
                        ) : (
                          <span className="text-rocky-gray italic">Pendiente</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Mark as paid */}
                          {!isPaid && (
                            <button
                              title="Marcar como pagada"
                              onClick={() => onMarkAsPaidClick(inv)}
                              className="p-1.5 text-enchanted-green dark:text-light-ivory hover:text-[#0B3D2E] dark:hover:text-elevated-gold hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all font-bold"
                            >
                              <DollarSign size={15} />
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            title="Editar factura"
                            onClick={() => onEditClick(inv)}
                            className="p-1.5 text-enchanted-green/70 dark:text-light-ivory/70 hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all"
                          >
                            <Edit3 size={15} />
                          </button>
                          {/* Delete */}
                          <button
                            title="Eliminar factura"
                            onClick={() => onDeleteClick(inv.id)}
                            className="p-1.5 text-cranberry hover:text-cranberry/85 hover:bg-cranberry/5 rounded transition-all"
                          >
                            <Trash2 size={15} />
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
  );
}
