/*
# Pending / Paid status for provider payment installments

1. Modified tables
- `abonos_proveedores`
  - New column `estatus` (text, NOT NULL, DEFAULT 'Pagado', CHECK IN ('Pendiente','Pagado')).
    Every existing installment becomes 'Pagado', so no current total changes.
  - `fecha_pago` becomes nullable (pending installments have no payment date).
  - New CHECK `abonos_proveedores_estatus_coherencia_check`:
    Pagado requires fecha_pago; Pendiente requires fecha_pago NULL and complemento_emitido = false.

2. Modified functions / triggers
- `trg_valida_abono_proveedor`:
  - UPDATE: estatus, fecha_pago, complemento_emitido and nota may change; pago_proveedor_id,
    proyecto_id, tipo, monto and iva stay frozen. Validates Pendiente <-> Pagado transitions.
  - INSERT: balance cap, type and proportional VAT still read EVERY installment (paid or pending).
    Only adds validation of the new status.
- `trg_sync_pago_desde_abonos`: parent status/date derived from PAID installments only.
  Trigger now fires AFTER INSERT OR DELETE OR UPDATE.
- `trg_valida_pago_con_parcialidades`: parent status/date derived from PAID installments only;
  amount freeze still evaluated over ALL installments.
- `crear_pago_proveedor_parcialidades`: old 13-arg signature dropped; new version adds
  `p_anticipo_estatus` (DEFAULT 'Pagado'). Named-argument calls with the old 13 args keep working.

3. Security
- No RLS or policy changes. RPC keeps SECURITY INVOKER; EXECUTE revoked from PUBLIC/anon,
  granted to authenticated.

4. Notes
- No data rows are inserted, updated or deleted.
*/

-- 1. Status column (default keeps existing rows and the published frontend unchanged)
ALTER TABLE public.abonos_proveedores
  ADD COLUMN IF NOT EXISTS estatus text NOT NULL DEFAULT 'Pagado';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.abonos_proveedores'::regclass
                    AND conname = 'abonos_proveedores_estatus_check') THEN
    ALTER TABLE public.abonos_proveedores
      ADD CONSTRAINT abonos_proveedores_estatus_check
        CHECK (estatus IN ('Pendiente', 'Pagado'));
  END IF;
END $$;

-- 2. Pending installments have no payment date
ALTER TABLE public.abonos_proveedores
  ALTER COLUMN fecha_pago DROP NOT NULL;

-- 3. Status coherence
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.abonos_proveedores'::regclass
                    AND conname = 'abonos_proveedores_estatus_coherencia_check') THEN
    ALTER TABLE public.abonos_proveedores
      ADD CONSTRAINT abonos_proveedores_estatus_coherencia_check
        CHECK (
          (estatus = 'Pagado' AND fecha_pago IS NOT NULL)
          OR (estatus = 'Pendiente' AND fecha_pago IS NULL AND complemento_emitido = false)
        );
  END IF;
END $$;

