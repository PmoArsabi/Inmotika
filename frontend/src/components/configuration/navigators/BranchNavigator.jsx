import React, { useState, useRef, useEffect } from 'react';
import Card from '../../ui/Card';
import BranchForm from '../../forms/BranchForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyBranchDraft, toBranchDraft, applyBranchUpsert } from '../../../utils/entityMappers';
import { validateBranch } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { useCatalog } from '../../../hooks/useCatalog';
import { saveSucursal } from '../../../api/sucursalApi';

const BranchNavigator = ({
  setAssociateContactsModal, setAssociateContactsSelected, setAssociateContactsSearch,
  setAssociateDevicesModal, setAssociateDevicesSelected, setAssociateDevicesSearch,
}) => {
  const { route, drafts, setDrafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const { user } = useAuth();
  const { options: tipoVisitaOptions } = useCatalog('TIPO_VISITA');
  const { options: estadoVisitaOptions } = useCatalog('ESTADO_VISITA');
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const saveBranchInFlightRef = useRef(false);

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

  // Seed draft into context on mount so the first onChange merges over a
  // complete draft (with pais: 'CO' etc.) rather than {}.
  useEffect(() => {
    if (!route.branchId) return;
    if (drafts[key]) return;
    const base = getDraft();
    setDrafts(prev => ({ ...prev, [key]: base }));
  }, [route.branchId, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const draft = getDraft();
  const errors = validateBranch(draft);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;
    if (saveBranchInFlightRef.current) return;
    saveBranchInFlightRef.current = true;
    setSaveState({ isSaving: true, savedAt: null });

    try {
      const catalogIds = {
        tipoPreventivId: tipoVisitaOptions.find(o => o.codigo === 'PREVENTIVO')?.value,
        estadoPendienteId: estadoVisitaOptions.find(o => o.codigo === 'PENDIENTE')?.value,
        estadoProgramadaId: estadoVisitaOptions.find(o => o.codigo === 'PROGRAMADA')?.value,
        userId: user?.id,
      };
      const { sucursalId, contratos } = await saveSucursal({
        sucursalId: route.branchId,
        clienteId: route.clientId,
        draft,
        catalogIds,
      });
      const finalDraft = { ...draft, id: sucursalId, contratos };

      setData(prev => {
        const withBranch = applyBranchUpsert(prev, route.clientId, sucursalId, finalDraft);
        const deviceIds = new Set((finalDraft.associatedDeviceIds || []).map(String));
        if (deviceIds.size === 0) return withBranch;
        const updatedDispositivos = (withBranch.dispositivos || []).map(d =>
          deviceIds.has(String(d.id)) ? { ...d, branchId: sucursalId, sucursal_id: sucursalId } : d
        );
        return { ...withBranch, dispositivos: updatedDispositivos };
      });

      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view', branchId: sucursalId } : s));
      notify('success', 'Sucursal guardada con éxito');
    } catch (err) {
      console.error('Error guardando sucursal:', err);
      notify('error', err?.message || 'Error al guardar la sucursal');
      setSaveState({ isSaving: false, savedAt: null });
    } finally {
      saveBranchInFlightRef.current = false;
    }
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
        onAssociateContacts={() => {
          if (!drafts[key]) updateDraft(key, draft);
          const currentIds = (drafts[key] || draft).associatedContactIds || [];
          setAssociateContactsSelected(currentIds);
          setAssociateContactsSearch('');
          setAssociateContactsModal({ branchKey: key, clientId: route.clientId });
        }}
        onAssociateDevices={() => {
          if (!drafts[key]) updateDraft(key, draft);
          const currentIds = (drafts[key] || draft).associatedDeviceIds || [];
          setAssociateDevicesSelected(currentIds);
          setAssociateDevicesSearch('');
          setAssociateDevicesModal({ branchKey: key, clientId: route.clientId, branchId: route.branchId });
        }}
        estadoSelectOptions={[{value: 'est-1', label: 'ACTIVO'}, {value: 'est-2', label: 'INACTIVO'}]}
        activoId="est-1"
        inactivoId="est-2"
        clientId={route.clientId}
      />
    </Card>
  );
};

export default BranchNavigator;
