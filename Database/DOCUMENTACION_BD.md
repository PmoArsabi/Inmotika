# Documentación de Arquitectura de Base de Datos - Inmotika

Este documento detalla la estructura, decisiones arquitectónicas y el diccionario de datos del modelo de base de datos de Inmotika, diseñado específicamente para operar sobre **PostgreSQL** y aprovechar al máximo las capacidades de **Supabase**.

---

## 🏗️ Principios Arquitectónicos Clave

Antes de examinar las tablas, es vital entender las decisiones técnicas transversales:

1. **Identificadores Universales (UUIDs)**: Todas las tablas utilizan `UUID` (versión 4) como Clave Primaria (`PK`). Esto evita colisiones en entornos distribuidos, previene que actores maliciosos adivinen IDs (ej: `/clientes/123`), y se integra de forma nativa con el sistema de autenticación de Supabase.
2. **Delegación de Autenticación**: La validación de contraseñas, generación de tokens (JWT) y sesiones **no** se maneja en este esquema. Se delega por completo a la tabla interna `auth.users` de Supabase. Nuestro esquema solo almacena la información "pública" o de negocio del usuario en `PERFIL_USUARIO`.
3. **Auditoría Transversal**: Todas las entidades transaccionales y maestras incluyen `created_at` y `updated_at` (tipo `timestamptz`). Esto garantiza trazabilidad temporal estricta de cualquier registro.
4. **Desnormalización para RLS (Row Level Security)**: Supabase basa su seguridad en políticas a nivel de fila. Para que estas políticas sean ultrarrápidas y no requieran múltiples `JOINs` costosos por cada consulta, se ha inyectado estratégicamente el `cliente_id` en tablas "lejanas" (como `DISPOSITIVO` o `CONTRATO`), permitiendo validar permisos con una lectura directa (Diciendo: *"Muestra este dispositivo solo si su cliente_id pertenece al usuario actual"*).

---

## 📚 Diccionario de Datos por Módulos

### 1. Identidad y Roles del Sistema

Este módulo maneja quién ingresa al sistema y qué funciones tiene.

*   **`PERFIL_USUARIO`**: Es la extensión humana de la cuenta técnica. Su `id` debe coincidir exactamente con el UUID generado por Supabase (`auth.users.id`). Guarda información genérica (`nombre_completo`, `avatar_url`, y el `rol` principal).
*   **`DIRECTOR` / `COORDINADOR` / `TECNICO`**: Entidades específicas para cada rol operativo operativo. Se separan porque tienen jerarquías (el Director supervisa Coordinadores) y atributos únicos (el Técnico exige validación en campo: `tipo_documento`, `documento_cedula_url`, `planilla_seg_social_url` para regulaciones laborales, y `certificados`). Nótese que el técnico es "flotante" y no tiene sede fija.
*   **`DISPONIBILIDAD_TECNICO`**: Registra los bloqueos de agenda de un técnico (vacaciones, incapacidades, permisos). Una visita no puede programarse si la fecha choca con estos registros.

### 2. Estructura de Clientes

Define a las empresas que contratan a Inmotika y su distribución física.

*   **`CLIENTE`**: La entidad legal o pagadora. Incorpora `fecha_nacimiento` para casos donde el cliente es persona natural, y reemplaza teléfono local por `celular` (formato internacional).
*   **`SUCURSAL`**: Las ubicaciones físicas de un Cliente (1:N). Incluye validadores como `es_principal` para envíos/facturación y un formato JSON/Texto para `horarios_atencion`.
*   **`CONTACTO`**: Las personas con las que Inmotika se comunica (Gerentes de Mantenimiento, Administradores). Destacan campos CRM exhaustivos (`identificacion`, `genero`, `area_departamento`, `fecha_nacimiento`, `fecha_matrimonio`) para estrategias de fidelización B2B. El celular es mandatario.
*   **`CONTACTO_SUCURSAL`**: Tabla pivote (M:N). Permite que un mismo Gerente Regional (`CONTACTO`) esté encargado de 5 sucursales distintas sin duplicar su información.
*   **`CONTRATO`**: Registra los acuerdos comerciales temporales (ej. Contrato Mantenimiento 2026). El sistema siempre valida "el último contrato vigente" al generar visitas.

### 3. Dispositivos y Estandarización de Protocolos

