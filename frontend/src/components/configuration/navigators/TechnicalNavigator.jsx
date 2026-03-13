import React, { useState } from 'react';
import TechnicianForm from '../../../modules/users/components/TechnicianForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyTecnicoDraft, applyTecnicoUpsert } from '../../../utils/entityMappers';
import { validateTecnico } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';

const TechnicalNavigator = () => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('tecnico', route.clientId); // using clientId as ID prop for now as in original
  
  const draft = drafts[key] || emptyTecnicoDraft();
  const errors = validateTecnico(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;
    setSaveState({ isSaving: true, savedAt: null });
    await new Promise(r => setTimeout(r, 400));
    
    setData(prev => applyTecnicoUpsert(prev, route.clientId, draft));
    
    setSaveState({ isSaving: false, savedAt: Date.now() });
    setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    notify('success', 'Técnico guardado con éxito');
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
