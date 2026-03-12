-- =========================================================================
-- MIGRACIÓN V4: RELACIÓN CONTACTO - PERFIL_USUARIO Y LIMPIEZA DE ESTADOS
-- Descripción: 
-- 1. Elimina 'perfil_cliente' (tabla intermedia anteriormente propuesta).
-- 2. Vincula 'contacto' directamente con 'perfil_usuario' para habilitar login.
-- 3. Elimina 'estado_id' redundante de director, coordinador y tecnico.
-- =========================================================================

BEGIN;

-- 1. ELIMINAR TABLA PERFIL_CLIENTE (SI EXISTE)
DROP TABLE IF EXISTS perfil_cliente;

-- 2. VINCULAR CONTACTO CON PERFIL_USUARIO
-- Agregamos usuario_id a la tabla contacto. 
-- Si es NULL, el contacto es meramente informativo.
-- Si tiene valor, apunta a un perfil logueable en auth.users + perfil_usuario.
ALTER TABLE contacto ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES perfil_usuario(id) ON DELETE SET NULL;

-- 3. ELIMINAR COLUMNAS REDUNDANTES DE ESTADO EN ROLES INTERNOS
-- Se controla centralizadamente desde perfil_usuario.
ALTER TABLE director DROP COLUMN IF EXISTS estado_id;
ALTER TABLE coordinador DROP COLUMN IF EXISTS estado_id;
ALTER TABLE tecnico DROP COLUMN IF EXISTS estado_id;

-- 4. COMENTARIOS PARA LA BASE DE DATOS
COMMENT ON COLUMN contacto.usuario_id IS 'Vinculación con perfil_usuario para permitir el inicio de sesión del contacto como representante del cliente.';

COMMIT;
