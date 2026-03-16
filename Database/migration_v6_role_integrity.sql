-- =========================================================================
-- MIGRACIÓN V6: INTEGRIDAD DE ROLES Y TABLAS ESPECIALIZADAS
-- Descripción:
--   1. Agrega columna `activo BOOLEAN` a tablas de rol especializado.
--   2. Actualiza handle_new_user() para crear el registro especializado
--      según el rol al invitar un usuario nuevo.
--   3. Crea trigger on_user_role_change que sincroniza automáticamente
--      cuando se cambia el rol_id en perfil_usuario.
-- =========================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AGREGAR CAMPO activo A TABLAS ESPECIALIZADAS
-- ─────────────────────────────────────────────────────────────────────────────
-- Usamos BOOLEAN en lugar de FK a catalogo_estado_general porque el estado
-- de "pertenencia a un rol" es binario: activo (usuario tiene este rol ahora)
-- o inactivo (tuvo este rol antes). El estado de negocio del usuario ya lo
-- gestiona perfil_usuario.estado_id.

ALTER TABLE public.tecnico
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.coordinador
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.director
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- Retrocompatibilidad: los registros existentes quedan como activos
UPDATE public.tecnico     SET activo = true WHERE activo IS NULL;
UPDATE public.coordinador SET activo = true WHERE activo IS NULL;
UPDATE public.director    SET activo = true WHERE activo IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ACTUALIZAR handle_new_user() — CREACIÓN INICIAL AL INVITAR
-- ─────────────────────────────────────────────────────────────────────────────
-- Esta función garantiza que al invitar un usuario con rol TECNICO, COORDINADOR
-- o DIRECTOR, se cree automáticamente su fila en la tabla especializada.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role_id  UUID;
    role_code_meta  TEXT;
    default_estado  UUID;
