-- ============================================================
-- MIGRACIÓN V2 — Inmotika
-- Fecha: 2026-03-10
-- Ejecutar en Supabase SQL Editor
-- ============================================================

BEGIN;

-- ============================================================
-- 1. perfil_usuario — separar nombre + código de país del teléfono
-- ============================================================
ALTER TABLE public.perfil_usuario
  ADD COLUMN IF NOT EXISTS nombres character varying,
  ADD COLUMN IF NOT EXISTS apellidos character varying,
  ADD COLUMN IF NOT EXISTS telefono_pais_iso character(2) DEFAULT 'CO';

-- Migrar datos existentes (split en primer espacio)
UPDATE public.perfil_usuario
SET
  nombres   = split_part(nombre_completo, ' ', 1),
  apellidos = NULLIF(TRIM(SUBSTRING(nombre_completo FROM POSITION(' ' IN nombre_completo) + 1)), '')
WHERE nombres IS NULL AND nombre_completo IS NOT NULL;

-- ============================================================
-- 2. tecnico_certificado — múltiples certificados por técnico
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tecnico_certificado (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  tecnico_id uuid NOT NULL,
  nombre     character varying NOT NULL,
  url        text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tecnico_certificado_pkey PRIMARY KEY (id),
  CONSTRAINT tecnico_certificado_tecnico_id_fkey
    FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. cliente — código de país + nuevos documentos
-- ============================================================
ALTER TABLE public.cliente
  ADD COLUMN IF NOT EXISTS celular_pais_iso  character(2) DEFAULT 'CO',
  ADD COLUMN IF NOT EXISTS cert_bancaria_url text,
  ADD COLUMN IF NOT EXISTS otros_documentos  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tipo_documento    character varying;

-- tipo_documento almacena el código del catálogo TIPO_DOCUMENTO (ej: 'CC', 'CE', 'NIT')
-- Si tipo_documento = 'NIT' se trata como persona jurídica (requiere DV en el NIT)

-- otros_documentos formato: [{"id":"uuid","nombre":"...","url":"..."}]

-- ============================================================
-- 4. contacto — apellidos, tipo_doc, genero, cargo, eliminar tel. oficina
-- ============================================================

-- Renombrar columna nombre → nombres (mantiene NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacto' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE public.contacto RENAME COLUMN nombre TO nombres;
  END IF;
END $$;

ALTER TABLE public.contacto
  ADD COLUMN IF NOT EXISTS apellidos              character varying,
  ADD COLUMN IF NOT EXISTS tipo_documento         character varying,
  ADD COLUMN IF NOT EXISTS genero_id              uuid REFERENCES public.catalogo(id),
  ADD COLUMN IF NOT EXISTS cargo_id               uuid REFERENCES public.catalogo(id),
  ADD COLUMN IF NOT EXISTS descripcion_cargo      text,
  ADD COLUMN IF NOT EXISTS telefono_movil_pais_iso character(2) DEFAULT 'CO';

-- Eliminar teléfono de oficina
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacto' AND column_name = 'telefono_oficina'
  ) THEN
    ALTER TABLE public.contacto DROP COLUMN telefono_oficina;
  END IF;
END $$;

-- ============================================================
-- 5. sucursal — horarios_atencion TEXT → JSONB + coordenadas
-- ============================================================
-- Limpiar datos existentes antes de cambiar tipo
UPDATE public.sucursal SET horarios_atencion = NULL WHERE horarios_atencion IS NOT NULL;

ALTER TABLE public.sucursal
  ALTER COLUMN horarios_atencion TYPE jsonb
  USING NULL;

ALTER TABLE public.sucursal
  ADD COLUMN IF NOT EXISTS latitud  numeric(10, 7),
  ADD COLUMN IF NOT EXISTS longitud numeric(10, 7);

-- Formato JSONB del SchedulePicker:
-- {"mon":{"isOpen":true,"start":"08:00","end":"17:00"},"tue":{...},...}

-- ============================================================
-- 6. contrato — renombrar numero_contrato → tema
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contrato' AND column_name = 'numero_contrato'
  ) THEN
    ALTER TABLE public.contrato RENAME COLUMN numero_contrato TO tema;
  END IF;
