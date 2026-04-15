import React, { useState } from 'react';
import TechnicianForm from '../../../modules/users/components/TechnicianForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyTecnicoDraft, applyTecnicoUpsert, toTecnicoDraft } from '../../../utils/entityMappers';
import { validateTecnico } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';
import { updatePerfilForTecnico, ensureTecnicoRecord } from '../../../api/tecnicoApi';

const TechnicalNavigator = () => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('tecnico', route.clientId);
  const existingDraft = drafts[key];
  const isDraftValid = !!existingDraft;

  const currentTech = (data?.tecnicos || []).find(t => String(t.id) === String(route.clientId));

  const draft = isDraftValid
    ? existingDraft
    : (currentTech ? toTecnicoDraft(currentTech, currentTech) : emptyTecnicoDraft());
  const errors = validateTecnico(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;

    setSaveState({ isSaving: true, savedAt: null });

    try {
      // Documentos se gestionan en tiempo real desde DocumentUploadManager.
      // Aquí solo persistimos perfil y la fila base de tecnico.
      await updatePerfilForTecnico(draft.usuarioId, draft);
      const techId = await ensureTecnicoRecord(draft.usuarioId, draft.id);

      setData(prev => applyTecnicoUpsert(prev, techId, { ...draft, id: techId }));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
      notify('success', 'Técnico guardado con éxito');
    } catch (err) {
      console.error('Error saving tecnico:', err);
      notify('error', err?.message || 'Error al guardar el técnico');
      setSaveState({ isSaving: false, savedAt: null });
    }
  };

  return (
    <TechnicianForm
      draft={draft}
      updateDraft={(patch) => updateDraft(key, patch)}
      errors={errors}
      showErrors={showErrors}
      isEditing={isEditing}
      onSave={handleSave}
      isSaving={saveState.isSaving}
    />
  );
};

export default TechnicalNavigator;
