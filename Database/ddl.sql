-- Esquema canónico Inmotika (desde supabase db pull). Fuente de verdad: tablas, RLS, triggers.
-- Resumen para IA: ai-instructions/database-context.md | Reglas: ai-instructions/reglas-ia.md

drop extension if exists "pg_net";

    "id" uuid not null default gen_random_uuid(),
    "paso_id" uuid not null,
    "descripcion" text not null,
    "orden" integer not null default 1,
    "activo" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."actividad_protocolo" enable row level security;

  create table "public"."administrador" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "activo" boolean not null default true
      );

alter table "public"."administrador" enable row level security;

  create table "public"."catalogo" (
    "id" uuid not null default gen_random_uuid(),
    "tipo" character varying(100) not null,
    "codigo" character varying(100) not null,
    "nombre" character varying(255) not null,
    "descripcion" text,
    "orden" integer default 0,
    "activo" boolean default true,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );

alter table "public"."catalogo" enable row level security;

  create table "public"."catalogo_estado_general" (
    "id" uuid not null default gen_random_uuid(),
    "codigo" character varying(50) not null,
    "nombre" character varying(100) not null,
    "descripcion" text,
    "activo" boolean default true
      );

alter table "public"."catalogo_estado_general" enable row level security;

  create table "public"."catalogo_estado_dispositivo" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" character varying(100) not null,
    "descripcion" text,
    "activo" boolean default true
  );

  alter table "public"."catalogo_estado_dispositivo" enable row level security;

  create table "public"."catalogo_rol" (
    "id" uuid not null default gen_random_uuid(),
    "codigo" character varying(50) not null,
    "nombre" character varying(100) not null,
    "activo" boolean default true
      );

alter table "public"."catalogo_rol" enable row level security;

  create table "public"."categoria_dispositivo" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" character varying(255) not null,
    "descripcion" text,
    "activo" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."categoria_dispositivo" enable row level security;

  create table "public"."cliente" (
    "id" uuid not null default gen_random_uuid(),
    "razon_social" character varying(255) not null,
    "nit" character varying(50),
    "dv" character varying(5),
    "tipo_persona_id" uuid not null,
    "logo_url" text,
    "rut_url" text,
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "cert_bancaria_url" text,
    "tipo_documento" character varying,
    "direccion" character varying,
    "pais" character varying,
    "estado_depto" character varying,
    "ciudad" character varying
  );

alter table "public"."cliente" enable row level security;

  create table "public"."cliente_director" (
    "id" uuid not null default gen_random_uuid(),
    "cliente_id" uuid not null,
    "director_id" uuid not null,
    "created_at" timestamp with time zone default now(),
    "activo" boolean default true
  );

alter table "public"."cliente_director" enable row level security;

  create table "public"."cliente_documento" (
    "id" uuid not null default gen_random_uuid(),
    "cliente_id" uuid not null,
    "nombre" character varying not null,
    "url" text,
    "created_at" timestamp with time zone default now(),
    "activo" boolean not null default true
  );

alter table "public"."cliente_documento" enable row level security;

  create table "public"."contacto" (
    "id" uuid not null default gen_random_uuid(),
    "cliente_id" uuid,
    "identificacion" character varying(100),
    "nombres" character varying(255) not null,
    "genero" character varying(50),
    "cargo" character varying(100),
    "area_departamento" character varying(100),
    "email" character varying(255),
    "telefono_movil" character varying(50) not null,
    "fecha_nacimiento" date,
    "fecha_matrimonio" date,
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "apellidos" character varying,
    "tipo_documento" character varying,
    "genero_id" uuid,
    "cargo_id" uuid,
    "descripcion_cargo" text,
    "telefono_movil_pais_iso" character(2) default 'CO'::bpchar,
    "usuario_id" uuid
      );

alter table "public"."contacto" enable row level security;

  create table "public"."contacto_sucursal" (
    "id" uuid not null default gen_random_uuid(),
    "contacto_id" uuid,
    "sucursal_id" uuid,
    "activo" boolean not null default true,
    "created_at" timestamp with time zone default now()
      );

alter table "public"."contacto_sucursal" enable row level security;

  create table "public"."contrato" (
    "id" uuid not null default gen_random_uuid(),
    "sucursal_id" uuid,
    "cliente_id" uuid,
    "tema" character varying(100),
    "fecha_inicio" date,
    "fecha_fin" date,
    "documento_url" text,
    "estado_id" uuid,
    "num_visitas_preventivas" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."contrato" enable row level security;

  create table "public"."coordinador" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid,
    "director_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "activo" boolean not null default true
      );

alter table "public"."coordinador" enable row level security;

  create table "public"."director" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "activo" boolean not null default true
      );

alter table "public"."director" enable row level security;

  create table "public"."disponibilidad_tecnico" (
    "id" uuid not null default gen_random_uuid(),
    "tecnico_id" uuid,
    "fecha_inicio" timestamp with time zone not null,
    "fecha_fin" timestamp with time zone not null,
    "motivo" character varying(255),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."disponibilidad_tecnico" enable row level security;

  create table "public"."proveedor" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" character varying(255) not null,
    "activo" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
  );

  alter table "public"."proveedor" enable row level security;

  create table "public"."marca" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" character varying(255) not null,
    "proveedor_id" uuid,
    "activo" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
  );

  alter table "public"."marca" enable row level security;

  create table "public"."dispositivo" (
    "id" uuid not null default gen_random_uuid(),
    "sucursal_id" uuid,
    "categoria_id" uuid,
    "cliente_id" uuid,
    "id_inmotika" character varying(100),
    "codigo_unico" character varying(100),
    "serial" character varying(100),
    "frecuencia_mantenimiento_meses" integer,
    "fecha_proximo_mantenimiento" date,
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "linea" character varying,
    "mac_address" character varying,
    "notas_tecnicas" text,
    "es_de_inmotika" boolean not null default false,
    "modelo" character varying(255),
    "proveedor_id" uuid,
    "marca_id" uuid,
    "estado_gestion_id" uuid,
    "fecha_compra" date,
    "fecha_caducidad" date
      );

alter table "public"."dispositivo" enable row level security;

  create table "public"."ejecucion_actividad" (
    "id" uuid not null default gen_random_uuid(),
    "intervencion_id" uuid not null,
    "actividad_id" uuid not null,
    "completada" boolean default false,
    "created_at" timestamp with time zone default now()
      );

