import React from 'react';
import { Menu, Sun, Moon, LogOut, CircleArrowDown as ArrowDownCircle, CircleArrowUp as ArrowUpCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import type { UserProfile } from '../lib/auth';
import { useIsDesktop } from '../hooks/useIsDesktop';

interface HeaderProps {
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onMenuToggle: () => void;
  onQuickGastoClick: () => void;
  onQuickFacturaClick: () => void;
  profile?: UserProfile | null;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export default function Header({
  onLogout,
  darkMode,
  setDarkMode,
  onMenuToggle,
  onQuickGastoClick,
  onQuickFacturaClick,
  profile,
  isSidebarCollapsed,
  onToggleSidebarCollapse
}: HeaderProps) {
  const displayName = profile?.nombre || 'Usuario';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const isDesktop = useIsDesktop();
  return (
    <header className="h-16 px-6 bg-white/40 dark:bg-[#070D0C]/40 backdrop-blur-md border-b border-enchanted-green/10 dark:border-light-ivory/10 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center space-x-4">
        {/* Desktop sidebar collapse toggle */}
        {isDesktop && (
          <button
            onClick={onToggleSidebarCollapse}
            id="desktop-sidebar-toggle"
            className="h-11 w-11 flex items-center justify-center text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 rounded-md transition-colors"
            title={isSidebarCollapsed ? 'Expandir panel lateral' : 'Colapsar panel lateral'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}

        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          id="mobile-sidebar-toggle"
          className="lg:hidden h-11 w-11 flex items-center justify-center text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Quick Action: Gasto rápido */}
        <button
          onClick={onQuickGastoClick}
          id="header-quick-gasto-btn"
          className="h-11 px-3 flex items-center justify-center gap-1.5 rounded-md bg-transparent text-enchanted-green dark:text-light-ivory border border-enchanted-green/20 dark:border-light-ivory/20 hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 font-medium text-sm transition-colors cursor-pointer shrink-0"
          title="Registrar gasto rápido"
        >
          <ArrowDownCircle size={16} className="text-cranberry dark:text-[#C7798F]" />
          <span className="hidden sm:inline">Gasto rápido</span>
        </button>

        {/* Quick Action: Factura rápida */}
        <button
          onClick={onQuickFacturaClick}
          id="header-quick-factura-btn"
          className="h-11 px-3 flex items-center justify-center gap-1.5 rounded-md bg-transparent text-enchanted-green dark:text-light-ivory border border-enchanted-green/20 dark:border-light-ivory/20 hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 font-medium text-sm transition-colors cursor-pointer shrink-0"
          title="Registrar factura rápida"
        >
          <ArrowUpCircle size={16} />
          <span className="hidden sm:inline">Factura rápida</span>
        </button>

        {/* Theme mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          id="header-theme-toggle"
          aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="h-11 w-11 flex items-center justify-center rounded-md text-enchanted-green/70 dark:text-light-ivory/70 hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 transition-colors"
          title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logout action */}
        <button
          onClick={onLogout}
          id="header-logout-btn"
          aria-label="Cerrar sesión"
          className="h-11 w-11 flex items-center justify-center rounded-md text-enchanted-green/70 dark:text-light-ivory/70 hover:bg-enchanted-green/5 dark:hover:bg-light-ivory/5 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>

        {/* Vertical divider between actions and user block */}
        <div className="h-6 w-px bg-enchanted-green/10 dark:bg-light-ivory/10"></div>

        {/* User indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-enchanted-green text-light-ivory dark:bg-elevated-gold dark:text-[#070D0C] flex items-center justify-center font-serif text-sm font-bold">
            {displayInitial}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory">{displayName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
