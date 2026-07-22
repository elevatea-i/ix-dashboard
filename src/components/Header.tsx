/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Sun, Moon, LogOut, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle } from 'lucide-react';

import type { UserProfile } from '../lib/auth';

interface HeaderProps {
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onMenuToggle: () => void;
  onQuickGastoClick: () => void;
  onQuickFacturaClick: () => void;
  profile?: UserProfile | null;
}

export default function Header({ 
  onLogout, 
  darkMode, 
  setDarkMode, 
  onMenuToggle,
  onQuickGastoClick,
  onQuickFacturaClick,
  profile
}: HeaderProps) {
  const displayName = profile?.nombre || 'Usuario';
  const displayInitial = displayName.charAt(0).toUpperCase();
  return (
    <header className="h-16 px-6 bg-white/40 dark:bg-[#070D0C]/40 backdrop-blur-md border-b border-rocky-gray/30 dark:border-light-ivory/10 flex items-center justify-between transition-all duration-300 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          id="mobile-sidebar-toggle"
          className="lg:hidden p-2 text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* System identity */}
        <div className="hidden sm:block">
          <p className="text-[10px] tracking-widest text-elevated-gold dark:text-rose-linen uppercase font-semibold">
            SISTEMA DE GESTIÓN INTERNA
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Quick Action: Gasto Rápido */}
        <button
          onClick={onQuickGastoClick}
          id="header-quick-gasto-btn"
          className="h-11 w-11 sm:h-9 sm:w-auto px-0 sm:px-3 flex items-center justify-center gap-1.5 rounded bg-[#84344E]/5 dark:bg-[#FC5C7D]/10 text-[#84344E] dark:text-[#FC5C7D] border border-[#84344E]/25 dark:border-[#FC5C7D]/30 hover:bg-[#84344E]/10 dark:hover:bg-[#FC5C7D]/18 font-semibold text-xs transition-all shadow-xs cursor-pointer shrink-0"
          title="Registrar Gasto Rápido"
        >
          <ArrowDownCircle size={16} />
          <span className="hidden sm:inline">Gasto Rápido</span>
        </button>

        {/* Quick Action: Factura Rápida */}
        <button
          onClick={onQuickFacturaClick}
          id="header-quick-factura-btn"
          className="h-11 w-11 sm:h-9 sm:w-auto px-0 sm:px-3 flex items-center justify-center gap-1.5 rounded bg-[#047857]/5 dark:bg-[#34D399]/10 text-[#047857] dark:text-[#34D399] border border-[#047857]/25 dark:border-[#34D399]/30 hover:bg-[#047857]/10 dark:hover:bg-[#34D399]/18 font-semibold text-xs transition-all shadow-xs cursor-pointer shrink-0"
          title="Registrar Factura Rápida"
        >
          <ArrowUpCircle size={16} />
          <span className="hidden sm:inline">Factura Rápida</span>
        </button>

        <div className="hidden xs:block h-8 w-[1px] bg-enchanted-green/10 dark:bg-light-ivory/10 mx-1"></div>

        {/* Theme mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          id="header-theme-toggle"
          className="p-2 rounded-full text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 transition-colors"
          title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {darkMode ? <Sun size={18} className="text-elevated-gold" /> : <Moon size={18} />}
        </button>

        <div className="h-8 w-[1px] bg-enchanted-green/10 dark:bg-light-ivory/10"></div>

        {/* User indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-enchanted-green text-light-ivory dark:bg-elevated-gold dark:text-[#070D0C] flex items-center justify-center font-serif text-sm font-bold shadow-sm">
            {displayInitial}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory">{displayName}</p>
          </div>
        </div>

        {/* Logout action */}
        <button
          onClick={onLogout}
          id="header-logout-btn"
          className="p-2 text-cranberry hover:bg-cranberry/5 dark:hover:bg-cranberry/10 rounded-full transition-all"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
