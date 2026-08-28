import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

/**
 * Hook para obtener los datos del cliente/contacto del usuario logueado con rol CLIENTE.
 *
 * @param {{ enabled?: boolean, slim?: boolean, mode?: 'full'|'slim'|'corporate' }} [options]
 *   - enabled: si false, no hace fetch.
 *   - slim / mode 'slim': selectores de solicitudes (mínimo).
 *   - mode 'corporate': Mis Datos — sin dispositivos ni contratos anidados.
 *   - mode 'full' (default): carga completa (inventario, dashboard, etc.).
 */
export function useClienteData({ enabled = true, slim = false, mode } = {}) {
  const resolvedMode = mode || (slim ? 'slim' : 'full');
  const { user } = useAuth();
  const [state, setState] = useState({
    contacto: null,
    cliente: null,
    sucursales: [],
    dispositivos: [],
    loading: enabled,
  });

  useEffect(() => {
    if (!enabled || !user?.id) {
      if (!enabled) {
        setState({ contacto: null, cliente: null, sucursales: [], dispositivos: [], loading: false });
      }
      return;
    }

    let cancelled = false;

    async function fetch() {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const contactoSelect =
          resolvedMode === 'slim'
            ? 'id, cliente_id, nombres, apellidos, email, contacto_sucursal(sucursal_id), cliente:cliente_id(id, razon_social)'
            : resolvedMode === 'corporate'
              ? 'id, cliente_id, nombres, apellidos, email, telefono_movil, contacto_sucursal(sucursal_id), cliente:cliente_id(id, razon_social, nit, dv, tipo_documento, direccion, ciudad, estado_depto, pais, logo_url)'
              : '*, contacto_sucursal(sucursal_id)';

        const { data: contactoRow, error: contactoErr } = await supabase
          .from('contacto')
          .select(contactoSelect)
          .eq('usuario_id', user.id)
          .maybeSingle();

        if (contactoErr) throw contactoErr;

        if (!contactoRow) {
          if (!cancelled) setState({ contacto: null, cliente: null, sucursales: [], dispositivos: [], loading: false });
          return;
        }

        const branchIds = (contactoRow.contacto_sucursal || [])
          .map(cs => cs.sucursal_id)
          .filter(Boolean);

        if (branchIds.length === 0) {
          if (!cancelled) setState({ contacto: contactoRow, cliente: null, sucursales: [], dispositivos: [], loading: false });
          return;
        }

        const clienteId = contactoRow.cliente_id;

        const sucursalSelect =
          resolvedMode === 'slim'
            ? 'id, nombre, cliente_id'
            : resolvedMode === 'corporate'
              ? 'id, nombre, cliente_id, direccion, ciudad, estado_depto, pais, es_principal'
              : '*, contrato(*), horarios_atencion, contacto_sucursal(contacto_id, contacto(id, nombres, apellidos, telefono_movil, email, cargo_id))';

        // Nota: la tabla cliente no tiene columna `nombre` (solo razon_social).
        const clienteSelect =
          resolvedMode === 'slim'
            ? 'id, razon_social'
            : resolvedMode === 'corporate'
              ? 'id, razon_social, nit, dv, tipo_documento, direccion, ciudad, estado_depto, pais, logo_url'
              : '*';

        const needsDevices = resolvedMode === 'full' || resolvedMode === 'slim';
        const dispositivoSelect =
          resolvedMode === 'slim'
            ? 'id, sucursal_id, serial, id_inmotika, codigo_unico, modelo, categoria:categoria_id(nombre), marca:marca_id(nombre), proveedor:proveedor_id(nombre)'
            : '*, categoria:categoria_id(nombre), marca:marca_id(nombre), proveedor:proveedor_id(nombre), catalogo_estado_gestion:estado_gestion_id(nombre, codigo)';

        const [sucursalRes, clienteRes, dispositivoRes] = await Promise.all([
          supabase.from('sucursal').select(sucursalSelect).in('id', branchIds),
          clienteId
            ? supabase.from('cliente').select(clienteSelect).eq('id', clienteId).maybeSingle()
            : Promise.resolve({ data: null }),
          needsDevices
            ? supabase.from('dispositivo').select(dispositivoSelect).in('sucursal_id', branchIds)
            : Promise.resolve({ data: [] }),
        ]);

        if (cancelled) return;

        // Fallback: embed en contacto si la lectura directa de cliente falla (RLS)
        const cliente = clienteRes.data || contactoRow.cliente || null;
        if (cliente && !cliente.razon_social && contactoRow.cliente?.razon_social) {
          cliente.razon_social = contactoRow.cliente.razon_social;
        }
        const sucursales = (sucursalRes.data || []).filter(s =>
          !clienteId || !s.cliente_id || String(s.cliente_id) === String(clienteId)
        );
        const sucursalIds = new Set(sucursales.map(s => String(s.id)));
        const dispositivos = (dispositivoRes.data || []).filter(d =>
          sucursalIds.has(String(d.sucursal_id))
        );

        setState({ contacto: contactoRow, cliente, sucursales, dispositivos, loading: false });
      } catch (e) {
        console.error('[useClienteData]', e);
        if (!cancelled) setState({ contacto: null, cliente: null, sucursales: [], dispositivos: [], loading: false });
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [user?.id, enabled, resolvedMode]);

  return state;
}