alter table "public"."ejecucion_actividad" enable row level security;

  create table "public"."ejecucion_paso" (
    "id" uuid not null default gen_random_uuid(),
    "intervencion_id" uuid,
    "paso_protocolo_id" uuid,
    "fecha_inicio" timestamp with time zone,
    "fecha_fin" timestamp with time zone,
    "comentarios" text,
    "activo" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."ejecucion_paso" enable row level security;

  create table "public"."historial_traslado" (
    "id" uuid not null default gen_random_uuid(),
    "dispositivo_id" uuid,
    "sucursal_origen_id" uuid,
    "sucursal_destino_id" uuid,
    "fecha_traslado" timestamp with time zone not null,
    "motivo" text,
    "usuario_id" uuid,
    "created_at" timestamp with time zone default now()
      );

alter table "public"."historial_traslado" enable row level security;

  create table "public"."intervencion" (
    "id" uuid not null default gen_random_uuid(),
    "visita_id" uuid,
    "dispositivo_id" uuid,
    "estado_id" uuid,
    "activo" boolean not null default true,
    "codigo_etiqueta" character varying(9),
    "observacion_final" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."intervencion" enable row level security;

  create table "public"."paso_protocolo" (
    "id" uuid not null default gen_random_uuid(),
    "categoria_id" uuid,
    "descripcion" text not null,
    "orden" integer not null,
    "activo" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."paso_protocolo" enable row level security;

  create table "public"."perfil_usuario" (
    "id" uuid not null,
    "telefono" character varying(50),
    "avatar_url" text,
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "rol_id" uuid not null,
    "nombres" character varying,
    "apellidos" character varying,
    "telefono_pais_iso" character(2) default 'CO'::bpchar,
    "tipo_documento" character varying,
    "identificacion" character varying,
    "email" text
      );

alter table "public"."perfil_usuario" enable row level security;

  create table "public"."solicitud_visita" (
    "id" uuid not null default gen_random_uuid(),
    "cliente_id" uuid,
    "sucursal_id" uuid,
    "creado_por" uuid,
    "tipo_visita_id" uuid,
    "fecha_solicitud" timestamp with time zone default now(),
    "fecha_sugerida" timestamp with time zone,
    "motivo" text not null,
    "prioridad" character varying(20) default 'MEDIA',
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

alter table "public"."solicitud_visita" enable row level security;

  -- Junction table: dispositivos solicitados en una solicitud de visita
  create table "public"."solicitud_dispositivo" (
    "id" uuid not null default gen_random_uuid(),
    "solicitud_id" uuid not null,
    "dispositivo_id" uuid not null,
    "activo" boolean not null default true,
    "created_at" timestamp with time zone default now()
      );

alter table "public"."solicitud_dispositivo" enable row level security;

alter table "public"."solicitud_visita" enable row level security;

  create table "public"."sucursal" (
    "id" uuid not null default gen_random_uuid(),
    "cliente_id" uuid,
    "es_principal" boolean default false,
    "nombre" character varying(255) not null,
    "direccion" character varying(255),
    "ciudad" character varying(100),
    "estado_depto" character varying(100),
    "pais" character varying(100),
    "clasificacion" character varying(100),
    "horarios_atencion" jsonb,
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "latitud" numeric(10,7),
    "longitud" numeric(10,7)
      );

alter table "public"."sucursal" enable row level security;

  create table "public"."tecnico" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid,
    "documento_cedula_url" text,
    "planilla_seg_social_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "activo" boolean not null default true
      );

alter table "public"."tecnico" enable row level security;

  create table "public"."tecnico_certificado" (
    "id" uuid not null default gen_random_uuid(),
    "tecnico_id" uuid not null,
    "nombre" character varying not null,
    "url" text,
    "created_at" timestamp with time zone default now(),
    "activo" boolean not null default true
      );

alter table "public"."tecnico_certificado" enable row level security;

  create table "public"."visita" (
    "id" uuid not null default gen_random_uuid(),
    "solicitud_id" uuid,
    "contrato_id" uuid,                          -- FK a contrato; sólo en visitas preventivas generadas por contrato
    "coordinador_usuario_id" uuid,
    "cliente_id" uuid,
    "sucursal_id" uuid,
    "tipo_visita_id" uuid,
    "fecha_programada" timestamp with time zone,
    "fecha_inicio" timestamp with time zone,
    "fecha_fin" timestamp with time zone,
    "observaciones" text,
    "estado_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );
-- Columna agregada vía: ALTER TABLE visita ADD COLUMN contrato_id uuid REFERENCES contrato(id);

alter table "public"."visita" enable row level security;

  create table "public"."visita_tecnico" (
    "id" uuid not null default gen_random_uuid(),
    "visita_id" uuid,
    "tecnico_id" uuid,
    "es_lider" boolean default false,
    "created_at" timestamp with time zone default now()
      );

alter table "public"."visita_tecnico" enable row level security;

CREATE UNIQUE INDEX actividad_protocolo_pkey ON public.actividad_protocolo USING btree (id);

CREATE UNIQUE INDEX administrador_pkey ON public.administrador USING btree (id);

CREATE UNIQUE INDEX administrador_usuario_id_key ON public.administrador USING btree (usuario_id);

CREATE UNIQUE INDEX catalogo_estado_general_codigo_key ON public.catalogo_estado_general USING btree (codigo);

CREATE UNIQUE INDEX catalogo_estado_general_pkey ON public.catalogo_estado_general USING btree (id);

CREATE UNIQUE INDEX catalogo_pkey ON public.catalogo USING btree (id);

CREATE UNIQUE INDEX catalogo_rol_codigo_key ON public.catalogo_rol USING btree (codigo);

CREATE UNIQUE INDEX catalogo_rol_pkey ON public.catalogo_rol USING btree (id);

CREATE UNIQUE INDEX catalogo_tipo_codigo_key ON public.catalogo USING btree (tipo, codigo);

CREATE UNIQUE INDEX catalogo_tipo_codigo_unique ON public.catalogo USING btree (tipo, codigo);

CREATE UNIQUE INDEX categoria_dispositivo_nombre_marca_modelo_key ON public.categoria_dispositivo USING btree (nombre, marca, modelo);

CREATE UNIQUE INDEX categoria_dispositivo_pkey ON public.categoria_dispositivo USING btree (id);

CREATE UNIQUE INDEX cliente_pkey ON public.cliente USING btree (id);

CREATE UNIQUE INDEX cliente_documento_pkey ON public.cliente_documento USING btree (id);

CREATE UNIQUE INDEX contacto_pkey ON public.contacto USING btree (id);

CREATE UNIQUE INDEX contacto_sucursal_contacto_id_sucursal_id_key ON public.contacto_sucursal USING btree (contacto_id, sucursal_id);

CREATE UNIQUE INDEX contacto_sucursal_pkey ON public.contacto_sucursal USING btree (id);

CREATE UNIQUE INDEX contrato_pkey ON public.contrato USING btree (id);

CREATE UNIQUE INDEX coordinador_pkey ON public.coordinador USING btree (id);

CREATE UNIQUE INDEX director_pkey ON public.director USING btree (id);

CREATE UNIQUE INDEX disponibilidad_tecnico_pkey ON public.disponibilidad_tecnico USING btree (id);

CREATE UNIQUE INDEX dispositivo_codigo_unico_key ON public.dispositivo USING btree (codigo_unico);

CREATE UNIQUE INDEX dispositivo_id_inmotika_key ON public.dispositivo USING btree (id_inmotika);

CREATE UNIQUE INDEX dispositivo_pkey ON public.dispositivo USING btree (id);

CREATE UNIQUE INDEX ejecucion_actividad_pkey ON public.ejecucion_actividad USING btree (id);

CREATE UNIQUE INDEX ejecucion_actividad_unique ON public.ejecucion_actividad USING btree (intervencion_id, actividad_id);

CREATE UNIQUE INDEX ejecucion_paso_pkey ON public.ejecucion_paso USING btree (id);

CREATE UNIQUE INDEX historial_traslado_pkey ON public.historial_traslado USING btree (id);

CREATE INDEX idx_actividad_protocolo_paso_id ON public.actividad_protocolo USING btree (paso_id);

CREATE INDEX idx_ejecucion_actividad_intervencion ON public.ejecucion_actividad USING btree (intervencion_id);

CREATE UNIQUE INDEX intervencion_pkey ON public.intervencion USING btree (id);

CREATE UNIQUE INDEX paso_protocolo_categoria_id_orden_key ON public.paso_protocolo USING btree (categoria_id, orden);

CREATE UNIQUE INDEX paso_protocolo_pkey ON public.paso_protocolo USING btree (id);

CREATE UNIQUE INDEX perfil_usuario_pkey ON public.perfil_usuario USING btree (id);

CREATE UNIQUE INDEX solicitud_visita_pkey ON public.solicitud_visita USING btree (id);

CREATE UNIQUE INDEX solicitud_dispositivo_pkey ON public.solicitud_dispositivo USING btree (id);

CREATE UNIQUE INDEX solicitud_dispositivo_unique ON public.solicitud_dispositivo USING btree (solicitud_id, dispositivo_id);

CREATE UNIQUE INDEX sucursal_pkey ON public.sucursal USING btree (id);

CREATE UNIQUE INDEX tecnico_certificado_pkey ON public.tecnico_certificado USING btree (id);

CREATE UNIQUE INDEX tecnico_pkey ON public.tecnico USING btree (id);

CREATE UNIQUE INDEX unique_usuario_contacto ON public.contacto USING btree (usuario_id);

CREATE UNIQUE INDEX visita_pkey ON public.visita USING btree (id);

CREATE UNIQUE INDEX visita_tecnico_pkey ON public.visita_tecnico USING btree (id);

CREATE UNIQUE INDEX visita_tecnico_visita_id_tecnico_id_key ON public.visita_tecnico USING btree (visita_id, tecnico_id);

alter table "public"."actividad_protocolo" add constraint "actividad_protocolo_pkey" PRIMARY KEY using index "actividad_protocolo_pkey";

alter table "public"."administrador" add constraint "administrador_pkey" PRIMARY KEY using index "administrador_pkey";

alter table "public"."catalogo" add constraint "catalogo_pkey" PRIMARY KEY using index "catalogo_pkey";

alter table "public"."catalogo_estado_general" add constraint "catalogo_estado_general_pkey" PRIMARY KEY using index "catalogo_estado_general_pkey";

alter table "public"."catalogo_rol" add constraint "catalogo_rol_pkey" PRIMARY KEY using index "catalogo_rol_pkey";

alter table "public"."categoria_dispositivo" add constraint "categoria_dispositivo_pkey" PRIMARY KEY using index "categoria_dispositivo_pkey";

alter table "public"."cliente" add constraint "cliente_pkey" PRIMARY KEY using index "cliente_pkey";

alter table "public"."contacto" add constraint "contacto_pkey" PRIMARY KEY using index "contacto_pkey";

alter table "public"."contacto_sucursal" add constraint "contacto_sucursal_pkey" PRIMARY KEY using index "contacto_sucursal_pkey";

alter table "public"."contrato" add constraint "contrato_pkey" PRIMARY KEY using index "contrato_pkey";

alter table "public"."coordinador" add constraint "coordinador_pkey" PRIMARY KEY using index "coordinador_pkey";

alter table "public"."director" add constraint "director_pkey" PRIMARY KEY using index "director_pkey";

alter table "public"."disponibilidad_tecnico" add constraint "disponibilidad_tecnico_pkey" PRIMARY KEY using index "disponibilidad_tecnico_pkey";

alter table "public"."dispositivo" add constraint "dispositivo_pkey" PRIMARY KEY using index "dispositivo_pkey";

alter table "public"."ejecucion_actividad" add constraint "ejecucion_actividad_pkey" PRIMARY KEY using index "ejecucion_actividad_pkey";

alter table "public"."ejecucion_paso" add constraint "ejecucion_paso_pkey" PRIMARY KEY using index "ejecucion_paso_pkey";

alter table "public"."historial_traslado" add constraint "historial_traslado_pkey" PRIMARY KEY using index "historial_traslado_pkey";

alter table "public"."intervencion" add constraint "intervencion_pkey" PRIMARY KEY using index "intervencion_pkey";

alter table "public"."paso_protocolo" add constraint "paso_protocolo_pkey" PRIMARY KEY using index "paso_protocolo_pkey";

alter table "public"."perfil_usuario" add constraint "perfil_usuario_pkey" PRIMARY KEY using index "perfil_usuario_pkey";

alter table "public"."solicitud_visita" add constraint "solicitud_visita_pkey" PRIMARY KEY using index "solicitud_visita_pkey";

alter table "public"."solicitud_dispositivo" add constraint "solicitud_dispositivo_pkey" PRIMARY KEY using index "solicitud_dispositivo_pkey";

alter table "public"."sucursal" add constraint "sucursal_pkey" PRIMARY KEY using index "sucursal_pkey";

alter table "public"."tecnico" add constraint "tecnico_pkey" PRIMARY KEY using index "tecnico_pkey";

alter table "public"."tecnico_certificado" add constraint "tecnico_certificado_pkey" PRIMARY KEY using index "tecnico_certificado_pkey";

alter table "public"."visita" add constraint "visita_pkey" PRIMARY KEY using index "visita_pkey";

alter table "public"."visita_tecnico" add constraint "visita_tecnico_pkey" PRIMARY KEY using index "visita_tecnico_pkey";

alter table "public"."actividad_protocolo" add constraint "actividad_protocolo_paso_id_fkey" FOREIGN KEY (paso_id) REFERENCES public.paso_protocolo(id) ON DELETE CASCADE not valid;

alter table "public"."actividad_protocolo" validate constraint "actividad_protocolo_paso_id_fkey";

alter table "public"."administrador" add constraint "administrador_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id) not valid;

alter table "public"."administrador" validate constraint "administrador_usuario_id_fkey";

alter table "public"."administrador" add constraint "administrador_usuario_id_key" UNIQUE using index "administrador_usuario_id_key";

alter table "public"."catalogo" add constraint "catalogo_tipo_codigo_key" UNIQUE using index "catalogo_tipo_codigo_key";

alter table "public"."catalogo" add constraint "catalogo_tipo_codigo_unique" UNIQUE using index "catalogo_tipo_codigo_unique";

alter table "public"."catalogo_estado_general" add constraint "catalogo_estado_general_codigo_key" UNIQUE using index "catalogo_estado_general_codigo_key";

alter table "public"."catalogo_rol" add constraint "catalogo_rol_codigo_key" UNIQUE using index "catalogo_rol_codigo_key";

alter table "public"."categoria_dispositivo" add constraint "categoria_dispositivo_nombre_marca_modelo_key" UNIQUE using index "categoria_dispositivo_nombre_marca_modelo_key";

alter table "public"."cliente" add constraint "cliente_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id) not valid;

alter table "public"."cliente" validate constraint "cliente_estado_id_fkey";

alter table "public"."cliente" add constraint "cliente_tipo_persona_id_fkey" FOREIGN KEY (tipo_persona_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."cliente" validate constraint "cliente_tipo_persona_id_fkey";

alter table "public"."cliente_documento" add constraint "cliente_documento_pkey" PRIMARY KEY using index "cliente_documento_pkey";

alter table "public"."cliente_documento" add constraint "cliente_documento_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE CASCADE not valid;

alter table "public"."cliente_documento" validate constraint "cliente_documento_cliente_id_fkey";

alter table "public"."contacto" add constraint "contacto_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."contacto" validate constraint "contacto_cargo_id_fkey";

alter table "public"."contacto" add constraint "contacto_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE CASCADE not valid;

alter table "public"."contacto" validate constraint "contacto_cliente_id_fkey";

alter table "public"."contacto" add constraint "contacto_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id) not valid;

alter table "public"."contacto" validate constraint "contacto_estado_id_fkey";

alter table "public"."contacto" add constraint "contacto_genero_id_fkey" FOREIGN KEY (genero_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."contacto" validate constraint "contacto_genero_id_fkey";

alter table "public"."contacto" add constraint "contacto_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id) ON DELETE SET NULL not valid;

alter table "public"."contacto" validate constraint "contacto_usuario_id_fkey";

alter table "public"."contacto" add constraint "unique_usuario_contacto" UNIQUE using index "unique_usuario_contacto";

alter table "public"."contacto_sucursal" add constraint "contacto_sucursal_contacto_id_fkey" FOREIGN KEY (contacto_id) REFERENCES public.contacto(id) ON DELETE CASCADE not valid;

alter table "public"."contacto_sucursal" validate constraint "contacto_sucursal_contacto_id_fkey";

alter table "public"."contacto_sucursal" add constraint "contacto_sucursal_contacto_id_sucursal_id_key" UNIQUE using index "contacto_sucursal_contacto_id_sucursal_id_key";

alter table "public"."contacto_sucursal" add constraint "contacto_sucursal_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id) ON DELETE CASCADE not valid;

alter table "public"."contacto_sucursal" validate constraint "contacto_sucursal_sucursal_id_fkey";

alter table "public"."contrato" add constraint "contrato_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) not valid;

alter table "public"."contrato" validate constraint "contrato_cliente_id_fkey";

alter table "public"."contrato" add constraint "contrato_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id) not valid;

alter table "public"."contrato" validate constraint "contrato_estado_id_fkey";

alter table "public"."contrato" add constraint "contrato_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id) ON DELETE CASCADE not valid;

alter table "public"."contrato" validate constraint "contrato_sucursal_id_fkey";

alter table "public"."coordinador" add constraint "coordinador_director_id_fkey" FOREIGN KEY (director_id) REFERENCES public.director(id) not valid;

alter table "public"."coordinador" validate constraint "coordinador_director_id_fkey";

alter table "public"."coordinador" add constraint "coordinador_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id) ON DELETE CASCADE not valid;

alter table "public"."coordinador" validate constraint "coordinador_usuario_id_fkey";

alter table "public"."director" add constraint "director_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id) ON DELETE CASCADE not valid;

alter table "public"."director" validate constraint "director_usuario_id_fkey";

alter table "public"."disponibilidad_tecnico" add constraint "disponibilidad_tecnico_tecnico_id_fkey" FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id) ON DELETE CASCADE not valid;

alter table "public"."disponibilidad_tecnico" validate constraint "disponibilidad_tecnico_tecnico_id_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES public.categoria_dispositivo(id) not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_categoria_id_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_cliente_id_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_codigo_unico_key" UNIQUE using index "dispositivo_codigo_unico_key";

alter table "public"."dispositivo" add constraint "dispositivo_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id) not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_estado_id_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_id_inmotika_key" UNIQUE using index "dispositivo_id_inmotika_key";

alter table "public"."dispositivo" add constraint "dispositivo_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id) ON DELETE SET NULL not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_sucursal_id_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_estado_gestion_fkey" FOREIGN KEY (estado_gestion_id) REFERENCES public.catalogo_estado_dispositivo(id) not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_estado_gestion_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_proveedor_id_fkey" FOREIGN KEY (proveedor_id) REFERENCES public.proveedor(id) not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_proveedor_id_fkey";

alter table "public"."dispositivo" add constraint "dispositivo_marca_id_fkey" FOREIGN KEY (marca_id) REFERENCES public.marca(id) not valid;

alter table "public"."dispositivo" validate constraint "dispositivo_marca_id_fkey";

alter table "public"."marca" add constraint "marca_proveedor_id_fkey" FOREIGN KEY (proveedor_id) REFERENCES public.proveedor(id) ON DELETE CASCADE not valid;

alter table "public"."marca" validate constraint "marca_proveedor_id_fkey";

alter table "public"."ejecucion_actividad" add constraint "ejecucion_actividad_actividad_id_fkey" FOREIGN KEY (actividad_id) REFERENCES public.actividad_protocolo(id) ON DELETE CASCADE not valid;

alter table "public"."ejecucion_actividad" validate constraint "ejecucion_actividad_actividad_id_fkey";

alter table "public"."ejecucion_actividad" add constraint "ejecucion_actividad_intervencion_id_fkey" FOREIGN KEY (intervencion_id) REFERENCES public.intervencion(id) ON DELETE CASCADE not valid;

alter table "public"."ejecucion_actividad" validate constraint "ejecucion_actividad_intervencion_id_fkey";

alter table "public"."ejecucion_actividad" add constraint "ejecucion_actividad_unique" UNIQUE using index "ejecucion_actividad_unique";

alter table "public"."ejecucion_paso" add constraint "ejecucion_paso_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."ejecucion_paso" validate constraint "ejecucion_paso_estado_id_fkey";

alter table "public"."ejecucion_paso" add constraint "ejecucion_paso_intervencion_id_fkey" FOREIGN KEY (intervencion_id) REFERENCES public.intervencion(id) ON DELETE CASCADE not valid;

alter table "public"."ejecucion_paso" validate constraint "ejecucion_paso_intervencion_id_fkey";

alter table "public"."ejecucion_paso" add constraint "ejecucion_paso_paso_protocolo_id_fkey" FOREIGN KEY (paso_protocolo_id) REFERENCES public.paso_protocolo(id) not valid;

alter table "public"."ejecucion_paso" validate constraint "ejecucion_paso_paso_protocolo_id_fkey";

alter table "public"."historial_traslado" add constraint "historial_traslado_dispositivo_id_fkey" FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivo(id) ON DELETE CASCADE not valid;

alter table "public"."historial_traslado" validate constraint "historial_traslado_dispositivo_id_fkey";

alter table "public"."historial_traslado" add constraint "historial_traslado_sucursal_destino_id_fkey" FOREIGN KEY (sucursal_destino_id) REFERENCES public.sucursal(id) not valid;

alter table "public"."historial_traslado" validate constraint "historial_traslado_sucursal_destino_id_fkey";

alter table "public"."historial_traslado" add constraint "historial_traslado_sucursal_origen_id_fkey" FOREIGN KEY (sucursal_origen_id) REFERENCES public.sucursal(id) not valid;

alter table "public"."historial_traslado" validate constraint "historial_traslado_sucursal_origen_id_fkey";

alter table "public"."historial_traslado" add constraint "historial_traslado_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id) not valid;

alter table "public"."historial_traslado" validate constraint "historial_traslado_usuario_id_fkey";

alter table "public"."intervencion" add constraint "intervencion_dispositivo_id_fkey" FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivo(id) not valid;

alter table "public"."intervencion" validate constraint "intervencion_dispositivo_id_fkey";

alter table "public"."intervencion" add constraint "intervencion_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."intervencion" validate constraint "intervencion_estado_id_fkey";

alter table "public"."intervencion" add constraint "intervencion_visita_id_fkey" FOREIGN KEY (visita_id) REFERENCES public.visita(id) ON DELETE CASCADE not valid;

alter table "public"."intervencion" validate constraint "intervencion_visita_id_fkey";

alter table "public"."paso_protocolo" add constraint "paso_protocolo_categoria_id_fkey" FOREIGN KEY (categoria_id) REFERENCES public.categoria_dispositivo(id) ON DELETE CASCADE not valid;

alter table "public"."paso_protocolo" validate constraint "paso_protocolo_categoria_id_fkey";

alter table "public"."paso_protocolo" add constraint "paso_protocolo_categoria_id_orden_key" UNIQUE using index "paso_protocolo_categoria_id_orden_key";

alter table "public"."perfil_usuario" add constraint "perfil_usuario_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id) not valid;

alter table "public"."perfil_usuario" validate constraint "perfil_usuario_estado_id_fkey";

alter table "public"."perfil_usuario" add constraint "perfil_usuario_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."perfil_usuario" validate constraint "perfil_usuario_id_fkey";

alter table "public"."perfil_usuario" add constraint "perfil_usuario_rol_id_fkey" FOREIGN KEY (rol_id) REFERENCES public.catalogo_rol(id) not valid;

alter table "public"."perfil_usuario" validate constraint "perfil_usuario_rol_id_fkey";

alter table "public"."solicitud_visita" add constraint "solicitud_visita_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) not valid;

alter table "public"."solicitud_visita" validate constraint "solicitud_visita_cliente_id_fkey";

alter table "public"."solicitud_visita" add constraint "solicitud_visita_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.perfil_usuario(id) not valid;

alter table "public"."solicitud_visita" validate constraint "solicitud_visita_creado_por_fkey";

alter table "public"."solicitud_visita" add constraint "solicitud_visita_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."solicitud_visita" validate constraint "solicitud_visita_estado_id_fkey";

alter table "public"."solicitud_visita" add constraint "solicitud_visita_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id) not valid;

alter table "public"."solicitud_visita" validate constraint "solicitud_visita_sucursal_id_fkey";

alter table "public"."solicitud_visita" add constraint "solicitud_visita_tipo_visita_id_fkey" FOREIGN KEY (tipo_visita_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."solicitud_visita" validate constraint "solicitud_visita_tipo_visita_id_fkey";

alter table "public"."solicitud_dispositivo" add constraint "solicitud_dispositivo_solicitud_id_fkey" FOREIGN KEY (solicitud_id) REFERENCES public.solicitud_visita(id) ON DELETE CASCADE not valid;

alter table "public"."solicitud_dispositivo" validate constraint "solicitud_dispositivo_solicitud_id_fkey";

alter table "public"."solicitud_dispositivo" add constraint "solicitud_dispositivo_dispositivo_id_fkey" FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivo(id) not valid;

alter table "public"."solicitud_dispositivo" validate constraint "solicitud_dispositivo_dispositivo_id_fkey";

alter table "public"."sucursal" add constraint "sucursal_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE CASCADE not valid;

alter table "public"."sucursal" validate constraint "sucursal_cliente_id_fkey";

alter table "public"."sucursal" add constraint "sucursal_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo_estado_general(id) not valid;

alter table "public"."sucursal" validate constraint "sucursal_estado_id_fkey";

alter table "public"."tecnico" add constraint "tecnico_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.perfil_usuario(id) ON DELETE CASCADE not valid;

alter table "public"."tecnico" validate constraint "tecnico_usuario_id_fkey";

alter table "public"."tecnico_certificado" add constraint "tecnico_certificado_tecnico_id_fkey" FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id) ON DELETE CASCADE not valid;

alter table "public"."tecnico_certificado" validate constraint "tecnico_certificado_tecnico_id_fkey";

alter table "public"."visita" add constraint "visita_cliente_id_fkey" FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) not valid;

alter table "public"."visita" validate constraint "visita_cliente_id_fkey";

alter table "public"."visita" add constraint "visita_coordinador_usuario_id_fkey" FOREIGN KEY (coordinador_usuario_id) REFERENCES public.perfil_usuario(id) not valid;

alter table "public"."visita" validate constraint "visita_coordinador_usuario_id_fkey";

alter table "public"."visita" add constraint "visita_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."visita" validate constraint "visita_estado_id_fkey";

alter table "public"."visita" add constraint "visita_solicitud_id_fkey" FOREIGN KEY (solicitud_id) REFERENCES public.solicitud_visita(id) ON DELETE CASCADE not valid;

alter table "public"."visita" validate constraint "visita_solicitud_id_fkey";

alter table "public"."visita" add constraint "visita_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id) not valid;

alter table "public"."visita" validate constraint "visita_sucursal_id_fkey";

alter table "public"."visita" add constraint "visita_tipo_visita_id_fkey" FOREIGN KEY (tipo_visita_id) REFERENCES public.catalogo(id) not valid;

alter table "public"."visita" validate constraint "visita_tipo_visita_id_fkey";

alter table "public"."visita_tecnico" add constraint "visita_tecnico_tecnico_id_fkey" FOREIGN KEY (tecnico_id) REFERENCES public.tecnico(id) ON DELETE CASCADE not valid;

alter table "public"."visita_tecnico" validate constraint "visita_tecnico_tecnico_id_fkey";

alter table "public"."visita_tecnico" add constraint "visita_tecnico_visita_id_fkey" FOREIGN KEY (visita_id) REFERENCES public.visita(id) ON DELETE CASCADE not valid;

alter table "public"."visita_tecnico" validate constraint "visita_tecnico_visita_id_fkey";

alter table "public"."visita_tecnico" add constraint "visita_tecnico_visita_id_tecnico_id_key" UNIQUE using index "visita_tecnico_visita_id_tecnico_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    target_role_id  UUID;
    role_code_meta  TEXT;
    default_estado  UUID;
    contacto_row    RECORD;
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

    -- 4. Si es CLIENTE, buscar contacto existente por email para copiar sus datos
    IF role_code_meta = 'CLIENTE' THEN
        SELECT * INTO contacto_row
        FROM public.contacto
        WHERE LOWER(email) = LOWER(NEW.email)
          AND usuario_id IS NULL
        LIMIT 1;
    END IF;

    -- 5. Crear perfil_usuario (con datos del contacto si existe)
    INSERT INTO public.perfil_usuario (
        id, rol_id, nombres, apellidos, email,
        telefono, telefono_pais_iso, tipo_documento, identificacion,
        estado_id
    )
    VALUES (
        NEW.id,
        target_role_id,
        COALESCE(NEW.raw_user_meta_data->>'nombres', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
        NEW.email,
        contacto_row.telefono_movil,
        COALESCE(contacto_row.telefono_movil_pais_iso, 'CO'),
        contacto_row.tipo_documento,
        contacto_row.identificacion,
        default_estado
    )
    ON CONFLICT (id) DO NOTHING;

    -- 6. Si es CLIENTE y se encontró contacto, vincular contacto.usuario_id
    IF role_code_meta = 'CLIENTE' AND contacto_row.id IS NOT NULL THEN
        UPDATE public.contacto
        SET usuario_id = NEW.id, updated_at = now()
        WHERE id = contacto_row.id;
    END IF;

    -- 7. Crear la fila en la tabla especializada según el rol
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
            NULL; -- CLIENTE no tiene tabla especializada
    END CASE;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM perfil_usuario p
    JOIN catalogo_rol r ON p.rol_id = r.id
    WHERE p.id = auth.uid() 
    AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_active()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfil_usuario p
    JOIN public.catalogo_estado_general e ON p.estado_id = e.id
    WHERE p.id = auth.uid()
    AND e.activo = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_management_staff()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfil_usuario p
    JOIN public.catalogo_rol r ON p.rol_id = r.id
    WHERE p.id = auth.uid() 
    AND r.codigo IN ('ADMIN', 'DIRECTOR', 'COORDINADOR')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_assigned_director(check_cliente_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.cliente_director
    WHERE cliente_id = check_cliente_id
    AND director_id = auth.uid()
    AND activo = true
  );
END;
$function$
;

-- Verifica si el usuario autenticado es un técnico asignado a una visita específica
CREATE OR REPLACE FUNCTION public.is_tecnico_asignado_visita(check_visita_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.visita_tecnico vt
    JOIN public.tecnico t ON t.id = vt.tecnico_id
    WHERE vt.visita_id = check_visita_id
    AND t.usuario_id = auth.uid()
  );
END;
$function$
;

-- Obtiene el tecnico_id del usuario autenticado (NULL si no es técnico)
CREATE OR REPLACE FUNCTION public.get_current_tecnico_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result uuid;
BEGIN
  SELECT id INTO result FROM public.tecnico
  WHERE usuario_id = auth.uid() AND activo = true
  LIMIT 1;
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_specialized_role_tables()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

grant delete on table "public"."actividad_protocolo" to "anon";

grant insert on table "public"."actividad_protocolo" to "anon";

grant references on table "public"."actividad_protocolo" to "anon";

grant select on table "public"."actividad_protocolo" to "anon";

grant trigger on table "public"."actividad_protocolo" to "anon";

grant truncate on table "public"."actividad_protocolo" to "anon";

grant update on table "public"."actividad_protocolo" to "anon";

grant delete on table "public"."actividad_protocolo" to "authenticated";

grant insert on table "public"."actividad_protocolo" to "authenticated";

grant references on table "public"."actividad_protocolo" to "authenticated";

grant select on table "public"."actividad_protocolo" to "authenticated";

grant trigger on table "public"."actividad_protocolo" to "authenticated";

grant truncate on table "public"."actividad_protocolo" to "authenticated";

grant update on table "public"."actividad_protocolo" to "authenticated";

grant delete on table "public"."actividad_protocolo" to "service_role";

grant insert on table "public"."actividad_protocolo" to "service_role";

grant references on table "public"."actividad_protocolo" to "service_role";

grant select on table "public"."actividad_protocolo" to "service_role";

grant trigger on table "public"."actividad_protocolo" to "service_role";

grant truncate on table "public"."actividad_protocolo" to "service_role";

grant update on table "public"."actividad_protocolo" to "service_role";

grant delete on table "public"."administrador" to "anon";

grant insert on table "public"."administrador" to "anon";

grant references on table "public"."administrador" to "anon";

grant select on table "public"."administrador" to "anon";

grant trigger on table "public"."administrador" to "anon";

grant truncate on table "public"."administrador" to "anon";

grant update on table "public"."administrador" to "anon";

grant delete on table "public"."administrador" to "authenticated";

grant insert on table "public"."administrador" to "authenticated";

grant references on table "public"."administrador" to "authenticated";

grant select on table "public"."administrador" to "authenticated";

grant trigger on table "public"."administrador" to "authenticated";

grant truncate on table "public"."administrador" to "authenticated";

grant update on table "public"."administrador" to "authenticated";

grant delete on table "public"."administrador" to "service_role";

grant insert on table "public"."administrador" to "service_role";

grant references on table "public"."administrador" to "service_role";

grant select on table "public"."administrador" to "service_role";

grant trigger on table "public"."administrador" to "service_role";

grant truncate on table "public"."administrador" to "service_role";

grant update on table "public"."administrador" to "service_role";

grant delete on table "public"."catalogo" to "anon";

grant insert on table "public"."catalogo" to "anon";

grant references on table "public"."catalogo" to "anon";

grant select on table "public"."catalogo" to "anon";

grant trigger on table "public"."catalogo" to "anon";

grant truncate on table "public"."catalogo" to "anon";

grant update on table "public"."catalogo" to "anon";

grant delete on table "public"."catalogo" to "authenticated";

grant insert on table "public"."catalogo" to "authenticated";

grant references on table "public"."catalogo" to "authenticated";

grant select on table "public"."catalogo" to "authenticated";

grant trigger on table "public"."catalogo" to "authenticated";

grant truncate on table "public"."catalogo" to "authenticated";

grant update on table "public"."catalogo" to "authenticated";

grant delete on table "public"."catalogo" to "service_role";

grant insert on table "public"."catalogo" to "service_role";

grant references on table "public"."catalogo" to "service_role";

grant select on table "public"."catalogo" to "service_role";

grant trigger on table "public"."catalogo" to "service_role";

grant truncate on table "public"."catalogo" to "service_role";

grant update on table "public"."catalogo" to "service_role";

grant delete on table "public"."catalogo_estado_general" to "anon";

grant insert on table "public"."catalogo_estado_general" to "anon";

grant references on table "public"."catalogo_estado_general" to "anon";

grant select on table "public"."catalogo_estado_general" to "anon";

grant trigger on table "public"."catalogo_estado_general" to "anon";

grant truncate on table "public"."catalogo_estado_general" to "anon";

grant update on table "public"."catalogo_estado_general" to "anon";

grant delete on table "public"."catalogo_estado_general" to "authenticated";

grant insert on table "public"."catalogo_estado_general" to "authenticated";

grant references on table "public"."catalogo_estado_general" to "authenticated";

grant select on table "public"."catalogo_estado_general" to "authenticated";

grant trigger on table "public"."catalogo_estado_general" to "authenticated";

grant truncate on table "public"."catalogo_estado_general" to "authenticated";

grant update on table "public"."catalogo_estado_general" to "authenticated";

grant delete on table "public"."catalogo_estado_general" to "service_role";

grant insert on table "public"."catalogo_estado_general" to "service_role";

grant references on table "public"."catalogo_estado_general" to "service_role";

grant select on table "public"."catalogo_estado_general" to "service_role";

grant trigger on table "public"."catalogo_estado_general" to "service_role";

grant truncate on table "public"."catalogo_estado_general" to "service_role";

grant update on table "public"."catalogo_estado_general" to "service_role";

grant delete on table "public"."catalogo_rol" to "anon";

grant insert on table "public"."catalogo_rol" to "anon";

grant references on table "public"."catalogo_rol" to "anon";

grant select on table "public"."catalogo_rol" to "anon";

grant trigger on table "public"."catalogo_rol" to "anon";

grant truncate on table "public"."catalogo_rol" to "anon";

grant update on table "public"."catalogo_rol" to "anon";

grant delete on table "public"."catalogo_rol" to "authenticated";

grant insert on table "public"."catalogo_rol" to "authenticated";

grant references on table "public"."catalogo_rol" to "authenticated";

grant select on table "public"."catalogo_rol" to "authenticated";

grant trigger on table "public"."catalogo_rol" to "authenticated";

grant truncate on table "public"."catalogo_rol" to "authenticated";

grant update on table "public"."catalogo_rol" to "authenticated";

grant delete on table "public"."catalogo_rol" to "service_role";

grant insert on table "public"."catalogo_rol" to "service_role";

grant references on table "public"."catalogo_rol" to "service_role";

grant select on table "public"."catalogo_rol" to "service_role";

grant trigger on table "public"."catalogo_rol" to "service_role";

grant truncate on table "public"."catalogo_rol" to "service_role";

grant update on table "public"."catalogo_rol" to "service_role";

grant delete on table "public"."categoria_dispositivo" to "anon";

grant insert on table "public"."categoria_dispositivo" to "anon";

grant references on table "public"."categoria_dispositivo" to "anon";

grant select on table "public"."categoria_dispositivo" to "anon";

grant trigger on table "public"."categoria_dispositivo" to "anon";

grant truncate on table "public"."categoria_dispositivo" to "anon";

grant update on table "public"."categoria_dispositivo" to "anon";

grant delete on table "public"."categoria_dispositivo" to "authenticated";

grant insert on table "public"."categoria_dispositivo" to "authenticated";

grant references on table "public"."categoria_dispositivo" to "authenticated";

grant select on table "public"."categoria_dispositivo" to "authenticated";

grant trigger on table "public"."categoria_dispositivo" to "authenticated";

grant truncate on table "public"."categoria_dispositivo" to "authenticated";

grant update on table "public"."categoria_dispositivo" to "authenticated";

grant delete on table "public"."categoria_dispositivo" to "service_role";

grant insert on table "public"."categoria_dispositivo" to "service_role";

grant references on table "public"."categoria_dispositivo" to "service_role";

grant select on table "public"."categoria_dispositivo" to "service_role";

grant trigger on table "public"."categoria_dispositivo" to "service_role";

grant truncate on table "public"."categoria_dispositivo" to "service_role";

grant update on table "public"."categoria_dispositivo" to "service_role";

grant delete on table "public"."cliente" to "anon";

grant insert on table "public"."cliente" to "anon";

grant references on table "public"."cliente" to "anon";

grant select on table "public"."cliente" to "anon";

grant trigger on table "public"."cliente" to "anon";

grant truncate on table "public"."cliente" to "anon";

grant update on table "public"."cliente" to "anon";

grant delete on table "public"."cliente" to "authenticated";

grant insert on table "public"."cliente" to "authenticated";

grant references on table "public"."cliente" to "authenticated";

grant select on table "public"."cliente" to "authenticated";

grant trigger on table "public"."cliente" to "authenticated";

grant truncate on table "public"."cliente" to "authenticated";

grant update on table "public"."cliente" to "authenticated";

grant delete on table "public"."cliente" to "service_role";

grant insert on table "public"."cliente" to "service_role";

grant references on table "public"."cliente" to "service_role";

grant select on table "public"."cliente" to "service_role";

grant trigger on table "public"."cliente" to "service_role";

grant truncate on table "public"."cliente" to "service_role";

grant update on table "public"."cliente" to "service_role";

grant delete on table "public"."contacto" to "anon";

grant insert on table "public"."contacto" to "anon";

grant references on table "public"."contacto" to "anon";

grant select on table "public"."contacto" to "anon";

grant trigger on table "public"."contacto" to "anon";

grant truncate on table "public"."contacto" to "anon";

grant update on table "public"."contacto" to "anon";

grant delete on table "public"."contacto" to "authenticated";

grant insert on table "public"."contacto" to "authenticated";

grant references on table "public"."contacto" to "authenticated";

grant select on table "public"."contacto" to "authenticated";

grant trigger on table "public"."contacto" to "authenticated";

grant truncate on table "public"."contacto" to "authenticated";

grant update on table "public"."contacto" to "authenticated";

grant delete on table "public"."contacto" to "service_role";

grant insert on table "public"."contacto" to "service_role";

grant references on table "public"."contacto" to "service_role";

grant select on table "public"."contacto" to "service_role";

grant trigger on table "public"."contacto" to "service_role";

grant truncate on table "public"."contacto" to "service_role";

grant update on table "public"."contacto" to "service_role";

grant delete on table "public"."contacto_sucursal" to "anon";

grant insert on table "public"."contacto_sucursal" to "anon";

grant references on table "public"."contacto_sucursal" to "anon";

grant select on table "public"."contacto_sucursal" to "anon";

grant trigger on table "public"."contacto_sucursal" to "anon";

grant truncate on table "public"."contacto_sucursal" to "anon";

grant update on table "public"."contacto_sucursal" to "anon";

grant delete on table "public"."contacto_sucursal" to "authenticated";

grant insert on table "public"."contacto_sucursal" to "authenticated";

grant references on table "public"."contacto_sucursal" to "authenticated";

grant select on table "public"."contacto_sucursal" to "authenticated";

grant trigger on table "public"."contacto_sucursal" to "authenticated";

grant truncate on table "public"."contacto_sucursal" to "authenticated";

grant update on table "public"."contacto_sucursal" to "authenticated";

grant delete on table "public"."contacto_sucursal" to "service_role";

grant insert on table "public"."contacto_sucursal" to "service_role";

grant references on table "public"."contacto_sucursal" to "service_role";

grant select on table "public"."contacto_sucursal" to "service_role";

grant trigger on table "public"."contacto_sucursal" to "service_role";

grant truncate on table "public"."contacto_sucursal" to "service_role";

grant update on table "public"."contacto_sucursal" to "service_role";

grant delete on table "public"."contrato" to "anon";

grant insert on table "public"."contrato" to "anon";

grant references on table "public"."contrato" to "anon";

grant select on table "public"."contrato" to "anon";

grant trigger on table "public"."contrato" to "anon";

grant truncate on table "public"."contrato" to "anon";

grant update on table "public"."contrato" to "anon";

grant delete on table "public"."contrato" to "authenticated";

grant insert on table "public"."contrato" to "authenticated";

grant references on table "public"."contrato" to "authenticated";

grant select on table "public"."contrato" to "authenticated";

grant trigger on table "public"."contrato" to "authenticated";

grant truncate on table "public"."contrato" to "authenticated";

grant update on table "public"."contrato" to "authenticated";

grant delete on table "public"."contrato" to "service_role";

grant insert on table "public"."contrato" to "service_role";

grant references on table "public"."contrato" to "service_role";

grant select on table "public"."contrato" to "service_role";

grant trigger on table "public"."contrato" to "service_role";

grant truncate on table "public"."contrato" to "service_role";

grant update on table "public"."contrato" to "service_role";

grant delete on table "public"."coordinador" to "anon";

grant insert on table "public"."coordinador" to "anon";

grant references on table "public"."coordinador" to "anon";

grant select on table "public"."coordinador" to "anon";

grant trigger on table "public"."coordinador" to "anon";

grant truncate on table "public"."coordinador" to "anon";

grant update on table "public"."coordinador" to "anon";

grant delete on table "public"."coordinador" to "authenticated";

grant insert on table "public"."coordinador" to "authenticated";

grant references on table "public"."coordinador" to "authenticated";

grant select on table "public"."coordinador" to "authenticated";

grant trigger on table "public"."coordinador" to "authenticated";

grant truncate on table "public"."coordinador" to "authenticated";

grant update on table "public"."coordinador" to "authenticated";

grant delete on table "public"."coordinador" to "service_role";

grant insert on table "public"."coordinador" to "service_role";

grant references on table "public"."coordinador" to "service_role";

grant select on table "public"."coordinador" to "service_role";

grant trigger on table "public"."coordinador" to "service_role";

grant truncate on table "public"."coordinador" to "service_role";

grant update on table "public"."coordinador" to "service_role";

grant delete on table "public"."director" to "anon";

grant insert on table "public"."director" to "anon";

grant references on table "public"."director" to "anon";

grant select on table "public"."director" to "anon";

grant trigger on table "public"."director" to "anon";

grant truncate on table "public"."director" to "anon";

grant update on table "public"."director" to "anon";

grant delete on table "public"."director" to "authenticated";

grant insert on table "public"."director" to "authenticated";

grant references on table "public"."director" to "authenticated";

grant select on table "public"."director" to "authenticated";

grant trigger on table "public"."director" to "authenticated";

grant truncate on table "public"."director" to "authenticated";

grant update on table "public"."director" to "authenticated";

grant delete on table "public"."director" to "service_role";

grant insert on table "public"."director" to "service_role";

grant references on table "public"."director" to "service_role";

grant select on table "public"."director" to "service_role";

grant trigger on table "public"."director" to "service_role";

grant truncate on table "public"."director" to "service_role";

grant update on table "public"."director" to "service_role";

grant delete on table "public"."disponibilidad_tecnico" to "anon";

grant insert on table "public"."disponibilidad_tecnico" to "anon";

grant references on table "public"."disponibilidad_tecnico" to "anon";

grant select on table "public"."disponibilidad_tecnico" to "anon";

grant trigger on table "public"."disponibilidad_tecnico" to "anon";

grant truncate on table "public"."disponibilidad_tecnico" to "anon";

grant update on table "public"."disponibilidad_tecnico" to "anon";

grant delete on table "public"."disponibilidad_tecnico" to "authenticated";

grant insert on table "public"."disponibilidad_tecnico" to "authenticated";

grant references on table "public"."disponibilidad_tecnico" to "authenticated";

grant select on table "public"."disponibilidad_tecnico" to "authenticated";

grant trigger on table "public"."disponibilidad_tecnico" to "authenticated";

grant truncate on table "public"."disponibilidad_tecnico" to "authenticated";

grant update on table "public"."disponibilidad_tecnico" to "authenticated";

grant delete on table "public"."disponibilidad_tecnico" to "service_role";

grant insert on table "public"."disponibilidad_tecnico" to "service_role";

grant references on table "public"."disponibilidad_tecnico" to "service_role";

grant select on table "public"."disponibilidad_tecnico" to "service_role";

grant trigger on table "public"."disponibilidad_tecnico" to "service_role";

grant truncate on table "public"."disponibilidad_tecnico" to "service_role";

grant update on table "public"."disponibilidad_tecnico" to "service_role";

grant delete on table "public"."dispositivo" to "anon";

grant insert on table "public"."dispositivo" to "anon";

grant references on table "public"."dispositivo" to "anon";

grant select on table "public"."dispositivo" to "anon";

grant trigger on table "public"."dispositivo" to "anon";

grant truncate on table "public"."dispositivo" to "anon";

grant update on table "public"."dispositivo" to "anon";

grant delete on table "public"."dispositivo" to "authenticated";

grant insert on table "public"."dispositivo" to "authenticated";

grant references on table "public"."dispositivo" to "authenticated";

grant select on table "public"."dispositivo" to "authenticated";

grant trigger on table "public"."dispositivo" to "authenticated";

grant truncate on table "public"."dispositivo" to "authenticated";

grant update on table "public"."dispositivo" to "authenticated";

grant delete on table "public"."dispositivo" to "service_role";

grant insert on table "public"."dispositivo" to "service_role";

grant references on table "public"."dispositivo" to "service_role";

grant select on table "public"."dispositivo" to "service_role";

grant trigger on table "public"."dispositivo" to "service_role";

grant truncate on table "public"."dispositivo" to "service_role";

grant update on table "public"."dispositivo" to "service_role";

grant delete on table "public"."ejecucion_actividad" to "anon";

grant insert on table "public"."ejecucion_actividad" to "anon";

grant references on table "public"."ejecucion_actividad" to "anon";

grant select on table "public"."ejecucion_actividad" to "anon";

grant trigger on table "public"."ejecucion_actividad" to "anon";

grant truncate on table "public"."ejecucion_actividad" to "anon";

grant update on table "public"."ejecucion_actividad" to "anon";

grant delete on table "public"."ejecucion_actividad" to "authenticated";

grant insert on table "public"."ejecucion_actividad" to "authenticated";

grant references on table "public"."ejecucion_actividad" to "authenticated";

grant select on table "public"."ejecucion_actividad" to "authenticated";

grant trigger on table "public"."ejecucion_actividad" to "authenticated";

grant truncate on table "public"."ejecucion_actividad" to "authenticated";

grant update on table "public"."ejecucion_actividad" to "authenticated";

grant delete on table "public"."ejecucion_actividad" to "service_role";

grant insert on table "public"."ejecucion_actividad" to "service_role";

grant references on table "public"."ejecucion_actividad" to "service_role";

grant select on table "public"."ejecucion_actividad" to "service_role";

grant trigger on table "public"."ejecucion_actividad" to "service_role";

grant truncate on table "public"."ejecucion_actividad" to "service_role";

grant update on table "public"."ejecucion_actividad" to "service_role";

grant delete on table "public"."ejecucion_paso" to "anon";

grant insert on table "public"."ejecucion_paso" to "anon";

grant references on table "public"."ejecucion_paso" to "anon";

grant select on table "public"."ejecucion_paso" to "anon";

grant trigger on table "public"."ejecucion_paso" to "anon";

grant truncate on table "public"."ejecucion_paso" to "anon";

grant update on table "public"."ejecucion_paso" to "anon";

grant delete on table "public"."ejecucion_paso" to "authenticated";

grant insert on table "public"."ejecucion_paso" to "authenticated";

grant references on table "public"."ejecucion_paso" to "authenticated";

grant select on table "public"."ejecucion_paso" to "authenticated";

grant trigger on table "public"."ejecucion_paso" to "authenticated";

grant truncate on table "public"."ejecucion_paso" to "authenticated";

grant update on table "public"."ejecucion_paso" to "authenticated";

grant delete on table "public"."ejecucion_paso" to "service_role";

grant insert on table "public"."ejecucion_paso" to "service_role";

grant references on table "public"."ejecucion_paso" to "service_role";

grant select on table "public"."ejecucion_paso" to "service_role";

grant trigger on table "public"."ejecucion_paso" to "service_role";

grant truncate on table "public"."ejecucion_paso" to "service_role";

grant update on table "public"."ejecucion_paso" to "service_role";

grant delete on table "public"."historial_traslado" to "anon";

grant insert on table "public"."historial_traslado" to "anon";

grant references on table "public"."historial_traslado" to "anon";

grant select on table "public"."historial_traslado" to "anon";

grant trigger on table "public"."historial_traslado" to "anon";

grant truncate on table "public"."historial_traslado" to "anon";

grant update on table "public"."historial_traslado" to "anon";

grant delete on table "public"."historial_traslado" to "authenticated";

grant insert on table "public"."historial_traslado" to "authenticated";

grant references on table "public"."historial_traslado" to "authenticated";

grant select on table "public"."historial_traslado" to "authenticated";

grant trigger on table "public"."historial_traslado" to "authenticated";

grant truncate on table "public"."historial_traslado" to "authenticated";

grant update on table "public"."historial_traslado" to "authenticated";

grant delete on table "public"."historial_traslado" to "service_role";

grant insert on table "public"."historial_traslado" to "service_role";

grant references on table "public"."historial_traslado" to "service_role";

grant select on table "public"."historial_traslado" to "service_role";

grant trigger on table "public"."historial_traslado" to "service_role";

grant truncate on table "public"."historial_traslado" to "service_role";

grant update on table "public"."historial_traslado" to "service_role";

grant delete on table "public"."intervencion" to "anon";

grant insert on table "public"."intervencion" to "anon";

grant references on table "public"."intervencion" to "anon";

grant select on table "public"."intervencion" to "anon";

grant trigger on table "public"."intervencion" to "anon";

grant truncate on table "public"."intervencion" to "anon";

grant update on table "public"."intervencion" to "anon";

grant delete on table "public"."intervencion" to "authenticated";

grant insert on table "public"."intervencion" to "authenticated";

grant references on table "public"."intervencion" to "authenticated";

grant select on table "public"."intervencion" to "authenticated";

grant trigger on table "public"."intervencion" to "authenticated";

grant truncate on table "public"."intervencion" to "authenticated";

grant update on table "public"."intervencion" to "authenticated";

grant delete on table "public"."intervencion" to "service_role";

grant insert on table "public"."intervencion" to "service_role";

grant references on table "public"."intervencion" to "service_role";

grant select on table "public"."intervencion" to "service_role";

grant trigger on table "public"."intervencion" to "service_role";

grant truncate on table "public"."intervencion" to "service_role";

grant update on table "public"."intervencion" to "service_role";

grant delete on table "public"."paso_protocolo" to "anon";

grant insert on table "public"."paso_protocolo" to "anon";

grant references on table "public"."paso_protocolo" to "anon";

grant select on table "public"."paso_protocolo" to "anon";

grant trigger on table "public"."paso_protocolo" to "anon";

grant truncate on table "public"."paso_protocolo" to "anon";

grant update on table "public"."paso_protocolo" to "anon";

grant delete on table "public"."paso_protocolo" to "authenticated";

grant insert on table "public"."paso_protocolo" to "authenticated";

grant references on table "public"."paso_protocolo" to "authenticated";

grant select on table "public"."paso_protocolo" to "authenticated";

grant trigger on table "public"."paso_protocolo" to "authenticated";

grant truncate on table "public"."paso_protocolo" to "authenticated";

grant update on table "public"."paso_protocolo" to "authenticated";

grant delete on table "public"."paso_protocolo" to "service_role";

grant insert on table "public"."paso_protocolo" to "service_role";

grant references on table "public"."paso_protocolo" to "service_role";

grant select on table "public"."paso_protocolo" to "service_role";

grant trigger on table "public"."paso_protocolo" to "service_role";

grant truncate on table "public"."paso_protocolo" to "service_role";

grant update on table "public"."paso_protocolo" to "service_role";

grant delete on table "public"."perfil_usuario" to "anon";

grant insert on table "public"."perfil_usuario" to "anon";

grant references on table "public"."perfil_usuario" to "anon";

grant select on table "public"."perfil_usuario" to "anon";

grant trigger on table "public"."perfil_usuario" to "anon";

grant truncate on table "public"."perfil_usuario" to "anon";

grant update on table "public"."perfil_usuario" to "anon";

grant delete on table "public"."perfil_usuario" to "authenticated";

grant insert on table "public"."perfil_usuario" to "authenticated";

grant references on table "public"."perfil_usuario" to "authenticated";

grant select on table "public"."perfil_usuario" to "authenticated";

grant trigger on table "public"."perfil_usuario" to "authenticated";

grant truncate on table "public"."perfil_usuario" to "authenticated";

grant update on table "public"."perfil_usuario" to "authenticated";

grant delete on table "public"."perfil_usuario" to "service_role";

grant insert on table "public"."perfil_usuario" to "service_role";

grant references on table "public"."perfil_usuario" to "service_role";

grant select on table "public"."perfil_usuario" to "service_role";

grant trigger on table "public"."perfil_usuario" to "service_role";

grant truncate on table "public"."perfil_usuario" to "service_role";

grant update on table "public"."perfil_usuario" to "service_role";

grant delete on table "public"."solicitud_visita" to "anon";

grant insert on table "public"."solicitud_visita" to "anon";

grant references on table "public"."solicitud_visita" to "anon";

grant select on table "public"."solicitud_visita" to "anon";

grant trigger on table "public"."solicitud_visita" to "anon";

grant truncate on table "public"."solicitud_visita" to "anon";

grant update on table "public"."solicitud_visita" to "anon";

grant delete on table "public"."solicitud_visita" to "authenticated";

grant insert on table "public"."solicitud_visita" to "authenticated";

grant references on table "public"."solicitud_visita" to "authenticated";

grant select on table "public"."solicitud_visita" to "authenticated";

grant trigger on table "public"."solicitud_visita" to "authenticated";

grant truncate on table "public"."solicitud_visita" to "authenticated";

grant update on table "public"."solicitud_visita" to "authenticated";

grant delete on table "public"."solicitud_visita" to "service_role";

grant insert on table "public"."solicitud_visita" to "service_role";

grant references on table "public"."solicitud_visita" to "service_role";

grant select on table "public"."solicitud_visita" to "service_role";

grant trigger on table "public"."solicitud_visita" to "service_role";

grant truncate on table "public"."solicitud_visita" to "service_role";

grant update on table "public"."solicitud_visita" to "service_role";

grant delete on table "public"."sucursal" to "anon";

grant insert on table "public"."sucursal" to "anon";

grant references on table "public"."sucursal" to "anon";

grant select on table "public"."sucursal" to "anon";

grant trigger on table "public"."sucursal" to "anon";

grant truncate on table "public"."sucursal" to "anon";

grant update on table "public"."sucursal" to "anon";

grant delete on table "public"."sucursal" to "authenticated";

grant insert on table "public"."sucursal" to "authenticated";

grant references on table "public"."sucursal" to "authenticated";

grant select on table "public"."sucursal" to "authenticated";

grant trigger on table "public"."sucursal" to "authenticated";

grant truncate on table "public"."sucursal" to "authenticated";

grant update on table "public"."sucursal" to "authenticated";

grant delete on table "public"."sucursal" to "service_role";

grant insert on table "public"."sucursal" to "service_role";

grant references on table "public"."sucursal" to "service_role";

grant select on table "public"."sucursal" to "service_role";

grant trigger on table "public"."sucursal" to "service_role";

grant truncate on table "public"."sucursal" to "service_role";

grant update on table "public"."sucursal" to "service_role";

grant delete on table "public"."tecnico" to "anon";

grant insert on table "public"."tecnico" to "anon";

grant references on table "public"."tecnico" to "anon";

grant select on table "public"."tecnico" to "anon";

grant trigger on table "public"."tecnico" to "anon";

grant truncate on table "public"."tecnico" to "anon";

grant update on table "public"."tecnico" to "anon";

grant delete on table "public"."tecnico" to "authenticated";

grant insert on table "public"."tecnico" to "authenticated";

grant references on table "public"."tecnico" to "authenticated";

grant select on table "public"."tecnico" to "authenticated";

grant trigger on table "public"."tecnico" to "authenticated";

grant truncate on table "public"."tecnico" to "authenticated";

grant update on table "public"."tecnico" to "authenticated";

grant delete on table "public"."tecnico" to "service_role";

grant insert on table "public"."tecnico" to "service_role";

grant references on table "public"."tecnico" to "service_role";

grant select on table "public"."tecnico" to "service_role";

grant trigger on table "public"."tecnico" to "service_role";

grant truncate on table "public"."tecnico" to "service_role";

grant update on table "public"."tecnico" to "service_role";

grant delete on table "public"."tecnico_certificado" to "anon";

grant insert on table "public"."tecnico_certificado" to "anon";

grant references on table "public"."tecnico_certificado" to "anon";

grant select on table "public"."tecnico_certificado" to "anon";

grant trigger on table "public"."tecnico_certificado" to "anon";

grant truncate on table "public"."tecnico_certificado" to "anon";

grant update on table "public"."tecnico_certificado" to "anon";

grant delete on table "public"."tecnico_certificado" to "authenticated";

grant insert on table "public"."tecnico_certificado" to "authenticated";

grant references on table "public"."tecnico_certificado" to "authenticated";

grant select on table "public"."tecnico_certificado" to "authenticated";

grant trigger on table "public"."tecnico_certificado" to "authenticated";

grant truncate on table "public"."tecnico_certificado" to "authenticated";

grant update on table "public"."tecnico_certificado" to "authenticated";

grant delete on table "public"."tecnico_certificado" to "service_role";

grant insert on table "public"."tecnico_certificado" to "service_role";

grant references on table "public"."tecnico_certificado" to "service_role";

grant select on table "public"."tecnico_certificado" to "service_role";

grant trigger on table "public"."tecnico_certificado" to "service_role";

grant truncate on table "public"."tecnico_certificado" to "service_role";

grant update on table "public"."tecnico_certificado" to "service_role";

grant delete on table "public"."visita" to "anon";

grant insert on table "public"."visita" to "anon";

grant references on table "public"."visita" to "anon";

grant select on table "public"."visita" to "anon";

grant trigger on table "public"."visita" to "anon";

grant truncate on table "public"."visita" to "anon";

grant update on table "public"."visita" to "anon";

grant delete on table "public"."visita" to "authenticated";

grant insert on table "public"."visita" to "authenticated";

grant references on table "public"."visita" to "authenticated";

grant select on table "public"."visita" to "authenticated";

grant trigger on table "public"."visita" to "authenticated";

grant truncate on table "public"."visita" to "authenticated";

grant update on table "public"."visita" to "authenticated";

grant delete on table "public"."visita" to "service_role";

grant insert on table "public"."visita" to "service_role";

grant references on table "public"."visita" to "service_role";

grant select on table "public"."visita" to "service_role";

grant trigger on table "public"."visita" to "service_role";

grant truncate on table "public"."visita" to "service_role";

grant update on table "public"."visita" to "service_role";

grant delete on table "public"."visita_tecnico" to "anon";

grant insert on table "public"."visita_tecnico" to "anon";

grant references on table "public"."visita_tecnico" to "anon";

grant select on table "public"."visita_tecnico" to "anon";

grant trigger on table "public"."visita_tecnico" to "anon";

grant truncate on table "public"."visita_tecnico" to "anon";

grant update on table "public"."visita_tecnico" to "anon";

grant delete on table "public"."visita_tecnico" to "authenticated";

grant insert on table "public"."visita_tecnico" to "authenticated";

grant references on table "public"."visita_tecnico" to "authenticated";

grant select on table "public"."visita_tecnico" to "authenticated";

grant trigger on table "public"."visita_tecnico" to "authenticated";

grant truncate on table "public"."visita_tecnico" to "authenticated";

grant update on table "public"."visita_tecnico" to "authenticated";

grant delete on table "public"."visita_tecnico" to "service_role";

grant insert on table "public"."visita_tecnico" to "service_role";

grant references on table "public"."visita_tecnico" to "service_role";

grant select on table "public"."visita_tecnico" to "service_role";

grant trigger on table "public"."visita_tecnico" to "service_role";

grant truncate on table "public"."visita_tecnico" to "service_role";

grant update on table "public"."visita_tecnico" to "service_role";

grant delete on table "public"."proveedor" to "anon";
grant insert on table "public"."proveedor" to "anon";
grant references on table "public"."proveedor" to "anon";
grant select on table "public"."proveedor" to "anon";
grant trigger on table "public"."proveedor" to "anon";
grant truncate on table "public"."proveedor" to "anon";
grant update on table "public"."proveedor" to "anon";

grant delete on table "public"."proveedor" to "authenticated";
grant insert on table "public"."proveedor" to "authenticated";
grant references on table "public"."proveedor" to "authenticated";
grant select on table "public"."proveedor" to "authenticated";
grant trigger on table "public"."proveedor" to "authenticated";
grant truncate on table "public"."proveedor" to "authenticated";
grant update on table "public"."proveedor" to "authenticated";

grant delete on table "public"."proveedor" to "service_role";
grant insert on table "public"."proveedor" to "service_role";
grant references on table "public"."proveedor" to "service_role";
grant select on table "public"."proveedor" to "service_role";
grant trigger on table "public"."proveedor" to "service_role";
grant truncate on table "public"."proveedor" to "service_role";
grant update on table "public"."proveedor" to "service_role";

grant delete on table "public"."marca" to "anon";
grant insert on table "public"."marca" to "anon";
grant references on table "public"."marca" to "anon";
grant select on table "public"."marca" to "anon";
grant trigger on table "public"."marca" to "anon";
grant truncate on table "public"."marca" to "anon";
grant update on table "public"."marca" to "anon";

grant delete on table "public"."marca" to "authenticated";
grant insert on table "public"."marca" to "authenticated";
grant references on table "public"."marca" to "authenticated";
grant select on table "public"."marca" to "authenticated";
grant trigger on table "public"."marca" to "authenticated";
grant truncate on table "public"."marca" to "authenticated";
grant update on table "public"."marca" to "authenticated";

grant delete on table "public"."marca" to "service_role";
grant insert on table "public"."marca" to "service_role";
grant references on table "public"."marca" to "service_role";
grant select on table "public"."marca" to "service_role";
grant trigger on table "public"."marca" to "service_role";
grant truncate on table "public"."marca" to "service_role";
grant update on table "public"."marca" to "service_role";

  create policy "allow_all_authenticated"
  on "public"."actividad_protocolo"
  as permissive
  for all
  to authenticated
using (true)
with check (true);

  create policy "Admins can manage administrators"
  on "public"."administrador"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.perfil_usuario pu
     JOIN public.catalogo_rol cr ON ((pu.rol_id = cr.id)))
  WHERE ((pu.id = auth.uid()) AND ((cr.codigo)::text = ANY ((ARRAY['ADMIN'::character varying, 'DIRECTOR'::character varying, 'COORDINADOR'::character varying])::text[]))))));

  create policy "Catalogo: escritura solo para admins"
  on "public"."catalogo"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.perfil_usuario p
     JOIN public.catalogo_rol r ON ((p.rol_id = r.id)))
  WHERE ((p.id = auth.uid()) AND ((r.codigo)::text = 'ADMIN'::text)))));

  create policy "Catalogo: lectura pública para autenticados"
  on "public"."catalogo"
  as permissive
  for select
  to authenticated
