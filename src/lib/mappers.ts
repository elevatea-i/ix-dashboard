import {
  Client,
  Project,
  Invoice,
  Expense,
  ProviderPayment,
  ThirdPartyPayment,
  ProfitDistribution,
  PorImpactar,
  IvaWithdrawal,
} from '../types';

// ============================================================
// Client / clientes
// ============================================================
export function clientFromDb(row: Record<string, any>): Client {
  return {
    id: row.id,
    nombre: row.nombre,
    razonSocial: row.razon_social,
    rfc: row.rfc,
    contacto: row.contacto,
    createdAt: row.created_at,
  };
}

export function clientToDb(obj: Partial<Client>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.nombre !== undefined) out.nombre = obj.nombre;
  if (obj.razonSocial !== undefined) out.razon_social = obj.razonSocial;
  if (obj.rfc !== undefined) out.rfc = obj.rfc;
  if (obj.contacto !== undefined) out.contacto = obj.contacto;
  if (obj.createdAt !== undefined) out.created_at = obj.createdAt;
  return out;
}

// ============================================================
// Project / proyectos
// ============================================================
export function projectFromDb(row: Record<string, any>): Project {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    clienteId: row.cliente_id,
    ejecutivoId: row.ejecutivo_id,
    estadoFacturacion: row.estado_facturacion,
    fechaCreacion: row.fecha_creacion,
  };
}

export function projectToDb(obj: Partial<Project>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.nombre !== undefined) out.nombre = obj.nombre;
  if (obj.codigo !== undefined) out.codigo = obj.codigo;
  if (obj.clienteId !== undefined) out.cliente_id = obj.clienteId;
  if (obj.ejecutivoId !== undefined) out.ejecutivo_id = obj.ejecutivoId;
  if (obj.estadoFacturacion !== undefined) out.estado_facturacion = obj.estadoFacturacion;
  if (obj.fechaCreacion !== undefined) out.fecha_creacion = obj.fechaCreacion;
  return out;
}

// ============================================================
// Invoice / facturas
// ============================================================
export function invoiceFromDb(row: Record<string, any>): Invoice {
  return {
    id: row.id,
    folio: row.folio,
    proyectoId: row.proyecto_id,
    subtotal: Number(row.subtotal),
    iva: Number(row.iva),
    retencionIsr: Number(row.retencion_isr),
    retencionIva: Number(row.retencion_iva),
    total: Number(row.total),
    metodoPago: row.metodo_pago,
    complementoEmitido: row.complemento_emitido,
    estado: row.estado,
    fechaEmision: row.fecha_emision,
    fechaPago: row.fecha_pago,
    facturado_por: row.facturado_por,
  };
}

export function invoiceToDb(obj: Partial<Invoice>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.folio !== undefined) out.folio = obj.folio;
  if (obj.proyectoId !== undefined) out.proyecto_id = obj.proyectoId;
  if (obj.subtotal !== undefined) out.subtotal = obj.subtotal;
  if (obj.iva !== undefined) out.iva = obj.iva;
  if (obj.retencionIsr !== undefined) out.retencion_isr = obj.retencionIsr;
  if (obj.retencionIva !== undefined) out.retencion_iva = obj.retencionIva;
  if (obj.total !== undefined) out.total = obj.total;
  if (obj.metodoPago !== undefined) out.metodo_pago = obj.metodoPago;
  if (obj.complementoEmitido !== undefined) out.complemento_emitido = obj.complementoEmitido;
  if (obj.estado !== undefined) out.estado = obj.estado;
  if (obj.fechaEmision !== undefined) out.fecha_emision = obj.fechaEmision;
  if (obj.fechaPago !== undefined) out.fecha_pago = obj.fechaPago;
  if (obj.facturado_por !== undefined) out.facturado_por = obj.facturado_por;
  return out;
}

