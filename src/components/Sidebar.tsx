import React from 'react';
import { Users, FolderGit2, Receipt, TrendingDown, TrendingUp, Percent, X, HandCoins, UsersRound, Coins, Repeat, ChartBar as BarChart3, ArrowRightLeft, Vault } from 'lucide-react';
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

  const moduleGroups: { label: string; modules: Module[] }[] = [
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
        return <HandCoins {...iconProps} />;
      case 'pagos_terceros':
        return <UsersRound {...iconProps} />;
      case 'reparto_utilidades':
        return <Coins {...iconProps} />;
      case 'por_impactar':
        return <Repeat {...iconProps} />;
      case 'rentabilidad':
        return <TrendingUp {...iconProps} />;
      case 'iva':
        return <Percent {...iconProps} />;
      case 'reportes':
        return <BarChart3 {...iconProps} />;
      case 'boveda_iva':
        return <Vault {...iconProps} />;
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-enchanted-green dark:bg-[#040F09] text-light-ivory border-r border-enchanted-green/20 dark:border-light-ivory/10 flex flex-col justify-between transform transition-all duration-300 lg:static lg:h-screen lg:translate-x-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sidebar Header */}
          <div className="h-16 px-6 border-b border-light-ivory/10 flex items-center justify-between shrink-0">
            <span className="font-serif text-[26px] tracking-wider font-bold flex-1 text-center text-[#bbbcbc]">IX Dashboard.</span>

            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 hover:bg-light-ivory/10 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B39C70]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Module Navigation */}
          <nav className="flex-1 overflow-y-auto">
            {moduleGroups.map((group, groupIdx) => (
              <div key={group.label}>
                {collapsedOnDesktop ? (
                  groupIdx > 0 && <div className="border-t border-light-ivory/10" />
                ) : (
                  <p className="text-xs font-medium text-light-ivory/60 pt-5 pb-2 px-4">
                    {group.label}
                  </p>
                )}
                {group.modules.map((mod) => {
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      id={`sidebar-link-${mod.id}`}
                      key={mod.id}
                      disabled={mod.disabled}
                      onClick={() => handleModuleClick(mod)}
                      className={`relative w-full min-h-[40px] flex items-center gap-3 px-4 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B39C70] ${
                        isActive
                          ? 'bg-light-ivory/10 text-light-ivory font-semibold'
                          : mod.disabled
                            ? 'opacity-40 cursor-not-allowed hover:bg-transparent text-light-ivory/80'
                            : 'text-light-ivory/80 hover:bg-light-ivory/5'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 inset-y-2.5 w-[2px] rounded-full bg-[#B39C70]" />
                      )}
                      <span className="w-5 flex items-center justify-center shrink-0">
                        {getIcon(mod.id)}
                      </span>
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-light-ivory/10 shrink-0">
          <p className="text-[13px] font-serif font-semibold text-light-ivory/60 text-center">Eleva | Expande | Impacta.</p>
        </div>
      </aside>
    </>
  );
}
