/*
# Cuenta corriente de Pagos a Terceros -- nueva estructura de datos

## Resumen
Reconstruye el modelo de datos del módulo de Pagos a Terceros para funcionar
como una cuenta corriente por tercero, con dos listas independientes:
CONCEPTOS (lo que IX le debe) y DEPÓSITOS (pagos en bloque que se abonan).

## 1. Nuevas tablas
- `terceros`
  - `id` (uuid PK) -- identificador único del tercero.
  - `nombre` (text, UNIQUE, NOT NULL) -- nombre del tercero (e.g. Yazu).
  - `intermediario` (text, NULL) -- quién intermedia (e.g. Xiomara).
  - `creado_en` (timestamptz) -- fecha de creación del registro.

- `depositos_terceros`
  - `id` (uuid PK) -- identificador único del depósito.
  - `tercero_id` (uuid FK → terceros, ON DELETE RESTRICT) -- a quién se deposita.
  - `monto` (numeric(14,2), CHECK > 0) -- monto del depósito.
  - `fecha` (date, NOT NULL) -- fecha del depósito.
  - `nota` (text, NULL) -- nota opcional.
  - `creado_en` (timestamptz) -- fecha de creación del registro.

## 2. Columnas agregadas a `pagos_terceros` (tabla existente, 0 registros)
- `tercero_id` (uuid FK → terceros, ON DELETE RESTRICT, NOT NULL)
- `factura_id` (uuid FK → facturas, ON DELETE SET NULL, NULL)
- `status_fac` (text, DEFAULT 'Por pagar', CHECK IN ('Disponible','Por pagar'))
- `es_historico` (boolean, DEFAULT false)
- `creado_en` (timestamptz, DEFAULT now())
- `estatus_pago`: se le agrega DEFAULT 'Pendiente' (antes no tenía default).
- `fecha`: se le quita NOT NULL (los conceptos históricos no tienen fecha).

## 3. Triggers nuevos
- `trg_pagos_terceros_sync_factura` (BEFORE INSERT OR UPDATE en pagos_terceros):
  Si factura_id no es NULL, sobreescribe status_fac y proyecto_id con los datos
  de la factura vinculada.
- `trg_facturas_sync_terceros_conceptos` (AFTER UPDATE en facturas):
  Cuando cambia estado o proyecto_id de una factura, actualiza los conceptos de
  pagos_terceros que apuntan a esa factura.
- `trg_depositos_terceros_no_financiar` (BEFORE INSERT OR UPDATE en depositos_terceros):
  Impide registrar un depósito que supere lo disponible para ese tercero.
  Bloquea la fila del tercero con FOR UPDATE para evitar carreras.

## 4. Vista
- `saldos_terceros` (WITH security_invoker = true):
  Una fila por tercero con totales de conceptos (todas y solo las disponibles)
  y total depositado, más el restante. Usa CTEs separadas para evitar
  producto cartesiano.

## 5. Seguridad
- RLS habilitado en `terceros` y `depositos_terceros`.
- 4 políticas permisivas por tabla (SELECT/INSERT/UPDATE/DELETE) para
  `authenticated`, idénticas al patrón del resto del sistema.
- Todas las funciones de trigger con SECURITY DEFINER, search_path = public,
  y REVOKE EXECUTE de PUBLIC, anon y authenticated.

## 6. Índices
- idx_pagos_terceros_tercero_id
- idx_pagos_terceros_factura_id
- idx_depositos_terceros_tercero_id

## Notas importantes
- No se borra ni renombra ninguna columna existente.
- No se modifica ningún trigger ni función existente.
- No se crean registros de prueba; el único INSERT es el tercero 'Yazu'.
- No se toca ningún archivo del frontend.
*/

