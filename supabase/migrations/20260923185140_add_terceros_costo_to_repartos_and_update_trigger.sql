/*
# Add terceros_costo_acumulado to repartos_utilidad and update trg_genera_reparto

1. Modified Tables
   - `repartos_utilidad`: adds `terceros_costo_acumulado` (NUMERIC(14,2), NOT NULL, DEFAULT 0)
     to track the cumulative third-party cost at the time each profit-split row was created.

2. Modified Functions
   - `public.trg_genera_reparto()`: replaced in full (CREATE OR REPLACE).
     Now computes a delta for third-party costs (monto_a_depositar + comision_intermediario
     from pagos_terceros where es_historico = false) and subtracts it from the invoice
     subtotal alongside the provider delta when calculating ganancia_delta.
     The new terceros_costo_acumulado value is persisted in each new reparto row.

3. Security
   - REVOKE EXECUTE on trg_genera_reparto() from PUBLIC, anon, authenticated
     (function is only callable by the trigger, never directly).

4. Important Notes
   - The trigger binding (z_trg_facturas_reparto) is NOT modified — it already
     references this function.
   - calcular_split_reparto is NOT modified.
   - No existing rows are inserted, updated, or deleted.
*/

ALTER TABLE repartos_utilidad
  ADD COLUMN IF NOT EXISTS terceros_costo_acumulado NUMERIC(14,2) NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.trg_genera_reparto()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_proj_id           UUID;
  v_prev_prov_acum    NUMERIC;
  v_prev_terc_acum    NUMERIC;
  v_total_prov_actual NUMERIC;
  v_total_terc_actual NUMERIC;
  v_total_fact_actual NUMERIC;
  v_delta_prov        NUMERIC;
  v_delta_terc        NUMERIC;
  v_ganancia_delta    NUMERIC;
  v_diploma_acumulado NUMERIC;
  v_split             RECORD;
BEGIN
  IF NEW.estado IS DISTINCT FROM 'pagada' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.estado = 'pagada' THEN
    RETURN NEW;
  END IF;

  v_proj_id := NEW.proyecto_id;

  SELECT proveedor_subtotal_acumulado, terceros_costo_acumulado
    INTO v_prev_prov_acum, v_prev_terc_acum
    FROM repartos_utilidad
   WHERE proyecto_id = v_proj_id
   ORDER BY creado_en DESC
   LIMIT 1;
  v_prev_prov_acum := COALESCE(v_prev_prov_acum, 0);
  v_prev_terc_acum := COALESCE(v_prev_terc_acum, 0);

  SELECT COALESCE(SUM(subtotal), 0) INTO v_total_prov_actual
    FROM pagos_proveedores WHERE proyecto_id = v_proj_id;
  SELECT COALESCE(SUM(subtotal), 0) INTO v_total_fact_actual
    FROM facturas WHERE proyecto_id = v_proj_id;
  SELECT COALESCE(SUM(monto_a_depositar + comision_intermediario), 0) INTO v_total_terc_actual
    FROM pagos_terceros WHERE proyecto_id = v_proj_id AND es_historico = false;

  v_delta_prov     := v_total_prov_actual - v_prev_prov_acum;
  v_delta_terc     := v_total_terc_actual - v_prev_terc_acum;
  v_ganancia_delta := ROUND(COALESCE(NEW.subtotal, 0) - v_delta_prov - v_delta_terc, 2);

  IF v_ganancia_delta > 0 THEN
    SELECT COALESCE(SUM(ganancia_diploma), 0) INTO v_diploma_acumulado
      FROM repartos_utilidad;

    SELECT * INTO v_split
      FROM public.calcular_split_reparto(v_ganancia_delta, v_diploma_acumulado);

    INSERT INTO repartos_utilidad (
      proyecto_id, ganancia_total, ganancia_dueno, ganancia_ejecutivo,
      ganancia_diploma, facturas_subtotal_acumulado, proveedor_subtotal_acumulado,
      terceros_costo_acumulado, factura_ids_nuevas
    ) VALUES (
      v_proj_id, v_split.ganancia_total, v_split.ganancia_dueno, v_split.ganancia_ejecutivo,
      v_split.ganancia_diploma, v_total_fact_actual, v_total_prov_actual,
      v_total_terc_actual, ARRAY[NEW.id]
    );
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.trg_genera_reparto() FROM PUBLIC, anon, authenticated;