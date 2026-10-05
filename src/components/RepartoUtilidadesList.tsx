import { useState } from 'react';
import { ProfitDistribution, RepartoCierre, ResumenRepartoDestino, Project, Client } from '../types';
import { Award, Lock } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../utils';
import PageHeader from './ui/PageHeader';
import SummaryStrip from './ui/SummaryStrip';
import SearchInput from './ui/SearchInput';
import DataCard from './ui/DataCard';

const GRID_HISTORICO =
  'grid grid-cols-[minmax(220px,2fr)_minmax(140px,1.2fr)_repeat(4,minmax(110px,1fr))_110px] gap-4 px-6';
const GRID_CIERRES =
  'grid grid-cols-[1fr_100px_140px] gap-4 px-6';

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

  const totalGananciaRepartida = distributions.reduce((sum, d) => sum + (d.gananciaTotal || 0), 0);
  const totalDueño = distributions.reduce((sum, d) => sum + (d.gananciaDueno || 0), 0);
  const totalEjecutivo = distributions.reduce((sum, d) => sum + (d.gananciaEjecutivo || 0), 0);
  const totalDiploma = distributions.reduce((sum, d) => sum + (d.gananciaDiploma || 0), 0);

  const TOPE_DIPLOMA = 37800;
  const diplomaPercentage = Math.min(100, Number(((totalDiploma / TOPE_DIPLOMA) * 100).toFixed(1)));

  const filteredDistributions = distributions.filter(dist => {
    const info = getProjectInfo(dist.proyectoId);
    const text = `${info.nombre} ${info.codigo} ${info.cliente}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

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

  const sortedResumen = resumenRepartos.slice().sort((a, b) => b.totalCombinado - a.totalCombinado);

  return (
    <div id="reparto-utilidades-container" className="space-y-6">
      <PageHeader
        title="Reparto de utilidades"
        subtitle="Histórico automático y cierres manuales."
      />

      {/* Summary strip: totals by destino */}
      {sortedResumen.length > 0 && (
        <SummaryStrip
          items={sortedResumen.map(r => ({
            id: `kpi-reparto-total-${r.destino.toLowerCase()}`,
            label: `Total ${r.destino}`,
            value: r.totalCombinado,
            note: `Histórico ${formatCurrency(r.totalHistorico)} · Cierres ${formatCurrency(r.totalCierres)}`,
            primary: r.destino === 'San',
          }))}
        />
      )}

      {/* Summary strip: distribution breakdown */}
      <SummaryStrip
        items={[
          { id: 'kpi-utilidad-total', label: 'Utilidad total', value: totalGananciaRepartida, primary: true },
          { id: 'kpi-utilidad-dueno', label: 'Acumulado dueño', value: totalDueño },
          { id: 'kpi-utilidad-ejecutivo', label: 'Acumulado ejecutivo', value: totalEjecutivo },
          {
            id: 'kpi-utilidad-diploma',
            label: 'Fondo diploma',
            value: totalDiploma,
            note: `Tope ${formatCurrency(TOPE_DIPLOMA)}, ${diplomaPercentage}%`,
          },
        ]}
      />

      {/* Filters + segmented control */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por proyecto o cliente"
          ariaLabel="Buscar por proyecto o cliente"
        />
        <div className="inline-flex rounded-md border border-field overflow-hidden">
          <button
            type="button"
            onClick={() => setVista('historico')}
            aria-pressed={vista === 'historico'}
            className={`inline-flex h-11 items-center px-5 text-sm font-semibold transition-colors ${
              vista === 'historico'
                ? 'bg-ink text-paper'
                : 'bg-transparent text-ink-muted hover:text-ink hover:bg-ink/5'
            }`}
          >
            Histórico
          </button>
          <button
            type="button"
            onClick={() => setVista('cierres')}
            aria-pressed={vista === 'cierres'}
            className={`inline-flex h-11 items-center px-5 text-sm font-semibold transition-colors ${
              vista === 'cierres'
                ? 'bg-ink text-paper'
                : 'bg-transparent text-ink-muted hover:text-ink hover:bg-ink/5'
            }`}
          >
            Cierres
          </button>
        </div>
        {searchTerm && (
          <button
            type="button"
            id="reparto-reset-filters"
            onClick={handleResetFilters}
            className="h-11 px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* === HISTORICO TAB === */}
      {vista === 'historico' && (
        <DataCard id="reparto-historico-table">
          {filteredDistributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
                <Award size={22} />
              </div>
              <h3 className="text-base font-semibold text-ink">Sin repartos registrados</h3>
              <p className="text-sm text-ink-muted mt-1 max-w-md">
                Las utilidades se calculan de forma automática cuando un proyecto cambia a estado de facturación "Pagado" (todas sus facturas asociadas quedan liquidadas).
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div role="table" aria-label="Histórico de repartos" className="min-w-[980px]">
                  <div role="row" className={`${GRID_HISTORICO} border-b border-line py-3`}>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proyecto</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Cliente</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Ganancia total</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Dueño (65%)</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Ejecutivo (30%/35%)</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Diploma (5% / tope)</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">Fecha reparto</div>
                  </div>

                  {filteredDistributions.map((dist) => {
                    const info = getProjectInfo(dist.proyectoId);
                    return (
                      <div
                        key={dist.id}
                        role="row"
                        className={`${GRID_HISTORICO} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]`}
                      >
                        <div role="cell" className="min-w-0">
                          <p className="font-semibold text-ink truncate" title={info.nombre}>{info.nombre}</p>
                          <p className="mt-0.5 text-[13px] text-ink-muted tabular-nums">{info.codigo}</p>
                        </div>
                        <div role="cell" className="min-w-0">
                          <p className="text-ink-muted truncate" title={info.cliente}>{info.cliente}</p>
                        </div>
                        <div role="cell" className="text-right font-semibold tabular-nums text-ink">{formatCurrency(dist.gananciaTotal)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(dist.gananciaDueno)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(dist.gananciaEjecutivo)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">
                          <span>{formatCurrency(dist.gananciaDiploma)}</span>
                          {dist.gananciaDiploma === 0 && (
                            <span className="block text-[11px] text-ink-muted">Topado</span>
                          )}
                        </div>
                        <div role="cell" className="text-center tabular-nums text-[13px] text-ink-muted">
                          {formatDateShort(dist.fechaCreacion)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="px-6 py-3 text-[13px] text-ink-muted">
                Mostrando {filteredDistributions.length} distribuciones de utilidades automáticas
              </p>
            </>
          )}
        </DataCard>
      )}

      {/* === CIERRES TAB === */}
      {vista === 'cierres' && (
        <div className="space-y-4">
          {filteredCierreProjects.length === 0 ? (
            <DataCard id="reparto-cierres-empty" className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mx-auto text-ink-muted mb-4">
                <Lock size={24} />
              </div>
              <h3 className="text-base font-semibold text-ink">Sin cierres registrados</h3>
              <p className="text-sm text-ink-muted max-w-md mx-auto mt-2">
                Los cierres manuales se generan al cerrar un proyecto desde su ficha de detalle. Los porcentajes y montos quedan congelados al momento del cierre.
              </p>
            </DataCard>
          ) : (
            filteredCierreProjects.map(projId => {
              const info = getProjectInfo(projId);
              const rows = cierresByProject[projId].sort((a, b) => b.monto - a.monto);
              const totalProj = rows.reduce((s, r) => s + r.monto, 0);
              const fechaCierre = rows[0]?.creadoEn
                ? new Date(rows[0].creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                : '---';

              return (
                <DataCard key={projId} id={`reparto-cierre-${projId}`}>
                  <div className="px-6 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate" title={info.nombre}>{info.nombre}</p>
                      <p className="mt-0.5 text-[13px] text-ink-muted tabular-nums">{info.codigo} · {info.cliente}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[13px] text-ink-muted tabular-nums">
                      <span>Cerrado: {fechaCierre}</span>
                      <span className="font-semibold text-ink">Total: {formatCurrency(totalProj)}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div role="table" aria-label={`Reparto de cierre ${info.nombre}`}>
                      <div role="row" className={`${GRID_CIERRES} border-b border-line py-3`}>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Destino</div>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Porcentaje</div>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Monto</div>
                      </div>
                      {rows.map(rc => (
                        <div
                          key={rc.id}
                          role="row"
                          className={`${GRID_CIERRES} items-start border-b border-line py-3.5 text-sm text-ink transition-colors hover:bg-ink/[0.03]`}
                        >
                          <div role="cell" className="font-medium text-ink">{rc.destino}</div>
                          <div role="cell" className="text-right tabular-nums text-ink-muted">{rc.porcentaje}%</div>
                          <div role="cell" className="text-right font-semibold tabular-nums text-ink">{formatCurrency(rc.monto)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DataCard>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
