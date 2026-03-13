import React, { useState } from 'react';
import DeviceForm from '../../../modules/devices/DeviceForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyDeviceDraft, applyDeviceUpsert } from '../../../utils/entityMappers';
import { validateDevice } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';

const DeviceNavigator = ({ onClose }) => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: true, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('dispositivo', route.deviceId);
  
  const draft = drafts[key] || emptyDeviceDraft();
  const errors = validateDevice(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;
    
    setSaveState({ isSaving: true, savedAt: null });
    
    // Simulate API call for now as in original
    await new Promise(r => setTimeout(r, 400));
    
    setData(prev => applyDeviceUpsert(
      prev, 
      route.originClientId || route.clientId, 
      route.originBranchId || route.branchId, 
      route.deviceId, 
      draft
    ));
    
    setSaveState({ isSaving: false, savedAt: Date.now() });
    setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    notify('success', 'Dispositivo guardado con éxito');
  };

  return (
    <DeviceForm
      draft={draft}
      updateDraft={(patch) => updateDraft(key, patch)}
      errors={errors}
      showErrors={showErrors}
      isEditing={isEditing}
      onSave={handleSave}
      isSaving={saveState.isSaving}
      clients={data?.clientes}
      devices={data?.dispositivos || []}
    />
  );
};

export default DeviceNavigator;
