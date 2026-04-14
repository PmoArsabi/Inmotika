export const ROLES = {
  DIRECTOR: 'DIRECTOR',
  COORDINADOR: 'COORDINADOR',
  TECNICO: 'TECNICO',
  CLIENTE: 'CLIENTE'
};

export const MANAGEMENT_ROLES = new Set([ROLES.DIRECTOR, ROLES.COORDINADOR]);

/**
 * Jerarquía de roles internos (de mayor a menor autoridad).
 * Un usuario solo puede crear roles de nivel inferior al suyo.
 * CLIENTE se gestiona desde la sección Contactos, no desde Usuarios.
 */
export const ROLE_HIERARCHY = [ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.TECNICO];

/**
 * Returns true if the given role belongs to the management group
 * (Admin, Director, Coordinador). Centralizes the check to avoid
 * scattered inline comparisons across the codebase.
 * @param {string} role
 * @returns {boolean}
 */
export const isManagementRole = (role) => MANAGEMENT_ROLES.has(role);
