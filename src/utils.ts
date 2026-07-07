/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invoice } from './types';

/**
 * Obtains the current date formatted as YYYY-MM-DD in the America/Mexico_City timezone.
 */
export function getMexicoCityDate(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Obtains the current date and time formatted in Mexico City's local time representation.
 */
export function getMexicoCityDateTimeString(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return formatter.format(d).replace(' ', 'T') + '-06:00';
}

/**
 * Pure function to calculate a project's billing status based on its associated invoices.
 * 
 * - No invoices associated -> 'Sin facturar'
 * - At least one invoice, but not all are 'pagada' -> 'Facturado'
 * - At least one invoice and all of them are 'pagada' -> 'Pagado'
 * 
 * @param projectId ID of the project to evaluate
 * @param invoices List of all invoices in the system
 */
export function calculateProjectBillingStatus(
  projectId: string,
  invoices: Invoice[]
): 'Sin facturar' | 'Facturado' | 'Pagado' {
  const projectInvoices = invoices.filter(inv => inv.proyectoId === projectId);
  
  if (projectInvoices.length === 0) {
    return 'Sin facturar';
  }
  
  const allPaid = projectInvoices.every(inv => inv.estado === 'pagada');
  return allPaid ? 'Pagado' : 'Facturado';
}

/**
 * Formats a numeric amount as currency (MXN).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}
