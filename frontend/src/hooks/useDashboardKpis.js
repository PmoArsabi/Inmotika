import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

/**
 * @typedef {Object} VisitaRow
 * @property {string} id
 * @property {string|null} coordinador_usuario_id
 * @property {string|null} fecha_programada
 * @property {string|null} fecha_inicio
 * @property {string|null} fecha_fin
 * @property {{codigo: string}|null} estado
 * @property {{razon_social?: string}|null} cliente
 * @property {{nombre?: string, ciudad?: string}|null} sucursal
 * @property {Array<{es_lider?: boolean, tecnico_id?: string, tecnico?: {id?: string, perfil?: {nombres?: string, apellidos?: string}}}>>} [visita_tecnico]
 */

/**
 * @typedef {Object} VisitaKpi
 * @property {number} total
 * @property {number} programadas
 * @property {number} enProgreso
 * @property {number} completadas
 * @property {number} canceladas
 */

/**
 * @typedef {Object} CoordinadorKpi
 * @property {string} id
 * @property {string} nombre
 * @property {number} visitasTotal
 * @property {number} visitasCompletadas
 * @property {number} visitasPendientes
 * @property {number} efectividad
 */

/**
 * @typedef {Object} DashboardKpis
 * @property {VisitaRow[]}      visitasRaw
 * @property {VisitaKpi}        visitas
 * @property {CoordinadorKpi[]} coordinadores
 * @property {number}           totalClientes
 * @property {number}           totalTecnicos
 * @property {number[]}         tendenciaMeses
 * @property {boolean}          loading
 */

/**
 * KPIs del dashboard según rol.
 * Expone `visitasRaw` para que la página aplique filtros locales.
 */
