import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Obtiene las visitas asociadas a un conjunto de sucursales del cliente.
 * Diseñado para el rol CLIENTE — respeta RLS.
 *
 * Carga:
 *  - Datos básicos de visita (estado, fechas, técnicos, informe aprobado)
 *  - Dispositivos con pasos + actividades de protocolo
 *  - Estado de ejecución de actividades por dispositivo (ejecucionActividades embebido
 *    en cada dispositivo del array) — compatible con VisitProgressPanel
 *  - Evidencias fotográficas por dispositivo
 *  - observacionFinal del técnico
 *
 * @param {string[]} sucursalIds - IDs de las sucursales del contacto autenticado
 * @returns {{ visitas: Array, loading: boolean }}
 */
export function useVisitasCliente(sucursalIds) {
  const [state, setState] = useState({ visitas: [], loading: true });

  useEffect(() => {
    if (!sucursalIds || sucursalIds.length === 0) {
      setState({ visitas: [], loading: false });
      return;
    }

    let cancelled = false;

    async function load() {
      setState(prev => ({ ...prev, loading: true }));
      try {
        // ── Paso 1: visitas básicas ────────────────────────────────────────────
        const { data: rows, error } = await supabase
          .from('visita')
          .select(`
            id,
            solicitud_id,
            sucursal_id,
            fecha_programada,
            fecha_inicio,
            fecha_fin,
            observacion_final,
            sucursal:sucursal_id(nombre),
            tipo_visita:tipo_visita_id(nombre),
            estado:estado_id(codigo, nombre),
            visita_tecnico(tecnico_id)
          `)
          .in('sucursal_id', sucursalIds)
          .order('fecha_programada', { ascending: false, nullsFirst: false });

        if (error) throw error;
        if (cancelled) return;

        // ── Paso 2: perfiles de técnicos ──────────────────────────────────────
        const allTecnicoIds = [
          ...new Set(
            (rows || []).flatMap(r =>
              (r.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean)
            )
          ),
        ];

        /** @type {Map<string, object>} */
        const tecnicoMap = new Map();
        if (allTecnicoIds.length > 0) {
          const { data: tecnicos } = await supabase
            .from('tecnico')
            .select('id, usuario_id, perfil:usuario_id(nombres, apellidos, telefono, avatar_url)')
            .in('id', allTecnicoIds);

          (tecnicos || []).forEach(t => {
            const p = t.perfil;
            tecnicoMap.set(t.id, {
              tecnicoId: t.id,
              usuarioId: t.usuario_id || null,
              nombres: p?.nombres || '',
              apellidos: p?.apellidos || '',
              telefono: p?.telefono || null,
              avatarUrl: p?.avatar_url || null,
            });
          });
        }

        // ── Paso 3: informes aprobados ────────────────────────────────────────
        const visitaIds = (rows || []).map(r => r.id);
        /** @type {Map<string, {informeId:string, storagePath:string|null}>} */
        const informeMap = new Map();
        if (visitaIds.length > 0) {
          const { data: informes } = await supabase
            .from('informe')
            .select('id, visita_id, estado, storage_path')
            .in('visita_id', visitaIds)
            .eq('estado', 'APROBADO');
          (informes || []).forEach(inf => {
            informeMap.set(inf.visita_id, { informeId: inf.id, storagePath: inf.storage_path });
          });
        }

        // ── Paso 4: intervenciones (contacto tiene RLS para verlas) ───────────
        // intervencionMap: intervencionId → { visitaId, dispositivoId, observacionFinal }
        // intervencionesByVisita: visitaId → intervenciones[]
        /** @type {Map<string, {visitaId:string, dispositivoId:string, observacionFinal:string|null}>} */
        const intervencionMap = new Map();
        /** @type {Map<string, Array>} */
        const intervencionesByVisita = new Map();
        let allIntervencionIds = [];

        if (visitaIds.length > 0) {
          const { data: intervenciones } = await supabase
            .from('intervencion')
            .select('id, visita_id, dispositivo_id, observacion_final, fuera_de_servicio, motivo_fuera_de_servicio')
            .in('visita_id', visitaIds);

          (intervenciones || []).forEach(i => {
            intervencionMap.set(i.id, {
              visitaId: i.visita_id,
              dispositivoId: i.dispositivo_id,
              observacionFinal: i.observacion_final || null,
              fueraDeServicio: !!i.fuera_de_servicio,
            });
            const list = intervencionesByVisita.get(i.visita_id) || [];
            list.push(i);
            intervencionesByVisita.set(i.visita_id, list);
          });
          allIntervencionIds = (intervenciones || []).map(i => i.id);
        }

        // ── Paso 5: dispositivos con categoría ────────────────────────────────
        const allDispositivoIds = [
          ...new Set([...intervencionMap.values()].map(i => i.dispositivoId).filter(Boolean)),
        ];

        /** @type {Map<string, object>} */
        const dispositivoInfoMap = new Map();
        if (allDispositivoIds.length > 0) {
          const { data: disps } = await supabase
            .from('dispositivo')
            .select('id, id_inmotika, codigo_unico, modelo, serial, categoria_id, categoria:categoria_id(nombre)')
            .in('id', allDispositivoIds);

          (disps || []).forEach(d => {
            dispositivoInfoMap.set(d.id, {
              id: d.id,
              label: d.id_inmotika || d.codigo_unico || d.modelo || d.serial || d.id,
              serial: d.serial || null,
              modelo: d.modelo || null,
              idInmotika: d.id_inmotika || null,
              categoriaId: d.categoria_id || null,
              categoria: d.categoria?.nombre || null,
            });
          });
        }

        // ── Paso 6: pasos de protocolo + actividades por categoría ────────────
        const allCategoriaIds = [
          ...new Set([...dispositivoInfoMap.values()].map(d => d.categoriaId).filter(Boolean)),
        ];

        /** @type {Map<string, Array>} categoriaId → pasos ordenados con actividades */
        const pasosByCatId = new Map();
        if (allCategoriaIds.length > 0) {
          const { data: pasos } = await supabase
            .from('paso_protocolo')
            .select(`
              id, descripcion, orden, categoria_id,
              actividades:actividad_protocolo(id, descripcion, orden, activo)
            `)
            .in('categoria_id', allCategoriaIds)
            .eq('activo', true)
            .order('orden', { ascending: true });

          (pasos || []).forEach(paso => {
            const list = pasosByCatId.get(paso.categoria_id) || [];
            list.push({
              ...paso,
              actividades: (paso.actividades || [])
                .filter(a => a.activo !== false)
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map(a => ({ id: a.id, descripcion: a.descripcion })),
            });
            pasosByCatId.set(paso.categoria_id, list);
          });
        }

        // ── Paso 7: estado de ejecución de actividades ────────────────────────
        // Key: intervencionId → { [actividadId]: { estado } }
        // Cada dispositivo tiene su propio mapa (porque dos dispositivos de la misma
        // categoría comparten los mismos actividad_id — el prefijo intervencion los separa).
        /** @type {Map<string, object>} intervencionId → { [actividadId]: estado } */
        const ejecucionByIntervencion = new Map();

        if (allIntervencionIds.length > 0) {
          const { data: actRows } = await supabase
            .from('ejecucion_actividad')
            .select('intervencion_id, actividad_id, catalogo:estado_id(codigo), observacion')
            .in('intervencion_id', allIntervencionIds);

          (actRows || []).forEach(a => {
            const catalogoCodigo = a.catalogo?.codigo || 'PENDIENTE';
            const estadoInterno =
              catalogoCodigo === 'COMPLETADA' ? 'completada' :
              catalogoCodigo === 'INCOMPLETA' ? 'omitida'    : 'pendiente';
            const map = ejecucionByIntervencion.get(a.intervencion_id) || {};
            map[a.actividad_id] = { estado: estadoInterno, observacion: a.observacion || null };
            ejecucionByIntervencion.set(a.intervencion_id, map);
          });
        }

        // ── Paso 8: evidencias fotográficas por intervencion ─────────────────
        /** @type {Map<string, {etiqueta:object|null, fotos:Array}>} intervencionId → evidencias */
        const evidenciasByIntervencion = new Map();

        if (allIntervencionIds.length > 0) {
          const { data: evRows } = await supabase
            .from('evidencia_intervencion')
            .select('intervencion_id, url, numero_foto, es_etiqueta')
            .in('intervencion_id', allIntervencionIds)
            .eq('activo', true)
            .order('numero_foto', { ascending: true });

          const toStoragePath = (url) => {
            if (!url) return url;
            if (url.startsWith('http')) {
              const match = url.match(/\/object\/(?:public|sign)\/inmotika\/(.+?)(?:\?|$)/);
              return match ? match[1] : url;
            }
            return url;
          };

          (evRows || []).forEach(ev => {
            const path = toStoragePath(ev.url);
            const current = evidenciasByIntervencion.get(ev.intervencion_id) || { etiqueta: null, fotos: [] };
            if (ev.es_etiqueta) {
              current.etiqueta = { url: path, preview: path, file: null };
            } else {
              current.fotos.push({ url: path, preview: path, file: null });
            }
            evidenciasByIntervencion.set(ev.intervencion_id, current);
          });
        }

        // ── Paso 9: construir dispositivos con ejecución embebida ─────────────
        // Para cada visita, la lista de dispositivos incluye:
        //   - ejecucionActividades: el mapa { [actividadId]: { estado } } de ESA intervencion
        //   - evidencias: fotos de ESA intervencion
        // Así VisitProgressPanel puede pasar el mapa correcto a cada DeviceProgressCard.
        /** @type {Map<string, Array>} visitaId → dispositivos[] */
        const dispositivosByVisita = new Map();

        intervencionesByVisita.forEach((intervenciones, visitaId) => {
          const disps = intervenciones.map(i => {
            const info = dispositivoInfoMap.get(i.dispositivo_id);
            if (!info) return null;
            const pasos = info.categoriaId ? (pasosByCatId.get(info.categoriaId) || []) : [];
            return {
              ...info,
              pasos,
              fueraDeServicio: !!i.fuera_de_servicio,
              motivoFueraDeServicio: i.motivo_fuera_de_servicio || null,
              // Ejecución y evidencias específicas de esta intervencion
              ejecucionActividades: ejecucionByIntervencion.get(i.id) || {},
              evidencias: evidenciasByIntervencion.get(i.id) || { etiqueta: null, fotos: [] },
            };
          }).filter(Boolean);
          dispositivosByVisita.set(visitaId, disps);
        });

        // ── Paso 10: mapear visitas ────────────────────────────────────────────
        const visitas = (rows || []).map(row => {
          const tecnicoIds = (row.visita_tecnico || [])
            .map(vt => vt.tecnico_id)
            .filter(Boolean);

          const tecnicos = tecnicoIds
            .map(id => tecnicoMap.get(id))
            .filter(Boolean);

          const inf = informeMap.get(row.id) || null;
          const dispositivos = dispositivosByVisita.get(row.id) || [];

          // deviceEvidencias: { [dispositivoId]: evidencias } — para compatibilidad
          // con VisitProgressPanel si lo usa así, pero también está embebido en cada dispositivo
          const deviceEvidencias = {};
          dispositivos.forEach(d => { deviceEvidencias[d.id] = d.evidencias; });

          return {
            id: row.id,
            solicitudId: row.solicitud_id || null,
            sucursalId: row.sucursal_id,
            sucursalNombre: row.sucursal?.nombre || '',
            tipoVisitaLabel: row.tipo_visita?.nombre || '',
            fechaProgramada: row.fecha_programada || null,
            fechaInicio: row.fecha_inicio || null,
            fechaFin: row.fecha_fin || null,
            estadoCodigo: row.estado?.codigo || '',
            estadoLabel: row.estado?.nombre || '',
            tecnicosNombres: tecnicos.map(t => `${t.nombres} ${t.apellidos}`.trim()),
            tecnicos,
            informeId: inf?.informeId || null,
            informeStoragePath: inf?.storagePath || null,
            dispositivos,
            deviceEvidencias,
            ejecucionPasos: {},
            observacionFinal: row.observacion_final || '',
          };
        });

        if (!cancelled) setState({ visitas, loading: false });
      } catch (e) {
        console.error('[useVisitasCliente]', e);
        if (!cancelled) setState({ visitas: [], loading: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sucursalIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
