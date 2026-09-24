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
  cerrado: boolean;
  fechaCierre?: string | null;
  gananciaAlCierre?: number | null;
  yaRepartidoAntes?: number | null;
}

export interface RepartoCierre {
  id: string;
  proyectoId: string;
  destino: string;
  porcentaje: number;
  monto: number;
  creadoEn: string;
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
  tieneFactura: boolean; // true = tiene CFDI real (cuenta para IVA Trasladado); false = ingreso sin factura formal (cuenta para Rentabilidad y Reparto igual, pero NO para IVA Trasladado)
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
  fechaPago?: string; // YYYY-MM-DD (real date of payment; null when Pendiente or not yet set)
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
  fechaPago?: string; // YYYY-MM-DD (real date of payment; null when Pendiente or not yet set)
  fecha_vencimiento?: string; // YYYY-MM-DD (optional)
  metodoPago?: 'PUE' | 'PPD'; // undefined = "Sin especificar" (pagos históricos)
  complementoEmitido?: boolean; // Solo relevante si metodoPago === 'PPD'
}

export interface ThirdPartyPayment {
  id: string;
  terceroId: string;
  proyectoId: string | null;
  facturaId: string | null;
  concepto: string;
  saldoOriginal: number;
  comisionIntermediario: number;
  gananciaIxAdicional: number;
  montoADepositar: number;
  statusFac: 'Disponible' | 'Por pagar';
  esHistorico: boolean;
  fecha: string | null;
  creadoEn: string;
}

export interface Tercero {
  id: string;
  nombre: string;
  intermediario: string | null;
  creadoEn: string;
}

export interface DepositoTercero {
  id: string;
  terceroId: string;
  monto: number;
  fecha: string;
  nota: string | null;
  creadoEn: string;
}

export interface SaldoTercero {
  terceroId: string;
  nombre: string;
  totalSaldoOriginal: number;
  totalComision: number;
  totalGanancia: number;
  totalMontoADepositar: number;
  totalMontoDisponible: number;
  totalDepositado: number;
  restante: number;
}

export interface ResumenRepartoDestino {
  destino: string;
  totalHistorico: number;
  totalCierres: number;
  totalCombinado: number;
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
