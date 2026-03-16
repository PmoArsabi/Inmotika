# Informe: duplicación de lógica de guardado (crear / editar)

**Alcance:** Módulos ya conectados a Supabase: **Usuarios AP**, **Clientes** (y entidades relacionadas: sucursal, contacto, técnico, dispositivo).  
**Objetivo:** Detectar código duplicado entre flujos de creación y edición, y oportunidades de simplificación.

---

## 1. Resumen ejecutivo

| Módulo / entidad | ¿Duplicación? | Ubicación duplicada | Impacto | Estado actual |
|------------------|---------------|---------------------|---------|----------------|
| **Sucursal** | ~~Sí~~ No (ya refactorizado) | — | — | ✅ `api/sucursalApi.js` |
| **Cliente** | Parcial (mismo archivo) | `ClientNavigator.jsx` | Medio | Ramas crear/editar repetitivas |
| **Técnico** | **Sí (alta)** | `TechnicalNavigator.jsx` y `useUsers.js` | Alto | Misma lógica en 2 sitios |
| **Usuarios AP (perfil + roles)** | No duplicado con técnico | `useUsers.js` solo | — | Un solo flujo, pero técnico duplicado |
| **Contacto** | Parcial (mismo archivo) | `ContactNavigator.jsx` | Bajo | Ramas crear/editar en un handler |
| **Dispositivo** | N/A | `DeviceNavigator.jsx` | — | Sin persistencia real (simulado) |

---

## 2. Sucursal (ya refactorizado)

- **Situación:** La lógica de guardado (payload, insert/update, contratos + PDFs) estaba duplicada entre `ClientNavigator` (pestaña Sucursal) y `BranchNavigator`.
- **Solución aplicada:** Se extrajo a `frontend/src/api/sucursalApi.js`: `saveSucursal()`, `buildSucursalPayload()`, `syncSucursalContracts()`, `isNewSucursalId()`.
- **Resultado:** Un solo punto de verdad; crear y editar usan la misma función. No hay acción pendiente.

---

## 3. Cliente

**Archivo:** `frontend/src/components/configuration/navigators/ClientNavigator.jsx`

### Duplicación detectada

- **Mismo componente:** En `handleSave` hay dos ramas (crear vs editar) que repiten la misma secuencia:
  1. `syncClientFiles(clientId, draft)`
  2. `syncClientOtrosDocumentos(clientId, draft)`
  3. Construcción de `savedData` y actualización de `setData` / `setDrafts` / `setStack` con lógica muy similar.

- **No hay** otro archivo que guarde cliente; la duplicación es **interna** (dos bloques if/else con flujo paralelo).

### Impacto

- **Riesgo:** Cambios en campos de cliente, en archivos (logo, RUT, cert, otros documentos) o en desactivación de `cliente_documento` obligan a tocar un solo archivo, pero dos bloques. Riesgo de olvidar uno al modificar.
- **Mantenibilidad:** Media; el archivo es largo y el flujo de guardado podría simplificarse.

### Recomendación

- Extraer a **`frontend/src/api/clienteApi.js`**:
  - `buildClientePayload(draft, tipoPersonaId)`
  - `syncClientFiles(clientId, draft)` (ya existe como función en el navigator; moverla)
  - `syncClientOtrosDocumentos(clientId, draft)` (igual)
  - `saveCliente({ clientId, draft, tipoPersonaId })` → insert o update, luego sync de archivos y otros documentos; devolver `{ clientId, savedData }`.
- En `ClientNavigator`, `handleSave` solo llamaría a `saveCliente()` y aplicaría el resultado al estado (setData, setDrafts, setStack, setSavedClientId). Se unificaría crear y editar en un solo flujo.

**Impacto estimado:** Medio. Reduce duplicación interna y deja lista una API reutilizable si en el futuro otro flujo (ej. otro módulo) guarda cliente.

---

## 4. Técnico / Usuarios AP (rol TÉCNICO)

**Archivos afectados:**

- `frontend/src/components/configuration/navigators/TechnicalNavigator.jsx` (flujo Configuración → Técnico)
- `frontend/src/hooks/useUsers.js` (flujo Usuarios AP → Editar usuario con rol Técnico)

