-- =========================================================================
-- SCRIPT DDL: BASE DE DATOS INMOTIKA (Para usar en Supabase SQL Editor)
-- Fecha de Generación: Automática a partir de Diagrama ER
-- =========================================================================

-- NOTA: Supabase ya tiene instalada la extensión pgcrypto y trae integrada la función gen_random_uuid() y el schema 'auth'.

-- 1. ================= CATALOGOS =================

CREATE TABLE catalogo_estado_general (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE catalogo_estado_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE catalogo_estado_intervencion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE catalogo_estado_ejecucion_paso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE catalogo_tipo_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE catalogo_rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- 2. ================= IDENTIDAD Y ROLES =================

CREATE TABLE perfil_usuario (
    -- PK de auth.users.id, si un usuario se borra de Auth, se borra de acá
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol_id UUID REFERENCES catalogo_rol(id) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    avatar_url TEXT,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE director (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coordinador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
    director_id UUID REFERENCES director(id),
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tecnico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES perfil_usuario(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50),
    identificacion VARCHAR(100) UNIQUE,
    documento_cedula_url TEXT,
    planilla_seg_social_url TEXT,
    certificados TEXT,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE disponibilidad_tecnico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tecnico_id UUID REFERENCES tecnico(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    motivo VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ================= ESTRUCTURA DE CLIENTES =================

CREATE TABLE cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social VARCHAR(255) NOT NULL,
    nit VARCHAR(50),
    dv VARCHAR(5),
    tipo_persona VARCHAR(50) NOT NULL,
    celular VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    rut_url TEXT,
    fecha_nacimiento DATE,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sucursal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id) ON DELETE CASCADE,
    es_principal BOOLEAN DEFAULT false,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    estado_depto VARCHAR(100),
    pais VARCHAR(100),
    clasificacion VARCHAR(100),
    horarios_atencion TEXT, -- JSON o Array almacenado como texto
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contacto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id) ON DELETE CASCADE,
    identificacion VARCHAR(100),
    nombre VARCHAR(255) NOT NULL,
    genero VARCHAR(50),
    cargo VARCHAR(100),
    area_departamento VARCHAR(100),
    email VARCHAR(255),
    telefono_movil VARCHAR(50) NOT NULL,
    telefono_oficina VARCHAR(50),
    fecha_nacimiento DATE,
    fecha_matrimonio DATE,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contacto_sucursal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID REFERENCES contacto(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES sucursal(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(contacto_id, sucursal_id) -- Integridad
);

CREATE TABLE contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID REFERENCES sucursal(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES cliente(id), -- Desnormalizado para RLS
    numero_contrato VARCHAR(100),
    fecha_inicio DATE,
    fecha_fin DATE,
    documento_url TEXT,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ================= DISPOSITIVOS Y PROTOCOLOS =================

CREATE TABLE categoria_dispositivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nombre, marca, modelo) -- Integridad
);

CREATE TABLE paso_protocolo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES categoria_dispositivo(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    orden INT NOT NULL,
    es_obligatorio BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(categoria_id, orden) -- Integridad
);

CREATE TABLE dispositivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID REFERENCES sucursal(id) ON DELETE SET NULL,
    categoria_id UUID REFERENCES categoria_dispositivo(id),
    cliente_id UUID REFERENCES cliente(id), -- Desnormalizado para RLS
    propiedad_de VARCHAR(50), -- 'cliente' o 'inmotika'
    id_cliente_interno VARCHAR(100),
    id_inmotika VARCHAR(100) UNIQUE,
    codigo_unico VARCHAR(100) UNIQUE,
    serial VARCHAR(100),
    proveedor VARCHAR(255),
    frecuencia_mantenimiento_meses INT,
    fecha_proximo_mantenimiento DATE,
    estado_id UUID REFERENCES catalogo_estado_general(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE historial_traslado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispositivo_id UUID REFERENCES dispositivo(id) ON DELETE CASCADE,
    sucursal_origen_id UUID REFERENCES sucursal(id),
    sucursal_destino_id UUID REFERENCES sucursal(id),
    fecha_traslado TIMESTAMPTZ NOT NULL,
    motivo TEXT,
    usuario_id UUID REFERENCES perfil_usuario(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ================= OPERACIONES (VISITAS) =================

CREATE TABLE solicitud_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES cliente(id),
    sucursal_id UUID REFERENCES sucursal(id),
    coordinador_id UUID REFERENCES coordinador(id),
    creado_por UUID REFERENCES perfil_usuario(id), -- Null = Sistema
    tipo_visita_id UUID REFERENCES catalogo_tipo_visita(id),
    fecha_solicitud TIMESTAMPTZ DEFAULT now(),
    motivo TEXT NOT NULL,
    estado_id UUID REFERENCES catalogo_estado_visita(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID REFERENCES solicitud_visita(id) ON DELETE CASCADE,
    coordinador_id UUID REFERENCES coordinador(id),
    cliente_id UUID REFERENCES cliente(id), -- Desnormalizado RLS
    sucursal_id UUID REFERENCES sucursal(id), -- Desnormalizado RLS
    tipo_visita_id UUID REFERENCES catalogo_tipo_visita(id),
    fecha_programada TIMESTAMPTZ,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    observaciones TEXT,
    estado_id UUID REFERENCES catalogo_estado_visita(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE evidencia_visita (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visita_id UUID REFERENCES visita(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visita_tecnico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visita_id UUID REFERENCES visita(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES tecnico(id) ON DELETE CASCADE,
    es_lider BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(visita_id, tecnico_id) -- Integridad
);

CREATE TABLE intervencion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visita_id UUID REFERENCES visita(id) ON DELETE CASCADE,
    dispositivo_id UUID REFERENCES dispositivo(id),
    hallazgos TEXT,
    acciones_realizadas TEXT,
    estado_id UUID REFERENCES catalogo_estado_intervencion(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ejecucion_paso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervencion_id UUID REFERENCES intervencion(id) ON DELETE CASCADE,
    paso_protocolo_id UUID REFERENCES paso_protocolo(id),
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    comentarios TEXT,
    estado_id UUID REFERENCES catalogo_estado_ejecucion_paso(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE evidencia_paso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ejecucion_paso_id UUID REFERENCES ejecucion_paso(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    tipo VARCHAR(50), -- 'antes', 'durante', 'despues'
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- 6. ================= TRIGGERS Y FUNCIONES =================
-- =========================================================================

-- FUNCIÓN: Sincronizar usuario de Auth a perfil_usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_id_admin UUID;
    default_estado_id UUID;
BEGIN
    -- Obtener el ID del rol ADMIN (por defecto para el primer usuario o según lógica)
    SELECT id INTO role_id_admin FROM public.catalogo_rol WHERE codigo = 'ADMIN' LIMIT 1;
    
    -- Obtener un estado activo por defecto
    SELECT id INTO default_estado_id FROM public.catalogo_estado_general WHERE activo = true LIMIT 1;

    INSERT INTO public.perfil_usuario (id, rol_id, nombre_completo, estado_id)
    VALUES (
        NEW.id, 
        role_id_admin, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
        default_estado_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Disparar al crear en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOTA: Si el usuario ya existe, se debe crear el perfil manualmente:
-- INSERT INTO public.perfil_usuario (id, rol_id, nombre_completo) 
-- VALUES ('UUID-DEL-USUARIO', 'ID-DEL-ROL', 'Nombre');
