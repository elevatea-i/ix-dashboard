/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Invoice, ProviderPayment } from '../types';

interface ProfitCalculationResult {
  gananciaTotal: number;
  gananciaDueno: number;
  gananciaEjecutivo: number;
  gananciaDiploma: number;
}

/**
 * Función pura para distribuir un monto específico de ganancia neta.
 * 
 * Reglas de distribución:
 * - 65% para el Dueño (fijo).
 * - 5% propuesto para Diploma (sujeto a un tope acumulado histórico de $37,800.00 MXN).
 * - 30% para el Ejecutivo comercial (base).
 * 
 * Lógica del Tope del Fondo de Diploma:
 * - Caso A: El fondo de Diploma ya alcanzó o superó el tope ($37,800).
 *   Diploma recibe $0.00; la porción completa del 5% se transfiere al Ejecutivo (recibe 35% en total).
 * - Caso B: El acumulado previo + la propuesta del 5% no superan el tope.
 *   Diploma recibe el 5% completo; el Ejecutivo recibe el 30%.
 * - Caso C (Caso Límite): El acumulado está por debajo del tope pero la propuesta lo excedería.
 *   Diploma recibe solo la diferencia para llegar exactamente a $37,800.
 *   El excedente (propuesto - lo asignado a Diploma) se redirige y suma a la porción del Ejecutivo (recibe 30% + excedente).
 * 
 * @param gananciaTotal El monto neto de ganancia a distribuir (puede ser un delta incremental).
 * @param currentDiplomaAccumulated El acumulado histórico de todos los repartos previos del fondo de Diploma.
 * @returns Un desglose con las participaciones ajustadas y redondeadas a 2 decimales.
 */
export function calculateProfitDistributionForAmount(
  gananciaTotal: number,
  currentDiplomaAccumulated: number
): ProfitCalculationResult {
  // Asegurar que no operamos sobre valores negativos
  if (gananciaTotal <= 0) {
    return {
      gananciaTotal: 0,
      gananciaDueno: 0,
      gananciaEjecutivo: 0,
      gananciaDiploma: 0,
    };
  }

  // 1. Calcular las porciones teóricas basadas en los porcentajes fijos
  const gananciaDueno = Number((gananciaTotal * 0.65).toFixed(2));
  const proposedDiploma = Number((gananciaTotal * 0.05).toFixed(2));
  const baseEjecutivo = Number((gananciaTotal * 0.30).toFixed(2));

  const TOPE_DIPLOMA = 37800;

  let gananciaDiploma = 0;
  let gananciaEjecutivo = 0;

  // 2. Aplicar reglas de negocio para el tope de Diploma y reasignación al Ejecutivo
  if (currentDiplomaAccumulated >= TOPE_DIPLOMA) {
    // Caso A: El tope ya se alcanzó previamente. Diploma recibe $0 y el Ejecutivo recibe 35% total.
    gananciaDiploma = 0;
    gananciaEjecutivo = Number((gananciaTotal * 0.35).toFixed(2));
  } else if (currentDiplomaAccumulated + proposedDiploma <= TOPE_DIPLOMA) {
    // Caso B: No se excede el tope. Distribución ordinaria (65% Dueño, 30% Ejecutivo, 5% Diploma).
    gananciaDiploma = proposedDiploma;
    gananciaEjecutivo = baseEjecutivo;
  } else {
    // Caso C (Caso Límite): Se cruza el tope con este reparto.
    // Diploma se lleva solo lo que falta para llegar al tope exacto.
    gananciaDiploma = Number((TOPE_DIPLOMA - currentDiplomaAccumulated).toFixed(2));
    
    // El remanente no asignable a Diploma se redirige y suma a la cuenta del Ejecutivo
    const excedenteReasignado = Number((proposedDiploma - gananciaDiploma).toFixed(2));
    gananciaEjecutivo = Number((baseEjecutivo + excedenteReasignado).toFixed(2));
  }

  // 3. Control de consistencia decimal
  // Ajuste fino por redondeo de flotantes para asegurar que la suma de las partes de exactamente la gananciaTotal
  const sumaPartes = Number((gananciaDueno + gananciaEjecutivo + gananciaDiploma).toFixed(2));
  let finalEjecutivo = gananciaEjecutivo;
  if (sumaPartes !== gananciaTotal) {
    const diferencia = Number((gananciaTotal - sumaPartes).toFixed(2));
    finalEjecutivo = Number((gananciaEjecutivo + diferencia).toFixed(2));
  }

  return {
    gananciaTotal,
    gananciaDueno,
    gananciaEjecutivo: finalEjecutivo,
    gananciaDiploma,
  };
}

/**
 * Función pura para el cálculo del reparto de utilidades acumulado completo de un proyecto.
 * 
 * @param invoices List of all system invoices.
 * @param providerPayments List of all system provider payments.
 * @param currentDiplomaAccumulated Sum of all 'gananciaDiploma' from previously finalized projects.
 * @returns An object with the structured profit shares rounded to 2 decimal places.
 */
export function calculateProfitDistribution(
  projectId: string,
  invoices: Invoice[],
  providerPayments: ProviderPayment[],
  currentDiplomaAccumulated: number
): ProfitCalculationResult {
  // 1. Filtrar las facturas del proyecto y sumar sus subtotales
  const projectInvoices = invoices.filter(inv => inv.proyectoId === projectId);
  const totalInvoicesSubtotal = projectInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

  // 2. Filtrar los pagos a proveedores vinculados y sumar sus subtotales
  const projectProviderPayments = providerPayments.filter(pay => pay.proyectoId === projectId);
  const totalProvidersSubtotal = projectProviderPayments.reduce((sum, pay) => sum + (pay.subtotal || 0), 0);

  // 3. Calcular la Ganancia Total del proyecto entero
  const gananciaTotalRaw = totalInvoicesSubtotal - totalProvidersSubtotal;
  const gananciaTotal = Math.max(0, Number(gananciaTotalRaw.toFixed(2)));

  return calculateProfitDistributionForAmount(gananciaTotal, currentDiplomaAccumulated);
}
