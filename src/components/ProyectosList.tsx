import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { FolderGit2, Plus, Pencil as Edit, Trash2, Eye, X, FileSpreadsheet, Receipt, FileCheck, Zap, UsersRound, Lock, TrendingUp, TriangleAlert as AlertTriangle, Award } from 'lucide-react';
import { Client, Project, Invoice, Expense, ProviderPayment, ProfitDistribution, PorImpactar, ThirdPartyPayment, RepartoCierre } from '../types';
import { calculateProjectBillingStatus, formatCurrency, getDueDateIndicator } from '../utils';
import { calculateProjectProfitability } from '../utils/profitability';
import { generarReporteProyecto } from '../utils/reports';
import { supabase } from '../lib/supabase';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import SearchInput from './ui/SearchInput';
import StatusDot from './ui/StatusDot';
import DataCard from './ui/DataCard';

interface ProyectosListProps {
  projects: Project[];
  loading?: boolean;
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  providerPayments?: ProviderPayment[];
  profitDistributions?: ProfitDistribution[];
  porImpactar?: PorImpactar[];
  thirdPartyPayments?: ThirdPartyPayment[];
  repartosCierre?: RepartoCierre[];
  onAddClick: () => void;
  onEditClick: (project: Project) => void;
  onDeleteClick: (id: string) => void;
  onCerrarClick?: (project: Project) => void;
}

const GRID_COLUMNS =
  'grid grid-cols-[minmax(220px,2fr)_minmax(160px,1fr)_100px_140px_140px] gap-4 px-6';

