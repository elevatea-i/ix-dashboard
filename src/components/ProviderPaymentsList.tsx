import React, { useState } from 'react';
import { ProviderPayment, Project, AbonoProveedor } from '../types';
import { Plus, Pencil, Trash2, Wallet, Loader as Loader2, HandCoins } from 'lucide-react';
import { formatCurrency, formatDateShort, getDueDateIndicator } from '../utils';
import { getAbonosResumen, AbonosResumen } from '../utils/abonos';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import Money from './ui/Money';
import SummaryStrip from './ui/SummaryStrip';
import SearchInput from './ui/SearchInput';
import SelectField from './ui/SelectField';
import StatusDot from './ui/StatusDot';
import DataCard from './ui/DataCard';

interface ProviderPaymentsListProps {
  payments: ProviderPayment[];
  abonos: AbonoProveedor[];
  projects: Project[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (payment: ProviderPayment) => void;
  onDeleteClick: (id: string) => void;
  onAbonosClick: (payment: ProviderPayment) => void;
}

const GRID_COLUMNS =
  'grid grid-cols-[minmax(220px,2fr)_minmax(170px,1.3fr)_130px_80px_130px_minmax(150px,1fr)_136px] gap-4 px-6';

/**
 * ProviderPaymentsList is a clean, responsive component implementing
 * supplier/contractor expenses and payments.
 * Includes status filter, search by provider name, and live statistics with fiscal breakdown.
 */
export default function ProviderPaymentsList({
  payments,
  abonos,
  projects,
  loading = false,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onAbonosClick
}: ProviderPaymentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEstatus, setFilterEstatus] = useState('all');
  const [filterPpdNoComplement, setFilterPpdNoComplement] = useState(false);

