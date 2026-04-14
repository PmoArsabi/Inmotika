# CLAUDE.md — Inmotika Agent Orchestrator

Instrucciones automáticas para Claude Code. Lee esta sección primero para entender el proyecto, luego consulta los especialistas según tu tarea.

---

## 1. Project Identity

**Inmotika** es una plataforma SaaS de gestión inmobiliaria y domótica integrada.

**Stack:**
- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Icons:** Lucide Icons
- **Architecture:** Tab-based routing (sin React Router), modular por dominio

**Propósito:** Digitalizar la gestión integral de propiedades, usuarios, visitas, protocolos y catálogos en un sistema escalable y seguro.

---

## 2. Real Architecture Overview

Estructura de carpetas y responsabilidades:

```
frontend/src/
├── api/                    # Supabase data-access por entidad (clientes, usuarios, etc)
├── components/
│   ├── ui/                # Primitivos reutilizables (Button, Card, Modal, etc)
│   └── [feature]/         # Composites específicos del dominio (ClientForm, UserCard)
├── modules/               # Vertical slices por dominio (cada módulo: componentes + hooks + utils)
├── pages/                 # Puntos de entrada (CategoriasPage, ClientDashboardPage, etc)
├── hooks/                 # Lógica de negocio, queries a Supabase, estado asíncrono
├── context/               # React Context providers (Auth, Theme, etc)
├── utils/                 # supabase.js (cliente), validadores, constantes, helpers
└── assets/                # Imágenes, fuentes, etc
```

**Database:**
- `/Database/ddl.sql` — Fuente de verdad del esquema (tablas, RLS, triggers)
- `/Database/schema.sql` — Copia canónica del remoto
- `/supabase/migrations/` — Historial de cambios (6 migraciones existentes)

---

## 3. Agent Orchestration Matrix

Antes de escribir código, haz un **Chain of Thought de máx. 5 pasos**. Luego, consulta **UNA sola instrucción especializada** según tu tarea.

| Tipo de Tarea | Leer | Luego |
|---|---|---|
| **UI, JSX, estilos, layouts, componentes** | `ai-instructions/ui-ux-specialist.md` | Si necesitas React patterns: `react-standards.md` |
| **Hooks, fetching, estado, queries a Supabase** | `ai-instructions/logic-api-specialist.md` | Si incluye RLS/schema: `database-standards.md` |
| **SQL, RLS, schema, triggers, DDL** | `ai-instructions/database-standards.md` | Contexto BD: `database-context.md` |
| **Refactorización, deuda técnica, clean code** | `ai-instructions/refactor-review-specialist.md` | Base: `system-prompt.md` |
| **Tarea multi-dominio (UI + lógica + SQL)** | `ai-instructions/manager.md` primero | Luego delega a especialistas |

**Regla de ahorro de contexto:** Solo carga el archivo relevante. No leas todos.

---

## 4. Global Rules (No Negociables)

### Code Quality
- **Zero placeholders:** No uses `// ...rest`, `// ... more code`. Proporciona código completo o diffs precisos.
- **Chain of Thought obligatorio:** Antes de generar código, razona en 3-5 pasos clave.
- **JSDoc en estructuras:** Aunque sea JavaScript, documenta estructuras de datos con JSDoc (sin tipos de TS).

### Frontend
- **Tailwind 4 nativo:** Usa `@theme` para variables CSS nativas, minimiza `@apply`, sin configuración JS innecesaria.
- **React 19 patterns:** Prefiere `use()` para promises, evita Prop Drilling, Lazy Load rutas pesadas.
- **Sin generación de docs:** NO crees ni actualices archivos en `frontend/docs/` (son ruido).
- **PROHIBIDO usar `notify()` (Toast pequeño) para confirmaciones de acciones CRUD.** Siempre usa el modal grande de éxito/error (`setSuccessInfo(...)`) para informar al usuario del resultado de crear, editar, eliminar o cualquier operación relevante. Los toasts (`notify`) solo se permiten para mensajes secundarios o informativos no críticos.

### Styling
- **Glassmorphism & gradientes:** Efectos de `backdrop-blur`, gradientes armónicos (no colores planos).
- **Micro-animaciones:** Transiciones suaves, funcionales, elegantes (no excesivas).
- **Responsive:** Mobile → Desktop sin perder consistencia visual.

---

## 5. Database Rules (CRITICAL)

Fusión de `database-standards.md` y `database-context.md`:

### Schema
- **Fuente de verdad:** `/Database/ddl.sql` (estado actual e historial acumulado).
- **No inventar:** Verifica tabla/columna en `ddl.sql` antes de usarla.
- **Cambios de esquema:** Actualiza `ddl.sql` + entrega SQL fragmentado al usuario para ejecución manual en Supabase SQL Editor.

