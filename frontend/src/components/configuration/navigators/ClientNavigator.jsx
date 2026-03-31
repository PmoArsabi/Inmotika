import React, { useState, useRef, useEffect } from 'react';
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
import { useCatalog } from '../../../hooks/useCatalog';
import { saveSucursal } from '../../../api/sucursalApi';
import { saveCliente, syncClientDirectors } from '../../../api/clienteApi';
import { useUsers } from '../../../hooks/useUsers';
import { useNotify } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { sendEmail } from '../../../hooks/useEmail';

const ClientNavigator = ({ 
  setAssociateContactsModal,
  setAssociateDevicesModal,
  setAssociateContactsSelected,
  setAssociateContactsSearch,
  setAssociateDevicesSelected,
  setAssociateDevicesSearch,
  setAssociateDirectorsModal,
  setAssociateDirectorsSelected,
  setAssociateDirectorsSearch,
}) => {
  const {
    route, drafts, setDrafts, updateDraft, setStack,
    editingBranchId, viewBranchMode, creatingNewBranch,
    showErrors, saveState,
    startEditingBranch, stopEditingBranch, startCreatingBranch, stopCreatingBranch,
    showValidationErrors, startSaving, finishSaving, failSaving,
    openClientSuccess, openBranchSuccess,
  } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const { activeDirectors } = useUsers();
  const notify = useNotify();
  const { user } = useAuth();
  const { options: tipoPersonaOptions } = useCatalog('TIPO_PERSONA');
  const { options: tipoVisitaOptions }  = useCatalog('TIPO_VISITA');
  const { options: estadoVisitaOptions } = useCatalog('ESTADO_VISITA');
  const tipoPersonaIdNatural = tipoPersonaOptions.find(o => o.codigo === 'NATURAL')?.value || '';
  const tipoPersonaIdJuridica = tipoPersonaOptions.find(o => o.codigo === 'JURIDICA')?.value || '';

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('cliente', route.clientId);
  const isEditing = route.mode === 'edit';
  const compareIds = (id1, id2) => String(id1 || '').trim().toUpperCase() === String(id2 || '').trim().toUpperCase();

  const currentClient = (data?.clientes || []).find(c => compareIds(c.id, route?.clientId));

  // Seed the draft into context on mount so the first onChange always merges
  // over a complete draft (with all defaults like pais: 'CO') rather than {}.
  useEffect(() => {
    if (!route.clientId) return;
    if (drafts[key]) return; // already seeded — don't overwrite in-progress edits
    const base = currentClient ? toClientDraft(currentClient) : emptyClientDraft();
    setDrafts(prev => ({ ...prev, [key]: base }));
  }, [route.clientId, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const draft = drafts[key] ?? (currentClient ? toClientDraft(currentClient) : emptyClientDraft());

  const currentBranches = currentClient?.sucursales || [];
  const errors = validateClient(draft);
  const hasErrors = Object.keys(errors).length > 0;

  const [saveError, setSaveError] = useState(null);
  const saveBranchInFlightRef = useRef(false);

  const handleSave = async () => {
    showValidationErrors();
    setSaveError(null);
    if (hasErrors) {
      notify('error', 'Por favor complete los campos obligatorios (' + Object.keys(errors).join(', ') + ')');
      return;
    }
    const tipoPersonaId = draft.tipoPersonaId || (draft.tipoDocumento === 'NIT' ? tipoPersonaIdJuridica : tipoPersonaIdNatural) || tipoPersonaIdNatural;
    if (!tipoPersonaId) {
      setSaveError('Cargando opciones de tipo de persona. Espere un momento e intente de nuevo.');
      return;
    }
    startSaving();

    try {
      const { clientId: realId, savedData } = await saveCliente({
        clientId: route.clientId,
        draft,
        tipoPersonaId,
      });

      const isNew = key !== entityKey('cliente', realId);
      if (isNew) {
        sendEmail('cliente_creado', {
          destinatario: user?.email || '',
          nombreCliente: draft.nombre || '',
          ruc: draft.nit ? `${draft.nit}${draft.dv ? `-${draft.dv}` : ''}` : '—',
          ciudad: draft.ciudad || '—',
          responsable: user?.email || '',
          appUrl: window.location.origin,
        });
        setData(prev => ({ ...prev, clientes: [...(prev.clientes || []), savedData] }));
        const updatedDraft = toClientDraft({ ...savedData, razon_social: draft.nombre });
        setDrafts(prev => {
          const next = { ...prev };
          delete next[key];
          next[entityKey('cliente', realId)] = updatedDraft;
          return next;
        });
        setStack(prev => prev.map((r, i) => i === prev.length - 1 ? { ...r, clientId: realId } : r));
      } else {
        setData(prev => applyClientUpdate(prev, realId, savedData));
        setDrafts(prev => ({ ...prev, [key]: toClientDraft(savedData) }));
      }
      // Sync directors
      if (draft.associatedDirectorIds) {
        await syncClientDirectors(realId, draft.associatedDirectorIds);
      }

      finishSaving();
      openClientSuccess(realId);
    } catch (err) {
      setSaveError(err?.message ?? 'Error al guardar el cliente');
      failSaving();
    }
  };


  const handleNewBranch = () => {
    stopEditingBranch();
    const newBranchKey = entityKey('branch', `new-${route.clientId}`);
    // Usar setDrafts directo (no ensureDraft) para garantizar que el draft completo
    // (con pais: 'CO') esté en contexto ANTES del primer render del formulario.
    // ensureDraft era no-atómico: si el usuario editaba antes del setState, el draft
    // se creaba desde {} perdiendo los valores por defecto (pais, etc).
    setDrafts(prev => prev[newBranchKey] ? prev : { ...prev, [newBranchKey]: emptyBranchDraft() });
    startCreatingBranch();
    if (route.activeTab !== 'branches') {
      setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
    }
  };

  const handleEditBranch = (branch) => {
    const editBranchKey = entityKey('branch', `edit-${branch.id}`);

    // Al editar desde el listado, siempre refrescamos el draft con la data actual del MasterData
    // para asegurar que los cambios de la base de datos se vean reflejados inmediatamente.
    const freshDraft = {
      ...toBranchDraft(branch),
      associatedContactIds: (branch.contactos || []).map(c => String(c.id)),
      associatedDeviceIds: (data?.dispositivos || []).filter(d =>
        String(d.branchId) === String(branch.id)
      ).map(d => String(d.id))
    };
    setDrafts(prev => ({ ...prev, [editBranchKey]: freshDraft }));

    startEditingBranch(branch.id, 'edit');
    if (route.activeTab !== 'branches') {
      setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
    }
  };

  const handleViewBranch = (branch) => {
    const bId = branch.id;
    const viewKey = entityKey('branch', `view-${bId}`);

    // Para ver, siempre usamos la data más fresca
    setDrafts(prev => ({ ...prev, [viewKey]: toBranchDraft(branch) }));

    startEditingBranch(bId, 'view');
    if (route.activeTab !== 'branches') {
      setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
    }
  };


  // NOTA: Se ha eliminado el fetch asíncrono de directores local porque `associatedDirectorIds` 
  // ya viene hidratado y mapeado desde `MasterDataContext`.


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

  // Seed branch draft into context when it's computed locally (fallback path).
  // Without this, the first onChange call merges over {} losing pais: 'CO' etc.
  useEffect(() => {
    if (!activeBranchKey || !activeBranchDraft) return;
    if (drafts[activeBranchKey]) return; // already seeded
    setDrafts(prev => ({ ...prev, [activeBranchKey]: activeBranchDraft }));
  }, [activeBranchKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveNewBranch = async () => {
    if (!activeBranchDraft) return;
    if (saveBranchInFlightRef.current) return;
    showValidationErrors();
    if (Object.keys(activeBranchErrors).length > 0) return;
    saveBranchInFlightRef.current = true;
    startSaving();

    try {
      const catalogIds = {
        tipoPreventivId: tipoVisitaOptions.find(o => o.codigo === 'PREVENTIVO')?.value,
        estadoPendienteId: estadoVisitaOptions.find(o => o.codigo === 'PENDIENTE')?.value,
        estadoProgramadaId: estadoVisitaOptions.find(o => o.codigo === 'PROGRAMADA')?.value,
        userId: user?.id,
      };
      const { sucursalId, contratos } = await saveSucursal({
        sucursalId: editingBranchId,
        clienteId: route.clientId,
        draft: activeBranchDraft,
        catalogIds,
      });
      const finalDraft = { ...activeBranchDraft, id: sucursalId, contratos };

      setData(prev => {
        const withBranch = applyBranchUpsert(prev, route.clientId, sucursalId, finalDraft);
        // Actualizar branchId en dispositivos asociados para reflejo inmediato en UI
        const deviceIds = new Set((finalDraft.associatedDeviceIds || []).map(String));
        if (deviceIds.size === 0) return withBranch;
        const updatedDispositivos = (withBranch.dispositivos || []).map(d =>
          deviceIds.has(String(d.id)) ? { ...d, branchId: sucursalId, sucursal_id: sucursalId } : d
        );
        return { ...withBranch, dispositivos: updatedDispositivos };
      });
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[activeBranchKey];
        return updated;
      });
      if (editingBranchId) {
        stopEditingBranch();
      } else {
        openBranchSuccess({ clientId: route.clientId, branchId: sucursalId });
        stopCreatingBranch();
      }
      finishSaving();
      setSaveError(null);
    } catch (err) {
      console.error('Error guardando sucursal:', err);
      failSaving();
      setSaveError(err?.message ?? 'Error al guardar la sucursal');
    } finally {
      saveBranchInFlightRef.current = false;
    }
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
    setAssociateDevicesModal({ branchKey: activeBranchKey, clientId: route.clientId, branchId: editingBranchId });
  };

  const handleOpenAssociateDirectors = () => {
    // Si no hay draft en el contexto, lo inicializamos con los datos actuales
    if (!drafts[key]) {
      updateDraft(key, draft);
    }
    const currentIds = draft.associatedDirectorIds || [];
    setAssociateDirectorsSelected(currentIds);
    setAssociateDirectorsSearch('');
    setAssociateDirectorsModal({ key, allDirectors: activeDirectors });
  };

  const totalSucursales = currentBranches.length;
  const totalContactos = (data?.contactos || []).filter(c => compareIds(c.clientId, route.clientId)).length;
  const totalDispositivos = (data?.dispositivos || []).filter(d => compareIds(d.clientId, route.clientId)).length;

  return (
    <>
      {saveError && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {saveError}
        </div>
      )}
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
      onCancelEdit={stopEditingBranch}
      onAssociateContacts={handleOpenAssociateContacts}
      onAssociateDevices={handleOpenAssociateDevices}
      onAssociateDirectors={handleOpenAssociateDirectors}
      isDeviceAdmin={false}
      allDevices={data.dispositivos || []}
      totalSucursales={totalSucursales}
      totalContactos={totalContactos}
      totalDispositivos={totalDispositivos}
      />
    </>
  );
};

export default ClientNavigator;
