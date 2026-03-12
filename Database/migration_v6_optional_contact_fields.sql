-- =========================================================================
-- MIGRACIÓN V6: HACER OPCIONAL EL CLIENTE EN CONTACTOS
-- Descripción: Permite que un contacto se cree sin estar asociado a un cliente.
-- =========================================================================

BEGIN;

-- 1. Modificar la columna cliente_id para permitir nulos
-- Nota: En el esquema actual ya es probable que no tenga NOT NULL explícito,
-- pero nos aseguramos de que así sea y eliminamos cualquier restricción que lo obligue.
ALTER TABLE public.contacto ALTER COLUMN cliente_id DROP NOT NULL;

-- 2. (Opcional) Comentario para documentar el cambio
COMMENT ON COLUMN public.contacto.cliente_id IS 'Asociación opcional con cliente. Puede ser NULL si el contacto aún no ha sido asignado.';

COMMIT;
