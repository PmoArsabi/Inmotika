-- =========================================================================
-- MIGRACIÓN V7: REFACTORIZACIÓN DE CERTIFICADOS Y DOCUMENTOS DE TÉCNICOS
-- Descripción:
--   1. Añade columna `activo` a `tecnico_certificado` para soft-delete.
--   2. Elimina la columna redundante `certificados` de la tabla `tecnico`.
--   3. Migración de datos JSON existentes a la tabla relacional.
-- =========================================================================

BEGIN;

-- 1. ASEGURAR ESTRUCTURA DE tecnico_certificado
ALTER TABLE public.tecnico_certificado ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.tecnico_certificado ALTER COLUMN nombre SET NOT NULL;
ALTER TABLE public.tecnico_certificado ALTER COLUMN url SET NOT NULL;

-- 2. MIGRACIÓN DE DATOS (Si existe la columna y tiene datos)
DO $$
DECLARE
    rec RECORD;
    cert JSONB;
BEGIN
    -- Solo si la columna existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tecnico' AND column_name = 'certificados') THEN
        FOR rec IN SELECT id, certificados FROM public.tecnico WHERE certificados IS NOT NULL AND certificados <> '' LOOP
            -- Intentar parsear como JSON
            BEGIN
                FOR cert IN SELECT * FROM jsonb_array_elements(rec.certificados::jsonb) LOOP
                    INSERT INTO public.tecnico_certificado (tecnico_id, nombre, url, activo)
                    VALUES (rec.id, cert->>'nombre', cert->>'url', true)
                    ON CONFLICT DO NOTHING;
                END LOOP;
            EXCEPTION WHEN OTHERS THEN
                -- Si no es JSON válido, ignorar o loguear
                RAISE NOTICE 'Error al migrar certificados para tecnico %', rec.id;
            END;
        END LOOP;
    END IF;
END $$;

-- 3. ELIMINAR COLUMNA REDUNDANTE
ALTER TABLE public.tecnico DROP COLUMN IF EXISTS certificados;

COMMIT;