-- ============================================================
-- 1. TABLA: terceros
-- ============================================================
CREATE TABLE IF NOT EXISTS terceros (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL UNIQUE,
  intermediario text      NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE terceros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_terceros" ON terceros;
CREATE POLICY "auth_select_terceros" ON terceros
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_terceros" ON terceros;
CREATE POLICY "auth_insert_terceros" ON terceros
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_terceros" ON terceros;
CREATE POLICY "auth_update_terceros" ON terceros
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_terceros" ON terceros;
CREATE POLICY "auth_delete_terceros" ON terceros
  FOR DELETE TO authenticated USING (true);

-- Seed: único tercero inicial
INSERT INTO terceros (nombre, intermediario)
VALUES ('Yazu', 'Xiomara')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 2. ALTER TABLE: pagos_terceros (agregar columnas, modificar defaults)
-- ============================================================

-- 2a. tercero_id (NOT NULL, FK → terceros ON DELETE RESTRICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'pagos_terceros'
      AND column_name = 'tercero_id'
  ) THEN
    ALTER TABLE pagos_terceros
      ADD COLUMN tercero_id uuid NOT NULL
        REFERENCES terceros(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 2b. factura_id (nullable, FK → facturas ON DELETE SET NULL)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'pagos_terceros'
      AND column_name = 'factura_id'
  ) THEN
    ALTER TABLE pagos_terceros
      ADD COLUMN factura_id uuid NULL
        REFERENCES facturas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2c. status_fac
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'pagos_terceros'
      AND column_name = 'status_fac'
  ) THEN
    ALTER TABLE pagos_terceros
      ADD COLUMN status_fac text NOT NULL DEFAULT 'Por pagar';

    ALTER TABLE pagos_terceros
      ADD CONSTRAINT pagos_terceros_status_fac_check
        CHECK (status_fac IN ('Disponible', 'Por pagar'));
  END IF;
END $$;

-- 2d. es_historico
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'pagos_terceros'
      AND column_name = 'es_historico'
  ) THEN
    ALTER TABLE pagos_terceros
      ADD COLUMN es_historico boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2e. creado_en
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name  = 'pagos_terceros'
      AND column_name = 'creado_en'
  ) THEN
    ALTER TABLE pagos_terceros
      ADD COLUMN creado_en timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2f. SET DEFAULT on estatus_pago (currently has no default)
ALTER TABLE pagos_terceros
  ALTER COLUMN estatus_pago SET DEFAULT 'Pendiente';

-- 2g. DROP NOT NULL on fecha (historical concepts may lack a date)
ALTER TABLE pagos_terceros
  ALTER COLUMN fecha DROP NOT NULL;

