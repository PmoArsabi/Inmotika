import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import { ROLES } from '../utils/constants';

export const useUsers = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);
  const [resendingIds, setResendingIds] = useState(new Set());

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
        )
      `)
      .order('nombres');

    if (usersData) {
      setUsuarios(usersData.map(u => {
        const techArr = Array.isArray(u.tecnico) ? u.tecnico : (u.tecnico ? [u.tecnico] : []);
        const tec = techArr[0] || null;
        const certs = tec?.tecnico_certificado ? tec.tecnico_certificado.filter(c => c.activo) : [];

        return {
          ...u,
          rol: u.catalogo_rol?.codigo || '',
          rolNombre: u.catalogo_rol?.nombre || '',
          activo: u.catalogo_estado_general?.activo ?? true,
          estado: u.catalogo_estado_general?.codigo || '',
          estadoNombre: u.catalogo_estado_general?.nombre || '',
          tecnicoId: tec?.id || null,
          certificados: certs,
          documentos: {
            cedula: tec?.documento_cedula_url || null,
            planillaSS: tec?.planilla_seg_social_url || null,
          },
        };
      }));
    } else {
      console.error('Error al cargar usuarios:', error);
      notify('error', 'Error al cargar usuarios');
    }
    setLoadingUsers(false);
  }, [notify]);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

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

  const saveUser = async (isCreating, editingUser, newUser, tecnicoDocumentos) => {
    try {
      if (isCreating) {
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
          body: {
            email: newUser.email,
            nombres: newUser.nombres,
            apellidos: newUser.apellidos,
            role_code: newUser.rol,
            redirectTo: window.location.origin,
          }
        });

        if (inviteError) {
          let errorMessage = inviteError.message;
          try {
            const body = await inviteError.context.json();
            if (body && body.error) errorMessage = body.error;
          } catch (e) {}
          throw new Error(errorMessage);
        }

        if (inviteData?.error) throw new Error(inviteData.error);

        setSuccessInfo({ email: newUser.email, nombres: newUser.nombres, rol: newUser.rol });
        
        // Actualización diferida de campos adicionales
        setTimeout(async () => {
          const { data: p } = await supabase.from('perfil_usuario').select('id').eq('email', newUser.email).maybeSingle();
          if (p?.id) {
            await supabase.from('perfil_usuario').update({
              telefono: newUser.telefono || null,
              tipo_documento: newUser.tipoDocumento || null,
              identificacion: newUser.identificacion || null,
            }).eq('id', p.id);
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
          const tecnicoPayload = {
            usuario_id: editingUser.id,
            documento_cedula_url: tecnicoDocumentos.cedula || null,
            planilla_seg_social_url: tecnicoDocumentos.planillaSS || null,
          };

          let techId = editingUser.tecnicoId;
          const { data: existingTech } = await supabase.from('tecnico').select('id').eq('usuario_id', editingUser.id).maybeSingle();
          techId = existingTech?.id;

          if (techId) {
            await supabase.from('tecnico').update(tecnicoPayload).eq('id', techId);
          } else {
            const { data: nT } = await supabase.from('tecnico').insert(tecnicoPayload).select('id').single();
            techId = nT?.id;
          }

          if (techId) {
            const currentCerts = newUser.certificados || [];
            const { data: dbCerts } = await supabase.from('tecnico_certificado').select('*').eq('tecnico_id', techId);
            
            const toSoftDelete = (dbCerts || []).filter(db => db.activo && !currentCerts.find(ui => ui.id === db.id));
            for (const doc of toSoftDelete) {
              await supabase.from('tecnico_certificado').update({ activo: false }).eq('id', doc.id);
              if (doc.url) await supabase.storage.from('inmotika').remove([doc.url]);
            }

            for (const uiCert of currentCerts) {
              const certPayload = { tecnico_id: techId, nombre: uiCert.nombre || 'Certificado', url: uiCert.url || null, activo: true };
              if (dbCerts?.find(db => db.id === uiCert.id)) {
                await supabase.from('tecnico_certificado').update(certPayload).eq('id', uiCert.id);
              } else {
                await supabase.from('tecnico_certificado').insert(certPayload);
              }
            }
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
    fetchUsers
  };
};