### Duplicación detectada

La lógica de **persistencia del técnico** está duplicada entre ambos:

| Acción | TechnicalNavigator | useUsers.js (saveUser, rol TECNICO) |
|--------|--------------------|--------------------------------------|
| Actualizar `perfil_usuario` | ✅ (nombres, apellidos, telefono, avatar_url, estado_id, tipo_documento, identificacion) | ✅ (nombres, apellidos, telefono, tipo_documento, identificacion; sin avatar_url/estado_id en edición desde UsersPage) |
| Asegurar registro `tecnico` (insert si no existe) | ✅ | ✅ |
| Subir y sincronizar cédula | ✅ `uploadAndSyncFile` → `documento_cedula_url` | ✅ Igual |
| Subir y sincronizar planilla SS | ✅ `uploadAndSyncFile` → `planilla_seg_social_url` | ✅ Igual |
| Upsert `tecnico_certificado` + subir PDF | ✅ bucle + `uploadAndSyncFile` | ✅ Mismo bucle |
| Desactivar certificados no incluidos | ✅ `update({ activo: false }).not('id','in',...)` | ✅ Igual |

Las diferencias son sobre todo de **origen de datos** (draft en TechnicalNavigator vs `newUser` + `tecnicoDocumentos` en useUsers), no de lógica de BD/Storage.

### Impacto

- **Alto:** Cualquier cambio en:
  - columnas de `tecnico` o `tecnico_certificado`,
  - rutas de storage (`tecnicos/{id}/...`),
  - reglas de activo/inactivo,
  debe replicarse en **dos archivos**. Es fácil que queden desincronizados.
- **Bugs:** Si se corrige un bug en uno (ej. manejo de certificados sin archivo), el otro puede seguir con el bug.

### Recomendación

- Crear **`frontend/src/api/tecnicoApi.js`** (o un módulo `usuarioApi.js` con una sección técnico) con:
  - `ensureTecnicoRecord(usuarioId)` → devuelve `techId` (existente o recién insertado).
  - `syncTecnicoFiles(techId, { documentoCedulaUrl, planillaSegSocialUrl })` → sube cédula y planilla, actualiza `tecnico`.
  - `syncTecnicoCertificados(techId, certificados)` → upsert certificados, subida de PDFs, desactivar los que no estén en la lista.
  - `saveTecnico({ usuarioId, techId, draft })` (draft con nombres, apellidos, telefono, estado_id, tipo_documento, identificacion, avatar_url, documentoCedulaUrl, planillaSegSocialUrl, certificados) que:
    - actualice `perfil_usuario`,
    - llame a `ensureTecnicoRecord`, luego `syncTecnicoFiles` y `syncTecnicoCertificados`,
    - devuelva `{ techId, ... }` para que el llamador actualice estado/UI.
- **TechnicalNavigator:** reemplazar el cuerpo de `handleSave` por una llamada a `saveTecnico({ usuarioId, techId: draft.id, draft })` y aplicar el resultado a `setData` / `setStack`.
- **useUsers.saveUser:** cuando `newUser.rol === ROLES.TECNICO`, en lugar del bloque actual (ensure tecnico, upload cedula/planilla, sync certificados), llamar a `saveTecnico` con un draft construido desde `newUser` + `tecnicoDocumentos`. El resto de roles (coordinador, director, admin) puede seguir en useUsers.

**Impacto estimado:** Alto. Elimina la única duplicación fuerte entre dos flujos de UI y centraliza reglas de negocio del técnico.

---

## 5. Contacto

**Archivo:** `frontend/src/components/configuration/navigators/ContactNavigator.jsx`

### Duplicación detectada

- **Mismo archivo:** `handleSave` tiene:
  - Si `isRealId` → `update` en `contacto`; si no → `insert` y se obtiene `contactId`.
  - Luego, en ambos casos: borrado de `contacto_sucursal` para ese contacto e inserción de los bridges.
  - Opcional: invitación con `invite-user` si aplica.

No hay otro módulo que persista contactos; la duplicación es solo el par insert/update en un solo handler.

### Impacto

