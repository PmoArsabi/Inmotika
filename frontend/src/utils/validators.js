export const isEmailValid = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).toLowerCase());
export const isPhoneValid = (p) => !p || /^\+?[\d\s-]{7,}$/.test(p);

/** Dígitos esperados por país ISO. */
const PHONE_LENGTH = {
  'CO': 10, 'US': 10, 'MX': 10, 'AR': 10, 'CL': 9,
  'PE': 9,  'EC': 9,  'VE': 10, 'BO': 8,  'PY': 9,
  'UY': 8,  'BR': 11, 'CR': 8,  'PA': 8,  'GT': 8,
  'HN': 8,  'NI': 8,  'SV': 8,  'DO': 10, 'CU': 8,
  'ES': 9,  'FR': 10, 'GB': 10, 'DE': 10, 'IT': 10,
  'PT': 9,  'NL': 10, 'BE': 9,  'CH': 9,  'AT': 10,
  'CA': 10, 'AU': 9,  'NZ': 9,  'JP': 10, 'CN': 11,
  'IN': 10, 'KR': 10, 'SG': 8,  'MY': 9,  'TH': 9,
};

/**
 * Valida un número de teléfono según el país ISO.
 * Devuelve null si es válido, string de error si no lo es.
 * @param {string} phoneNumber
 * @param {string} countryIso - Código ISO del país (ej. 'CO')
 * @returns {string|null}
 */
export const validatePhoneNumber = (phoneNumber, countryIso) => {
  if (!phoneNumber) return null;
  const digits = String(phoneNumber).replace(/\D/g, '');
  if (!digits) return null;

  const expectedLen = PHONE_LENGTH[countryIso];
  if (expectedLen && digits.length !== expectedLen) {
    return `Debe tener ${expectedLen} dígitos`;
  }
  if (/^(\d)\1+$/.test(digits)) return 'Número inválido';

  if (digits.length >= 7) {
    let asc = true;
    for (let i = 1; i < digits.length; i++) {
      if (+digits[i] !== +digits[i - 1] + 1) { asc = false; break; }
    }
    if (asc) return 'Número inválido';

    let desc = true;
    for (let i = 1; i < digits.length; i++) {
      if (+digits[i] !== +digits[i - 1] - 1) { desc = false; break; }
    }
    if (desc) return 'Número inválido';
  }
  return null;
};

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
