import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { ROLES } from '../utils/constants';

/**
 * Hook para obtener los datos del cliente/contacto del usuario logueado con rol CLIENTE.
 * Hace queries directas a Supabase filtrando por auth.uid() — funciona con RLS.
 *
 * @returns {{ contacto: object|null, cliente: object|null, sucursales: Array, dispositivos: Array, loading: boolean }}
 */
export function useClienteData() {
  const { user } = useAuth();
  const [state, setState] = useState({
    contacto: null,
    cliente: null,
    sucursales: [],
    dispositivos: [],
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function fetch() {
      setState(prev => ({ ...prev, loading: true }));
      try {
        // 1. Contacto del usuario autenticado con sus sucursales asociadas
        const { data: contactoRow, error: contactoErr } = await supabase
          .from('contacto')
          .select('*, contacto_sucursal(sucursal_id)')
          .eq('usuario_id', user.id)
          .maybeSingle();

        console.log('[useClienteData] contacto query result:', { contactoRow, contactoErr, userId: user.id });
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

        // 2. Sucursales, dispositivos y cliente en paralelo
        const clienteId = contactoRow.cliente_id;
        const [sucursalRes, dispositivoRes, clienteRes] = await Promise.all([
          supabase
            .from('sucursal')
            .select('*, contrato(*), contacto_sucursal(contacto_id, contacto(id, nombres, apellidos, telefono_movil, email, cargo_id))')
            .in('id', branchIds),
          supabase
            .from('dispositivo')
            .select('*, categoria_dispositivo(nombre), catalogo_estado_gestion:estado_gestion_id(nombre, codigo)')
            .in('sucursal_id', branchIds),
          clienteId
            ? supabase.from('cliente').select('*').eq('id', clienteId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        if (cancelled) return;

        console.log('[useClienteData] sucursalRes:', sucursalRes);
        console.log('[useClienteData] dispositivoRes:', dispositivoRes);

        const cliente = clienteRes.data || null;
        // Solo mostrar sucursales que pertenezcan al mismo cliente del contacto
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
  }, [user?.id]);

  return state;
}
