/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProfitDistribution, Project, Client } from '../types';
import { 
  Search, 
  Sparkles, 
  Award, 
  User, 
  Briefcase, 
  TrendingUp,
  RefreshCcw,
  BookOpen
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface RepartoUtilidadesListProps {
  distributions: ProfitDistribution[];
  projects: Project[];
  clients: Client[];
}

/**
 * Vista de solo lectura para el Reparto de Utilidades (Fase 6).
 * Calcula dinámicamente el histórico acumulado, porciones de Dueño, Ejecutivo
 * y el estado actual del Fondo de Diploma contra su tope de $37,800 MXN.
 */
export default function RepartoUtilidadesList({
  distributions = [],
  projects,
  clients
}: RepartoUtilidadesListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Helper to find project details
  const getProjectInfo = (projId: string) => {
    const project = projects.find(p => p.id === projId);
    if (!project) return { codigo: '---', nombre: 'Proyecto Eliminado', cliente: '---' };

    const client = clients.find(c => c.id === project.clienteId);
    return {
      codigo: project.codigo,
      nombre: project.nombre,
      cliente: client ? client.nombre : 'Cliente Desconocido'
    };
  };

  // 2. Calculations for KPIs
  const totalGananciaRepartida = distributions.reduce((sum, d) => sum + (d.gananciaTotal || 0), 0);
  const totalDueño = distributions.reduce((sum, d) => sum + (d.gananciaDueno || 0), 0);
  const totalEjecutivo = distributions.reduce((sum, d) => sum + (d.gananciaEjecutivo || 0), 0);
  const totalDiploma = distributions.reduce((sum, d) => sum + (d.gananciaDiploma || 0), 0);

  const TOPE_DIPLOMA = 37800;
  const diplomaPercentage = Math.min(100, Number(((totalDiploma / TOPE_DIPLOMA) * 100).toFixed(1)));

  // 3. Filter distributions by project name, project code or client name
  const filteredDistributions = distributions.filter(dist => {
    const info = getProjectInfo(dist.proyectoId);
    const text = `${info.nombre} ${info.codigo} ${info.cliente}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const handleResetFilters = () => {
    setSearchTerm('');
  };

  return (
    <div id="reparto-utilidades-container" className="space-y-6 animate-fade-in">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Reparto de Utilidades
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Consola analítica de distribución automática de ganancias netas una vez liquidadas las facturas del proyecto.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ganancia Total Repartida */}
        <div id="kpi-utilidad-total" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Utilidad Total Generada</p>
            <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
              {formatCurrency(totalGananciaRepartida)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span>Base de ingresos netos</span>
            <TrendingUp size={14} className="text-enchanted-green dark:text-light-ivory" />
          </div>
        </div>

        {/* Total Dueño */}
        <div id="kpi-utilidad-dueno" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Acumulado Dueño (65%)</p>
            <p className="text-2xl font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2]">
              {formatCurrency(totalDueño)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span>Fórmula fija de reparto</span>
            <User size={14} className="text-[#0B3D2E] dark:text-elevated-gold" />
          </div>
        </div>

        {/* Total Ejecutivo */}
        <div id="kpi-utilidad-ejecutivo" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Acumulado Ejecutivo (30%/35%)</p>
            <p className="text-2xl font-mono font-bold text-[#8C7853] dark:text-elevated-gold">
              {formatCurrency(totalEjecutivo)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span>Inc. reasignación de excedentes</span>
            <Briefcase size={14} className="text-[#8C7853] dark:text-elevated-gold" />
          </div>
        </div>

        {/* Fondo de Diploma */}
        <div id="kpi-utilidad-diploma" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Fondo Diploma (Becas 5%)</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
                {formatCurrency(totalDiploma)}
              </span>
              <span className="text-[10px] text-rocky-gray font-mono font-semibold">
                Tope: {formatCurrency(TOPE_DIPLOMA)}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-enchanted-green/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-elevated-gold h-full rounded-full transition-all duration-500"
                style={{ width: `${diplomaPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-rocky-gray font-mono">
              <span>Progreso al tope</span>
              <span className="font-bold text-enchanted-green dark:text-elevated-gold">{diplomaPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-rocky-gray" size={16} />
            <input
              id="reparto-search-input"
              type="text"
              placeholder="Buscar por proyecto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-enchanted-green/[0.02] dark:bg-white/[0.02] border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-sm placeholder:text-rocky-gray/60 focus:outline-none focus:border-elevated-gold dark:focus:border-elevated-gold"
            />
          </div>
          {searchTerm && (
            <button
              id="reparto-reset-filters"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory font-semibold transition-colors"
            >
              <RefreshCcw size={12} />
              <span>Limpiar Búsqueda</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      {filteredDistributions.length === 0 ? (
        <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-enchanted-green/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-rocky-gray mb-4">
            <Award size={24} className="opacity-80" />
          </div>
          <h3 className="text-sm font-semibold text-enchanted-green dark:text-light-ivory">
            Sin repartos registrados
          </h3>
          <p className="text-xs text-rocky-gray max-w-md mx-auto mt-2 leading-relaxed">
            Las utilidades se calculan de forma automática e íntegra cuando un proyecto cambia a estado de facturación <strong>"Pagado"</strong> (todas sus facturas asociadas quedan liquidadas).
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-black/20 text-[10px] uppercase font-bold text-enchanted-green/80 dark:text-light-ivory/80 tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Proyecto</th>
                  <th className="py-3.5 px-4 font-semibold">Cliente</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ganancia Total</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Dueño (65%)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ejecutivo (30%/35%)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Diploma (5% / Tope)</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Fecha Reparto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enchanted-green/5 dark:divide-light-ivory/5 text-xs text-enchanted-green dark:text-light-ivory/95">
                {filteredDistributions.map((dist) => {
                  const info = getProjectInfo(dist.proyectoId);
                  return (
                    <tr 
                      key={dist.id}
                      className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">
                        <div>
                          <p className="font-semibold text-enchanted-green dark:text-light-ivory">
                            {info.nombre}
                          </p>
                          <p className="text-[10px] text-rocky-gray font-mono mt-0.5">
                            {info.codigo}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-rocky-gray dark:text-rose-linen/80">
                        {info.cliente}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-right text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(dist.gananciaTotal)}
                      </td>
                      <td className="py-4 px-4 font-mono text-right text-[#0B3D2E] dark:text-[#EAE3D2]">
                        {formatCurrency(dist.gananciaDueno)}
                      </td>
                      <td className="py-4 px-4 font-mono text-right text-[#8C7853] dark:text-elevated-gold">
                        {formatCurrency(dist.gananciaEjecutivo)}
                      </td>
                      <td className="py-4 px-4 font-mono text-right text-enchanted-green/90 dark:text-light-ivory/90">
                        <div>
                          <span>{formatCurrency(dist.gananciaDiploma)}</span>
                          {dist.gananciaDiploma === 0 && (
                            <span className="block text-[8px] uppercase font-bold text-rose-linen bg-cranberry/20 px-1 py-0.5 rounded mt-0.5 w-fit ml-auto">
                              Topado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-[11px] text-rocky-gray">
                        {dist.fechaCreacion}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-enchanted-green/[0.02] dark:bg-black/10 px-4 py-3 border-t border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between text-[11px] text-rocky-gray">
            <span>Mostrando {filteredDistributions.length} distribuciones de utilidades automáticas</span>
            <span className="flex items-center gap-1">
              <BookOpen size={12} className="text-elevated-gold" />
              <span>Cálculo sin impuestos directos de IVA</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
