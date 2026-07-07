/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Client, Invoice, Expense, ProviderPayment } from '../types';
import { generarReporteProyecto } from '../utils/reports';
import { 
  FileSpreadsheet, 
  Search, 
  X, 
  Briefcase, 
  FolderGit2, 
  CheckCircle, 
  Calendar,
  User,
  ExternalLink,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ReportesPanelProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  expenses: Expense[];
  providerPayments: ProviderPayment[];
}

/**
 * Módulo de Reportes (Fase 10).
 * Punto de acceso centralizado para generar reportes estructurados en Excel de proyectos.
 */
export default function ReportesPanel({
  projects = [],
  clients = [],
  invoices = [],
  expenses = [],
  providerPayments = []
}: ReportesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Helper: Find client name by ID
  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.nombre : 'Cliente Desconocido';
  };

  // Filter projects by search term (code, name, client name)
  const filteredProjects = projects.filter(project => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = getClientName(project.clienteId).toLowerCase();
    return (
      project.nombre.toLowerCase().includes(searchLower) ||
      project.codigo.toLowerCase().includes(searchLower) ||
      clientName.includes(searchLower)
    );
  });

  // Empty state if no projects are registered
  if (projects.length === 0) {
    return (
      <div id="reportes-panel-container" className="space-y-6 animate-fade-in">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Reportes Operativos
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Generador de informes financieros integrales de tus proyectos en formato Excel (.xlsx).
          </p>
        </div>

        <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center mx-auto text-rocky-gray">
            <FileSpreadsheet size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-base font-semibold text-enchanted-green dark:text-light-ivory">
              Sin Proyectos Registrados
            </h3>
            <p className="text-xs text-rocky-gray max-w-md mx-auto leading-relaxed">
              Para generar reportes y exportar información financiera consolidada, primero es necesario que crees un proyecto en el módulo correspondiente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="reportes-panel-container" className="space-y-6 animate-fade-in">
      {/* Title & Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
          Reportes Operativos
        </h2>
        <p className="text-xs text-rocky-gray mt-1">
          Busca y selecciona un proyecto para compilar y descargar su informe contable y de rentabilidad en un archivo Excel con múltiples hojas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Search & Selection List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#051A14]/60 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm p-4 space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-enchanted-green dark:text-light-ivory">
              Buscar Proyecto
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rocky-gray" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre, código o cliente..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-enchanted-green/[0.03] dark:bg-[#020D0A] border border-rocky-gray/30 dark:border-light-ivory/10 rounded-md focus:outline-none focus:border-enchanted-green dark:focus:border-elevated-gold text-enchanted-green dark:text-light-ivory font-sans transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-rocky-gray hover:text-cranberry rounded-full"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Matching Projects List */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <p className="text-center text-[11px] text-rocky-gray py-6 italic">
                  No se encontraron proyectos coincidentes.
                </p>
              ) : (
                filteredProjects.map((project) => {
                  const isSelected = selectedProject?.id === project.id;
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-enchanted-green/10 border-enchanted-green dark:border-elevated-gold dark:bg-white/5'
                          : 'bg-white/30 dark:bg-white/[0.02] border-enchanted-green/5 hover:border-enchanted-green/20 hover:bg-enchanted-green/[0.02] dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xs font-semibold text-enchanted-green dark:text-light-ivory line-clamp-1">
                          {project.nombre}
                        </span>
                        <span className="font-mono text-[9px] text-rocky-gray bg-rocky-gray/5 dark:bg-white/5 px-1 py-0.5 rounded font-bold">
                          {project.codigo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-rocky-gray mt-1">
                        <span>{getClientName(project.clienteId)}</span>
                        <span>Resp: {project.ejecutivoId}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Project Overview & Export Section */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="bg-white dark:bg-[#051A14]/60 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-enchanted-green dark:bg-elevated-gold"></div>

              {/* Project Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-elevated-gold uppercase tracking-wider font-bold">Informe de Proyecto</span>
                    <span className="text-[9px] font-mono text-rocky-gray bg-rocky-gray/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                      ID: {selectedProject.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-enchanted-green dark:text-light-ivory mt-1">
                    {selectedProject.nombre}
                  </h3>
                  <p className="text-xs text-rocky-gray mt-0.5">
                    Cliente: <strong className="text-enchanted-green dark:text-light-ivory">{getClientName(selectedProject.clienteId)}</strong>
                  </p>
                </div>

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
                  className="sm:self-center shrink-0 flex items-center justify-center space-x-2 bg-enchanted-green hover:bg-[#0C4E3A] dark:bg-elevated-gold dark:text-[#051A14] dark:hover:bg-elevated-gold/90 text-white py-2 px-5 rounded-md text-xs font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  <span>Descargar Reporte Excel</span>
                </button>
              </div>

              <hr className="border-enchanted-green/5 dark:border-white/5" />

              {/* Report Structure / Documentation of sheets */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-enchanted-green dark:text-light-ivory flex items-center gap-1.5">
                  <BookOpen size={13} className="text-rocky-gray" />
                  Estructura del Archivo Generado
                </h4>
                
                <p className="text-xs text-rocky-gray leading-relaxed">
                  El reporte Excel se compila dinámicamente y se divide en 4 pestañas de trabajo separadas que concentran la información financiera del proyecto:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="border border-enchanted-green/5 dark:border-white/5 bg-enchanted-green/[0.01] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-enchanted-green dark:text-light-ivory">
                      <div className="w-1.5 h-1.5 rounded-full bg-elevated-gold"></div>
                      <span>Hoja 1: Resumen</span>
                    </div>
                    <p className="text-[11px] text-rocky-gray leading-relaxed">
                      Sintetiza la ficha técnica, ejecutivo de cuenta, estado de facturación, costo cliente, margen de ganancia, rentabilidad y balances del IVA.
                    </p>
                  </div>

                  <div className="border border-enchanted-green/5 dark:border-white/5 bg-enchanted-green/[0.01] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-enchanted-green dark:text-light-ivory">
                      <div className="w-1.5 h-1.5 rounded-full bg-enchanted-green"></div>
                      <span>Hoja 2: Facturas</span>
                    </div>
                    <p className="text-[11px] text-rocky-gray leading-relaxed">
                      Listado completo de folios emitidos o por cobrar, detallando subtotal, IVA, retenciones impositivas, totales, métodos de pago y fechas.
                    </p>
                  </div>

                  <div className="border border-enchanted-green/5 dark:border-white/5 bg-enchanted-green/[0.01] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-enchanted-green dark:text-light-ivory">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8C7853]"></div>
                      <span>Hoja 3: Gastos</span>
                    </div>
                    <p className="text-[11px] text-rocky-gray leading-relaxed">
                      Gastos vinculados a este proyecto, con sus retenciones e IVA.
                    </p>
                  </div>

                  <div className="border border-enchanted-green/5 dark:border-white/5 bg-enchanted-green/[0.01] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-enchanted-green dark:text-light-ivory">
                      <div className="w-1.5 h-1.5 rounded-full bg-cranberry"></div>
                      <span>Hoja 4: Pagos a Proveedores</span>
                    </div>
                    <p className="text-[11px] text-rocky-gray leading-relaxed">
                      Historial detallado de pagos a proveedores, con desglose de facturación, estatus de pago y fechas de registro.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications metadata summary card */}
              <div className="bg-enchanted-green/[0.03] dark:bg-white/[0.02] border border-enchanted-green/5 dark:border-white/5 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-rocky-gray block text-[10px] uppercase font-semibold">Código</span>
                  <span className="font-mono font-bold text-enchanted-green dark:text-light-ivory">{selectedProject.codigo}</span>
                </div>
                <div>
                  <span className="text-rocky-gray block text-[10px] uppercase font-semibold">Ejecutivo</span>
                  <span className="font-bold text-enchanted-green dark:text-light-ivory">{selectedProject.ejecutivoId}</span>
                </div>
                <div>
                  <span className="text-rocky-gray block text-[10px] uppercase font-semibold">Facturas</span>
                  <span className="font-bold text-enchanted-green dark:text-light-ivory font-mono">
                    {invoices.filter(inv => inv.proyectoId === selectedProject.id).length}
                  </span>
                </div>
                <div>
                  <span className="text-rocky-gray block text-[10px] uppercase font-semibold">Gastos/Pagos</span>
                  <span className="font-bold text-enchanted-green dark:text-light-ivory font-mono">
                    {expenses.filter(exp => exp.proyectoId === selectedProject.id).length + 
                     providerPayments.filter(pay => pay.proyectoId === selectedProject.id).length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border border-dashed border-rocky-gray/30 dark:border-white/10 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-3.5 text-rocky-gray">
              <FolderGit2 size={28} className="text-rocky-gray/30 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory">Ningún Proyecto Seleccionado</p>
                <p className="text-[11px] text-rocky-gray max-w-sm mx-auto leading-relaxed">
                  Por favor, selecciona un proyecto de la columna izquierda para inspeccionar sus metadatos de integración y desencadenar la descarga del reporte.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
