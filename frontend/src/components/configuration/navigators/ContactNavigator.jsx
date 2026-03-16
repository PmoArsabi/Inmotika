import React, { useState, useRef } from 'react';
import Card from '../../ui/Card';
import ContactForm from '../../../modules/contacts/ContactForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyContactDraft, toContactDraft, applyContactUpsert } from '../../../utils/entityMappers';
import { validateContact } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';
import { supabase } from '../../../utils/supabase';
import { saveContacto } from '../../../api/contactoApi';

const ContactNavigator = ({ onClose }) => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const inviteInFlightRef = useRef(false);

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('contact', route.contactId);
  
  // Initialize draft if not exists
  const draft = drafts[key];
  if (!draft) {
    // If we're in view/edit mode and it's an existing contact, we should have a draft
    // But for now, let's just use empty as fallback if somehow missing
    // In a real scenario, the 'pushRoute' should ensure draft exists.
  }

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
    try {
      const { contactId } = await saveContacto({
        contactId: route.contactId,
        clienteId: route.clientId,
        draft: currentDraft,
      });

      const primaryBranchId = currentDraft.associatedBranchIds?.[0] || route.branchId || null;

      if (currentDraft.darAcceso && isNewContact && currentDraft.email && !inviteInFlightRef.current) {
        inviteInFlightRef.current = true;
        try {
          await supabase.functions.invoke('invite-user', {
            body: {
              email: currentDraft.email,
              nombres: currentDraft.nombres,
              apellidos: currentDraft.apellidos,
              role_code: 'CLIENTE',
              redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
            },
          });
        } finally {
          inviteInFlightRef.current = false;
        }
      }

      setData(prev => applyContactUpsert(prev, route.clientId, primaryBranchId, contactId, {
        ...currentDraft,
        id: contactId,
      }));

      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) =>
        idx === prev.length - 1 ? { ...s, mode: 'view', contactId } : s
      ));
      notify('success', 'Contacto guardado con éxito');
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      setSaveState({ isSaving: false, savedAt: null });
      notify('error', 'Error al guardar: ' + (err.message || err));
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
