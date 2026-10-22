import React from 'react';
import { Menu, Sun, Moon, LogOut, ArrowDownRight, ArrowUpRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import type { UserProfile } from '../lib/auth';
import type { ModuleId } from '../types';
import { findModuleLocation } from '../lib/navigation';
import { useIsDesktop } from '../hooks/useIsDesktop';

interface HeaderProps {
  activeModule: ModuleId;
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

const todayLabel = () =>
  new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

const iconButton =
  'h-9 w-9 flex items-center justify-center rounded-md text-ink-soft dark:text-light-ivory/60 hover:text-enchanted-green dark:hover:text-light-ivory hover:bg-enchanted-green/[0.05] dark:hover:bg-white/[0.05] transition-colors';

export default function Header({
  activeModule,
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
  const location = findModuleLocation(activeModule);

  return (
    <header className="h-16 px-4 sm:px-6 bg-light-ivory dark:bg-[#051A14] border-b border-enchanted-green/[0.08] dark:border-white/[0.06] flex items-center justify-between gap-3 transition-colors duration-300">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {isDesktop && (
          <button
            onClick={onToggleSidebarCollapse}
            id="desktop-sidebar-toggle"
            className={iconButton}
            title={isSidebarCollapsed ? 'Expandir panel lateral' : 'Colapsar panel lateral'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
          </button>
        )}

        <button
          onClick={onMenuToggle}
          id="mobile-sidebar-toggle"
          aria-label="Abrir menú"
          className={`lg:hidden ${iconButton}`}
        >
          <Menu size={19} strokeWidth={1.5} />
        </button>

        {location && (
          <div className="hidden sm:flex flex-col min-w-0 leading-tight">
            <span className="eyebrow text-elevated-gold">{location.group}</span>
            <span className="text-[13px] text-ink-mute dark:text-light-ivory/50 capitalize truncate mt-1">
              {todayLabel()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onQuickGastoClick}
          id="header-quick-gasto-btn"
          className="h-11 w-11 sm:h-9 sm:w-auto sm:px-3.5 flex items-center justify-center gap-1.5 rounded-md border border-enchanted-green/15 dark:border-white/12 text-enchanted-green dark:text-light-ivory/90 bg-paper/60 dark:bg-white/[0.03] hover:border-cranberry/40 hover:bg-paper dark:hover:bg-white/[0.06] text-[13px] font-medium transition-all shrink-0"
          title="Registrar Gasto Rápido"
        >
          <ArrowDownRight size={15} strokeWidth={1.75} className="text-cranberry dark:text-cranberry-300" />
          <span className="hidden sm:inline">Gasto rápido</span>
        </button>

        <button
          onClick={onQuickFacturaClick}
          id="header-quick-factura-btn"
          className="h-11 w-11 sm:h-9 sm:w-auto sm:px-3.5 flex items-center justify-center gap-1.5 rounded-md bg-enchanted-green dark:bg-light-ivory text-light-ivory dark:text-enchanted-green hover:bg-green-500 dark:hover:bg-white text-[13px] font-medium shadow-[0_1px_2px_rgba(11,61,46,0.2)] transition-all shrink-0"
          title="Registrar Factura Rápida"
        >
          <ArrowUpRight size={15} strokeWidth={1.75} className="text-gold-300 dark:text-elevated-gold" />
          <span className="hidden sm:inline">Factura rápida</span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-enchanted-green/10 dark:bg-white/10 mx-1" />

        <button
          onClick={() => setDarkMode(!darkMode)}
          id="header-theme-toggle"
          className={iconButton}
          title={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {darkMode ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full ring-1 ring-elevated-gold/40 bg-enchanted-green dark:bg-paper-dark-raised text-light-ivory flex items-center justify-center font-serif text-[15px] font-semibold">
            {displayInitial}
          </div>
          <p className="hidden md:block text-[13px] font-medium text-enchanted-green dark:text-light-ivory">{displayName}</p>
        </div>

        <button
          onClick={onLogout}
          id="header-logout-btn"
          className={`${iconButton} hover:!text-cranberry dark:hover:!text-cranberry-300`}
          title="Cerrar sesión"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