  const getProjectDisplay = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? `[${proj.codigo}] ${proj.nombre}` : 'Proyecto desconocido';
  };

  // Installment payments are measured by their abonos; normal payments keep using total + estatus.
  const resumenes = new Map<string, AbonosResumen>(
    payments.filter(p => p.conParcialidades).map(p => [p.id, getAbonosResumen(p, abonos)])
  );
  const normales = payments.filter(p => !p.conParcialidades);
  const parciales = payments.filter(p => p.conParcialidades);

  const isOverdue = (estatus: 'Pagado' | 'Pendiente', fechaVencimiento?: string) => {
    if (estatus !== 'Pendiente' || !fechaVencimiento) return false;
    const indicator = getDueDateIndicator(estatus, fechaVencimiento);
    return !!indicator && indicator.type === 'past';
  };

  const totalPagado =
    normales.filter(p => p.estatus === 'Pagado').reduce((sum, p) => sum + p.total, 0) +
    parciales.reduce((sum, p) => sum + (resumenes.get(p.id)?.pagado ?? 0), 0);

  const totalPendiente =
    normales.filter(p => p.estatus === 'Pendiente').reduce((sum, p) => sum + p.total, 0) +
    parciales.reduce((sum, p) => sum + (resumenes.get(p.id)?.saldo ?? 0), 0);

  const normalesVencidos = normales.filter(p => isOverdue(p.estatus, p.fecha_vencimiento));
  const parcialesVencidos = parciales.filter(p => {
    const saldo = resumenes.get(p.id)?.saldo ?? 0;
    return saldo > 0 && isOverdue('Pendiente', p.fecha_vencimiento);
  });

  const countVencidos = normalesVencidos.length + parcialesVencidos.length;
  const totalVencidos =
    normalesVencidos.reduce((sum, p) => sum + p.total, 0) +
    parcialesVencidos.reduce((sum, p) => sum + (resumenes.get(p.id)?.saldo ?? 0), 0);

  const isPpdSinComplemento = (pay: ProviderPayment) => {
    if (pay.conParcialidades) return (resumenes.get(pay.id)?.sinComplemento ?? 0) > 0;
    return pay.metodoPago === 'PPD' && !pay.complementoEmitido;
  };

  const renderDueIndicator = (estatus: 'Pagado' | 'Pendiente', fechaVencimiento?: string) => {
    const indicator = getDueDateIndicator(estatus, fechaVencimiento);
    if (!indicator) return null;
    if (indicator.type === 'future') {
      return (
        <span className="text-[13px] text-ink-muted whitespace-nowrap">
          {indicator.text}
        </span>
      );
    }
    if (indicator.type === 'today') {
      return (
        <span className="text-[13px] text-risk font-semibold whitespace-nowrap">
          {indicator.text}
        </span>
      );
    }
    return (
      <span className="text-xs bg-risk text-paper font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
        {indicator.text}
      </span>
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterProject('all');
    setFilterEstatus('all');
    setFilterPpdNoComplement(false);
  };

  const filteredPayments = payments.filter(pay => {
    const matchesSearch = pay.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterProject !== 'all' && pay.proyectoId !== filterProject) {
      return false;
    }

    if (filterEstatus !== 'all' && pay.estatus !== filterEstatus) {
      return false;
    }

    if (filterPpdNoComplement) {
      if (!isPpdSinComplemento(pay)) return false;
    }

    return true;
  });

  const ppdCount = payments.filter(pay => {
    const matchesSearch = pay.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterProject !== 'all' && pay.proyectoId !== filterProject) return false;
    if (filterEstatus !== 'all' && pay.estatus !== filterEstatus) return false;
    return isPpdSinComplemento(pay);
  }).length;

  return (
    <div id="provider-payments-container" className="space-y-6">

      <PageHeader
        title="Pagos a proveedores"
        subtitle={`${payments.length} pagos registrados.`}
        action={
          <Button
            id="btn-add-provider-payment"
            variant="primary"
            icon={<Plus size={16} />}
            onClick={onAddClick}
          >
            Registrar pago
          </Button>
        }
      />

      <SummaryStrip
        items={[
          { id: 'kpi-pp-total-pendiente', label: 'Por pagar', value: totalPendiente, primary: true },
          { id: 'kpi-pp-total-pagado', label: 'Pagado', value: totalPagado },
          {
            id: 'kpi-pp-total-vencidos',
            label: 'Vencido',
            value: totalVencidos,
            note: `${countVencidos} ${countVencidos === 1 ? 'pago pendiente vencido' : 'pagos pendientes vencidos'}`,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar proveedor"
          ariaLabel="Buscar proveedor"
        />
        <SelectField
          value={filterProject}
          onChange={setFilterProject}
          ariaLabel="Filtrar por proyecto"
          options={[
            { value: 'all', label: 'Todos los proyectos' },
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
        {/* Single element across states so keyboard focus survives toggling */}
        <button
          id="filter-ppd-no-comp-btn"
          type="button"
          aria-pressed={filterPpdNoComplement}
          onClick={() => setFilterPpdNoComplement(prev => !prev)}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold transition-colors ${
            filterPpdNoComplement
              ? 'border-risk/30 bg-risk/10 text-risk'
              : 'border-field bg-transparent text-ink hover:bg-ink/5'
          }`}
        >
          <span>PPD sin complemento</span>
          {filterPpdNoComplement && (
            <span className="rounded-full bg-risk px-2 py-0.5 text-xs font-semibold text-paper tabular-nums">
              {ppdCount}
            </span>
          )}
        </button>
        {(searchTerm || filterProject !== 'all' || filterEstatus !== 'all' || filterPpdNoComplement) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-11 px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <DataCard id="provider-payments-table-wrapper">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Loader2 size={24} className="text-gold animate-spin mb-3" />
            <p className="text-sm text-ink-muted">Cargando pagos a proveedores…</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
              <Wallet size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink">Sin pagos a proveedores</h3>
            <p className="text-sm text-ink-muted mt-1 max-w-md">
              {payments.length === 0
                ? 'No se han registrado pagos a proveedores todavía.'
                : 'Ningún pago a proveedor coincide con los filtros aplicados en este momento.'}
            </p>
            {payments.length > 0 && (
              <Button variant="ghost" onClick={handleResetFilters} className="mt-4">
                Limpiar Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Pagos a proveedores" className="min-w-[980px]">
                <div role="row" className={`${GRID_COLUMNS} border-b border-line py-3`}>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proveedor</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Monto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Fecha</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Factura</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Método</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Estatus</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Acciones</div>
                </div>

                {filteredPayments.map((pay) => {
                  const resumen = resumenes.get(pay.id);
                  return (
                    <div
                      key={pay.id}
                      role="row"
                      className={`${GRID_COLUMNS} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]`}
                    >
                      <div role="cell" className="min-w-0">
                        <p className="font-semibold text-ink truncate">{pay.proveedor}</p>
                        <p className="mt-0.5 text-[13px] text-ink-muted truncate">
                          {getProjectDisplay(pay.proyectoId)}
                        </p>
                      </div>

                      <div role="cell" className="text-right">
                        <Money value={pay.total} size="sm" />
                        <p className="mt-0.5 text-[13px] text-ink-muted tabular-nums">
                          Sub {formatCurrency(pay.subtotal)} · IVA {formatCurrency(pay.iva)}
                        </p>
                        {(pay.isrRetenido > 0 || pay.ivaRetenido > 0) && (
                          <p className="text-[13px] text-ink-muted tabular-nums">
                            Ret −{formatCurrency((pay.isrRetenido || 0) + (pay.ivaRetenido || 0))}
                          </p>
                        )}
                        {resumen && (
                          <p className="text-[13px] text-ink-muted tabular-nums">
                            Pagado {formatCurrency(resumen.pagado)} · Saldo {formatCurrency(resumen.saldo)}
                          </p>
                        )}
                      </div>

                      <div role="cell">
                        <p className="whitespace-nowrap tabular-nums">{formatDateShort(pay.fecha)}</p>
                        {pay.fecha_vencimiento && pay.estatus === 'Pendiente' && (
                          <p className="mt-0.5 whitespace-nowrap text-[13px] text-ink-muted tabular-nums">
                            Vence {formatDateShort(pay.fecha_vencimiento)}
                          </p>
                        )}
                      </div>

                      <div role="cell">{pay.tieneFactura ? 'Sí' : 'No'}</div>

                      <div role="cell">
                        <p className="font-semibold">{pay.metodoPago || 'Sin especificar'}</p>
                        {pay.metodoPago === 'PPD' && resumen && (
                          <p className={`mt-0.5 text-[13px] ${resumen.sinComplemento === 0 ? 'text-ink-muted' : 'text-risk font-medium'}`}>
                            {resumen.sinComplemento === 0 ? 'Con Compl.' : `${resumen.sinComplemento} sin compl.`}
                          </p>
                        )}
                        {pay.metodoPago === 'PPD' && !resumen && (
                          <p className={`mt-0.5 text-[13px] ${pay.complementoEmitido ? 'text-ink-muted' : 'text-risk font-medium'}`}>
                            {pay.complementoEmitido ? 'Con Compl.' : 'Sin Compl.'}
                          </p>
                        )}
                      </div>

                      <div role="cell" className="flex flex-col items-start gap-1.5">
                        {resumen ? (
                          resumen.saldo === 0 ? (
                            <StatusDot tone="ok" label="Pagado" />
                          ) : (
                            <>
                              <StatusDot tone="risk" label={`Parcial ${Math.floor(resumen.porcentaje)} %`} />
                              <div className="h-1 w-24 rounded-full bg-line overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gold transition-all duration-500"
                                  style={{ width: `${resumen.porcentaje}%` }}
                                />
                              </div>
                              {renderDueIndicator('Pendiente', pay.fecha_vencimiento)}
                            </>
                          )
                        ) : pay.estatus === 'Pagado' ? (
                          <StatusDot tone="ok" label="Pagado" />
                        ) : (
                          <>
                            <StatusDot tone="risk" label="Pendiente" />
                            {renderDueIndicator(pay.estatus, pay.fecha_vencimiento)}
                          </>
                        )}
                      </div>

                      <div role="cell" className="flex items-center justify-end gap-1 -my-2">
                        {resumen && (
                          <IconButton
                            label="Abonos"
                            icon={<HandCoins size={16} />}
                            onClick={() => onAbonosClick(pay)}
                          />
                        )}
                        <IconButton
                          label="Editar pago"
                          icon={<Pencil size={16} />}
                          onClick={() => onEditClick(pay)}
                        />
                        <IconButton
                          label="Eliminar pago"
                          tone="danger"
                          icon={<Trash2 size={16} />}
                          onClick={() => onDeleteClick(pay.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="px-6 py-3 text-[13px] text-ink-muted">
              Mostrando {filteredPayments.length} de {payments.length} pagos
            </p>
          </>
        )}
      </DataCard>

    </div>
  );
}
