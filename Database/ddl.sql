-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.actividad_protocolo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  paso_id uuid NOT NULL,
  descripcion text NOT NULL,
  orden integer NOT NULL DEFAULT 1,
  es_obligatorio boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT actividad_protocolo_pkey PRIMARY KEY (id),
  CONSTRAINT actividad_protocolo_paso_id_fkey FOREIGN KEY (paso_id) REFERENCES public.paso_protocolo(id)
);
CREATE TABLE public.catalogo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo character varying NOT NULL,
  codigo character varying NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT catalogo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.catalogo_estado_general (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  CONSTRAINT catalogo_estado_general_pkey PRIMARY KEY (id)
);
CREATE TABLE public.catalogo_rol (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  activo boolean DEFAULT true,
  CONSTRAINT catalogo_rol_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categoria_dispositivo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  descripcion text,
  marca character varying,
  modelo character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categoria_dispositivo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cliente (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  razon_social character varying NOT NULL,
  nit character varying,
  dv character varying,
  tipo_persona character varying NOT NULL,
  celular character varying,
  email character varying,
  logo_url text,
  rut_url text,
  fecha_nacimiento date,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  celular_pais_iso character DEFAULT 'CO'::bpchar,
  cert_bancaria_url text,
  otros_documentos jsonb DEFAULT '[]'::jsonb,
  tipo_documento character varying,
  CONSTRAINT cliente_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id)
);
CREATE TABLE public.contacto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  identificacion character varying,
  nombres character varying NOT NULL,
  genero character varying,
  cargo character varying,
  area_departamento character varying,
  email character varying,
  telefono_movil character varying NOT NULL,
  fecha_nacimiento date,
  fecha_matrimonio date,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  apellidos character varying,
  tipo_documento character varying,
  genero_id uuid,
  cargo_id uuid,
  descripcion_cargo text,
  telefono_movil_pais_iso character DEFAULT 'CO'::bpchar,
  usuario_id uuid UNIQUE,
  CONSTRAINT contacto_pkey PRIMARY KEY (id),
  CONSTRAINT contacto_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT contacto_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id),
  CONSTRAINT contacto_genero_id_fkey FOREIGN KEY (genero_id) REFERENCES public.catalogo(id),
  CONSTRAINT contacto_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.catalogo(id),
  CONSTRAINT contacto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id)
);
CREATE TABLE public.contacto_sucursal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contacto_id uuid,
  sucursal_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacto_sucursal_pkey PRIMARY KEY (id),
  CONSTRAINT contacto_sucursal_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.contacto(id),
  CONSTRAINT contacto_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id)
);
CREATE TABLE public.contrato (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  cliente_id uuid,
  tema character varying,
  fecha_inicio date,
  fecha_fin date,
  documento_url text,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contrato_pkey PRIMARY KEY (id),
  CONSTRAINT contrato_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id),
  CONSTRAINT contrato_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT contrato_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id)
);
CREATE TABLE public.coordinador (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  director_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT coordinador_pkey PRIMARY KEY (id),
  CONSTRAINT coordinador_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id),
  CONSTRAINT coordinador_director_id_fkey FOREIGN KEY (director_id) REFERENCES public.director(id)
);
CREATE TABLE public.director (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT director_pkey PRIMARY KEY (id),
  CONSTRAINT director_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id)
);
CREATE TABLE public.disponibilidad_tecnico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tecnico_id uuid,
  fecha_inicio timestamp with time zone NOT NULL,
  fecha_fin timestamp with time zone NOT NULL,
  motivo character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disponibilidad_tecnico_pkey PRIMARY KEY (id),
  CONSTRAINT disponibilidad_tecnico_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id)
);
CREATE TABLE public.dispositivo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid,
  categoria_id uuid,
  cliente_id uuid,
  propiedad_de character varying,
  id_inmotika character varying UNIQUE,
  codigo_unico character varying UNIQUE,
  serial character varying,
  proveedor character varying,
  frecuencia_mantenimiento_meses integer,
  fecha_proximo_mantenimiento date,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  linea character varying,
  mac_address character varying,
  notas_tecnicas text,
  descripcion text,
  identificacion_cliente character varying,
  es_de_inmotika boolean NOT NULL DEFAULT false,
  CONSTRAINT dispositivo_pkey PRIMARY KEY (id),
  CONSTRAINT dispositivo_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id),
  CONSTRAINT dispositivo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria_dispositivo(id),
  CONSTRAINT dispositivo_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT dispositivo_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id)
);
CREATE TABLE public.ejecucion_actividad (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  intervencion_id uuid NOT NULL,
  actividad_id uuid NOT NULL,
  completada boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ejecucion_actividad_pkey PRIMARY KEY (id),
  CONSTRAINT ejecucion_actividad_intervencion_id_fkey FOREIGN KEY (intervencion_id) REFERENCES public.intervencion(id),
  CONSTRAINT ejecucion_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividad_protocolo(id)
);
CREATE TABLE public.ejecucion_paso (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  intervencion_id uuid,
  paso_protocolo_id uuid,
  fecha_inicio timestamp with time zone,
  fecha_fin timestamp with time zone,
  comentarios text,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  evidencia_url text,
  CONSTRAINT ejecucion_paso_pkey PRIMARY KEY (id),
  CONSTRAINT ejecucion_paso_intervencion_id_fkey FOREIGN KEY (intervencion_id) REFERENCES public.intervencion(id),
  CONSTRAINT ejecucion_paso_paso_protocolo_id_fkey FOREIGN KEY (paso_protocolo_id) REFERENCES public.paso_protocolo(id),
  CONSTRAINT ejecucion_paso_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo(id)
);
CREATE TABLE public.evidencia_paso (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ejecucion_paso_id uuid,
  url text NOT NULL,
  tipo character varying,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT evidencia_paso_pkey PRIMARY KEY (id),
  CONSTRAINT evidencia_paso_ejecucion_paso_id_fkey FOREIGN KEY (ejecucion_paso_id) REFERENCES public.ejecucion_paso(id)
);
CREATE TABLE public.evidencia_visita (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visita_id uuid,
  url text NOT NULL,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT evidencia_visita_pkey PRIMARY KEY (id),
  CONSTRAINT evidencia_visita_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visita(id)
);
CREATE TABLE public.historial_traslado (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispositivo_id uuid,
  sucursal_origen_id uuid,
  sucursal_destino_id uuid,
  fecha_traslado timestamp with time zone NOT NULL,
  motivo text,
  usuario_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT historial_traslado_pkey PRIMARY KEY (id),
  CONSTRAINT historial_traslado_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivo(id),
  CONSTRAINT historial_traslado_sucursal_origen_id_fkey FOREIGN KEY (sucursal_origen_id) REFERENCES public.sucursal(id),
  CONSTRAINT historial_traslado_sucursal_destino_id_fkey FOREIGN KEY (sucursal_destino_id) REFERENCES public.sucursal(id),
  CONSTRAINT historial_traslado_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id)
);
CREATE TABLE public.intervencion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visita_id uuid,
  dispositivo_id uuid,
  hallazgos text,
  acciones_realizadas text,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT intervencion_pkey PRIMARY KEY (id),
  CONSTRAINT intervencion_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visita(id),
  CONSTRAINT intervencion_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivo(id),
  CONSTRAINT intervencion_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo(id)
);
CREATE TABLE public.paso_protocolo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  categoria_id uuid,
  descripcion text NOT NULL,
  orden integer NOT NULL,
  es_obligatorio boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT paso_protocolo_pkey PRIMARY KEY (id),
  CONSTRAINT paso_protocolo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria_dispositivo(id)
);
CREATE TABLE public.perfil_usuario (
  id uuid NOT NULL,
  telefono character varying,
  avatar_url text,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rol_id uuid NOT NULL,
  nombres character varying,
  apellidos character varying,
  telefono_pais_iso character DEFAULT 'CO'::bpchar,
  tipo_documento character varying,
  identificacion character varying,
  email text,
  CONSTRAINT perfil_usuario_pkey PRIMARY KEY (id),
  CONSTRAINT perfil_usuario_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT perfil_usuario_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id),
  CONSTRAINT perfil_usuario_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.catalogo_rol(id)
);
CREATE TABLE public.solicitud_visita (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  sucursal_id uuid,
  coordinador_id uuid,
  creado_por uuid,
  tipo_visita_id uuid,
  fecha_solicitud timestamp with time zone DEFAULT now(),
  motivo text NOT NULL,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT solicitud_visita_pkey PRIMARY KEY (id),
  CONSTRAINT solicitud_visita_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT solicitud_visita_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id),
  CONSTRAINT solicitud_visita_coordinador_id_fkey FOREIGN KEY (coordinador_id) REFERENCES public.coordinador(id),
  CONSTRAINT solicitud_visita_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.perfil_usuario(id),
  CONSTRAINT solicitud_visita_tipo_visita_id_fkey FOREIGN KEY (tipo_visita_id) REFERENCES public.catalogo(id),
  CONSTRAINT solicitud_visita_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo(id)
);
CREATE TABLE public.sucursal (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  es_principal boolean DEFAULT false,
  nombre character varying NOT NULL,
  direccion character varying,
  ciudad character varying,
  estado_depto character varying,
  pais character varying,
  clasificacion character varying,
  horarios_atencion jsonb,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  latitud numeric,
  longitud numeric,
  CONSTRAINT sucursal_pkey PRIMARY KEY (id),
  CONSTRAINT sucursal_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT sucursal_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id)
);
CREATE TABLE public.tecnico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  documento_cedula_url text,
  planilla_seg_social_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT tecnico_pkey PRIMARY KEY (id),
  CONSTRAINT tecnico_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id)
);
CREATE TABLE public.tecnico_certificado (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tecnico_id uuid NOT NULL,
  nombre character varying NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT tecnico_certificado_pkey PRIMARY KEY (id),
  CONSTRAINT tecnico_certificado_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id)
);
CREATE TABLE public.visita (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  solicitud_id uuid,
  coordinador_id uuid,
  cliente_id uuid,
  sucursal_id uuid,
  tipo_visita_id uuid,
  fecha_programada timestamp with time zone,
  fecha_inicio timestamp with time zone,
  fecha_fin timestamp with time zone,
  observaciones text,
  estado_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visita_pkey PRIMARY KEY (id),
  CONSTRAINT visita_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitud_visita(id),
  CONSTRAINT visita_coordinador_id_fkey FOREIGN KEY (coordinador_id) REFERENCES public.coordinador(id),
  CONSTRAINT visita_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT visita_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id),
  CONSTRAINT visita_tipo_visita_id_fkey FOREIGN KEY (tipo_visita_id) REFERENCES public.catalogo(id),
  CONSTRAINT visita_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES public.catalogo(id)
);
CREATE TABLE public.visita_tecnico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visita_id uuid,
  tecnico_id uuid,
  es_lider boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visita_tecnico_pkey PRIMARY KEY (id),
  CONSTRAINT visita_tecnico_visita_id_fkey FOREIGN KEY (visita_id) REFERENCES public.visita(id),
  CONSTRAINT visita_tecnico_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id)
);