/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Zap, 
  Filter, 
  Briefcase, 
  CheckCircle2, 
  Hourglass, 
  Coins, 
  UserCircle 
} from 'lucide-react';
import { Project, PorImpactar } from '../types';
import { formatCurrency } from '../utils';

interface PorImpactarListProps {
  records: PorImpactar[];
  projects: Project[];
  onAddClick: () => void;
  onEditClick: (record: PorImpactar) => void;
  onDeleteClick: (id: string) => void;
  onResolveClick: (record: PorImpactar) => void;
}

/**
 * PorImpactarList renders the visual board and filters for the "Por Impactar" module.
 * Includes summary cards (KPIs) for pending vs resolved amounts and a scannable table.
 */
export default function PorImpactarList({
  records,
  projects,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onResolveClick
}: PorImpactarListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'resuelto'>('all');
  const [socioFilter, setSocioFilter] = useState<'all' | 'San' | 'Ale' | 'Empresa'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all'); // project ID or 'all' or 'none' (for Sin Proyecto)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // KPI Calculations
  const totalPending = records
    .filter(r => r.estatus === 'pendiente')
    .reduce((sum, r) => sum + r.monto, 0);

  const totalResolved = records
    .filter(r => r.estatus === 'resuelto')
    .reduce((sum, r) => sum + r.monto, 0);

  // Filtered records
  const filteredRecords = records.filter(record => {
    // Search query matches description
    const matchesSearch = record.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || record.estatus === statusFilter;
    
    // Socio filter
    const matchesSocio = socioFilter === 'all' || record.socioResponsable === socioFilter;
    
    // Project filter
    let matchesProject = true;
    if (projectFilter !== 'all') {
      if (projectFilter === 'none') {
        matchesProject = record.proyectoOrigenId === null;
      } else {
        matchesProject = record.proyectoOrigenId === projectFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesSocio && matchesProject;
  });

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = (id: string) => {
    onDeleteClick(id);
    setDeleteConfirmId(null);
  };

  const getProjectName = (projId: string | null) => {
    if (!projId) return 'Sin proyecto / Gasto general';
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto no encontrado';
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Module Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 pb-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-enchanted-green dark:text-light-ivory">
            Por Impactar
          </h1>
          <p className="text-xs text-rocky-gray dark:text-rose-linen/80 mt-1">
            Registro transitorio de gastos pendientes por recuperar o vincular a un proyecto definitivo.
          </p>
        </div>

        <button
          id="add-por-impactar-btn"
          onClick={onAddClick}
          className="self-start sm:self-center bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-colors font-medium text-xs uppercase tracking-wider py-2.5 px-4 rounded flex items-center space-x-1.5 shadow-sm"
        >
          <Plus size={14} />
          <span>Registrar Por Impactar</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPI 1: Pendiente */}
        <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-cranberry"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest text-rocky-gray dark:text-rose-linen/60 uppercase font-semibold">
                Total Pendiente por Recuperar
              </p>
              <h3 className="text-2xl md:text-3xl font-serif font-medium text-enchanted-green dark:text-light-ivory mt-1">
                {formatCurrency(totalPending)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-cranberry/10 text-cranberry flex items-center justify-center">
              <Hourglass size={18} />
            </div>
          </div>
        </div>

        {/* KPI 2: Resuelto */}
        <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-elevated-gold"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest text-rocky-gray dark:text-rose-linen/60 uppercase font-semibold">
                Total Ya Recuperado / Resuelto
              </p>
              <h3 className="text-2xl md:text-3xl font-serif font-medium text-enchanted-green dark:text-light-ivory mt-1">
                {formatCurrency(totalResolved)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-elevated-gold/10 text-elevated-gold flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtering Section */}
      <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-rocky-gray">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar por descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#051A14] border border-rocky-gray/40 dark:border-white/10 rounded pl-10 pr-4 py-1.5 text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors"
            />
          </div>

          {/* Selector Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Estatus */}
            <div className="flex items-center space-x-1.5">
              <Filter size={12} className="text-elevated-gold" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white dark:bg-[#051A14] border border-rocky-gray/40 dark:border-white/10 text-[11px] font-semibold rounded px-2.5 py-1 text-enchanted-green dark:text-light-ivory focus:outline-none"
              >
                <option value="all">Estatus: Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="resuelto">Resuelto</option>
              </select>
            </div>

            {/* Filter by Socio */}
            <div className="flex items-center space-x-1.5">
              <UserCircle size={12} className="text-elevated-gold" />
              <select
                value={socioFilter}
                onChange={(e) => setSocioFilter(e.target.value as any)}
                className="bg-white dark:bg-[#051A14] border border-rocky-gray/40 dark:border-white/10 text-[11px] font-semibold rounded px-2.5 py-1 text-enchanted-green dark:text-light-ivory focus:outline-none"
              >
                <option value="all">Socio: Todos</option>
                <option value="Empresa">Empresa</option>
                <option value="San">San</option>
                <option value="Ale">Ale</option>
              </select>
            </div>

            {/* Filter by Proyecto */}
            <div className="flex items-center space-x-1.5">
              <Briefcase size={12} className="text-elevated-gold" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-white dark:bg-[#051A14] border border-rocky-gray/40 dark:border-white/10 text-[11px] font-semibold rounded px-2.5 py-1 text-enchanted-green dark:text-light-ivory focus:outline-none max-w-[180px]"
              >
                <option value="all">Proyecto: Todos</option>
                <option value="none">Sin proyecto / Gasto general</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.codigo}] {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-white/40 dark:bg-[#0E1A16]/40 border border-rocky-gray/30 dark:border-white/10 rounded-lg">
          <div className="mx-auto w-12 h-12 rounded-full bg-enchanted-green/5 dark:bg-light-ivory/5 flex items-center justify-center text-elevated-gold mb-3">
            <Coins size={24} />
          </div>
          <h3 className="text-lg font-serif font-medium text-enchanted-green dark:text-light-ivory">
            No se encontraron registros
          </h3>
          <p className="text-xs text-rocky-gray dark:text-rose-linen/80 mt-1 max-w-md mx-auto">
            {records.length === 0 
              ? 'No hay registros en esta sección. Presiona "Registrar Por Impactar" para comenzar.'
              : 'Prueba cambiando los filtros o el término de búsqueda para ver más registros.'}
          </p>
        </div>
      ) : (
        /* Records Table */
        <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-enchanted-green/5 dark:bg-white/5 text-[10px] tracking-widest text-enchanted-green dark:text-light-ivory uppercase font-bold border-b border-rocky-gray/20 dark:border-white/5">
                  <th className="py-4 px-5">Descripción</th>
                  <th className="py-4 px-4">Monto</th>
                  <th className="py-4 px-4">Socio Responsable</th>
                  <th className="py-4 px-4">Proyecto de Referencia</th>
                  <th className="py-4 px-4">Fecha</th>
                  <th className="py-4 px-4">Estatus</th>
                  <th className="py-4 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rocky-gray/10 dark:divide-white/5 text-xs text-enchanted-green dark:text-light-ivory">
                {filteredRecords.map((record) => {
                  const isPending = record.estatus === 'pendiente';
                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-5 font-medium max-w-[200px] truncate" title={record.descripcion}>
                        {record.descripcion}
                      </td>
                      <td className="py-4 px-4 font-semibold text-elevated-gold">
                        {formatCurrency(record.monto)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-enchanted-green/10 dark:bg-white/10 text-enchanted-green dark:text-light-ivory">
                          {record.socioResponsable}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-rocky-gray dark:text-rose-linen/80">
                        {record.estatus === 'resuelto' ? (
                          <span className="text-elevated-gold dark:text-elevated-gold font-medium">
                            {getProjectName(record.proyectoDestinoId)}
                          </span>
                        ) : (
                          getProjectName(record.proyectoOrigenId)
                        )}
                      </td>
                      <td className="py-4 px-4 text-rocky-gray dark:text-rose-linen/80">
                        {record.fecha}
                      </td>
                      <td className="py-4 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cranberry/10 text-cranberry uppercase tracking-wider">
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-elevated-gold/10 text-elevated-gold uppercase tracking-wider">
                            Resuelto
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Resolve Action */}
                          {isPending && (
                            <button
                              onClick={() => onResolveClick(record)}
                              className="p-1.5 text-elevated-gold hover:bg-elevated-gold/15 rounded transition-all"
                              title="Resolver y convertir en Gasto"
                            >
                              <Zap size={14} className="fill-current" />
                            </button>
                          )}

                          {/* Edit Action (only for pending) */}
                          {isPending && (
                            <button
                              onClick={() => onEditClick(record)}
                              className="p-1.5 text-enchanted-green dark:text-light-ivory hover:bg-black/5 dark:hover:bg-white/5 rounded transition-all"
                              title="Editar registro"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}

                          {/* Delete/Confirm Dialog */}
                          {isPending ? (
                            deleteConfirmId === record.id ? (
                              <div className="flex items-center space-x-1.5 bg-cranberry/10 p-1 rounded">
                                <span className="text-[10px] font-bold text-cranberry uppercase px-1">¿Borrar?</span>
                                <button
                                  onClick={() => handleDeleteConfirm(record.id)}
                                  className="text-xs font-bold text-cranberry hover:underline px-1"
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-xs font-semibold text-rocky-gray hover:underline px-1"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDeleteTrigger(record.id)}
                                className="p-1.5 text-cranberry hover:bg-cranberry/10 rounded transition-all"
                                title="Eliminar registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            )
                          ) : (
                            <span className="text-[10px] italic text-rocky-gray/60 px-2 select-none">
                              No modificable
                            </span>
                          )}
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