using ((activo = true));

  create policy "catalogo_read_authenticated"
  on "public"."catalogo"
  as permissive
  for select
  to authenticated
using (true);

  create policy "catalogo_estado_read_authenticated"
  on "public"."catalogo_estado_general"
  as permissive
  for select
  to authenticated
using (true);

  create policy "catalogo_rol_read_authenticated"
  on "public"."catalogo_rol"
  as permissive
  for select
  to authenticated
using (true);

  create policy "allow_read_authenticated"
  on "public"."proveedor"
  as permissive
  for select
  to authenticated
using (((activo = true) OR public.is_admin_or_coordinator()));

  create policy "allow_manage_admin"
  on "public"."proveedor"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_coordinator());

  create policy "allow_read_authenticated"
  on "public"."marca"
  as permissive
  for select
  to authenticated
using (((activo = true) OR public.is_admin_or_coordinator()));

  create policy "allow_manage_admin"
  on "public"."marca"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_coordinator());

  create policy "allow_all_authenticated"
  on "public"."categoria_dispositivo"
  as permissive
  for all
  to authenticated
using (true)
with check (true);

   create policy "Access for admins and assigned directors"
   on "public"."cliente"
   as permissive
   for all
   to authenticated
 using ((public.is_admin_or_coordinator() OR public.is_assigned_director(id)));

