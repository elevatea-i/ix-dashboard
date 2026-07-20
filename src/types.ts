/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Client {
  id: string;
  nombre: string;
  razonSocial: string;
  rfc: string;
  contacto: string;
  createdAt: string;
}

export interface Project {
  id: string;
  nombre: string;
  codigo: string;
  clienteId: string;
  ejecutivoId: 'San' | 'Ale';
  estadoFacturacion?: 'Sin facturar' | 'Facturado' | 'Pagado';
  fechaCreacion: string;
}

export interface Invoice {
  id: string;
  folio: string;
  proyectoId: string;
  subtotal: number;
  iva: number;
  retencionIsr: number;
  retencionIva: number;
  total: number;
  metodoPago: 'PUE' | 'PPD';
  complementoEmitido?: boolean; // Only relevant for PPD
  estado: 'facturada' | 'pagada';
  fechaEmision: string; // YYYY-MM-DD
  fechaPago?: string; // YYYY-MM-DD
  facturado_por?: 'IX' | 'Juan Carlos'; // Selector for who billed: default IX
}

export type ExpenseCategory =
  | 'Pago a proveedores'
  | 'Pagos a terceros'
  | 'Transporte (gasolina, peajes, Uber)'
  | 'Viáticos'
  | 'Comidas internas'
  | 'Compras en línea (Amazon, Mercado Libre)'
  | 'Compras generales (tiendas físicas)'
  | 'Pago de comisiones'
  | 'Pago de impuestos'
  | 'Contadora y servicios profesionales'
  | 'Oficina y coworking'
  | 'Otros / sin clasificar';

export interface Expense {
  id: string;
  tipo: 'Operativo' | 'Proveedor por Proyecto';
  proyectoId: string | null;
  categoriaId: ExpenseCategory;
  concepto: string;
  subtotal: number;
  iva: number;
  isrRetenido: number;
  ivaRetenido: number;
  total: number;
  cuentaOrigen: 'San' | 'Ale' | 'Empresa' | 'Juan Carlos';
  esReembolsable: boolean;
  tieneFactura: boolean;
  metodoPago: 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo';
  estatusPago: 'Pagado' | 'Pendiente';
  fecha: string; // YYYY-MM-DD
}

export interface ProviderPayment {
  id: string;
  proyectoId: string;
  proveedor: string;
  subtotal: number;
  iva: number;
  isrRetenido: number;
  ivaRetenido: number;
  total: number;
  tieneFactura: boolean;
  estatus: 'Pagado' | 'Pendiente';
  fecha: string; // YYYY-MM-DD
  fecha_vencimiento?: string; // YYYY-MM-DD (optional)
}

export interface ThirdPartyPayment {
  id: string;
  proyectoId: string | null;
  concepto: string;
  saldoOriginal: number;
  comisionIntermediario: number;
  gananciaIxAdicional: number;
  montoADepositar: number;
  estatusPago: 'Pagado' | 'Pendiente';
  fecha: string; // YYYY-MM-DD
  dinero_recibido?: boolean;
  fecha_recibido?: string | null;
}

export interface ProfitDistribution {
  id: string;
  proyectoId: string;
  gananciaTotal: number;
  gananciaDueno: number;
  gananciaEjecutivo: number;
  gananciaDiploma: number;
  fechaCreacion: string; // YYYY-MM-DD
  facturas_subtotal_acumulado?: number;
  proveedor_subtotal_acumulado?: number;
  facturaIdsNuevas?: string[];
}

export type ModuleId = 
  | 'clientes' 
  | 'proyectos' 
  | 'facturacion' 
  | 'gastos' 
  | 'pagos_proveedores' 
  | 'pagos_terceros' 
  | 'cuenta_juan_carlos'
  | 'reparto_utilidades' 
  | 'por_impactar' 
  | 'rentabilidad' 
  | 'iva' 
  | 'reportes'
  | 'boveda_iva';

export interface IvaWithdrawal {
  id: string;
  concepto: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
}

export interface PorImpactar {
  id: string;
  descripcion: string;
  monto: number;
  socioResponsable: 'San' | 'Ale' | 'Empresa';
  proyectoOrigenId: string | null; // null represents "Sin proyecto / Gasto general"
  fecha: string; // YYYY-MM-DD
  estatus: 'pendiente' | 'resuelto';
  proyectoDestinoId: string | null;
  gastoIdGenerado: string | null;
}

export interface Module {
  id: ModuleId;
  label: string;
  disabled: boolean;
  tag?: string;
}
