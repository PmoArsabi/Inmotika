import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfigurationContext = createContext();

/**
 * Provides navigation stack, draft management, and named actions for all
 * configuration sub-navigators. Named actions replace raw setters in the
 * public API to guarantee atomic, consistent state transitions and prevent
 * consumers from mutating related pieces of state independently.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {object}  [props.initialParams] - Seed values for the first route on the stack.
 */
export const ConfigurationProvider = ({ children, initialParams = {} }) => {
  // ─── Navigation Stack ────────────────────────────────────────────────────────
  const [stack, setStack] = useState([{
    type: initialParams.type || 'cliente',
    clientId: initialParams.clientId || initialParams.id,
    branchId: initialParams.branchId,
    contactId: initialParams.contactId,
    deviceId: initialParams.deviceId,
    mode: initialParams.mode || 'view',
    activeTab: 'details'
  }]);

  // ─── Branch Editing ──────────────────────────────────────────────────────────
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [viewBranchMode, setViewBranchMode] = useState(null);
  const [creatingNewBranch, setCreatingNewBranch] = useState(false);

  // ─── Orchestration / Save Flow ───────────────────────────────────────────────
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [branchSuccessInfo, setBranchSuccessInfo] = useState(null);
  const [savedClientId, setSavedClientId] = useState(null);
  const [contactSuccessInfo, setContactSuccessInfo] = useState(null);
  const [deviceSuccessInfo, setDeviceSuccessInfo] = useState(null);

  // ─── Drafts ──────────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState({});

  // ─── Draft Actions ───────────────────────────────────────────────────────────

  /** Merges a partial patch into the draft identified by `key`. */
  const updateDraft = useCallback((key, patch) => {
    setDrafts(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch }
    }));
  }, []);

  /** Removes the draft identified by `key` from the drafts map. */
  const clearDraft = useCallback((key) => {
    setDrafts(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // ─── Navigation Actions ──────────────────────────────────────────────────────

  const route = stack[stack.length - 1];

  /** Pops the top entry from the navigation stack. No-op when the stack has one item. */
  const goBack = useCallback(() => {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    }
  }, [stack.length]);

  /** Pushes a new route onto the navigation stack. */
  const pushRoute = useCallback((newRoute) => {
    setStack(prev => [...prev, newRoute]);
  }, []);

  // ─── Branch Editing Actions ───────────────────────────────────────────────────

  /**
   * Activates in-page branch editing or viewing.
   * @param {string|number} branchId
   * @param {'edit'|'view'} mode
   */
  const startEditingBranch = useCallback((branchId, mode) => {
    setEditingBranchId(branchId);
    setViewBranchMode(mode);
  }, []);

  /** Clears the active branch editor, returning to the branch list. */
  const stopEditingBranch = useCallback(() => {
    setEditingBranchId(null);
    setViewBranchMode(null);
  }, []);

  /** Signals that the user started the new-branch creation flow. */
  const startCreatingBranch = useCallback(() => {
    setCreatingNewBranch(true);
  }, []);

  /** Dismisses the new-branch creation flow. */
  const stopCreatingBranch = useCallback(() => {
    setCreatingNewBranch(false);
  }, []);

  // ─── Validation Actions ───────────────────────────────────────────────────────

  /** Makes inline validation errors visible across the active form. */
  const showValidationErrors = useCallback(() => {
    setShowErrors(true);
  }, []);

  /** Hides inline validation errors (e.g. on cancel). */
  const hideValidationErrors = useCallback(() => {
    setShowErrors(false);
  }, []);

  // ─── Save-flow Actions ────────────────────────────────────────────────────────

  /** Marks the save flow as in-progress. */
  const startSaving = useCallback(() => {
    setSaveState({ isSaving: true, savedAt: null });
  }, []);

  /** Marks the save flow as complete and records the timestamp. */
  const finishSaving = useCallback(() => {
    setSaveState({ isSaving: false, savedAt: new Date() });
  }, []);

  /** Aborts the save flow without recording a timestamp (error path). */
  const failSaving = useCallback(() => {
    setSaveState({ isSaving: false, savedAt: null });
  }, []);

  // ─── Success Modal Actions ────────────────────────────────────────────────────

  /**
   * Opens the client success modal and records the persisted client ID.
   * @param {string|number} clientId
   */
  const openClientSuccess = useCallback((clientId) => {
    setShowSuccessModal(true);
    setSavedClientId(clientId);
  }, []);

  /** Closes the client success modal and clears the saved client ID. */
  const closeClientSuccess = useCallback(() => {
    setShowSuccessModal(false);
    setSavedClientId(null);
  }, []);

  /**
   * Opens the branch success modal with context about the saved branch.
   * @param {{ clientId: string|number, branchId: string|number }} info
   */
  const openBranchSuccess = useCallback((info) => {
    setBranchSuccessInfo(info);
  }, []);

  /** Closes the branch success modal. */
  const closeBranchSuccess = useCallback(() => {
    setBranchSuccessInfo(null);
  }, []);

  /**
   * Opens the contact success modal.
   * @param {{ contactId: string|number, isNew: boolean }} info
   */
  const openContactSuccess = useCallback((info) => {
    setContactSuccessInfo(info);
  }, []);

  /** Closes the contact success modal. */
  const closeContactSuccess = useCallback(() => {
    setContactSuccessInfo(null);
  }, []);

  /**
   * Opens the device success modal.
   * @param {{ deviceId: string|number, isNew: boolean }} info
   */
  const openDeviceSuccess = useCallback((info) => {
    setDeviceSuccessInfo(info);
  }, []);

  /** Closes the device success modal. */
  const closeDeviceSuccess = useCallback(() => {
    setDeviceSuccessInfo(null);
  }, []);

  // ─── Context Value ────────────────────────────────────────────────────────────
  const value = {
    // Read-only state
    stack,
    route,
    drafts,
    editingBranchId,
    viewBranchMode,
    creatingNewBranch,
    showErrors,
    saveState,
    showSuccessModal,
    branchSuccessInfo,
    savedClientId,
    contactSuccessInfo,
    deviceSuccessInfo,

    // Raw setters kept for consumers that perform complex inline mutations
    // on the stack or drafts map (e.g. ClientNavigator, ContactNavigator).
    // Do not use these for simple flag toggles — prefer named actions above.
    setStack,
    setDrafts,

    // Draft actions
    updateDraft,
    clearDraft,

    // Navigation actions
    goBack,
    pushRoute,

    // Branch editing actions
    startEditingBranch,
    stopEditingBranch,
    startCreatingBranch,
    stopCreatingBranch,

    // Validation actions
    showValidationErrors,
    hideValidationErrors,

    // Save-flow actions
    startSaving,
    finishSaving,
    failSaving,

    // Success modal actions
    openClientSuccess,
    closeClientSuccess,
    openBranchSuccess,
    closeBranchSuccess,
    openContactSuccess,
    closeContactSuccess,
    openDeviceSuccess,
    closeDeviceSuccess,
  };

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfigurationContext = () => {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error('useConfigurationContext must be used within a ConfigurationProvider');
  }
  return context;
};