// ============================================================
// Expense / gastos
// ============================================================
export function expenseFromDb(row: Record<string, any>): Expense {
  return {
    id: row.id,
    tipo: row.tipo,
    proyectoId: row.proyecto_id,
    categoriaId: row.categoria_id,
    concepto: row.concepto,
    subtotal: Number(row.subtotal),
    iva: Number(row.iva),
    isrRetenido: Number(row.isr_retenido),
    ivaRetenido: Number(row.iva_retenido),
    total: Number(row.total),
    cuentaOrigen: row.cuenta_origen,
    esReembolsable: row.es_reembolsable,
    tieneFactura: row.tiene_factura,
    metodoPago: row.metodo_pago,
    estatusPago: row.estatus_pago,
    fecha: row.fecha,
  };
}

export function expenseToDb(obj: Partial<Expense>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.tipo !== undefined) out.tipo = obj.tipo;
  if (obj.proyectoId !== undefined) out.proyecto_id = obj.proyectoId;
  if (obj.categoriaId !== undefined) out.categoria_id = obj.categoriaId;
  if (obj.concepto !== undefined) out.concepto = obj.concepto;
  if (obj.subtotal !== undefined) out.subtotal = obj.subtotal;
  if (obj.iva !== undefined) out.iva = obj.iva;
  if (obj.isrRetenido !== undefined) out.isr_retenido = obj.isrRetenido;
  if (obj.ivaRetenido !== undefined) out.iva_retenido = obj.ivaRetenido;
  if (obj.total !== undefined) out.total = obj.total;
  if (obj.cuentaOrigen !== undefined) out.cuenta_origen = obj.cuentaOrigen;
  if (obj.esReembolsable !== undefined) out.es_reembolsable = obj.esReembolsable;
  if (obj.tieneFactura !== undefined) out.tiene_factura = obj.tieneFactura;
  if (obj.metodoPago !== undefined) out.metodo_pago = obj.metodoPago;
  if (obj.estatusPago !== undefined) out.estatus_pago = obj.estatusPago;
  if (obj.fecha !== undefined) out.fecha = obj.fecha;
  return out;
}

// ============================================================
// ProviderPayment / pagos_proveedores
// ============================================================
export function providerPaymentFromDb(row: Record<string, any>): ProviderPayment {
  return {
    id: row.id,
    proyectoId: row.proyecto_id,
    proveedor: row.proveedor,
    subtotal: Number(row.subtotal),
    iva: Number(row.iva),
    isrRetenido: Number(row.isr_retenido),
    ivaRetenido: Number(row.iva_retenido),
    total: Number(row.total),
    tieneFactura: row.tiene_factura,
    estatus: row.estatus,
    fecha: row.fecha,
    fecha_vencimiento: row.fecha_vencimiento,
  };
}

export function providerPaymentToDb(obj: Partial<ProviderPayment>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.proyectoId !== undefined) out.proyecto_id = obj.proyectoId;
  if (obj.proveedor !== undefined) out.proveedor = obj.proveedor;
  if (obj.subtotal !== undefined) out.subtotal = obj.subtotal;
  if (obj.iva !== undefined) out.iva = obj.iva;
  if (obj.isrRetenido !== undefined) out.isr_retenido = obj.isrRetenido;
  if (obj.ivaRetenido !== undefined) out.iva_retenido = obj.ivaRetenido;
  if (obj.total !== undefined) out.total = obj.total;
  if (obj.tieneFactura !== undefined) out.tiene_factura = obj.tieneFactura;
  if (obj.estatus !== undefined) out.estatus = obj.estatus;
  if (obj.fecha !== undefined) out.fecha = obj.fecha;
  if (obj.fecha_vencimiento !== undefined) out.fecha_vencimiento = obj.fecha_vencimiento;
  return out;
}

// ============================================================
// ThirdPartyPayment / pagos_terceros
// ============================================================
export function thirdPartyPaymentFromDb(row: Record<string, any>): ThirdPartyPayment {
  return {
    id: row.id,
    proyectoId: row.proyecto_id,
    concepto: row.concepto,
    saldoOriginal: Number(row.saldo_original),
    comisionIntermediario: Number(row.comision_intermediario),
    gananciaIxAdicional: Number(row.ganancia_ix_adicional),
    montoADepositar: Number(row.monto_a_depositar),
    estatusPago: row.estatus_pago,
    fecha: row.fecha,
    dinero_recibido: row.dinero_recibido,
    fecha_recibido: row.fecha_recibido,
  };
}