create policy "Tecnicos can read assigned visit clients"
on "public"."cliente"
as permissive
for select
to authenticated
using (
  EXISTS (
    SELECT 1
    FROM public.visita v
    JOIN public.visita_tecnico vt ON vt.visita_id = v.id
    JOIN public.tecnico t ON t.id = vt.tecnico_id
    WHERE v.cliente_id = cliente.id
      AND t.usuario_id = auth.uid()
  )
);

  create policy "Admin access"
  on "public"."contacto"
  as permissive
  for all
  to public
using (public.is_admin_or_coordinator());

  create policy "Admins and management manage contacto_sucursal"
  on "public"."contacto_sucursal"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

  create policy "allow_manage_admin"
  on "public"."dispositivo"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

  create policy "allow_read_authenticated"
  on "public"."dispositivo"
  as permissive
  for select
  to authenticated
using (true);

  create policy "allow_manage_admin"
  on "public"."catalogo_estado_dispositivo"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

  create policy "allow_read_authenticated"
  on "public"."catalogo_estado_dispositivo"
  as permissive
  for select
  to authenticated
using (true);

  create policy "Management staff access"
  on "public"."coordinador"
  as permissive
  for all
  to public
using ((public.is_management_staff() OR (usuario_id = auth.uid())));

  create policy "Management staff access"
  on "public"."director"
  as permissive
  for all
  to public
