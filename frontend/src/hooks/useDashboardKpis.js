import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

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
 * @property {string} id              - coordinador.id
 * @property {string} nombre
 * @property {number} visitasTotal
 * @property {number} visitasCompletadas
 * @property {number} visitasPendientes
 * @property {number} efectividad      - % completadas / total (0 si sin visitas)
 */

/**
 * @typedef {Object} DashboardKpis
 * @property {VisitaKpi}        visitas
 * @property {CoordinadorKpi[]} coordinadores  - vacío si rol COORDINADOR
 * @property {number}           totalClientes  - 0 si rol COORDINADOR
 * @property {number}           totalTecnicos  - 0 si rol COORDINADOR
 * @property {number[]}         tendenciaMeses - 12 valores (% completadas por mes del año actual)
 * @property {boolean}          loading
 */

/**
 * Devuelve los KPIs del dashboard según el rol del usuario autenticado:
 *
 * - ADMIN:        visitas globales + todos los coordinadores + totales de clientes y técnicos
 * - DIRECTOR:     visitas de sus coordinadores + KPI por coordinador asignado
 * - COORDINADOR:  solo sus propias visitas (sin KPI de otros)
 */
export function useDashboardKpis() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(/** @type {DashboardKpis} */({
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
  }, [user?.id, user?.role]);

  return kpis;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula los 12 valores de tendencia (% completadas por mes del año actual)
 * a partir de un array de visitas con { estadoCodigo, fechaProgramada }.
 *
 * @param {Array<{estadoCodigo: string, fechaProgramada: string|null}>} visitas
 * @returns {number[]}
 */
function calcTendencia(visitas) {
  const year = new Date().getFullYear();
  const totales = Array(12).fill(0);
  const completadas = Array(12).fill(0);

  visitas.forEach(v => {
    if (!v.fecha_programada) return;
    const d = new Date(v.fecha_programada);
    if (d.getFullYear() !== year) return;
    const m = d.getMonth();
    totales[m]++;
    if (v.estado?.codigo === 'COMPLETADA') completadas[m]++;
  });

  return totales.map((t, i) => (t === 0 ? 0 : Math.round((completadas[i] / t) * 100)));
}

/**
 * Agrupa visitas por coordinador_usuario_id y calcula sus KPIs.
 *
 * @param {Array} visitas
 * @param {Array<{id: string, usuario_id: string, perfil: {nombres: string, apellidos: string}}>} coordinadores
 * @returns {CoordinadorKpi[]}
 */
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
      nombre,
      visitasTotal: total,
      visitasCompletadas: completadas,
      visitasPendientes: propias.filter(v => v.estado?.codigo === 'PROGRAMADA').length,
      efectividad: total === 0 ? 0 : Math.round((completadas / total) * 100),
    };
  });
}

/** Convierte array de filas de visita a VisitaKpi. */
function summarizeVisitas(rows) {
  return {
    total: rows.length,
    programadas: rows.filter(v => v.estado?.codigo === 'PROGRAMADA').length,
    enProgreso: rows.filter(v => v.estado?.codigo === 'EN_PROGRESO').length,
    completadas: rows.filter(v => v.estado?.codigo === 'COMPLETADA').length,
    canceladas: rows.filter(v => v.estado?.codigo === 'CANCELADA').length,
  };
}

// ─── Fetchers por rol ─────────────────────────────────────────────────────────

const VISITA_SELECT = `
  id, coordinador_usuario_id, fecha_programada,
  estado:estado_id(codigo)
`;

async function fetchByRole(user) {
  switch (user.role) {
    case ROLES.ADMIN:   return fetchAdmin();
    case ROLES.DIRECTOR: return fetchDirector(user.id);
    case ROLES.COORDINADOR: return fetchCoordinador(user.id);
    default: return fetchCoordinador(user.id);
  }
}

async function fetchAdmin() {
  const [visitasRes, coordRes, clientesRes, tecnicosRes] = await Promise.all([
    supabase.from('visita').select(VISITA_SELECT),
    supabase.from('coordinador').select('id, usuario_id, perfil:usuario_id(nombres, apellidos)').eq('activo', true),
    supabase.from('cliente').select('id', { count: 'exact', head: true }),
    supabase.from('tecnico').select('id', { count: 'exact', head: true }),
  ]);

  const visitas = visitasRes.data || [];
  const coordinadores = coordRes.data || [];

  return {
    visitas: summarizeVisitas(visitas),
    coordinadores: buildCoordinadorKpis(visitas, coordinadores),
    totalClientes: clientesRes.count ?? 0,
    totalTecnicos: tecnicosRes.count ?? 0,
    tendenciaMeses: calcTendencia(visitas),
  };
}

async function fetchDirector(directorUsuarioId) {
  // 1. Obtener el id de la tabla director a partir del usuario_id
  const { data: dirRow } = await supabase
    .from('director')
    .select('id')
    .eq('usuario_id', directorUsuarioId)
    .eq('activo', true)
    .maybeSingle();

  if (!dirRow?.id) {
    return {
      visitas: summarizeVisitas([]),
      coordinadores: [],
      totalClientes: 0,
      totalTecnicos: 0,
      tendenciaMeses: Array(12).fill(0),
    };
  }

  // 2. Coordinadores asignados a este director
  const { data: coordRows } = await supabase
    .from('coordinador')
    .select('id, usuario_id, perfil:usuario_id(nombres, apellidos)')
    .eq('director_id', dirRow.id)
    .eq('activo', true);

  const coordinadores = coordRows || [];
  const coordUsuarioIds = coordinadores.map(c => c.usuario_id).filter(Boolean);

  if (coordUsuarioIds.length === 0) {
    return {
      visitas: summarizeVisitas([]),
      coordinadores: [],
      totalClientes: 0,
      totalTecnicos: 0,
      tendenciaMeses: Array(12).fill(0),
    };
  }

  // 3. Visitas de esos coordinadores
  const { data: visitas } = await supabase
    .from('visita')
    .select(VISITA_SELECT)
    .in('coordinador_usuario_id', coordUsuarioIds);

  const visitasArr = visitas || [];

  return {
    visitas: summarizeVisitas(visitasArr),
    coordinadores: buildCoordinadorKpis(visitasArr, coordinadores),
    totalClientes: 0,
    totalTecnicos: 0,
    tendenciaMeses: calcTendencia(visitasArr),
  };
}

async function fetchCoordinador(coordUsuarioId) {
  const { data: visitas } = await supabase
    .from('visita')
    .select(VISITA_SELECT)
    .eq('coordinador_usuario_id', coordUsuarioId);

  const visitasArr = visitas || [];

  return {
    visitas: summarizeVisitas(visitasArr),
    coordinadores: [],
    totalClientes: 0,
    totalTecnicos: 0,
    tendenciaMeses: calcTendencia(visitasArr),
  };
}
