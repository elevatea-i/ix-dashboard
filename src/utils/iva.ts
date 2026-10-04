import { Invoice, Expense, ProviderPayment, PorImpactar, AbonoProveedor } from '../types';

/**
 * IVA metrics calculated from invoices, expenses, and provider payments.
 * All existing fields are kept for compatibility with BovedaIva.
 */
export interface IvaMetrics {
  /** Sum of IVA from invoices that count for IVA (see invoiceCountsForIva). */
  ivaTrasladado: number;

  /** Sum of IVA from paid expenses with invoice (tieneFactura && estatusPago === 'Pagado'). */
  ivaAcreditableGastos: number;

  /** Sum of IVA from provider payments and installments that count for IVA. */
  ivaAcreditableProveedores: number;

  /** Sum of IVA from unresolved Por Impactar records already paid with invoice. */
  ivaAcreditablePorImpactar: number;

  /** Total creditable: ivaAcreditableGastos + ivaAcreditableProveedores + ivaAcreditablePorImpactar. */
  ivaAcreditableTotal: number;

  /** Sum of IVA retention from invoices that passed the IVA Trasladado filter. */
  retencionesClientes: number;

  /** Net difference: ivaTrasladado - ivaAcreditableTotal - retencionesClientes. */
  diferencia: number;

  /** true if diferencia > 0 (payment obligation). */
  esAPagar: boolean;

  /** Absolute value of diferencia, for UI display. */
  montoResultante: number;

  /** Counted records with invoice that have NO fechaPago (affect global but no specific month). */
  sinFechaPago: { registros: number; iva: number };

