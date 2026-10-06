import React from 'react';
import { Users, FolderGit2, Receipt, TrendingDown, TrendingUp, Percent, X, WalletCards, UserRound, ChartPie, Repeat, ChartBar as BarChart3, ArrowRightLeft, LockKeyhole } from 'lucide-react';
import { ModuleId, Module } from '../types';
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
  
  const navigationGroups: { label: string; modules: Module[] }[] = [
    {
      label: 'Operación',
      modules: [
        { id: 'clientes', label: 'Clientes', disabled: false },
        { id: 'proyectos', label: 'Proyectos', disabled: false },
        { id: 'facturacion', label: 'Facturación', disabled: false },
        { id: 'gastos', label: 'Gastos pagados', disabled: false },
        { id: 'pagos_proveedores', label: 'Pagos a proveedores', disabled: false },
        { id: 'por_impactar', label: 'Por impactar', disabled: false },
        { id: 'pagos_terceros', label: 'Pagos a terceros', disabled: false },
        { id: 'cuenta_juan_carlos', label: 'Cuenta Juan Carlos', disabled: false },
      ],
    },
    {
      label: 'Análisis',
      modules: [
        { id: 'reparto_utilidades', label: 'Reparto de utilidades', disabled: false },
        { id: 'rentabilidad', label: 'Rentabilidad', disabled: false },
        { id: 'reportes', label: 'Reportes', disabled: false },
      ],
    },
    {
      label: 'Fiscal',
      modules: [
        { id: 'iva', label: 'Panel de IVA', disabled: false },
        { id: 'boveda_iva', label: 'Bóveda de IVA', disabled: false },
      ],
    },
  ];

  const getIcon = (id: ModuleId) => {
    const iconProps = { size: 18, strokeWidth: 1.8 };

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        style={sidebarStyle}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-enchanted-green text-light-ivory border-r border-enchanted-green/20 flex flex-col justify-between transform transition-all duration-300 lg:static lg:h-screen lg:translate-x-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sidebar Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
            <span className="font-serif text-[26px] tracking-wider font-bold flex-1 text-center text-[#bbbcbc]">IX Dashboard.</span>

            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Module Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-5 sm:py-6">
            <div className="space-y-7">
              {navigationGroups.map((group) => (
                <section key={group.label} aria-labelledby={`sidebar-group-${group.label}`}>
                  <h2
                    id={`sidebar-group-${group.label}`}
                    className="px-3 pb-2 text-[15px] font-semibold leading-6 text-rose-linen/70"
                  >
                    {group.label}
                  </h2>
                  <div className="space-y-1">
                    {group.modules.map((mod) => {
                      const isActive = activeModule === mod.id;
                      return (
                        <button
                          id={`sidebar-link-${mod.id}`}
                          key={mod.id}
                          disabled={mod.disabled}
                          onClick={() => handleModuleClick(mod)}
                          className={`min-h-11 w-full flex items-center justify-between rounded-md border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 sm:min-h-12 sm:text-[15px] ${
                            isActive
                              ? 'border-elevated-gold bg-white/[0.10] text-light-ivory font-semibold shadow-[0_4px_14px_rgba(0,0,0,0.12)]'
                              : mod.disabled
                                ? 'border-transparent opacity-40 cursor-not-allowed hover:bg-transparent'
                                : 'border-transparent text-light-ivory/80 hover:border-rose-linen/30 hover:bg-white/[0.07] hover:text-light-ivory'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`flex w-8 shrink-0 items-center justify-center transition-colors duration-200 ${isActive ? 'text-light-ivory' : 'text-rose-linen/80'}`}>
                              {getIcon(mod.id)}
                            </span>
                            <span className="truncate">{mod.label}</span>
                          </div>

                          {mod.tag && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-[#091C16] text-rose-linen border border-white/5 font-sans tracking-wide">
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

        {/* Sidebar Footer with Editorial Branding */}
        <div className="p-4 border-t border-white/10 bg-[#07241B] shrink-0">
          <div className="flex items-start space-x-3 text-center opacity-60">
            <div className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-serif font-semibold text-light-ivory">Eleva | Expande | Impacta.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

