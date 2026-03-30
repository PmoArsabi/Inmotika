import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { ROLES } from '../utils/constants';
import { saveTecnico } from '../api/tecnicoApi';
import { syncCoordinadorSucursales } from '../api/coordinadorSucursalApi';
import { sendEmail } from './useEmail';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Milisegundos máximos para esperar respuesta de la Edge Function invite-user. */
const INVITE_USER_TIMEOUT_MS = 35_000;

/** Número máximo de intentos del polling post-invitación. */
const POLL_MAX_ATTEMPTS = 10;

/** Milisegundos entre cada intento del polling. */
const POLL_INTERVAL_MS = 500;

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

/**
 * Hook de gestión de usuarios de Inmotika.
 *
 * Responsabilidades:
 * 1. Carga inicial de usuarios (perfil_usuario + joins de rol/estado/tecnico).
 * 2. Carga de catálogo de roles y lista de directores activos.
 * 3. Invitar usuario nuevo via Edge Function, con polling cancelable para
 *    esperar que el trigger `handle_new_user` cree el perfil.
 * 4. Actualizar usuario existente (solo perfil_usuario.rol_id para cambios de
 *    rol; el trigger `sync_specialized_role_tables` sincroniza las tablas de
 *    especialización automáticamente).
 * 5. Eliminar usuario y reenviar invitación.
 *
 * @returns {{
 *   usuarios: Array,
 *   loadingUsers: boolean,
 *   roles: Array,
 *   loadingRoles: boolean,
 *   successInfo: object|null,
 *   setSuccessInfo: Function,
 *   resendingIds: Set,
 *   handleResendInvitation: Function,
 *   handleDelete: Function,
 *   saveUser: Function,
 *   fetchUsers: Function,
 *   activeDirectors: Array,
 *   loadingActiveDirectors: boolean
 * }}
 */
