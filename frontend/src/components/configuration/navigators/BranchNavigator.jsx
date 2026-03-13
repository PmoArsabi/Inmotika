import React, { useState } from 'react';
import Card from '../../ui/Card';
import BranchForm from '../../forms/BranchForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyBranchDraft, applyBranchUpsert } from '../../../utils/entityMappers';
import { validateBranch } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';

const BranchNavigator = ({ setAssociateContactsModal, setAssociateDevicesModal }) => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('branch', route.branchId);
  const isEditing = route.mode === 'edit';
  const compareIds = (id1, id2) => String(id1 || '').trim().toUpperCase() === String(id2 || '').trim().toUpperCase();

  const currentClient = (data?.clientes || []).find(c => compareIds(c.id, route?.clientId));
  const currentBranch = (currentClient?.sucursales || []).find(b => compareIds(b.id, route.branchId));

  const getDraft = () => {
    if (drafts[key]) return drafts[key];
    if (currentBranch) {
      return {
        ...toBranchDraft(currentBranch),
        associatedContactIds: (currentBranch.contactos || []).map(c => String(c.id)),
        associatedDeviceIds: (data?.dispositivos || []).filter(d => 
          compareIds(d.branchId, currentBranch.id)
        ).map(d => String(d.id))
      };
    }
    return emptyBranchDraft();
  };

  const draft = getDraft();
  const errors = validateBranch(draft);

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;

    setSaveState({ isSaving: true, savedAt: null });
    
    // Simulate API call as in original
    await new Promise(r => setTimeout(r, 400));
    
    setData(prev => applyBranchUpsert(prev, route.clientId, route.branchId, draft));
    
    setSaveState({ isSaving: false, savedAt: Date.now() });
    setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    notify('success', 'Sucursal guardada con éxito');
  };

  return (
    <Card className="p-6">
      <BranchForm
        newBranchDraft={draft}
        updateNewBranchDraft={(patch) => updateDraft(key, patch)}
        newBranchErrors={errors}
        showErrors={showErrors}
        isEditing={isEditing}
        onSaveNewBranch={handleSave}
        isSaving={saveState.isSaving}
        onAssociateContacts={() => setAssociateContactsModal({ branchKey: key })}
        onAssociateDevices={() => setAssociateDevicesModal({ branchKey: key })}
        estadoSelectOptions={[{value: 'est-1', label: 'ACTIVO'}, {value: 'est-2', label: 'INACTIVO'}]}
        activoId="est-1"
        inactivoId="est-2"
        clientId={route.clientId}
      />
    </Card>
  );
};

export default BranchNavigator;
