import { Invoice, Expense, ProviderPayment } from '../types';

/**
 * Métricas de IVA calculadas a partir de facturas, gastos y pagos a proveedores.
 * Todos los campos existentes se mantienen para compatibilidad con BovedaIva.
 */
export interface IvaMetrics {
  /** Suma de IVA de facturas cobradas con CFDI (tieneFactura && estado === 'pagada'). */
  ivaTrasladado: number;

  /** Suma de IVA de gastos pagados con factura (tieneFactura && estatusPago === 'Pagado'). */
  ivaAcreditableGastos: number;

  /** Suma de IVA de pagos a proveedores pagados con factura (tieneFactura && estatus === 'Pagado'). */
  ivaAcreditableProveedores: number;

  /** Total acreditable: ivaAcreditableGastos + ivaAcreditableProveedores. */
  ivaAcreditableTotal: number;

  /** Suma de retención de IVA de las facturas que pasaron el filtro de IVA Trasladado. */
  retencionesClientes: number;

  /** Diferencia neta: ivaTrasladado - ivaAcreditableTotal - retencionesClientes. */
  diferencia: number;

  /** true si diferencia > 0 (obligación de pago). */
  esAPagar: boolean;

  /** Valor absoluto de diferencia, para mostrar en la UI. */
  montoResultante: number;

  /** Registros pagados con factura que NO tienen fechaPago (afectan global pero ningún mes). */
  sinFechaPago: { registros: number; iva: number };
}

/**
 * Calcula las métricas de IVA con base en flujo de efectivo (fechaPago).
 *
 * - Sin `periodo`: cálculo GLOBAL (todos los registros que cumplen filtros de inclusión).
 * - Con `periodo` ('YYYY-MM'): solo registros cuya fechaPago cae en ese mes exacto.
 *
 * Filtros de inclusión (aplican siempre):
 * - IVA Trasladado: facturas con tieneFactura === true Y estado === 'pagada'.
 * - IVA Acreditable Gastos: gastos con tieneFactura === true Y estatusPago === 'Pagado'.
 * - IVA Acreditable Proveedores: pagos con tieneFactura === true Y estatus === 'Pagado'.
 *
 * Usa el campo `iva` almacenado de cada registro; nunca lo recalcula desde subtotal.
 *
 * @param invoices      Lista de todas las facturas.
 * @param expenses      Lista de todos los gastos.
 * @param providerPayments Lista de todos los pagos a proveedores.
 * @param periodo       Opcional. Formato 'YYYY-MM'. Filtra por mes de fechaPago.
 * @returns Métricas de IVA completas.
 */
export function calculateIvaMetrics(
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = [],
  periodo?: string
): IvaMetrics {
  // --- Filtros de inclusión base (sin considerar fecha) ---
  const facturasBase = invoices.filter(
    inv => inv.tieneFactura === true && inv.estado === 'pagada'
  );
  const gastosBase = expenses.filter(
    exp => exp.tieneFactura === true && exp.estatusPago === 'Pagado'
  );
  const proveedoresBase = providerPayments.filter(
    pay => pay.tieneFactura === true && pay.estatus === 'Pagado'
  );

  // --- sinFechaPago: siempre se calcula, sin importar el periodo ---
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

  // --- Filtro por periodo (si se provee) ---
  const matchPeriodo = (fechaPago: string | undefined | null): boolean => {
    if (!periodo) return true;
    if (!fechaPago) return false;
    return fechaPago.slice(0, 7) === periodo;
  };

  const facturasFiltradas = facturasBase.filter(inv => matchPeriodo(inv.fechaPago));
  const gastosFiltrados = gastosBase.filter(exp => matchPeriodo(exp.fechaPago));
  const proveedoresFiltrados = proveedoresBase.filter(pay => matchPeriodo(pay.fechaPago));

  // --- Sumas ---
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
 * Formatea un periodo 'YYYY-MM' a etiqueta legible en español.
 * Ejemplo: '2026-09' -> 'Septiembre 2026'.
 * No usa Date ni Intl para evitar desplazamientos de zona horaria.
 */
export function formatPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-');
  const idx = parseInt(mes, 10) - 1;
  return `${MESES[idx] ?? mes} ${anio}`;
}

/**
 * Devuelve los meses 'YYYY-MM' que tienen al menos un registro incluido en el cálculo
 * de IVA (facturas cobradas, gastos pagados o pagos a proveedores pagados, todos con factura).
 * Ordenados del más reciente al más antiguo.
 * No incluye meses sin datos. Usa fechaPago.slice(0,7), sin new Date().
 *
 * @param invoices      Lista de todas las facturas.
 * @param expenses      Lista de todos los gastos.
 * @param providerPayments Lista de todos los pagos a proveedores.
 * @returns Array de strings 'YYYY-MM' ordenados descendentemente.
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
