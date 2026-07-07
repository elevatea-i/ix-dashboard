/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Invoice, ProviderPayment, Expense, Client } from '../types';

export interface ProjectProfitability {
  proyectoId: string;
  proyectoNombre: string;
  proyectoCodigo: string;
  clienteNombre: string;
  costoCliente: number; // Subtotal of all invoices
  costoProveedor: number; // Subtotal of all provider payments
  gastosProveedorVinculados: number; // Subtotal of all expenses of type 'Proveedor por Proyecto'
  ganancia: number; // costoCliente - costoProveedor - gastosProveedorVinculados
  porcentajeRentabilidad: number | 'N/A'; // (ganancia / costoCliente) * 100
}

export interface ClientProfitability {
  clienteId: string;
  clienteNombre: string;
  numeroProyectos: number;
  costoClienteTotal: number;
  costoProveedorTotal: number;
  gastosProveedorVinculadosTotal: number;
  gananciaTotal: number;
  porcentajeRentabilidad: number | 'N/A';
}

/**
 * Calculates the profitability metrics for a single project based on related invoices,
 * provider payments, and expenses of type 'Proveedor por Proyecto'.
 * 
 * @param project The project to calculate profitability for.
 * @param clientName The name of the client associated with the project.
 * @param invoices List of all invoices in the system.
 * @param providerPayments List of all provider payments in the system.
 * @param expenses List of all expenses in the system.
 * @returns An object containing all computed profitability metrics for the project.
 */
export function calculateProjectProfitability(
  project: Project,
  clientName: string,
  invoices: Invoice[],
  providerPayments: ProviderPayment[],
  expenses: Expense[]
): ProjectProfitability {
  // 1. costo_cliente = Sum of subtotal of ALL invoices for this project
  const projectInvoices = invoices.filter(inv => inv.proyectoId === project.id);
  const costoCliente = projectInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

  // 2. costo_proveedor = Sum of subtotal of ALL provider payments for this project
  const projectProviderPayments = providerPayments.filter(pay => pay.proyectoId === project.id);
  const costoProveedor = projectProviderPayments.reduce((sum, pay) => sum + (pay.subtotal || 0), 0);

  // 3. gastos_proveedor_vinculados = Sum of subtotal of ALL expenses of this project with type 'Proveedor por Proyecto'
  const projectExpenses = expenses.filter(
    exp => exp.proyectoId === project.id && exp.tipo === 'Proveedor por Proyecto'
  );
  const gastosProveedorVinculados = projectExpenses.reduce((sum, exp) => sum + (exp.subtotal || 0), 0);

  // 4. ganancia = costo_cliente - costo_proveedor - gastos_proveedor_vinculados
  const ganancia = costoCliente - costoProveedor - gastosProveedorVinculados;

  // 5. porcentaje_rentabilidad = (ganancia / costo_cliente) * 100, rounded to 1 decimal
  let porcentajeRentabilidad: number | 'N/A' = 'N/A';
  if (costoCliente > 0) {
    porcentajeRentabilidad = Number(((ganancia / costoCliente) * 100).toFixed(1));
  }

  return {
    proyectoId: project.id,
    proyectoNombre: project.nombre,
    proyectoCodigo: project.codigo,
    clienteNombre: clientName,
    costoCliente,
    costoProveedor,
    gastosProveedorVinculados,
    ganancia,
    porcentajeRentabilidad
  };
}

/**
 * Aggregates profitability metrics for all clients based on their projects' metrics.
 * 
 * @param clients List of all clients in the system.
 * @param projects List of all projects in the system.
 * @param invoices List of all invoices in the system.
 * @param providerPayments List of all provider payments in the system.
 * @param expenses List of all expenses in the system.
 * @returns A list of profitability objects aggregated by client.
 */
export function calculateClientsProfitability(
  clients: Client[],
  projects: Project[],
  invoices: Invoice[],
  providerPayments: ProviderPayment[],
  expenses: Expense[]
): ClientProfitability[] {
  return clients.map(client => {
    const clientProjects = projects.filter(proj => proj.clienteId === client.id);
    
    let costoClienteTotal = 0;
    let costoProveedorTotal = 0;
    let gastosProveedorVinculadosTotal = 0;
    let gananciaTotal = 0;

    clientProjects.forEach(project => {
      const metrics = calculateProjectProfitability(
        project,
        client.nombre,
        invoices,
        providerPayments,
        expenses
      );
      costoClienteTotal += metrics.costoCliente;
      costoProveedorTotal += metrics.costoProveedor;
      gastosProveedorVinculadosTotal += metrics.gastosProveedorVinculados;
      gananciaTotal += metrics.ganancia;
    });

    let porcentajeRentabilidad: number | 'N/A' = 'N/A';
    if (costoClienteTotal > 0) {
      porcentajeRentabilidad = Number(((gananciaTotal / costoClienteTotal) * 100).toFixed(1));
    }

    return {
      clienteId: client.id,
      clienteNombre: client.nombre,
      numeroProyectos: clientProjects.length,
      costoClienteTotal,
      costoProveedorTotal,
      gastosProveedorVinculadosTotal,
      gananciaTotal,
      porcentajeRentabilidad
    };
  });
}