using ((public.is_management_staff() OR (usuario_id = auth.uid())));

  create policy "allow_all_authenticated"
  on "public"."paso_protocolo"
  as permissive
  for all
  to authenticated
using (true)
with check (true);

  create policy "Admin access"
  on "public"."perfil_usuario"
  as permissive
  for all
  to public
using (public.is_admin_or_coordinator());

  create policy "Users can read own profile"
  on "public"."perfil_usuario"
  as permissive
  for select
  to authenticated
using ((id = auth.uid() AND public.is_user_active()));

  create policy "Admin access"
  on "public"."solicitud_visita"
  as permissive
  for all
  to public
using (public.is_admin_or_coordinator());

  create policy "Clientes pueden crear sus solicitudes"
  on "public"."solicitud_visita"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM (public.perfil_usuario p
     JOIN public.catalogo_rol r ON ((p.rol_id = r.id)))
  WHERE ((p.id = auth.uid()) AND ((r.codigo)::text = 'CLIENTE'::text)))));

create policy "Clientes pueden ver sus solicitudes"
on "public"."solicitud_visita"
as permissive
for select
to authenticated
using (creado_por = auth.uid());

   create policy "Access for admins and assigned directors"
   on "public"."sucursal"
   as permissive
   for all
   to authenticated
 using ((public.is_admin_or_coordinator() OR public.is_assigned_director(cliente_id)));

