/**
 * Calculates the financial breakdown of a third-party payment concept
 * from the original balance.
 *
 * Formula:
 *   depositAmount  = balance ÷ 1.16, rounded to cents
 *   commission      = depositAmount × 0.08, rounded to cents
 *   profit          = balance − depositAmount − commission  (exact residual)
 *
 * Works internally in integer cents to avoid floating-point errors.
 *
 * Verified examples:
 *   2600   → 2241.38 / 179.31 / 179.31
 *   17175  → 14806.03 / 1184.48 / 1184.49
 */
export function calcularDesgloseTercero(saldoOriginal: number): {
  montoADepositar: number;
  comisionIntermediario: number;
  gananciaIxAdicional: number;
} {
  const saldoCentavos = Math.round(saldoOriginal * 100);
  const montoCentavos = Math.round(saldoCentavos / 1.16);
  const comisionCentavos = Math.round(montoCentavos * 0.08);
  const gananciaCentavos = saldoCentavos - montoCentavos - comisionCentavos;

  return {
    montoADepositar: montoCentavos / 100,
    comisionIntermediario: comisionCentavos / 100,
    gananciaIxAdicional: gananciaCentavos / 100,
  };
}