El corazón del mantenimiento: Administra los equipos físicos y las reglas para mantenerlos.

*   **`CATEGORIA_DISPOSITIVO`**: Agrupa equipos similares (Ej: "Aire Acondicionado Minisplit 12000BTU Marca LG").
*   **`DISPOSITIVO`**: Un equipo físico real en una `SUCURSAL`. Registra el dueño operativo (`propiedad_de`: cliente o inmotika), el identificador que le da el cliente (`id_cliente_interno`), y quién lo vendió originalmente (`proveedor`). Incluye el `id_inmotika` (código QR/NFC interno).
*   **`HISTORIAL_TRASLADO`**: Bitácora de movimientos. Registra origen, destino, motivo y quién autorizó el cambio, preservando vida útil e historial (recompras o devoluciones se manejan aquí o cambiando el estado a *Recuperado*).
*   **`PASO_PROTOCOLO`**: Es el "Manual de Mantenimiento". Se asocia a la Categoría. **Regla de Negocio:** Estos pasos están diseñados para cargarse y exigirse *únicamente* en visitas de tipo `Preventiva`.

### 4. Operaciones (Flujo de Trabajo de Visitas)

El motor transaccional del sistema, desde que nace la necesidad hasta que el técnico sube la foto.

*   **`SOLICITUD_VISITA`**: El ticket inicial. Puede ser creado por un cliente o internamente. Exige revisión de un coordinador. Define el `motivo` y se dirige a una `sucursal` específica.
*   **`VISITA`**: La orden de trabajo aprobada. Una vez programada, se le asignan técnicos. Mientras esté en estado "Pendiente de Asignación", el Coordinador puede modificar libremente fecha, hora y técnicos. Incluye `observaciones` textuales globales.
*   **`EVIDENCIA_VISITA`**: Tabla (1:N) que acompaña a la `VISITA`, permitiendo adjuntar n fotografías a las observaciones generales del servicio.
*   **`VISITA_TECNICO`**: Tabla pivote (M:N). Permite enviar cuadrillas. El campo `es_lider` indica quién firma el trabajo.
*   **`INTERVENCION`**: El trabajo realizado sobre un (1) equipo. Aquí rige el control estricto de cierre: *No se puede cerrar una visita si falta intervenir algún equipo programado*.
*   **`EJECUCION_PASO`**: Evidencia del técnico. *Regla Rígida*: No se puede dar por terminada la `INTERVENCION` de un equipo sin haber finalizado (o marcado validamente como omitido) todos los `EJECUCION_PASO` obligatorios de dicho protocolo.
*   **`EVIDENCIA_PASO`**: Exige la carga obligatoria de fotos (antes/durante/después) para comprobar cada paso de mantenimiento realizado.

### 5. Catálogos (Diccionarios Dinámicos)

En lugar de usar textos sueltos y propensos a errores tipográficos (`"en processso"`, `"COMPLETADO"`), o restrictivos `ENUMs` a nivel de base de datos, se centralizan los estados en tablas de control. Esto permite añadir un estado nuevo en el futuro sin modificar la arquitectura de la base de datos.

*   `CATALOGO_ESTADO_GENERAL` (Activo, Inactivo, Mantenimiento, etc.)
*   `CATALOGO_ESTADO_VISITA` (Solicitada, Programada, En Ruta, Ejecución, Facturación).
*   `CATALOGO_ESTADO_INTERVENCION` (En progreso, Espera de repuesto, Finalizada).
*   `CATALOGO_ESTADO_EJECUCION_PASO` (Omitido, Completado, Fallido).
*   `CATALOGO_TIPO_VISITA` (Preventiva, Correctiva, Instalación).

### 6. Ciclo Automático de Mantenimiento Preventivo

Para gestionar los mantenimientos preventivos a escala sin intervención manual constante, el sistema utiliza un enfoque basado en datos y tareas programadas (Cron Jobs / Supabase Edge Functions):

