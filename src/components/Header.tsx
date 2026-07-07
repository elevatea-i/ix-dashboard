/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onMenuToggle: () => void;
}

export default function Header({ 
  onLogout, 
  darkMode, 
  setDarkMode, 
  onMenuToggle 
}: HeaderProps) {
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

      <div className="flex items-center space-x-4">
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

        {/* User indicator: "San" */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-enchanted-green text-light-ivory dark:bg-elevated-gold dark:text-[#070D0C] flex items-center justify-center font-serif text-sm font-bold shadow-sm">
            S
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-enchanted-green dark:text-light-ivory">San</p>
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