-- ============================================================
-- 3. TABLA: depositos_terceros
-- ============================================================
CREATE TABLE IF NOT EXISTS depositos_terceros (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tercero_id  uuid          NOT NULL REFERENCES terceros(id) ON DELETE RESTRICT,
  monto       numeric(14,2) NOT NULL CHECK (monto > 0),
  fecha       date          NOT NULL,
  nota        text          NULL,
  creado_en   timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE depositos_terceros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_depositos_terceros" ON depositos_terceros;
CREATE POLICY "auth_select_depositos_terceros" ON depositos_terceros
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_depositos_terceros" ON depositos_terceros;
CREATE POLICY "auth_insert_depositos_terceros" ON depositos_terceros
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_depositos_terceros" ON depositos_terceros;
CREATE POLICY "auth_update_depositos_terceros" ON depositos_terceros
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_depositos_terceros" ON depositos_terceros;
CREATE POLICY "auth_delete_depositos_terceros" ON depositos_terceros
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pagos_terceros_tercero_id
  ON pagos_terceros (tercero_id);

CREATE INDEX IF NOT EXISTS idx_pagos_terceros_factura_id
  ON pagos_terceros (factura_id);

CREATE INDEX IF NOT EXISTS idx_depositos_terceros_tercero_id
  ON depositos_terceros (tercero_id);

-- ============================================================
-- 5. TRIGGER FUNCTION: sync concepto desde factura
--    (BEFORE INSERT OR UPDATE en pagos_terceros)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_sync_concepto_from_factura()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $fn$
DECLARE
  v_estado      text;
  v_proyecto_id uuid;
BEGIN
  IF NEW.factura_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT estado, proyecto_id
    INTO v_estado, v_proyecto_id
    FROM facturas
   WHERE id = NEW.factura_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  NEW.proyecto_id := v_proyecto_id;

  IF v_estado = 'pagada' THEN
    NEW.status_fac := 'Disponible';
  ELSE
    NEW.status_fac := 'Por pagar';
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION trg_sync_concepto_from_factura() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trg_sync_concepto_from_factura() FROM anon;
REVOKE EXECUTE ON FUNCTION trg_sync_concepto_from_factura() FROM authenticated;

DROP TRIGGER IF EXISTS trg_pagos_terceros_sync_factura ON pagos_terceros;
CREATE TRIGGER trg_pagos_terceros_sync_factura
  BEFORE INSERT OR UPDATE ON pagos_terceros
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_concepto_from_factura();

-- ============================================================
-- 6. TRIGGER FUNCTION: propagar cambios de factura a conceptos
--    (AFTER UPDATE en facturas, cuando cambia estado o proyecto_id)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_facturas_sync_pagos_terceros()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $fn$
BEGIN
  IF OLD.estado IS NOT DISTINCT FROM NEW.estado
     AND OLD.proyecto_id IS NOT DISTINCT FROM NEW.proyecto_id THEN
    RETURN NULL;
  END IF;

  UPDATE pagos_terceros
     SET status_fac  = CASE WHEN NEW.estado = 'pagada'
                            THEN 'Disponible'
                            ELSE 'Por pagar'
                       END,
         proyecto_id = NEW.proyecto_id
   WHERE factura_id = NEW.id;

  RETURN NULL;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION trg_facturas_sync_pagos_terceros() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trg_facturas_sync_pagos_terceros() FROM anon;
REVOKE EXECUTE ON FUNCTION trg_facturas_sync_pagos_terceros() FROM authenticated;

DROP TRIGGER IF EXISTS trg_facturas_sync_terceros_conceptos ON facturas;
CREATE TRIGGER trg_facturas_sync_terceros_conceptos
  AFTER UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION trg_facturas_sync_pagos_terceros();

-- ============================================================
-- 7. TRIGGER FUNCTION: guardia "no financiar" en depósitos
--    (BEFORE INSERT OR UPDATE en depositos_terceros)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_valida_deposito_tercero()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $fn$
DECLARE
  v_disponible    numeric;
  v_ya_depositado numeric;
BEGIN
  -- Bloquear la fila del tercero para serializar depósitos concurrentes
  PERFORM 1 FROM terceros WHERE id = NEW.tercero_id FOR UPDATE;

  SELECT COALESCE(SUM(monto_a_depositar), 0)
    INTO v_disponible
    FROM pagos_terceros
   WHERE tercero_id = NEW.tercero_id
     AND status_fac = 'Disponible';

  SELECT COALESCE(SUM(monto), 0)
    INTO v_ya_depositado
    FROM depositos_terceros
   WHERE tercero_id = NEW.tercero_id
     AND id <> NEW.id;

  IF v_ya_depositado + NEW.monto > v_disponible THEN
    RAISE EXCEPTION
      'No se puede registrar el depósito: supera lo disponible para depositar a este tercero (disponible: %, ya depositado: %). IX no financia al cliente.',
      v_disponible, v_ya_depositado;
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION trg_valida_deposito_tercero() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION trg_valida_deposito_tercero() FROM anon;
REVOKE EXECUTE ON FUNCTION trg_valida_deposito_tercero() FROM authenticated;

DROP TRIGGER IF EXISTS trg_depositos_terceros_no_financiar ON depositos_terceros;
CREATE TRIGGER trg_depositos_terceros_no_financiar
  BEFORE INSERT OR UPDATE ON depositos_terceros
  FOR EACH ROW
  EXECUTE FUNCTION trg_valida_deposito_tercero();

-- ============================================================
-- 8. VISTA: saldos_terceros (con CTEs para evitar producto cartesiano)
-- ============================================================
CREATE OR REPLACE VIEW saldos_terceros
  WITH (security_invoker = true)
AS
WITH conceptos_agg AS (
  SELECT
    tercero_id,
    COALESCE(SUM(saldo_original), 0)        AS total_saldo_original,
    COALESCE(SUM(comision_intermediario), 0) AS total_comision,
    COALESCE(SUM(ganancia_ix_adicional), 0)  AS total_ganancia,
    COALESCE(SUM(monto_a_depositar), 0)      AS total_monto_a_depositar,
    COALESCE(SUM(monto_a_depositar) FILTER (WHERE status_fac = 'Disponible'), 0)
                                             AS total_monto_disponible
  FROM pagos_terceros
  GROUP BY tercero_id
),
depositos_agg AS (
  SELECT
    tercero_id,
    COALESCE(SUM(monto), 0) AS total_depositado
  FROM depositos_terceros
  GROUP BY tercero_id
)
SELECT
  t.id                                           AS tercero_id,
  t.nombre,
  COALESCE(c.total_saldo_original, 0)            AS total_saldo_original,
  COALESCE(c.total_comision, 0)                  AS total_comision,
  COALESCE(c.total_ganancia, 0)                  AS total_ganancia,
  COALESCE(c.total_monto_a_depositar, 0)         AS total_monto_a_depositar,
  COALESCE(c.total_monto_disponible, 0)          AS total_monto_disponible,
  COALESCE(d.total_depositado, 0)                AS total_depositado,
  COALESCE(c.total_monto_disponible, 0)
    - COALESCE(d.total_depositado, 0)            AS restante
FROM terceros t
LEFT JOIN conceptos_agg c ON c.tercero_id = t.id
LEFT JOIN depositos_agg d ON d.tercero_id = t.id;
