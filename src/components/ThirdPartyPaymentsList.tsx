/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThirdPartyPayment, Project } from '../types';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  Layers, 
  RefreshCcw, 
  Scale, 
  BadgePercent, 
  Coins,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface ThirdPartyPaymentsListProps {
  payments: ThirdPartyPayment[];
  projects: Project[];
  onAddClick: () => void;
  onEditClick: (payment: ThirdPartyPayment) => void;
  onDeleteClick: (id: string) => void;
  onMarkAsPaidClick: (id: string) => void;
}

/**
 * ThirdPartyPaymentsList handles Yazu/Xiomara custom intermediary disbursements.
 * Includes search on concept, status filters, and interactive KPI cards for cumulative financial splits.
 */
export default function ThirdPartyPaymentsList({
  payments,
  projects,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onMarkAsPaidClick
}: ThirdPartyPaymentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEstatus, setFilterEstatus] = useState('all');

  const getProjectDisplay = (projId: string | null) => {
    if (!projId) return 'Sin proyecto asociado';
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto desconocido';
  };

  // KPIs
  const totalOriginal = payments.reduce((sum, p) => sum + p.saldoOriginal, 0);
  const totalComision = payments.reduce((sum, p) => sum + p.comisionIntermediario, 0);
  const totalGanancia = payments.reduce((sum, p) => sum + p.gananciaIxAdicional, 0);
  
  // Update KPI card to sum only the records whose estatus_pago = "Pendiente"
  const totalNetoPendiente = payments
    .filter(p => p.estatusPago === 'Pendiente')
    .reduce((sum, p) => sum + p.montoADepositar, 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterProject('all');
    setFilterEstatus('all');
  };

  const filteredPayments = payments.filter(pay => {
    const matchesSearch = pay.concepto.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterProject !== 'all') {
      if (filterProject === 'ninguno') {
        if (pay.proyectoId !== null) return false;
      } else {
        if (pay.proyectoId !== filterProject) return false;
      }
    }

    if (filterEstatus !== 'all' && pay.estatusPago !== filterEstatus) {
      return false;
    }

    return true;
  });

  return (
    <div id="third-party-payments-container" className="space-y-6 animate-fade-in">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Pagos a Terceros (Yazu / Xiomara)
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Módulo de liquidación automatizada para intermediaciones y distribución de ingresos (7.2727% Comisión, 1.8182% Ganancia IX).
          </p>
        </div>
        <button
          id="btn-add-third-party"
          onClick={onAddClick}
          className="inline-flex items-center justify-center space-x-2 bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-white dark:text-enchanted-green font-semibold text-sm px-4 py-2.5 rounded shadow transition-all duration-200"
        >
          <Plus size={16} />
          <span>Nueva Distribución</span>
        </button>
      </div>

      {/* Grid of KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo de Entrada */}
        <div className="bg-white dark:bg-[#051A14]/60 p-4 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Saldo de Entrada</p>
            <p className="text-lg font-mono font-bold text-enchanted-green dark:text-light-ivory">
              {formatCurrency(totalOriginal)}
            </p>
            <p className="text-[9px] text-rocky-gray">Suma de saldos originales</p>
          </div>
          <div className="p-2 bg-enchanted-green/5 rounded-full text-enchanted-green dark:text-elevated-gold">
            <Coins size={18} />
          </div>
        </div>

        {/* Total Comision Intermediario */}
        <div className="bg-white dark:bg-[#051A14]/60 p-4 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#8C7853] dark:text-elevated-gold">Comisión Intermediario</p>
            <p className="text-lg font-mono font-bold text-[#8C7853] dark:text-elevated-gold">
              {formatCurrency(totalComision)}
            </p>
            <p className="text-[9px] text-rocky-gray">Comisión retenida (7.2727%)</p>
          </div>
          <div className="p-2 bg-[#8C7853]/10 rounded-full text-[#8C7853] dark:text-elevated-gold">
            <BadgePercent size={18} />
          </div>
        </div>

        {/* Total Ganancia IX */}
        <div className="bg-white dark:bg-[#051A14]/60 p-4 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#0B3D2E] dark:text-elevated-gold">Ganancia IX Adicional</p>
            <p className="text-lg font-mono font-bold text-[#0B3D2E] dark:text-light-ivory">
              {formatCurrency(totalGanancia)}
            </p>
            <p className="text-[9px] text-[#0B3D2E]/80 dark:text-[#DFBDB5]/80 font-semibold">Margen IX acumulado (1.8182%)</p>
          </div>
          <div className="p-2 bg-[#0B3D2E]/10 rounded-full text-[#0B3D2E] dark:text-[#DFBDB5]">
            <Scale size={18} />
          </div>
        </div>

        {/* Total Neto a Depositar (Solo registros Pendientes) */}
        <div className="bg-white dark:bg-[#051A14]/60 p-4 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-cranberry dark:text-rose-linen">Pendiente por Depositar</p>
            <p className="text-lg font-mono font-bold text-cranberry dark:text-rose-linen">
              {formatCurrency(totalNetoPendiente)}
            </p>
            <p className="text-[9px] text-rocky-gray">Por transferir a destinatario</p>
          </div>
          <div className="p-2 bg-rose-linen/30 dark:bg-rose-linen/15 rounded-full text-cranberry dark:text-rose-linen">
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* Search Filters */}
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
          {/* Concept search */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-rocky-gray">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por concepto..."
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
              <option value="all">Todos los proyectos / Operativos</option>
              <option value="ninguno">Solo sin proyecto asociado</option>
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

      {/* Table grid wrapper */}
      <div id="third-party-payments-table-wrapper" className="bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center text-rocky-gray mb-3.5">
              <Scale size={22} />
            </div>
            <h3 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory">Sin distribuciones registradas</h3>
            <p className="text-xs text-rocky-gray mt-1 max-w-md">
              {payments.length === 0 
                ? 'No se han registrado transferencias a terceros (Yazu/Xiomara) todavía.'
                : 'Ningún registro de terceros coincide con los filtros aplicados en este momento.'}
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
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-black/10">
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Concepto</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Proyecto</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Saldo Entrada</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Comisión (7.27%)</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Ganancia IX (1.81%)</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Neto Depositar</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Fecha</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px]">Estatus</th>
                  <th className="px-5 py-4 uppercase tracking-wider font-bold text-rocky-gray text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enchanted-green/5 dark:divide-light-ivory/5">
                {filteredPayments.map((pay) => (
                  <tr 
                    key={pay.id} 
                    className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-all"
                  >
                    <td className="px-5 py-4 font-semibold text-enchanted-green dark:text-light-ivory">
                      {pay.concepto}
                    </td>

                    <td className="px-5 py-4">
                      {pay.proyectoId ? (
                        <span className="inline-flex items-center gap-1.5 text-rocky-gray dark:text-rose-linen/70 font-mono">
                          <Layers size={11} className="text-[#8C7853]" />
                          <span>{getProjectDisplay(pay.proyectoId)}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-rocky-gray italic font-medium">Operativo (Libre)</span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-rocky-gray">
                      {formatCurrency(pay.saldoOriginal)}
                    </td>

                    <td className="px-5 py-4 font-mono text-[#8C7853] font-medium">
                      {formatCurrency(pay.comisionIntermediario)}
                    </td>

                    <td className="px-5 py-4 font-mono text-[#0B3D2E] dark:text-[#DFBDB5] font-medium">
                      {formatCurrency(pay.gananciaIxAdicional)}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-enchanted-green dark:text-light-ivory">
                      {formatCurrency(pay.montoADepositar)}
                    </td>

                    <td className="px-5 py-4 font-mono text-rocky-gray">
                      {pay.fecha}
                    </td>

                    <td className="px-5 py-4">
                      {pay.estatusPago === 'Pagado' ? (
                        <span className="bg-[#0B3D2E]/10 dark:bg-[#8C7853]/20 text-[#0B3D2E] dark:text-elevated-gold px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
                          Pagado
                        </span>
                      ) : (
                        <span className="bg-rose-linen/40 dark:bg-rose-linen/15 text-cranberry dark:text-rose-linen px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
                          Pendiente
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Quick Pay */}
                        {pay.estatusPago === 'Pendiente' && (
                          <button
                            title="Marcar como pagado"
                            onClick={() => onMarkAsPaidClick(pay.id)}
                            className="p-1.5 text-enchanted-green dark:text-light-ivory hover:text-[#0B3D2E] dark:hover:text-elevated-gold hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all font-bold"
                          >
                            <DollarSign size={14} />
                          </button>
                        )}
                        {/* Edit */}
                        <button
                          title="Editar distribución"
                          onClick={() => onEditClick(pay)}
                          className="p-1.5 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          title="Eliminar registro"
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
