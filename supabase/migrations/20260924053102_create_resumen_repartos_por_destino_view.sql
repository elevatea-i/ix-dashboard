/*
# Create read-only view resumen_repartos_por_destino

## Purpose
Aggregates profit distributions from two sources into a single summary per
destination (San, Ale, Diploma, or any custom name from manual closings).

## Sources combined via UNION ALL
1. repartos_utilidad — 3 implicit rows per record:
   - ('San', ganancia_dueno)
   - ('Ale', ganancia_ejecutivo)
   - ('Diploma', ganancia_diploma)
2. repartos_cierre — 1 row per record: (destino, monto)

## Grouping
Groups by TRIM(LOWER(destino)) to merge case/whitespace variants.
Display label is the MIN(original) — alphabetically first capitalized form,
which naturally yields "Ale", "Diploma", "San".

## Columns returned
- destino (text) — display label
- total_historico (numeric) — sum from repartos_utilidad only
- total_cierres (numeric) — sum from repartos_cierre only
- total_combinado (numeric) — total_historico + total_cierres

## Security
- WITH (security_invoker = true) — inherits the caller's RLS permissions,
  same pattern as saldos_terceros. Both underlying tables already have
  SELECT policies for authenticated.
*/

CREATE OR REPLACE VIEW public.resumen_repartos_por_destino
  WITH (security_invoker = true)
AS
WITH all_rows AS (
  -- From repartos_utilidad: 3 implicit destinos per record
  SELECT 'San' AS destino, ganancia_dueno AS monto, 'historico' AS origen
    FROM repartos_utilidad
  UNION ALL
  SELECT 'Ale', ganancia_ejecutivo, 'historico'
    FROM repartos_utilidad
  UNION ALL
  SELECT 'Diploma', ganancia_diploma, 'historico'
    FROM repartos_utilidad
  UNION ALL
  -- From repartos_cierre: destino is user-entered text
  SELECT destino, monto, 'cierre'
    FROM repartos_cierre
)
SELECT
  MIN(destino) AS destino,
  COALESCE(SUM(monto) FILTER (WHERE origen = 'historico'), 0) AS total_historico,
  COALESCE(SUM(monto) FILTER (WHERE origen = 'cierre'), 0) AS total_cierres,
  COALESCE(SUM(monto), 0) AS total_combinado
FROM all_rows
GROUP BY TRIM(LOWER(destino));
