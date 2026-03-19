# Inmotika Specialized Agents Guide

Sistema de agentes especializados configurados en `settings.json` para optimizar la orquestación de tareas en Claude Code.

---

## 🤖 Agentes Disponibles

### 1. **manager** — Orquestador Principal
**Rol:** Analiza la complejidad de la tarea y delega al especialista correcto.

**Cuándo usar:**
- Tareas multi-dominio (UI + lógica + BD)
- No sabes a qué especialista ir
- Necesitas un plan antes de empezar

**Ejemplo:**
```bash
claude manager
> "Necesito implementar un sistema de notificaciones en tiempo real para cambio de estado de propiedades"
```

**Output esperado:**
```
Analizando complejidad... (CoT)
1. UI: Modal/toast de notificación
2. Lógica: Hook para escuchar cambios (real-time)
3. BD: Trigger para detectar cambios, política RLS

Activando: logic-api-specialist para real-time + ui-ux-specialist para UI
```

---

### 2. **ui-ux-specialist** — Diseño Premium
**Rol:** Crea interfaces de lujo con Glassmorphism, gradientes, micro-animaciones.

**Cuándo usar:**
- Nuevos componentes UI/JSX
- Cambios de estilos (Tailwind 4)
- Layouts, modales, cards, botones
- Animaciones y transiciones

**Ejemplo:**
```bash
claude ui-ux-specialist
> "Crea un modal para crear un nuevo cliente con validaciones visuales"
```

**Output esperado:**
```
Consultando: ui-ux-specialist.md + react-standards.md

Componente con:
- Glassmorphism (backdrop-blur, gradientes)
- Micro-animaciones (hovers, transiciones)
- Tailwind 4 nativo (@theme, sin @apply)
- Responsive (mobile → desktop)
- Skeleton/loading states
```

---

### 3. **logic-api-specialist** — Inteligencia Frontend
**Rol:** Maneja fetching, estado, queries, batching, paginación, optimistic updates.

**Cuándo usar:**
- Hooks para fetching de Supabase
- Estado complejo (data, loading, error, isRefetching)
- Paginación o infinite scroll
- Reintentos automáticos
- Optimistic updates

**Ejemplo:**
```bash
claude logic-api-specialist
> "Crea un hook useClientesPaginado que traiga clientes con paginación y buscador"
```

**Output esperado:**
```
Consultando: logic-api-specialist.md + database-standards.md + database-context.md

Hook con:
- Estados (data, loading, error, isRefetching, hasMore)
- Paginación (pageSize, currentPage, offset)
- Búsqueda/filtros
- Reintentos automáticos en fallos
- Validación RLS (verifica políticas en database-context.md)
```

---

### 4. **database-specialist** — Arquitecto de BD
**Rol:** PostgreSQL, RLS, seguridad, schema, triggers, DDL.

**Cuándo usar:**
- Crear/modificar tablas
- Agregar columnas
- Implementar RLS
- Cambios en triggers
- Migraciones
- Auditoría de seguridad

**Ejemplo:**
```bash
claude database-specialist
> "Necesito agregar un campo 'metadata' JSONB a la tabla 'cliente' con RLS"
```

**Output esperado:**
```
Consultando: database-standards.md + database-context.md + reglas-ia.md

1. Actualiza Database/ddl.sql
2. Entrega SQL fragmentado:
   ALTER TABLE cliente ADD COLUMN metadata JSONB DEFAULT '{}';
   CREATE POLICY "Allow metadata update" ON cliente FOR UPDATE
   USING (is_admin_or_coordinator());
3. Usuario ejecuta en Supabase SQL Editor (manual)
```

---

### 5. **refactor-specialist** — Calidad de Código
**Rol:** SOLID, DRY, clean code, deuda técnica, refactorizaciones.

**Cuándo usar:**
- Código duplicado
- Componentes monolíticos
- Hooks que hacen demasiadas cosas
- Nombres de variables confusos
- Anidación profunda
- Deuda técnica general

**Ejemplo:**
```bash
claude refactor-specialist
> "El hook useClientes está duplicado en 3 lugares, refactoriza para consolidar"
```

**Output esperado:**
```
Consultando: refactor-review-specialist.md + system-prompt.md

Análisis:
- Identifica duplicación exacta
- Propone abstracción en /hooks/useClientes.js
- Plan de migración para las 3 ubicaciones
- Comparación "Antes vs Después"
- Impacto estimado
```

---

## 📋 Tabla de Decisión Rápida

| Síntoma | Agente | Razón |
|---------|--------|-------|
| "Necesito un botón bonito" | `ui-ux-specialist` | UI pura |
| "El hook trae datos ineficientes" | `logic-api-specialist` | Optimización de queries |
| "Debo agregar una columna" | `database-specialist` | Schema change + RLS |
| "Hay código duplicado" | `refactor-specialist` | Clean code |
| "No sé por dónde empezar" | `manager` | Planificación CoT |
| "UI + API + BD juntos" | `manager` | Multi-dominio |

