import { AbonoProveedor, ProviderPayment } from '../types';

export interface AbonosResumen {
  abonos: AbonoProveedor[];
  /** Sum of abonos actually paid (estatus Pagado). */
  pagado: number;
  /** Sum of authorized abonos still awaiting payment (estatus Pendiente). */
  autorizadoPorPagar: number;
  /** Total minus every registered abono, paid or not. */
  sinAutorizar: number;
  /** Total minus paid abonos (authorized + not yet authorized). */
  saldo: number;
  /** Paid share of the total, 0-100. */
  porcentaje: number;
  /** Paid abonos still missing their payment complement. */
  sinComplemento: number;
  pendientes: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Paid abonos first (by payment date), then pending ones (by creation time).
export function getAbonosDePago(pagoId: string, abonos: AbonoProveedor[]): AbonoProveedor[] {
  return abonos
    .filter(a => a.pagoProveedorId === pagoId)
    .sort((a, b) => {
      if (a.estatus !== b.estatus) return a.estatus === 'Pagado' ? -1 : 1;
      if (a.estatus === 'Pagado' && a.fechaPago && b.fechaPago && a.fechaPago !== b.fechaPago) {
        return a.fechaPago.localeCompare(b.fechaPago);
      }
      return a.creadoEn.localeCompare(b.creadoEn);
    });
}

export function getAbonosResumen(payment: ProviderPayment, abonos: AbonoProveedor[]): AbonosResumen {
  const propios = getAbonosDePago(payment.id, abonos);
  const pagados = propios.filter(a => a.estatus === 'Pagado');
  const pendientesList = propios.filter(a => a.estatus === 'Pendiente');
  const pagado = round2(pagados.reduce((s, a) => s + a.monto, 0));
  const autorizadoPorPagar = round2(pendientesList.reduce((s, a) => s + a.monto, 0));
  const sinAutorizar = Math.max(0, round2(payment.total - pagado - autorizadoPorPagar));
  const saldo = Math.max(0, round2(payment.total - pagado));
  const porcentaje = payment.total > 0 ? Math.min(100, (pagado / payment.total) * 100) : 0;
  const sinComplemento = pagados.filter(a => !a.complementoEmitido).length;
  return {
    abonos: propios,
    pagado,
    autorizadoPorPagar,
    sinAutorizar,
    saldo,
    porcentaje,
    sinComplemento,
    pendientes: pendientesList.length,
  };
}

// A payment is "por pagar" when it is a plain pending payment, or an
// installment payment with at least one authorized-but-unpaid abono.
export function isPagoPorPagar(payment: ProviderPayment, abonos: AbonoProveedor[]): boolean {
  if (!payment.conParcialidades) return payment.estatus === 'Pendiente';
  return abonos.some(a => a.pagoProveedorId === payment.id && a.estatus === 'Pendiente');
}
