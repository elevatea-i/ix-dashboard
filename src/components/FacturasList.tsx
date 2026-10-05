import { useState, useMemo } from 'react';
import { Invoice, Project, Client } from '../types';
import { Plus, Pencil, Trash2, Banknote, Receipt } from 'lucide-react';
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

interface FacturasListProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (invoice: Invoice) => void;
  onDeleteClick: (id: string) => void;
  onMarkAsPaidClick: (invoice: Invoice) => void;
}

const numeroFolio = (folio: string) => parseInt(folio.replace(/\D/g, ''), 10) || 0;

const GRID_COLUMNS = 'grid gap-4 px-6';
const GRID_TEMPLATE = '140px minmax(220px,1.5fr) minmax(160px,1fr) 120px 120px 120px 140px 140px';

export default function FacturasList({
  invoices,
  projects,
  clients,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onMarkAsPaidClick
}: FacturasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPpdNoComplement, setFilterPpdNoComplement] = useState(false);
  const [filterClienteId, setFilterClienteId] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<'todas' | 'facturada' | 'pagada'>('todas');

  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.nombre : 'Proyecto desconocido';
  };

  const getClienteIdForInvoice = (inv: Invoice): string | null => {
    const proj = projects.find(p => p.id === inv.proyectoId);
    return proj ? proj.clienteId : null;
  };

  const totalFacturado = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPagado = invoices.filter(inv => inv.estado === 'pagada').reduce((sum, inv) => sum + inv.total, 0);
  const totalPendiente = totalFacturado - totalPagado;

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => numeroFolio(b.folio) - numeroFolio(a.folio)),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    return sortedInvoices.filter(inv => {
      const projectName = getProjectName(inv.proyectoId).toLowerCase();
      const matchesSearch =
        inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectName.includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filterClienteId !== 'todos') {
        const invClienteId = getClienteIdForInvoice(inv);
        if (invClienteId !== filterClienteId) return false;
      }

      if (filterEstado !== 'todas') {
        if (inv.estado !== filterEstado) return false;
      }

      if (filterPpdNoComplement) {
        if (!(inv.metodoPago === 'PPD' && !inv.complementoEmitido)) return false;
      }

      return true;
    });
  }, [sortedInvoices, searchTerm, filterClienteId, filterEstado, filterPpdNoComplement, projects]);

  const ppdCount = useMemo(
    () =>
      sortedInvoices.filter(inv => {
        const projectName = getProjectName(inv.proyectoId).toLowerCase();
        const matchesSearch =
          inv.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          projectName.includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filterClienteId !== 'todos' && getClienteIdForInvoice(inv) !== filterClienteId) return false;
        if (filterEstado !== 'todas' && inv.estado !== filterEstado) return false;
        return inv.metodoPago === 'PPD' && !inv.complementoEmitido;
      }).length,
    [sortedInvoices, searchTerm, filterClienteId, filterEstado]
  );

  const hasActiveFilters = searchTerm || filterPpdNoComplement || filterClienteId !== 'todos' || filterEstado !== 'todas';

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterPpdNoComplement(false);
    setFilterClienteId('todos');
    setFilterEstado('todas');
  };

  if (loading) {
    return (
      <div id="facturas-module-container" className="space-y-6">
        <PageHeader
          title="Facturación"
          subtitle={`${invoices.length} facturas registradas.`}
          action={
            <Button id="btn-add-invoice" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
              Registrar factura
            </Button>
          }
        />
        <DataCard id="facturas-table-wrapper">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent" />
          </div>
        </DataCard>
      </div>
    );
  }

  return (
    <div id="facturas-module-container" className="space-y-6">
      <PageHeader
        title="Facturación"
        subtitle={`${invoices.length} facturas registradas.`}
        action={
          <Button id="btn-add-invoice" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
            Registrar factura
          </Button>
        }
      />

      <SummaryStrip
        items={[
          { id: 'kpi-total-pendiente', label: 'Por cobrar', value: totalPendiente, primary: true },
          { id: 'kpi-total-pagado', label: 'Cobrado', value: totalPagado },
          { id: 'kpi-total-facturado', label: 'Facturado', value: totalFacturado },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por folio o proyecto"
          ariaLabel="Buscar por folio o proyecto"
        />
        <SelectField
          value={filterClienteId}
          onChange={setFilterClienteId}
          ariaLabel="Filtrar por cliente"
          options={[
            { value: 'todos', label: 'Todos los clientes' },
            ...clients.map(c => ({ value: c.id, label: c.nombre })),
          ]}
        />
        <SelectField
          value={filterEstado}
          onChange={value => setFilterEstado(value as 'todas' | 'facturada' | 'pagada')}
          ariaLabel="Filtrar por estado"
          options={[
            { value: 'todas', label: 'Todos los estados' },
            { value: 'facturada', label: 'Facturada' },
            { value: 'pagada', label: 'Pagada' },
          ]}
        />
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

      <DataCard id="facturas-table-wrapper">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
              <Receipt size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink">No se encontraron facturas</h3>
            <p className="text-sm text-ink-muted mt-1 max-w-md">
              {invoices.length === 0
                ? 'No hay facturas registradas. Presiona "Registrar factura" para comenzar.'
                : 'Prueba cambiando los filtros o el término de búsqueda para ver más facturas.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Facturas" className="min-w-0" style={{ minWidth: '1280px' }}>
                <div role="row" className={`${GRID_COLUMNS} border-b border-line py-3`} style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Folio</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proyecto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Monto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Método</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Estado</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Emisión</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Fecha de pago</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">Acciones</div>
                </div>

                {filteredInvoices.map(inv => {
                  const isPaid = inv.estado === 'pagada';
                  return (
                    <div
                      key={inv.id}
                      role="row"
                      className={`${GRID_COLUMNS} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]`}
                      style={{ gridTemplateColumns: GRID_TEMPLATE }}
                    >
                      <div role="cell" className="min-w-0">
                        <p className="font-semibold text-ink truncate" title={inv.folio}>{inv.folio}</p>
                        <p className="mt-0.5 text-[13px] text-ink-muted">Por: {inv.facturado_por || 'IX'}</p>
                      </div>

                      <div role="cell" className="min-w-0">
                        <p className="text-ink truncate" title={getProjectName(inv.proyectoId)}>
                          {getProjectName(inv.proyectoId)}
                        </p>
                      </div>

                      <div role="cell">
                        <Money value={inv.total} size="sm" />
                        <p className="mt-0.5 text-[13px] text-ink-muted tabular-nums">
                          Subtotal {formatCurrency(inv.subtotal)}
                        </p>
                      </div>

                      <div role="cell">
                        <p className="font-semibold">{inv.metodoPago}</p>
                        {inv.metodoPago === 'PPD' && (
                          <p className={`mt-0.5 text-[13px] ${inv.complementoEmitido ? 'text-ink-muted' : 'text-risk font-medium'}`}>
                            {inv.complementoEmitido ? 'Con compl.' : 'Sin compl.'}
                          </p>
                        )}
                      </div>

                      <div role="cell">
                        <StatusDot tone={isPaid ? 'ok' : 'risk'} label={isPaid ? 'Pagada' : 'Facturada'} />
                      </div>

                      <div role="cell">
                        <p className="whitespace-nowrap tabular-nums">{formatDateShort(inv.fechaEmision)}</p>
                      </div>

                      <div role="cell">
                        {inv.fechaPago ? (
                          <p className="whitespace-nowrap tabular-nums">{formatDateShort(inv.fechaPago)}</p>
                        ) : (
                          <p className="text-ink-muted">Pendiente</p>
                        )}
                      </div>

                      <div role="cell" className="flex items-center justify-center gap-1 -my-2">
                        {!isPaid && (
                          <IconButton
                            label="Marcar pagada"
                            icon={<Banknote size={16} />}
                            onClick={() => onMarkAsPaidClick(inv)}
                          />
                        )}
                        <IconButton
                          label="Editar factura"
                          icon={<Pencil size={16} />}
                          onClick={() => onEditClick(inv)}
                        />
                        <IconButton
                          label="Eliminar factura"
                          tone="danger"
                          icon={<Trash2 size={16} />}
                          onClick={() => onDeleteClick(inv.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="px-6 py-3 text-[13px] text-ink-muted">
              Mostrando {filteredInvoices.length} de {invoices.length} facturas
            </p>
          </>
        )}
      </DataCard>
    </div>
  );
}
