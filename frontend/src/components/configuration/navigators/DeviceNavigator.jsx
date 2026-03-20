import React, { useState, useEffect } from 'react';
import { emptyDeviceDraft, applyDeviceUpsert, toDeviceDraft } from '../../../utils/entityMappers';
import { validateDevice } from '../../../utils/validators';
import { saveDevice } from '../../../api/deviceApi';
import { useNotify } from '../../../context/NotificationContext';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import DeviceForm from '../../../modules/devices/DeviceForm';

const DeviceNavigator = ({ onClose }) => {
  const { route, drafts, setDrafts, updateDraft, openDeviceSuccess } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('dispositivo', route.deviceId);

  const currentDevice = (data?.dispositivos || []).find(d => String(d.id) === String(route?.deviceId));

  // Seed the draft into context as soon as we have fresh MasterData.
  // Without this, the first onChange merges the patch over {} (empty),
  // wiping every field that wasn't just edited.
  useEffect(() => {
    if (!route.deviceId || !currentDevice) return;
    if (drafts[key]) return; // already seeded — don't overwrite in-progress edits
    setDrafts(prev => ({ ...prev, [key]: toDeviceDraft(currentDevice) }));
  }, [route.deviceId, currentDevice, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const draft = drafts[key] ?? (currentDevice ? toDeviceDraft(currentDevice) : emptyDeviceDraft());
  const errors = validateDevice(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;
    
    setSaveState({ isSaving: true, savedAt: null });
    
    try {
      const saved = await saveDevice(draft);
      const mapped = toDeviceDraft(saved);
      
      setData(prev => applyDeviceUpsert(
        prev, 
        route.originClientId || route.clientId, 
        route.originBranchId || route.branchId, 
        mapped.id, 
        mapped
      ));
      
      setSaveState({ isSaving: false, savedAt: Date.now() });
      openDeviceSuccess({ isNew: isEditing && !currentDevice, deviceId: mapped.id });
    } catch (err) {
      console.error('Error saving device:', err);
      notify('error', 'Error al guardar el dispositivo');
      setSaveState({ isSaving: false, savedAt: null });
    }
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
