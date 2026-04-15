/**
 * Helpers compartidos para consultar estados del catálogo.
 * Centraliza el acceso a `catalogo` (tipo ESTADO_ENTIDAD) para evitar queries duplicadas.
 */
import { supabase } from '../utils/supabase';

/**
 * Promise cacheada del UUID del estado INACTIVO.
 * Se reutiliza en todos los soft-deletes de la sesión; se resetea al recargar la página.
 * @type {Promise<string>|null}
 */
let _estadoInactivoPromise = null;

/**
 * Obtiene el UUID del estado INACTIVO del catálogo. Cacheado por sesión (module-level promise).
 * Si la consulta falla, resetea el caché para permitir reintentos.
 *
 * @returns {Promise<string>} UUID del estado INACTIVO
 * @throws {Error} Si el estado no existe en el catálogo
 */
export function getEstadoInactivoId() {
  if (!_estadoInactivoPromise) {
    _estadoInactivoPromise = supabase
      .from('catalogo')
      .select('id')
      .eq('tipo', 'ESTADO_ENTIDAD')
      .eq('codigo', 'INACTIVO')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { _estadoInactivoPromise = null; throw error; }
        if (!data?.id) {
          _estadoInactivoPromise = null;
          throw new Error('Estado INACTIVO no encontrado en catalogo (tipo ESTADO_ENTIDAD)');
        }
        return data.id;
      });
  }
  return _estadoInactivoPromise;
}

/** Limpia el caché de estado inactivo (útil en logout o en tests). */
export function clearEstadoCache() {
  _estadoInactivoPromise = null;
}