export function useDashboardKpis() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(/** @type {DashboardKpis} */({
    visitasRaw: [],
    visitas: { total: 0, programadas: 0, enProgreso: 0, completadas: 0, canceladas: 0 },
    coordinadores: [],
    totalClientes: 0,
    totalTecnicos: 0,
    tendenciaMeses: Array(12).fill(0),
    loading: true,
  }));

  useEffect(() => {
    if (!user?.id || !user?.role) return;
    let cancelled = false;

    async function load() {
      setKpis(prev => ({ ...prev, loading: true }));
      try {
        const result = await fetchByRole(user);
        if (!cancelled) setKpis({ ...result, loading: false });
      } catch (e) {
        console.error('[useDashboardKpis]', e);
        if (!cancelled) setKpis(prev => ({ ...prev, loading: false }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  return kpis;
}

// ─── Helpers públicos ─────────────────────────────────────────────────────────

/** Fecha de referencia unificada para filtros y tendencia. */
export function visitaFechaRef(v) {
  return v?.fecha_fin || v?.fecha_inicio || v?.fecha_programada || null;
}

/**
 * Filtra visitas en memoria según el panel de filtros del dashboard.
 * `tecnico` usa IDs de `tecnico.id` (no nombres).
 * @param {VisitaRow[]} visitas
 * @param {{ estado?: string[], cliente?: string[], ciudad?: string[], tecnico?: string[], coordinador?: string[], fechaDesde?: string, fechaHasta?: string }} filters
 * @param {{ coordinadorUsuarioById?: Record<string, string> }} [opts]
 * @returns {VisitaRow[]}
 */
export function filterVisitasDashboard(visitas, filters = {}, opts = {}) {
  let list = visitas || [];

  if (filters.estado?.length) {
    list = list.filter(v => filters.estado.includes(v.estado?.codigo || ''));
  }
  if (filters.cliente?.length) {
    list = list.filter(v => filters.cliente.includes(v.cliente?.razon_social || ''));
  }
  if (filters.ciudad?.length) {
    list = list.filter(v => filters.ciudad.includes(v.sucursal?.ciudad || ''));
  }
  if (filters.tecnico?.length) {
    const wanted = new Set(filters.tecnico.map(String));
    list = list.filter(v =>
      (v.visita_tecnico || []).some(vt => {
        const tid = String(vt.tecnico?.id || vt.tecnico_id || '');
        return tid && wanted.has(tid);
      })
    );
  }
  if (filters.coordinador?.length && opts.coordinadorUsuarioById) {
    const wantedUsers = new Set(
      filters.coordinador.map(id => opts.coordinadorUsuarioById[id]).filter(Boolean)
    );
    if (wantedUsers.size) {
      list = list.filter(v => wantedUsers.has(v.coordinador_usuario_id));
    }
  }
  if (filters.fechaDesde || filters.fechaHasta) {
    list = list.filter(v => {
      const ref = visitaFechaRef(v);
      if (!ref) return false;
      const day = ref.slice(0, 10);
      if (filters.fechaDesde && day < filters.fechaDesde) return false;
      if (filters.fechaHasta && day > filters.fechaHasta) return false;
      return true;
    });
  }

  return list;
}

/**
 * Tendencia: cantidad de visitas COMPLETADAS por mes del año actual.
 * Devuelve valores 0–100 normalizados al máximo del año (para altura de barras).
 * También expone conteos vía propiedad opcional si se necesita.
 *
 * @param {VisitaRow[]} visitas
 * @returns {{ heights: number[], counts: number[] }}
 */
export function calcTendenciaCompletadas(visitas, year = new Date().getFullYear()) {
  const counts = Array(12).fill(0);

  (visitas || []).forEach(v => {
    if (v.estado?.codigo !== 'COMPLETADA') return;
    const ref = visitaFechaRef(v);
    if (!ref) return;
    const d = new Date(ref);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return;
    counts[d.getMonth()]++;
  });

  const max = Math.max(...counts, 0);
  const heights = counts.map(c => (max === 0 ? 0 : Math.round((c / max) * 100)));
  return { heights, counts };
}

/** @param {VisitaRow[]} rows */
export function summarizeVisitas(rows) {
  return {
    total: rows.length,
    programadas: rows.filter(v => v.estado?.codigo === 'PROGRAMADA').length,
    enProgreso: rows.filter(v => v.estado?.codigo === 'EN_PROGRESO').length,
    completadas: rows.filter(v => v.estado?.codigo === 'COMPLETADA').length,
    canceladas: rows.filter(v => v.estado?.codigo === 'CANCELADA').length,
  };
}

function buildCoordinadorKpis(visitas, coordinadores) {
  return coordinadores.map(coord => {
    const propias = visitas.filter(v => v.coordinador_usuario_id === coord.usuario_id);
    const completadas = propias.filter(v => v.estado?.codigo === 'COMPLETADA').length;
    const total = propias.length;
    const nombre = coord.perfil
      ? `${coord.perfil.nombres || ''} ${coord.perfil.apellidos || ''}`.trim()
      : '—';
    return {
      id: coord.id,
      usuario_id: coord.usuario_id,
      nombre,
      visitasTotal: total,
      visitasCompletadas: completadas,
      visitasPendientes: propias.filter(v => v.estado?.codigo === 'PROGRAMADA').length,
      efectividad: total === 0 ? 0 : Math.round((completadas / total) * 100),
    };
  });
}

const VISITA_SELECT = `
  id, coordinador_usuario_id, fecha_programada, fecha_inicio, fecha_fin,
  estado:estado_id(codigo),
  cliente:cliente_id(razon_social),
  sucursal:sucursal_id(nombre, ciudad),
  visita_tecnico(
    es_lider,
    tecnico_id,
    tecnico:tecnico_id(id, perfil:usuario_id(nombres, apellidos))
  )
`;

async function fetchByRole(user) {
  switch (user.role) {
    case ROLES.DIRECTOR:
      return fetchDirector();
    case ROLES.COORDINADOR:
      return fetchCoordinador(user.id);
    default:
      return fetchCoordinador(user.id);
  }
}

async function fetchDirector() {
  const [visitasRes, coordRes, clientesRes, tecnicosRes] = await Promise.all([
    supabase.from('visita').select(VISITA_SELECT),
    supabase.from('coordinador').select('id, usuario_id, perfil:usuario_id(nombres, apellidos)').eq('activo', true),
    supabase.from('cliente').select('id', { count: 'exact', head: true }),
    supabase.from('tecnico').select('id', { count: 'exact', head: true }),
  ]);

  if (visitasRes.error) throw visitasRes.error;

  const visitas = visitasRes.data || [];
  const coordinadores = coordRes.data || [];
  const { heights } = calcTendenciaCompletadas(visitas);

  return {
    visitasRaw: visitas,
    visitas: summarizeVisitas(visitas),
    coordinadores: buildCoordinadorKpis(visitas, coordinadores),
    totalClientes: clientesRes.count ?? 0,
    totalTecnicos: tecnicosRes.count ?? 0,
    tendenciaMeses: heights,
  };
}

/**
 * Coordinador: visitas que él coordina + visitas en sucursales a su cargo
 * (ahí es donde asigna técnicos). Así el dashboard alinea con Gestión Visitas.
 */
async function fetchCoordinador(coordUsuarioId) {
  const { data: coordRow } = await supabase
    .from('coordinador')
    .select('id, sucursal_coordinador(sucursal_id, activo)')
    .eq('usuario_id', coordUsuarioId)
    .eq('activo', true)
    .maybeSingle();

  const sucursalIds = (coordRow?.sucursal_coordinador || [])
    .filter(sc => sc.activo !== false)
    .map(sc => sc.sucursal_id)
    .filter(Boolean);

  let query = supabase.from('visita').select(VISITA_SELECT);

  if (sucursalIds.length > 0) {
    // .or con lista de UUIDs: visitas propias o de sucursales a cargo
    query = query.or(
      `coordinador_usuario_id.eq.${coordUsuarioId},sucursal_id.in.(${sucursalIds.join(',')})`
    );
  } else {
    query = query.eq('coordinador_usuario_id', coordUsuarioId);
  }

  const { data: visitas, error } = await query;
  if (error) throw error;

  const visitasArr = visitas || [];
  const { heights } = calcTendenciaCompletadas(visitasArr);

  return {
    visitasRaw: visitasArr,
    visitas: summarizeVisitas(visitasArr),
    coordinadores: [],
    totalClientes: 0,
    totalTecnicos: 0,
    tendenciaMeses: heights,
  };
}
