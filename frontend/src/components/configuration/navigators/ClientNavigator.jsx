import React, { useState } from 'react';
import ClientForm from '../../../modules/clients/ClientForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { 
  emptyClientDraft, 
  toClientDraft, 
  applyClientUpdate,
  emptyBranchDraft,
  toBranchDraft,
  applyBranchUpsert
} from '../../../utils/entityMappers';
import { validateClient, validateBranch } from '../../../utils/validators';

const ClientNavigator = ({ 
  setAssociateContactsModal,
  setAssociateDevicesModal,
  setAssociateContactsSelected,
  setAssociateContactsSearch,
  setAssociateDevicesSelected,
  setAssociateDevicesSearch,
}) => {
  const { 
    route, drafts, setDrafts, updateDraft, setStack,
    editingBranchId, setEditingBranchId, 
    viewBranchMode, setViewBranchMode,
    creatingNewBranch, setCreatingNewBranch,
    showErrors, setShowErrors,
    saveState, setSaveState,
    showSuccessModal, setShowSuccessModal,
    branchSuccessInfo, setBranchSuccessInfo,
    savedClientId, setSavedClientId,
  } = useConfigurationContext();
  const { data, setData } = useMasterData();

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('cliente', route.clientId);
  const isEditing = route.mode === 'edit';
  const compareIds = (id1, id2) => String(id1 || '').trim().toUpperCase() === String(id2 || '').trim().toUpperCase();

  const currentClient = (data?.clientes || []).find(c => compareIds(c.id, route?.clientId));
  const draft = drafts[key] || (currentClient ? toClientDraft(currentClient) : emptyClientDraft());
  const currentBranches = currentClient?.sucursales || [];
  const errors = validateClient(draft);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;
    setSaveState({ isSaving: true, savedAt: null });
    await new Promise(r => setTimeout(r, 400));
    
    const savedData = { ...draft, nit: `${draft.nit}-${draft.dv}`, id: route.clientId };
    setData(prev => applyClientUpdate(prev, route.clientId, savedData));
    
    const updatedDraft = toClientDraft(savedData);
    setDrafts(prev => ({ ...prev, [key]: updatedDraft }));
    
    setSaveState({ isSaving: false, savedAt: Date.now() });
    setSavedClientId(route.clientId);
    setShowSuccessModal(true);
  };

  const ensureDraft = (k, factory) => {
    if (!drafts[k]) {
      setDrafts(prev => ({ ...prev, [k]: factory() }));
    }
  };

  const handleNewBranch = () => {
    setEditingBranchId(null);
    const newBranchKey = entityKey('branch', `new-${route.clientId}`);
    ensureDraft(newBranchKey, () => emptyBranchDraft());
    setCreatingNewBranch(true);
    if (route.activeTab !== 'branches') {
      setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
    }
  };

  const handleEditBranch = (branch) => {
    const editBranchKey = entityKey('branch', `edit-${branch.id}`);
    ensureDraft(editBranchKey, () => {
      const branchDraft = toBranchDraft(branch);
      return {
        ...branchDraft,
        associatedContactIds: (branch.contactos || []).map(c => String(c.id)),
        associatedDeviceIds: (data?.dispositivos || []).filter(d => 
          String(d.branchId) === String(branch.id)
        ).map(d => String(d.id))
      };
    });
    setEditingBranchId(branch.id);
    setViewBranchMode('edit');
    if (route.activeTab !== 'branches') {
      setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
    }
  };

  const handleViewBranch = (branch) => {
    const bId = branch.id;
    const key = entityKey('branch', `view-${bId}`);
    ensureDraft(key, () => toBranchDraft(branch));
    setEditingBranchId(bId);
    setViewBranchMode('view');
    if (route.activeTab !== 'branches') {
      setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
    }
  };

  const hasBranches = currentBranches.length > 0;
  const newBranchKey = entityKey('branch', `new-${route.clientId}`);
  
  // Robust Draft Resolution: if the draft doesn't exist in context, compute it locally
  // for the render. This prevents blank pages during async initialization.
  const getDraftWithFallback = () => {
    // 1. If we are editing or viewing a specific branch in-page
    if (editingBranchId) {
      const prefix = viewBranchMode === 'view' ? 'view' : 'edit';
      const bKey = entityKey('branch', `${prefix}-${editingBranchId}`);
      if (drafts[bKey]) return { draft: drafts[bKey], key: bKey };
      
      // Fallback: search in current client's branches
      const branchObj = currentBranches.find(b => compareIds(b.id, editingBranchId));
      if (branchObj) {
        const fallbackDraft = {
          ...toBranchDraft(branchObj),
          associatedContactIds: (branchObj.contactos || []).map(c => String(c.id)),
          associatedDeviceIds: (data?.dispositivos || []).filter(d => 
            compareIds(d.branchId, branchObj.id)
          ).map(d => String(d.id))
        };
        return { draft: fallbackDraft, key: bKey };
      }
      return { draft: emptyBranchDraft(), key: bKey };
    }
    
    // 2. If we are creating a new branch (or forced to show it because client is new and has no branches)
    const isForcedNewBranch = !hasBranches && isEditing && !editingBranchId;
    if (creatingNewBranch || isForcedNewBranch) {
      if (drafts[newBranchKey]) return { draft: drafts[newBranchKey], key: newBranchKey };
      return { draft: emptyBranchDraft(), key: newBranchKey };
    }
    
    return { draft: null, key: null };
  };

  const { draft: activeBranchDraft, key: activeBranchKey } = getDraftWithFallback();
  const activeBranchErrors = activeBranchDraft ? validateBranch(activeBranchDraft) : {};
  
  const handleSaveNewBranch = async () => {
    if (!activeBranchDraft) return;
    setShowErrors(true);
    if (Object.keys(activeBranchErrors).length > 0) return;
    setSaveState({ isSaving: true, savedAt: null });
    await new Promise(r => setTimeout(r, 400));
    
    if (editingBranchId) {
      setData(prev => applyBranchUpsert(prev, route.clientId, editingBranchId, activeBranchDraft));
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[activeBranchKey];
        return updated;
      });
      setEditingBranchId(null);
    } else {
      const newId = `NEW-SUC-${Date.now()}`;
      setData(prev => applyBranchUpsert(prev, route.clientId, newId, activeBranchDraft));
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[activeBranchKey];
        return updated;
      });
      setBranchSuccessInfo({ clientId: route.clientId, branchId: newId });
      setCreatingNewBranch(false);
    }
    
    setSaveState({ isSaving: false, savedAt: Date.now() });
  };

  const handleOpenAssociateContacts = () => {
    if (!activeBranchDraft) return;
    const currentIds = activeBranchDraft.associatedContactIds || [];
    setAssociateContactsSelected(currentIds);
    setAssociateContactsSearch('');
    setAssociateContactsModal({ branchKey: activeBranchKey, clientId: route.clientId });
  };

  const handleOpenAssociateDevices = () => {
    if (!activeBranchDraft) return;
    const currentIds = activeBranchDraft.associatedDeviceIds || [];
    setAssociateDevicesSelected(currentIds);
    setAssociateDevicesSearch('');
    setAssociateDevicesModal({ branchKey: activeBranchKey, clientId: route.clientId });
  };

  const totalSucursales = currentBranches.length;
  const totalContactos = (data?.contactos || []).filter(c => compareIds(c.clientId, route.clientId)).length;
  const totalDispositivos = (data?.dispositivos || []).filter(d => compareIds(d.clientId, route.clientId)).length;

  return (
    <ClientForm
      draft={draft}
      updateDraft={(patch) => updateDraft(key, patch)}
      errors={errors}
      showErrors={showErrors}
      isEditing={isEditing}
      onSave={handleSave}
      isSaving={saveState.isSaving}
      branches={currentBranches}
      onNewBranch={handleNewBranch}
      onEditBranch={handleEditBranch}
      onViewBranch={handleViewBranch}
      activeTab={route.activeTab}
      onTabChange={(tab) => setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: tab} : r))}
      newBranchDraft={activeBranchDraft}
      updateNewBranchDraft={(patch) => updateDraft(activeBranchKey, patch)}
      newBranchErrors={activeBranchErrors}
      onSaveNewBranch={handleSaveNewBranch}
      editingBranchId={editingBranchId}
      viewBranchMode={viewBranchMode}
      onCancelEdit={() => { setEditingBranchId(null); setViewBranchMode(null); }}
      onAssociateContacts={handleOpenAssociateContacts}
      onAssociateDevices={handleOpenAssociateDevices}
      isDeviceAdmin={false}
      allDevices={data.dispositivos || []}
      totalSucursales={totalSucursales}
      totalContactos={totalContactos}
      totalDispositivos={totalDispositivos}
    />
  );
};

export default ClientNavigator;