### RLS & Security
- **RLS obligatorio en tablas nuevas:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` inmediatamente.
- **Funciones clave:**
  - `is_admin_or_coordinator()` → Admin, Director, Coordinador
  - `is_management_staff()` → Mismo criterio (Admin, Director, Coordinador)
- **Antes de proponer queries:** Verifica que el rol del usuario pase las políticas RLS.

### Triggers (No duplicar lógica en código)
- **`handle_new_user`** (AFTER INSERT en `auth.users`) → Crea `perfil_usuario` y fila en tabla de rol (tecnico/coordinador/director/administrador) automáticamente.
  - **No hagas INSERT manual en `perfil_usuario` ni en tablas de rol al registrar usuarios vía Auth.**
- **`sync_specialized_role_tables`** (AFTER UPDATE de `rol_id` en `perfil_usuario`) → Sincroniza tablas de rol.
  - **Para cambiar rol de usuario, solo actualiza `perfil_usuario.rol_id`; NO insertes/actualices manualmente en tecnico/coordinador/director/administrador.**

### Migrations
- **No ejecutar:** `supabase db push`, `supabase migration apply`, `supabase db pull` (prohibido).
- **El usuario ejecuta:** SQL fragmentado en Supabase SQL Editor (web) manualmente.
- **Archivo único:** Todo el esquema vive en `/Database/ddl.sql`. No crear múltiples archivos de migración.

---

## 6. Task Routing Quick Ref

**Síntoma → Acción:**

- "Mi componente necesita refactor" → `ui-ux-specialist.md`
- "El hook de fetching es ineficiente" → `logic-api-specialist.md` + `react-standards.md`
- "Necesito añadir una columna a la tabla X" → `database-standards.md` + `database-context.md`
- "Todo está roto, tengo que revisar la arquitectura" → `manager.md` + `system-prompt.md`
- "El código tiene deuda técnica" → `refactor-review-specialist.md`

---

## 7. Context Map (Paths Reales)

| Recurso | Ubicación |
|---|---|
| Componentes UI reutilizables | `/frontend/src/components/ui/` |
| Componentes por dominio | `/frontend/src/components/[feature]/` |
| Hooks (lógica + fetching) | `/frontend/src/hooks/` |
| Supabase client | `/frontend/src/utils/supabase.js` |
| Contextos React | `/frontend/src/context/` |
| Páginas (routing) | `/frontend/src/pages/` |
| Esquema BD (fuente de verdad) | `/Database/ddl.sql` |
| Contexto BD para IA | `/ai-instructions/database-context.md` |
| Documentación BD ampliada | `/Database/DOCUMENTACION_BD.md` |

---

## 8. Allowed Tools & Commands

| Comando | Estado | Notas |
|---|---|---|
| `npm run dev` | ✅ Sí | Desarrollo local |
| `npm run build` | ✅ Sí | Build para producción |
| `npm run lint` | ✅ Sí | Linting y formateo |
| `supabase db push` | ❌ No | Prohibido; migraciones manuales |
| `supabase migration apply` | ❌ No | Prohibido; user ejecuta en SQL Editor |
| Crear archivos en `frontend/docs/` | ❌ No | Ruido innecesario |

### Regla obligatoria de lint

**SIEMPRE ejecuta `npm run lint` (desde `/frontend`) al finalizar cualquier tarea que modifique archivos `.jsx` o `.js`.**
- Cwd correcto: `cd /c/Proyectos/Inmotika/Inmotika/frontend && npm run lint`
- Si hay errores: corrígelos todos antes de reportar la tarea como completa.
- Errores frecuentes: imports no usados, variables no usadas, hooks sin importar (`useMemo`, `useCallback`, etc.).

---

## 9. Common Workflows

### Agregar un componente UI nuevo
1. Leer `/ai-instructions/ui-ux-specialist.md`
2. Leer `/ai-instructions/react-standards.md`
3. Crear en `/frontend/src/components/ui/` si es primitivo, o `/frontend/src/components/[feature]/` si es compuesto

### Crear un hook con datos de Supabase
1. Leer `/ai-instructions/logic-api-specialist.md`
2. Verificar RLS en `/ai-instructions/database-context.md`
3. Crear en `/frontend/src/hooks/`

### Modificar schema (nueva tabla/columna)
1. Leer `/ai-instructions/database-standards.md` + `/database-context.md`
2. Actualizar `/Database/ddl.sql`
3. Entregar SQL fragmentado (solo cambios) para ejecución manual del usuario

### Refactorizar código existente
1. Leer `/ai-instructions/refactor-review-specialist.md`
2. Revisar `/ai-instructions/system-prompt.md` para principios globales
3. Proponer "Antes vs Después" con justificación

---

## 10. Key Principles (RCCO Framework)

- **Role:** Arquitecto de Software Senior + especialistas en dominio específico
- **Context:** Plataforma SaaS de gestión inmobiliaria con IoT
- **Constraints:**
  - RLS en cada cambio de BD
  - Zero placeholders en código
  - Chain of Thought obligatorio
  - Tailwind 4 nativo
  - No duplicar lógica de triggers en código
- **Output:** Código producción-ready, JSDoc en JS, diffs claros, análisis de seguridad

---

## 11. Index de Instrucciones Especializadas

Para referencia rápida — lee SOLO la relevante a tu tarea:

- `ai-instructions/ui-ux-specialist.md` — Diseño UI/UX premium
- `ai-instructions/logic-api-specialist.md` — Fetching, estado, queries
- `ai-instructions/database-standards.md` — DDL, RLS, migraciones
- `ai-instructions/database-context.md` — Triggers, funciones, contexto BD
- `ai-instructions/react-standards.md` — React 19, Vite, patterns
- `ai-instructions/refactor-review-specialist.md` — Clean code, deuda técnica
- `ai-instructions/manager.md` — Orquestación multi-dominio
- `ai-instructions/system-prompt.md` — Principios globales (RCCO)
- `ai-instructions/context-map.md` — Mapeo de carpetas (legacy; usa sección 7 arriba)

---

**Última actualización:** 2026-03-19
**Versión:** 1.0 (Orquestador inicial)
