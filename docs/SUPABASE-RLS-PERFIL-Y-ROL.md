# Cómo revisar y corregir RLS en Supabase (perfil_usuario y rol)

Si el usuario técnico sale como "CLIENTE" o la consulta de perfil llega vacía, suele ser por **RLS (Row Level Security)**. Aquí cómo revisarlo en el dashboard de Supabase.

---

## 1. Entrar a Supabase

1. Abre [https://supabase.com/dashboard](https://supabase.com/dashboard) e inicia sesión.
2. Elige tu **proyecto** (Inmotika).
3. En el menú izquierdo ve a **Table Editor** (o **SQL Editor** para hacer cambios por SQL).

---

## 2. Ver si RLS está activo

1. En **Table Editor**, abre la tabla **`perfil_usuario`**.
2. Arriba de la tabla suele aparecer un aviso si **RLS está enabled** (y a veces un botón "View policies").
3. O en el menú izquierdo: **Authentication** → **Policies** (o **Database** → **Tables** → `perfil_usuario` → pestaña o sección **Policies**).

---

## 3. Políticas necesarias para que el usuario vea su propio perfil y rol

Cada usuario autenticado debe poder:

- **SELECT** su propia fila en `perfil_usuario` (donde `id = auth.uid()`).
- **SELECT** en `catalogo_rol` (para mostrar el nombre del rol).

### Opción A: Desde el dashboard (Policies)

1. **Database** → **Tables** → **perfil_usuario**.
2. Si hay una sección **RLS** o **Policies**:
   - Comprueba que exista una política que permita **SELECT** cuando `id = auth.uid()`.
   - Si no existe, créala (por ejemplo "Users can read own profile") con expresión:  
     `(auth.uid() = id)` para **SELECT**.
3. **Database** → **Tables** → **catalogo_rol**:
   - Debe haber una política que permita **SELECT** a usuarios autenticados (o a todos si es catálogo público). Por ejemplo:  
     `auth.role() = 'authenticated'` para **SELECT**.

### Opción B: Con SQL (recomendado para tenerlo en migraciones)

En **SQL Editor** puedes ejecutar:

```sql
-- 1. Activar RLS en perfil_usuario (si no está)
ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;

-- 2. Política: el usuario puede leer su propia fila
CREATE POLICY "Usuario puede leer su propio perfil"
ON perfil_usuario FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. catalogo_rol: lectura para autenticados (catálogo público)
ALTER TABLE catalogo_rol ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura catalogo_rol para autenticados"
ON catalogo_rol FOR SELECT
TO authenticated
USING (true);
```

(Si ya tienes políticas con otros nombres, adapta o elimina las viejas para no duplicar.)

---

## 4. Comprobar que funciona

1. En **SQL Editor** ejecuta (sustituye `TU_USER_ID` por el `id` del usuario técnico en `auth.users` o en `perfil_usuario`):

```sql
SELECT id, rol_id, nombres, apellidos, email
FROM perfil_usuario
WHERE id = 'TU_USER_ID';
```

2. Si devuelve una fila: la tabla y RLS permiten leer ese perfil.
3. Si devuelve 0 filas: o no existe esa fila en `perfil_usuario`, o una política RLS lo está impidiendo (por ejemplo falta la política de SELECT con `auth.uid() = id`).

---

## 5. Resumen

| Problema | Revisar |
|--------|--------|
| Consulta perfil vacía / usuario sale como CLIENTE | RLS en `perfil_usuario`: política SELECT con `auth.uid() = id`. |
| Rol no se muestra | RLS en `catalogo_rol`: política SELECT para `authenticated`. |
| Trigger que crea `perfil_usuario` | En **Database** → **Triggers**, que exista un trigger que inserte en `perfil_usuario` al crearse el usuario en `auth.users` (invite/signup). |

Si quieres, el siguiente paso puede ser crear una **migración** en tu repo con el SQL anterior para que RLS quede versionado y aplicado en todos los entornos.
