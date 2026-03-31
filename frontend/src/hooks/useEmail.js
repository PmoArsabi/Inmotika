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
 * Obtiene los emails de todos los administradores activos.
 * @returns {Promise<string[]>}
 */
export async function getAdminEmails() {
  const { data } = await supabase
    .from('administrador')
    .select('perfil:usuario_id(email)')
    .eq('activo', true);
  return (data || []).map(a => a.perfil?.email).filter(Boolean);
}

/**
 * Dado el usuario_id de un coordinador, devuelve el email del director
 * al que está asignado (si existe).
 *
 * @param {string} coordinadorUsuarioId - perfil_usuario.id del coordinador
 * @returns {Promise<string[]>} - array con 0 o 1 email
 */
export async function getDirectorEmailByCoordinador(coordinadorUsuarioId) {
  if (!coordinadorUsuarioId) return [];
  const { data } = await supabase
    .from('coordinador')
    .select('director:director_id(perfil:usuario_id(email))')
    .eq('usuario_id', coordinadorUsuarioId)
    .eq('activo', true)
    .maybeSingle();
  const email = data?.director?.perfil?.email;
  return email ? [email] : [];
}

/**
 * Dado un cliente_id, devuelve los emails de los directores activos asignados.
 * @param {string} clienteId
 * @returns {Promise<string[]>}
 */
export async function getDirectorEmailsByCliente(clienteId) {
  if (!clienteId) return [];
  const { data } = await supabase
    .from('cliente_director')
    .select('director:director_id(perfil:usuario_id(email))')
    .eq('cliente_id', clienteId)
    .eq('activo', true);
  return (data || []).map(r => r.director?.perfil?.email).filter(Boolean);
}

/**
 * Dado un sucursal_id, devuelve los emails de los coordinadores activos asignados.
 * @param {string} sucursalId
 * @returns {Promise<string[]>}
 */
export async function getCoordinadorEmailsBySucursal(sucursalId) {
  if (!sucursalId) return [];
  const { data } = await supabase
    .from('sucursal_coordinador')
    .select('coordinador:coordinador_id(perfil:usuario_id(email))')
    .eq('sucursal_id', sucursalId);
  return (data || []).map(r => r.coordinador?.perfil?.email).filter(Boolean);
}

/**
 * Combina destinatario principal + cc únicos y sin vacíos.
 * Retorna { destinatario, cc } listo para sendEmail.
 *
 * @param {string[]} emails - Lista completa de emails (el primero será destinatario)
 * @returns {{ destinatario: string, cc: string[] } | null} - null si no hay emails
 */
export function splitEmailRecipients(emails) {
  const unique = [...new Set(emails.filter(Boolean))];
  if (!unique.length) return null;
  return { destinatario: unique[0], cc: unique.slice(1) };
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