- **Bajo:** Un solo archivo; el flujo es corto y claro. El riesgo de desincronizar crear/editar es menor.

### Recomendación

- Opcional: extraer **`frontend/src/api/contactoApi.js`** con:
  - `buildContactoPayload(draft, estadoId)` (o similar),
  - `saveContacto({ contactId, clienteId, draft })` → insert o update en `contacto`, luego sincronizar `contacto_sucursal`, devolver `contactId`.
- El invitación (`invite-user`) puede quedar en el navigator o recibir un flag desde la API según diseño.

**Impacto estimado:** Bajo. Mejora consistencia con el patrón usado en sucursal/cliente y facilita tests o reutilización futura.

---

## 6. Dispositivo

**Archivo:** `frontend/src/components/configuration/navigators/DeviceNavigator.jsx`

### Situación

- `handleSave` **no persiste en Supabase**: hace `await new Promise(r => setTimeout(r, 400))` y luego `setData(applyDeviceUpsert(...))`. Solo actualiza estado en memoria.
- No hay creación/edición real contra BD, por tanto **no hay duplicación de lógica de guardado** todavía.

### Recomendación

- Cuando se conecte a Supabase, implementar **`frontend/src/api/dispositivoApi.js`** desde el inicio con `saveDispositivo(...)` y usar ese módulo en `DeviceNavigator`, para no repetir el patrón de sucursal/cliente.

---

## 7. Usuarios AP (perfil_usuario y otros roles)

**Archivo:** `frontend/src/hooks/useUsers.js`

### Situación

- **Crear usuario:** `invite-user` + actualización diferida de perfil (telefono, tipo_documento, identificacion). No hay otro lugar que cree usuario de la misma forma.
- **Editar usuario:** actualización de `perfil_usuario` (nombres, apellidos, rol_id, telefono, etc.); luego, según rol, lógica para técnico, coordinador, director, administrador y desactivación de roles anteriores.
- La **única duplicación relevante** es la parte **técnico**, ya descrita en la sección 4. El resto (coordinador, director, administrador) vive solo en useUsers.

### Recomendación

- Unificar **solo la parte técnico** con `tecnicoApi.js` como se indicó arriba.
- El resto del flujo de usuarios (invite, perfil, coordinador/director/admin) puede seguir en useUsers a menos que se quiera extraer un `usuarioApi.js` más amplio en el futuro.

---

## 8. Resumen de acciones recomendadas

| Prioridad | Acción | Archivos a crear/modificar | Beneficio |
|-----------|--------|----------------------------|-----------|
| **Alta** | Extraer API de técnico y usarla en TechnicalNavigator y useUsers | Crear `api/tecnicoApi.js`; modificar `TechnicalNavigator.jsx`, `useUsers.js` | Eliminar duplicación entre Config y Usuarios AP |
| **Media** | Extraer API de cliente | Crear `api/clienteApi.js`; modificar `ClientNavigator.jsx` | Un solo flujo crear/editar, código más claro |
| **Baja** | Extraer API de contacto (opcional) | Crear `api/contactoApi.js`; modificar `ContactNavigator.jsx` | Consistencia y preparación para reutilización |
| **Futuro** | Al conectar dispositivo a Supabase | Crear `api/dispositivoApi.js`; modificar `DeviceNavigator.jsx` | Evitar duplicación desde el inicio |

---

## 9. Situación actual (rápida referencia)

- **Sucursal:** ✅ Centralizado en `api/sucursalApi.js`.
- **Cliente:** Lógica en `ClientNavigator.jsx`; ramas crear/editar repetitivas; candidato a `api/clienteApi.js`.
- **Técnico:** ❌ Duplicado en `TechnicalNavigator.jsx` y `useUsers.js`; candidato a `api/tecnicoApi.js`.
- **Contacto:** Un solo handler en `ContactNavigator.jsx`; opcional extraer a API.
- **Dispositivo:** Sin persistencia real; al añadirla, usar API desde el inicio.
- **Usuarios AP (resto):** Sin duplicación con otros módulos; solo unificar la parte técnico con la API anterior.

Este informe refleja el estado del código tras la refactorización de sucursal y la revisión de los módulos indicados.
