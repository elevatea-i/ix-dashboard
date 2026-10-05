import { useState } from 'react';
import { Project, Client, Invoice, ProviderPayment, Expense, ThirdPartyPayment } from '../types';
import { 
  calculateProjectProfitability, 
  calculateClientsProfitability,
  ProjectProfitability,
  ClientProfitability 
} from '../utils/profitability';
import { Briefcase, Users, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils';
import PageHeader from './ui/PageHeader';
import SummaryStrip from './ui/SummaryStrip';
import SearchInput from './ui/SearchInput';
import DataCard from './ui/DataCard';

interface RentabilidadListProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  providerPayments: ProviderPayment[];
  expenses: Expense[];
  thirdPartyPayments: ThirdPartyPayment[];
}

const GRID_COLS_PROJ =
  'grid grid-cols-[minmax(220px,2fr)_minmax(160px,1fr)_130px_130px_140px_130px_130px_110px] gap-4 px-6';

const GRID_COLS_CLIENT =
  'grid grid-cols-[minmax(200px,2fr)_90px_130px_130px_140px_130px_130px_110px] gap-4 px-6';

export default function RentabilidadList({
  projects = [],
  clients = [],
  invoices = [],
  providerPayments = [],
  expenses = [],
  thirdPartyPayments = []
}: RentabilidadListProps) {
  const [activeTab, setActiveTab] = useState<'proyectos' | 'clientes'>('proyectos');
  const [searchTerm, setSearchTerm] = useState('');

  const projectsData: ProjectProfitability[] = projects.map(project => {
    const client = clients.find(c => c.id === project.clienteId);
    const clientName = client ? client.nombre : 'Cliente Desconocido';
    return calculateProjectProfitability(
      project,
      clientName,
      invoices,
      providerPayments,
      expenses,
      thirdPartyPayments
    );
  });

  const clientsData: ClientProfitability[] = calculateClientsProfitability(
    clients,
    projects,
    invoices,
    providerPayments,
    expenses,
    thirdPartyPayments
  );

  const totalCostoCliente = projectsData.reduce((sum, p) => sum + p.costoCliente, 0);
  const totalGanancia = projectsData.reduce((sum, p) => sum + p.ganancia, 0);

  const projectsWithRevenue = projectsData.filter(p => p.costoCliente > 0);
  const averageRentabilidad = projectsWithRevenue.length > 0
    ? Number((projectsWithRevenue.reduce((sum, p) => sum + (typeof p.porcentajeRentabilidad === 'number' ? p.porcentajeRentabilidad : 0), 0) / projectsWithRevenue.length).toFixed(1))
    : 0;

  const filteredProjects = projectsData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.proyectoNombre.toLowerCase().includes(searchLower) ||
      item.proyectoCodigo.toLowerCase().includes(searchLower) ||
      item.clienteNombre.toLowerCase().includes(searchLower)
    );
  });

  const filteredClients = clientsData.filter(item => {
    return item.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleResetFilters = () => {
    setSearchTerm('');
  };

  return (
    <div id="rentabilidad-container" className="space-y-6">
      <PageHeader
        title="Rentabilidad"
        subtitle={`Rentabilidad promedio ${averageRentabilidad}%`}
      />

      <SummaryStrip
        items={[
          { id: 'kpi-rentabilidad-ganancia', label: 'Ganancia acumulada', value: totalGanancia, primary: true },
          { id: 'kpi-rentabilidad-costo-cliente', label: 'Facturado a clientes (sin IVA)', value: totalCostoCliente },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-field overflow-hidden">
          <button
            type="button"
            onClick={() => { setActiveTab('proyectos'); setSearchTerm(''); }}
            aria-pressed={activeTab === 'proyectos'}
            className={`inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold transition-colors ${
              activeTab === 'proyectos'
                ? 'bg-ink text-paper'
                : 'bg-transparent text-ink-muted hover:text-ink hover:bg-ink/5'
            }`}
          >
            <Briefcase size={14} />
            <span>Por proyecto</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('clientes'); setSearchTerm(''); }}
            aria-pressed={activeTab === 'clientes'}
            className={`inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold transition-colors ${
              activeTab === 'clientes'
                ? 'bg-ink text-paper'
                : 'bg-transparent text-ink-muted hover:text-ink hover:bg-ink/5'
            }`}
          >
            <Users size={14} />
            <span>Por cliente</span>
          </button>
        </div>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={activeTab === 'proyectos' ? 'Buscar proyecto o cliente' : 'Buscar cliente'}
          ariaLabel={activeTab === 'proyectos' ? 'Buscar proyecto o cliente' : 'Buscar cliente'}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-11 px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {activeTab === 'proyectos' ? (
        <DataCard id="rentabilidad-proyectos-table">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-base font-semibold text-ink">Sin resultados</h3>
              <p className="text-sm text-ink-muted mt-1 max-w-md">
                No se encontraron proyectos con facturas o gastos registrados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div role="table" aria-label="Rentabilidad por proyecto" className="min-w-[1200px]">
                  <div role="row" className={`${GRID_COLS_PROJ} border-b border-line py-3`}>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proyecto</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Cliente</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Costo cliente</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Costo proveedor</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Gastos proveedor vinc.</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Pagos a terceros</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Ganancia</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Rentabilidad</div>
                  </div>

                  {filteredProjects.map((item) => {
                    const isProfitNegative = item.ganancia < 0;
                    return (
                      <div
                        key={item.proyectoId}
                        role="row"
                        className={`${GRID_COLS_PROJ} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]}`}
                      >
                        <div role="cell" className="min-w-0">
                          <p className="font-semibold text-ink truncate" title={item.proyectoCodigo}>{item.proyectoCodigo}</p>
                          <p className="mt-0.5 text-[13px] text-ink-muted truncate" title={item.proyectoNombre}>{item.proyectoNombre}</p>
                        </div>
                        <div role="cell" className="min-w-0">
                          <p className="text-ink-muted truncate" title={item.clienteNombre}>{item.clienteNombre}</p>
                        </div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.costoCliente)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.costoProveedor)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.gastosProveedorVinculados)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.costoTerceros)}</div>
                        <div role="cell" className={`text-right font-semibold tabular-nums ${isProfitNegative ? 'text-risk' : 'text-ink'}`}>
                          {formatCurrency(item.ganancia)}
                        </div>
                        <div role="cell" className="text-right tabular-nums">
                          {item.porcentajeRentabilidad === 'N/A' ? (
                            <span className="text-ink-muted">N/A</span>
                          ) : (
                            <span className="text-ink">{item.porcentajeRentabilidad}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="px-6 py-3 text-[13px] text-ink-muted">
                Mostrando {filteredProjects.length} de {projectsData.length} proyectos
              </p>
            </>
          )}
        </DataCard>
      ) : (
        <DataCard id="rentabilidad-clientes-table">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-base font-semibold text-ink">Sin resultados</h3>
              <p className="text-sm text-ink-muted mt-1 max-w-md">
                No se encontraron clientes registrados con proyectos.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div role="table" aria-label="Rentabilidad por cliente" className="min-w-[1200px]">
                  <div role="row" className={`${GRID_COLS_CLIENT} border-b border-line py-3`}>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Cliente</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">N.º de proyectos</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Costo cliente</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Costo proveedor</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Gastos proveedor vinc.</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Pagos a terceros</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Ganancia total</div>
                    <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Rentabilidad</div>
                  </div>

                  {filteredClients.map((item) => {
                    const isProfitNegative = item.gananciaTotal < 0;
                    return (
                      <div
                        key={item.clienteId}
                        role="row"
                        className={`${GRID_COLS_CLIENT} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]}`}
                      >
                        <div role="cell" className="min-w-0">
                          <p className="font-semibold text-ink truncate" title={item.clienteNombre}>{item.clienteNombre}</p>
                        </div>
                        <div role="cell" className="text-center tabular-nums text-ink-muted">{item.numeroProyectos}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.costoClienteTotal)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.costoProveedorTotal)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.gastosProveedorVinculadosTotal)}</div>
                        <div role="cell" className="text-right tabular-nums text-ink-muted">{formatCurrency(item.costoTercerosTotal)}</div>
                        <div role="cell" className={`text-right font-semibold tabular-nums ${isProfitNegative ? 'text-risk' : 'text-ink'}`}>
                          {formatCurrency(item.gananciaTotal)}
                        </div>
                        <div role="cell" className="text-right tabular-nums">
                          {item.porcentajeRentabilidad === 'N/A' ? (
                            <span className="text-ink-muted">N/A</span>
                          ) : (
                            <span className="text-ink">{item.porcentajeRentabilidad}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="px-6 py-3 text-[13px] text-ink-muted">
                Mostrando {filteredClients.length} de {clientsData.length} clientes
              </p>
            </>
          )}
        </DataCard>
      )}
    </div>
  );
}
