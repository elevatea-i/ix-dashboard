/*
# Parcialidades (abonos) en pagos a proveedores

1. Tablas modificadas
- `pagos_proveedores`: nueva columna `con_parcialidades` (boolean, default false) + check que exige metodo_pago = 'PPD' cuando es true.
2. Tablas nuevas
- `abonos_proveedores`: abonos (Anticipo / Parcialidad / Finiquito) ligados a un pago a proveedor; monto, fecha_pago, iva proporcional, complemento_emitido, nota.
3. Seguridad
- RLS habilitado en `abonos_proveedores`; 4 políticas (select/insert/update/delete) para `authenticated`, igual que `pagos_proveedores`.
4. Lógica
- Triggers de validación (tope de saldo, IVA proporcional, tipo automático, inmutabilidad), bloqueo por proyecto cerrado, sincronización de estatus/fecha_pago del pago padre y guardia del padre.
- Función `crear_pago_proveedor_parcialidades` para crear pago + anticipo opcional de forma atómica (solo authenticated).
*/

-- 1. Installment flag on provider payments (existing rows stay false)
ALTER TABLE public.pagos_proveedores
  ADD COLUMN con_parcialidades boolean NOT NULL DEFAULT false;

ALTER TABLE public.pagos_proveedores
  ADD CONSTRAINT pagos_proveedores_parcialidades_ppd_check
    CHECK (NOT con_parcialidades OR metodo_pago = 'PPD');

-- 2. Installments table
CREATE TABLE public.abonos_proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_proveedor_id uuid NOT NULL
    REFERENCES public.pagos_proveedores(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL
    REFERENCES public.proyectos(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CHECK (tipo IN ('Anticipo', 'Parcialidad', 'Finiquito')),
  monto numeric NOT NULL CHECK (monto > 0),
  fecha_pago date NOT NULL,
  iva numeric NOT NULL DEFAULT 0 CHECK (iva >= 0),
  complemento_emitido boolean NOT NULL DEFAULT false,
  nota text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX abonos_proveedores_pago_idx
  ON public.abonos_proveedores (pago_proveedor_id);

ALTER TABLE public.abonos_proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_abonos_proveedores"
  ON public.abonos_proveedores FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_abonos_proveedores"
  ON public.abonos_proveedores FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_abonos_proveedores"
  ON public.abonos_proveedores FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_abonos_proveedores"
  ON public.abonos_proveedores FOR DELETE
  TO authenticated USING (true);

-- 3. Installment validation: balance cap, proportional VAT, type, immutability
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
       OR NEW.fecha_pago     IS DISTINCT FROM OLD.fecha_pago
       OR NEW.iva            IS DISTINCT FROM OLD.iva THEN
      RAISE EXCEPTION 'Un abono registrado no se puede modificar. Bórralo y regístralo de nuevo.';
    END IF;
    RETURN NEW;
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

CREATE TRIGGER trg_abonos_proveedores_valida
  BEFORE INSERT OR UPDATE ON public.abonos_proveedores
  FOR EACH ROW EXECUTE FUNCTION trg_valida_abono_proveedor();

CREATE TRIGGER trg_lock_cerrado_abonos_proveedores
  BEFORE INSERT OR DELETE OR UPDATE ON public.abonos_proveedores
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_proyecto_cerrado();

-- 4. Keep parent status and payment date in sync with its installments
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
   WHERE pago_proveedor_id = v_pago_id;

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

CREATE TRIGGER trg_abonos_proveedores_sync_pago
  AFTER INSERT OR DELETE ON public.abonos_proveedores
  FOR EACH ROW EXECUTE FUNCTION trg_sync_pago_desde_abonos();

-- 5. Parent guard: status derives from installments; amounts frozen once paid into
CREATE OR REPLACE FUNCTION public.trg_valida_pago_con_parcialidades()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count   int;
  v_sum     numeric;
  v_ultima  date;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.con_parcialidades IS DISTINCT FROM OLD.con_parcialidades THEN
    RAISE EXCEPTION 'La modalidad de parcialidades solo se define al crear el pago.';
  END IF;

  IF NOT NEW.con_parcialidades THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(monto), 0), MAX(fecha_pago)
    INTO v_count, v_sum, v_ultima
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

  IF v_count > 0 AND ROUND(v_sum, 2) >= NEW.total THEN
    NEW.estatus    := 'Pagado';
    NEW.fecha_pago := v_ultima;
  ELSE
    NEW.estatus    := 'Pendiente';
    NEW.fecha_pago := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- Name sorts after trg_set_fecha_pago_* so it has the final word on status/date
CREATE TRIGGER trg_valida_parcialidades_pagos_proveedores
  BEFORE INSERT OR UPDATE ON public.pagos_proveedores
  FOR EACH ROW EXECUTE FUNCTION trg_valida_pago_con_parcialidades();

-- 6. Atomic creation: payment with installments + optional down payment
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
  p_anticipo_nota        text    DEFAULT NULL
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
    IF p_anticipo_fecha IS NULL THEN
      RAISE EXCEPTION 'El anticipo requiere su fecha de pago.';
    END IF;
    INSERT INTO abonos_proveedores (
      pago_proveedor_id, monto, fecha_pago, complemento_emitido, nota
    ) VALUES (
      v_id, p_anticipo_monto, p_anticipo_fecha,
      COALESCE(p_anticipo_complemento, false), p_anticipo_nota
    );
  END IF;

  RETURN QUERY SELECT * FROM pagos_proveedores WHERE id = v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.crear_pago_proveedor_parcialidades(
  uuid, text, numeric, numeric, numeric, numeric, boolean, date, date,
  numeric, date, boolean, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.crear_pago_proveedor_parcialidades(
  uuid, text, numeric, numeric, numeric, numeric, boolean, date, date,
  numeric, date, boolean, text) TO authenticated;