END $$;

-- ============================================================
-- 7. dispositivo — eliminar id_cliente_interno, agregar nuevos campos
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dispositivo' AND column_name = 'id_cliente_interno'
  ) THEN
    ALTER TABLE public.dispositivo DROP COLUMN id_cliente_interno;
  END IF;
END $$;

ALTER TABLE public.dispositivo
  ADD COLUMN IF NOT EXISTS linea                   character varying,
  ADD COLUMN IF NOT EXISTS mac_address             character varying,
  ADD COLUMN IF NOT EXISTS notas_tecnicas          text,
  ADD COLUMN IF NOT EXISTS descripcion             text,
  ADD COLUMN IF NOT EXISTS identificacion_cliente  character varying,
  ADD COLUMN IF NOT EXISTS es_de_inmotika          boolean NOT NULL DEFAULT false;

-- mac_address se muestra en el frontend como "IMAC"
-- descripcion: texto libre que describe el equipo
-- identificacion_cliente: código o referencia interna del cliente para este dispositivo
-- es_de_inmotika: true = el equipo es propiedad de Inmotika, false = es del cliente

-- ============================================================
-- 8. catalogo — agregar constraint único para inserts seguros
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'catalogo'
      AND constraint_name = 'catalogo_tipo_codigo_unique'
  ) THEN
    ALTER TABLE public.catalogo
      ADD CONSTRAINT catalogo_tipo_codigo_unique UNIQUE (tipo, codigo);
  END IF;
END $$;

-- ============================================================
-- 9. DATOS: catalogo_estado_general
-- ============================================================
INSERT INTO public.catalogo_estado_general (codigo, nombre, descripcion) VALUES
  ('ACTIVO',        'Activo',             'Registro activo y operativo'),
  ('INACTIVO',      'Inactivo',           'Registro inactivo o deshabilitado'),
  ('PENDIENTE',     'Pendiente',          'Pendiente de revisión o acción'),
  ('EN_PROCESO',    'En Proceso',         'En ejecución o en curso'),
  ('FINALIZADO',    'Finalizado',         'Proceso completado'),
  ('CANCELADO',     'Cancelado',          'Cancelado o anulado'),
  ('VIGENTE',       'Vigente',            'Contrato o documento vigente'),
  ('VENCIDO',       'Vencido',            'Contrato o documento vencido'),
  ('MANTENIMIENTO', 'En Mantenimiento',   'Equipo en mantenimiento')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 10. DATOS: catalogo_rol
-- ============================================================
INSERT INTO public.catalogo_rol (codigo, nombre) VALUES
  ('ADMIN',       'Administrador'),
  ('DIRECTOR',    'Director'),
  ('COORDINADOR', 'Coordinador'),
  ('TECNICO',     'Técnico'),
  ('CLIENTE',     'Cliente')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 11. DATOS: catalogo — Tipos de documento
-- ============================================================
INSERT INTO public.catalogo (tipo, codigo, nombre, descripcion, orden) VALUES
  ('TIPO_DOCUMENTO', 'CC',  'Cédula de Ciudadanía',           'Documento de identidad colombiano para mayores de edad', 1),
  ('TIPO_DOCUMENTO', 'CE',  'Cédula de Extranjería',          'Documento para extranjeros residentes en Colombia',      2),
  ('TIPO_DOCUMENTO', 'PAS', 'Pasaporte',                      'Documento de viaje internacional',                       3),
  ('TIPO_DOCUMENTO', 'TI',  'Tarjeta de Identidad',           'Documento de identidad para menores de edad',            4),
  ('TIPO_DOCUMENTO', 'NIT', 'NIT',                            'Número de Identificación Tributaria para empresas',      5),
  ('TIPO_DOCUMENTO', 'PPT', 'Permiso de Protección Temporal', 'Documento para migrantes venezolanos',                   6)
ON CONFLICT (tipo, codigo) DO NOTHING;

