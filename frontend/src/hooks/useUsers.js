import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { ROLES } from '../utils/constants';
import { saveTecnico } from '../api/tecnicoApi';

export const useUsers = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);
  const [resendingIds, setResendingIds] = useState(new Set());
  const [activeDirectors, setActiveDirectors] = useState([]);
  const [loadingActiveDirectors, setLoadingActiveDirectors] = useState(false);
  const inviteInFlightRef = useRef(false);

  const notify = useNotify();
  const confirm = useConfirm();

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    const { data, error } = await supabase
      .from('catalogo_rol')
      .select('id, codigo, nombre')
      .order('nombre');
    
    if (data) setRoles(data);
    if (error) console.error('Error al cargar roles:', error);
    setLoadingRoles(false);
  }, []);

  const fetchActiveDirectors = useCallback(async () => {
    console.log('[useUsers] fetchActiveDirectors: Iniciando consulta...');
    try {
      const { data, error } = await supabase
        .from('director')
        .select(`
          id,
          usuario:perfil_usuario!director_usuario_id_fkey (nombres, apellidos)
        `)
        .eq('activo', true);

      console.log('[useUsers] fetchActiveDirectors response:', { data, error });

      if (error) {
        console.error('[useUsers] fetchActiveDirectors error:', error);
        return;
      }
      
      if (data) {
        const mapped = data.map(d => ({
          id: d.id,
          nombreCompleto: d.usuario ? `${d.usuario.nombres || ''} ${d.usuario.apellidos || ''}`.trim() : 'Sin Nombre'
        }));
        console.log('[useUsers] fetchActiveDirectors mapped:', mapped);
        setActiveDirectors(mapped);
      } else {
        console.log('[useUsers] fetchActiveDirectors: No se recibieron datos (data es null/undefined)');
      }
    } catch (err) {
      console.error('[useUsers] fetchActiveDirectors system error:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data: usersData, error } = await supabase
      .from('perfil_usuario')
      .select(`
        id, nombres, apellidos, email, telefono, tipo_documento, identificacion,
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
          director!coordinador_director_id_fkey (usuario_id)
        ),
        director!director_usuario_id_fkey (id, activo)
      `)
      .order('nombres');

    if (usersData) {
      setUsuarios(usersData.map(u => {
        const techArr = Array.isArray(u.tecnico) ? u.tecnico : (u.tecnico ? [u.tecnico] : []);
        const tec = techArr.find(t => t.activo) || techArr[0] || null;
        
        const coordArr = Array.isArray(u.coordinador) ? u.coordinador : (u.coordinador ? [u.coordinador] : []);
        const coo = coordArr.find(c => c.activo) || coordArr[0] || null;

        const dirArr = Array.isArray(u.director) ? u.director : (u.director ? [u.director] : []);
        const dir = dirArr.find(d => d.activo) || dirArr[0] || null;

        const certs = tec?.tecnico_certificado ? tec.tecnico_certificado.filter(c => c.activo) : [];

        return {
          ...u,
          rol: u.catalogo_rol?.codigo || '',
          rolNombre: u.catalogo_rol?.nombre || '',
          activo: u.catalogo_estado_general?.activo ?? true,
          estado: u.catalogo_estado_general?.codigo || '',
          estadoNombre: u.catalogo_estado_general?.nombre || '',
          tecnicoId: tec?.id || null,
          coordinadorId: coo?.id || null,
          directorId: dir?.id || null,          // ID interno del usuario como director
          directorAsignadoId: coo?.director_id || null, // ID interno del director asignado (tabla director)
          certificados: certs,
          documentos: {
            cedula: tec?.documento_cedula_url || null,
            planillaSS: tec?.planilla_seg_social_url || null,
          },
        };
      }));
    }
    setLoadingUsers(false);
  }, [notify]);

  useEffect(() => {
    console.log('[useUsers] useEffect Roles/Users triggered');
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  useEffect(() => {
    console.log('[useUsers] useEffect Directors triggered');
    fetchActiveDirectors();
  }, [fetchActiveDirectors]);

  const handleResendInvitation = async (user) => {
    if (resendingIds.has(user.id)) return;
    setResendingIds(prev => new Set([...prev, user.id]));
    try {
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: {
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          role_code: user.rol,
          redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
        }
      });

      if (inviteError) {
        let mensaje = inviteError.message;
        try {
          if (inviteError.context?.json) {
            const body = await inviteError.context.json();
            if (body?.error) mensaje = body.error;
            else if (body?.message) mensaje = body.message;
          }
        } catch (_) {}
        throw new Error(mensaje);
      }
      if (inviteData?.error) throw new Error(inviteData.error);

      setSuccessInfo({ email: user.email, nombres: user.nombres, rol: user.rol, isResend: true });
    } catch (err) {
      setSuccessInfo({ error: true, message: err.message || 'No se pudo reenviar la invitación' });
    } finally {
      setResendingIds(prev => { const n = new Set(prev); n.delete(user.id); return n; });
    }
  };

  const handleDelete = async (userId) => {
    const user = usuarios.find(u => u.id === userId);
    const confirmed = await confirm({
      title: '¿Eliminar usuario?',
      message: `¿Estás seguro de que deseas eliminar a ${user?.nombres || 'este usuario'}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Descartar',
      type: 'danger'
    });

    if (confirmed) {
      const { error } = await supabase.from('perfil_usuario').delete().eq('id', userId);
      if (error) {
        notify('error', 'No se pudo eliminar el usuario');
      } else {
        setUsuarios(prev => prev.filter(u => u.id !== userId));
        notify('success', 'Usuario eliminado correctamente');
      }
    }
  };

  const INVITE_USER_TIMEOUT_MS = 35000;

  const saveUser = async (isCreating, editingUser, newUser, tecnicoDocumentos) => {
    try {
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
            }
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tiempo de espera agotado. La función de invitación no respondió. Compruebe que la Edge Function esté desplegada y que el correo no esté en límite.')), INVITE_USER_TIMEOUT_MS)
          );

          const { data: inviteData, error: inviteError } = await Promise.race([invitePromise, timeoutPromise]);

          if (inviteError) {
            let errorMessage = inviteError.message || 'Error al enviar invitación';
            try {
              const ctx = inviteError.context;
              if (ctx && typeof ctx.json === 'function') {
                const body = await ctx.json();
                if (body?.error) errorMessage = body.error;
                else if (body?.message) errorMessage = body.message;
              }
            } catch (_) {}
            setSuccessInfo({ error: true, message: errorMessage });
            return false;
          }

          if (inviteData?.error) {
            setSuccessInfo({ error: true, message: inviteData.error || 'Error al crear usuario' });
            return false;
          }

          setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: newUser.rol });
        } finally {
          inviteInFlightRef.current = false;
        }

        // Actualización diferida: perfil (rol_id, teléfono, etc.) y, si es técnico, documentos y certificados
        const payloadUser = newUser;
        const payloadDocs = tecnicoDocumentos;
        const payloadRoles = roles;
        setTimeout(async () => {
          const { data: p } = await supabase.from('perfil_usuario').select('id').eq('email', payloadUser.email).maybeSingle();
          if (p?.id) {
            const selectedRole = payloadRoles.find(r => r.codigo === payloadUser.rol);
            await supabase.from('perfil_usuario').update({
              telefono: payloadUser.telefono || null,
              tipo_documento: payloadUser.tipoDocumento || null,
              identificacion: payloadUser.identificacion || null,
              ...(selectedRole?.id && { rol_id: selectedRole.id }),
            }).eq('id', p.id);

            if (payloadUser.rol === ROLES.TECNICO) {
              try {
                await saveTecnico({
                  usuarioId: p.id,
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
                console.error('Error guardando datos de técnico (documentos/certificados):', err);
              }
            }
            fetchUsers();
          }
        }, 2000);

      } else if (editingUser) {
        const selectedRole = roles.find(r => r.codigo === newUser.rol);
        
        const { error: updateError } = await supabase.from('perfil_usuario').update({
          nombres: newUser.nombres,
          apellidos: newUser.apellidos,
          rol_id: selectedRole?.id,
          telefono: newUser.telefono || null,
          tipo_documento: newUser.tipoDocumento || null,
          identificacion: newUser.identificacion || null,
        }).eq('id', editingUser.id);

        if (updateError) throw updateError;

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

        // --- COORDINADOR Logic ---
        if (newUser.rol === ROLES.COORDINADOR) {
          let coordId = editingUser.coordinadorId;
          const { data: existingCoord } = await supabase.from('coordinador').select('id').eq('usuario_id', editingUser.id).maybeSingle();
          coordId = existingCoord?.id;

          const coordData = { 
            usuario_id: editingUser.id, 
            director_id: newUser.directorId || null, // Recibimos el ID directo de la tabla director
            activo: true 
          };

          if (coordId) {
            const { error: updErr } = await supabase.from('coordinador').update(coordData).eq('id', coordId);
            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase.from('coordinador').insert(coordData);
            if (insErr) throw insErr;
          }
        }

        // --- DIRECTOR Logic ---
        if (newUser.rol === ROLES.DIRECTOR) {
          let dirId = editingUser.directorId;
          const { data: existingDir } = await supabase.from('director').select('id').eq('usuario_id', editingUser.id).maybeSingle();
          dirId = existingDir?.id;

          if (dirId) {
            await supabase.from('director').update({ activo: true }).eq('id', dirId);
          } else {
            await supabase.from('director').insert({ usuario_id: editingUser.id, activo: true });
          }
        }

        // --- Optional ADMINISTRADOR Logic (if the user ran the SQL) ---
        if (newUser.rol === ROLES.ADMIN) {
          try {
            const { data: existingAdmin } = await supabase.from('administrador').select('id').eq('usuario_id', editingUser.id).maybeSingle();
            if (!existingAdmin) {
              await supabase.from('administrador').insert({ usuario_id: editingUser.id, activo: true });
            } else {
              await supabase.from('administrador').update({ activo: true }).eq('id', existingAdmin.id);
            }
          } catch (e) {
            // Table might not exist yet if they haven't run the SQL
            console.warn('administrador table not found or error accessing it. Skip if not used.', e);
          }
        }

        // --- Role Cleanup ---
        // If the role changed, we might want to deactivate other roles. 
        // For now, at least ensure we don't have multiple "active" identity records for the same user if they switch often.
        const rolesToDeactivate = [ROLES.TECNICO, ROLES.COORDINADOR, ROLES.DIRECTOR, ROLES.ADMIN].filter(r => r !== newUser.rol);
        for (const r of rolesToDeactivate) {
          if (r === ROLES.TECNICO) await supabase.from('tecnico').update({ activo: false }).eq('usuario_id', editingUser.id);
          if (r === ROLES.COORDINADOR) await supabase.from('coordinador').update({ activo: false }).eq('usuario_id', editingUser.id);
          if (r === ROLES.DIRECTOR) await supabase.from('director').update({ activo: false }).eq('usuario_id', editingUser.id);
          // Administrador table check again
          if (r === ROLES.ADMIN) {
            try { await supabase.from('administrador').update({ activo: false }).eq('usuario_id', editingUser.id); } catch(e) {}
          }
        }

        await fetchUsers();
        setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: null, isUpdate: true });
      }
      return true;
    } catch (err) {
      console.error('Error saveUser:', err);
      setSuccessInfo({ error: true, message: err.message || 'Error desconocido' });
      return false;
    }
  };

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
    loadingActiveDirectors
  };
};
