-- =========================================================================
-- MIGRACIÓN V8: INFRAESTRUCTURA ADMINISTRATIVA COMPLETA
-- Descripción:
--   1. Crea la tabla public.administrador para consistencia técnica.
--   2. Actualiza la función handle_new_user() para incluir administradores.
--   3. Actualiza la función sync_specialized_role_tables() para incluir administradores.
--   4. Define políticas de RLS seguras.
-- =========================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREACIÓN DE TABLA ADMINISTRADOR
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.administrador (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT administrador_pkey PRIMARY KEY (id),
  CONSTRAINT administrador_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id)
);

-- Habilitar RLS
ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY;

-- Política de seguridad: Admin/Director/Coordinador pueden gestionar administradores
DROP POLICY IF EXISTS "Admins can manage administrators" ON public.administrador;
CREATE POLICY "Admins can manage administrators" 
ON public.administrador FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_usuario pu
    JOIN public.catalogo_rol cr ON pu.rol_id = cr.id
    WHERE pu.id = auth.uid()
    AND cr.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ACTUALIZAR handle_new_user() — CREACIÓN INICIAL
-- ─────────────────────────────────────────────────────────────────────────────

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
    ON CONFLICT (id) DO NOTHING;

    -- 5. Crear la fila en la tabla especializada según el rol
    CASE role_code_meta
        WHEN 'TECNICO' THEN
            INSERT INTO public.tecnico (usuario_id, activo) VALUES (NEW.id, true) ON CONFLICT DO NOTHING;
        WHEN 'COORDINADOR' THEN
            INSERT INTO public.coordinador (usuario_id, activo) VALUES (NEW.id, true) ON CONFLICT DO NOTHING;
        WHEN 'DIRECTOR' THEN
            INSERT INTO public.director (usuario_id, activo) VALUES (NEW.id, true) ON CONFLICT DO NOTHING;
        WHEN 'ADMIN' THEN
            INSERT INTO public.administrador (usuario_id, activo) VALUES (NEW.id, true) ON CONFLICT DO NOTHING;
        ELSE
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ACTUALIZAR sync_specialized_role_tables() — CAMBIO DE ROL
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_specialized_role_tables()
RETURNS TRIGGER AS $$
DECLARE
    old_role_code TEXT;
    new_role_code TEXT;
BEGIN
    -- No hay cambio de rol → salir
    IF OLD.rol_id = NEW.rol_id THEN
        RETURN NEW;
    END IF;

    -- Resolver los códigos de rol
    SELECT codigo INTO old_role_code FROM public.catalogo_rol WHERE id = OLD.rol_id;
    SELECT codigo INTO new_role_code FROM public.catalogo_rol WHERE id = NEW.rol_id;

    -- ── DESACTIVAR registro del rol anterior ─────────────────────────────────
    CASE old_role_code
        WHEN 'TECNICO' THEN
            UPDATE public.tecnico SET activo = false WHERE usuario_id = NEW.id AND activo = true;
        WHEN 'COORDINADOR' THEN
            UPDATE public.coordinador SET activo = false WHERE usuario_id = NEW.id AND activo = true;
        WHEN 'DIRECTOR' THEN
            UPDATE public.director SET activo = false WHERE usuario_id = NEW.id AND activo = true;
        WHEN 'ADMIN' THEN
            UPDATE public.administrador SET activo = false WHERE usuario_id = NEW.id AND activo = true;
        ELSE NULL;
    END CASE;

    -- ── CREAR O REACTIVAR registro del nuevo rol ──────────────────────────────
    CASE new_role_code
        WHEN 'TECNICO' THEN
            UPDATE public.tecnico SET activo = true WHERE usuario_id = NEW.id;
            IF NOT FOUND THEN INSERT INTO public.tecnico (usuario_id, activo) VALUES (NEW.id, true); END IF;
        WHEN 'COORDINADOR' THEN
            UPDATE public.coordinador SET activo = true WHERE usuario_id = NEW.id;
            IF NOT FOUND THEN INSERT INTO public.coordinador (usuario_id, activo) VALUES (NEW.id, true); END IF;
        WHEN 'DIRECTOR' THEN
            UPDATE public.director SET activo = true WHERE usuario_id = NEW.id;
            IF NOT FOUND THEN INSERT INTO public.director (usuario_id, activo) VALUES (NEW.id, true); END IF;
        WHEN 'ADMIN' THEN
            UPDATE public.administrador SET activo = true WHERE usuario_id = NEW.id;
            IF NOT FOUND THEN INSERT INTO public.administrador (usuario_id, activo) VALUES (NEW.id, true); END IF;
        ELSE NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
