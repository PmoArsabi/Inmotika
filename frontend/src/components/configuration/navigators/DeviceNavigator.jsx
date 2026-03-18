import React, { useState } from 'react';
import { emptyDeviceDraft, applyDeviceUpsert, toDeviceDraft } from '../../../utils/entityMappers';
import { validateDevice } from '../../../utils/validators';
import { saveDevice } from '../../../api/deviceApi';
import { useNotify } from '../../../context/NotificationContext';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import DeviceForm from '../../../modules/devices/DeviceForm';

const DeviceNavigator = ({ onClose }) => {
  const { route, drafts, updateDraft, setStack, setDeviceSuccessInfo } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('dispositivo', route.deviceId);
  
  const currentDevice = (data?.dispositivos || []).find(d => String(d.id) === String(route?.deviceId));
  
  // Try to get from drafts, but if it's an empty object or doesn't have critical data for an existing item, use the MasterData
  const existingDraft = drafts[key];
  const isDraftEmpty = !existingDraft || Object.keys(existingDraft).length === 0;
  
  const draft = (!isDraftEmpty && (route.mode === 'edit' || existingDraft.serial))
    ? existingDraft 
    : (currentDevice ? toDeviceDraft(currentDevice) : emptyDeviceDraft());
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
      setDeviceSuccessInfo({ isNew: isEditing && !currentDevice, deviceId: mapped.id });
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
