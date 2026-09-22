/**
 * Calcula el desglose financiero de un concepto de pago a tercero
 * a partir del saldo original.
 *
 * Fórmula:
 *   montoADepositar  = saldo ÷ 1.16, redondeado a centavos
 *   comisión         = montoADepositar × 0.08, redondeada a centavos
 *   ganancia         = saldo − montoADepositar − comisión  (residual exacto)
 *
 * Trabaja internamente en centavos enteros para evitar errores de punto flotante.
 *
 * Ejemplos verificados:
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
