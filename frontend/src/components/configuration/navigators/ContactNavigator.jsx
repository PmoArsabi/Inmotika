import React, { useState, useRef, useEffect } from 'react';
import Card from '../../ui/Card';
import ContactForm from '../../../modules/contacts/ContactForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyContactDraft, toContactDraft, applyContactUpsert } from '../../../utils/entityMappers';
import { validateContact } from '../../../utils/validators';
import { supabase } from '../../../utils/supabase';
import { saveContacto } from '../../../api/contactoApi';

const ContactNavigator = ({ onClose }) => {
  const { route, drafts, updateDraft, setDrafts, setStack, setContactSuccessInfo } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const [savingStep, setSavingStep] = useState(''); // '', 'saving_db', 'inviting'
  const inviteInFlightRef = useRef(false);

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

    const seeded = toContactDraft(baseContact);
    setDrafts(prev => ({ ...prev, [key]: seeded }));

    const contactClientId =
      baseContact.clientId ||
      baseContact.cliente_id ||
      seeded.clientId ||
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
  const errors = validateContact(currentDraft);
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

  const isNewContact = !data.clientes?.some(c =>
    c.sucursales?.some(s => s.contactos?.some(co => String(co.id) === String(route.contactId)))
  );

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

      if (currentDraft.darAcceso && isNewContact && currentDraft.email && !inviteInFlightRef.current) {
        inviteInFlightRef.current = true;
        setSavingStep('inviting');

        try {
          const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-user', {
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
                break;
              }
            }
          }
        } catch (inviteErr) {
          console.error('Error enviando invitación:', inviteErr);
        }
      }

      setData(prev => applyContactUpsert(prev, route.clientId, primaryBranchId, contactId, {
        ...currentDraft,
        id: contactId,
      }));

      setSaveState({ isSaving: false, savedAt: Date.now() });
      setSavingStep('');
      setContactSuccessInfo({ contactId, isNew: isNewContact });
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
        clientOptions={(data.clientes || []).map(c => ({ value: String(c.id), label: c.nombre }))}
        selectedClientId={route.clientId || ''}
        onClientChange={handleClientChange}
        availableBranchOptions={availableBranches.map(b => ({ value: String(b.id), label: b.nombre }))}
        selectedBranchValues={selectedBranches.map(b => ({ value: String(b.id), label: b.nombre }))}
        onBranchesChange={handleBranchesChange}
        clientError={null}
        branchError={null}
      />
    </Card>
  );
};

export default ContactNavigator;
