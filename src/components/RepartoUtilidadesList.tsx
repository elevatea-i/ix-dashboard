import React, { useState } from 'react';
import { ProfitDistribution, RepartoCierre, ResumenRepartoDestino, Project, Client } from '../types';
import { 
  Search, 
  Sparkles, 
  Award, 
  User, 
  Briefcase, 
  TrendingUp,
  RefreshCcw,
  BookOpen,
  Lock
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface RepartoUtilidadesListProps {
  distributions: ProfitDistribution[];
  repartosCierre: RepartoCierre[];
  resumenRepartos: ResumenRepartoDestino[];
  projects: Project[];
  clients: Client[];
}

export default function RepartoUtilidadesList({
  distributions = [],
  repartosCierre = [],
  resumenRepartos = [],
  projects,
  clients
}: RepartoUtilidadesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vista, setVista] = useState<'historico' | 'cierres'>('historico');

  const getProjectInfo = (projId: string) => {
    const project = projects.find(p => p.id === projId);
    if (!project) return { codigo: '---', nombre: 'Proyecto Eliminado', cliente: '---', fechaCierre: null };
    const client = clients.find(c => c.id === project.clienteId);
    return {
      codigo: project.codigo,
      nombre: project.nombre,
      cliente: client ? client.nombre : 'Cliente Desconocido',
      fechaCierre: (project as any).cerradoEn || null,
    };
  };

  // KPIs for the Historico tab (unchanged logic)
  const totalGananciaRepartida = distributions.reduce((sum, d) => sum + (d.gananciaTotal || 0), 0);
  const totalDueño = distributions.reduce((sum, d) => sum + (d.gananciaDueno || 0), 0);
  const totalEjecutivo = distributions.reduce((sum, d) => sum + (d.gananciaEjecutivo || 0), 0);
  const totalDiploma = distributions.reduce((sum, d) => sum + (d.gananciaDiploma || 0), 0);

  const TOPE_DIPLOMA = 37800;
  const diplomaPercentage = Math.min(100, Number(((totalDiploma / TOPE_DIPLOMA) * 100).toFixed(1)));

  // Filter distributions (Historico tab)
  const filteredDistributions = distributions.filter(dist => {
    const info = getProjectInfo(dist.proyectoId);
    const text = `${info.nombre} ${info.codigo} ${info.cliente}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Group repartos_cierre by proyecto (Cierres tab)
  const cierresByProject = repartosCierre.reduce<Record<string, RepartoCierre[]>>((acc, rc) => {
    if (!acc[rc.proyectoId]) acc[rc.proyectoId] = [];
    acc[rc.proyectoId].push(rc);
    return acc;
  }, {});

  const filteredCierreProjects = Object.keys(cierresByProject).filter(projId => {
    const info = getProjectInfo(projId);
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
            Consola analitica de distribucion de ganancias netas — historico automatico y cierres manuales.
          </p>
        </div>
      </div>

      {/* Combined Totals by Destino (from the view) */}
      {resumenRepartos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {resumenRepartos
            .sort((a, b) => b.totalCombinado - a.totalCombinado)
            .map(r => (
            <div
              key={r.destino}
              className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray mb-1">
                Total {r.destino}
              </p>
              <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
                {formatCurrency(r.totalCombinado)}
              </p>
              <p className="text-[10px] text-rocky-gray mt-2 font-mono">
                Historico: {formatCurrency(r.totalHistorico)} &middot; Cierres: {formatCurrency(r.totalCierres)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Toggle Historico / Cierres + Search */}
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

          <div className="flex items-center gap-3">
            {searchTerm && (
              <button
                id="reparto-reset-filters"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory font-semibold transition-colors"
              >
                <RefreshCcw size={12} />
                <span>Limpiar</span>
              </button>
            )}
            <div className="inline-flex rounded border border-enchanted-green/15 dark:border-light-ivory/15 overflow-hidden text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setVista('historico')}
                className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${
                  vista === 'historico'
                    ? 'bg-enchanted-green text-white dark:bg-elevated-gold dark:text-enchanted-green'
                    : 'bg-white dark:bg-[#051A14]/40 text-rocky-gray hover:bg-enchanted-green/5 dark:hover:bg-white/5'
                }`}
              >
                Historico
              </button>
              <button
                type="button"
                onClick={() => setVista('cierres')}
                className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${
                  vista === 'cierres'
                    ? 'bg-enchanted-green text-white dark:bg-elevated-gold dark:text-enchanted-green'
                    : 'bg-white dark:bg-[#051A14]/40 text-rocky-gray hover:bg-enchanted-green/5 dark:hover:bg-white/5'
                }`}
              >
                Cierres
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === HISTORICO TAB === */}
      {vista === 'historico' && (
        <>
          {/* KPI Stats Grid (unchanged) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div id="kpi-utilidad-dueno" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Acumulado Dueno (65%)</p>
                <p className="text-2xl font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2]">
                  {formatCurrency(totalDueño)}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
                <span>Formula fija de reparto</span>
                <User size={14} className="text-[#0B3D2E] dark:text-elevated-gold" />
              </div>
            </div>

            <div id="kpi-utilidad-ejecutivo" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Acumulado Ejecutivo (30%/35%)</p>
                <p className="text-2xl font-mono font-bold text-[#8C7853] dark:text-elevated-gold">
                  {formatCurrency(totalEjecutivo)}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
                <span>Inc. reasignacion de excedentes</span>
                <Briefcase size={14} className="text-[#8C7853] dark:text-elevated-gold" />
              </div>
            </div>

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

          {/* Historico Table */}
          {filteredDistributions.length === 0 ? (
            <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-12 text-center">
              <div className="w-12 h-12 bg-enchanted-green/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-rocky-gray mb-4">
                <Award size={24} className="opacity-80" />
              </div>
              <h3 className="text-sm font-semibold text-enchanted-green dark:text-light-ivory">
                Sin repartos registrados
              </h3>
              <p className="text-xs text-rocky-gray max-w-md mx-auto mt-2 leading-relaxed">
                Las utilidades se calculan de forma automatica e integra cuando un proyecto cambia a estado de facturacion <strong>"Pagado"</strong> (todas sus facturas asociadas quedan liquidadas).
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
                      <th className="py-3.5 px-4 font-semibold text-right">Dueno (65%)</th>
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
                <span>Mostrando {filteredDistributions.length} distribuciones de utilidades automaticas</span>
                <span className="flex items-center gap-1">
                  <BookOpen size={12} className="text-elevated-gold" />
                  <span>Calculo sin impuestos directos de IVA</span>
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* === CIERRES TAB === */}
      {vista === 'cierres' && (
        <>
          {filteredCierreProjects.length === 0 ? (
            <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-12 text-center">
              <div className="w-12 h-12 bg-enchanted-green/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-rocky-gray mb-4">
                <Lock size={24} className="opacity-80" />
              </div>
              <h3 className="text-sm font-semibold text-enchanted-green dark:text-light-ivory">
                Sin cierres registrados
              </h3>
              <p className="text-xs text-rocky-gray max-w-md mx-auto mt-2 leading-relaxed">
                Los cierres manuales se generan al cerrar un proyecto desde su ficha de detalle. Los porcentajes y montos quedan congelados al momento del cierre.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCierreProjects.map(projId => {
                const info = getProjectInfo(projId);
                const rows = cierresByProject[projId].sort((a, b) => b.monto - a.monto);
                const totalProj = rows.reduce((s, r) => s + r.monto, 0);
                const fechaCierre = rows[0]?.creadoEn
                  ? new Date(rows[0].creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '---';

                return (
                  <div
                    key={projId}
                    className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg overflow-hidden shadow-sm"
                  >
                    {/* Project header */}
                    <div className="px-5 py-4 bg-enchanted-green/[0.02] dark:bg-black/20 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-enchanted-green dark:text-light-ivory">
                          {info.nombre}
                        </p>
                        <p className="text-[10px] text-rocky-gray font-mono mt-0.5">
                          {info.codigo} &middot; {info.cliente}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-rocky-gray font-mono">
                        <span>Cerrado: {fechaCierre}</span>
                        <span className="font-bold text-enchanted-green dark:text-light-ivory">
                          Total: {formatCurrency(totalProj)}
                        </span>
                      </div>
                    </div>

                    {/* Destino rows */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] uppercase font-bold text-enchanted-green/70 dark:text-light-ivory/70 tracking-wider">
                            <th className="py-2.5 px-5 font-semibold">Destino</th>
                            <th className="py-2.5 px-5 font-semibold text-right">Porcentaje</th>
                            <th className="py-2.5 px-5 font-semibold text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-enchanted-green/5 dark:divide-light-ivory/5 text-xs text-enchanted-green dark:text-light-ivory/95">
                          {rows.map(rc => (
                            <tr key={rc.id} className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                              <td className="py-3 px-5 font-medium">{rc.destino}</td>
                              <td className="py-3 px-5 text-right font-mono text-rocky-gray">{rc.porcentaje}%</td>
                              <td className="py-3 px-5 text-right font-mono font-bold">{formatCurrency(rc.monto)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
