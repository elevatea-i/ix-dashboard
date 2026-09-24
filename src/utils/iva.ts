import { Invoice, Expense, ProviderPayment } from '../types';

/**
 * IVA metrics calculated from invoices, expenses, and provider payments.
 * All existing fields are kept for compatibility with BovedaIva.
 */
export interface IvaMetrics {
  /** Sum of IVA from collected invoices with CFDI (tieneFactura && estado === 'pagada'). */
  ivaTrasladado: number;

  /** Sum of IVA from paid expenses with invoice (tieneFactura && estatusPago === 'Pagado'). */
  ivaAcreditableGastos: number;

  /** Sum of IVA from paid provider payments with invoice (tieneFactura && estatus === 'Pagado'). */
  ivaAcreditableProveedores: number;

  /** Total creditable: ivaAcreditableGastos + ivaAcreditableProveedores. */
  ivaAcreditableTotal: number;

  /** Sum of IVA retention from invoices that passed the IVA Trasladado filter. */
  retencionesClientes: number;

  /** Net difference: ivaTrasladado - ivaAcreditableTotal - retencionesClientes. */
  diferencia: number;

  /** true if diferencia > 0 (payment obligation). */
  esAPagar: boolean;

  /** Absolute value of diferencia, for UI display. */
  montoResultante: number;

  /** Paid records with invoice that have NO fechaPago (affect global but no specific month). */
  sinFechaPago: { registros: number; iva: number };
}

/**
 * Calculates IVA metrics based on cash flow (fechaPago).
 *
 * - Without `periodo`: GLOBAL calculation (all records meeting inclusion filters).
 * - With `periodo` ('YYYY-MM'): only records whose fechaPago falls in that exact month.
 *
 * Inclusion filters (always apply):
 * - IVA Trasladado: invoices with tieneFactura === true AND estado === 'pagada'.
 * - IVA Acreditable Gastos: expenses with tieneFactura === true AND estatusPago === 'Pagado'.
 * - IVA Acreditable Proveedores: payments with tieneFactura === true AND estatus === 'Pagado'.
 *
 * Uses the stored `iva` field from each record; never recalculates from subtotal.
 *
 * @param invoices      List of all invoices.
 * @param expenses      List of all expenses.
 * @param providerPayments List of all provider payments.
 * @param periodo       Optional. Format 'YYYY-MM'. Filters by fechaPago month.
 * @returns Complete IVA metrics.
 */
export function calculateIvaMetrics(
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = [],
  periodo?: string
): IvaMetrics {
  // --- Base inclusion filters (without date) ---
  const facturasBase = invoices.filter(
    inv => inv.tieneFactura === true && inv.estado === 'pagada'
  );
  const gastosBase = expenses.filter(
    exp => exp.tieneFactura === true && exp.estatusPago === 'Pagado'
  );
  const proveedoresBase = providerPayments.filter(
    pay => pay.tieneFactura === true && pay.estatus === 'Pagado'
  );

  // --- sinFechaPago: always calculated, regardless of periodo ---
  const facturasSinFecha = facturasBase.filter(inv => !inv.fechaPago);
  const gastosSinFecha = gastosBase.filter(exp => !exp.fechaPago);
  const proveedoresSinFecha = proveedoresBase.filter(pay => !pay.fechaPago);

  const sinFechaPago = {
    registros: facturasSinFecha.length + gastosSinFecha.length + proveedoresSinFecha.length,
    iva:
      facturasSinFecha.reduce((s, inv) => s + (inv.iva || 0), 0) +
      gastosSinFecha.reduce((s, exp) => s + (exp.iva || 0), 0) +
      proveedoresSinFecha.reduce((s, pay) => s + (pay.iva || 0), 0),
  };

  // --- Filter by periodo (if provided) ---
  const matchPeriodo = (fechaPago: string | undefined | null): boolean => {
    if (!periodo) return true;
    if (!fechaPago) return false;
    return fechaPago.slice(0, 7) === periodo;
  };

  const facturasFiltradas = facturasBase.filter(inv => matchPeriodo(inv.fechaPago));
  const gastosFiltrados = gastosBase.filter(exp => matchPeriodo(exp.fechaPago));
  const proveedoresFiltrados = proveedoresBase.filter(pay => matchPeriodo(pay.fechaPago));

  // --- Sums ---
  const ivaTrasladado = facturasFiltradas.reduce((s, inv) => s + (inv.iva || 0), 0);
  const ivaAcreditableGastos = gastosFiltrados.reduce((s, exp) => s + (exp.iva || 0), 0);
  const ivaAcreditableProveedores = proveedoresFiltrados.reduce((s, pay) => s + (pay.iva || 0), 0);
  const ivaAcreditableTotal = ivaAcreditableGastos + ivaAcreditableProveedores;
  const retencionesClientes = facturasFiltradas.reduce((s, inv) => s + (inv.retencionIva || 0), 0);

  const diferencia = ivaTrasladado - ivaAcreditableTotal - retencionesClientes;
  const esAPagar = diferencia > 0;
  const montoResultante = Math.abs(diferencia);

  return {
    ivaTrasladado,
    ivaAcreditableGastos,
    ivaAcreditableProveedores,
    ivaAcreditableTotal,
    retencionesClientes,
    diferencia,
    esAPagar,
    montoResultante,
    sinFechaPago,
  };
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Formats a 'YYYY-MM' period into a human-readable Spanish label.
 * Example: '2026-09' -> 'Septiembre 2026'.
 * Does not use Date or Intl to avoid timezone shifts.
 */
export function formatPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-');
  const idx = parseInt(mes, 10) - 1;
  return `${MESES[idx] ?? mes} ${anio}`;
}

/**
 * Returns the 'YYYY-MM' months that have at least one record included in the IVA
 * calculation (collected invoices, paid expenses, or paid provider payments, all with invoice).
 * Sorted from most recent to oldest.
 * Excludes months with no data. Uses fechaPago.slice(0,7), without new Date().
 *
 * @param invoices      List of all invoices.
 * @param expenses      List of all expenses.
 * @param providerPayments List of all provider payments.
 * @returns Array of 'YYYY-MM' strings sorted descending.
 */
export function getMesesDisponibles(
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = []
): string[] {
  const meses = new Set<string>();

  for (const inv of invoices) {
    if (inv.tieneFactura === true && inv.estado === 'pagada' && inv.fechaPago) {
      meses.add(inv.fechaPago.slice(0, 7));
    }
  }
  for (const exp of expenses) {
    if (exp.tieneFactura === true && exp.estatusPago === 'Pagado' && exp.fechaPago) {
      meses.add(exp.fechaPago.slice(0, 7));
    }
  }
  for (const pay of providerPayments) {
    if (pay.tieneFactura === true && pay.estatus === 'Pagado' && pay.fechaPago) {
      meses.add(pay.fechaPago.slice(0, 7));
    }
  }

  return Array.from(meses).sort().reverse();
}
