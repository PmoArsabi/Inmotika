import React, { createContext, useContext, useState, useCallback, useReducer } from 'react';

const ConfigurationContext = createContext();

// ─── UI State Reducer ────────────────────────────────────────────────────────

/**
 * Estado consolidado para branch editing, orquestación de guardado y modales de éxito.
 * Reemplaza 8 useState independientes para garantizar transiciones atómicas.
 */
const UI_INITIAL = {
  editingBranchId:    null,
  viewBranchMode:     null,
  creatingNewBranch:  false,
  showErrors:         false,
  saveState:          { isSaving: false, savedAt: null },
  showSuccessModal:   false,
  branchSuccessInfo:  null,
  savedClientId:      null,
  contactSuccessInfo: null,
  deviceSuccessInfo:  null,
};

/** @param {typeof UI_INITIAL} state @param {{ type: string, payload?: any }} action */
function uiReducer(state, action) {
  switch (action.type) {
    case 'START_EDITING_BRANCH':
      return { ...state, editingBranchId: action.payload.branchId, viewBranchMode: action.payload.mode };
    case 'STOP_EDITING_BRANCH':
      return { ...state, editingBranchId: null, viewBranchMode: null };
    case 'START_CREATING_BRANCH':
      return { ...state, creatingNewBranch: true };
    case 'STOP_CREATING_BRANCH':
      return { ...state, creatingNewBranch: false };
    case 'SHOW_ERRORS':
      return { ...state, showErrors: true };
    case 'HIDE_ERRORS':
      return { ...state, showErrors: false };
    case 'START_SAVING':
      return { ...state, saveState: { isSaving: true, savedAt: null } };
    case 'FINISH_SAVING':
      return { ...state, saveState: { isSaving: false, savedAt: new Date() } };
    case 'FAIL_SAVING':
      return { ...state, saveState: { isSaving: false, savedAt: null } };
    case 'OPEN_CLIENT_SUCCESS':
      return { ...state, showSuccessModal: true, savedClientId: action.payload };
    case 'CLOSE_CLIENT_SUCCESS':
      return { ...state, showSuccessModal: false, savedClientId: null };
    case 'OPEN_BRANCH_SUCCESS':
      return { ...state, branchSuccessInfo: action.payload };
    case 'CLOSE_BRANCH_SUCCESS':
      return { ...state, branchSuccessInfo: null };
    case 'OPEN_CONTACT_SUCCESS':
      return { ...state, contactSuccessInfo: action.payload };
    case 'CLOSE_CONTACT_SUCCESS':
      return { ...state, contactSuccessInfo: null };
    case 'OPEN_DEVICE_SUCCESS':
      return { ...state, deviceSuccessInfo: action.payload };
    case 'CLOSE_DEVICE_SUCCESS':
      return { ...state, deviceSuccessInfo: null };
    default:
      return state;
  }
}

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

  // ─── UI State (reducer consolida 10 useState → transiciones atómicas) ────────
  const [ui, dispatchUi] = useReducer(uiReducer, UI_INITIAL);
  const {
    editingBranchId, viewBranchMode, creatingNewBranch,
    showErrors, saveState, showSuccessModal,
    branchSuccessInfo, savedClientId, contactSuccessInfo, deviceSuccessInfo,
  } = ui;

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
    dispatchUi({ type: 'START_EDITING_BRANCH', payload: { branchId, mode } });
  }, []);

  /** Clears the active branch editor, returning to the branch list. */
  const stopEditingBranch = useCallback(() => {
    dispatchUi({ type: 'STOP_EDITING_BRANCH' });
  }, []);

  /** Signals that the user started the new-branch creation flow. */
  const startCreatingBranch = useCallback(() => {
    dispatchUi({ type: 'START_CREATING_BRANCH' });
  }, []);

  /** Dismisses the new-branch creation flow. */
  const stopCreatingBranch = useCallback(() => {
    dispatchUi({ type: 'STOP_CREATING_BRANCH' });
  }, []);

  // ─── Validation Actions ───────────────────────────────────────────────────────

  /** Makes inline validation errors visible across the active form. */
  const showValidationErrors = useCallback(() => {
    dispatchUi({ type: 'SHOW_ERRORS' });
  }, []);

  /** Hides inline validation errors (e.g. on cancel). */
  const hideValidationErrors = useCallback(() => {
    dispatchUi({ type: 'HIDE_ERRORS' });
  }, []);

  // ─── Save-flow Actions ────────────────────────────────────────────────────────

  /** Marks the save flow as in-progress. */
  const startSaving = useCallback(() => {
    dispatchUi({ type: 'START_SAVING' });
  }, []);

  /** Marks the save flow as complete and records the timestamp. */
  const finishSaving = useCallback(() => {
    dispatchUi({ type: 'FINISH_SAVING' });
  }, []);

  /** Aborts the save flow without recording a timestamp (error path). */
  const failSaving = useCallback(() => {
    dispatchUi({ type: 'FAIL_SAVING' });
  }, []);

  // ─── Success Modal Actions ────────────────────────────────────────────────────

  /**
   * Opens the client success modal and records the persisted client ID.
   * @param {string|number} clientId
   */
  const openClientSuccess = useCallback((clientId) => {
    dispatchUi({ type: 'OPEN_CLIENT_SUCCESS', payload: clientId });
  }, []);

  /** Closes the client success modal and clears the saved client ID. */
  const closeClientSuccess = useCallback(() => {
    dispatchUi({ type: 'CLOSE_CLIENT_SUCCESS' });
  }, []);

  /**
   * Opens the branch success modal with context about the saved branch.
   * @param {{ clientId: string|number, branchId: string|number }} info
   */
  const openBranchSuccess = useCallback((info) => {
    dispatchUi({ type: 'OPEN_BRANCH_SUCCESS', payload: info });
  }, []);

  /** Closes the branch success modal. */
  const closeBranchSuccess = useCallback(() => {
    dispatchUi({ type: 'CLOSE_BRANCH_SUCCESS' });
  }, []);

  /**
   * Opens the contact success modal.
   * @param {{ contactId: string|number, isNew: boolean }} info
   */
  const openContactSuccess = useCallback((info) => {
    dispatchUi({ type: 'OPEN_CONTACT_SUCCESS', payload: info });
  }, []);

  /** Closes the contact success modal. */
  const closeContactSuccess = useCallback(() => {
    dispatchUi({ type: 'CLOSE_CONTACT_SUCCESS' });
  }, []);

  /**
   * Opens the device success modal.
   * @param {{ deviceId: string|number, isNew: boolean }} info
   */
  const openDeviceSuccess = useCallback((info) => {
    dispatchUi({ type: 'OPEN_DEVICE_SUCCESS', payload: info });
  }, []);

  /** Closes the device success modal. */
  const closeDeviceSuccess = useCallback(() => {
    dispatchUi({ type: 'CLOSE_DEVICE_SUCCESS' });
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
