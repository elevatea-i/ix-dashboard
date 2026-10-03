-- Payment tracking fields for por_impactar
ALTER TABLE public.por_impactar
  ADD COLUMN estatus_pago text NOT NULL DEFAULT 'Pendiente',
  ADD COLUMN fecha_pago date NULL,
  ADD COLUMN tiene_factura boolean NOT NULL DEFAULT false,
  ADD COLUMN fecha_vencimiento date NULL,
  ADD COLUMN iva numeric NOT NULL DEFAULT 0;
ALTER TABLE public.por_impactar
  ADD CONSTRAINT por_impactar_estatus_pago_check
    CHECK (estatus_pago IN ('Pagado', 'Pendiente')),
  ADD CONSTRAINT por_impactar_pago_fecha_check
    CHECK (
      (estatus_pago = 'Pagado'    AND fecha_pago IS NOT NULL) OR
      (estatus_pago = 'Pendiente' AND fecha_pago IS NULL)
    ),
  ADD CONSTRAINT por_impactar_iva_check
    CHECK (iva >= 0);
-- Payment fields are frozen once the record is resolved.
-- After resolution, the generated expense is the source of truth for VAT.
CREATE OR REPLACE FUNCTION public.trg_bloquea_pago_por_impactar_resuelto()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.estatus = 'resuelto' AND (
       NEW.estatus_pago  IS DISTINCT FROM OLD.estatus_pago  OR
       NEW.fecha_pago    IS DISTINCT FROM OLD.fecha_pago    OR
       NEW.tiene_factura IS DISTINCT FROM OLD.tiene_factura OR
       NEW.iva           IS DISTINCT FROM OLD.iva           OR
       NEW.monto         IS DISTINCT FROM OLD.monto
     ) THEN
    RAISE EXCEPTION 'No se puede modificar el pago de un registro ya resuelto. Corrige el gasto generado en Gastos Pagados.';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER trg_por_impactar_bloquea_pago_resuelto
  BEFORE UPDATE ON public.por_impactar
  FOR EACH ROW EXECUTE FUNCTION trg_bloquea_pago_por_impactar_resuelto();