-- 4. Installment validation
CREATE OR REPLACE FUNCTION public.trg_valida_abono_proveedor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pago        record;
  v_prev_monto  numeric;
  v_prev_iva    numeric;
  v_prev_count  int;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.pago_proveedor_id IS DISTINCT FROM OLD.pago_proveedor_id
       OR NEW.proyecto_id    IS DISTINCT FROM OLD.proyecto_id
       OR NEW.tipo           IS DISTINCT FROM OLD.tipo
       OR NEW.monto          IS DISTINCT FROM OLD.monto
       OR NEW.iva            IS DISTINCT FROM OLD.iva THEN
      RAISE EXCEPTION 'Un abono registrado no se puede modificar. Bórralo y regístralo de nuevo.';
    END IF;

    IF OLD.estatus = 'Pagado' AND NEW.estatus = 'Pendiente' THEN
      -- Reverting clears date and complement; tipo and iva are intentionally kept
      NEW.fecha_pago := NULL;
      NEW.complemento_emitido := false;
    ELSIF OLD.estatus = 'Pendiente' AND NEW.estatus = 'Pagado' THEN
      IF NEW.fecha_pago IS NULL THEN
        RAISE EXCEPTION 'Para marcar el abono como pagado captura su fecha de pago.';
      END IF;
    ELSIF NEW.estatus = 'Pagado' THEN
      IF NEW.fecha_pago IS DISTINCT FROM OLD.fecha_pago THEN
        RAISE EXCEPTION 'La fecha de pago de un abono pagado no se puede modificar. Reviértelo a Pendiente y márcalo como pagado de nuevo.';
      END IF;
    ELSIF NEW.estatus = 'Pendiente' THEN
      IF NEW.fecha_pago IS NOT NULL THEN
        RAISE EXCEPTION 'Un abono pendiente no lleva fecha de pago. Márcalo como pagado para capturarla.';
      END IF;
    END IF;

    IF NEW.estatus = 'Pendiente' AND NEW.complemento_emitido THEN
      RAISE EXCEPTION 'El complemento solo se puede marcar en abonos pagados.';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.estatus = 'Pendiente' THEN
    IF NEW.fecha_pago IS NOT NULL THEN
      RAISE EXCEPTION 'Un abono pendiente no lleva fecha de pago.';
    END IF;
    IF NEW.complemento_emitido THEN
      RAISE EXCEPTION 'El complemento solo se puede marcar en abonos pagados.';
    END IF;
  ELSIF NEW.estatus = 'Pagado' AND NEW.fecha_pago IS NULL THEN
    RAISE EXCEPTION 'Un abono pagado requiere su fecha de pago.';
  END IF;

  NEW.monto := ROUND(NEW.monto, 2);

  SELECT id, proyecto_id, total, iva, con_parcialidades
    INTO v_pago
    FROM pagos_proveedores
   WHERE id = NEW.pago_proveedor_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pago a proveedor no encontrado.';
  END IF;
  IF NOT v_pago.con_parcialidades THEN
    RAISE EXCEPTION 'Este pago no está configurado con parcialidades.';
  END IF;
  IF v_pago.total <= 0 THEN
    RAISE EXCEPTION 'El pago no tiene un total válido.';
  END IF;

  -- Balance cap, type and proportional VAT always read every installment, paid or pending
  SELECT COALESCE(SUM(monto), 0), COALESCE(SUM(iva), 0), COUNT(*)
    INTO v_prev_monto, v_prev_iva, v_prev_count
    FROM abonos_proveedores
   WHERE pago_proveedor_id = NEW.pago_proveedor_id;

  IF ROUND(v_prev_monto + NEW.monto, 2) > v_pago.total THEN
    RAISE EXCEPTION 'El abono supera el saldo pendiente del pago (saldo: %).',
      ROUND(v_pago.total - v_prev_monto, 2);
  END IF;

  NEW.proyecto_id := v_pago.proyecto_id;

  IF ROUND(v_prev_monto + NEW.monto, 2) = v_pago.total THEN
    -- Final installment absorbs VAT rounding
    NEW.tipo := 'Finiquito';
    NEW.iva  := GREATEST(ROUND(v_pago.iva - v_prev_iva, 2), 0);
  ELSE
    NEW.tipo := CASE WHEN v_prev_count = 0 THEN 'Anticipo' ELSE 'Parcialidad' END;
    NEW.iva  := ROUND(v_pago.iva * NEW.monto / v_pago.total, 2);
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Parent sync from PAID installments only
CREATE OR REPLACE FUNCTION public.trg_sync_pago_desde_abonos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pago_id  uuid;
  v_total    numeric;
  v_sum      numeric;
  v_ultima   date;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_pago_id := OLD.pago_proveedor_id;
  ELSE
    v_pago_id := NEW.pago_proveedor_id;
  END IF;

  SELECT total INTO v_total FROM pagos_proveedores WHERE id = v_pago_id;
  IF NOT FOUND THEN
    RETURN NULL; -- parent is being deleted
  END IF;

  SELECT COALESCE(SUM(monto), 0), MAX(fecha_pago)
    INTO v_sum, v_ultima
    FROM abonos_proveedores
   WHERE pago_proveedor_id = v_pago_id
     AND estatus = 'Pagado';

  IF ROUND(v_sum, 2) >= v_total THEN
    UPDATE pagos_proveedores
       SET estatus = 'Pagado', fecha_pago = v_ultima
     WHERE id = v_pago_id;
  ELSE
    UPDATE pagos_proveedores
       SET estatus = 'Pendiente', fecha_pago = NULL
     WHERE id = v_pago_id;
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_abonos_proveedores_sync_pago ON public.abonos_proveedores;
CREATE TRIGGER trg_abonos_proveedores_sync_pago
  AFTER INSERT OR DELETE OR UPDATE ON public.abonos_proveedores
  FOR EACH ROW EXECUTE FUNCTION trg_sync_pago_desde_abonos();

-- 6. Parent guard: status from PAID installments; freeze over ALL installments
CREATE OR REPLACE FUNCTION public.trg_valida_pago_con_parcialidades()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count         int;
  v_count_pagado  int;
  v_sum_pagado    numeric;
  v_ultima        date;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.con_parcialidades IS DISTINCT FROM OLD.con_parcialidades THEN
    RAISE EXCEPTION 'La modalidad de parcialidades solo se define al crear el pago.';
  END IF;

  IF NOT NEW.con_parcialidades THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE estatus = 'Pagado'),
         COALESCE(SUM(monto) FILTER (WHERE estatus = 'Pagado'), 0),
         MAX(fecha_pago) FILTER (WHERE estatus = 'Pagado')
    INTO v_count, v_count_pagado, v_sum_pagado, v_ultima
    FROM abonos_proveedores
   WHERE pago_proveedor_id = NEW.id;

  IF TG_OP = 'UPDATE' AND v_count > 0 AND (
       NEW.proyecto_id   IS DISTINCT FROM OLD.proyecto_id   OR
       NEW.subtotal      IS DISTINCT FROM OLD.subtotal      OR
       NEW.iva           IS DISTINCT FROM OLD.iva           OR
       NEW.isr_retenido  IS DISTINCT FROM OLD.isr_retenido  OR
       NEW.iva_retenido  IS DISTINCT FROM OLD.iva_retenido  OR
       NEW.total         IS DISTINCT FROM OLD.total         OR
       NEW.tiene_factura IS DISTINCT FROM OLD.tiene_factura
     ) THEN
    RAISE EXCEPTION 'Este pago ya tiene abonos: sus montos y su factura no se pueden modificar.';
  END IF;

  IF v_count_pagado > 0 AND ROUND(v_sum_pagado, 2) >= NEW.total THEN
    NEW.estatus    := 'Pagado';
    NEW.fecha_pago := v_ultima;
  ELSE
    NEW.estatus    := 'Pendiente';
    NEW.fecha_pago := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. Atomic creation: replace the old signature to avoid an ambiguous overload
