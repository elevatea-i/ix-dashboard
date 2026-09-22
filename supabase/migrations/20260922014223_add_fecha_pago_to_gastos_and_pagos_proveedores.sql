/*
# Add fecha_pago to gastos and pagos_proveedores

## Summary
Adds a `fecha_pago` (DATE, nullable) column to both `gastos` and `pagos_proveedores`,
replicating the pattern already used in `facturas`. This column records the real date
on which a payment was made, and will be used by the monthly IVA panel to place
IVA acreditable in the correct month.

## New Columns
- `gastos.fecha_pago` (DATE, NULL): The real date the expense was paid.
  NULL when the expense is still 'Pendiente' or when the date hasn't been set yet.
- `pagos_proveedores.fecha_pago` (DATE, NULL): The real date the provider payment was made.
  NULL when the payment is still 'Pendiente' or when the date hasn't been set yet.

## Backfill (historical records before 2026-09-01)
- In `gastos`: rows with estatus_pago = 'Pagado' AND fecha < '2026-09-01'
  get fecha_pago = fecha (the expense date is used as the payment date).
- In `pagos_proveedores`: rows with estatus = 'Pagado' AND fecha < '2026-09-01'
  get fecha_pago = fecha.
- Rows with fecha >= '2026-09-01' keep fecha_pago = NULL regardless of status
  (they will be filled in manually later).
- Rows with estatus 'Pendiente' of any date keep fecha_pago = NULL.

## Trigger Functions
Two BEFORE INSERT OR UPDATE trigger functions that auto-manage fecha_pago:

### set_fecha_pago_gastos()
- On INSERT with estatus 'Pagado' and fecha_pago NULL → fecha_pago = NEW.fecha
- On UPDATE changing estatus from 'Pendiente' to 'Pagado' and fecha_pago NULL →
  fecha_pago = (now() AT TIME ZONE 'America/Mexico_City')::date
- If estatus is 'Pendiente' → fecha_pago = NULL

### set_fecha_pago_pagos_proveedores()
- Same logic but using the `estatus` column (not `estatus_pago`)

Both functions use:
- SET search_path = public
- SECURITY DEFINER
- REVOKE EXECUTE FROM PUBLIC, anon, authenticated (only the trigger can invoke them)

## Important Notes
1. No CHECK constraints are added in this migration — they will come in a follow-up
   migration once the September 2026 records are filled in manually.
2. No RLS policy changes — existing policies remain in effect.
3. No indexes added.
4. Existing triggers and functions are not modified.
*/

-- ============================================================
-- 1. Add fecha_pago column to gastos
-- ============================================================
ALTER TABLE gastos
  ADD COLUMN IF NOT EXISTS fecha_pago DATE NULL;

-- ============================================================
-- 2. Add fecha_pago column to pagos_proveedores
-- ============================================================
ALTER TABLE pagos_proveedores
  ADD COLUMN IF NOT EXISTS fecha_pago DATE NULL;

-- ============================================================
-- 3. Backfill historical records (before 2026-09-01)
-- ============================================================
UPDATE gastos
  SET fecha_pago = fecha
  WHERE estatus_pago = 'Pagado'
    AND fecha < '2026-09-01'
    AND fecha_pago IS NULL;

UPDATE pagos_proveedores
  SET fecha_pago = fecha
  WHERE estatus = 'Pagado'
    AND fecha < '2026-09-01'
    AND fecha_pago IS NULL;

-- ============================================================
-- 4. Trigger function for gastos
-- ============================================================
CREATE OR REPLACE FUNCTION set_fecha_pago_gastos()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If status is Pendiente, clear fecha_pago
  IF NEW.estatus_pago = 'Pendiente' THEN
    NEW.fecha_pago := NULL;
  -- If status is Pagado
  ELSIF NEW.estatus_pago = 'Pagado' THEN
    -- On INSERT: if fecha_pago is NULL, use the expense date
    IF TG_OP = 'INSERT' AND NEW.fecha_pago IS NULL THEN
      NEW.fecha_pago := NEW.fecha;
    END IF;
    -- On UPDATE: if estatus changed from Pendiente to Pagado and fecha_pago is NULL,
    -- set to today (Mexico City time)
    IF TG_OP = 'UPDATE' AND OLD.estatus_pago = 'Pendiente' AND NEW.fecha_pago IS NULL THEN
      NEW.fecha_pago := (now() AT TIME ZONE 'America/Mexico_City')::date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_fecha_pago_gastos() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 5. Trigger function for pagos_proveedores
-- ============================================================
CREATE OR REPLACE FUNCTION set_fecha_pago_pagos_proveedores()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If status is Pendiente, clear fecha_pago
  IF NEW.estatus = 'Pendiente' THEN
    NEW.fecha_pago := NULL;
  -- If status is Pagado
  ELSIF NEW.estatus = 'Pagado' THEN
    -- On INSERT: if fecha_pago is NULL, use the payment date
    IF TG_OP = 'INSERT' AND NEW.fecha_pago IS NULL THEN
      NEW.fecha_pago := NEW.fecha;
    END IF;
    -- On UPDATE: if estatus changed from Pendiente to Pagado and fecha_pago is NULL,
    -- set to today (Mexico City time)
    IF TG_OP = 'UPDATE' AND OLD.estatus = 'Pendiente' AND NEW.fecha_pago IS NULL THEN
      NEW.fecha_pago := (now() AT TIME ZONE 'America/Mexico_City')::date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_fecha_pago_pagos_proveedores() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 6. Create triggers
-- ============================================================
DROP TRIGGER IF EXISTS trg_set_fecha_pago_gastos ON gastos;
CREATE TRIGGER trg_set_fecha_pago_gastos
  BEFORE INSERT OR UPDATE ON gastos
  FOR EACH ROW
  EXECUTE FUNCTION set_fecha_pago_gastos();

DROP TRIGGER IF EXISTS trg_set_fecha_pago_pagos_proveedores ON pagos_proveedores;
CREATE TRIGGER trg_set_fecha_pago_pagos_proveedores
  BEFORE INSERT OR UPDATE ON pagos_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION set_fecha_pago_pagos_proveedores();
