/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Project, Invoice, Expense, ProviderPayment } from '../types';
import { calculateProjectProfitability } from './profitability';

export interface ProjectIvaMetrics {
  ivaTrasladado: number;
  ivaAcreditableGastos: number;
  ivaAcreditableProveedores: number;
  ivaAcreditableTotal: number;
  diferencia: number;
  esAPagar: boolean;
  montoResultante: number;
}

/**
 * Calcula el IVA Trasladado e IVA Acreditable para un proyecto específico.
 * 
 * - IVA Trasladado: suma de 'iva' de todas las Facturas del proyecto.
 * - IVA Acreditable Gastos: suma de 'iva' de los Gastos vinculados al proyecto
 *   donde 'tieneFactura === true'.
 * - IVA Acreditable Proveedores: suma de 'iva' de los Pagos a Proveedores vinculados
 *   al proyecto donde 'tieneFactura === true'.
 * - IVA Acreditable Total: suma de ambos acreditables.
 * - Diferencia: IVA Trasladado - IVA Acreditable Total.
 * 
 * @param project El proyecto a evaluar.
 * @param invoices Listado completo de facturas.
 * @param expenses Listado completo de gastos.
 * @param providerPayments Listado completo de pagos a proveedores.
 * @returns Métricas de IVA específicas de este proyecto.
 */
