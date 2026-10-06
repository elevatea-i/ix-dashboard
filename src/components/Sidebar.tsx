import React from 'react';
import {
  ArrowRightLeft,
  BarChart3,
  ChartNoAxesColumnIncreasing,
  Folder,
  HandCoins,
  Landmark,
  Percent,
  Receipt,
  Repeat,
  TrendingDown,
  TrendingUp,
  Users,
  UsersRound,
  Vault,
  X,
} from 'lucide-react';
import { ModuleId, Module } from '../types';
import { useIsDesktop } from '../hooks/useIsDesktop';

interface SidebarProps {
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
}

type SidebarSection = {
  title: string;
  modules: Module[];
};

const operationModules: Module[] = [
  { id: 'clientes', label: 'Clientes', disabled: false },
  { id: 'proyectos', label: 'Proyectos', disabled: false },
  { id: 'facturacion', label: 'Facturación', disabled: false },
  { id: 'gastos', label: 'Gastos pagados', disabled: false },
  { id: 'pagos_proveedores', label: 'Pagos a proveedores', disabled: false },
  { id: 'por_impactar', label: 'Por impactar', disabled: false },
  { id: 'pagos_terceros', label: 'Pagos a terceros', disabled: false },
  { id: 'cuenta_juan_carlos', label: 'Cuenta Juan Carlos', disabled: false },
];

const analysisModules: Module[] = [
  { id: 'reparto_utilidades', label: 'Reparto de utilidades', disabled: false },
  { id: 'rentabilidad', label: 'Rentabilidad', disabled: false },
  { id: 'reportes', label: 'Reportes', disabled: false },
];

const fiscalModules: Module[] = [
  { id: 'iva', label: 'Panel de IVA', disabled: false },
  { id: 'boveda_iva', label: 'Bóveda de IVA', disabled: false },
];

const sections: SidebarSection[] = [
  { title: 'Operación', modules: operationModules },
  { title: 'Análisis', modules: analysisModules },
  { title: 'Fiscal', modules: fiscalModules },
];

export default function Sidebar({
  activeModule,
  setActiveModule,
  isOpen,
  setIsOpen,
  isCollapsed,
}: SidebarProps) {
  const getIcon = (id: ModuleId) => {
    const iconProps = { size: 23, strokeWidth: 1.7 };

    switch (id) {
      case 'clientes':
        return <Users {...iconProps} />;
      case 'proyectos':
        return <Folder {...iconProps} />;
      case 'facturacion':
        return <Receipt {...iconProps} />;
      case 'gastos':
        return <TrendingDown {...iconProps} />;
      case 'pagos_proveedores':
        return <HandCoins {...iconProps} />;
      case 'por_impactar':
        return <Repeat {...iconProps} />;
      case 'pagos_terceros':
        return <UsersRound {...iconProps} />;
      case 'cuenta_juan_carlos':
        return <ArrowRightLeft {...iconProps} />;
      case 'reparto_utilidades':
        return <ChartNoAxesColumnIncreasing {...iconProps} />;
      case 'rentabilidad':
        return <TrendingUp {...iconProps} />;
      case 'reportes':
        return <BarChart3 {...iconProps} />;
      case 'iva':
        return <Percent {...iconProps} />;
      case 'boveda_iva':
        return <Vault {...iconProps} />;
      default:
        return <Landmark {...iconProps} />;
    }
  };

  const handleModuleClick = (mod: Module) => {
    if (mod.disabled) return;
    setActiveModule(mod.id);
    setIsOpen(false);
  };

  const isDesktop = useIsDesktop();
  const collapsedOnDesktop = isDesktop && isCollapsed;
  const sidebarStyle: React.CSSProperties = isDesktop
    ? {
        width: collapsedOnDesktop ? '0px' : '380px',
        borderWidth: collapsedOnDesktop ? 0 : undefined,
        overflow: collapsedOnDesktop ? 'hidden' : undefined,
        opacity: collapsedOnDesktop ? 0 : 1,
      }
    : {};

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        style={sidebarStyle}
        className={`fixed inset-y-0 left-0 z-50 w-[min(380px,90vw)] bg-enchanted-green text-light-ivory border-r border-enchanted-green/20 flex flex-col transform transition-all duration-300 lg:static lg:h-screen lg:translate-x-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 overflow-y-auto px-2 py-5 sm:px-2.5 sm:py-7">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-light-ivory/70 transition-colors hover:bg-white/10 hover:text-light-ivory lg:hidden"
            aria-label="Cerrar navegación"
          >
            <X size={18} />
          </button>

          {sections.map((section, sectionIndex) => (
            <section key={section.title} className={sectionIndex > 0 ? 'mt-9' : ''}>
              <h2 className="px-6 pb-3 text-[18px] font-medium leading-[1.2] text-light-ivory/65">
                {section.title}
              </h2>

              <div className="space-y-1">
                {section.modules.map((mod) => {
                  const isActive = activeModule === mod.id;

                  return (
                    <button
                      id={`sidebar-link-${mod.id}`}
                      key={mod.id}
                      disabled={mod.disabled}
                      onClick={() => handleModuleClick(mod)}
                      className={`group relative w-full flex items-center gap-5 rounded-lg px-6 py-3.5 text-left text-[18px] leading-[1.2] transition-all duration-200 ${
                        isActive
                          ? 'bg-[#315B4C] font-semibold text-light-ivory shadow-sm'
                          : mod.disabled
                            ? 'cursor-not-allowed opacity-40'
                            : 'font-medium text-light-ivory/85 hover:bg-white/[0.07] hover:text-light-ivory'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-elevated-gold" />
                      )}
                      <span
                        className={`flex w-6 shrink-0 items-center justify-center transition-colors duration-200 ${
                          isActive ? 'text-light-ivory' : 'text-light-ivory/80 group-hover:text-light-ivory'
                        }`}
                      >
                        {getIcon(mod.id)}
                      </span>
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>
    </>
  );
}
