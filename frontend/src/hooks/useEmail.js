import { supabase } from '../utils/supabase';

/**
 * @typedef {'cliente_creado'|'usuario_creado'|'contacto_acceso'|'solicitud_visita'|'visita_programada'|'visita_iniciada'|'visita_finalizada'} EmailType
 */

/**
 * @typedef {Object} ActorContext
 * @property {string} actorId       - perfil_usuario.id del usuario que ejecuta la acción
 * @property {string} actorRole     - código del rol: 'COORDINADOR' | 'DIRECTOR'
 * @property {string} [clienteId]   - UUID del cliente relacionado a la acción (opcional)
 * @property {string} [sucursalId]  - UUID de la sucursal relacionada a la acción (opcional)
 */

/**
 * @typedef {Object} EmailRecipients
 * @property {string}   destinatario  - Email principal (To)
 * @property {string[]} cc            - Emails en copia (CC), sin duplicados
 */

// ─── Queries primitivas ───────────────────────────────────────────────────────

/** Emails de todos los directores activos (supervisión global). */
async function fetchDirectorEmails() {
  const { data } = await supabase
    .from('director')
    .select('perfil:usuario_id(email)')
    .eq('activo', true);
  return (data || []).map(d => d.perfil?.email).filter(Boolean);
}

/** Email del director asignado a un coordinador via coordinador_director. */
async function fetchDirectorEmailByCoordinador(coordinadorUsuarioId) {
  if (!coordinadorUsuarioId) return [];
  // Obtener el id interno del coordinador
  const { data: cooRow } = await supabase
    .from('coordinador')
    .select('id')
    .eq('usuario_id', coordinadorUsuarioId)
    .eq('activo', true)
    .maybeSingle();
  if (!cooRow?.id) return [];
  // Leer directores asignados via coordinador_director
  const { data } = await supabase
    .from('coordinador_director')
    .select('director:director_id(perfil:usuario_id(email))')
    .eq('coordinador_id', cooRow.id)
    .eq('activo', true);
  return (data || []).map(r => r.director?.perfil?.email).filter(Boolean);
}

/** Emails de los directores activos asignados a un cliente. */
async function fetchDirectorEmailsByCliente(clienteId) {
  if (!clienteId) return [];
  const { data } = await supabase
    .from('cliente_director')
    .select('director:director_id(perfil:usuario_id(email))')
    .eq('cliente_id', clienteId)
    .eq('activo', true);
  return (data || []).map(r => r.director?.perfil?.email).filter(Boolean);
}

/** Emails de los coordinadores activos asignados a una sucursal. */
async function fetchCoordinadorEmailsBySucursal(sucursalId) {
  if (!sucursalId) return [];
  const { data } = await supabase
    .from('sucursal_coordinador')
    .select('coordinador:coordinador_id(perfil:usuario_id(email))')
    .eq('sucursal_id', sucursalId);
  return (data || []).map(r => r.coordinador?.perfil?.email).filter(Boolean);
}

/** Emails de los técnicos asignados a una visita. */
async function fetchTecnicoEmailsByVisita(visitaId) {
  if (!visitaId) return [];
  const { data } = await supabase
    .from('visita_tecnico')
    .select('tecnico:tecnico_id(perfil:usuario_id(email))')
    .eq('visita_id', visitaId);
  return (data || []).map(r => r.tecnico?.perfil?.email).filter(Boolean);
}

/** Emails de los contactos activos de una sucursal. */
async function fetchContactoEmailsBySucursal(sucursalId) {
  if (!sucursalId) return [];
  const { data } = await supabase
    .from('contacto_sucursal')
    .select('contacto:contacto_id(email)')
    .eq('sucursal_id', sucursalId)
    .eq('activo', true);
  return (data || []).map(r => r.contacto?.email).filter(Boolean);
}

// ─── Lógica de supervisión por rol ───────────────────────────────────────────

/**
 * Dado el contexto del actor, devuelve los emails que deben ir en CC
 * por razones de supervisión y auditoría:
 *
 * - Siempre: todos los directores activos
 * - Si el actor es COORDINADOR: también el director asignado a ese coordinador específico
 * - Si el actor es DIRECTOR: solo directores globales (él mismo ya es parte de la cadena)
 *
 * Los emails del propio actor y del destinatario principal se deduplicarán
 * al llamar a buildRecipients().
 *
 * @param {ActorContext} actor
 * @returns {Promise<string[]>}
 */