export const useUsers = () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [activeDirectors, setActiveDirectors] = useState([]);
  const [loadingActiveDirectors, setLoadingActiveDirectors] = useState(false);

  const [successInfo, setSuccessInfo] = useState(null);
  const [resendingIds, setResendingIds] = useState(new Set());

  /** Ref para evitar múltiples invitaciones en vuelo simultáneas. */
  const inviteInFlightRef = useRef(false);

  const { user } = useAuth();
  const notify = useNotify();
  const confirm = useConfirm();

  // ---------------------------------------------------------------------------
  // Section: Catálogo de roles
  // ---------------------------------------------------------------------------

  /**
   * Carga todos los roles disponibles desde `catalogo_rol`.
   * RLS: lectura pública (sin restricción de rol).
   */
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    const { data, error } = await supabase
      .from('catalogo_rol')
      .select('id, codigo, nombre')
      .order('nombre');

    if (data) setRoles(data);
    if (error) console.error('[useUsers] Error al cargar roles:', error);
    setLoadingRoles(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Section: Directores activos
  // ---------------------------------------------------------------------------

  /**
   * Carga los directores activos con su información de perfil.
   * RLS: requiere estar autenticado (is_management_staff para gestión plena).
   *
   * @returns {Promise<void>}
   */
  const fetchActiveDirectors = useCallback(async () => {
    setLoadingActiveDirectors(true);
    try {
      const { data, error } = await supabase
        .from('director')
        .select(`
          id,
          usuario_id,
          usuario:perfil_usuario!director_usuario_id_fkey (nombres, apellidos, email)
        `)
        .eq('activo', true);

      if (error) {
        console.error('[useUsers] fetchActiveDirectors error:', error);
        return;
      }

      if (data) {
        const mapped = data.map(d => ({
          id: d.id,
          usuarioId: d.usuario_id,
          nombres: d.usuario?.nombres || '',
          apellidos: d.usuario?.apellidos || '',
          email: d.usuario?.email || '',
          nombreCompleto: d.usuario
            ? `${d.usuario.nombres || ''} ${d.usuario.apellidos || ''}`.trim()
            : 'Sin Nombre',
        }));
        setActiveDirectors(mapped);
      }
    } catch (err) {
      console.error('[useUsers] fetchActiveDirectors system error:', err);
    } finally {
      setLoadingActiveDirectors(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Section: Lista de usuarios
  // ---------------------------------------------------------------------------

  /**
   * Carga todos los perfiles de usuario con sus relaciones de rol, estado,
   * datos de técnico (documentos + certificados activos), coordinador y director.
   *
   * RLS: is_management_staff() — solo Admin, Director y Coordinador ven todos.
   *
   * @returns {Promise<void>}
   */
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data: usersData, error } = await supabase
      .from('perfil_usuario')
      .select(`
        id, nombres, apellidos, email, telefono, tipo_documento, identificacion, avatar_url,
        catalogo_rol (id, codigo, nombre),
        catalogo_estado_general (id, codigo, nombre, activo),
        tecnico!tecnico_usuario_id_fkey (
          id,
          documento_cedula_url, planilla_seg_social_url,
          tecnico_certificado (id, nombre, url, activo)
        ),
        coordinador!coordinador_usuario_id_fkey (
          id,
          director_id,
          activo,
          director!coordinador_director_id_fkey (usuario_id),
          sucursal_coordinador!sucursal_coordinador_coordinador_id_fkey (sucursal_id, activo)
        ),
        director!director_usuario_id_fkey (id, activo)
      `)
      .order('nombres');

    if (error) {
      console.error('[useUsers] fetchUsers error:', error);
    }

    if (usersData) {
      setUsuarios(usersData.map(u => {
        const techArr = Array.isArray(u.tecnico)
          ? u.tecnico
          : u.tecnico ? [u.tecnico] : [];
        const tec = techArr.find(t => t.activo) || techArr[0] || null;

        const coordArr = Array.isArray(u.coordinador)
          ? u.coordinador
          : u.coordinador ? [u.coordinador] : [];
        const coo = coordArr.find(c => c.activo) || coordArr[0] || null;

        const dirArr = Array.isArray(u.director)
          ? u.director
          : u.director ? [u.director] : [];
        const dir = dirArr.find(d => d.activo) || dirArr[0] || null;

        const certs = tec?.tecnico_certificado
          ? tec.tecnico_certificado.filter(c => c.activo)
          : [];

        return {
          ...u,
          rol: u.catalogo_rol?.codigo || '',
          rolNombre: u.catalogo_rol?.nombre || '',
          activo: u.catalogo_estado_general?.activo ?? true,
          estado: u.catalogo_estado_general?.codigo || '',
          estadoNombre: u.catalogo_estado_general?.nombre || '',
          tecnicoId: tec?.id || null,
          coordinadorId: coo?.id || null,
          /** ID interno del registro en la tabla `director` para este usuario. */
          directorId: dir?.id || null,
          /** ID interno del director asignado al coordinador (tabla `director`). */
          directorAsignadoId: coo?.director_id || null,
          /** UUIDs de sucursales activamente asignadas al coordinador. */
          sucursalesACargo: (coo?.sucursal_coordinador || [])
            .filter(sc => sc.activo)
            .map(sc => sc.sucursal_id),
          certificados: certs,
          documentos: {
            cedula: tec?.documento_cedula_url || null,
            planillaSS: tec?.planilla_seg_social_url || null,
          },
        };
      }));
    }

    setLoadingUsers(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Section: Efectos de carga inicial
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  useEffect(() => {
    fetchActiveDirectors();
  }, [fetchActiveDirectors]);

  // ---------------------------------------------------------------------------
  // Section: Reenvío de invitación
  // ---------------------------------------------------------------------------

  /**
   * Reenvía la invitación de registro al correo del usuario indicado.
   *
   * @param {{ id: string, email: string, nombres: string, apellidos: string, rol: string }} user
   * @returns {Promise<void>}
   */
  const handleResendInvitation = async (user) => {
    if (resendingIds.has(user.id)) return;
    setResendingIds(prev => new Set([...prev, user.id]));
    try {
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke(
        'invite-user',
        {
          body: {
            email: user.email,
            nombres: user.nombres,
            apellidos: user.apellidos,
            role_code: user.rol,
            redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
          },
        }
      );

      if (inviteError) {
        let mensaje = inviteError.message;
        try {
          if (inviteError.context?.json) {
            const body = await inviteError.context.json();
            if (body?.error) mensaje = body.error;
            else if (body?.message) mensaje = body.message;
          }
        } catch { /* ignorar error al parsear cuerpo de respuesta */ }
        throw new Error(mensaje);
      }
      if (inviteData?.error) throw new Error(inviteData.error);

      setSuccessInfo({ email: user.email, nombres: user.nombres, rol: user.rol, isResend: true });
    } catch (err) {
      setSuccessInfo({ error: true, message: err.message || 'No se pudo reenviar la invitación' });
    } finally {
      setResendingIds(prev => {
        const n = new Set(prev);
        n.delete(user.id);
        return n;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Section: Eliminación de usuario
  // ---------------------------------------------------------------------------

  /**
   * Solicita confirmación y elimina el perfil del usuario de `perfil_usuario`.
   * La eliminación en cascada borra sus registros de rol asociados.
   *
   * @param {string} userId - UUID del perfil_usuario a eliminar.
   * @returns {Promise<void>}
   */
  const handleDelete = async (userId) => {
    const user = usuarios.find(u => u.id === userId);
    const confirmed = await confirm({
      title: '¿Eliminar usuario?',
      message: `¿Estás seguro de que deseas eliminar a ${user?.nombres || 'este usuario'}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Descartar',
      type: 'danger',
    });

    if (confirmed) {
      const { error } = await supabase
        .from('perfil_usuario')
        .delete()
        .eq('id', userId);

      if (error) {
        notify('error', 'No se pudo eliminar el usuario');
      } else {
        setUsuarios(prev => prev.filter(u => u.id !== userId));
        notify('success', 'Usuario eliminado correctamente');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Section: Creación / edición de usuario (saveUser)
  // ---------------------------------------------------------------------------

  /**
   * Polling cancelable que espera a que el trigger `handle_new_user` cree
   * el `perfil_usuario` tras la invitación. Una vez encontrado el perfil,
   * aplica actualizaciones complementarias (rol_id, teléfono, documentos de
   * técnico) y refresca la lista.
   *
   * @param {string}  email        - Correo del usuario invitado.
   * @param {object}  payloadUser  - Datos del formulario del nuevo usuario.
   * @param {object}  payloadDocs  - Documentos de técnico (si aplica).
   * @param {Array}   payloadRoles - Catálogo de roles en el momento de la invitación.
   * @param {{ cancelled: boolean }} cancelToken - Objeto compartido para cancelar el polling.
   * @returns {Promise<void>}
   */
  const pollAndUpdateNewUser = async (email, payloadUser, payloadDocs, payloadRoles, cancelToken) => {
    let perfilId = null;

    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      if (cancelToken.cancelled) return;

      const { data: p } = await supabase
        .from('perfil_usuario')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (p?.id) {
        perfilId = p.id;
        break;
      }
    }

    if (!perfilId) {
      console.error(
        '[useUsers] perfil_usuario no fue creado después de',
        POLL_MAX_ATTEMPTS,
        'intentos para:',
        email
      );
      return;
    }

    if (cancelToken.cancelled) return;

    // Actualizar campos adicionales del perfil (rol_id, teléfono, documento).
    // El trigger handle_new_user ya creó el perfil; aquí solo completamos datos.
    const selectedRole = payloadRoles.find(r => r.codigo === payloadUser.rol);
    await supabase.from('perfil_usuario').update({
      telefono: payloadUser.telefono || null,
      tipo_documento: payloadUser.tipoDocumento || null,
      identificacion: payloadUser.identificacion || null,
      ...(selectedRole?.id && { rol_id: selectedRole.id }),
    }).eq('id', perfilId);

    // Para técnicos, guardar documentos y certificados.
    // El trigger sync_specialized_role_tables habrá creado la fila en `tecnico`;
    // saveTecnico solo actualiza campos de documentación/certificados.
    if (payloadUser.rol === ROLES.TECNICO && !cancelToken.cancelled) {
      try {
        await saveTecnico({
          usuarioId: perfilId,
          techId: null,
          draft: {
            nombres: payloadUser.nombres,
            apellidos: payloadUser.apellidos,
            telefono: payloadUser.telefono,
            tipoDocumento: payloadUser.tipoDocumento,
            identificacion: payloadUser.identificacion,
            cedula: payloadDocs?.cedula ?? null,
            planillaSS: payloadDocs?.planillaSS ?? null,
            certificados: payloadUser.certificados || [],
          },
        });
      } catch (err) {
        console.error('[useUsers] Error guardando datos de técnico (documentos/certificados):', err);
      }
    }

    // Para coordinadores nuevos, sincronizar sucursales una vez que el trigger
    // haya creado la fila en la tabla `coordinador`.
    if (payloadUser.rol === ROLES.COORDINADOR && (payloadUser.sucursalesACargo || []).length > 0 && !cancelToken.cancelled) {
      try {
        const { data: cooRow } = await supabase
          .from('coordinador')
          .select('id')
          .eq('usuario_id', perfilId)
          .eq('activo', true)
          .maybeSingle();

        if (cooRow?.id) {
          await syncCoordinadorSucursales(cooRow.id, payloadUser.sucursalesACargo);
        }
      } catch (err) {
        console.error('[useUsers] Error sincronizando sucursales de coordinador:', err);
      }
    }

    if (!cancelToken.cancelled) {
      fetchUsers();
    }
  };

  /**
   * Crea o actualiza un usuario.
   *
   * - **Creación:** Invoca la Edge Function `invite-user` y lanza polling
   *   cancelable para esperar el perfil creado por el trigger `handle_new_user`.
   * - **Edición:** Actualiza `perfil_usuario` directamente. El cambio de
   *   `rol_id` dispara el trigger `sync_specialized_role_tables`, que gestiona
   *   las tablas de especialización (`tecnico`, `coordinador`, `director`,
   *   `administrador`) de forma automática. No se realizan upserts manuales
   *   en esas tablas.
   *
   * @param {boolean} isCreating        - `true` si se está creando un usuario nuevo.
   * @param {object|null} editingUser   - Objeto del usuario que se está editando (null si isCreating).
   * @param {object} newUser            - Datos del formulario (nombres, apellidos, email, rol, etc.).
   * @param {object} tecnicoDocumentos  - URLs de documentos de técnico { cedula, planillaSS }.
   * @returns {Promise<boolean>}        - `true` si la operación fue exitosa.
   */
  const saveUser = async (isCreating, editingUser, newUser, tecnicoDocumentos) => {
    try {
      // ----- CREAR usuario -----
      if (isCreating) {
        if (inviteInFlightRef.current) return false;
        inviteInFlightRef.current = true;

        try {
          const invitePromise = supabase.functions.invoke('invite-user', {
            body: {
              email: newUser.email,
              nombres: newUser.nombres,
              apellidos: newUser.apellidos,
              role_code: newUser.rol,
              redirectTo: window.location.origin,
            },
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(
                'Tiempo de espera agotado. La función de invitación no respondió. ' +
                'Compruebe que la Edge Function esté desplegada y que el correo no esté en límite.'
              )),
              INVITE_USER_TIMEOUT_MS
            )
          );

          const { data: inviteData, error: inviteError } = await Promise.race([
            invitePromise,
            timeoutPromise,
          ]);

          if (inviteError) {
            let errorMessage = inviteError.message || 'Error al enviar invitación';
            try {
              const ctx = inviteError.context;
              if (ctx && typeof ctx.json === 'function') {
                const body = await ctx.json();
                if (body?.error) errorMessage = body.error;
                else if (body?.message) errorMessage = body.message;
              }
            } catch { /* ignorar error al parsear cuerpo de respuesta */ }
            setSuccessInfo({ error: true, message: errorMessage });
            return false;
          }

          if (inviteData?.error) {
            setSuccessInfo({ error: true, message: inviteData.error || 'Error al crear usuario' });
            return false;
          }

          setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: newUser.rol });

          // Correo de bienvenida al nuevo usuario (fire-and-forget)
          // El correo de invitación de Supabase ya fue enviado; este es el correo de bienvenida con contexto
          const rolLabel = roles.find(r => r.codigo === newUser.rol)?.label || newUser.rol || '';
          sendEmail('usuario_creado', {
            destinatario: newUser.email,
            nombres: newUser.nombres || '',
            apellidos: newUser.apellidos || '',
            email: newUser.email,
            rol: rolLabel,
            responsable: user?.email || '',
            appUrl: window.location.origin,
          });
        } finally {
          inviteInFlightRef.current = false;
        }

        // Polling cancelable: capturamos los valores actuales antes del cierre async.
        const payloadUser = newUser;
        const payloadDocs = tecnicoDocumentos;
        const payloadRoles = roles;

        // cancelToken permite detener el polling si el componente se desmonta.
        // El caller puede guardar el token y llamar `cancelToken.cancelled = true`
        // desde un cleanup de useEffect si lo necesita.
        const cancelToken = { cancelled: false };
        pollAndUpdateNewUser(newUser.email, payloadUser, payloadDocs, payloadRoles, cancelToken);

        // Retornamos inmediatamente; el polling corre en segundo plano.
        return true;

      // ----- EDITAR usuario -----
      } else if (editingUser) {
        const selectedRole = roles.find(r => r.codigo === newUser.rol);

        // Actualizar perfil_usuario. Cambiar rol_id aquí dispara el trigger
        // sync_specialized_role_tables, que sincroniza las tablas de rol
        // (tecnico, coordinador, director, administrador) automáticamente.
        const { error: updateError } = await supabase
          .from('perfil_usuario')
          .update({
            nombres: newUser.nombres,
            apellidos: newUser.apellidos,
            email: newUser.email || undefined,
            rol_id: selectedRole?.id,
            telefono: newUser.telefono || null,
            tipo_documento: newUser.tipoDocumento || null,
            identificacion: newUser.identificacion || null,
            ...(newUser.avatarUrl !== undefined && { avatar_url: newUser.avatarUrl || null }),
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;

        // Para técnicos, actualizar documentos y certificados adicionales que
        // el trigger no gestiona (solo crea la fila base, no sube documentos).
        if (newUser.rol === ROLES.TECNICO) {
          await saveTecnico({
            usuarioId: editingUser.id,
            techId: editingUser.tecnicoId || null,
            draft: {
              nombres: newUser.nombres,
              apellidos: newUser.apellidos,
              telefono: newUser.telefono,
              tipoDocumento: newUser.tipoDocumento,
              identificacion: newUser.identificacion,
              cedula: tecnicoDocumentos.cedula,
              planillaSS: tecnicoDocumentos.planillaSS,
              certificados: newUser.certificados || [],
            },
          });
        }

        // Para coordinadores, sincronizar sucursales asignadas.
        if (newUser.rol === ROLES.COORDINADOR && editingUser.coordinadorId) {
          await syncCoordinadorSucursales(
            editingUser.coordinadorId,
            newUser.sucursalesACargo || []
          );
        }

        await fetchUsers();
        setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: null, isUpdate: true });
      }

      return true;
    } catch (err) {
      console.error('[useUsers] Error saveUser:', err);
      setSuccessInfo({ error: true, message: err.message || 'Error desconocido' });
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    usuarios,
    loadingUsers,
    roles,
    loadingRoles,
    successInfo,
    setSuccessInfo,
    resendingIds,
    handleResendInvitation,
    handleDelete,
    saveUser,
    fetchUsers,
    activeDirectors,
    loadingActiveDirectors,
  };
};