---

## 🚀 Flujos de Trabajo Típicos

### Workflow 1: Crear un Feature Completo (UI + Lógica + BD)
```bash
# Paso 1: Planificación
claude manager
> "Necesito un sistema de visitas con calendario, notificaciones y auditoría"

# Paso 2: Implementar UI
claude ui-ux-specialist
> "Crea el calendario y la tarjeta de visita basado en el plan del manager"

# Paso 3: Implementar lógica
claude logic-api-specialist
> "Crea hooks para traer visitas, cambiar estado, notificaciones"

# Paso 4: Implementar BD
claude database-specialist
> "Agregar trigger de auditoría para cambios de estado en visitas"

# Paso 5: Refactorizar
claude refactor-specialist
> "Revisa el código final para deuda técnica"
```

### Workflow 2: Corregir un Bug de Performance
```bash
# Análisis
claude manager
> "El dashboard es lento, ¿por dónde empiezo?"

# Investigación de queries
claude logic-api-specialist
> "¿Hay N+1 queries? ¿Paginación? ¿Debo batching?"

# Verificación de índices
claude database-specialist
> "¿Los índices en WHERE están optimizados?"
```

### Workflow 3: Refactorizar Componentes Legacy
```bash
# Análisis
claude refactor-specialist
> "Este componente tiene 500 líneas, ¿cómo divido?"

# Implementación
claude ui-ux-specialist
> "Crea los sub-componentes atómicos"
```

---

## 🔄 Invocación de Agentes

### Opción 1: Comando directo
```bash
claude [agent-name]
> "Tu tarea aquí"
```

### Opción 2: Contexto en la prompt
```bash
claude
> "Activa al logic-api-specialist para crear un hook de fetching"
```

### Opción 3: Automático (via CLAUDE.md)
```bash
claude
> "Necesito un nuevo botón de borrar con confirmación"
# Claude lee CLAUDE.md § 3 y decide ui-ux-specialist automáticamente
```

---

## 📖 Instrucciones por Agente

Cada agente carga un conjunto de instrucciones específicas:

| Agente | Archivos de Contexto |
|--------|---------------------|
| **manager** | manager.md + system-prompt.md + CLAUDE.md |
| **ui-ux-specialist** | ui-ux-specialist.md + react-standards.md + CLAUDE.md |
| **logic-api-specialist** | logic-api-specialist.md + database-standards.md + database-context.md + CLAUDE.md |
| **database-specialist** | database-standards.md + database-context.md + reglas-ia.md + CLAUDE.md |
| **refactor-specialist** | refactor-review-specialist.md + system-prompt.md + CLAUDE.md |

Cada agente carga **solo sus instrucciones relevantes** (optimización de tokens).

---

## ⚙️ Configuración en settings.json

El archivo `settings.json` define:

```json
{
  "agents": [
    {
      "name": "ui-ux-specialist",
      "systemPrompt": "Eres un Premium Product Designer...",
      "instructions": [
        "ai-instructions/ui-ux-specialist.md",
        "ai-instructions/react-standards.md",
        "CLAUDE.md"
      ]
    },
    // ... más agentes
  ],
  "permissions": {
    "allowed": ["read_files", "write_files", "run_bash_commands", "git_operations"],
    "restricted": [
      { "pattern": "supabase db push", "reason": "..." },
      { "pattern": "supabase migration apply", "reason": "..." }
    ]
  }
}
```

---

## 🎯 Best Practices

### ✅ Do
- Usa **manager** cuando no estés seguro
- Cada agente resuelve **UNA especialidad** bien
- Lee el output del agente y **valida antes de mergear**
- Usa agentes en **paralelo** si son independientes (UI + BD)

### ❌ Don't
- No hagas todas las tareas con un solo agente
- No ignores las restricciones (ej: `supabase db push`)
- No sigas ciegamente el output sin entenderlo
- No esperes que `ui-ux-specialist` resuelva queries (no es su dominio)

---

## 🔍 Verificación

### Chequea que los agentes estén configurados
```bash
claude /agents
# Debería listar: manager, ui-ux-specialist, logic-api-specialist, database-specialist, refactor-specialist
```

### Prueba un agente
```bash
claude ui-ux-specialist
> "¿Cuáles son tus reglas principales?"
```

Expected output:
```
Soy un Premium Product Designer. Mis reglas principales son:
1. Glassmorphism & Gradients
2. Micro-animations
3. Typography & Spacing
4. Responsive Magic
...
```

---

## 📚 Referencia Rápida

```bash
# Crear componente
claude ui-ux-specialist

# Crear hook de fetching
claude logic-api-specialist

# Modificar schema
claude database-specialist

# Refactorizar código
claude refactor-specialist

# Planificar tarea compleja
claude manager

# Ayuda general
claude
```

---

**Versión:** 1.0
**Fecha:** 2026-03-19
**Status:** ✅ Activo

Los agentes están listos para optimizar tu flujo de trabajo en Inmotika.