export default function ProyectosList({
  projects,
  loading,
  clients,
  invoices,
  expenses,
  providerPayments = [],
  profitDistributions = [],
  porImpactar = [],
  thirdPartyPayments = [],
  repartosCierre = [],
  onAddClick,
  onEditClick,
  onDeleteClick,
  onCerrarClick
}: ProyectosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [panelTop, setPanelTop] = useState<number | null>(null);
  const [colRect, setColRect] = useState<{ left: number; width: number } | null>(null);
  const [clampedTop, setClampedTop] = useState<number>(0);

  const isDesktop = useIsDesktop();
  const colRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [resumenVivo, setResumenVivo] = useState<{ gananciaTotal: number; yaRepartido: number; pendiente: number } | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const projectInvoicesForResumen = selectedProject
    ? invoices.filter(inv => inv.proyectoId === selectedProject.id)
    : [];
  const resumenInvoiceKey = projectInvoicesForResumen.map(i => `${i.id}:${i.estado}`).join(',');

  useEffect(() => {
    if (!selectedProject || selectedProject.cerrado) {
      setResumenVivo(null);
      return;
    }
    let cancelled = false;
    setLoadingResumen(true);
    supabase.rpc('calcular_resumen_cierre', { p_proyecto_id: selectedProject.id }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setLoadingResumen(false); return; }
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setResumenVivo({
          gananciaTotal: Number(row.ganancia_total),
          yaRepartido: Number(row.ya_repartido),
          pendiente: Number(row.pendiente_por_repartir),
        });
      }
      setLoadingResumen(false);
    });
    return () => { cancelled = true; };
  }, [selectedProject?.id, selectedProject?.cerrado, resumenInvoiceKey]);

  const measureCol = useCallback(() => {
    if (!colRef.current || !isDesktop) return;
    const rect = colRef.current.getBoundingClientRect();
    setColRect({ left: rect.left, width: rect.width });
  }, [isDesktop]);

  useLayoutEffect(() => {
    measureCol();
  }, [measureCol, selectedProject]);

  useEffect(() => {
    if (!isDesktop) return;
    const handler = () => measureCol();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isDesktop, measureCol]);

  useLayoutEffect(() => {
    if (panelTop == null || !isDesktop) return;
    const HEADER_OFFSET = 88;
    const BOTTOM_PADDING = 16;
    const panelHeight = panelRef.current?.offsetHeight ?? 600;
    const maxTop = window.innerHeight - panelHeight - BOTTOM_PADDING;
    const top = Math.min(Math.max(panelTop, HEADER_OFFSET), maxTop);
    setClampedTop(Math.max(top, HEADER_OFFSET));
  }, [panelTop, isDesktop, selectedProject, colRect]);

  useEffect(() => {
    if (!selectedProject) return;
    const fresh = projects.find(p => p.id === selectedProject.id);
    if (fresh) {
      if (fresh !== selectedProject) setSelectedProject(fresh);
    } else {
      setSelectedProject(null);
    }
  }, [projects]);

  const getBillingStatusDot = (projId: string) => {
    const status = calculateProjectBillingStatus(projId, invoices);
    if (status === 'Pagado') return <StatusDot tone="ok" label="Pagado" />;
    if (status === 'Facturado') return <StatusDot tone="ok" label="Facturado" />;
    return <StatusDot tone="neutral" label="Sin facturar" />;
  };

  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nombre : 'Cliente Desconocido';
  };

  const getClient = (clientId: string): Client | undefined => {
    return clients.find(c => c.id === clientId);
  };

  const filteredProjects = projects.filter((project) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = getClientName(project.clienteId).toLowerCase();
    return (
      project.nombre.toLowerCase().includes(searchLower) ||
      project.codigo.toLowerCase().includes(searchLower) ||
      clientName.includes(searchLower)
    );
  });

  const totalProjects = projects.length;
  const activeSan = projects.filter(p => p.ejecutivoId === 'San').length;
  const activeAle = projects.filter(p => p.ejecutivoId === 'Ale').length;

  const subtitle = `${totalProjects} ${totalProjects === 1 ? 'proyecto registrado' : 'proyectos registrados'}. ${activeSan} de San y ${activeAle} de Ale.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proyectos"
        subtitle={subtitle}
        action={
          <Button id="header-add-project-btn" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
            Registrar proyecto
          </Button>
        }
      />

      {loading ? (
        <DataCard id="proyectos-table-wrapper">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent" />
          </div>
        </DataCard>
      ) : totalProjects === 0 ? (
        <DataCard id="empty-projects-state" className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
            <FolderGit2 size={24} />
          </div>
          <h3 className="text-base font-semibold text-ink">Sin proyectos registrados</h3>
          <p className="text-sm text-ink-muted mt-1 max-w-md mx-auto mb-6">
            Comienza dando de alta tu primer proyecto operativo vinculándolo a un cliente existente.
          </p>
          <div className="flex justify-center">
            <Button
              id="empty-state-add-project-btn"
              variant="primary"
              icon={<Plus size={16} />}
              onClick={onAddClick}
            >
              Registrar primer proyecto
            </Button>
          </div>
        </DataCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre, código o cliente"
                ariaLabel="Buscar por nombre, código o cliente"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="h-11 px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>

            <DataCard id="proyectos-table-wrapper">
              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center text-sm text-ink-muted">
                  Ningún proyecto coincide con la búsqueda.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <div role="table" aria-label="Proyectos" className="min-w-[880px]">
                      <div role="row" className={`${GRID_COLUMNS} border-b border-line py-3`}>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proyecto</div>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Cliente</div>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Ejecutivo</div>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Facturación</div>
                        <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">Acciones</div>
                      </div>

                      {filteredProjects.map((project) => {
                        const isSelected = selectedProject?.id === project.id;
                        return (
                          <div
                            key={project.id}
                            role="row"
                            className={`${GRID_COLUMNS} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03] ${
                              isSelected ? 'bg-ink/[0.03]' : ''
                            }`}
                          >
                            <div role="cell" className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-ink truncate" title={project.codigo}>{project.codigo}</p>
                                {project.cerrado && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                                    <Lock size={11} /> Cerrado
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[13px] text-ink-muted truncate" title={project.nombre}>{project.nombre}</p>
                            </div>

                            <div role="cell" className="min-w-0">
                              <p className="text-ink truncate" title={getClientName(project.clienteId)}>
                                {getClientName(project.clienteId)}
                              </p>
                            </div>

                            <div role="cell">
                              <p className="text-ink">{project.ejecutivoId}</p>
                            </div>

                            <div role="cell">
                              {getBillingStatusDot(project.id)}
                            </div>

                            <div role="cell" className="flex items-center justify-center gap-1 -my-2">
                              {deleteConfirmId === project.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-[13px] text-risk font-semibold">¿Confirmar?</span>
                                  <IconButton
                                    label="Confirmar eliminación"
                                    tone="danger"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => {
                                      onDeleteClick(project.id);
                                      if (selectedProject?.id === project.id) {
                                        setSelectedProject(null);
                                        setPanelTop(null);
                                      }
                                      setDeleteConfirmId(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-[13px] font-semibold text-ink-muted hover:text-ink"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <IconButton
                                    label="Ver detalles"
                                    icon={<Eye size={16} />}
                                    onClick={(e) => {
                                      const btn = e.currentTarget;
                                      const row = btn.closest('[role="row"]');
                                      const target = row || btn;
                                      const rect = target.getBoundingClientRect();
                                      setPanelTop(rect.top);
                                      setSelectedProject(project);
                                    }}
                                  />
                                  {!project.cerrado && (
                                    <IconButton
                                      label="Editar"
                                      icon={<Edit size={16} />}
                                      onClick={() => onEditClick(project)}
                                    />
                                  )}
                                  {!project.cerrado && (
                                    <IconButton
                                      label="Eliminar"
                                      tone="danger"
                                      icon={<Trash2 size={16} />}
                                      onClick={() => setDeleteConfirmId(project.id)}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="px-6 py-3 text-[13px] text-ink-muted">
                    Mostrando {filteredProjects.length} de {totalProjects} proyectos
                  </p>
                </>
              )}
            </DataCard>
          </div>

          <div className="lg:col-span-1" ref={colRef}>
            <div
              ref={panelRef}
              style={selectedProject && isDesktop && colRect ? {
                position: 'fixed',
                top: clampedTop,
                left: colRect.left,
                width: colRect.width,
                maxHeight: 'calc(100vh - 7rem)',
                overflowY: 'auto',
                zIndex: 50,
              } : undefined}
            >
              {selectedProject ? (
                <DataCard id="proyecto-ficha" className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-ink-muted">Ficha de proyecto</span>
                        {selectedProject.cerrado && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                            <Lock size={11} /> Cerrado
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-ink mt-0.5">
                        {selectedProject.nombre}
                      </h3>
                      <p className="text-[13px] text-ink-muted mt-1 tabular-nums">{selectedProject.codigo}</p>
                      {selectedProject.cerrado && selectedProject.fechaCierre && (
                        <p className="text-[13px] text-ink-muted mt-0.5">
                          Cerrado el {selectedProject.fechaCierre}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedProject(null); setPanelTop(null); }}
                      className="p-1 text-ink-muted hover:text-risk hover:bg-ink/5 rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <hr className="border-line" />

                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[13px] text-ink-muted">Cliente contratante</p>
                      <p className="text-sm font-semibold text-ink mt-1">
                        {getClientName(selectedProject.clienteId)}
                      </p>
                      {getClient(selectedProject.clienteId)?.razonSocial && (
                        <p className="text-[13px] text-ink-muted mt-0.5">
                          {getClient(selectedProject.clienteId)?.razonSocial} · RFC: {getClient(selectedProject.clienteId)?.rfc}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <p className="text-[13px] text-ink-muted">Responsable</p>
                        <p className="text-sm font-semibold text-ink mt-1">
                          {selectedProject.ejecutivoId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] text-ink-muted">Creado el</p>
                        <p className="text-sm text-ink mt-1 tabular-nums">
                          {selectedProject.fechaCreacion}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[13px] text-ink-muted">Estatus operativo</p>
                      <div className="mt-1.5">
                        {getBillingStatusDot(selectedProject.id)}
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button
                        variant="primary"
                        className="w-full"
                        icon={<FileSpreadsheet size={14} />}
                        onClick={() => {
                          const clientName = getClientName(selectedProject.clienteId);
                          generarReporteProyecto(
                            selectedProject,
                            clientName,
                            invoices,
                            expenses,
                            providerPayments
                          );
                        }}
                      >
                        Descargar reporte Excel
                      </Button>
                      {!selectedProject.cerrado && onCerrarClick && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          icon={<Lock size={14} />}
                          onClick={() => {
                            const projectInvoices = invoices.filter(inv => inv.proyectoId === selectedProject.id);
                            const hasUnpaid = projectInvoices.some(inv => inv.estado !== 'pagada');
                            if (hasUnpaid) return;
                            onCerrarClick(selectedProject);
                          }}
                          disabled={invoices.filter(inv => inv.proyectoId === selectedProject.id).some(inv => inv.estado !== 'pagada')}
                          title={
                            invoices.filter(inv => inv.proyectoId === selectedProject.id).some(inv => inv.estado !== 'pagada')
                              ? 'Todas las facturas deben estar pagadas para cerrar el proyecto'
                              : 'Cerrar proyecto definitivamente'
                          }
                        >
                          Cerrar proyecto
                        </Button>
                      )}
                    </div>
                  </div>

                  <hr className="border-line" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-ink">Integración y métricas</h4>

                    {(() => {
                      const projectInvoices = invoices.filter(inv => inv.proyectoId === selectedProject.id);
                      if (projectInvoices.length === 0) {
                        return (
                          <div className="rounded-lg border border-line p-3">
                            <div className="flex items-start gap-2.5">
                              <Receipt size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink">Facturas vinculadas</p>
                                <p className="text-[13px] text-ink-muted mt-1">Sin facturas registradas para este proyecto.</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <Receipt size={14} className="text-ink-muted" />
                            <span>Facturas vinculadas ({projectInvoices.length})</span>
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {projectInvoices.map(inv => (
                              <div key={inv.id} className="flex items-center justify-between text-[13px] p-2 rounded-md bg-ink/[0.02]">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-ink">{inv.folio}</span>
                                  <span className="text-[11px] text-ink-muted block tabular-nums">{inv.fechaEmision} · {inv.metodoPago}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-ink block tabular-nums">
                                    {formatCurrency(inv.total)}
                                  </span>
                                  {inv.estado === 'pagada' ? (
                                    <span className="text-[11px] text-ink-muted">Pagada</span>
                                  ) : (
                                    <span className="text-[11px] text-risk">Facturada</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const projectExpenses = expenses.filter(
                        exp => exp.proyectoId === selectedProject.id && exp.tipo === 'Proveedor por Proyecto'
                      );
                      if (projectExpenses.length === 0) {
                        return (
                          <div className="rounded-lg border border-line p-3">
                            <div className="flex items-start gap-2.5">
                              <FileSpreadsheet size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink">Gastos vinculados</p>
                                <p className="text-[13px] text-ink-muted mt-1">Sin gastos de proveedor registrados para este proyecto.</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <FileSpreadsheet size={14} className="text-ink-muted" />
                            <span>Gastos de proveedor ({projectExpenses.length})</span>
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {projectExpenses.map(exp => (
                              <div key={exp.id} className="flex items-center justify-between text-[13px] p-2 rounded-md bg-ink/[0.02]">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-ink">{exp.concepto}</span>
                                  <span className="text-[11px] text-ink-muted block tabular-nums">{exp.fecha} · {exp.categoriaId}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-ink block tabular-nums">
                                    {formatCurrency(exp.total)}
                                  </span>
                                  {exp.estatusPago === 'Pagado' ? (
                                    <span className="text-[11px] text-ink-muted">Pagado</span>
                                  ) : (
                                    <span className="text-[11px] text-risk">Pendiente</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const projectProviderPayments = (providerPayments || []).filter(
                        pay => pay.proyectoId === selectedProject.id
                      );
                      if (projectProviderPayments.length === 0) {
                        return (
                          <div className="rounded-lg border border-line p-3">
                            <div className="flex items-start gap-2.5">
                              <FileCheck size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink">Pagos a proveedores vinculados</p>
                                <p className="text-[13px] text-ink-muted mt-1">Sin pagos a proveedores registrados para este proyecto.</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <FileCheck size={14} className="text-ink-muted" />
                            <span>Pagos a proveedores ({projectProviderPayments.length})</span>
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {projectProviderPayments.map(pay => {
                              const indicator = getDueDateIndicator(pay.estatus, pay.fecha_vencimiento);
                              return (
                                <div key={pay.id} className="flex items-center justify-between text-[13px] p-2 rounded-md bg-ink/[0.02]">
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-ink block">{pay.proveedor}</span>
                                    <div className="flex flex-col gap-0.5 text-[11px] text-ink-muted tabular-nums">
                                      <span>{pay.fecha}</span>
                                      {pay.fecha_vencimiento && pay.estatus === 'Pendiente' && (
                                        <span>Vence: {pay.fecha_vencimiento}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-semibold text-ink block tabular-nums">
                                      {formatCurrency(pay.total)}
                                    </span>
                                    <div className="flex flex-col items-end gap-1 mt-0.5">
                                      {pay.estatus === 'Pagado' ? (
                                        <span className="text-[11px] text-ink-muted">Pagado</span>
                                      ) : (
                                        <>
                                          <span className="text-[11px] text-risk">Pendiente</span>
                                          {indicator && (
                                            <span className={`text-[11px] font-semibold px-1 py-0.5 rounded ${
                                              indicator.type === 'future'
                                                ? 'text-ink-muted'
                                                : indicator.type === 'today'
                                                  ? 'text-risk bg-risk/10'
                                                  : 'text-paper bg-risk'
                                            }`}>
                                              {indicator.text}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const projectPorImpactar = (porImpactar || []).filter(
                        pay => pay.proyectoDestinoId === selectedProject.id && pay.estatus === 'resuelto'
                      );
                      if (projectPorImpactar.length === 0) {
                        return (
                          <div className="rounded-lg border border-line p-3">
                            <div className="flex items-start gap-2.5">
                              <Zap size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink">Por impactar resueltos</p>
                                <p className="text-[13px] text-ink-muted mt-1">Sin registros resueltos vinculados a este proyecto.</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <Zap size={14} className="text-ink-muted" />
                            <span>Por impactar resueltos ({projectPorImpactar.length})</span>
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {projectPorImpactar.map(pay => (
                              <div key={pay.id} className="flex items-center justify-between text-[13px] p-2 rounded-md bg-ink/[0.02]">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-ink">{pay.descripcion}</span>
                                  <span className="text-[11px] text-ink-muted block tabular-nums">{pay.fecha} · {pay.socioResponsable}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-ink block tabular-nums">
                                    {formatCurrency(pay.monto)}
                                  </span>
                                  <span className="text-[11px] text-ink-muted">Resuelto</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const projectThirdPartyPayments = (thirdPartyPayments || []).filter(
                        pay => pay.proyectoId === selectedProject.id
                      );
                      if (projectThirdPartyPayments.length === 0) {
                        return (
                          <div className="rounded-lg border border-line p-3">
                            <div className="flex items-start gap-2.5">
                              <UsersRound size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink">Pagos a terceros vinculados</p>
                                <p className="text-[13px] text-ink-muted mt-1">Sin registros vinculados a este proyecto.</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <UsersRound size={14} className="text-ink-muted" />
                            <span>Pagos a terceros ({projectThirdPartyPayments.length})</span>
                          </p>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {projectThirdPartyPayments.map(pay => (
                              <div key={pay.id} className="flex items-center justify-between text-[13px] p-2 rounded-md bg-ink/[0.02]">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-ink">{pay.concepto}</span>
                                  <div className="text-[11px] text-ink-muted tabular-nums">
                                    <span>Saldo orig: {formatCurrency(pay.saldoOriginal)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-ink block tabular-nums">
                                    {formatCurrency(pay.montoADepositar)}
                                  </span>
                                  {pay.statusFac === 'Disponible' ? (
                                    <span className="text-[11px] text-ink-muted">Disponible</span>
                                  ) : (
                                    <span className="text-[11px] text-ink-muted">Por pagar</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const projectDists = (profitDistributions || []).filter(
                        pd => pd.proyectoId === selectedProject.id
                      );

                      if (projectDists.length === 0) {
                        return (
                          <div className="rounded-lg border border-line p-3.5">
                            <div className="flex items-start gap-2.5">
                              <Award size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                                  <span>Reparto de utilidades</span>
                                  <span className="text-[11px] text-ink-muted">Pendiente</span>
                                </p>
                                <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">
                                  Pendiente — se genera automáticamente cuando el proyecto esté completamente pagado (todas sus facturas en estado "Pagada").
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <Award size={14} className="text-ink-muted" />
                            <span>Historial de reparto de utilidades ({projectDists.length})</span>
                          </p>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {projectDists.map((dist, idx) => (
                              <div
                                key={dist.id}
                                className="rounded-lg border border-line p-3 space-y-1.5 text-[13px]"
                              >
                                <div className="flex items-center justify-between text-[11px] text-ink-muted pb-1 border-b border-line">
                                  <span>Reparto #{idx + 1}</span>
                                  <span className="tabular-nums">{dist.fechaCreacion}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[13px] py-0.5">
                                    <span className="text-ink-muted">Utilidad operativa (neto):</span>
                                    <span className="font-semibold text-ink tabular-nums">
                                      {formatCurrency(dist.gananciaTotal)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[13px] py-0.5">
                                    <span className="text-ink-muted">Dueño (65%):</span>
                                    <span className="font-semibold text-ink tabular-nums">
                                      {formatCurrency(dist.gananciaDueno)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[13px] py-0.5">
                                    <span className="text-ink-muted">Ejecutivo (30%/35%):</span>
                                    <span className="font-semibold text-ink tabular-nums">
                                      {formatCurrency(dist.gananciaEjecutivo)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[13px] py-0.5">
                                    <span className="text-ink-muted">Fondo diploma (5%):</span>
                                    <span className="font-semibold text-ink tabular-nums">
                                      {formatCurrency(dist.gananciaDiploma)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const metrics = calculateProjectProfitability(
                        selectedProject,
                        getClientName(selectedProject.clienteId),
                        invoices,
                        providerPayments,
                        expenses,
                        thirdPartyPayments
                      );
                      const isProfitNegative = metrics.ganancia < 0;
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-ink-muted" />
                            <span>Rentabilidad del proyecto</span>
                          </p>
                          <div className="space-y-1 text-[13px]">
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-ink-muted">Costo cliente (facturado):</span>
                              <span className="font-semibold text-ink tabular-nums">
                                {formatCurrency(metrics.costoCliente)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-ink-muted">Costo proveedor:</span>
                              <span className="text-ink-muted tabular-nums">
                                {formatCurrency(metrics.costoProveedor)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-ink-muted">Gastos proveedor vinc.:</span>
                              <span className="text-ink-muted tabular-nums">
                                {formatCurrency(metrics.gastosProveedorVinculados)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-ink-muted">Pagos a terceros:</span>
                              <span className="text-ink-muted tabular-nums">
                                {formatCurrency(metrics.costoTerceros)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-line pt-1 mt-1 font-semibold">
                              <span className="text-ink">Ganancia neta:</span>
                              <span className={`tabular-nums ${isProfitNegative ? 'text-risk' : 'text-ink'}`}>
                                {formatCurrency(metrics.ganancia)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-0.5">
                              <span className="text-ink-muted font-semibold">Porcentaje rentabilidad:</span>
                              {metrics.porcentajeRentabilidad === 'N/A' ? (
                                <span className="text-[13px] text-ink-muted">N/A</span>
                              ) : (
                                <span className="text-ink tabular-nums">
                                  {metrics.porcentajeRentabilidad}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {!selectedProject.cerrado && (() => {
                      if (loadingResumen) {
                        return (
                          <div className="rounded-lg border border-line p-3.5">
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gold border-t-transparent" />
                            </div>
                          </div>
                        );
                      }
                      if (!resumenVivo) return null;
                      const hayFacturasSinCobrar = invoices.some(
                        inv => inv.proyectoId === selectedProject.id && inv.estado !== 'pagada'
                      );
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-ink-muted" />
                            <span>Ganado vs. repartido</span>
                          </p>
                          <div className="grid grid-cols-3 gap-2 items-stretch">
                            <div className="rounded-lg border border-line p-2.5 flex flex-col min-w-0">
                              <p className="text-[11px] text-ink-muted truncate">Ganancia hasta hoy</p>
                              <p className="text-[13px] font-semibold text-ink mt-1 tabular-nums break-all leading-tight">
                                {formatCurrency(resumenVivo.gananciaTotal)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-line p-2.5 flex flex-col min-w-0">
                              <p className="text-[11px] text-ink-muted truncate">Ya repartido</p>
                              <p className="text-[13px] font-semibold text-ink mt-1 tabular-nums break-all leading-tight">
                                {formatCurrency(resumenVivo.yaRepartido)}
                              </p>
                            </div>
                            <div className="rounded-lg border border-line p-2.5 flex flex-col min-w-0">
                              <p className="text-[11px] text-ink-muted truncate">Pendiente</p>
                              <p className="text-[13px] font-semibold text-ink mt-1 tabular-nums break-all leading-tight">
                                {formatCurrency(resumenVivo.pendiente)}
                              </p>
                            </div>
                          </div>
                          {hayFacturasSinCobrar && (
                            <div className="flex items-start gap-1.5 mt-1">
                              <AlertTriangle size={12} className="text-ink-muted mt-0.5 shrink-0" />
                              <p className="text-[11px] text-ink-muted leading-relaxed">
                                Cifra parcial: hay facturas sin cobrar que no se han sumado.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {selectedProject.cerrado && (() => {
                      const projectRepartos = repartosCierre.filter(r => r.proyectoId === selectedProject.id);
                      if (projectRepartos.length === 0 && !selectedProject.gananciaAlCierre) {
                        return (
                          <div className="rounded-lg border border-line p-3.5">
                            <div className="flex items-start gap-2.5">
                              <Lock size={16} className="text-ink-muted mt-0.5" />
                              <div>
                                <p className="text-[13px] font-semibold text-ink">Reparto de cierre</p>
                                <p className="text-[13px] text-ink-muted mt-1">
                                  Proyecto cerrado sin reparto de utilidades pendientes.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="rounded-lg border border-line p-3 space-y-2">
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                            <Lock size={14} className="text-ink-muted" />
                            <span>Reparto de cierre</span>
                          </p>
                          <div className="space-y-1 text-[13px]">
                            {selectedProject.gananciaAlCierre != null && (
                              <div className="flex items-center justify-between py-0.5">
                                <span className="text-ink-muted">Ganancia al cierre:</span>
                                <span className="font-semibold text-ink tabular-nums">
                                  {formatCurrency(selectedProject.gananciaAlCierre)}
                                </span>
                              </div>
                            )}
                            {selectedProject.yaRepartidoAntes != null && selectedProject.yaRepartidoAntes > 0 && (
                              <div className="flex items-center justify-between py-0.5">
                                <span className="text-ink-muted">Ya repartido antes:</span>
                                <span className="text-ink-muted tabular-nums">
                                  {formatCurrency(selectedProject.yaRepartidoAntes)}
                                </span>
                              </div>
                            )}
                            {projectRepartos.length > 0 && (
                              <>
                                <div className="border-t border-line pt-1.5 mt-1.5">
                                  <p className="text-[11px] text-ink-muted mb-1">Distribución al cierre</p>
                                </div>
                                {projectRepartos.map(r => (
                                  <div key={r.id} className="flex items-center justify-between py-0.5">
                                    <span className="text-ink-muted">{r.destino} ({r.porcentaje}%):</span>
                                    <span className="font-semibold text-ink tabular-nums">
                                      {formatCurrency(r.monto)}
                                    </span>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </DataCard>
              ) : (
                <DataCard className="h-full p-8 text-center flex flex-col items-center justify-center space-y-3.5 text-ink-muted">
                  <FolderGit2 size={24} className="text-ink-muted/40" />
                  <p className="text-[13px] leading-relaxed">
                    Selecciona un proyecto de la lista para inspeccionar sus especificaciones operativas, códigos y apartados futuros.
                  </p>
                </DataCard>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
