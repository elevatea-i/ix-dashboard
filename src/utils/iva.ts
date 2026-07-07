/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invoice, Expense, ProviderPayment } from '../types';

export interface IvaMetrics {
  /**
   * Sum of the `iva` field of all Invoices, regardless of their payment state.
   */
  ivaTrasladado: number;

  /**
   * Sum of the `iva` field of all Expenses where `tieneFactura` is true.
   */
  ivaAcreditableGastos: number;

  /**
   * Sum of the `iva` field of all Provider Payments where `tieneFactura` is true.
   */
  ivaAcreditableProveedores: number;

  /**
   * Total accredited VAT: `ivaAcreditableGastos` + `ivaAcreditableProveedores`.
   */
  ivaAcreditableTotal: number;

  /**
   * Net difference: `ivaTrasladado` - `ivaAcreditableTotal`.
   */
  diferencia: number;

  /**
   * Boolean flag indicating whether the net difference results in an obligation to pay or a balance in favor.
   */
  esAPagar: boolean;

  /**
   * The absolute value of the VAT result to show in the UI.
   */
  montoResultante: number;
}

/**
 * Pure calculation function for VAT (IVA) Metrics.
 *
 * Calculations are based on Mexican fiscal rules specified for Fase 9:
 * - IVA Trasladado: Sum of VAT from all invoices (complete outlook, regardless of 'facturada' or 'pagada').
 * - IVA Acreditable (Gastos): Sum of VAT from expenses where `tieneFactura` is true.
 * - IVA Acreditable (Proveedores): Sum of VAT from provider payments where `tieneFactura` is true.
 * - Net result: IVA Trasladado - (IVA Acreditable Gastos + IVA Acreditable Proveedores).
 *
 * @param invoices List of all invoices in the system.
 * @param expenses List of all expenses in the system.
 * @param providerPayments List of all provider payments in the system.
 * @returns Fully computed IVA metrics.
 */
export function calculateIvaMetrics(
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = []
): IvaMetrics {
  // 1. IVA Trasladado: Sum of IVA from ALL invoices
  const ivaTrasladado = invoices.reduce((sum, inv) => sum + (inv.iva || 0), 0);

  // 2. IVA Acreditable Gastos: Sum of IVA from expenses with invoice (tieneFactura = true)
  const ivaAcreditableGastos = expenses
    .filter(exp => exp.tieneFactura === true)
    .reduce((sum, exp) => sum + (exp.iva || 0), 0);

  // 3. IVA Acreditable Proveedores: Sum of IVA from provider payments with invoice (tieneFactura = true)
  const ivaAcreditableProveedores = providerPayments
    .filter(pay => pay.tieneFactura === true)
    .reduce((sum, pay) => sum + (pay.iva || 0), 0);

  // 4. Combined Accredited VAT
  const ivaAcreditableTotal = ivaAcreditableGastos + ivaAcreditableProveedores;

  // 5. Net Difference
  const diferencia = ivaTrasladado - ivaAcreditableTotal;
  const esAPagar = diferencia > 0;
  const montoResultante = Math.abs(diferencia);

  return {
    ivaTrasladado,
    ivaAcreditableGastos,
    ivaAcreditableProveedores,
    ivaAcreditableTotal,
    diferencia,
    esAPagar,
    montoResultante
  };
}
