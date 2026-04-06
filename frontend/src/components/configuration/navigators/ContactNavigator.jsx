import React, { useState, useRef, useEffect } from 'react';
import Card from '../../ui/Card';
import ContactForm from '../../../modules/contacts/ContactForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyContactDraft, toContactDraft, applyContactUpsert } from '../../../utils/entityMappers';
import { validateContact } from '../../../utils/validators';
import { supabase } from '../../../utils/supabase';
import { saveContacto, updatePerfilUsuarioEstado } from '../../../api/contactoApi';
import { useActivoInactivo } from '../../../hooks/useCatalog';
import { sendEmail } from '../../../hooks/useEmail';

const ContactNavigator = () => {
  const { route, drafts, updateDraft, setDrafts, setStack, openContactSuccess } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const [savingStep, setSavingStep] = useState(''); // '', 'saving_db', 'inviting'
  const [inviteErrorMsg, setInviteErrorMsg] = useState('');
  const inviteInFlightRef = useRef(false);
  const { activoId, inactivoId } = useActivoInactivo();

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('contact', route.contactId);
  
  const draft = drafts[key];

  // Resincro borrador y cliente desde master data al abrir/editar un contacto
  useEffect(() => {
    if (!route.contactId) return;

    let baseContact = null;

    // Buscar primero en clientes → sucursales → contactos
    (data?.clientes || []).forEach(c => {
      (c.sucursales || []).forEach(s => {
        (s.contactos || []).forEach(ct => {
          if (!baseContact && String(ct.id) === String(route.contactId)) {
            baseContact = ct;
          }
        });
      });
    });

    // Si no se encontró, buscar en el arreglo global de contactos
    if (!baseContact && Array.isArray(data?.contactos)) {
      baseContact = data.contactos.find(ct => String(ct.id) === String(route.contactId)) || null;
    }

    if (!baseContact) return;

    // Solo seedear si no existe un draft en progreso (evita borrar ediciones)
    setDrafts(prev => {
      if (prev[key]) return prev;
      return { ...prev, [key]: toContactDraft(baseContact) };
    });

    const contactClientId =
      baseContact.clientId ||
      baseContact.cliente_id ||
      null;

    if (contactClientId) {
      const normalized = String(contactClientId);
      setStack(prev =>
        prev.map((s, idx) =>
          idx === prev.length - 1 ? { ...s, clientId: normalized } : s
        )
      );
    }
  }, [route.contactId, data, key, setDrafts, setStack]);

  const currentDraft = draft || emptyContactDraft();
  const errors = validateContact(currentDraft, route.clientId);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const client = data.clientes?.find(c => String(c.id) === String(route.clientId));
  const availableBranches = client?.sucursales || [];
  
  const selectedBranchIds = currentDraft.associatedBranchIds || (route.branchId ? [route.branchId] : []);
  const selectedBranches = availableBranches.filter(b => selectedBranchIds.includes(String(b.id)));

  const handleClientChange = (option) => {
    const clientId = option ? option.value : null;
    updateDraft(key, { associatedBranchIds: [] });
    setStack(prev => prev.map((s, idx) => 
      idx === prev.length - 1 
        ? { ...s, clientId, branchId: null } 
        : s
    ));
  };

  const handleBranchesChange = (selectedOptions) => {
    const branchIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    updateDraft(key, { associatedBranchIds: branchIds });
    if (branchIds.length > 0) {
      setStack(prev => prev.map((s, idx) => 
        idx === prev.length - 1 
          ? { ...s, branchId: branchIds[0] } 
          : s
      ));
    }
  };

  // Un contacto es nuevo si su ID (que empieza por NEW-) no existe en ninguna fuente de datos
  const isNewContact = String(route.contactId || '').startsWith('NEW-') || !(
    data.clientes?.some(c => c.sucursales?.some(s => s.contactos?.some(co => String(co.id) === String(route.contactId)))) ||
    data.contactos?.some(co => String(co.id) === String(route.contactId))
  );

  // El contacto ya tiene acceso si tiene usuario_id vinculado
  const hasAccess = !!currentDraft.usuarioId;

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;

    setSaveState({ isSaving: true, savedAt: null });
    setSavingStep('saving_db');

    try {
      const { contactId } = await saveContacto({
        contactId: route.contactId,
        clienteId: route.clientId,
        draft: currentDraft,
      });

      const primaryBranchId = currentDraft.associatedBranchIds?.[0] || route.branchId || null;

      // Solo enviar invitación si: quiere dar acceso, NO tiene ya usuario_id, y hay email
      if (currentDraft.darAcceso && !hasAccess && currentDraft.email && !inviteInFlightRef.current) {
        inviteInFlightRef.current = true;
        setSavingStep('inviting');

        try {
          const { error: inviteError } = await supabase.functions.invoke('invite-user', {
            body: {
              email: currentDraft.email,
              nombres: currentDraft.nombres,
              apellidos: currentDraft.apellidos,
              role_code: 'CLIENTE',
              redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
            },
          });

          if (inviteError) {
            console.error('Error enviando invitación:', inviteError);
            // No se envía correo de acceso si la invitación falló
            // Intentar extraer el mensaje de error del cuerpo de la respuesta
            let errMsg = inviteError.message || 'Error al enviar la invitación';
            try {
              const ctx = inviteError.context;
              if (ctx && typeof ctx.json === 'function') {
                const body = await ctx.json();
                if (body?.error) errMsg = body.error;
                else if (body?.message) errMsg = body.message;
              }
            } catch { /* ignorar */ }
            setInviteErrorMsg(`El contacto fue guardado correctamente, pero no se pudo crear el acceso al sistema. El usuario no podrá iniciar sesión hasta que se corrija el correo o se reintente la invitación. Detalle: ${errMsg}`);
          } else {
            // Fallback: si el trigger no vinculó contacto.usuario_id, hacerlo desde frontend
            // Polling: esperar hasta 5s a que el perfil_usuario exista, luego vincular
            const maxAttempts = 5;
            for (let i = 0; i < maxAttempts; i++) {
              await new Promise(r => setTimeout(r, 1000));
              const { data: perfil } = await supabase
                .from('perfil_usuario')
                .select('id')
                .eq('email', currentDraft.email.toLowerCase())
                .maybeSingle();

              if (perfil?.id) {
                // Verificar si el contacto ya fue vinculado por el trigger
                const { data: contactoCheck } = await supabase
                  .from('contacto')
                  .select('usuario_id')
                  .eq('id', contactId)
                  .maybeSingle();

                if (!contactoCheck?.usuario_id) {
                  await supabase
                    .from('contacto')
                    .update({ usuario_id: perfil.id })
                    .eq('id', contactId);
                }

                // Notificar al contacto que su acceso fue habilitado
                const clienteObj = data.clientes?.find(c => String(c.id) === String(route.clientId));
                const sucursalObj = clienteObj?.sucursales?.find(s =>
                  (currentDraft.associatedBranchIds || []).includes(String(s.id))
                );
                sendEmail('contacto_acceso', {
                  destinatario: currentDraft.email,
                  nombres: currentDraft.nombres || '',
                  apellidos: currentDraft.apellidos || '',
                  email: currentDraft.email,
                  cliente: clienteObj?.nombre || clienteObj?.razon_social || '—',
                  sucursal: sucursalObj?.nombre || '—',
                  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
                });

                // Subir avatar si el admin seleccionó uno
                if (currentDraft.avatarFile) {
                  const avatarPath = `usuarios/${perfil.id}/avatar`;
                  const { error: uploadError } = await supabase.storage
                    .from('inmotika')
                    .upload(avatarPath, currentDraft.avatarFile, { upsert: true });
                  if (!uploadError) {
                    await supabase
                      .from('perfil_usuario')
                      .update({ avatar_url: avatarPath })
                      .eq('id', perfil.id);
                  }
                }

                break;
              }
            }
          }
        } catch (inviteErr) {
          console.error('Error enviando invitación:', inviteErr);
        }
      }

      // Si el contacto ya tiene usuario y se subió un avatar, actualizarlo
      if (hasAccess && currentDraft.usuarioId && currentDraft.avatarFile) {
        const avatarPath = `usuarios/${currentDraft.usuarioId}/avatar`;
        const { error: uploadError } = await supabase.storage
          .from('inmotika')
          .upload(avatarPath, currentDraft.avatarFile, { upsert: true });
        if (!uploadError) {
          await supabase
            .from('perfil_usuario')
            .update({ avatar_url: avatarPath })
            .eq('id', currentDraft.usuarioId);
        }
      }

      // Si el contacto ya tiene usuario vinculado y el admin cambió el acceso al sistema,
      // actualizar perfil_usuario.estado_id para activar/desactivar el login via RLS
      if (hasAccess && currentDraft.usuarioId && currentDraft.perfilAccesoActivo !== null) {
        const nuevoPerfilEstadoId = currentDraft.perfilAccesoActivo ? activoId : inactivoId;
        if (nuevoPerfilEstadoId) {
          try {
            await updatePerfilUsuarioEstado(currentDraft.usuarioId, nuevoPerfilEstadoId);
          } catch (perfilErr) {
            console.error('Error al actualizar estado de acceso del perfil:', perfilErr);
          }
        }
      }

      setData(prev => applyContactUpsert(prev, route.clientId, primaryBranchId, contactId, {
        ...currentDraft,
        id: contactId,
      }));

      setSaveState({ isSaving: false, savedAt: Date.now() });
      setSavingStep('');
      openContactSuccess({ contactId, isNew: isNewContact });
      inviteInFlightRef.current = false;
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      setSaveState({ isSaving: false, savedAt: null });
      setSavingStep('');
      inviteInFlightRef.current = false;
    }
  };

  return (
    <Card className="p-6">
      {inviteErrorMsg && (
        <div className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">Aviso sobre el acceso al sistema</p>
            <p className="text-xs text-red-600 mt-0.5">{inviteErrorMsg}</p>
          </div>
          <button onClick={() => setInviteErrorMsg('')} className="text-red-400 hover:text-red-600 shrink-0">✕</button>
        </div>
      )}
      <ContactForm
        draft={currentDraft}
        updateDraft={(patch) => updateDraft(key, patch)}
        errors={errors}
        showErrors={showErrors}
        isEditing={isEditing}
        onSave={handleSave}
        isSaving={saveState.isSaving}
        savingStep={savingStep}
        isNew={isNewContact}
        hasAccess={hasAccess}
        perfilAccesoActivo={currentDraft.perfilAccesoActivo}
        clientOptions={(data.clientes || []).map(c => ({ value: String(c.id), label: c.nombre }))}
        selectedClientId={route.clientId || ''}
        onClientChange={handleClientChange}
        availableBranchOptions={availableBranches.map(b => ({ value: String(b.id), label: b.nombre }))}
        selectedBranchValues={selectedBranches.map(b => ({ value: String(b.id), label: b.nombre }))}
        onBranchesChange={handleBranchesChange}
        clientError={showErrors ? errors.clienteId : null}
        branchError={null}
      />
    </Card>
  );
};

export default ContactNavigator;
