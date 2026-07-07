/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Client, Invoice, ProviderPayment, Expense } from '../types';
import { 
  calculateProjectProfitability, 
  calculateClientsProfitability,
  ProjectProfitability,
  ClientProfitability 
} from '../utils/profitability';
import { 
  Search, 
  TrendingUp, 
  Coins, 
  Briefcase, 
  Users, 
  BarChart3, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface RentabilidadListProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  providerPayments: ProviderPayment[];
  expenses: Expense[];
}

/**
 * Módulo de Rentabilidad (Fase 8).
 * Vista de solo lectura y calculado de la salud financiera por Proyecto y por Cliente.
 */
export default function RentabilidadList({
  projects = [],
  clients = [],
  invoices = [],
  providerPayments = [],
  expenses = []
}: RentabilidadListProps) {
  const [activeTab, setActiveTab] = useState<'proyectos' | 'clientes'>('proyectos');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculate metrics for all projects
  const projectsData: ProjectProfitability[] = projects.map(project => {
    const client = clients.find(c => c.id === project.clienteId);
    const clientName = client ? client.nombre : 'Cliente Desconocido';
    return calculateProjectProfitability(
      project,
      clientName,
      invoices,
      providerPayments,
      expenses
    );
  });

  // 2. Calculate metrics for all clients
  const clientsData: ClientProfitability[] = calculateClientsProfitability(
    clients,
    projects,
    invoices,
    providerPayments,
    expenses
  );

  // 3. KPI calculations (aggregrated from project calculations)
  const totalCostoCliente = projectsData.reduce((sum, p) => sum + p.costoCliente, 0);
  const totalGanancia = projectsData.reduce((sum, p) => sum + p.ganancia, 0);
  
  // Average profitability percentage across all projects that have a client cost > 0
  const projectsWithRevenue = projectsData.filter(p => p.costoCliente > 0);
  const averageRentabilidad = projectsWithRevenue.length > 0
    ? Number((projectsWithRevenue.reduce((sum, p) => sum + (typeof p.porcentajeRentabilidad === 'number' ? p.porcentajeRentabilidad : 0), 0) / projectsWithRevenue.length).toFixed(1))
    : 0;

  // 4. Filtering logic
  const filteredProjects = projectsData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.proyectoNombre.toLowerCase().includes(searchLower) ||
      item.proyectoCodigo.toLowerCase().includes(searchLower) ||
      item.clienteNombre.toLowerCase().includes(searchLower)
    );
  });

  const filteredClients = clientsData.filter(item => {
    return item.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleResetFilters = () => {
    setSearchTerm('');
  };

  return (
    <div id="rentabilidad-container" className="space-y-6 animate-fade-in">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Análisis de Rentabilidad
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Consola gerencial de rentabilidad basada en subtotales de facturas, pagos a proveedores y gastos vinculados.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ganancia Total */}
        <div id="kpi-rentabilidad-ganancia" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Ganancia Total Acumulada</p>
            <p className={`text-2xl font-mono font-bold ${totalGanancia >= 0 ? 'text-enchanted-green dark:text-light-ivory' : 'text-cranberry'}`}>
              {formatCurrency(totalGanancia)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span>Margen neto consolidado</span>
            <Coins size={14} className="text-enchanted-green dark:text-light-ivory" />
          </div>
        </div>

        {/* Costo Cliente Total (Revenue) */}
        <div id="kpi-rentabilidad-costo-cliente" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Facturado Clientes (Subtotales)</p>
            <p className="text-2xl font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2]">
              {formatCurrency(totalCostoCliente)}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span>Suma de facturas sin IVA</span>
            <FileSpreadsheet size={14} className="text-[#0B3D2E] dark:text-elevated-gold" />
          </div>
        </div>

        {/* Rentabilidad Promedio */}
        <div id="kpi-rentabilidad-promedio" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Rentabilidad Promedio</p>
            <p className="text-2xl font-mono font-bold text-[#8C7853] dark:text-elevated-gold">
              {averageRentabilidad}%
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span>Promedio de proyectos activos</span>
            <TrendingUp size={14} className="text-[#8C7853] dark:text-elevated-gold" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search Bar */}
      <div className="bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-enchanted-green/5 dark:bg-white/5 p-1 rounded-md self-start">
            <button
              onClick={() => {
                setActiveTab('proyectos');
                setSearchTerm('');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === 'proyectos'
                  ? 'bg-enchanted-green dark:bg-elevated-gold text-white dark:text-[#051A14] shadow-sm'
                  : 'text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory'
              }`}
            >
              <Briefcase size={14} />
              <span>Por Proyecto</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('clientes');
                setSearchTerm('');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === 'clientes'
                  ? 'bg-enchanted-green dark:bg-elevated-gold text-white dark:text-[#051A14] shadow-sm'
                  : 'text-rocky-gray hover:text-enchanted-green dark:hover:text-light-ivory'
              }`}
            >
              <Users size={14} />
              <span>Por Cliente</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-rocky-gray/60 dark:text-light-ivory/40" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'proyectos' ? "Buscar proyecto o cliente..." : "Buscar cliente..."}
              className="w-full bg-enchanted-green/5 dark:bg-white/5 border border-enchanted-green/10 dark:border-white/10 rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-enchanted-green dark:focus:ring-elevated-gold text-enchanted-green dark:text-light-ivory"
            />
          </div>
        </div>

        {/* Content tables */}
        {activeTab === 'proyectos' ? (
          /* POR PROYECTO TABLE */
          <div className="overflow-x-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center mx-auto text-rocky-gray">
                  <AlertCircle size={20} />
                </div>
                <p className="text-xs text-rocky-gray">No se encontraron proyectos con facturas o gastos registrados.</p>
                {searchTerm && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-enchanted-green dark:text-elevated-gold hover:underline"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] text-[10px] uppercase font-bold text-rocky-gray tracking-wider border-b border-enchanted-green/5 dark:border-white/5">
                    <th className="px-6 py-3.5">Proyecto</th>
                    <th className="px-6 py-3.5">Cliente</th>
                    <th className="px-6 py-3.5 text-right">Costo Cliente (Facturado)</th>
                    <th className="px-6 py-3.5 text-right">Costo Proveedor</th>
                    <th className="px-6 py-3.5 text-right">Gastos Proveedor Vinc.</th>
                    <th className="px-6 py-3.5 text-right">Ganancia</th>
                    <th className="px-6 py-3.5 text-right">Rentabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5 text-xs">
                  {filteredProjects.map((item) => {
                    const isProfitNegative = item.ganancia < 0;
                    return (
                      <tr 
                        key={item.proyectoId} 
                        className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-enchanted-green dark:text-light-ivory">
                          <span className="font-mono text-[10px] bg-enchanted-green/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-rocky-gray mr-2">
                            {item.proyectoCodigo}
                          </span>
                          {item.proyectoNombre}
                        </td>
                        <td className="px-6 py-4 text-rocky-gray dark:text-light-ivory/80">
                          {item.clienteNombre}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rocky-gray dark:text-light-ivory/80">
                          {formatCurrency(item.costoCliente)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rocky-gray dark:text-light-ivory/80">
                          {formatCurrency(item.costoProveedor)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rocky-gray dark:text-light-ivory/80">
                          {formatCurrency(item.gastosProveedorVinculados)}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-semibold ${isProfitNegative ? 'text-cranberry' : 'text-enchanted-green dark:text-light-ivory'}`}>
                          {formatCurrency(item.ganancia)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.porcentajeRentabilidad === 'N/A' ? (
                            <span className="text-[10px] text-rocky-gray/60 dark:text-light-ivory/40 bg-rocky-gray/5 dark:bg-white/5 px-2 py-0.5 rounded font-semibold">
                              N/A
                            </span>
                          ) : (
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              item.porcentajeRentabilidad < 10 
                                ? 'bg-cranberry/10 text-cranberry' 
                                : item.porcentajeRentabilidad < 30 
                                  ? 'bg-[#8C7853]/15 text-[#8C7853] dark:text-elevated-gold' 
                                  : 'bg-enchanted-green/10 text-enchanted-green dark:text-light-ivory'
                            }`}>
                              {item.porcentajeRentabilidad}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* POR CLIENTE TABLE */
          <div className="overflow-x-auto">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center mx-auto text-rocky-gray">
                  <AlertCircle size={20} />
                </div>
                <p className="text-xs text-rocky-gray">No se encontraron clientes registrados con proyectos.</p>
                {searchTerm && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-enchanted-green dark:text-elevated-gold hover:underline"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] text-[10px] uppercase font-bold text-rocky-gray tracking-wider border-b border-enchanted-green/5 dark:border-white/5">
                    <th className="px-6 py-3.5">Cliente</th>
                    <th className="px-6 py-3.5 text-center">Nº de Proyectos</th>
                    <th className="px-6 py-3.5 text-right">Costo Cliente Acumulado</th>
                    <th className="px-6 py-3.5 text-right">Costo Proveedor Acumulado</th>
                    <th className="px-6 py-3.5 text-right">Gastos Proveedor Vinc. Acumulado</th>
                    <th className="px-6 py-3.5 text-right">Ganancia Total Acumulada</th>
                    <th className="px-6 py-3.5 text-right">Rentabilidad Acumulada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5 text-xs">
                  {filteredClients.map((item) => {
                    const isProfitNegative = item.gananciaTotal < 0;
                    return (
                      <tr 
                        key={item.clienteId} 
                        className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-enchanted-green dark:text-light-ivory">
                          {item.clienteNombre}
                        </td>
                        <td className="px-6 py-4 text-center text-rocky-gray dark:text-light-ivory/80 font-mono font-semibold">
                          {item.numeroProyectos}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rocky-gray dark:text-light-ivory/80">
                          {formatCurrency(item.costoClienteTotal)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rocky-gray dark:text-light-ivory/80">
                          {formatCurrency(item.costoProveedorTotal)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-rocky-gray dark:text-light-ivory/80">
                          {formatCurrency(item.gastosProveedorVinculadosTotal)}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-semibold ${isProfitNegative ? 'text-cranberry' : 'text-enchanted-green dark:text-light-ivory'}`}>
                          {formatCurrency(item.gananciaTotal)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.porcentajeRentabilidad === 'N/A' ? (
                            <span className="text-[10px] text-rocky-gray/60 dark:text-light-ivory/40 bg-rocky-gray/5 dark:bg-white/5 px-2 py-0.5 rounded font-semibold">
                              N/A
                            </span>
                          ) : (
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              item.porcentajeRentabilidad < 10 
                                ? 'bg-cranberry/10 text-cranberry' 
                                : item.porcentajeRentabilidad < 30 
                                  ? 'bg-[#8C7853]/15 text-[#8C7853] dark:text-elevated-gold' 
                                  : 'bg-enchanted-green/10 text-enchanted-green dark:text-light-ivory'
                            }`}>
                              {item.porcentajeRentabilidad}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