export function thirdPartyPaymentToDb(obj: Partial<ThirdPartyPayment>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.proyectoId !== undefined) out.proyecto_id = obj.proyectoId;
  if (obj.concepto !== undefined) out.concepto = obj.concepto;
  if (obj.saldoOriginal !== undefined) out.saldo_original = obj.saldoOriginal;
  if (obj.comisionIntermediario !== undefined) out.comision_intermediario = obj.comisionIntermediario;
  if (obj.gananciaIxAdicional !== undefined) out.ganancia_ix_adicional = obj.gananciaIxAdicional;
  if (obj.montoADepositar !== undefined) out.monto_a_depositar = obj.montoADepositar;
  if (obj.estatusPago !== undefined) out.estatus_pago = obj.estatusPago;
  if (obj.fecha !== undefined) out.fecha = obj.fecha;
  if (obj.dinero_recibido !== undefined) out.dinero_recibido = obj.dinero_recibido;
  if (obj.fecha_recibido !== undefined) out.fecha_recibido = obj.fecha_recibido;
  return out;
}

// ============================================================
// ProfitDistribution / repartos_utilidad (SOLO LECTURA)
// ============================================================
export function profitDistributionFromDb(row: Record<string, any>): ProfitDistribution {
  return {
    id: row.id,
    proyectoId: row.proyecto_id,
    gananciaTotal: Number(row.ganancia_total),
    gananciaDueno: Number(row.ganancia_dueno),
    gananciaEjecutivo: Number(row.ganancia_ejecutivo),
    gananciaDiploma: Number(row.ganancia_diploma),
    fechaCreacion: row.fecha_creacion,
    facturas_subtotal_acumulado: row.facturas_subtotal_acumulado !== undefined ? Number(row.facturas_subtotal_acumulado) : undefined,
    proveedor_subtotal_acumulado: row.proveedor_subtotal_acumulado !== undefined ? Number(row.proveedor_subtotal_acumulado) : undefined,
    facturaIdsNuevas: row.factura_ids_nuevas || [],
  };
}

// ============================================================
// PorImpactar / por_impactar
// ============================================================
export function porImpactarFromDb(row: Record<string, any>): PorImpactar {
  return {
    id: row.id,
    descripcion: row.descripcion,
    monto: Number(row.monto),
    socioResponsable: row.socio_responsable,
    proyectoOrigenId: row.proyecto_origen_id,
    fecha: row.fecha,
    estatus: row.estatus,
    proyectoDestinoId: row.proyecto_destino_id,
    gastoIdGenerado: row.gasto_id_generado,
  };
}

export function porImpactarToDb(obj: Partial<PorImpactar>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.descripcion !== undefined) out.descripcion = obj.descripcion;
  if (obj.monto !== undefined) out.monto = obj.monto;
  if (obj.socioResponsable !== undefined) out.socio_responsable = obj.socioResponsable;
  if (obj.proyectoOrigenId !== undefined) out.proyecto_origen_id = obj.proyectoOrigenId;
  if (obj.fecha !== undefined) out.fecha = obj.fecha;
  if (obj.estatus !== undefined) out.estatus = obj.estatus;
  if (obj.proyectoDestinoId !== undefined) out.proyecto_destino_id = obj.proyectoDestinoId;
  if (obj.gastoIdGenerado !== undefined) out.gasto_id_generado = obj.gastoIdGenerado;
  return out;
}

// ============================================================
// IvaWithdrawal / retiros_iva
// ============================================================
export function ivaWithdrawalFromDb(row: Record<string, any>): IvaWithdrawal {
  return {
    id: row.id,
    concepto: row.concepto,
    monto: Number(row.monto),
    fecha: row.fecha,
  };
}

export function ivaWithdrawalToDb(obj: Partial<IvaWithdrawal>): Record<string, any> {
  const out: Record<string, any> = {};
  if (obj.id !== undefined) out.id = obj.id;
  if (obj.concepto !== undefined) out.concepto = obj.concepto;
  if (obj.monto !== undefined) out.monto = obj.monto;
  if (obj.fecha !== undefined) out.fecha = obj.fecha;
  return out;
}
