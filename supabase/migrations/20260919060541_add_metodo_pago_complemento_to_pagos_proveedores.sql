/*
# Add metodo_pago and complemento_emitido to pagos_proveedores

## Summary
Replicates the existing pattern from the `facturas` table into `pagos_proveedores`,
adding two new columns for CFDI payment method tracking and complemento de pago status.

## New Columns
- `metodo_pago` (text, NULL): Payment method ('PUE' or 'PPD'). NULL means "Sin especificar"
  for historical payments that predate this feature. No default is set so existing
  rows remain NULL.
- `complemento_emitido` (boolean, NOT NULL, DEFAULT false): Whether the complemento de pago
  has been emitted/timbrado. Only relevant when metodo_pago = 'PPD'.

## Important Notes
1. Existing rows keep metodo_pago = NULL ("Sin especificar") — no backfill.
2. complemento_emitido defaults to false for all rows, including existing ones.
3. No RLS policy changes — existing policies remain in effect.
4. No indexes added — the column will be filtered client-side, matching the facturas pattern.
*/

ALTER TABLE pagos_proveedores
  ADD COLUMN IF NOT EXISTS metodo_pago text NULL,
  ADD COLUMN IF NOT EXISTS complemento_emitido boolean NOT NULL DEFAULT false;