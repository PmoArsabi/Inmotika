-- =========================================================================
-- MIGRACIÓN V3: REFACTORIZACIÓN DE ROLES Y PERFILES (RBAC)
-- Descripción: 
-- 1. Elimina 'estado_id' redundante de director, coordinador y tecnico.
-- 2. Crea la tabla intermedia 'perfil_cliente' para que los representantes de la empresa puedan loguearse.
-- =========================================================================

BEGIN;

-- 1. ELIMINAR COLUMNAS REDUNDANTES DE ESTADO
-- Como todos heredan de perfil_usuario, el estado_id se controla desde ahí centralizadamente.

ALTER TABLE director DROP COLUMN IF EXISTS estado_id;
ALTER TABLE coordinador DROP COLUMN IF EXISTS estado_id;
ALTER TABLE tecnico DROP COLUMN IF EXISTS estado_id;

-- 2. CREACIÓN DE LA TABLA PUENTE PARA LOGIN DE CLIENTES (Empresas)
-- Esta tabla vincula un perfil logueable (persona) con una empresa (cliente_id).
-- No tocamos la tabla 'contacto' ya que el usuario mencionó que son solo informativos y no inician sesión.

CREATE TABLE IF NOT EXISTS perfil_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_usuario_id UUID NOT NULL REFERENCES perfil_usuario(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(perfil_usuario_id, cliente_id) -- Un perfil no debería vincularse dos veces a la misma empresa
);

-- Comentarios para la Base de Datos
COMMENT ON TABLE perfil_cliente IS 'Tabla puente que permite a un usuario logueado (perfil_usuario con rol de cliente) acceder a los datos de una empresa (cliente).';

-- 3. NOTA AL DESARROLLADOR: INSERCIÓN DE NUEVOS ROLES
-- Si no existen, asegurarse de que catalogo_rol tenga las opciones base.
-- INSERT INTO catalogo_rol (codigo, nombre) VALUES 
-- ('admin', 'Administrador'), 
-- ('director', 'Director'), 
-- ('coordinador', 'Coordinador'), 
-- ('tecnico', 'Técnico'), 
-- ('cliente', 'Cliente Corporativo')
-- ON CONFLICT (codigo) DO NOTHING;

COMMIT;

-- Fín del Script
