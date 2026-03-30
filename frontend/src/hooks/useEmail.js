import { supabase } from '../utils/supabase';

/**
 * @typedef {'cliente_creado'|'usuario_creado'|'contacto_acceso'|'solicitud_visita'|'visita_programada'|'visita_iniciada'|'visita_finalizada'} EmailType
 */

/**
 * Envía un correo transaccional via la Edge Function send-email.
 * Función standalone — usable en hooks, apis y fuera de componentes React.
 * Fire-and-forget: los errores solo se loguean; nunca bloquean el flujo principal.
 *
 * @param {EmailType} type - Tipo de correo a enviar
 * @param {Record<string, string>} data - Datos del template. Siempre debe incluir `destinatario`.
 * @param {string[]} [cc] - Emails adicionales en copia (CC). Se envía un solo correo con todos.
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmail(type, data, cc = []) {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { type, data: { ...data, cc } },
    });
    if (error) throw error;
    return result ?? { success: true };
  } catch (err) {
    console.error(`[sendEmail] Error enviando correo tipo "${type}":`, err);
    return { success: false, error: err?.message };
  }
}

/**
 * Hook centralizado para enviar correos transaccionales.
 * Reutiliza sendEmail standalone; útil en componentes que prefieren hooks.
 *
 * @example
 * const { sendEmail } = useEmail();
 * await sendEmail('visita_programada', { destinatario: 'x@x.com', clienteNombre: 'Empresa' });
 */
export const useEmail = () => ({ sendEmail });
