export const isEmailValid = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const isPhoneValid = (p) => !p || /^\+?[\d\s-]{7,}$/.test(p);

export const validateClient = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.nit || '').trim()) errors.nit = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  return errors;
};

export const validateBranch = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  return errors;
};

export const validateContact = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.telefonoMovil || '').trim()) errors.telefonoMovil = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  return errors;
};

export const validateDevice = (draft) => {
  const errors = {};
  if (!draft.clientId) errors.clientId = 'Requerido';
  if (!draft.branchId) errors.branchId = 'Requerido';
  if (!draft.codigoUnico) errors.codigoUnico = 'Requerido';
  if (!draft.serial) errors.serial = 'Requerido';
  return errors;
};

export const validateTecnico = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.identificacion || '').trim()) errors.identificacion = 'Requerido';
  if (!isEmailValid(draft.correo)) errors.correo = 'Email inválido';
  if (!isPhoneValid(draft.celular)) errors.celular = 'Teléfono inválido';
  return errors;
};
