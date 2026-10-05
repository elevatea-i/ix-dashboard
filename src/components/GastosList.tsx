import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Coins } from 'lucide-react';
import { Expense, Project, ExpenseCategory } from '../types';
import { formatCurrency, formatDateShort } from '../utils';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Money from './ui/Money';
import SummaryStrip from './ui/SummaryStrip';
import SearchInput from './ui/SearchInput';
import SelectField from './ui/SelectField';
import StatusDot from './ui/StatusDot';
import DataCard from './ui/DataCard';

interface GastosListProps {
  expenses: Expense[];
  projects: Project[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (id: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Pago a proveedores',
  'Pagos a terceros',
  'Transporte (gasolina, peajes, Uber)',
  'Viáticos',
  'Comidas internas',
  'Compras en línea (Amazon, Mercado Libre)',
  'Compras generales (tiendas físicas)',
  'Pago de comisiones',
  'Pago de impuestos',
  'Contadora y servicios profesionales',
  'Oficina y coworking',
  'Otros / sin clasificar'
];

const GRID_COLUMNS = 'grid gap-4 px-6';
const GRID_TEMPLATE = 'minmax(220px,2fr) minmax(180px,1.5fr) minmax(170px,1.3fr) 120px 140px 120px 120px 120px';

export default function GastosList({
  expenses,
  projects,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick
}: GastosListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-enchanted-green border-t-transparent" />
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOrigen, setFilterOrigen] = useState<string>('all');
  const [filterProyecto, setFilterProyecto] = useState<string>('all');
  const [filterEstatus, setFilterEstatus] = useState<string>('all');

  const getProjectDisplay = (projId: string | null) => {
    if (!projId) return null;
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto desconocido';
  };

  const totalGastos = expenses.reduce((sum, exp) => sum + exp.total, 0);
  const totalPagado = expenses.filter(exp => exp.estatusPago === 'Pagado').reduce((sum, exp) => sum + exp.total, 0);
  const totalPendiente = totalGastos - totalPagado;

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterOrigen('all');
    setFilterProyecto('all');
    setFilterEstatus('all');
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch =
      exp.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.categoriaId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory !== 'all' && exp.categoriaId !== filterCategory) return false;
    if (filterOrigen !== 'all' && exp.cuentaOrigen !== filterOrigen) return false;

    if (filterProyecto !== 'all') {
      if (filterProyecto === 'operativo') {
        if (exp.tipo !== 'Operativo') return false;
      } else {
        if (exp.proyectoId !== filterProyecto) return false;
      }
    }

