import React, { useState } from 'react';
import TechnicianForm from '../../../modules/users/components/TechnicianForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyTecnicoDraft, applyTecnicoUpsert } from '../../../utils/entityMappers';
import { validateTecnico } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';
import { saveTecnico } from '../../../api/tecnicoApi';

const TechnicalNavigator = () => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('tecnico', route.clientId);

  const draft = drafts[key] || emptyTecnicoDraft();
  const errors = validateTecnico(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;

    for (const cert of (draft.certificados || [])) {
      if (!cert.nombre?.trim()) {
        notify('error', `El certificado con ID ${cert.id} no tiene nombre.`);
        return;
      }
    }

    setSaveState({ isSaving: true, savedAt: null });

    try {
      const { techId, documentoCedulaUrl, planillaSegSocialUrl, certificados } = await saveTecnico({
        usuarioId: draft.usuarioId,
        techId: draft.id,
        draft: {
          ...draft,
          certificados: draft.certificados?.map(c => ({ ...c, url: c.url })) ?? [],
        },
      });

      const finalDraft = {
        ...draft,
        id: techId,
        documentoCedulaUrl,
        planillaSegSocialUrl,
        certificados,
      };

      setData(prev => applyTecnicoUpsert(prev, techId, finalDraft));
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
