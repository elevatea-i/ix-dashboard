/*
# Disable automatic profit distribution and prepare manual project close-out

## Summary
This migration stops automatic profit distribution triggered by invoice payments
and lays the groundwork for manual project close-out by San.

## Changes

### 1. Drop trigger z_trg_facturas_reparto
- Removes the AFTER UPDATE trigger on facturas that automatically generated
  profit distribution rows in repartos_utilidad whenever an invoice was marked 'pagada'.
- The underlying functions trg_genera_reparto() and calcular_split_reparto() are
  intentionally LEFT IN PLACE as historical reference — they document the original
  automatic distribution logic and may be consulted for auditing past records.
- All other triggers on facturas remain untouched:
  trg_facturas_estado, trg_facturas_revierte_pago, trg_facturas_borra_reparto,
  trg_facturas_sync_terceros_conceptos.

### 2. New columns on proyectos
- cerrado (boolean, NOT NULL, default false): whether the project has been closed out.
- fecha_cierre (timestamptz, nullable): timestamp of the close-out.
- ganancia_al_cierre (numeric(14,2), nullable): snapshot of real earned profit at close time.
- ya_repartido_antes (numeric(14,2), nullable): snapshot of prior automatic distributions.

### 3. New table repartos_cierre
- Stores the manual distribution created by San when closing a project.
- Columns: id, proyecto_id, destino, porcentaje, monto, creado_en.
- RLS enabled, SELECT-only policy for authenticated. All writes go through
  cerrar_proyecto() which is SECURITY DEFINER.

### 4. Function calcular_resumen_cierre(p_proyecto_id)
- Read-only helper that returns ganancia_total (paid invoices minus costs),
  ya_repartido (sum of old automatic distributions), and pendiente_por_repartir.
- Uses paid invoices only (estado = 'pagada'), all provider payment subtotals,
  'Proveedor por Proyecto' expense subtotals, and non-historical third-party costs.
- SECURITY DEFINER. EXECUTE granted only to authenticated.

### 5. Function cerrar_proyecto(p_proyecto_id, p_distribucion)
- Atomic close-out: validates, distributes, and locks a project in one transaction.
- Row-level lock prevents concurrent close attempts.
- Validates all invoices are paid, distribution percentages sum to 100 (with 0.01 tolerance).
- When pendiente_por_repartir <= 0, skips distribution entirely but still closes the project.
- Uses residual-based rounding for the last element to ensure exact-to-the-cent totals.
- SECURITY DEFINER. EXECUTE granted only to authenticated.

### 6. Lock trigger trg_bloquea_proyecto_cerrado
- BEFORE INSERT/UPDATE/DELETE trigger on facturas, gastos, pagos_proveedores,
  pagos_terceros, and repartos_cierre.
- Blocks all direct modifications when the associated project is closed.
- No exceptions needed for internal triggers (they never fire if the original
  operation is blocked).

## Security
- RLS enabled on repartos_cierre with SELECT-only policy for authenticated.
- Both new functions are SECURITY DEFINER with EXECUTE revoked from PUBLIC, anon,
  and authenticated, then granted only to authenticated.
- Lock trigger prevents data tampering after close-out.

## Important Notes
1. Existing records in repartos_utilidad are NEVER touched — they are immutable history.
2. trg_genera_reparto() and calcular_split_reparto() are kept as historical reference.
3. No frontend files are modified in this migration.
4. No data rows are created, modified, or deleted.
*/

-- ============================================================
-- 1. Drop the automatic profit distribution trigger
-- ============================================================
DROP TRIGGER IF EXISTS z_trg_facturas_reparto ON facturas;


-- ============================================================
-- 2. New columns on proyectos
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proyectos' AND column_name = 'cerrado'
  ) THEN
    ALTER TABLE proyectos ADD COLUMN cerrado boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proyectos' AND column_name = 'fecha_cierre'
  ) THEN
    ALTER TABLE proyectos ADD COLUMN fecha_cierre timestamptz NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proyectos' AND column_name = 'ganancia_al_cierre'
  ) THEN
    ALTER TABLE proyectos ADD COLUMN ganancia_al_cierre numeric(14,2) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proyectos' AND column_name = 'ya_repartido_antes'
  ) THEN
    ALTER TABLE proyectos ADD COLUMN ya_repartido_antes numeric(14,2) NULL;
  END IF;
END $$;