    if (filterEstatus !== 'all' && exp.estatusPago !== filterEstatus) return false;
    return true;
  });

  const hasActiveFilters =
    searchTerm ||
    filterCategory !== 'all' ||
    filterOrigen !== 'all' ||
    filterProyecto !== 'all' ||
    filterEstatus !== 'all';

  return (
    <div id="gastos-module-container" className="space-y-6">
      <PageHeader
        title="Gastos pagados"
        subtitle={`${expenses.length} gastos registrados.`}
        action={
          <Button id="btn-add-expense" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
            Registrar gasto
          </Button>
        }
      />

      <SummaryStrip
        items={[
          { id: 'kpi-total-gastos', label: 'Total acumulado', value: totalGastos, primary: true, note: 'Suma absoluta de egresos capturados' },
          { id: 'kpi-gastos-pagado', label: 'Liquidado', value: totalPagado, note: 'Cargos debitados exitosamente' },
          { id: 'kpi-gastos-pendiente', label: 'Pendiente de pago', value: totalPendiente, note: 'Egresos pendientes de fondear o pagar' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar concepto"
          ariaLabel="Buscar concepto"
        />
        <SelectField
          value={filterCategory}
          onChange={setFilterCategory}
          ariaLabel="Filtrar por categoría"
          options={[
            { value: 'all', label: 'Todas las categorías' },
            ...CATEGORIES.map(category => ({ value: category, label: category })),
          ]}
        />
        <SelectField
          value={filterOrigen}
          onChange={setFilterOrigen}
          ariaLabel="Filtrar por cuenta de origen"
          options={[
            { value: 'all', label: 'Todas las cuentas origen' },
            { value: 'San', label: 'San' },
            { value: 'Ale', label: 'Ale' },
            { value: 'Empresa', label: 'Empresa' },
          ]}
        />
        <SelectField
          value={filterProyecto}
          onChange={setFilterProyecto}
          ariaLabel="Filtrar por proyecto u operativo"
          options={[
            { value: 'all', label: 'Todos los proyectos / Operativo' },
            { value: 'operativo', label: 'Solo Gastos Operativos' },
            ...projects.map(p => ({ value: p.id, label: `[${p.codigo}] ${p.nombre}` })),
          ]}
        />
        <SelectField
          value={filterEstatus}
          onChange={setFilterEstatus}
          ariaLabel="Filtrar por estatus"
          options={[
            { value: 'all', label: 'Todos los estatus' },
            { value: 'Pagado', label: 'Pagado' },
            { value: 'Pendiente', label: 'Pendiente' },
          ]}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-11 px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <DataCard id="gastos-table-wrapper">
        {filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
              <Coins size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink">Sin gastos registrados</h3>
            <p className="text-sm text-ink-muted mt-1 max-w-md">
              {expenses.length === 0
                ? 'El catálogo de gastos está vacío. Comience registrando egresos operativos o pagos a proveedores.'
                : 'Ningún gasto coincide con los filtros aplicados en este momento.'}
            </p>
            {expenses.length > 0 && (
              <Button variant="ghost" onClick={handleResetFilters} className="mt-4">
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Gastos pagados" className="min-w-0" style={{ minWidth: '1350px' }}>
                <div role="row" className={`${GRID_COLUMNS} border-b border-line py-3`} style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Concepto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Categoría</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Clasificación</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Origen</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Total</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Fecha</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Pago</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Acciones</div>
                </div>

                {filteredExpenses.map(exp => (
                  <div key={exp.id} role="row" className={`${GRID_COLUMNS} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]`} style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    <div role="cell" className="min-w-0">
                      <p className="font-semibold text-ink truncate">{exp.concepto}</p>
                      {(exp.esReembolsable || exp.tieneFactura) && (
                        <p className="mt-0.5 text-[13px] text-ink-muted">
                          {exp.esReembolsable && 'Reembolsable'}
                          {exp.esReembolsable && exp.tieneFactura && ' · '}
                          {exp.tieneFactura && 'Factura vinculada'}
                        </p>
                      )}
                    </div>

                    <div role="cell">{exp.categoriaId}</div>

                    <div role="cell">
                      <p>{exp.tipo === 'Operativo' ? 'Operativo' : 'Proveedor por proyecto'}</p>
                      {exp.tipo !== 'Operativo' && getProjectDisplay(exp.proyectoId) && (
                        <p className="mt-0.5 text-[13px] text-ink-muted">{getProjectDisplay(exp.proyectoId)}</p>
                      )}
                    </div>

                    <div role="cell">{exp.cuentaOrigen}</div>

                    <div role="cell">
                      <Money value={exp.total} size="sm" />
                      {(exp.isrRetenido > 0 || exp.ivaRetenido > 0) && (
                        <p className="mt-0.5 text-[13px] text-ink-muted">Con retenciones</p>
                      )}
                    </div>

                    <div role="cell">
                      <p className="whitespace-nowrap tabular-nums">{formatDateShort(exp.fecha)}</p>
                    </div>

                    <div role="cell">
                      <StatusDot tone={exp.estatusPago === 'Pagado' ? 'ok' : 'risk'} label={exp.estatusPago} />
                    </div>

                    <div role="cell" className="flex items-center gap-1 -my-2">
                      <IconButton label="Editar gasto" icon={<Pencil size={16} />} onClick={() => onEditClick(exp)} />
                      <IconButton label="Eliminar gasto" tone="danger" icon={<Trash2 size={16} />} onClick={() => onDeleteClick(exp.id)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="px-6 py-3 text-[13px] text-ink-muted">
              Mostrando {filteredExpenses.length} de {expenses.length} gastos
            </p>
          </>
        )}
      </DataCard>
    </div>
  );
}
