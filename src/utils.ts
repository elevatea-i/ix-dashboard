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

/**
 * Formats a raw numeric string to a currency string with a dollar sign and thousands separators,
 * preserving decimals as they are typed.
 */
export function formatLiveCurrency(value: string): string {
  // Strip everything except digits and one decimal point
  let clean = value.replace(/[^\d.]/g, '');
  
  // Prevent multiple decimal points
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  
  if (!clean) return '';
  
  const integerPart = parts[0];
  const decimalPart = parts[1] !== undefined ? parts[1].slice(0, 2) : null;
  
  // Format the integer part with thousands separators
  const formattedInteger = Number(integerPart).toLocaleString('es-MX');
  
  let result = '$' + formattedInteger;
  if (decimalPart !== null) {
    result += '.' + decimalPart;
  } else if (clean.endsWith('.')) {
    result += '.';
  }
  
  return result;
}

/**
 * Parses a formatted currency string back to a clean numeric string for state or number conversion.
 */
export function parseCurrencyInput(formatted: string): string {
  return formatted.replace(/[^\d.]/g, '');
}

export interface DueDateIndicator {
  text: string;
  type: 'future' | 'today' | 'past';
  daysDiff: number;
}

/**
 * Pure function to calculate payment due status and indicator.
 * It is completely separate from UI layout.
 */
export function getDueDateIndicator(
  estatus: 'Pagado' | 'Pendiente',
  fechaVencimiento?: string,
  todayStr?: string
): DueDateIndicator | null {
  if (estatus === 'Pagado' || !fechaVencimiento) {
    return null;
  }
  
  const hoy = todayStr || getMexicoCityDate();
  
  const [yHoy, mHoy, dHoy] = hoy.split('-').map(Number);
  const [yVenc, mVenc, dVenc] = fechaVencimiento.split('-').map(Number);
  
  const utcHoy = Date.UTC(yHoy, mHoy - 1, dHoy);
  const utcVenc = Date.UTC(yVenc, mVenc - 1, dVenc);
  
  const diffMs = utcVenc - utcHoy;
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 0) {
    return {
      text: `Vence en ${daysDiff} ${daysDiff === 1 ? 'día' : 'días'}`,
      type: 'future',
      daysDiff
    };
  } else if (daysDiff === 0) {
    return {
      text: 'Vence hoy',
      type: 'today',
      daysDiff
    };
  } else {
    const absDays = Math.abs(daysDiff);
    return {
      text: `Vencido hace ${absDays} ${absDays === 1 ? 'día' : 'días'}`,
      type: 'past',
      daysDiff
    };
  }
}


