# Error "email rate limit exceeded" al invitar usuarios

## ¿Por qué pasa?

Supabase (y muchos proveedores) limitan **cuántos correos de autenticación** se pueden enviar en un periodo (p. ej. por hora). Esos correos incluyen:

- Invitaciones a nuevos usuarios (`invite-user`)
- Restablecimiento de contraseña
- Confirmación de email

Cuando se supera ese límite, la API devuelve **"email rate limit exceeded"**. No es un fallo del código ni de la configuración que “estaba bien”; es que se alcanzó el límite (por ejemplo al probar varias veces “Crear usuario” o “Reenviar invitación”).

## Qué hacer

1. **Esperar**  
   El límite suele ser por hora. Esperar 30–60 minutos y volver a intentar.

2. **Revisar el plan de Supabase**  
   En [Dashboard](https://supabase.com/dashboard) → tu proyecto → **Settings** → **Billing** (o **Usage**) puedes ver límites de email según tu plan.

3. **Evitar muchas pruebas seguidas**  
   En desarrollo, no hacer muchas invitaciones seguidas; si hace falta probar, usar el mismo correo o esperar entre pruebas.

4. **Producción**  
   En producción, el límite suele ser suficiente si no se abusa. Si necesitas más volumen, hay que revisar el plan o usar un proveedor de email externo configurado en Supabase.

## ¿Cuánto falta para que se reinicie el límite?

Supabase **no muestra** en el dashboard un contador tipo “quedan X minutos para refrescar” ni “emails enviados esta hora”. El límite suele ser **por hora** (ventana deslizante). Si te han bloqueado, lo seguro es **esperar ~1 hora** antes de volver a enviar invitaciones o correos de auth.

## Evitar múltiples envíos desde la app

Si en los logs de Auth ves muchas peticiones `/invite` en pocos segundos (p. ej. varias con 422 “user already registered”), suele ser por **doble clic** o varios clics antes de que el botón se deshabilite. En la app se ha añadido un guard con `useRef` para que, aunque se dispare el guardado varias veces muy rápido, **solo se envíe una invitación** por flujo (crear usuario / guardar contacto con “dar acceso”). Así se evita consumir el límite y saturar los logs.

## Resumen

- El correo **no falló por un cambio en el front**: el envío se intentó y Supabase rechazó por límite.
- Solución inmediata: esperar ~1 h y reintentar (Supabase no muestra “tiempo restante”).
- En la app: guard contra doble envío para no disparar varias invitaciones por doble clic.
- A largo plazo: tener en cuenta el límite del plan y no disparar muchas invitaciones en poco tiempo en pruebas.
