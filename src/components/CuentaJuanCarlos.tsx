import { useState } from 'react';
import { Invoice, Expense, Project } from '../types';
import { formatCurrency, formatDateShort } from '../utils';
import { Receipt, TrendingDown } from 'lucide-react';
import PageHeader from './ui/PageHeader';
import SummaryStrip from './ui/SummaryStrip';
import SearchInput from './ui/SearchInput';
import DataCard from './ui/DataCard';

interface CuentaJuanCarlosProps {
  invoices: Invoice[];
  expenses: Expense[];
  projects: Project[];
}

export default function CuentaJuanCarlos({
  invoices,
  expenses,
  projects
}: CuentaJuanCarlosProps) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  const getProjectName = (projId: string | null) => {
    if (!projId) return 'N/A / Operativo';
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.nombre : 'Proyecto desconocido';
  };

  const pendingInvoices = invoices.filter(
    (inv) => inv.facturado_por === 'Juan Carlos' && inv.estado === 'facturada'
  );
  const totalJuanCarlosDebe = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const pendingExpenses = expenses.filter(
    (exp) => exp.cuentaOrigen === 'Juan Carlos' && exp.estatusPago === 'Pendiente'
  );
  const totalLeDebemosAJuanCarlos = pendingExpenses.reduce((sum, exp) => sum + exp.total, 0);

  const saldoNeto = totalJuanCarlosDebe - totalLeDebemosAJuanCarlos;

  const filteredInvoices = pendingInvoices.filter((inv) => {
    const projName = getProjectName(inv.proyectoId).toLowerCase();
    return (
      inv.folio.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      projName.includes(invoiceSearch.toLowerCase())
    );
  });

  const filteredExpenses = pendingExpenses.filter((exp) => {
    const projName = getProjectName(exp.proyectoId).toLowerCase();
    return (
      exp.concepto.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      projName.includes(expenseSearch.toLowerCase()) ||
      exp.categoriaId.toLowerCase().includes(expenseSearch.toLowerCase())
    );
  });

  return (
    <div id="juan-carlos-module-container" className="space-y-6">
      <PageHeader
        title="Cuenta Juan Carlos"
        subtitle="Conciliación de operaciones facturadas o financiadas a su nombre."
      />

      <SummaryStrip
        items={[
          {
            id: 'saldo-neto-jc',
            label: 'Saldo neto conciliado',
            value: saldoNeto,
            primary: true,
            note: saldoNeto > 0
              ? 'A favor de la empresa'
              : saldoNeto < 0
                ? 'A favor de Juan Carlos'
                : 'Saldos conciliados',
          },
          {
            id: 'jc-te-debe',
            label: 'Juan Carlos te debe',
            value: totalJuanCarlosDebe,
            note: 'Facturas emitidas bajo su razón social con estado pendiente. Representa dinero cobrado por él que debe transferir a la empresa.',
          },
          {
            id: 'le-debes-a-jc',
            label: 'Le debes a Juan Carlos',
            value: totalLeDebemosAJuanCarlos,
            note: 'Gastos de la empresa pagados con su cuenta personal o tarjeta con estatus pendiente de reembolso.',
          },
        ]}
      />

      <DataCard id="jc-mensaje-saldo" className="p-5">
        {saldoNeto > 0 ? (
          <p className="text-sm text-ink">
            <span className="font-semibold">A favor de la empresa:</span> Juan Carlos debe transferir <span className="font-semibold tabular-nums">{formatCurrency(saldoNeto)}</span> a la cuenta de IX.
          </p>
        ) : saldoNeto < 0 ? (
          <p className="text-sm text-ink">
            <span className="font-semibold">A favor de Juan Carlos:</span> La empresa debe reembolsar <span className="font-semibold tabular-nums">{formatCurrency(Math.abs(saldoNeto))}</span> a Juan Carlos.
          </p>
        ) : (
          <p className="text-sm text-ink-muted text-center">
            Saldos perfectamente conciliados. No hay cobros ni adeudos pendientes.
          </p>
        )}
      </DataCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cobros por transferir */}
        <DataCard id="jc-cobros-table" className="flex flex-col">
          <div className="p-5 border-b border-line space-y-3">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-ink-muted" />
              <h4 className="text-sm font-semibold text-ink">Cobros por transferir</h4>
            </div>
            <p className="text-[13px] text-ink-muted">
              Facturado por Juan Carlos pendiente de transferir a la empresa.
            </p>
            <SearchInput
              value={invoiceSearch}
              onChange={setInvoiceSearch}
              placeholder="Buscar folio o proyecto"
              ariaLabel="Buscar folio o proyecto en cobros por transferir"
            />
          </div>

          <div className="flex-1 overflow-x-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">
                {invoiceSearch ? 'Sin resultados para la búsqueda' : 'No hay cobros pendientes de Juan Carlos'}
              </div>
            ) : (
              <div role="table" aria-label="Cobros por transferir" className="min-w-0" style={{ minWidth: '640px' }}>
                <div role="row" className="grid grid-cols-[120px_1fr_130px_100px_120px] gap-4 px-5 border-b border-line py-3">
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Folio</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Proyecto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Monto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">Método</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Emisión</div>
                </div>
                {filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    role="row"
                    className="grid grid-cols-[120px_1fr_130px_100px_120px] gap-4 px-5 items-start border-b border-line py-3.5 text-sm text-ink transition-colors hover:bg-ink/[0.03]"
                  >
                    <div role="cell" className="font-semibold text-ink truncate" title={inv.folio}>{inv.folio}</div>
                    <div role="cell" className="min-w-0">
                      <p className="text-ink truncate" title={getProjectName(inv.proyectoId)}>{getProjectName(inv.proyectoId)}</p>
                    </div>
                    <div role="cell" className="text-right font-semibold tabular-nums text-ink">{formatCurrency(inv.total)}</div>
                    <div role="cell" className="text-center text-ink-muted">{inv.metodoPago}</div>
                    <div role="cell" className="tabular-nums text-[13px] text-ink-muted">{formatDateShort(inv.fechaEmision)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-line text-right text-[13px] text-ink-muted">
            Total en cobros: <span className="font-semibold text-ink tabular-nums">{formatCurrency(totalJuanCarlosDebe)}</span>
          </div>
        </DataCard>

        {/* Gastos por reembolsar */}
        <DataCard id="jc-gastos-table" className="flex flex-col">
          <div className="p-5 border-b border-line space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-ink-muted" />
              <h4 className="text-sm font-semibold text-ink">Gastos por reembolsar</h4>
            </div>
            <p className="text-[13px] text-ink-muted">
              Gastos financiados por Juan Carlos pendientes de reembolso.
            </p>
            <SearchInput
              value={expenseSearch}
              onChange={setExpenseSearch}
              placeholder="Buscar concepto o categoría"
              ariaLabel="Buscar concepto o categoría en gastos por reembolsar"
            />
          </div>

          <div className="flex-1 overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">
                {expenseSearch ? 'Sin resultados para la búsqueda' : 'No hay gastos pendientes por reembolsar'}
              </div>
            ) : (
              <div role="table" aria-label="Gastos por reembolsar" className="min-w-0" style={{ minWidth: '640px' }}>
                <div role="row" className="grid grid-cols-[120px_1fr_1fr_130px_1fr] gap-4 px-5 border-b border-line py-3">
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Fecha</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Concepto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Categoría</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-right">Monto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Vínculo</div>
                </div>
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    role="row"
                    className="grid grid-cols-[120px_1fr_1fr_130px_1fr] gap-4 px-5 items-start border-b border-line py-3.5 text-sm text-ink transition-colors hover:bg-ink/[0.03]"
                  >
                    <div role="cell" className="tabular-nums text-[13px] text-ink-muted whitespace-nowrap">{formatDateShort(exp.fecha)}</div>
                    <div role="cell" className="min-w-0">
                      <p className="text-ink truncate" title={exp.concepto}>{exp.concepto}</p>
                    </div>
                    <div role="cell" className="min-w-0">
                      <p className="text-ink-muted truncate" title={exp.categoriaId}>{exp.categoriaId}</p>
                    </div>
                    <div role="cell" className="text-right font-semibold tabular-nums text-ink whitespace-nowrap">{formatCurrency(exp.total)}</div>
                    <div role="cell" className="min-w-0">
                      <p className="text-ink-muted truncate" title={exp.proyectoId ? getProjectName(exp.proyectoId) : 'Operativo'}>
                        {exp.proyectoId ? getProjectName(exp.proyectoId) : 'Operativo'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-line text-right text-[13px] text-ink-muted">
            Total en gastos: <span className="font-semibold text-ink tabular-nums">{formatCurrency(totalLeDebemosAJuanCarlos)}</span>
          </div>
        </DataCard>
      </div>
    </div>
  );
}
