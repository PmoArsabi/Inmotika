import { supabase } from '../utils/supabase';

/**
 * Sincroniza las sucursales asignadas a un coordinador.
 * Hace upsert de las nuevas y soft-delete (activo = false) de las removidas.
 *
 * @param {string} coordinadorId - UUID del registro en tabla `coordinador`.
 * @param {string[]} sucursalIds - Array de UUIDs de sucursales a asignar.
 * @returns {Promise<void>}
 */
export async function syncCoordinadorSucursales(coordinadorId, sucursalIds) {
  // 1. Fetch existing assignments
  const { data: existing, error: fetchError } = await supabase
    .from('sucursal_coordinador')
    .select('id, sucursal_id, activo')
    .eq('coordinador_id', coordinadorId);

  if (fetchError) throw fetchError;

  const newSet = new Set(sucursalIds);

  // 2. Upsert active entries for selected sucursales
  if (sucursalIds.length > 0) {
    const toUpsert = sucursalIds.map(sid => ({
      coordinador_id: coordinadorId,
      sucursal_id: sid,
      activo: true,
    }));
    const { error: upsertError } = await supabase
      .from('sucursal_coordinador')
      .upsert(toUpsert, { onConflict: 'sucursal_id,coordinador_id' });
    if (upsertError) throw upsertError;
  }

  // 3. Soft-delete entries that were removed
  const toDeactivate = (existing || [])
    .filter(e => !newSet.has(e.sucursal_id) && e.activo)
    .map(e => e.id);

  if (toDeactivate.length > 0) {
    const { error: deactivateError } = await supabase
      .from('sucursal_coordinador')
      .update({ activo: false })
      .in('id', toDeactivate);
    if (deactivateError) throw deactivateError;
  }
}

/**
 * Obtiene las sucursales activamente asignadas a un coordinador.
 *
 * @param {string} coordinadorId - UUID del registro en tabla `coordinador`.
 * @returns {Promise<string[]>} Array de sucursal UUIDs.
 */
export async function getCoordinadorSucursales(coordinadorId) {
  const { data, error } = await supabase
    .from('sucursal_coordinador')
    .select('sucursal_id')
    .eq('coordinador_id', coordinadorId)
    .eq('activo', true);

  if (error) throw error;
  return (data || []).map(r => r.sucursal_id);
}
