export const ROLES = {
  ADMIN: 'ADMIN',
  DIRECTOR: 'DIRECTOR',
  COORDINADOR: 'COORDINADOR',
  TECNICO: 'TECNICO',
  CLIENTE: 'CLIENTE'
};

export const MANAGEMENT_ROLES = new Set([ROLES.ADMIN, ROLES.DIRECTOR, ROLES.COORDINADOR]);

/**
 * Returns true if the given role belongs to the management group
 * (Admin, Director, Coordinador). Centralizes the check to avoid
 * scattered inline comparisons across the codebase.
 * @param {string} role
 * @returns {boolean}
 */
export const isManagementRole = (role) => MANAGEMENT_ROLES.has(role);
