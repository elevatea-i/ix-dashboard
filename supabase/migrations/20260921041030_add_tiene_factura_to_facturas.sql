/*
# Add tiene_factura column to facturas table

1. Purpose
   Replicates the existing `tiene_factura` pattern from the `gastos` and `pagos_proveedores` tables
   into the `facturas` table. This allows distinguishing between real CFDI invoices (true) and
   income records without a formal invoice (false). Only invoices with tiene_factura = true
   contribute to IVA Trasladado in the IVA panel calculations.

2. Changes
   - Added column `tiene_factura` (boolean, NOT NULL, DEFAULT true) to `facturas`.
   - All 99 existing invoices automatically default to true (they are all real CFDIs with formal folios and IVA > 0).
   - New invoices also default to true.

3. Security
   - No changes to RLS policies. The column inherits existing table-level RLS.
   - No new policies needed — the column is governed by the same CRUD policies already on `facturas`.

4. Important notes
   - This is a non-destructive additive migration: no data is lost or transformed.
   - The DEFAULT true ensures backward compatibility with all existing rows.
   - Rentabilidad and Reparto de Utilidades calculations are NOT affected — they continue to count all invoices regardless of this flag.
   - Only the IVA Trasladado calculation (src/utils/iva.ts) filters by this field.
*/