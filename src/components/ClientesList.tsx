/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, CreditCard as Edit3, Trash2, UserPlus, FileCheck2, PhoneCall, Grid2x2 as Grid, List, TriangleAlert as AlertTriangle, RefreshCw, FolderOpen } from 'lucide-react';
import { Client } from '../types';

interface ClientesListProps {
  clients: Client[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (client: Client) => void;
  onDeleteClick: (id: string) => void;
}

export default function ClientesList({
  clients,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick
}: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter clients by commercial name
  const filteredClients = clients.filter(client => 
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = (id: string) => {
    onDeleteClick(id);
    setDeleteConfirmId(null);
  };

  // KPI Calculations
  const totalClients = clients.length;
  const clientsWithRFC = clients.filter(c => !!c.rfc).length;
  const clientsWithContact = clients.filter(c => !!c.contacto).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Module Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-enchanted-green/10 dark:border-light-ivory/10 pb-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-light text-enchanted-green dark:text-light-ivory">
            Catálogo de Clientes
          </h1>
          <p className="text-xs text-[#535555] dark:text-rose-linen/80 mt-1">
            Gestión interna de expedientes comerciales y fiscales de contratantes.
          </p>
        </div>

        {totalClients > 0 && (
          <button
            id="add-client-top-btn"
            onClick={onAddClick}
            className="self-start sm:self-center bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-colors font-medium text-xs uppercase tracking-wider py-2.5 px-4 rounded flex items-center space-x-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>Agregar Cliente</span>
          </button>
        )}
      </div>

      {/* Main Condition: Loading, Empty State or Data State */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-pulse text-enchanted-green dark:text-light-ivory text-sm tracking-wide">
            Cargando clientes…
          </div>
        </div>
      ) : totalClients === 0 ? (
        /* GORGEOUS EMPTY STATE (Designed strictly as requested) */
        <div className="max-w-2xl mx-auto my-12 text-center p-8 md:p-12 bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-elevated-gold"></div>
          
          <div className="mx-auto w-16 h-16 rounded-full bg-enchanted-green/5 dark:bg-light-ivory/5 flex items-center justify-center text-elevated-gold mb-6">
            <UserPlus size={32} />
          </div>

          <h2 className="text-3xl font-serif font-light text-enchanted-green dark:text-light-ivory mb-3">
            No hay clientes registrados
          </h2>
          
          <p className="text-sm text-rocky-gray dark:text-rose-linen/80 max-w-md mx-auto mb-8 leading-relaxed">
            Comienza a construir tu catálogo interno de clientes contratantes. Esta información servirá como base unificada para registrar proyectos, emitir facturación y calcular indicadores de IVA y rentabilidad.
          </p>

          <div className="flex justify-center">
            <button
              id="empty-state-add-btn"
              onClick={onAddClick}
              className="w-full sm:w-auto bg-enchanted-green dark:bg-elevated-gold text-light-ivory dark:text-[#070D0C] hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 transition-all text-xs uppercase tracking-wider font-bold py-3 px-8 rounded shadow-md flex items-center justify-center space-x-2"
            >
              <Plus size={14} />
              <span>Registrar Primer Cliente</span>
            </button>
          </div>
        </div>
      ) : (
        /* DATA STATE WITH KPIs & TABLE */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1 */}
            <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm">
              <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-enchanted-green dark:bg-elevated-gold"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-rocky-gray dark:text-rose-linen/70 font-semibold">
                    Clientes Registrados
                  </p>
                  <h3 className="text-2xl font-serif font-semibold text-enchanted-green dark:text-light-ivory mt-1">
                    {totalClients}
                  </h3>
                </div>
                <div className="p-2 bg-enchanted-green/5 dark:bg-light-ivory/5 text-enchanted-green dark:text-elevated-gold rounded">
                  <FolderOpen size={18} />
                </div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm">
              <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-elevated-gold"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#3f3f3f] dark:text-rose-linen/70 font-semibold">
                    RFCs Vinculados
                  </p>
                  <h3 className="text-2xl font-serif font-semibold text-enchanted-green dark:text-light-ivory mt-1">
                    {clientsWithRFC} <span className="text-xs text-rocky-gray font-sans font-normal">/ {totalClients}</span>
                  </h3>
                </div>
                <div className="p-2 bg-enchanted-green/5 dark:bg-light-ivory/5 text-enchanted-green dark:text-elevated-gold rounded">
                  <FileCheck2 size={18} />
                </div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded p-5 relative shadow-sm">
              <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-rose-linen"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-rocky-gray dark:text-rose-linen/70 font-semibold">
                    Contactos de Enlace
                  </p>
                  <h3 className="text-2xl font-serif font-semibold text-enchanted-green dark:text-light-ivory mt-1">
                    {clientsWithContact} <span className="text-xs text-rocky-gray font-sans font-normal">/ {totalClients}</span>
                  </h3>
                </div>
                <div className="p-2 bg-enchanted-green/5 dark:bg-light-ivory/5 text-enchanted-green dark:text-elevated-gold rounded">
                  <PhoneCall size={18} />
                </div>
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
                  id="client-search-input"
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-b border-rocky-gray/60 focus:border-elevated-gold dark:focus:border-elevated-gold py-2 pl-7 pr-3 text-sm focus:outline-none transition-colors placeholder:text-rocky-gray placeholder:italic text-enchanted-green dark:text-light-ivory"
                />
              </div>

              <div className="text-xs text-rocky-gray">
                Mostrando <strong className="text-enchanted-green dark:text-light-ivory">{filteredClients.length}</strong> de <strong className="text-enchanted-green dark:text-light-ivory">{totalClients}</strong> clientes
              </div>
            </div>

            {/* Table Render */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F2E9DF]/50 dark:bg-[#070D0C]/50 border-b border-rocky-gray/30 dark:border-white/10 font-serif italic text-sm text-[#0B3D2E]/80 dark:text-light-ivory/80">
                    <th className="px-6 py-4 font-medium">Nombre Comercial</th>
                    <th className="px-6 py-4 font-medium">Razón Social</th>
                    <th className="px-6 py-4 font-medium">RFC</th>
                    <th className="px-6 py-4 font-medium">Contacto</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5 text-sm">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-rocky-gray text-xs">
                        No se encontraron clientes que coincidan con "{searchTerm}"
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr 
                        key={client.id}
                        className="hover:bg-enchanted-green/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Nombre */}
                        <td className="px-6 py-4 font-serif text-base font-semibold text-enchanted-green dark:text-light-ivory">
                          {client.nombre}
                        </td>

                        {/* Razón Social */}
                        <td className="px-6 py-4 text-xs text-enchanted-green/80 dark:text-light-ivory/80 max-w-[200px] truncate">
                          {client.razonSocial || <span className="text-rocky-gray italic">No registrada</span>}
                        </td>

                        {/* RFC */}
                        <td className="px-6 py-4 font-mono text-xs tracking-wider">
                          {client.rfc ? (
                            <span className="bg-rose-linen/25 dark:bg-rose-linen/10 text-[#543b35] dark:text-[#f3d9d3] px-2 py-0.5 rounded border border-rose-linen/20">
                              {client.rfc}
                            </span>
                          ) : (
                            <span className="text-rocky-gray italic">No registrado</span>
                          )}
                        </td>

                        {/* Contacto */}
                        <td className="px-6 py-4 text-xs">
                          {client.contacto ? (
                            <span className="text-enchanted-green/90 dark:text-light-ivory/90 font-medium">
                              {client.contacto}
                            </span>
                          ) : (
                            <span className="text-rocky-gray italic">Sin contacto</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          {deleteConfirmId === client.id ? (
                            <div className="flex items-center justify-end space-x-2 animate-pulse">
                              <span className="text-[10px] text-cranberry font-semibold flex items-center">
                                <AlertTriangle size={12} className="mr-1" /> ¿Eliminar?
                              </span>
                              <button
                                onClick={() => handleDeleteConfirm(client.id)}
                                className="px-2 py-1 bg-cranberry text-white text-[10px] font-bold rounded uppercase hover:bg-cranberry/95"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-rocky-gray text-white text-[10px] font-bold rounded uppercase hover:bg-rocky-gray/90"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => onEditClick(client)}
                                className="p-1.5 text-enchanted-green/60 dark:text-light-ivory/60 hover:text-elevated-gold dark:hover:text-elevated-gold hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all"
                                title="Editar cliente"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTrigger(client.id)}
                                className="p-1.5 text-enchanted-green/60 dark:text-light-ivory/60 hover:text-cranberry dark:hover:text-cranberry hover:bg-enchanted-green/5 dark:hover:bg-white/5 rounded transition-all"
                                title="Eliminar cliente"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
