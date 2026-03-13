import { validatePhoneNumber } from '../components/ui/PhoneInput';

export const isEmailValid = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).toLowerCase());
export const isPhoneValid = (p) => !p || /^\+?[\d\s-]{7,}$/.test(p);

/**
 * Detecta secuencias de dígitos inválidas:
 * - Todos iguales: 111111, 000000
 * - Consecutivos ascendentes: 123456, 234567
 * - Consecutivos descendentes: 654321, 987654
 */
export const hasInvalidSequence = (value, minLen = 6) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < minLen) return false;
  for (let i = 0; i <= digits.length - minLen; i++) {
    const sub = digits.slice(i, i + minLen);
    if ([...sub].every(d => d === sub[0])) return true;
    const asc  = [...sub].every((d, j) => j === 0 || +d === +sub[j - 1] + 1);
    const desc = [...sub].every((d, j) => j === 0 || +d === +sub[j - 1] - 1);
    if (asc || desc) return true;
  }
  return false;
};

export const validateClient = (draft) => {
  const errors = {};
  if (!String(draft.tipoDocumento || '').trim()) errors.tipoDocumento = 'Requerido';
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.nit || '').trim()) errors.nit = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  if (draft.email && !isEmailValid(draft.email)) errors.email = 'Email inválido';
  if (draft.celular) {
    const phoneErr = validatePhoneNumber(draft.celular, draft.celularPaisIso || 'CO');
    if (phoneErr) errors.celular = phoneErr;
  }
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
  if (!String(draft.nombres || '').trim()) errors.nombres = 'Requerido';
  if (!String(draft.apellidos || '').trim()) errors.apellidos = 'Requerido';
  if (!String(draft.telefonoMovil || '').trim()) {
    errors.telefonoMovil = 'Requerido';
  } else if (hasInvalidSequence(draft.telefonoMovil)) {
    errors.telefonoMovil = 'Número inválido (secuencia repetida o consecutiva)';
  } else {
    const phoneErr = validatePhoneNumber(draft.telefonoMovil, draft.telefonoMovilPais || 'CO');
    if (phoneErr) errors.telefonoMovil = phoneErr;
  }
  if (draft.identificacion && hasInvalidSequence(draft.identificacion)) {
    errors.identificacion = 'Número inválido (secuencia repetida o consecutiva)';
  }
  if (draft.email && !isEmailValid(draft.email)) errors.email = 'Email inválido';
  return errors;
};

export const validateDevice = (draft) => {
  const errors = {};
  if (!draft.clientId) errors.clientId = 'Requerido';
  if (!draft.branchId) errors.branchId = 'Requerido';
  if (!String(draft.serial || '').trim()) errors.serial = 'Requerido';
  return errors;
};

export const validateTecnico = (draft) => {
  const errors = {};
  if (!String(draft.nombres || '').trim()) errors.nombres = 'Requerido';
  if (!String(draft.identificacion || '').trim()) errors.identificacion = 'Requerido';
  if (draft.email && !isEmailValid(draft.email)) errors.email = 'Email inválido';
  if (draft.telefono) {
    const phoneErr = validatePhoneNumber(draft.telefono, draft.telefonoPaisIso || 'CO');
    if (phoneErr) errors.telefono = phoneErr;
  }
  // Validate certificates have names
  if (Array.isArray(draft.certificados)) {
    const invalidCerts = draft.certificados.some(c => !String(c.nombre || '').trim());
    if (invalidCerts) errors.certificados = 'Todos los certificados deben tener nombre';
  }
  return errors;
};