create policy "Tecnicos can read assigned visit sucursales"
on "public"."sucursal"
as permissive
for select
to authenticated
using (
  EXISTS (
    SELECT 1
    FROM public.visita v
    JOIN public.visita_tecnico vt ON vt.visita_id = v.id
    JOIN public.tecnico t ON t.id = vt.tecnico_id
    WHERE v.sucursal_id = sucursal.id
      AND t.usuario_id = auth.uid()
  )
);

  create policy "Admin access"
  on "public"."contrato"
  as permissive
  for all
  to public
using (public.is_admin_or_coordinator());

  create policy "Admins can manage all technicians"
  on "public"."tecnico"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.perfil_usuario pu
     JOIN public.catalogo_rol cr ON ((pu.rol_id = cr.id)))
  WHERE ((pu.id = auth.uid()) AND ((cr.codigo)::text = ANY ((ARRAY['ADMIN'::character varying, 'DIRECTOR'::character varying, 'COORDINADOR'::character varying])::text[]))))));

  create policy "Management staff access"
  on "public"."tecnico"
  as permissive
  for all
  to public
using ((public.is_management_staff() OR (usuario_id = auth.uid())));

  create policy "Admins can manage all technician certificates"
  on "public"."tecnico_certificado"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.perfil_usuario pu
     JOIN public.catalogo_rol cr ON ((pu.rol_id = cr.id)))
  WHERE ((pu.id = auth.uid()) AND ((cr.codigo)::text = ANY ((ARRAY['ADMIN'::character varying, 'DIRECTOR'::character varying, 'COORDINADOR'::character varying])::text[]))))));

  create policy "Admin access"
  on "public"."visita"
  as permissive
  for all
  to public
