export const ROLES = {
  ADMIN: 'ADMIN',
  DIRECTOR: 'DIRECTOR',
  COORDINADOR: 'COORDINADOR',
  TECNICO: 'TECNICO',
  CLIENTE: 'CLIENTE',
};

/** Roles con acceso a configuración y operación interna. */
export const MANAGEMENT_ROLES = new Set([
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.COORDINADOR,
]);

/**
 * Jerarquía de roles internos (de mayor a menor autoridad).
 * Un usuario solo puede crear roles de nivel inferior o igual (ADMIN/DIRECTOR).
 * CLIENTE se gestiona desde Contactos, no desde Usuarios.
 */
export const ROLE_HIERARCHY = [
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.COORDINADOR,
  ROLES.TECNICO,
];

/**
 * Returns true if the given role belongs to the management group
 * (Admin, Director, Coordinador).
 * @param {string} role
 * @returns {boolean}
 */
export const isManagementRole = (role) => MANAGEMENT_ROLES.has(role);

/**
 * Superusuario de TI: acceso total a módulos y rutas.
 * @param {string} role
 * @returns {boolean}
 */
export const isAdminRole = (role) => role === ROLES.ADMIN;