-- ============================================================
-- 3. New table repartos_cierre
-- ============================================================
CREATE TABLE IF NOT EXISTS repartos_cierre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  destino text NOT NULL,
  porcentaje numeric(5,2) NOT NULL CHECK (porcentaje > 0),
  monto numeric(14,2) NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE repartos_cierre ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_repartos_cierre" ON repartos_cierre;
CREATE POLICY "auth_select_repartos_cierre"
  ON repartos_cierre FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
-- 4. Function calcular_resumen_cierre
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_resumen_cierre(p_proyecto_id uuid)
RETURNS TABLE(ganancia_total numeric, ya_repartido numeric, pendiente_por_repartir numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_ingresos numeric;
  v_costo_proveedores numeric;
  v_gastos_proveedor numeric;
  v_costo_terceros numeric;
  v_ganancia numeric;
  v_ya_repartido numeric;
BEGIN
  SELECT COALESCE(SUM(subtotal), 0) INTO v_ingresos
  FROM facturas
  WHERE proyecto_id = p_proyecto_id AND estado = 'pagada';

  SELECT COALESCE(SUM(subtotal), 0) INTO v_costo_proveedores
  FROM pagos_proveedores
  WHERE proyecto_id = p_proyecto_id;

  SELECT COALESCE(SUM(subtotal), 0) INTO v_gastos_proveedor
  FROM gastos
  WHERE proyecto_id = p_proyecto_id AND tipo = 'Proveedor por Proyecto';

  SELECT COALESCE(SUM(monto_a_depositar + comision_intermediario), 0) INTO v_costo_terceros
  FROM pagos_terceros
  WHERE proyecto_id = p_proyecto_id AND es_historico = false;

  v_ganancia := ROUND(v_ingresos - v_costo_proveedores - v_gastos_proveedor - v_costo_terceros, 2);

  SELECT COALESCE(SUM(ru.ganancia_total), 0) INTO v_ya_repartido
  FROM repartos_utilidad ru
  WHERE ru.proyecto_id = p_proyecto_id;

  ganancia_total := v_ganancia;
  ya_repartido := v_ya_repartido;
  pendiente_por_repartir := ROUND(v_ganancia - v_ya_repartido, 2);

  RETURN NEXT;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION calcular_resumen_cierre(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION calcular_resumen_cierre(uuid) TO authenticated;


-- ============================================================
-- 5. Function cerrar_proyecto
-- ============================================================
CREATE OR REPLACE FUNCTION cerrar_proyecto(p_proyecto_id uuid, p_distribucion jsonb)
RETURNS TABLE(ganancia_total numeric, ya_repartido numeric, pendiente_por_repartir numeric, filas_insertadas int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_cerrado boolean;
  v_ganancia numeric;
  v_ya_repartido numeric;
  v_pendiente numeric;
  v_facturas_sin_cobrar int;
  v_suma_porcentajes numeric;
  v_total_filas bigint;
  v_elem jsonb;
  v_pos bigint;
  v_monto numeric;
  v_suma_montos numeric := 0;
  v_filas int := 0;
BEGIN
  -- 1. Lock the project row
  SELECT cerrado INTO v_cerrado
  FROM proyectos
  WHERE id = p_proyecto_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado.';
  END IF;

  -- 2. Already closed?
  IF v_cerrado THEN
    RAISE EXCEPTION 'El proyecto ya esta cerrado.';
  END IF;

  -- 3. All invoices must be paid
  SELECT count(*) INTO v_facturas_sin_cobrar
  FROM facturas
  WHERE proyecto_id = p_proyecto_id AND estado <> 'pagada';

  IF v_facturas_sin_cobrar > 0 THEN
    RAISE EXCEPTION 'No se puede cerrar: hay facturas sin cobrar.';
  END IF;

  -- 4. Get the close-out summary
  SELECT rc.ganancia_total, rc.ya_repartido, rc.pendiente_por_repartir
  INTO v_ganancia, v_ya_repartido, v_pendiente
  FROM calcular_resumen_cierre(p_proyecto_id) rc;

  -- 5. If nothing to distribute, skip distribution but still close
  IF v_pendiente <= 0 THEN
    UPDATE proyectos
    SET cerrado = true,
        fecha_cierre = now(),
        ganancia_al_cierre = v_ganancia,
        ya_repartido_antes = v_ya_repartido
    WHERE id = p_proyecto_id;

    ganancia_total := v_ganancia;
    ya_repartido := v_ya_repartido;
    pendiente_por_repartir := v_pendiente;
    filas_insertadas := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 6. Validate percentages sum to 100 (tolerance 0.01)
  SELECT COALESCE(SUM((e.val->>'porcentaje')::numeric), 0)
  INTO v_suma_porcentajes
  FROM jsonb_array_elements(p_distribucion) AS e(val);

  IF v_suma_porcentajes < 99.99 OR v_suma_porcentajes > 100.01 THEN
    RAISE EXCEPTION 'La suma de porcentajes debe ser exactamente 100 (recibido: %).', v_suma_porcentajes;
  END IF;

  -- 7. Insert distribution rows with residual-based rounding
  v_total_filas := jsonb_array_length(p_distribucion);

  FOR v_elem, v_pos IN
    SELECT elem, pos FROM jsonb_array_elements(p_distribucion) WITH ORDINALITY AS t(elem, pos) ORDER BY pos
  LOOP
    IF v_pos = v_total_filas THEN
      -- Last element gets the residual
      v_monto := ROUND(v_pendiente - v_suma_montos, 2);
      IF v_monto < 0 THEN
        RAISE EXCEPTION 'Error de redondeo: el monto residual es negativo.';
      END IF;
    ELSE
      v_monto := ROUND(v_pendiente * (v_elem->>'porcentaje')::numeric / 100, 2);
    END IF;

    INSERT INTO repartos_cierre (proyecto_id, destino, porcentaje, monto)
    VALUES (
      p_proyecto_id,
      v_elem->>'destino',
      (v_elem->>'porcentaje')::numeric,
      v_monto
    );

    v_suma_montos := v_suma_montos + v_monto;
    v_filas := v_filas + 1;
  END LOOP;

  -- 8. Close the project
  UPDATE proyectos
  SET cerrado = true,
      fecha_cierre = now(),
      ganancia_al_cierre = v_ganancia,
      ya_repartido_antes = v_ya_repartido
  WHERE id = p_proyecto_id;

  -- 9. Return the summary
  ganancia_total := v_ganancia;
  ya_repartido := v_ya_repartido;
  pendiente_por_repartir := v_pendiente;
  filas_insertadas := v_filas;
  RETURN NEXT;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION cerrar_proyecto(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cerrar_proyecto(uuid, jsonb) TO authenticated;


-- ============================================================
-- 6. Lock trigger for closed projects
-- ============================================================
CREATE OR REPLACE FUNCTION trg_bloquea_proyecto_cerrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_proyecto_id uuid;
  v_cerrado boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_proyecto_id := OLD.proyecto_id;
  ELSE
    v_proyecto_id := NEW.proyecto_id;
  END IF;

  IF v_proyecto_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  SELECT cerrado INTO v_cerrado
  FROM proyectos
  WHERE id = v_proyecto_id;

  IF v_cerrado IS TRUE THEN
    RAISE EXCEPTION 'No se puede modificar: el proyecto esta cerrado.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$fn$;

-- Apply lock trigger to facturas
DROP TRIGGER IF EXISTS trg_lock_cerrado_facturas ON facturas;
CREATE TRIGGER trg_lock_cerrado_facturas
  BEFORE INSERT OR UPDATE OR DELETE ON facturas
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_proyecto_cerrado();

-- Apply lock trigger to gastos
DROP TRIGGER IF EXISTS trg_lock_cerrado_gastos ON gastos;
CREATE TRIGGER trg_lock_cerrado_gastos
  BEFORE INSERT OR UPDATE OR DELETE ON gastos
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_proyecto_cerrado();

-- Apply lock trigger to pagos_proveedores
DROP TRIGGER IF EXISTS trg_lock_cerrado_pagos_proveedores ON pagos_proveedores;
CREATE TRIGGER trg_lock_cerrado_pagos_proveedores
  BEFORE INSERT OR UPDATE OR DELETE ON pagos_proveedores
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_proyecto_cerrado();

-- Apply lock trigger to pagos_terceros
DROP TRIGGER IF EXISTS trg_lock_cerrado_pagos_terceros ON pagos_terceros;
CREATE TRIGGER trg_lock_cerrado_pagos_terceros
  BEFORE INSERT OR UPDATE OR DELETE ON pagos_terceros
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_proyecto_cerrado();

-- Apply lock trigger to repartos_cierre
DROP TRIGGER IF EXISTS trg_lock_cerrado_repartos_cierre ON repartos_cierre;
CREATE TRIGGER trg_lock_cerrado_repartos_cierre
  BEFORE INSERT OR UPDATE OR DELETE ON repartos_cierre
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_proyecto_cerrado();
