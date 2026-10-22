import { Module, ModuleId } from '../types';

export const navigationGroups: { label: string; modules: Module[] }[] = [
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

export function findModuleLocation(id: ModuleId): { group: string; label: string } | null {
  for (const group of navigationGroups) {
    const mod = group.modules.find(m => m.id === id);
    if (mod) return { group: group.label, label: mod.label };
  }
  return null;
}