export async function getSupervisorCCs(actor) {
  const [globalDirectorEmails, assignedDirectorEmails] = await Promise.all([
    fetchDirectorEmails(),
    actor.actorRole === 'COORDINADOR'
      ? fetchDirectorEmailByCoordinador(actor.actorId)
      : Promise.resolve([]),
  ]);
  return [...new Set([...globalDirectorEmails, ...assignedDirectorEmails])];
}

/**
 * Devuelve todos los emails relevantes para eventos de visita
 * (contactos de la sucursal + coordinadores de la sucursal +
 * directores del cliente + supervisores del actor).
 *
 * @param {ActorContext} actor
 * @returns {Promise<string[]>}
 */
export async function getVisitaEmailRecipients(actor) {
  const [contactEmails, coordEmails, directorEmails, supervisorEmails, tecnicoEmails] = await Promise.all([
    fetchContactoEmailsBySucursal(actor.sucursalId),
    fetchCoordinadorEmailsBySucursal(actor.sucursalId),
    fetchDirectorEmailsByCliente(actor.clienteId),
    getSupervisorCCs(actor),
    fetchTecnicoEmailsByVisita(actor.visitaId),
  ]);
  return [...contactEmails, ...coordEmails, ...directorEmails, ...supervisorEmails, ...tecnicoEmails];
}

/**
 * Devuelve los emails para notificaciones de avance por dispositivo:
 * solo contactos de la sucursal + responsable de la visita (coordinador o director).
 * No incluye técnicos ni supervisores globales para no saturar.
 *
 * @param {{ sucursalId: string, responsableEmail: string|null }} opts
 * @returns {Promise<string[]>}
 */
export async function getAvanceDispositivoRecipients({ sucursalId, responsableEmail }) {
  const contactEmails = await fetchContactoEmailsBySucursal(sucursalId);
  const all = [...contactEmails];
  if (responsableEmail) all.push(responsableEmail);
  return [...new Set(all.filter(Boolean))];
}

/**
 * Devuelve todos los emails relevantes para eventos de solicitud de visita
 * (coordinadores activos + directores del cliente + supervisores del actor).
 *
 * @param {ActorContext} actor
 * @returns {Promise<string[]>}
 */
export async function getSolicitudVisitaEmailRecipients(actor) {
  const [coordRows, directorEmails, supervisorEmails] = await Promise.all([
    supabase
      .from('coordinador')
      .select('perfil:usuario_id(email)')
      .eq('activo', true)
      .limit(20)
      .then(r => r.data || []),
    fetchDirectorEmailsByCliente(actor.clienteId),
    getSupervisorCCs(actor),
  ]);
  const coordEmails = coordRows.map(c => c.perfil?.email).filter(Boolean);
  return [...coordEmails, ...directorEmails, ...supervisorEmails];
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Dado un destinatario principal y una lista extra de CCs, devuelve
 * { destinatario, cc } sin duplicados y sin vacíos.
 * Si el destinatario ya está en los CCs, se elimina de ellos.
 *
 * @param {string} destinatario
 * @param {string[]} extraCCs
 * @returns {EmailRecipients}
 */
export function buildRecipients(destinatario, extraCCs = []) {
  const cc = [...new Set(extraCCs.filter(e => Boolean(e) && e !== destinatario))];
  return { destinatario, cc };
}

// ─── Envío ────────────────────────────────────────────────────────────────────

/**
 * Envía un correo transaccional via la Edge Function send-email.
 *
 * @param {EmailType} type
 * @param {Record<string, string>} data - Debe incluir `destinatario`.
 * @param {string[]} [cc]
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
 * Versión fire-and-forget de sendEmail para usar en flujos async donde el email
 * no debe bloquear ni propagar errores al caller.
 * Los errores se loguean pero nunca se lanzan.
 *
 * @param {EmailType} type
 * @param {Record<string, string>} data
 * @param {string[]} [cc]
 */
export function fireAndForgetEmail(type, data, cc = []) {
  sendEmail(type, data, cc).catch(err =>
    console.error(`[fireAndForgetEmail] Error enviando "${type}":`, err)
  );
}

/**
 * Hook centralizado para enviar correos transaccionales.
 * @example
 * const { sendEmail } = useEmail();
 */
export const useEmail = () => ({ sendEmail });
