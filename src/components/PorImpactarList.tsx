import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Zap, Banknote, RotateCcw, Coins } from 'lucide-react';
import { Project, PorImpactar } from '../types';
import { formatCurrency, formatDateShort, getDueDateIndicator } from '../utils';
import { formatPeriodo } from '../utils/iva';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Money from './ui/Money';
import SummaryStrip from './ui/SummaryStrip';
import SearchInput from './ui/SearchInput';
import SelectField from './ui/SelectField';
import StatusDot from './ui/StatusDot';
import DataCard from './ui/DataCard';

interface PorImpactarListProps {
  records: PorImpactar[];
  projects: Project[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (record: PorImpactar) => void;
  onDeleteClick: (id: string) => void;
  onResolveClick: (record: PorImpactar) => void;
  onMarkPaidClick: (record: PorImpactar) => void;
  onRevertPaidClick: (id: string) => void;
}

const GRID_COLUMNS = 'grid gap-4 px-6';
const GRID_TEMPLATE = 'minmax(220px,2fr) 140px 120px minmax(180px,1.4fr) 120px 120px minmax(170px,1.2fr) 180px';

export default function PorImpactarList({
  records,
  projects,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onResolveClick,
  onMarkPaidClick,
  onRevertPaidClick
}: PorImpactarListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-enchanted-green border-t-transparent" />
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'resuelto'>('all');
  const [socioFilter, setSocioFilter] = useState<'all' | 'San' | 'Ale' | 'Empresa'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'Pagado' | 'Pendiente'>('all');
  const [revertConfirmId, setRevertConfirmId] = useState<string | null>(null);

  const totalPending = records
    .filter(r => r.estatus === 'pendiente')
    .reduce((sum, r) => sum + r.monto, 0);

  const totalResolved = records
    .filter(r => r.estatus === 'resuelto')
    .reduce((sum, r) => sum + r.monto, 0);

  const totalPorPagar = records
    .filter(r => r.estatus === 'pendiente' && r.estatusPago === 'Pendiente')
    .reduce((sum, r) => sum + r.monto, 0);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.estatus === statusFilter;
    const matchesSocio = socioFilter === 'all' || record.socioResponsable === socioFilter;
    const matchesPayment = paymentFilter === 'all' || record.estatusPago === paymentFilter;

    let matchesProject = true;
    if (projectFilter !== 'all') {
      if (projectFilter === 'none') {
        matchesProject = record.proyectoOrigenId === null;
      } else {
        matchesProject = record.proyectoOrigenId === projectFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesSocio && matchesPayment && matchesProject;
  });

  const handleDeleteTrigger = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = (id: string) => {
    onDeleteClick(id);
    setDeleteConfirmId(null);
  };

  const handleRevertConfirm = (id: string) => {
    onRevertPaidClick(id);
    setRevertConfirmId(null);
  };

  const getProjectName = (projId: string | null) => {
    if (!projId) return 'Sin proyecto / Gasto general';
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto no encontrado';
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSocioFilter('all');
    setPaymentFilter('all');
    setProjectFilter('all');
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== 'all' ||
    socioFilter !== 'all' ||
    paymentFilter !== 'all' ||
    projectFilter !== 'all';

  return (
    <div id="por-impactar-container" className="space-y-6">
      <PageHeader
        title="Por impactar"
        subtitle="Gastos por asignar a un proyecto, con su estado de pago al proveedor."
        action={
          <Button id="add-por-impactar-btn" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
            Registrar por impactar
          </Button>
        }
      />

      <SummaryStrip
        items={[
          { id: 'kpi-por-impactar-pending', label: 'Por recuperar', value: totalPending, primary: true },
          { id: 'kpi-por-impactar-resolved', label: 'Recuperado', value: totalResolved },
          { id: 'kpi-por-impactar-provider-pending', label: 'Por pagar a proveedores (sin IVA)', value: totalPorPagar },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por descripción"
          ariaLabel="Buscar por descripción"
        />
        <SelectField
          value={statusFilter}
          onChange={value => setStatusFilter(value as 'all' | 'pendiente' | 'resuelto')}
          ariaLabel="Filtrar por estatus"
          options={[
            { value: 'all', label: 'Todos los estatus' },
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'resuelto', label: 'Resuelto' },
          ]}
        />
        <SelectField
          value={socioFilter}
          onChange={value => setSocioFilter(value as 'all' | 'San' | 'Ale' | 'Empresa')}
          ariaLabel="Filtrar por socio"
          options={[
            { value: 'all', label: 'Todos los socios' },
            { value: 'Empresa', label: 'Empresa' },
            { value: 'San', label: 'San' },
            { value: 'Ale', label: 'Ale' },
          ]}
        />
        <SelectField
          value={paymentFilter}
          onChange={value => setPaymentFilter(value as 'all' | 'Pagado' | 'Pendiente')}
          ariaLabel="Filtrar por pago a proveedor"
          options={[
            { value: 'all', label: 'Todos los pagos' },
            { value: 'Pagado', label: 'Pagado' },
            { value: 'Pendiente', label: 'Se le debe' },
          ]}
        />
        <SelectField
          value={projectFilter}
          onChange={setProjectFilter}
          ariaLabel="Filtrar por proyecto"
          options={[
            { value: 'all', label: 'Todos los proyectos' },
            { value: 'none', label: 'Sin proyecto / Gasto general' },
            ...projects.map(p => ({ value: p.id, label: `[${p.codigo}] ${p.nombre}` })),
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

      <DataCard id="por-impactar-table-wrapper">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
              <Coins size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink">No se encontraron registros</h3>
            <p className="text-sm text-ink-muted mt-1 max-w-md">
              {records.length === 0
                ? 'No hay registros en esta sección. Presiona "Registrar por impactar" para comenzar.'
                : 'Prueba cambiando los filtros o el término de búsqueda para ver más registros.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Registros por impactar" className="min-w-0" style={{ minWidth: '1410px' }}>
                <div role="row" className={`${GRID_COLUMNS} border-b border-line py-3`} style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Descripción</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Monto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Socio</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proyecto de referencia</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Fecha</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Estatus</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Pago a proveedor</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">Acciones</div>
                </div>

                {filteredRecords.map(record => {
                  const isPending = record.estatus === 'pendiente';
                  const isPaid = record.estatusPago === 'Pagado';
                  const dueIndicator = isPending && !isPaid && record.fechaVencimiento
                    ? getDueDateIndicator('Pendiente', record.fechaVencimiento)
                    : null;

                  return (
                    <div key={record.id} role="row" className={`${GRID_COLUMNS} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]`} style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                      <div role="cell" className="min-w-0">
                        <p className="font-semibold text-ink truncate" title={record.descripcion}>{record.descripcion}</p>
                      </div>

                      <div role="cell">
                        <Money value={record.monto} size="sm" />
                        {record.tieneFactura && record.iva > 0 && (
                          <p className="mt-0.5 text-[13px] text-ink-muted">IVA {formatCurrency(record.iva)}</p>
                        )}
                      </div>

                      <div role="cell">{record.socioResponsable}</div>

                      <div role="cell" className={!record.proyectoOrigenId && record.estatus !== 'resuelto' ? 'text-ink-muted' : ''}>
                        {record.estatus === 'resuelto'
                          ? record.proyectoDestinoId ? getProjectName(record.proyectoDestinoId) : 'Sin proyecto'
                          : record.proyectoOrigenId ? getProjectName(record.proyectoOrigenId) : 'Sin proyecto'}
                      </div>

                      <div role="cell">
                        <p className="whitespace-nowrap tabular-nums">{formatDateShort(record.fecha)}</p>
                      </div>

                      <div role="cell">
                        <StatusDot tone={isPending ? 'neutral' : 'ok'} label={isPending ? 'Pendiente' : 'Resuelto'} />
                      </div>

                      <div role="cell" className="flex flex-col items-start gap-1.5">
                        {isPaid ? (
                          <>
                            <StatusDot tone="ok" label="Pagado" />
                            {record.fechaPago && (
                              <p className="text-[13px] text-ink-muted whitespace-nowrap">
                                {formatDateShort(record.fechaPago)}{record.tieneFactura ? ' · CFDI' : ''}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <StatusDot tone="risk" label="Se le debe" />
                            {dueIndicator && (
                              dueIndicator.type === 'future' ? (
                                <span className="text-[13px] text-ink-muted whitespace-nowrap">{dueIndicator.text}</span>
                              ) : dueIndicator.type === 'today' ? (
                                <span className="text-[13px] text-risk font-semibold whitespace-nowrap">{dueIndicator.text}</span>
                              ) : (
                                <span className="text-xs bg-risk text-paper font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">{dueIndicator.text}</span>
                              )
                            )}
                          </>
                        )}
                      </div>

                      <div role="cell" className="flex items-center gap-1 -my-2">
                        {isPending && !isPaid && (
                          <IconButton label="Marcar pagado" icon={<Banknote size={16} />} onClick={() => onMarkPaidClick(record)} />
                        )}
                        {isPending && isPaid && (
                          revertConfirmId === record.id ? (
                            <div className="flex items-center space-x-1.5 bg-risk/10 p-1 rounded max-w-[260px]">
                              <span className="text-[10px] font-bold text-risk px-1 text-left leading-tight">
                                {record.tieneFactura && record.fechaPago
                                  ? `¿Revertir? Su IVA sale de ${formatPeriodo(record.fechaPago.slice(0, 7))}`
                                  : '¿Revertir a "Se le debe"?'}
                              </span>
                              <button onClick={() => handleRevertConfirm(record.id)} className="text-xs font-bold text-risk hover:underline px-1">Sí</button>
                              <button onClick={() => setRevertConfirmId(null)} className="text-xs font-semibold text-ink-muted hover:underline px-1">No</button>
                            </div>
                          ) : (
                            <IconButton label="Revertir pago" icon={<RotateCcw size={16} />} onClick={() => setRevertConfirmId(record.id)} />
                          )
                        )}
                        {isPending && (
                          <IconButton label="Resolver" icon={<Zap size={16} />} onClick={() => onResolveClick(record)} />
                        )}
                        {isPending && (
                          <IconButton label="Editar registro" icon={<Pencil size={16} />} onClick={() => onEditClick(record)} />
                        )}
                        {isPending ? (
                          deleteConfirmId === record.id ? (
                            <div className="flex items-center space-x-1.5 bg-risk/10 p-1 rounded">
                              <span className="text-[10px] font-bold text-risk px-1">¿Borrar?</span>
                              <button onClick={() => handleDeleteConfirm(record.id)} className="text-xs font-bold text-risk hover:underline px-1">Sí</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="text-xs font-semibold text-ink-muted hover:underline px-1">No</button>
                            </div>
                          ) : (
                            <IconButton label="Eliminar registro" tone="danger" icon={<Trash2 size={16} />} onClick={() => handleDeleteTrigger(record.id)} />
                          )
                        ) : (
                          <span className="text-[13px] italic text-ink-muted px-2 select-none">No modificable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="px-6 py-3 text-[13px] text-ink-muted">
              Mostrando {filteredRecords.length} de {records.length} registros
            </p>
          </>
        )}
      </DataCard>
    </div>
  );
}