using (public.is_admin_or_coordinator());

  -- Técnicos asignados pueden ver sus visitas (solo SELECT)
  create policy "Tecnicos can view assigned visits"
  on "public"."visita"
  as permissive
  for select
  to authenticated
using (public.is_tecnico_asignado_visita(id));

   create policy "Admins can manage director assignments"
   on "public"."cliente_director"
   as permissive
   for all
   to authenticated
 using (public.is_admin_or_coordinator())
 with check (public.is_admin_or_coordinator());

   create policy "Directors can view their own assignments"
   on "public"."cliente_director"
   as permissive
   for select
   to authenticated
 using ((director_id = auth.uid()));

CREATE TRIGGER on_user_role_change AFTER UPDATE OF rol_id ON public.perfil_usuario FOR EACH ROW EXECUTE FUNCTION public.sync_specialized_role_tables();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_proveedor BEFORE UPDATE ON public.proveedor FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_marca BEFORE UPDATE ON public.marca FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.recalcular_proximo_mantenimiento()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_frecuencia  integer;
  v_estado_code text;
BEGIN
  IF OLD.estado_id IS NOT DISTINCT FROM NEW.estado_id THEN
    RETURN NEW;
  END IF;

  SELECT codigo INTO v_estado_code
    FROM catalogo
   WHERE id = NEW.estado_id
   LIMIT 1;

  IF v_estado_code = 'COMPLETADA' THEN
    SELECT frecuencia_mantenimiento_meses INTO v_frecuencia
      FROM dispositivo
     WHERE id = NEW.dispositivo_id;

    IF v_frecuencia IS NOT NULL AND v_frecuencia > 0 THEN
      UPDATE dispositivo
         SET fecha_proximo_mantenimiento = CURRENT_DATE + (v_frecuencia || ' months')::interval,
             updated_at = now()
       WHERE id = NEW.dispositivo_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalcular_mantenimiento
  AFTER UPDATE ON public.intervencion
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_proximo_mantenimiento();

  create policy "Acceso completo usuarios autenticados 69tnde_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'inmotika'::text));

  create policy "Acceso completo usuarios autenticados 69tnde_1"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'inmotika'::text));

  create policy "Acceso completo usuarios autenticados 69tnde_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'inmotika'::text));

  create policy "Acceso completo usuarios autenticados 69tnde_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'inmotika'::text));

-- =============================================================================
-- RLS POLICIES: Visit workflow tables (previously locked - RLS enabled, 0 policies)
-- =============================================================================

-- --- visita ---
create policy "Admin manage visita"
on "public"."visita"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Tecnicos can view assigned visitas"
on "public"."visita"
as permissive
for select
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.visita_tecnico vt
    WHERE vt.visita_id = visita.id
    AND vt.tecnico_id = public.get_current_tecnico_id()
  )
);

-- --- visita_tecnico ---
create policy "Admin manage visita_tecnico"
on "public"."visita_tecnico"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Tecnicos can view their assignments"
on "public"."visita_tecnico"
as permissive
for select
to authenticated
using (tecnico_id = public.get_current_tecnico_id());

-- --- intervencion ---
create policy "Admin manage intervencion"
on "public"."intervencion"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Tecnicos can view and update assigned interventions"
on "public"."intervencion"
as permissive
for select
to authenticated
using (public.is_tecnico_asignado_visita(visita_id));

create policy "Tecnicos can insert interventions for assigned visits"
on "public"."intervencion"
as permissive
for insert
to authenticated
with check (public.is_tecnico_asignado_visita(visita_id));

create policy "Tecnicos can update assigned interventions"
on "public"."intervencion"
as permissive
for update
to authenticated
using (public.is_tecnico_asignado_visita(visita_id))
with check (public.is_tecnico_asignado_visita(visita_id));

