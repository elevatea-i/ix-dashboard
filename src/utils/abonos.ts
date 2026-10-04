import { AbonoProveedor, ProviderPayment } from '../types';

export interface AbonosResumen {
  abonos: AbonoProveedor[];
  pagado: number;
  saldo: number;
  porcentaje: number;
  sinComplemento: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function getAbonosDePago(pagoId: string, abonos: AbonoProveedor[]): AbonoProveedor[] {
  return abonos
    .filter(a => a.pagoProveedorId === pagoId)
    .sort((a, b) =>
      a.fechaPago === b.fechaPago
        ? a.creadoEn.localeCompare(b.creadoEn)
        : a.fechaPago.localeCompare(b.fechaPago)
    );
}

export function getAbonosResumen(payment: ProviderPayment, abonos: AbonoProveedor[]): AbonosResumen {
  const propios = getAbonosDePago(payment.id, abonos);
  const pagado = round2(propios.reduce((s, a) => s + a.monto, 0));
  const saldo = Math.max(0, round2(payment.total - pagado));
  const porcentaje = payment.total > 0 ? Math.min(100, (pagado / payment.total) * 100) : 0;
  const sinComplemento = propios.filter(a => !a.complementoEmitido).length;
  return { abonos: propios, pagado, saldo, porcentaje, sinComplemento };
}