export function calcularIVAPorProyecto(
  project: Project,
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = []
): ProjectIvaMetrics {
  // IVA Trasladado: sum of IVA for this project's invoices
  const projectInvoices = invoices.filter(inv => inv.proyectoId === project.id);
  const ivaTrasladado = projectInvoices.reduce((sum, inv) => sum + (inv.iva || 0), 0);

  // IVA Acreditable Gastos: sum of IVA from expenses with invoice (tieneFactura = true) for this project
  const projectExpenses = expenses.filter(
    exp => exp.proyectoId === project.id && exp.tieneFactura === true
  );
  const ivaAcreditableGastos = projectExpenses.reduce((sum, exp) => sum + (exp.iva || 0), 0);

  // IVA Acreditable Proveedores: sum of IVA from provider payments with invoice (tieneFactura = true) for this project
  const projectProviderPayments = providerPayments.filter(
    pay => pay.proyectoId === project.id && pay.tieneFactura === true
  );
  const ivaAcreditableProveedores = projectProviderPayments.reduce((sum, pay) => sum + (pay.iva || 0), 0);

  const ivaAcreditableTotal = ivaAcreditableGastos + ivaAcreditableProveedores;
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

/**
 * Genera y descarga un archivo Excel (.xlsx) con múltiples hojas detalladas
 * conteniendo el resumen, facturas, gastos y pagos a proveedores de un proyecto.
 * 
 * @param project El proyecto del cual se generará el reporte.
 * @param clientName El nombre del cliente del proyecto.
 * @param invoices Listado de facturas.
 * @param expenses Listado de gastos.
 * @param providerPayments Listado de pagos a proveedores.
 */
export function generarReporteProyecto(
  project: Project,
  clientName: string,
  invoices: Invoice[] = [],
  expenses: Expense[] = [],
  providerPayments: ProviderPayment[] = []
): void {
  // 1. Calculate Rentabilidad metrics
  const metricsRentabilidad = calculateProjectProfitability(
    project,
    clientName,
    invoices,
    providerPayments,
    expenses
  );

  // 2. Calculate IVA metrics
  const metricsIva = calcularIVAPorProyecto(
    project,
    invoices,
    expenses,
    providerPayments
  );

  // Create empty workbook
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: RESUMEN ---
  const resumenRows = [
    ["REPORTE FINANCIERO DE PROYECTO", ""],
    ["Generado", new Date().toLocaleDateString()],
    ["", ""],
    ["DATOS GENERALES DEL PROYECTO", ""],
    ["Código de Proyecto", project.codigo],
    ["Nombre de Proyecto", project.nombre],
    ["Cliente", clientName],
    ["Ejecutivo de Cuenta", project.ejecutivoId],
    ["Estado de Facturación", project.estadoFacturacion || "Sin facturar"],
    ["", ""],
    ["MÉTRICAS DE RENTABILIDAD (SUBTOTALES SIN IVA)", ""],
    ["Costo Cliente (Facturado)", metricsRentabilidad.costoCliente],
    ["Costo Proveedor", metricsRentabilidad.costoProveedor],
    ["Gastos Proveedor Vinculados", metricsRentabilidad.gastosProveedorVinculados],
    ["Ganancia Neta", metricsRentabilidad.ganancia],
    ["Porcentaje de Rentabilidad", typeof metricsRentabilidad.porcentajeRentabilidad === 'number' ? metricsRentabilidad.porcentajeRentabilidad / 100 : "N/A"],
    ["", ""],
    ["BALANCE DE IVA", ""],
    ["IVA Trasladado (Clientes)", metricsIva.ivaTrasladado],
    ["IVA Acreditable (Gastos)", metricsIva.ivaAcreditableGastos],
    ["IVA Acreditable (Proveedores)", metricsIva.ivaAcreditableProveedores],
    ["IVA Acreditable Total", metricsIva.ivaAcreditableTotal],
    ["Diferencia Neta de IVA", metricsIva.diferencia],
    ["Resultado Estimado", metricsIva.esAPagar ? "A Pagar al SAT" : "Saldo a Favor"]
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  formatResumenSheet(wsResumen);
  applyAutofit(wsResumen);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // --- SHEET 2: FACTURAS ---
  const projectInvoices = invoices.filter(inv => inv.proyectoId === project.id);
  const facturasHeader = [
    "Folio", 
    "Subtotal ($)", 
    "IVA ($)", 
    "Retención ISR ($)", 
    "Retención IVA ($)", 
    "Total ($)", 
    "Método de Pago", 
    "Complemento Emitido (PPD)", 
    "Estado", 
    "Fecha de Emisión", 
    "Fecha de Pago"
  ];
  const facturasRows = projectInvoices.map(inv => [
    inv.folio,
    inv.subtotal,
    inv.iva,
    inv.retencionIsr,
    inv.retencionIva,
    inv.total,
    inv.metodoPago,
    inv.metodoPago === 'PPD' ? (inv.complementoEmitido ? "Sí" : "No") : "N/A",
    inv.estado === 'pagada' ? 'Pagada' : 'Facturada',
    inv.fechaEmision,
    inv.fechaPago || "-"
  ]);
  const wsFacturas = XLSX.utils.aoa_to_sheet([facturasHeader, ...facturasRows]);
  formatTableSheet(wsFacturas);
  applyAutofit(wsFacturas);
  XLSX.utils.book_append_sheet(wb, wsFacturas, "Facturas");

  // --- SHEET 3: GASTOS ---
  // Only linked expenses (tipo = 'Proveedor por Proyecto')
  const projectExpenses = expenses.filter(
    exp => exp.proyectoId === project.id && exp.tipo === 'Proveedor por Proyecto'
  );
  const gastosHeader = [
    "Concepto",
    "Categoría",
    "Subtotal ($)",
    "IVA ($)",
    "ISR Retenido ($)",
    "IVA Retenido ($)",
    "Total ($)",
    "Cuenta de Origen",
    "Es Reembolsable",
    "Tiene Factura",
    "Método de Pago",
    "Estatus de Pago",
    "Fecha"
  ];
  const gastosRows = projectExpenses.map(exp => [
    exp.concepto,
    exp.categoriaId,
    exp.subtotal,
    exp.iva,
    exp.isrRetenido,
    exp.ivaRetenido,
    exp.total,
    exp.cuentaOrigen,
    exp.esReembolsable ? "Sí" : "No",
    exp.tieneFactura ? "Sí" : "No",
    exp.metodoPago,
    exp.estatusPago,
    exp.fecha
  ]);
  const wsGastos = XLSX.utils.aoa_to_sheet([gastosHeader, ...gastosRows]);
  formatTableSheet(wsGastos);
  applyAutofit(wsGastos);
  XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos");

  // --- SHEET 4: PAGOS A PROVEEDORES ---
  const projectProviderPayments = providerPayments.filter(pay => pay.proyectoId === project.id);
  const pagosHeader = [
    "Proveedor",
    "Subtotal ($)",
    "IVA ($)",
    "ISR Retenido ($)",
    "IVA Retenido ($)",
    "Total ($)",
    "Tiene Factura",
    "Estatus de Pago",
    "Fecha"
  ];
  const pagosRows = projectProviderPayments.map(pay => [
    pay.proveedor,
    pay.subtotal,
    pay.iva,
    pay.isrRetenido,
    pay.ivaRetenido,
    pay.total,
    pay.tieneFactura ? "Sí" : "No",
    pay.estatus,
    pay.fecha
  ]);
  const wsPagos = XLSX.utils.aoa_to_sheet([pagosHeader, ...pagosRows]);
  formatTableSheet(wsPagos);
  applyAutofit(wsPagos);
  XLSX.utils.book_append_sheet(wb, wsPagos, "Pagos a Proveedores");

  // Trigger browser-side compilation and file download
  XLSX.writeFile(wb, `Reporte_${project.codigo}_${project.nombre.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`);
}

/**
 * Formatea la hoja Resumen aplicando formato de moneda a los montos y de porcentaje a la rentabilidad.
 */
function formatResumenSheet(ws: XLSX.WorkSheet): void {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  const moneyLabels = [
    "Costo Cliente (Facturado)",
    "Costo Proveedor",
    "Gastos Proveedor Vinculados",
    "Ganancia Neta",
    "IVA Trasladado (Clientes)",
    "IVA Acreditable (Gastos)",
    "IVA Acreditable (Proveedores)",
    "IVA Acreditable Total",
    "Diferencia Neta de IVA"
  ];
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    const cellAddressA = XLSX.utils.encode_cell({ r: R, c: 0 });
    const cellAddressB = XLSX.utils.encode_cell({ r: R, c: 1 });
    
    const cellA = ws[cellAddressA];
    const cellB = ws[cellAddressB];
    
    if (cellA && typeof cellA.v === 'string') {
      const label = cellA.v.trim();
      if (moneyLabels.includes(label)) {
        if (cellB && typeof cellB.v === 'number') {
          cellB.t = 'n';
          cellB.z = '"$"#,##0.00';
        }
      } else if (label === "Porcentaje de Rentabilidad") {
        if (cellB && typeof cellB.v === 'number') {
          cellB.t = 'n';
          cellB.z = '0.0%';
        }
      }
    }
  }
}

/**
 * Formatea columnas con cantidades de dinero en hojas tabulares basado en sufijos "($)" en las cabeceras.
 */
function formatTableSheet(ws: XLSX.WorkSheet): void {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Identifica columnas con montos
  const moneyCols = new Set<number>();
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const headerAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    const headerCell = ws[headerAddress];
    if (headerCell && typeof headerCell.v === 'string' && headerCell.v.includes('($)')) {
      moneyCols.add(C);
    }
  }
  
  // Aplica formato de moneda
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      if (moneyCols.has(C)) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '"$"#,##0.00';
        }
      }
    }
  }
}

/**
 * Ajusta automáticamente el ancho de cada columna según su contenido más largo.
 */
function applyAutofit(ws: XLSX.WorkSheet): void {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const colWidths: { wch: number }[] = [];
  
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLength = 10; // ancho mínimo por defecto
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell) {
        let valStr = '';
        if (cell.v !== undefined && cell.v !== null) {
          if (cell.t === 'n' && cell.z === '"$"#,##0.00') {
            const numVal = Number(cell.v);
            valStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numVal);
          } else if (cell.t === 'n' && cell.z === '0.0%') {
            valStr = `${(Number(cell.v) * 100).toFixed(1)}%`;
          } else {
            valStr = String(cell.v);
          }
        }
        if (valStr.length > maxLength) {
          maxLength = valStr.length;
        }
      }
    }
    colWidths.push({ wch: maxLength + 3 }); // margen de holgura
  }
  ws['!cols'] = colWidths;
}
