import React from 'react';
import { Users, FolderGit2, Receipt, TrendingDown, TrendingUp, Percent, X, WalletCards, UserRound, ChartPie, Repeat, ChartBar as BarChart3, ArrowRightLeft, LockKeyhole } from 'lucide-react';
import { ModuleId, Module } from '../types';
import { navigationGroups } from '../lib/navigation';
import { useIsDesktop } from '../hooks/useIsDesktop';

interface SidebarProps {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
}

export default function Sidebar({ 
  activeModule, 
  setActiveModule, 
  isOpen, 
  setIsOpen,
  isCollapsed
}: SidebarProps) {
  
  const getIcon = (id: ModuleId) => {
    const iconProps = { size: 17, strokeWidth: 1.5 };

    switch (id) {
      case 'clientes':
        return <Users {...iconProps} />;
      case 'proyectos':
        return <FolderGit2 {...iconProps} />;
      case 'facturacion':
        return <Receipt {...iconProps} />;
      case 'gastos':
        return <TrendingDown {...iconProps} />;
      case 'cuenta_juan_carlos':
        return <ArrowRightLeft {...iconProps} />;
      case 'pagos_proveedores':
        return <WalletCards {...iconProps} />;
      case 'pagos_terceros':
        return <UserRound {...iconProps} />;
      case 'reparto_utilidades':
        return <ChartPie {...iconProps} />;
      case 'por_impactar':
        return <Repeat {...iconProps} />;
      case 'rentabilidad':
        return <TrendingUp {...iconProps} />;
      case 'iva':
        return <Percent {...iconProps} />;
      case 'reportes':
        return <BarChart3 {...iconProps} />;
      case 'boveda_iva':
        return <LockKeyhole {...iconProps} />;
    }
  };

  const handleModuleClick = (mod: Module) => {
    if (mod.disabled) return;
    setActiveModule(mod.id);
    setIsOpen(false); // Close mobile sidebar on select
  };

  const isDesktop = useIsDesktop();
  const collapsedOnDesktop = isDesktop && isCollapsed;
  const sidebarStyle: React.CSSProperties = isDesktop
    ? {
        width: collapsedOnDesktop ? '0px' : '16rem',
        borderWidth: collapsedOnDesktop ? 0 : undefined,
        overflow: collapsedOnDesktop ? 'hidden' : undefined,
        opacity: collapsedOnDesktop ? 0 : 1,
      }
    : {};

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#051A14]/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        style={sidebarStyle}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-enchanted-green dark:bg-[#072A20] text-light-ivory border-r border-black/10 dark:border-white/[0.05] flex flex-col justify-between transform transition-all duration-300 lg:static lg:h-screen lg:translate-x-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-16 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
            <span className="font-serif text-[25px] leading-none tracking-[0.01em] text-light-ivory select-none">
              <span className="font-semibold">IX</span>{' '}
              <span className="italic font-normal text-light-ivory/85">Dashboard</span>
              <span className="text-elevated-gold">.</span>
            </span>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar menú"
              className="lg:hidden p-1.5 text-light-ivory/70 hover:text-light-ivory hover:bg-white/[0.06] rounded-md transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <div className="space-y-7">
              {navigationGroups.map((group) => (
                <section key={group.label} aria-labelledby={`sidebar-group-${group.label}`}>
                  <h2
                    id={`sidebar-group-${group.label}`}
                    className="eyebrow px-3 pb-2.5 font-sans text-light-ivory/40"
                  >
                    {group.label}
                  </h2>
                  <div className="space-y-0.5">
                    {group.modules.map((mod) => {
                      const isActive = activeModule === mod.id;
                      return (
                        <button
                          id={`sidebar-link-${mod.id}`}
                          key={mod.id}
                          disabled={mod.disabled}
                          onClick={() => handleModuleClick(mod)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`group relative min-h-11 w-full flex items-center justify-between rounded-md px-3 py-2 text-left transition-colors duration-200 ${
                            isActive
                              ? 'bg-white/[0.07] text-light-ivory'
                              : mod.disabled
                                ? 'opacity-40 cursor-not-allowed'
                                : 'text-light-ivory/65 hover:bg-white/[0.04] hover:text-light-ivory'
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full bg-elevated-gold transition-all duration-300 ${
                              isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                            }`}
                          />
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`flex w-5 shrink-0 items-center justify-center transition-colors duration-200 ${isActive ? 'text-gold-300' : 'text-light-ivory/45 group-hover:text-light-ivory/75'}`}>
                              {getIcon(mod.id)}
                            </span>
                            <span className={`truncate text-[14px] ${isActive ? 'font-medium' : 'font-normal'}`}>{mod.label}</span>
                          </div>

                          {mod.tag && (
                            <span className="eyebrow text-[9px] px-1.5 py-0.5 rounded text-light-ivory/50 border border-white/10">
                              {mod.tag}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.07] shrink-0">
          <p className="font-serif italic text-[14px] text-light-ivory/45 tracking-wide">
            Eleva <span className="text-elevated-gold/70 not-italic">·</span> Expande <span className="text-elevated-gold/70 not-italic">·</span> Impacta
          </p>
        </div>
      </aside>
    </>
  );
}

