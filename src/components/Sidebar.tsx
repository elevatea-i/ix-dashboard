/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  FolderGit2, 
  Receipt, 
  TrendingDown, 
  TrendingUp, 
  Percent,
  X,
  HandCoins,
  UsersRound,
  Coins,
  Repeat,
  BarChart3,
  ArrowRightLeft,
  Vault
} from 'lucide-react';
import { ModuleId, Module } from '../types';

interface SidebarProps {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ 
  activeModule, 
  setActiveModule, 
  isOpen, 
  setIsOpen 
}: SidebarProps) {
  
  const modules: Module[] = [
    { id: 'clientes', label: 'Clientes', disabled: false },
    { id: 'proyectos', label: 'Proyectos', disabled: false },
    { id: 'facturacion', label: 'Facturación', disabled: false },
    { id: 'gastos', label: 'Gastos', disabled: false },
    { id: 'pagos_proveedores', label: 'Pagos a Proveedores', disabled: false },
    { id: 'por_impactar', label: 'Por Impactar', disabled: false },
    { id: 'pagos_terceros', label: 'Pagos a Terceros', disabled: false },
    { id: 'cuenta_juan_carlos', label: 'Cuenta Juan Carlos', disabled: false },
    { id: 'reparto_utilidades', label: 'Reparto de Utilidades', disabled: false },
    { id: 'rentabilidad', label: 'Rentabilidad', disabled: false },
    { id: 'iva', label: 'Panel de IVA', disabled: false },
    { id: 'boveda_iva', label: 'Bóveda de IVA', disabled: false },
    { id: 'reportes', label: 'Reportes', disabled: false },
  ];

  const getIcon = (id: ModuleId) => {
    switch (id) {
      case 'clientes':
        return <Users size={18} />;
      case 'proyectos':
        return <FolderGit2 size={18} />;
      case 'facturacion':
        return <Receipt size={18} />;
      case 'gastos':
        return <TrendingDown size={18} />;
      case 'cuenta_juan_carlos':
        return <ArrowRightLeft size={18} />;
      case 'pagos_proveedores':
        return <HandCoins size={18} />;
      case 'pagos_terceros':
        return <UsersRound size={18} />;
      case 'reparto_utilidades':
        return <Coins size={18} />;
      case 'por_impactar':
        return <Repeat size={18} />;
      case 'rentabilidad':
        return <TrendingUp size={18} />;
      case 'iva':
        return <Percent size={18} />;
      case 'reportes':
        return <BarChart3 size={18} />;
      case 'boveda_iva':
        return <Vault size={18} />;
    }
  };

  const handleModuleClick = (mod: Module) => {
    if (mod.disabled) return;
    setActiveModule(mod.id);
    setIsOpen(false); // Close mobile sidebar on select
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-enchanted-green text-light-ivory border-r border-enchanted-green/20 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sidebar Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-elevated-gold text-enchanted-green flex items-center justify-center font-serif font-bold text-lg shadow-inner">
                IX
              </div>
              <div>
                <span className="font-serif text-lg tracking-wide font-medium block">IX Dashboard</span>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Module Navigation */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <p className="px-3 py-2 text-[10px] tracking-widest uppercase font-semibold text-rose-linen/60">
              Navegación Interna
            </p>
            {modules.map((mod) => {
              const isActive = activeModule === mod.id;
              return (
                <button
                  id={`sidebar-link-${mod.id}`}
                  key={mod.id}
                  disabled={mod.disabled}
                  onClick={() => handleModuleClick(mod)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-elevated-gold text-[#070D0C] font-semibold shadow-sm'
                      : mod.disabled
                        ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                        : 'hover:bg-white/5 text-light-ivory/80 hover:text-light-ivory'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-[#070D0C]' : 'text-rose-linen/80'}>
                      {getIcon(mod.id)}
                    </span>
                    <span>{mod.label}</span>
                  </div>

                  {mod.tag && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#091C16] text-rose-linen border border-white/5 font-sans tracking-wide">
                      {mod.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Editorial Branding */}
        <div className="p-4 border-t border-white/10 bg-[#07241B] shrink-0">
          <div className="flex items-start space-x-3">
            <div className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-serif font-semibold text-light-ivory">IX Marketing</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
