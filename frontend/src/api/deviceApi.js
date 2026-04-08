import { supabase } from '../utils/supabase';

/**
 * Obtiene el historial de traslados de un dispositivo con datos de sucursales.
 * @param {string} dispositivoId
 * @returns {Promise<Array>}
 */
export const getTrasladosByDevice = async (dispositivoId) => {
  const { data, error } = await supabase
    .from('historial_traslado')
    .select(`
      id,
      fecha_traslado,
      motivo,
      usuario_id,
      sucursal_origen:sucursal_origen_id (id, nombre, cliente:cliente_id (razon_social)),
      sucursal_destino:sucursal_destino_id (id, nombre, cliente:cliente_id (razon_social)),
      usuario:usuario_id (nombres, apellidos)
    `)
    .eq('dispositivo_id', dispositivoId)
    .order('fecha_traslado', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Crea un nuevo registro de traslado.
 * @param {{ dispositivoId: string, sucursalOrigenId: string, sucursalDestinoId: string, fechaTraslado: string, motivo: string, usuarioId: string }} payload
 * @returns {Promise<Object>}
 */
export const createTraslado = async ({ dispositivoId, sucursalOrigenId, sucursalDestinoId, fechaTraslado, motivo, usuarioId }) => {
  const { data, error } = await supabase
    .from('historial_traslado')
    .insert([{
      dispositivo_id:      dispositivoId,
      sucursal_origen_id:  sucursalOrigenId,
      sucursal_destino_id: sucursalDestinoId,
      fecha_traslado:      fechaTraslado,
      motivo,
      usuario_id:          usuarioId,
    }])
    .select(`
      id,
      fecha_traslado,
      motivo,
      sucursal_origen:sucursal_origen_id (id, nombre, cliente:cliente_id (razon_social)),
      sucursal_destino:sucursal_destino_id (id, nombre, cliente:cliente_id (razon_social)),
      usuario:usuario_id (nombres, apellidos)
    `)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Fetch all active devices.
 */
export const getDevices = async () => {
  const { data, error } = await supabase
    .from('dispositivo')
    .select(`
      *,
      categoria:categoria_id(nombre),
      cliente:cliente_id(razon_social),
      sucursal:sucursal_id(nombre),
      proveedor:proveedor_id(nombre),
      marca:marca_id(nombre),
      estado_gestion:estado_gestion_id(nombre)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Fetch a single device by ID with its full details.
 */
export const getDeviceById = async (id) => {
  const { data, error } = await supabase
    .from('dispositivo')
    .select(`
      *,
      categoria:categoria_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Save (Insert or Update) a device.
 */
export const saveDevice = async (deviceDraft) => {
  const {
    id,
    clientId,
    branchId,
    categoriaId,
    estadoId,
    serial,
    linea,
    modelo,
    imac,
    esDeInmotika,
    frecuenciaMantenimientoMeses,
    fechaProximoMantenimiento,
    notasTecnicas,
    idInmotika,
    codigoUnico,
    proveedorId,
    marcaId,
    estadoGestionId,
    fechaCompra,
    fechaCaducidad,
  } = deviceDraft;

  const deviceData = {
    cliente_id: clientId || null,
    sucursal_id: branchId || null,
    categoria_id: categoriaId || null,
    estado_id: estadoId || null,
    serial,
    linea,
    modelo,
    mac_address: imac,
    es_de_inmotika: !!esDeInmotika,
    frecuencia_mantenimiento_meses: frecuenciaMantenimientoMeses || null,
    fecha_proximo_mantenimiento: fechaProximoMantenimiento || null,
    notas_tecnicas: notasTecnicas,
    id_inmotika: idInmotika,
    codigo_unico: codigoUnico || null,
    proveedor_id: proveedorId || null,
    marca_id: marcaId || null,
    estado_gestion_id: estadoGestionId || null,
    fecha_compra: fechaCompra || null,
    fecha_caducidad: fechaCaducidad || null,
  };

  // Check if it's a new device (UUID starting with 'new-' or similar frontend-generated ID)
  const isNew = String(id).startsWith('new-') || String(id).startsWith('NEW-') || !id;

  if (isNew) {
    const { data: inserted, error } = await supabase
      .from('dispositivo')
      .insert([deviceData])
      .select(`
        *,
        categoria:categoria_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre),
        proveedor:proveedor_id(nombre),
        marca:marca_id(nombre),
        estado_gestion:estado_gestion_id(nombre)
      `)
      .single();
    if (error) throw error;
    return inserted;
  } else {
    const { data: updated, error } = await supabase
      .from('dispositivo')
      .update(deviceData)
      .eq('id', id)
      .select(`
        *,
        categoria:categoria_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre),
        proveedor:proveedor_id(nombre),
        marca:marca_id(nombre),
        estado_gestion:estado_gestion_id(nombre)
      `)
      .single();
    if (error) throw error;
    return updated;
  }
};

/**
 * Updates only the sucursal_id of a device (used after a traslado to persist the new location immediately).
 * @param {string} deviceId
 * @param {string} sucursalId
 * @returns {Promise<void>}
 */
export const updateDeviceSucursal = async (deviceId, sucursalId) => {
  const { error } = await supabase
    .from('dispositivo')
    .update({ sucursal_id: sucursalId })
    .eq('id', deviceId);
  if (error) throw error;
};

/**
 * Deletes a device by updating its status to 'INACTIVO' (Soft Delete).
 */
export const deleteDevice = async (id, inactivoId) => {
  if (!inactivoId) throw new Error('inactivoId is required for deletion');
  const { error } = await supabase
    .from('dispositivo')
    .update({ estado_id: inactivoId })
    .eq('id', id);
  if (error) throw error;
};
