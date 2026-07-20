/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Sparkles, 
  User, 
  Calendar, 
  ArrowRight, 
  X,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Award,
  Zap,
  UsersRound
} from 'lucide-react';
import { Client, Project, Invoice, Expense, ProviderPayment, ProfitDistribution, PorImpactar, ThirdPartyPayment } from '../types';
import { calculateProjectBillingStatus, formatCurrency, getDueDateIndicator } from '../utils';
import { calculateProjectProfitability } from '../utils/profitability';
import { generarReporteProyecto } from '../utils/reports';

interface ProyectosListProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  providerPayments?: ProviderPayment[];
  profitDistributions?: ProfitDistribution[];
  porImpactar?: PorImpactar[];
  thirdPartyPayments?: ThirdPartyPayment[];
  onAddClick: () => void;
  onEditClick: (project: Project) => void;
  onDeleteClick: (id: string) => void;
}

/**
 * Lists registered projects, allows filtering and shows their details, edit and delete actions.
 */
export default function ProyectosList({
  projects,
  clients,
  invoices,
  expenses,
  providerPayments = [],
  profitDistributions = [],
  porImpactar = [],
  thirdPartyPayments = [],
  onAddClick,
  onEditClick,
  onDeleteClick
}: ProyectosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to render dynamic, color-coded billing status badge
  const renderBillingStatusBadge = (projId: string) => {
    const status = calculateProjectBillingStatus(projId, invoices);
    switch (status) {
      case 'Pagado':
        return (
          <span className="bg-[#0B3D2E]/10 dark:bg-[#8C7853]/20 text-[#0B3D2E] dark:text-elevated-gold px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
            Pagado
          </span>
        );
      case 'Facturado':
        return (
          <span className="bg-elevated-gold/20 text-[#8C7853] dark:text-[#DFBDB5] px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
            Facturado
          </span>
        );
      default:
        return (
          <span className="bg-rose-linen/40 dark:bg-rose-linen/15 text-cranberry dark:text-rose-linen px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase">
            Sin facturar
          </span>
        );
    }
  };

  // Helper to resolve client name by ID
  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nombre : 'Cliente Desconocido';
  };

  // Helper to resolve client details by ID
  const getClient = (clientId: string): Client | undefined => {
    return clients.find(c => c.id === clientId);
  };

  // Filtering projects based on search criteria (nombre, codigo, or client's name)
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

  return (
    <div className="space-y-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-enchanted-green dark:text-light-ivory">
            Proyectos Registrados
          </h2>
          <p className="text-xs text-rocky-gray dark:text-rose-linen/80">
            Control de códigos operativos, asignaciones de ejecutivo y estatus de facturación.
          </p>
        </div>

        {totalProjects > 0 && (
          <button
            id="header-add-project-btn"
            onClick={onAddClick}
            className="bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-all text-xs uppercase tracking-wider font-bold py-2.5 px-5 rounded shadow-sm flex items-center space-x-1.5"
          >
            <Plus size={14} />
            <span>Registrar Proyecto</span>
          </button>
        )}
      </div>

      {totalProjects === 0 ? (
        /* GORGEOUS EMPTY STATE */
        <div className="max-w-2xl mx-auto my-12 text-center p-8 md:p-12 bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold"></div>
          
          <div className="mx-auto w-16 h-16 rounded-full bg-enchanted-green/5 dark:bg-light-ivory/5 flex items-center justify-center text-elevated-gold mb-6">
            <FolderGit2 size={32} />
          </div>

          <h3 className="text-xl font-serif font-semibold text-enchanted-green dark:text-light-ivory mb-3">
            Sin Proyectos Activos
          </h3>
          
          <p className="text-xs text-rocky-gray dark:text-rose-linen/80 max-w-md mx-auto leading-relaxed mb-8">
            Aquí se gestionarán los códigos de proyecto, ejecutivos a cargo e integraciones de facturación. Comienza dando de alta tu primer proyecto operativo vinculándolo a un cliente existente.
          </p>

          <div className="flex justify-center">
            <button
              id="empty-state-add-project-btn"
              onClick={onAddClick}
              className="w-full sm:w-auto bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-all text-xs uppercase tracking-wider font-bold py-3 px-8 rounded shadow-md flex items-center justify-center space-x-2"
            >
              <Plus size={14} />
              <span>Registrar Primer Proyecto</span>
            </button>
          </div>
        </div>
      ) : (
        /* CONTENT LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Table Side (Left/Center) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm">
                <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-enchanted-green dark:bg-elevated-gold"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-wider uppercase text-rocky-gray dark:text-rose-linen font-bold">Proyectos Totales</p>
                    <p className="text-2xl font-serif font-bold text-enchanted-green dark:text-light-ivory mt-1">{totalProjects}</p>
                  </div>
                  <FolderGit2 className="text-enchanted-green/20 dark:text-light-ivory/20" size={28} />
                </div>
              </div>

              <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm">
                <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-elevated-gold"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-wider uppercase text-rocky-gray dark:text-rose-linen font-bold">Asignaciones San</p>
                    <p className="text-2xl font-serif font-bold text-enchanted-green dark:text-light-ivory mt-1">{activeSan}</p>
                  </div>
                  <User className="text-elevated-gold/30" size={28} />
                </div>
              </div>

              <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm">
                <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-rose-linen"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-wider uppercase text-rocky-gray dark:text-rose-linen font-bold">Asignaciones Ale</p>
                    <p className="text-2xl font-serif font-bold text-enchanted-green dark:text-light-ivory mt-1">{activeAle}</p>
                  </div>
                  <User className="text-rose-linen/40" size={28} />
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white/30 dark:bg-[#0E1A16]/30 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg overflow-hidden shadow-md">
              {/* Table Search Header */}
              <div className="p-4 border-b border-rocky-gray/20 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search size={14} className="absolute left-1 top-1/2 -translate-y-1/2 text-rocky-gray" />
                  <input
                    id="project-search-input"
                    type="text"
                    placeholder="Buscar por nombre, código o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-b border-rocky-gray/60 focus:border-elevated-gold dark:focus:border-elevated-gold py-2 pl-7 pr-3 text-sm focus:outline-none transition-colors placeholder:text-rocky-gray placeholder:italic text-enchanted-green dark:text-light-ivory"
                  />
                </div>

                <div className="text-[10px] uppercase font-bold tracking-wider text-rocky-gray">
                  Mostrando {filteredProjects.length} de {totalProjects} proyectos
                </div>
              </div>

              {/* Responsive List & Table */}
              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center text-rocky-gray italic text-xs">
                  Ningún proyecto coincide con la búsqueda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F2E9DF]/50 dark:bg-[#070D0C]/50 border-b border-rocky-gray/30 dark:border-white/10 font-serif italic text-sm text-[#0B3D2E]/80 dark:text-light-ivory/80">
                        <th className="px-6 py-4 font-medium">Proyecto</th>
                        <th className="px-6 py-4 font-medium">Cliente</th>
                        <th className="px-6 py-4 font-medium">Ejecutivo</th>
                        <th className="px-6 py-4 font-medium">Facturación</th>
                        <th className="px-6 py-4 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5 text-sm">
                      {filteredProjects.map((project) => {
                        const isSelected = selectedProject?.id === project.id;
                        return (
                          <tr 
                            key={project.id}
                            className={`hover:bg-enchanted-green/5 dark:hover:bg-white/5 transition-colors group ${
                              isSelected ? 'bg-enchanted-green/5 dark:bg-white/5' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="font-serif font-semibold text-enchanted-green dark:text-light-ivory">
                                {project.nombre}
                              </div>
                              <div className="text-[10px] font-mono text-rocky-gray mt-0.5 tracking-tight">
                                {project.codigo}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium">
                              {getClientName(project.clienteId)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                project.ejecutivoId === 'San' 
                                  ? 'bg-[#0B3D2E]/10 dark:bg-[#0B3D2E]/20 text-[#0B3D2E] dark:text-light-ivory' 
                                  : 'bg-elevated-gold/15 text-elevated-gold'
                              }`}>
                                {project.ejecutivoId}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {renderBillingStatusBadge(project.id)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {deleteConfirmId === project.id ? (
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-[10px] text-cranberry font-bold uppercase animate-pulse">¿Confirmar?</span>
                                  <button
                                    onClick={() => {
                                      onDeleteClick(project.id);
                                      if (selectedProject?.id === project.id) {
                                        setSelectedProject(null);
                                      }
                                      setDeleteConfirmId(null);
                                    }}
                                    className="p-1 text-cranberry hover:bg-cranberry/10 rounded"
                                    title="Confirmar eliminación"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-1 text-rocky-gray hover:bg-rocky-gray/10 rounded text-xs font-bold"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setSelectedProject(project)}
                                    className="p-1.5 text-enchanted-green/70 dark:text-light-ivory/70 hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/10 dark:hover:bg-white/10 rounded transition-all"
                                    title="Ver Detalles"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => onEditClick(project)}
                                    className="p-1.5 text-elevated-gold hover:text-elevated-gold/80 hover:bg-elevated-gold/10 rounded transition-all"
                                    title="Editar"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(project.id)}
                                    className="p-1.5 text-cranberry/70 hover:text-cranberry hover:bg-cranberry/10 rounded transition-all"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Details Column (Right Side) */}
          <div className="lg:col-span-1">
            {selectedProject ? (
              <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-lg relative overflow-hidden p-6 space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold"></div>
                
                {/* Detail Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-elevated-gold uppercase tracking-wider font-bold">Ficha de Proyecto</span>
                    <h3 className="text-lg font-serif font-semibold text-enchanted-green dark:text-light-ivory mt-0.5">
                      {selectedProject.nombre}
                    </h3>
                    <p className="text-xs font-mono text-rocky-gray mt-1">{selectedProject.codigo}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-1 text-rocky-gray hover:text-cranberry dark:hover:text-[#DFBDB5] hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <hr className="border-rocky-gray/20 dark:border-white/5" />

                {/* Core Specifications */}
                <div className="space-y-3.5">
                  <div>
                    <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-bold">Cliente Contratante</p>
                    <p className="text-sm font-semibold text-enchanted-green dark:text-light-ivory mt-1">
                      {getClientName(selectedProject.clienteId)}
                    </p>
                    {getClient(selectedProject.clienteId)?.razonSocial && (
                      <p className="text-xs text-rocky-gray mt-0.5">
                        {getClient(selectedProject.clienteId)?.razonSocial} • RFC: {getClient(selectedProject.clienteId)?.rfc}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-bold">Responsable</p>
                      <p className="text-sm font-semibold text-enchanted-green dark:text-light-ivory mt-1">
                        {selectedProject.ejecutivoId}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-bold">Creado El</p>
                      <p className="text-sm text-enchanted-green dark:text-light-ivory mt-1 font-mono">
                        {selectedProject.fechaCreacion}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-rocky-gray dark:text-rose-linen uppercase tracking-wider font-bold">Estatus Operativo</p>
                    <div className="mt-1.5">
                      {renderBillingStatusBadge(selectedProject.id)}
                    </div>
                  </div>

                  {/* Descargar Reporte Button */}
                  <div className="pt-2">
                    <button
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
                      className="w-full flex items-center justify-center space-x-2 bg-enchanted-green hover:bg-[#0C4E3A] dark:bg-elevated-gold dark:text-[#051A14] dark:hover:bg-elevated-gold/90 text-white py-2 px-4 rounded-md text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Descargar Reporte Excel</span>
                    </button>
                  </div>
                </div>

                <hr className="border-rocky-gray/20 dark:border-white/5" />

                {/* Reserved Sections "Próximamente" */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-enchanted-green dark:text-light-ivory">
                    Integración y Métricas
                  </h4>

                  {/* Facturas vinculadas */}
                  {(() => {
                    const projectInvoices = invoices.filter(inv => inv.proyectoId === selectedProject.id);
                    if (projectInvoices.length === 0) {
                      return (
                        <div className="bg-enchanted-green/5 dark:bg-white/5 rounded p-3 border border-enchanted-green/10 dark:border-white/5 relative overflow-hidden">
                          <div className="flex items-start space-x-2.5">
                            <Receipt size={16} className="text-rocky-gray mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80">Facturas vinculadas</p>
                              <p className="text-[10px] text-rocky-gray mt-1">Sin facturas registradas para este proyecto.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/10 dark:border-light-ivory/10 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5 mb-1">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <Receipt size={14} className="text-elevated-gold" />
                            <span>Facturas vinculadas ({projectInvoices.length})</span>
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {projectInvoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between text-xs p-2 bg-enchanted-green/[0.03] dark:bg-white/[0.03] rounded border border-enchanted-green/5">
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">{inv.folio}</span>
                                <span className="text-[10px] text-rocky-gray block">{inv.fechaEmision} • {inv.metodoPago}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory block">
                                  {formatCurrency(inv.total)}
                                </span>
                                {inv.estado === 'pagada' ? (
                                  <span className="text-[9px] uppercase font-bold text-[#0B3D2E] dark:text-elevated-gold">Pagada</span>
                                ) : (
                                  <span className="text-[9px] uppercase font-bold text-cranberry">Facturada</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Gastos de proveedor vinculados */}
                  {(() => {
                    const projectExpenses = expenses.filter(
                      exp => exp.proyectoId === selectedProject.id && exp.tipo === 'Proveedor por Proyecto'
                    );
                    if (projectExpenses.length === 0) {
                      return (
                        <div className="bg-enchanted-green/5 dark:bg-white/5 rounded p-3 border border-enchanted-green/10 dark:border-white/5 relative overflow-hidden">
                          <div className="flex items-start space-x-2.5">
                            <FileSpreadsheet size={16} className="text-rocky-gray mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80">Gastos vinculados</p>
                              <p className="text-[10px] text-rocky-gray mt-1">Sin gastos de proveedor registrados para este proyecto.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/10 dark:border-light-ivory/10 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5 mb-1">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <FileSpreadsheet size={14} className="text-elevated-gold" />
                            <span>Gastos de proveedor ({projectExpenses.length})</span>
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {projectExpenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between text-xs p-2 bg-enchanted-green/[0.03] dark:bg-white/[0.03] rounded border border-enchanted-green/5">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-enchanted-green dark:text-light-ivory">{exp.concepto}</span>
                                <span className="text-[10px] text-rocky-gray block">{exp.fecha} • {exp.categoriaId}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory block">
                                  {formatCurrency(exp.total)}
                                </span>
                                {exp.estatusPago === 'Pagado' ? (
                                  <span className="text-[9px] uppercase font-bold text-[#0B3D2E] dark:text-elevated-gold">Pagado</span>
                                ) : (
                                  <span className="text-[9px] uppercase font-bold text-cranberry font-mono">Pendiente</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pagos a Proveedores vinculados */}
                  {(() => {
                    const projectProviderPayments = (providerPayments || []).filter(
                      pay => pay.proyectoId === selectedProject.id
                    );
                    if (projectProviderPayments.length === 0) {
                      return (
                        <div className="bg-enchanted-green/5 dark:bg-white/5 rounded p-3 border border-enchanted-green/10 dark:border-white/5 relative overflow-hidden">
                          <div className="flex items-start space-x-2.5">
                            <FileCheck size={16} className="text-rocky-gray mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80">Pagos a Proveedores vinculados</p>
                              <p className="text-[10px] text-rocky-gray mt-1">Sin pagos a proveedores registrados para este proyecto.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/10 dark:border-light-ivory/10 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5 mb-1">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <FileCheck size={14} className="text-elevated-gold" />
                            <span>Pagos a Proveedores ({projectProviderPayments.length})</span>
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {projectProviderPayments.map(pay => {
                            const indicator = getDueDateIndicator(pay.estatus, pay.fecha_vencimiento);
                            return (
                              <div key={pay.id} className="flex items-center justify-between text-xs p-2 bg-enchanted-green/[0.03] dark:bg-white/[0.03] rounded border border-enchanted-green/5">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-enchanted-green dark:text-light-ivory block">{pay.proveedor}</span>
                                  <div className="flex flex-col gap-0.5 text-[10px] text-rocky-gray">
                                    <span>{pay.fecha}</span>
                                    {pay.fecha_vencimiento && pay.estatus === 'Pendiente' && (
                                      <span className="font-mono">Vence: {pay.fecha_vencimiento}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory block">
                                    {formatCurrency(pay.total)}
                                  </span>
                                  <div className="flex flex-col items-end gap-1 mt-0.5">
                                    {pay.estatus === 'Pagado' ? (
                                      <span className="text-[9px] uppercase font-bold text-[#0B3D2E] dark:text-elevated-gold">Pagado</span>
                                    ) : (
                                      <>
                                        <span className="text-[9px] uppercase font-bold text-cranberry font-mono">Pendiente</span>
                                        {indicator && (
                                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                            indicator.type === 'future'
                                              ? 'text-rocky-gray dark:text-rose-linen/50'
                                              : indicator.type === 'today'
                                                ? 'text-cranberry dark:text-rose-linen bg-cranberry/10 border border-cranberry/20'
                                                : 'text-white bg-cranberry shadow-sm'
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

                  {/* Por Impactar resueltos vinculados */}
                  {(() => {
                    const projectPorImpactar = (porImpactar || []).filter(
                      pay => pay.proyectoDestinoId === selectedProject.id && pay.estatus === 'resuelto'
                    );
                    if (projectPorImpactar.length === 0) {
                      return (
                        <div className="bg-enchanted-green/5 dark:bg-white/5 rounded p-3 border border-enchanted-green/10 dark:border-white/5 relative overflow-hidden">
                          <div className="flex items-start space-x-2.5">
                            <Zap size={16} className="text-rocky-gray mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80">Por Impactar resueltos</p>
                              <p className="text-[10px] text-rocky-gray mt-1">Sin registros resueltos vinculados a este proyecto.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/10 dark:border-light-ivory/10 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5 mb-1">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <Zap size={14} className="text-elevated-gold animate-pulse" />
                            <span>Por Impactar resueltos ({projectPorImpactar.length})</span>
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {projectPorImpactar.map(pay => (
                            <div key={pay.id} className="flex items-center justify-between text-xs p-2 bg-enchanted-green/[0.03] dark:bg-white/[0.03] rounded border border-enchanted-green/5">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-enchanted-green dark:text-light-ivory">{pay.descripcion}</span>
                                <span className="text-[10px] text-rocky-gray block">{pay.fecha} • {pay.socioResponsable}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory block">
                                  {formatCurrency(pay.monto)}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-[#0B3D2E] dark:text-elevated-gold">Resuelto</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pagos a Terceros vinculados */}
                  {(() => {
                    const projectThirdPartyPayments = (thirdPartyPayments || []).filter(
                      pay => pay.proyectoId === selectedProject.id
                    );
                    if (projectThirdPartyPayments.length === 0) {
                      return (
                        <div className="bg-enchanted-green/5 dark:bg-white/5 rounded p-3 border border-enchanted-green/10 dark:border-white/5 relative overflow-hidden">
                          <div className="flex items-start space-x-2.5">
                            <UsersRound size={16} className="text-rocky-gray mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80">Pagos a Terceros vinculados</p>
                              <p className="text-[10px] text-rocky-gray mt-1">Sin registros vinculados a este proyecto.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/10 dark:border-light-ivory/10 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5 mb-1">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <UsersRound size={14} className="text-elevated-gold" />
                            <span>Pagos a Terceros ({projectThirdPartyPayments.length})</span>
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {projectThirdPartyPayments.map(pay => (
                            <div key={pay.id} className="flex items-center justify-between text-xs p-2 bg-enchanted-green/[0.03] dark:bg-white/[0.03] rounded border border-enchanted-green/5">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-enchanted-green dark:text-light-ivory">{pay.concepto}</span>
                                <div className="text-[10px] text-rocky-gray space-y-0.5">
                                  <span>{pay.fecha}</span>
                                  <div className="flex items-center space-x-1.5">
                                    <span>Saldo Orig: {formatCurrency(pay.saldoOriginal)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory block">
                                  {formatCurrency(pay.montoADepositar)}
                                </span>
                                {pay.estatusPago === 'Pagado' ? (
                                  <span className="text-[9px] uppercase font-bold text-[#0B3D2E] dark:text-elevated-gold">Pagado</span>
                                ) : (
                                  <span className="text-[9px] uppercase font-bold text-cranberry font-mono">Pendiente</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reparto de Utilidades */}
                  {(() => {
                    const projectDists = (profitDistributions || []).filter(
                      pd => pd.proyectoId === selectedProject.id
                    );
                    
                    if (projectDists.length === 0) {
                      return (
                        <div className="bg-elevated-gold/[0.04] dark:bg-white/5 rounded p-3.5 border border-elevated-gold/25 dark:border-white/5 relative overflow-hidden">
                          <div className="flex items-start space-x-2.5">
                            <Award size={16} className="text-[#8C7853] dark:text-elevated-gold mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-enchanted-green/80 dark:text-light-ivory/80 flex items-center gap-1.5">
                                <span>Reparto de Utilidades</span>
                                <span className="bg-elevated-gold/15 text-[#8C7853] dark:text-elevated-gold text-[8px] font-bold px-1 rounded uppercase tracking-wider">Pendiente</span>
                              </p>
                              <p className="text-[10px] text-rocky-gray mt-1 leading-relaxed">
                                Pendiente — se genera automáticamente cuando el proyecto esté completamente pagado (todas sus facturas en estado "Pagada").
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <Award size={14} className="text-elevated-gold animate-pulse" />
                            <span>Historial de Reparto de Utilidades ({projectDists.length})</span>
                          </p>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {projectDists.map((dist, idx) => (
                            <div 
                              key={dist.id} 
                              className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/15 dark:border-light-ivory/15 p-3 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold text-[#8C7853] dark:text-elevated-gold uppercase tracking-wider pb-1 border-b border-rocky-gray/5">
                                <span>Reparto #{idx + 1}</span>
                                <span>{dist.fechaCreacion}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs py-0.5">
                                  <span className="text-rocky-gray">Utilidad Operativa (Neto):</span>
                                  <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">
                                    {formatCurrency(dist.gananciaTotal)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] py-0.5">
                                  <span className="text-rocky-gray">Dueño (65%):</span>
                                  <span className="font-mono font-semibold text-[#0B3D2E] dark:text-[#EAE3D2]">
                                    {formatCurrency(dist.gananciaDueno)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] py-0.5">
                                  <span className="text-rocky-gray">Ejecutivo (30%/35%):</span>
                                  <span className="font-mono font-semibold text-[#8C7853] dark:text-elevated-gold">
                                    {formatCurrency(dist.gananciaEjecutivo)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] py-0.5">
                                  <span className="text-rocky-gray">Fondo Diploma (5%):</span>
                                  <span className="font-mono font-semibold text-enchanted-green dark:text-light-ivory">
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

                  {/* Rentabilidad */}
                  {(() => {
                    const metrics = calculateProjectProfitability(
                      selectedProject,
                      getClientName(selectedProject.clienteId),
                      invoices,
                      providerPayments,
                      expenses
                    );
                    const isProfitNegative = metrics.ganancia < 0;
                    return (
                      <div className="bg-white/50 dark:bg-black/20 rounded border border-enchanted-green/10 dark:border-light-ivory/10 p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-rocky-gray/10 pb-1.5 mb-1">
                          <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-elevated-gold" />
                            <span>Rentabilidad del Proyecto</span>
                          </p>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-rocky-gray">Costo Cliente (Facturado):</span>
                            <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">
                              {formatCurrency(metrics.costoCliente)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-rocky-gray">Costo Proveedor:</span>
                            <span className="font-mono text-rocky-gray dark:text-light-ivory/80">
                              {formatCurrency(metrics.costoProveedor)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-rocky-gray">Gastos Proveedor Vinc.:</span>
                            <span className="font-mono text-rocky-gray dark:text-light-ivory/80">
                              {formatCurrency(metrics.gastosProveedorVinculados)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-rocky-gray/5 pt-1 mt-1 font-bold">
                            <span className="text-enchanted-green dark:text-light-ivory">Ganancia Neta:</span>
                            <span className={`font-mono ${isProfitNegative ? 'text-cranberry' : 'text-enchanted-green dark:text-light-ivory'}`}>
                              {formatCurrency(metrics.ganancia)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-rocky-gray font-semibold">Porcentaje Rentabilidad:</span>
                            {metrics.porcentajeRentabilidad === 'N/A' ? (
                              <span className="text-[10px] text-rocky-gray/60 dark:text-light-ivory/40 bg-rocky-gray/5 dark:bg-white/5 px-1.5 py-0.5 rounded font-semibold">
                                N/A
                              </span>
                            ) : (
                              <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                                metrics.porcentajeRentabilidad < 10 
                                  ? 'bg-cranberry/10 text-cranberry' 
                                  : metrics.porcentajeRentabilidad < 30 
                                    ? 'bg-[#8C7853]/15 text-[#8C7853] dark:text-elevated-gold' 
                                    : 'bg-enchanted-green/10 text-enchanted-green dark:text-light-ivory'
                              }`}>
                                {metrics.porcentajeRentabilidad}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            ) : (
              <div className="h-full border border-dashed border-rocky-gray/30 dark:border-white/10 rounded-lg p-8 text-center flex flex-col items-center justify-center space-y-3.5 text-rocky-gray">
                <FolderGit2 size={24} className="text-rocky-gray/40" />
                <p className="text-xs italic leading-relaxed">
                  Selecciona un proyecto de la lista para inspeccionar sus especificaciones operativas, códigos y apartados futuros.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
