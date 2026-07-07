/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, Project, ExpenseCategory } from '../types';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Filter, 
  Coins, 
  TrendingDown, 
  Clock, 
  Tag, 
  Layers, 
  ArrowUpRight, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface GastosListProps {
  expenses: Expense[];
  projects: Project[];
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

/**
 * GastosList is the primary operational dashboard for managing business expenses.
 * It features dynamic KPIs, advanced multi-dimensional filters, and a clear tabular layout.
 */
export default function GastosList({
  expenses,
  projects,
  onAddClick,
  onEditClick,
  onDeleteClick
}: GastosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOrigen, setFilterOrigen] = useState<string>('all');
  const [filterProyecto, setFilterProyecto] = useState<string>('all');
  const [filterEstatus, setFilterEstatus] = useState<string>('all');

  // Helper to obtain project code and name by ID
  const getProjectDisplay = (projId: string | null) => {
    if (!projId) return null;
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto desconocido';
  };

  // KPIs
  const totalGastos = expenses.reduce((sum, exp) => sum + exp.total, 0);
  const totalPagado = expenses.filter(exp => exp.estatusPago === 'Pagado').reduce((sum, exp) => sum + exp.total, 0);
  const totalPendiente = totalGastos - totalPagado;

  // Reset Filters helper
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterOrigen('all');
    setFilterProyecto('all');
    setFilterEstatus('all');
  };

  // Filtered expenses list
  const filteredExpenses = expenses.filter(exp => {
    // 1. Search term match (concepts or category names)
    const matchesSearch = 
      exp.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.categoriaId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Filter Category
    if (filterCategory !== 'all' && exp.categoriaId !== filterCategory) {
      return false;
    }

    // 3. Filter Origen Cuenta
    if (filterOrigen !== 'all' && exp.cuentaOrigen !== filterOrigen) {
      return false;
    }

    // 4. Filter Proyecto
    if (filterProyecto !== 'all') {
      if (filterProyecto === 'operativo') {
        if (exp.tipo !== 'Operativo') return false;
      } else {
        if (exp.proyectoId !== filterProyecto) return false;
      }
    }

    // 5. Filter Estatus de Pago
    if (filterEstatus !== 'all' && exp.estatusPago !== filterEstatus) {
      return false;
    }

    return true;
  });

  return (
    <div id="gastos-module-container" className="space-y-6 animate-fade-in">
      
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Control de Gastos y Egresos
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Gestión de costes operativos, pagos a proveedores por proyecto y control de cuentas de egresos.
          </p>
        </div>
        <button
          id="btn-add-expense"
          onClick={onAddClick}
          className="inline-flex items-center justify-center space-x-2 bg-enchanted-green dark:bg-elevated-gold hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-white dark:text-enchanted-green font-semibold text-sm px-4 py-2.5 rounded shadow transition-all duration-200"
        >
          <Plus size={16} />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Egresos */}
        <div id="kpi-total-gastos" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-rocky-gray">Total Acumulado</p>
            <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
              {formatCurrency(totalGastos)}
            </p>
            <p className="text-[10px] text-rocky-gray">Suma absoluta de egresos capturados</p>
          </div>
          <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-full text-enchanted-green dark:text-elevated-gold">
            <Coins size={22} />
          </div>
        </div>

        {/* Egresos Liquidados */}
        <div id="kpi-gastos-pagado" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-[#0B3D2E] dark:text-elevated-gold">Egresos Liquidados</p>
            <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
              {formatCurrency(totalPagado)}
            </p>
            <p className="text-[10px] text-[#0B3D2E]/70 dark:text-light-ivory/70 font-medium">Cargos debitados exitosamente</p>
          </div>
          <div className="p-3 bg-[#0B3D2E]/5 dark:bg-[#8C7853]/15 rounded-full text-[#0B3D2E] dark:text-elevated-gold">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Egresos Pendientes */}
        <div id="kpi-gastos-pendiente" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-cranberry/10 dark:border-light-ivory/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-bold text-cranberry">Pendientes de Pago</p>
            <p className="text-2xl font-mono font-bold text-cranberry">
              {formatCurrency(totalPendiente)}
            </p>
            <p className="text-[10px] text-rocky-gray">Egresos pendientes de fondear o pagar</p>
          </div>
          <div className="p-3 bg-rose-linen/25 dark:bg-rose-linen/10 rounded-full text-cranberry">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 space-y-4">
        <div className="flex items-center justify-between border-b border-enchanted-green/5 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-enchanted-green dark:text-light-ivory uppercase tracking-wider">
            <Filter size={14} className="text-[#8C7853] dark:text-elevated-gold" />
            <span>Filtros de Búsqueda</span>
          </div>
          {(searchTerm || filterCategory !== 'all' || filterOrigen !== 'all' || filterProyecto !== 'all' || filterEstatus !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-cranberry dark:text-rose-linen uppercase hover:underline"
            >
              <RefreshCcw size={10} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Term */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-rocky-gray">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Account Source Filter */}
          <div>
            <select
              value={filterOrigen}
              onChange={(e) => setFilterOrigen(e.target.value)}
              className="w-full px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            >
              <option value="all">Todas las cuentas origen</option>
              <option value="San">San</option>
              <option value="Ale">Ale</option>
              <option value="Empresa">Empresa</option>
            </select>
          </div>

          {/* Project Link Filter */}
          <div>
            <select
              value={filterProyecto}
              onChange={(e) => setFilterProyecto(e.target.value)}
              className="w-full px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold transition-colors"
            >
              <option value="all">Todos los proyectos / Operativo</option>
              <option value="operativo">Solo Gastos Operativos</option>
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

      {/* Main Expenses Table */}
      <div id="gastos-table-wrapper" className="bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center text-rocky-gray mb-3.5">
              <Coins size={22} />
            </div>
            <h3 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory">Sin gastos registrados</h3>
            <p className="text-xs text-rocky-gray mt-1 max-w-md">
              {expenses.length === 0 
                ? 'El catálogo de gastos está vacío. Comience registrando egresos operativos o pagos a proveedores.'
                : 'Ningún gasto coincide con los filtros aplicados en este momento.'}
            </p>
            {expenses.length > 0 && (
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
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Concepto</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Categoría</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Clasificación</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Origen</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Total</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Fecha</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Pago</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-rocky-gray text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enchanted-green/5 dark:divide-light-ivory/5">
                {filteredExpenses.map((exp) => (
                  <tr 
                    key={exp.id} 
                    className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-all text-xs"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                        <span>{exp.concepto}</span>
                        {exp.esReembolsable && (
                          <span className="bg-elevated-gold/15 text-[#8C7853] dark:text-[#DFBDB5] text-[9px] px-1 py-0.2 rounded font-bold" title="Este gasto es reembolsable">
                            REEMBOLSABLE
                          </span>
                        )}
                      </div>
                      {exp.tieneFactura && (
                        <span className="text-[10px] text-rocky-gray font-semibold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0B3D2E]"></span>
                          <span>Factura XML/PDF vinculada</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-rocky-gray dark:text-rose-linen/70">
                        <Tag size={12} className="text-[#8C7853]" />
                        <span>{exp.categoriaId}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {exp.tipo === 'Operativo' ? (
                        <span className="bg-rocky-gray/10 text-rocky-gray dark:bg-white/5 dark:text-rose-linen/70 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
                          Operativo
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="bg-enchanted-green/10 text-enchanted-green dark:bg-white/10 dark:text-light-ivory px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
                            Proveedor por Proyecto
                          </span>
                          <span className="block text-[10px] font-medium font-mono text-rocky-gray">
                            {getProjectDisplay(exp.proyectoId)}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-enchanted-green dark:text-light-ivory">
                      {exp.cuentaOrigen}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(exp.total)}
                      </span>
                      {(exp.isrRetenido > 0 || exp.ivaRetenido > 0) && (
                        <span className="block text-[9px] text-rocky-gray" title="Incluye retenciones aplicadas">
                          Con retenciones
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-rocky-gray">
                      {exp.fecha}
                    </td>

                    <td className="px-6 py-4">
                      {exp.estatusPago === 'Pagado' ? (
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
                          title="Editar gasto"
                          onClick={() => onEditClick(exp)}
                          className="p-1.5 text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          title="Eliminar gasto"
                          onClick={() => onDeleteClick(exp.id)}
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