DROP FUNCTION IF EXISTS public.crear_pago_proveedor_parcialidades(
  uuid, text, numeric, numeric, numeric, numeric, boolean, date, date,
  numeric, date, boolean, text);

CREATE OR REPLACE FUNCTION public.crear_pago_proveedor_parcialidades(
  p_proyecto_id          uuid,
  p_proveedor            text,
  p_subtotal             numeric,
  p_iva                  numeric,
  p_isr_retenido         numeric,
  p_iva_retenido         numeric,
  p_tiene_factura        boolean,
  p_fecha                date,
  p_fecha_vencimiento    date    DEFAULT NULL,
  p_anticipo_monto       numeric DEFAULT NULL,
  p_anticipo_fecha       date    DEFAULT NULL,
  p_anticipo_complemento boolean DEFAULT false,
  p_anticipo_nota        text    DEFAULT NULL,
  p_anticipo_estatus     text    DEFAULT 'Pagado'
)
 RETURNS SETOF public.pagos_proveedores
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric;
  v_id    uuid;
BEGIN
  v_total := ROUND(COALESCE(p_subtotal, 0) + COALESCE(p_iva, 0)
                 - COALESCE(p_isr_retenido, 0) - COALESCE(p_iva_retenido, 0), 2);

  IF COALESCE(p_subtotal, 0) <= 0 OR v_total <= 0 THEN
    RAISE EXCEPTION 'El subtotal y el total deben ser mayores a 0.';
  END IF;

  INSERT INTO pagos_proveedores (
    proyecto_id, proveedor, subtotal, iva, isr_retenido, iva_retenido, total,
    tiene_factura, estatus, fecha, fecha_vencimiento, metodo_pago,
    complemento_emitido, con_parcialidades
  ) VALUES (
    p_proyecto_id, p_proveedor, ROUND(p_subtotal, 2), ROUND(COALESCE(p_iva, 0), 2),
    ROUND(COALESCE(p_isr_retenido, 0), 2), ROUND(COALESCE(p_iva_retenido, 0), 2),
    v_total, COALESCE(p_tiene_factura, false), 'Pendiente', p_fecha,
    p_fecha_vencimiento, 'PPD', false, true
  )
  RETURNING id INTO v_id;

  IF p_anticipo_monto IS NOT NULL THEN
    IF p_anticipo_monto <= 0 THEN
      RAISE EXCEPTION 'El anticipo debe ser mayor a 0.';
    END IF;
    IF p_anticipo_estatus IS NULL OR p_anticipo_estatus NOT IN ('Pendiente', 'Pagado') THEN
      RAISE EXCEPTION 'El estatus del anticipo no es válido.';
    END IF;
    IF p_anticipo_estatus = 'Pagado' AND p_anticipo_fecha IS NULL THEN
      RAISE EXCEPTION 'El anticipo requiere su fecha de pago.';
    END IF;
    IF p_anticipo_estatus = 'Pendiente'
       AND (p_anticipo_fecha IS NOT NULL OR COALESCE(p_anticipo_complemento, false)) THEN
      RAISE EXCEPTION 'Un anticipo pendiente no lleva fecha de pago ni complemento.';
    END IF;
    INSERT INTO abonos_proveedores (
      pago_proveedor_id, monto, estatus, fecha_pago, complemento_emitido, nota
    ) VALUES (
      v_id, p_anticipo_monto, p_anticipo_estatus, p_anticipo_fecha,
      COALESCE(p_anticipo_complemento, false), p_anticipo_nota
    );
  END IF;

  RETURN QUERY SELECT * FROM pagos_proveedores WHERE id = v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.crear_pago_proveedor_parcialidades(
  uuid, text, numeric, numeric, numeric, numeric, boolean, date, date,
  numeric, date, boolean, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.crear_pago_proveedor_parcialidades(
  uuid, text, numeric, numeric, numeric, numeric, boolean, date, date,
  numeric, date, boolean, text, text) TO authenticated;