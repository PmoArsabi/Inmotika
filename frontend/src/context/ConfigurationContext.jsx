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

  // Drafts Management (LocalStorage + State)
  const [drafts, setDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem('config-drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('config-drafts', JSON.stringify(drafts));
  }, [drafts]);

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
    setCreatingNewBranch
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