  /**
   * PPD records that meet every other condition but lack their payment complement.
   * They do not count for IVA until the complement is marked.
   */
  enEsperaComplemento: { registros: number; ivaTrasladado: number; ivaAcreditable: number };
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
 *   Installment payments (conParcialidades) are excluded; instead each of their installments
 *   counts its own iva in the month of its fechaPago, only if the parent payment exists and
 *   has tieneFactura === true.
 * - IVA Acreditable Por Impactar: records with estatus === 'pendiente' AND estatusPago === 'Pagado'
 *   AND tieneFactura === true. Resolved records are excluded because their generated expense counts.
 *
 * PPD rule: PPD invoices and provider payments, and every installment, only count once their
 * payment complement is marked. Until then they are reported in enEsperaComplemento.
 *
 * Uses the stored `iva` field from each record; never recalculates from subtotal.
 *
 * @param invoices      List of all invoices.
 * @param expenses      List of all expenses.
 * @param providerPayments List of all provider payments.
 * @param periodo       Optional. Format 'YYYY-MM'. Filters by fechaPago month.
 * @param porImpactarRecords List of all Por Impactar records.
 * @param abonos        List of all provider payment installments.
 * @returns Complete IVA metrics.
 */
export function calculateIvaMetrics(
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = [],
  periodo?: string,
  porImpactarRecords: PorImpactar[] = [],
  abonos: AbonoProveedor[] = []
): IvaMetrics {
  const facturadosConParcialidades = getFacturadosConParcialidades(providerPayments);

  // --- Base inclusion filters (without date) ---
  const facturasBase = invoices.filter(invoiceCountsForIva);
  const gastosBase = expenses.filter(expenseCountsForIva);
  const proveedoresBase = providerPayments.filter(providerPaymentCountsForIva);
  const porImpactarBase = porImpactarRecords.filter(porImpactarCountsForIva);
  const abonosBase = abonos.filter(ab => abonoCountsForIva(ab, facturadosConParcialidades));

  // --- sinFechaPago: always calculated, regardless of periodo ---
  const facturasSinFecha = facturasBase.filter(inv => !inv.fechaPago);
  const gastosSinFecha = gastosBase.filter(exp => !exp.fechaPago);
  const proveedoresSinFecha = proveedoresBase.filter(pay => !pay.fechaPago);
  const porImpactarSinFecha = porImpactarBase.filter(rec => !rec.fechaPago);

  const sinFechaPago = {
    registros:
      facturasSinFecha.length + gastosSinFecha.length + proveedoresSinFecha.length + porImpactarSinFecha.length,
    iva:
      facturasSinFecha.reduce((s, inv) => s + (inv.iva || 0), 0) +
      gastosSinFecha.reduce((s, exp) => s + (exp.iva || 0), 0) +
      proveedoresSinFecha.reduce((s, pay) => s + (pay.iva || 0), 0) +
      porImpactarSinFecha.reduce((s, rec) => s + (rec.iva || 0), 0),
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
  const porImpactarFiltrados = porImpactarBase.filter(rec => matchPeriodo(rec.fechaPago));
  const abonosFiltrados = abonosBase.filter(ab => matchPeriodo(ab.fechaPago));

  // --- Sums ---
  const ivaTrasladado = facturasFiltradas.reduce((s, inv) => s + (inv.iva || 0), 0);
  const ivaAcreditableGastos = gastosFiltrados.reduce((s, exp) => s + (exp.iva || 0), 0);
  const ivaAcreditableProveedores =
    proveedoresFiltrados.reduce((s, pay) => s + (pay.iva || 0), 0) +
    abonosFiltrados.reduce((s, ab) => s + (ab.iva || 0), 0);
  const ivaAcreditablePorImpactar = porImpactarFiltrados.reduce((s, rec) => s + (rec.iva || 0), 0);
  const ivaAcreditableTotal = ivaAcreditableGastos + ivaAcreditableProveedores + ivaAcreditablePorImpactar;
  const retencionesClientes = facturasFiltradas.reduce((s, inv) => s + (inv.retencionIva || 0), 0);

  const diferencia = ivaTrasladado - ivaAcreditableTotal - retencionesClientes;
  const esAPagar = diferencia > 0;
  const montoResultante = Math.abs(diferencia);

  // --- enEsperaComplemento: PPD records waiting for their payment complement ---
  const facturasEnEspera = invoices.filter(
    inv => invoiceAwaitsComplemento(inv) && matchPeriodo(inv.fechaPago)
  );
  const proveedoresEnEspera = providerPayments.filter(
    pay => providerPaymentAwaitsComplemento(pay) && matchPeriodo(pay.fechaPago)
  );
  const abonosEnEspera = abonos.filter(
    ab => abonoAwaitsComplemento(ab, facturadosConParcialidades) && matchPeriodo(ab.fechaPago)
  );

  const enEsperaComplemento = {
    registros: facturasEnEspera.length + proveedoresEnEspera.length + abonosEnEspera.length,
    ivaTrasladado: facturasEnEspera.reduce((s, inv) => s + (inv.iva || 0), 0),
    ivaAcreditable:
      proveedoresEnEspera.reduce((s, pay) => s + (pay.iva || 0), 0) +
      abonosEnEspera.reduce((s, ab) => s + (ab.iva || 0), 0),
  };

  return {
    ivaTrasladado,
    ivaAcreditableGastos,
    ivaAcreditableProveedores,
    ivaAcreditablePorImpactar,
    ivaAcreditableTotal,
    retencionesClientes,
    diferencia,
    esAPagar,
    montoResultante,
    sinFechaPago,
    enEsperaComplemento,
  };
}

function hasComplementoIfPpd(metodoPago: string | undefined | null, complementoEmitido: boolean | undefined): boolean {
  return metodoPago !== 'PPD' || complementoEmitido === true;
}

function isInvoiceCollectedWithCfdi(inv: Invoice): boolean {
  return inv.tieneFactura === true && inv.estado === 'pagada';
}

function invoiceCountsForIva(inv: Invoice): boolean {
  return isInvoiceCollectedWithCfdi(inv) && hasComplementoIfPpd(inv.metodoPago, inv.complementoEmitido);
}

function invoiceAwaitsComplemento(inv: Invoice): boolean {
  return isInvoiceCollectedWithCfdi(inv) && !hasComplementoIfPpd(inv.metodoPago, inv.complementoEmitido);
}

function expenseCountsForIva(exp: Expense): boolean {
  return exp.tieneFactura === true && exp.estatusPago === 'Pagado';
}

function isProviderPaymentPaidWithCfdi(pay: ProviderPayment): boolean {
  return !pay.conParcialidades && pay.tieneFactura === true && pay.estatus === 'Pagado';
}

function providerPaymentCountsForIva(pay: ProviderPayment): boolean {
  return isProviderPaymentPaidWithCfdi(pay) && hasComplementoIfPpd(pay.metodoPago, pay.complementoEmitido);
}

function providerPaymentAwaitsComplemento(pay: ProviderPayment): boolean {
  return isProviderPaymentPaidWithCfdi(pay) && !hasComplementoIfPpd(pay.metodoPago, pay.complementoEmitido);
}

function porImpactarCountsForIva(rec: PorImpactar): boolean {
  return rec.estatus === 'pendiente' && rec.estatusPago === 'Pagado' && rec.tieneFactura === true;
}

function getFacturadosConParcialidades(providerPayments: ProviderPayment[]): Set<string> {
  return new Set(
    providerPayments
      .filter(pay => pay.conParcialidades && pay.tieneFactura === true)
      .map(pay => pay.id)
  );
}

function abonoCountsForIva(ab: AbonoProveedor, facturadosConParcialidades: Set<string>): boolean {
  return facturadosConParcialidades.has(ab.pagoProveedorId) && ab.complementoEmitido === true;
}

function abonoAwaitsComplemento(ab: AbonoProveedor, facturadosConParcialidades: Set<string>): boolean {
  return facturadosConParcialidades.has(ab.pagoProveedorId) && ab.complementoEmitido !== true;
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
 * Returns the 'YYYY-MM' months that have at least one record that counts for IVA,
 * using exactly the same rules as calculateIvaMetrics (including the PPD complement rule).
 * Sorted from most recent to oldest.
 * Excludes months with no data. Uses fechaPago.slice(0,7), without new Date().
 *
 * @param invoices      List of all invoices.
 * @param expenses      List of all expenses.
 * @param providerPayments List of all provider payments.
 * @param porImpactarRecords List of all Por Impactar records.
 * @param abonos        List of all provider payment installments.
 * @returns Array of 'YYYY-MM' strings sorted descending.
 */
export function getMesesDisponibles(
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = [],
  porImpactarRecords: PorImpactar[] = [],
  abonos: AbonoProveedor[] = []
): string[] {
  const meses = new Set<string>();
  const addMes = (fechaPago: string | undefined | null) => {
    if (fechaPago) meses.add(fechaPago.slice(0, 7));
  };
  const facturadosConParcialidades = getFacturadosConParcialidades(providerPayments);

  for (const inv of invoices) {
    if (invoiceCountsForIva(inv)) addMes(inv.fechaPago);
  }
  for (const exp of expenses) {
    if (expenseCountsForIva(exp)) addMes(exp.fechaPago);
  }
  for (const pay of providerPayments) {
    if (providerPaymentCountsForIva(pay)) addMes(pay.fechaPago);
  }
  for (const rec of porImpactarRecords) {
    if (porImpactarCountsForIva(rec)) addMes(rec.fechaPago);
  }
  for (const ab of abonos) {
    if (abonoCountsForIva(ab, facturadosConParcialidades)) addMes(ab.fechaPago);
  }

  return Array.from(meses).sort().reverse();
}