-- --- ejecucion_paso ---
create policy "Admin manage ejecucion_paso"
on "public"."ejecucion_paso"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Tecnicos can manage ejecucion_paso of assigned visits"
on "public"."ejecucion_paso"
as permissive
for all
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.intervencion i
    WHERE i.id = intervencion_id
    AND public.is_tecnico_asignado_visita(i.visita_id)
  )
)
with check (
  EXISTS (
    SELECT 1 FROM public.intervencion i
    WHERE i.id = intervencion_id
    AND public.is_tecnico_asignado_visita(i.visita_id)
  )
);

-- --- ejecucion_actividad ---
create policy "Admin manage ejecucion_actividad"
on "public"."ejecucion_actividad"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Tecnicos can manage ejecucion_actividad of assigned visits"
on "public"."ejecucion_actividad"
as permissive
for all
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.intervencion i
    WHERE i.id = intervencion_id
    AND public.is_tecnico_asignado_visita(i.visita_id)
  )
)
with check (
  EXISTS (
    SELECT 1 FROM public.intervencion i
    WHERE i.id = intervencion_id
    AND public.is_tecnico_asignado_visita(i.visita_id)
  )
);

as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

as permissive
for all
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.ejecucion_paso ep
    JOIN public.intervencion i ON i.id = ep.intervencion_id
    WHERE ep.id = ejecucion_paso_id
    AND public.is_tecnico_asignado_visita(i.visita_id)
  )
)
with check (
  EXISTS (
    SELECT 1 FROM public.ejecucion_paso ep
    JOIN public.intervencion i ON i.id = ep.intervencion_id
    WHERE ep.id = ejecucion_paso_id
    AND public.is_tecnico_asignado_visita(i.visita_id)
  )
);

-- --- disponibilidad_tecnico ---
create policy "Admin manage disponibilidad_tecnico"
on "public"."disponibilidad_tecnico"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Tecnicos can manage own availability"
on "public"."disponibilidad_tecnico"
as permissive
for all
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.tecnico t
    WHERE t.id = tecnico_id AND t.usuario_id = auth.uid()
  )
)
with check (
  EXISTS (
    SELECT 1 FROM public.tecnico t
    WHERE t.id = tecnico_id AND t.usuario_id = auth.uid()
  )
);

-- --- historial_traslado ---
create policy "Admin manage historial_traslado"
on "public"."historial_traslado"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Authenticated can view historial_traslado"
on "public"."historial_traslado"
as permissive
for select
to authenticated
using (true);

-- --- solicitud_dispositivo ---
create policy "Admin manage solicitud_dispositivo"
on "public"."solicitud_dispositivo"
as permissive
for all
to authenticated
using (public.is_admin_or_coordinator())
with check (public.is_admin_or_coordinator());

create policy "Clientes can insert solicitud_dispositivo"
on "public"."solicitud_dispositivo"
as permissive
for insert
to authenticated
with check (
  EXISTS (
    SELECT 1 FROM public.solicitud_visita sv
    WHERE sv.id = solicitud_id
    AND sv.creado_por = auth.uid()
  )
);

create policy "Clientes can view own solicitud_dispositivo"
on "public"."solicitud_dispositivo"
as permissive
for select
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.solicitud_visita sv
    WHERE sv.id = solicitud_id
    AND sv.creado_por = auth.uid()
  )
);

-- =============================================================================
-- PERFORMANCE INDEXES: FK columns on visit workflow tables
-- =============================================================================

CREATE INDEX idx_solicitud_visita_cliente_id ON public.solicitud_visita USING btree (cliente_id);
CREATE INDEX idx_solicitud_visita_sucursal_id ON public.solicitud_visita USING btree (sucursal_id);
CREATE INDEX idx_solicitud_visita_estado_id ON public.solicitud_visita USING btree (estado_id);

CREATE INDEX idx_solicitud_dispositivo_solicitud_id ON public.solicitud_dispositivo USING btree (solicitud_id);
CREATE INDEX idx_solicitud_dispositivo_dispositivo_id ON public.solicitud_dispositivo USING btree (dispositivo_id);

CREATE INDEX idx_visita_solicitud_id ON public.visita USING btree (solicitud_id);
CREATE INDEX idx_visita_estado_id ON public.visita USING btree (estado_id);
CREATE INDEX idx_visita_cliente_id ON public.visita USING btree (cliente_id);
CREATE INDEX idx_visita_sucursal_id ON public.visita USING btree (sucursal_id);
CREATE INDEX idx_visita_fecha_programada ON public.visita USING btree (fecha_programada);
CREATE INDEX idx_visita_coordinador_usuario_id ON public.visita USING btree (coordinador_usuario_id);

CREATE INDEX idx_visita_tecnico_visita_id ON public.visita_tecnico USING btree (visita_id);
CREATE INDEX idx_visita_tecnico_tecnico_id ON public.visita_tecnico USING btree (tecnico_id);

CREATE INDEX idx_intervencion_visita_id ON public.intervencion USING btree (visita_id);
CREATE INDEX idx_intervencion_dispositivo_id ON public.intervencion USING btree (dispositivo_id);
CREATE INDEX idx_intervencion_estado_id ON public.intervencion USING btree (estado_id);

CREATE INDEX idx_ejecucion_paso_intervencion_id ON public.ejecucion_paso USING btree (intervencion_id);
CREATE INDEX idx_ejecucion_paso_paso_protocolo_id ON public.ejecucion_paso USING btree (paso_protocolo_id);

CREATE INDEX idx_disponibilidad_tecnico_tecnico_id ON public.disponibilidad_tecnico USING btree (tecnico_id);
CREATE INDEX idx_disponibilidad_tecnico_fechas ON public.disponibilidad_tecnico USING btree (fecha_inicio, fecha_fin);

CREATE INDEX idx_dispositivo_sucursal_id ON public.dispositivo USING btree (sucursal_id);
CREATE INDEX idx_dispositivo_cliente_id ON public.dispositivo USING btree (cliente_id);
CREATE INDEX idx_dispositivo_categoria_id ON public.dispositivo USING btree (categoria_id);

-- =============================================================================
-- TRIGGERS: auto-update updated_at on visit workflow tables
-- =============================================================================

CREATE TRIGGER set_updated_at_solicitud_visita BEFORE UPDATE ON public.solicitud_visita FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_visita BEFORE UPDATE ON public.visita FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_intervencion BEFORE UPDATE ON public.intervencion FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_ejecucion_paso BEFORE UPDATE ON public.ejecucion_paso FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_dispositivo BEFORE UPDATE ON public.dispositivo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_perfil_usuario BEFORE UPDATE ON public.perfil_usuario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --- sucursal_coordinador ---
create table "public"."sucursal_coordinador" (
  "id" uuid not null default gen_random_uuid(),
  "sucursal_id" uuid not null,
  "coordinador_id" uuid not null,
  "activo" boolean not null default true,
  "created_at" timestamp with time zone default now()
);

alter table "public"."sucursal_coordinador" enable row level security;

alter table "public"."sucursal_coordinador" add constraint "sucursal_coordinador_pkey" PRIMARY KEY ("id");
alter table "public"."sucursal_coordinador" add constraint "sucursal_coordinador_sucursal_id_fkey" FOREIGN KEY (sucursal_id) REFERENCES public.sucursal(id) ON DELETE CASCADE;
alter table "public"."sucursal_coordinador" add constraint "sucursal_coordinador_coordinador_id_fkey" FOREIGN KEY (coordinador_id) REFERENCES public.coordinador(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX sucursal_coordinador_unique ON public.sucursal_coordinador USING btree (sucursal_id, coordinador_id);

create policy "sucursal_coordinador_select"
on "public"."sucursal_coordinador"
as permissive
for select
to public
using (public.is_admin_or_coordinator());

create policy "sucursal_coordinador_manage"
on "public"."sucursal_coordinador"
as permissive
for all
to public
using (public.is_management_staff())
with check (public.is_management_staff());


-- --- evidencia_intervencion ---
create table "public"."evidencia_intervencion" (
  "id" uuid not null default gen_random_uuid(),
  "intervencion_id" uuid not null,
  "url" text not null,
  "numero_foto" integer,
  "es_etiqueta" boolean not null default false,
  "activo" boolean not null default true,
  "created_at" timestamp with time zone default now()
);

alter table "public"."evidencia_intervencion" enable row level security;

alter table "public"."evidencia_intervencion" add constraint "evidencia_intervencion_pkey" PRIMARY KEY ("id");
alter table "public"."evidencia_intervencion" add constraint "evidencia_intervencion_intervencion_id_fkey" FOREIGN KEY (intervencion_id) REFERENCES public.intervencion(id) ON DELETE CASCADE;
CREATE INDEX idx_evidencia_intervencion_intervencion_id ON public.evidencia_intervencion USING btree (intervencion_id);

create policy "evidencia_intervencion_select"
on "public"."evidencia_intervencion"
as permissive
for select
to public
using (true);

create policy "evidencia_intervencion_manage"
on "public"."evidencia_intervencion"
as permissive
for all
to public
using ((auth.role() = 'authenticated'))
with check ((auth.role() = 'authenticated'));

-- --- intervencion: etiqueta constraint ---
alter table "public"."intervencion" add constraint "intervencion_etiqueta_formato" CHECK (codigo_etiqueta IS NULL OR codigo_etiqueta ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$');

-- --- solicitud_visita: técnicos pueden ver solicitudes de visitas asignadas ---
create policy "Tecnicos can view solicitudes of assigned visits"
on "public"."solicitud_visita"
as permissive
for select
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.visita v
    WHERE v.solicitud_id = solicitud_visita.id
    AND public.is_tecnico_asignado_visita(v.id)
  )
);

-- --- solicitud_dispositivo: técnicos pueden ver dispositivos de sus solicitudes asignadas ---
create policy "Tecnicos can view dispositivos of assigned visits"
on "public"."solicitud_dispositivo"
as permissive
for select
to authenticated
using (
  EXISTS (
    SELECT 1 FROM public.visita v
    WHERE v.solicitud_id = solicitud_dispositivo.solicitud_id
    AND public.is_tecnico_asignado_visita(v.id)
  )
);

-- --- contacto_sucursal: validar que la sucursal pertenezca al cliente del contacto ---
-- El trigger evita que se inserten registros incoherentes donde la sucursal
-- pertenece a un cliente distinto al que tiene asignado el contacto.

DROP FUNCTION IF EXISTS public.validate_contacto_sucursal_coherencia() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_contacto_sucursal_coherencia()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_cliente_id_contacto uuid;
  v_cliente_id_sucursal uuid;
BEGIN
  -- Obtener el cliente_id del contacto
  SELECT cliente_id INTO v_cliente_id_contacto
  FROM public.contacto
  WHERE id = NEW.contacto_id;

  -- Si el contacto no tiene cliente asignado, permitir la asociación
  IF v_cliente_id_contacto IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener el cliente_id de la sucursal
  SELECT cliente_id INTO v_cliente_id_sucursal
  FROM public.sucursal
  WHERE id = NEW.sucursal_id;

  -- Validar coherencia: la sucursal debe pertenecer al mismo cliente del contacto
  IF v_cliente_id_sucursal IS DISTINCT FROM v_cliente_id_contacto THEN
    RAISE EXCEPTION
      'La sucursal (id: %) pertenece al cliente % pero el contacto (id: %) está asignado al cliente %. Un contacto solo puede asociarse a sucursales de su cliente.',
      NEW.sucursal_id, v_cliente_id_sucursal, NEW.contacto_id, v_cliente_id_contacto;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_contacto_sucursal_coherencia
  BEFORE INSERT OR UPDATE ON public.contacto_sucursal
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contacto_sucursal_coherencia();