-- ============================================================
-- 12. DATOS: catalogo — Género
-- ============================================================
INSERT INTO public.catalogo (tipo, codigo, nombre, orden) VALUES
  ('GENERO', 'M',  'Masculino',  1),
  ('GENERO', 'F',  'Femenino',   2),
  ('GENERO', 'O',  'Otro',       3),
  ('GENERO', 'NR', 'No Reporta', 4)
ON CONFLICT (tipo, codigo) DO NOTHING;

-- ============================================================
-- 13. DATOS: catalogo — Cargo del contacto
-- ============================================================
INSERT INTO public.catalogo (tipo, codigo, nombre, orden) VALUES
  ('CARGO_CONTACTO', 'DIRECTIVO',      'Directivo',      1),
  ('CARGO_CONTACTO', 'ADMINISTRATIVO', 'Administrativo', 2),
  ('CARGO_CONTACTO', 'INGENIERIA',     'Ingeniería',     3),
  ('CARGO_CONTACTO', 'COMERCIAL',      'Comercial',      4),
  ('CARGO_CONTACTO', 'MANTENIMIENTO',  'Mantenimiento',  5),
  ('CARGO_CONTACTO', 'COMPRA',         'Compras',        6),
  ('CARGO_CONTACTO', 'OTRO',           'Otro',           7)
ON CONFLICT (tipo, codigo) DO NOTHING;

-- ============================================================
-- 14. DATOS: catalogo — Tipo de visita
-- ============================================================
INSERT INTO public.catalogo (tipo, codigo, nombre, descripcion, orden) VALUES
  ('TIPO_VISITA', 'PREVENTIVO', 'Preventivo', 'Mantenimiento preventivo programado',            1),
  ('TIPO_VISITA', 'CORRECTIVO', 'Correctivo', 'Mantenimiento correctivo por falla o incidente', 2)
ON CONFLICT (tipo, codigo) DO NOTHING;

-- ============================================================
-- NOTAS SOBRE CAMPOS QUE YA EXISTEN EN DB (solo faltaban en frontend)
-- ============================================================
-- dispositivo.fecha_proximo_mantenimiento     → ya existe (date)
-- dispositivo.frecuencia_mantenimiento_meses  → ya existe (integer)
-- paso_protocolo.es_obligatorio               → ya existe (boolean DEFAULT true)
-- categoria_dispositivo.descripcion           → ya existe (text)
-- contrato.estado_id                          → ya existe (FK catalogo_estado_general)
-- sucursal.es_principal                       → ya existe (boolean DEFAULT false)

-- ============================================================
-- 15. Eliminar nombre_completo de perfil_usuario
--     (datos ya migrados a nombres + apellidos en paso 1)
-- ============================================================
ALTER TABLE public.perfil_usuario DROP COLUMN IF EXISTS nombre_completo;

-- ============================================================
-- 16. Actualizar trigger handle_new_user
--     Para que nuevos usuarios usen nombres/apellidos en vez
--     de nombre_completo (que ya no existe)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_id_admin     UUID;
    default_estado_id UUID;
    v_full_name       VARCHAR;
    v_nombres         VARCHAR;
    v_apellidos       VARCHAR;
BEGIN
    SELECT id INTO role_id_admin
      FROM public.catalogo_rol WHERE codigo = 'ADMIN' LIMIT 1;

    SELECT id INTO default_estado_id
      FROM public.catalogo_estado_general WHERE activo = true LIMIT 1;

    -- Obtener nombre completo desde metadata del usuario (si existe) o del email
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Dividir en nombres y apellidos por el primer espacio
    v_nombres := COALESCE(
        NEW.raw_user_meta_data->>'nombres',
        split_part(v_full_name, ' ', 1)
    );
    v_apellidos := COALESCE(
        NEW.raw_user_meta_data->>'apellidos',
        NULLIF(TRIM(SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name) + 1)), '')
    );

    INSERT INTO public.perfil_usuario (id, rol_id, nombres, apellidos, estado_id)
    VALUES (NEW.id, role_id_admin, v_nombres, v_apellidos, default_estado_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
