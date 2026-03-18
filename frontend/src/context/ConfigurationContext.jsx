import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ConfigurationContext = createContext();

export const ConfigurationProvider = ({ children, initialParams = {} }) => {
  // Navigation Stack
  const [stack, setStack] = useState([{
    type: initialParams.type || 'cliente',
    clientId: initialParams.clientId || initialParams.id, // client/tecnico use id as well
    branchId: initialParams.branchId,
    contactId: initialParams.contactId,
    deviceId: initialParams.deviceId,
    mode: initialParams.mode || 'view',
    activeTab: 'details'
  }]);

  const [editingBranchId, setEditingBranchId] = useState(null);
  const [viewBranchMode, setViewBranchMode] = useState(null); // 'view' or 'edit'
  const [creatingNewBranch, setCreatingNewBranch] = useState(false);

  // Orchestration States
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [branchSuccessInfo, setBranchSuccessInfo] = useState(null);
  const [savedClientId, setSavedClientId] = useState(null);
  const [contactSuccessInfo, setContactSuccessInfo] = useState(null);
  const [deviceSuccessInfo, setDeviceSuccessInfo] = useState(null);

  const [drafts, setDrafts] = useState({});

  const updateDraft = useCallback((key, patch) => {
    setDrafts(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch }
    }));
  }, []);

  const clearDraft = useCallback((key) => {
    setDrafts(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const route = stack[stack.length - 1];

  const goBack = useCallback(() => {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    }
  }, [stack.length]);

  const pushRoute = useCallback((newRoute) => {
    setStack(prev => [...prev, newRoute]);
  }, []);

  const value = {
    stack,
    setStack,
    route,
    drafts,
    setDrafts,
    updateDraft,
    clearDraft,
    goBack,
    pushRoute,
    editingBranchId,
    setEditingBranchId,
    viewBranchMode,
    setViewBranchMode,
    creatingNewBranch,
    setCreatingNewBranch,
    showErrors,
    setShowErrors,
    saveState,
    setSaveState,
    showSuccessModal,
    setShowSuccessModal,
    branchSuccessInfo,
    setBranchSuccessInfo,
    savedClientId,
    setSavedClientId,
    contactSuccessInfo,
    setContactSuccessInfo,
    deviceSuccessInfo,
    setDeviceSuccessInfo,
  };

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

export const useConfigurationContext = () => {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error('useConfigurationContext must be used within a ConfigurationProvider');
  }
  return context;
};