BEGIN
    -- 1. Leer código de rol desde los metadatos de la invitación
    role_code_meta := COALESCE(NEW.raw_user_meta_data->>'role_code', 'ADMIN');

    -- 2. Buscar el ID del rol en el catálogo
    SELECT id INTO target_role_id
    FROM public.catalogo_rol
    WHERE codigo = role_code_meta
    LIMIT 1;

    -- Fallback a ADMIN si el código no existe
    IF target_role_id IS NULL THEN
        SELECT id INTO target_role_id
        FROM public.catalogo_rol
        WHERE codigo = 'ADMIN'
        LIMIT 1;
        role_code_meta := 'ADMIN';
    END IF;

    -- 3. Estado activo por defecto
    SELECT id INTO default_estado
    FROM public.catalogo_estado_general
    WHERE activo = true
    LIMIT 1;

    -- 4. Crear perfil_usuario
    INSERT INTO public.perfil_usuario (id, rol_id, nombres, apellidos, email, estado_id)
    VALUES (
        NEW.id,
        target_role_id,
        COALESCE(NEW.raw_user_meta_data->>'nombres', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
        NEW.email,
        default_estado
    )
    ON CONFLICT (id) DO NOTHING; -- Evita duplicados si se re-invita

    -- 5. Crear la fila en la tabla especializada según el rol
    CASE role_code_meta
        WHEN 'TECNICO' THEN
            INSERT INTO public.tecnico (usuario_id, activo)
            VALUES (NEW.id, true)
            ON CONFLICT DO NOTHING;

        WHEN 'COORDINADOR' THEN
            INSERT INTO public.coordinador (usuario_id, activo)
            VALUES (NEW.id, true)
            ON CONFLICT DO NOTHING;

        WHEN 'DIRECTOR' THEN
            INSERT INTO public.director (usuario_id, activo)
            VALUES (NEW.id, true)
            ON CONFLICT DO NOTHING;

        ELSE
            NULL; -- ADMIN, CLIENTE: sin tabla especializada
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-registrar el trigger (ya existía, actualizamos la función)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FUNCIÓN sync_specialized_role_tables() — CAMBIO DE ROL
-- ─────────────────────────────────────────────────────────────────────────────
-- Se dispara cuando se actualiza el rol_id de un perfil_usuario.
-- - Desactiva el registro en la tabla del rol ANTERIOR (soft-deactivation).
-- - Crea o reactiva el registro en la tabla del NUEVO rol.

CREATE OR REPLACE FUNCTION public.sync_specialized_role_tables()
RETURNS TRIGGER AS $$
DECLARE
    old_role_code TEXT;
    new_role_code TEXT;
BEGIN
    -- No hay cambio de rol → salir sin hacer nada
    IF OLD.rol_id = NEW.rol_id THEN
        RETURN NEW;
    END IF;

    -- Resolver los códigos de rol
    SELECT codigo INTO old_role_code FROM public.catalogo_rol WHERE id = OLD.rol_id;
    SELECT codigo INTO new_role_code FROM public.catalogo_rol WHERE id = NEW.rol_id;

    -- ── DESACTIVAR registro del rol anterior ─────────────────────────────────
    CASE old_role_code
        WHEN 'TECNICO' THEN
            UPDATE public.tecnico SET activo = false
            WHERE usuario_id = NEW.id AND activo = true;

        WHEN 'COORDINADOR' THEN
            UPDATE public.coordinador SET activo = false
            WHERE usuario_id = NEW.id AND activo = true;

        WHEN 'DIRECTOR' THEN
            UPDATE public.director SET activo = false
            WHERE usuario_id = NEW.id AND activo = true;

        ELSE NULL; -- ADMIN/CLIENTE: sin tabla que desactivar
    END CASE;

    -- ── CREAR O REACTIVAR registro del nuevo rol ──────────────────────────────
    CASE new_role_code
        WHEN 'TECNICO' THEN
            -- Intentar reactivar si ya existía un registro previo
            UPDATE public.tecnico SET activo = true WHERE usuario_id = NEW.id;
            -- Si no existía, crear uno nuevo
            IF NOT FOUND THEN
                INSERT INTO public.tecnico (usuario_id, activo)
                VALUES (NEW.id, true);
            END IF;

        WHEN 'COORDINADOR' THEN
            UPDATE public.coordinador SET activo = true WHERE usuario_id = NEW.id;
            IF NOT FOUND THEN
                INSERT INTO public.coordinador (usuario_id, activo)
                VALUES (NEW.id, true);
            END IF;

        WHEN 'DIRECTOR' THEN
            UPDATE public.director SET activo = true WHERE usuario_id = NEW.id;
            IF NOT FOUND THEN
                INSERT INTO public.director (usuario_id, activo)
                VALUES (NEW.id, true);
            END IF;

        ELSE NULL; -- ADMIN/CLIENTE: sin tabla que crear
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrar el trigger en perfil_usuario (SOLO cuando cambia rol_id)
DROP TRIGGER IF EXISTS on_user_role_change ON public.perfil_usuario;
CREATE TRIGGER on_user_role_change
    AFTER UPDATE OF rol_id ON public.perfil_usuario
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_specialized_role_tables();


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecutar después de aplicar la migración)
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Invitar usuario con rol TECNICO → verificar:
--    SELECT * FROM tecnico WHERE usuario_id = '<id_del_usuario>';
--    → Debe devolver 1 fila con activo = true
--
-- 2. Cambiar su rol a DIRECTOR desde la app → verificar:
--    SELECT * FROM tecnico WHERE usuario_id = '<id>'   → activo = false
--    SELECT * FROM director WHERE usuario_id = '<id>'  → activo = true
--
-- 3. Cambiar de vuelta a TECNICO → verificar:
--    SELECT * FROM tecnico WHERE usuario_id = '<id>'   → activo = true (reactivado)
--    SELECT * FROM director WHERE usuario_id = '<id>'  → activo = false
-- =========================================================================

COMMIT;
