-- Rol ADMIN (TI): acceso total a la plataforma
-- 1) Catálogo  2) Helpers RLS  3) Sync tabla administrador  4) Asignar laura@arsabi.co

-- ── 1. Catálogo ──────────────────────────────────────────────────────────────
INSERT INTO public.catalogo_rol (codigo, nombre, activo)
VALUES ('ADMIN', 'Administrador', true)
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    activo = true;

-- ── 2. Helpers RLS (incluyen ADMIN) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfil_usuario p
    JOIN public.catalogo_rol r ON p.rol_id = r.id
    WHERE p.id = auth.uid()
      AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_management_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfil_usuario p
    JOIN public.catalogo_rol r ON p.rol_id = r.id
    WHERE p.id = auth.uid()
      AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  );
END;
$function$;

-- Catálogo: escritura también para ADMIN
DROP POLICY IF EXISTS "Catalogo: escritura solo para admins" ON public.catalogo;
CREATE POLICY "Catalogo: escritura solo para admins"
  ON public.catalogo
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfil_usuario p
      JOIN public.catalogo_rol r ON p.rol_id = r.id
      WHERE p.id = auth.uid()
        AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
    )
  );

-- ── 3. Sync specialized tables: ADMIN → administrador ────────────────────────
CREATE OR REPLACE FUNCTION public.sync_specialized_role_tables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    old_role_code TEXT;
    new_role_code TEXT;
BEGIN
    IF OLD.rol_id = NEW.rol_id THEN
        RETURN NEW;
    END IF;

    SELECT codigo INTO old_role_code FROM public.catalogo_rol WHERE id = OLD.rol_id;
    SELECT codigo INTO new_role_code FROM public.catalogo_rol WHERE id = NEW.rol_id;

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
$function$;

-- ── 4. Asignar ADMIN a laura@arsabi.co ────────────────────────────────────────
UPDATE public.perfil_usuario p
SET
  rol_id = (SELECT id FROM public.catalogo_rol WHERE codigo = 'ADMIN' LIMIT 1),
  updated_at = now()
WHERE lower(p.email) = lower('laura@arsabi.co');

INSERT INTO public.administrador (usuario_id, activo)
SELECT p.id, true
FROM public.perfil_usuario p
WHERE lower(p.email) = lower('laura@arsabi.co')
ON CONFLICT (usuario_id) DO UPDATE
SET activo = true,
    updated_at = now();
