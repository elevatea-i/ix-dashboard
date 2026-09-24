/*
# Fix calcular_resumen_cierre for already-closed projects

## Problem
When called on a project that is already cerrado = true, the function recalculates
from live invoices/expenses/payments. This can produce stale or drifting numbers
because downstream records may have changed after the project was frozen.

## Fix
At the top of the function, check proyectos.cerrado. If true, return the snapshot
values that were frozen at close time:
  - ganancia_total  := proyectos.ganancia_al_cierre
  - ya_repartido    := proyectos.ya_repartido_antes + SUM(repartos_cierre.monto)
  - pendiente       := 0
If the project is NOT closed, the function behaves exactly as before (no changes).

## Modified functions
  - calcular_resumen_cierre(p_proyecto_id uuid) — added early-return branch for
    closed projects.

## No other objects are touched.
*/

CREATE OR REPLACE FUNCTION public.calcular_resumen_cierre(p_proyecto_id uuid)
 RETURNS TABLE(ganancia_total numeric, ya_repartido numeric, pendiente_por_repartir numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cerrado boolean;
  v_ganancia_al_cierre numeric;
  v_ya_repartido_antes numeric;
  v_sum_repartos_cierre numeric;
  v_ingresos numeric;
  v_costo_proveedores numeric;
  v_gastos_proveedor numeric;
  v_costo_terceros numeric;
  v_ganancia numeric;
  v_ya_repartido numeric;
BEGIN
  -- Check if the project is already closed
  SELECT p.cerrado, p.ganancia_al_cierre, COALESCE(p.ya_repartido_antes, 0)
    INTO v_cerrado, v_ganancia_al_cierre, v_ya_repartido_antes
    FROM proyectos p
   WHERE p.id = p_proyecto_id;

  IF v_cerrado = true THEN
    -- Return frozen snapshot values
    SELECT COALESCE(SUM(rc.monto), 0)
      INTO v_sum_repartos_cierre
      FROM repartos_cierre rc
     WHERE rc.proyecto_id = p_proyecto_id;

    ganancia_total        := COALESCE(v_ganancia_al_cierre, 0);
    ya_repartido          := v_ya_repartido_antes + v_sum_repartos_cierre;
    pendiente_por_repartir := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Project is still open — calculate from live data (unchanged logic)
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

  ganancia_total        := v_ganancia;
  ya_repartido          := v_ya_repartido;
  pendiente_por_repartir := ROUND(v_ganancia - v_ya_repartido, 2);

  RETURN NEXT;
END;
$function$;