*   **Configuración Inicial**: Al registrar un `DISPOSITIVO`, se define su `frecuencia_mantenimiento_meses` (ej. 6) y una `fecha_proximo_mantenimiento` inicial.
*   **Detección y Generación (Cron Job)**: Diariamente, una tarea automática (ej. usando `pg_cron` en Supabase) escanea los dispositivos cuya `fecha_proximo_mantenimiento` esté próxima (ej. a 15 días vista).
*   **Creación Autónoma**: Para esos dispositivos, el sistema inserta una nueva `SOLICITUD_VISITA` con `tipo_visita_id` = "Preventiva". El campo `creado_por` queda nulo (indicando que el autor fue el sistema). La solicitud aparece en el tablero del Coordinador lista para asignación.
*   **Recálculo Automático (Trigger)**: Cuando el Técnico finaliza la `VISITA` en campo, un *Database Trigger* intercepta este cierre, localiza el dispositivo intervenido, y actualiza automáticamente su `fecha_proximo_mantenimiento` sumándole los meses de frecuencia a la fecha actual. **El ciclo se reinicia.**

---

## 🔒 Reglas de Integridad (Restricciones Críticas)

Para asegurar que la base de datos nunca entre en un estado corrompido, a nivel de implementación DDL (Data Definition Language) deben crearse los siguientes Índices Únicos Compuestos (Unique Constraints):

1.  **En `CONTACTO_SUCURSAL`** (`contacto_id`, `sucursal_id`): Garantiza que no se pueda asignar el mismo gerente dos veces a la misma sede en el sistema.
2.  **En `VISITA_TECNICO`** (`visita_id`, `tecnico_id`): Evita que, por un error en la interfaz (doble clic), se asigne al mismo técnico dos veces al mismo trabajo.
3.  **En `CATEGORIA_DISPOSITIVO`** (`nombre`, `marca`, `modelo`): Previene la creación accidental de categorías duplicadas que confundan la herencia de los protocolos de mantenimiento.
4.  **En `PASO_PROTOCOLO`** (`categoria_id`, `orden`): Asegura rigurosidad secuencial. Impide matemáticamente que existan dos "Pasos #1" para el mismo tipo de equipo.

---

## 🔍 Atributos Clave a Considerar (Consideraciones Especiales)

Hay ciertos campos en las tablas cuyo diseño soluciona problemas frecuentes en desarrollo de software de campo:

### 1. `DISPOSITIVO.id_inmotika`
Este campo no es el "serial" de fábrica del dispositivo (que también existe). El `id_inmotika` está pensado para ser un código alfanumérico interno corto (ej: `AC-NRT-001`) y, lo más importante, es el ID que **se imprimirá en una calcomanía QR o NFC** pegada a la máquina física. Cuando el técnico llegue a la sede, escanea la calcomanía y la app de React busca este `id_inmotika` para abrir directamente el protocolo de intervención.

### 2. `VISITA.coordinador_id` vs `SOLICITUD_VISITA.creado_por`
Es vital distinguir quién "origina" un problema y quién lo "asigna":
- **`creado_por`**: (FK a Perfil Usuario). Quien reportó el daño. Podría ser el mismo cliente ingresando al portal, o un técnico que notó algo raro mientras estaba de paso.
- **`coordinador_id`**: (FK a Coordinador). El responsable corporativo que tomó la solicitud, validó contrato, aprobó que se realizara y designó la visita a las cuadrillas.

### 3. `EVIDENCIA_PASO.tipo`
Al momento de un mantenimiento preventivo riguroso o correctivo complejo, una sola foto es insuficiente. El campo `tipo` (String) puede almacenar valores como "antes" (cómo encontré la pieza defectuosa), "durante" (prueba del trabajo realizado) y "después" (el lugar de trabajo completamente limpio o la pieza nueva instalada). Esto previene disputas legales con el cliente.

### 4. `CONTACTO.fecha_nacimiento` y `CONTACTO.fecha_matrimonio`
Incluidos por lógica de "Client Relationship Management" (CRM). Permiten que Inmotika automatice felicitaciones, envío de regalos corporativos y fomente una mejor relación B2B.

---

## 🚀 Próximos Pasos para Desarrollo (React & Supabase)

1. **Setup DDL SQL**: Traducir este Diagrama ER a `CREATE TABLE` scripts directamente en el SQL Editor de Supabase (o usar migraciones).
2. **Setup Supabase Auth**: Configurar en React el Auth Provider de Supabase.
3. **Desarrollo Frontend Roles**: En React, antes de pintar la pantalla, el `App.jsx` debe validar el Rol de Supabase para renderizar la pantalla adecuada (Dashboard Coordinador vs Vistas Móviles del Técnico).

✨ *La arquitectura está lista y robusta de extremo a extremo.*