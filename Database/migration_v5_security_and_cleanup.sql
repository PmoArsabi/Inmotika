-- =========================================================================
-- MIGRACIÓN V5: SEGURIDAD, ESQUEMA DE PERFILES Y RLS
-- Descripción: 
-- 1. Desglosa nombre_completo en nombres y apellidos.
-- 2. Actualiza el trigger handle_new_user para ser dinámico (Rol y Nombres por metadata).
-- 3. Habilita RLS y configura políticas iniciales (Acceso amplio para Coordinador).
-- =========================================================================

BEGIN;

-- 1. CORRECCIÓN DE ESQUEMA EN PERFIL_USUARIO
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS nombres VARCHAR(255);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS apellidos VARCHAR(255);

-- Migrar datos existentes (si los hay) de forma básica
UPDATE perfil_usuario 
SET nombres = split_part(nombre_completo, ' ', 1),
    apellidos = substring(nombre_completo from (length(split_part(nombre_completo, ' ', 1)) + 2));

-- Hacer el cambio definitivo (opcional: borrar nombre_completo después de verificar)
-- ALTER TABLE perfil_usuario DROP COLUMN IF EXISTS nombre_completo;

-- 2. ACTUALIZACIÓN DEL TRIGGER DINÁMICO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_role_id UUID;
    role_code_meta TEXT;
    default_estado_id UUID;
BEGIN
    -- 1. Obtener el código de rol desde los metadatos de la invitación/registro
    role_code_meta := COALESCE(NEW.raw_user_meta_data->>'role_code', 'ADMIN'); -- Fallback seguro a ADMIN
    
    -- 2. Buscar el ID del rol en el catálogo
    SELECT id INTO target_role_id FROM public.catalogo_rol WHERE codigo = role_code_meta LIMIT 1;
    
    -- Si no existe el rol buscado, usamos ADMIN como fallback
    IF target_role_id IS NULL THEN
        SELECT id INTO target_role_id FROM public.catalogo_rol WHERE codigo = 'ADMIN' LIMIT 1;
    END IF;

    -- 3. Obtener un estado activo por defecto
    SELECT id INTO default_estado_id FROM public.catalogo_estado_general WHERE activo = true LIMIT 1;

    -- 4. Insertar el perfil desglosado
    INSERT INTO public.perfil_usuario (id, rol_id, nombres, apellidos, estado_id)
    VALUES (
        NEW.id, 
        target_role_id, 
        COALESCE(NEW.raw_user_meta_data->>'nombres', split_part(NEW.email, '@', 1)), 
        COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
        default_estado_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. HABILITAR RLS Y POLÍTICAS INICIALES
-- Nota: Esto habilita RLS en las tablas principales
ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursal ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud_visita ENABLE ROW LEVEL SECURITY;

-- POLÍTICA DE ACCESO TOTAL PARA ADMIN, DIRECTOR Y COORDINADOR (Temporalmente amplio para Coordinador)
-- Creamos una función helper para verificar roles de administración
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM perfil_usuario p
    JOIN catalogo_rol r ON p.rol_id = r.id
    WHERE p.id = auth.uid() 
    AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar política de acceso total a estas tablas para el grupo administrativo
-- Nota: En un entorno real, ejecutaríamos esto para cada tabla.
-- Aquí damos un ejemplo para las tablas críticas.

DROP POLICY IF EXISTS "Admin access" ON perfil_usuario;
CREATE POLICY "Admin access" ON perfil_usuario FOR ALL USING (is_admin_or_coordinator());

DROP POLICY IF EXISTS "Admin access" ON cliente;
CREATE POLICY "Admin access" ON cliente FOR ALL USING (is_admin_or_coordinator());

DROP POLICY IF EXISTS "Admin access" ON sucursal;
CREATE POLICY "Admin access" ON sucursal FOR ALL USING (is_admin_or_coordinator());

DROP POLICY IF EXISTS "Admin access" ON contacto;
CREATE POLICY "Admin access" ON contacto FOR ALL USING (is_admin_or_coordinator());

DROP POLICY IF EXISTS "Admin access" ON visita;
CREATE POLICY "Admin access" ON visita FOR ALL USING (is_admin_or_coordinator());

DROP POLICY IF EXISTS "Admin access" ON solicitud_visita;
CREATE POLICY "Admin access" ON solicitud_visita FOR ALL USING (is_admin_or_coordinator());

-- POLÍTICA ESPECÍFICA PARA CLIENTE (Crear Solicitudes)
DROP POLICY IF EXISTS "Clientes pueden crear sus solicitudes" ON solicitud_visita;
CREATE POLICY "Clientes pueden crear sus solicitudes" ON solicitud_visita
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfil_usuario p
            JOIN catalogo_rol r ON p.rol_id = r.id
            WHERE p.id = auth.uid() 
            AND r.codigo = 'CLIENTE'
        )
    );

COMMIT;
