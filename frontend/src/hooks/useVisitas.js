import { useState, useEffect, useCallback, useRef, createContext, useContext, createElement } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { notificarVisitaProgramada } from '../api/visitaApi';
import { ROLES } from '../utils/constants';

const VisitasContext = createContext(null);

/**
 * @typedef {Object} Visita
 * @property {string} id - UUID de la visita
 * @property {string} codigoRef - Código corto de referencia (8 chars del UUID)
 * @property {string|null} solicitudId - UUID de la solicitud origen
 * @property {string} clienteId
 * @property {string} clienteNombre
 * @property {string} sucursalId
 * @property {string} sucursalNombre
 * @property {string} sucursalCiudad
 * @property {string} tipoVisitaId
 * @property {string} tipoVisitaCodigo
 * @property {string} tipoVisitaLabel
 * @property {string|null} fechaProgramada - ISO string o null
 * @property {string|null} fechaInicio - ISO string; null significa editable
 * @property {string|null} fechaFin
 * @property {string} observaciones
 * @property {string} estadoId
 * @property {string} estadoCodigo
 * @property {string} estadoLabel
 * @property {string[]} tecnicoIds - array de perfil_usuario.id
 * @property {string[]} tecnicosNombres - array de nombres legibles
 * @property {boolean} esEditable - true cuando fechaInicio es null
 */

/**
 * @typedef {Object} CreateVisitaPayload
 * @property {string} solicitudId
 * @property {string} clienteId
 * @property {string} sucursalId
 * @property {string} tipoVisitaId
 * @property {string} fechaProgramada - ISO string datetime-local compatible
 * @property {string} [observaciones]
 * @property {string[]} tecnicoIds
 * @property {string} coordinadorId - perfil_usuario.id del coordinador
 */

/**
 * @typedef {Object} UpdateVisitaPayload
 * @property {string} [fechaProgramada]
 * @property {string} [observaciones]
 * @property {string[]} [tecnicoIds]
 */

/**
 * @typedef {Object} EstadoOption
 * @property {string} value - UUID del estado en catalogo (tipo ESTADO_VISITA)
 * @property {string} codigo - Código textual (PROGRAMADA, CANCELADO, etc.)
 * @property {string} label - Nombre legible
 */

/**
 * Ejecuta `.in(column, ids)` en lotes para evitar URLs/payloads enormes en PostgREST.
 * @template T
 * @param {() => import('@supabase/supabase-js').PostgrestFilterBuilder} buildQuery - factory sin `.in` aún
 * @param {string} column
 * @param {string[]} ids
 * @param {number} [chunkSize=100]
 * @returns {Promise<T[]>}
 */
const fetchInChunks = async (buildQuery, column, ids, chunkSize = 100) => {
  if (!ids.length) return [];
  /** @type {T[]} */
  const out = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data, error } = await buildQuery().in(column, chunk);
    if (error) throw error;
    out.push(...(data || []));
  }
  return out;
};

/**
 * Normaliza URL de evidencia a path relativo del bucket.
 * @param {string|null|undefined} url
 * @returns {string|null|undefined}
 */
const toStoragePath = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) {
    const match = url.match(/\/object\/(?:public|sign)\/inmotika\/(.+?)(?:\?|$)/);
    return match ? match[1] : url;
  }
  return url;
};

/**
 * Progreso de dispositivos para la lista (precalculado; evita re-recorrer en cada render).
 * Los pasos se resuelven por categoriaId para no duplicar protocolos en cada dispositivo.
 */
const computeDeviceProgress = (
  dispositivos,
  pasosByCatId,
  ejecucionActividades = {},
  dispositivoIntervencionMap = {},
  dispositivoFdsMap = {},
) => {
  const total = dispositivos?.length || 0;
  if (total === 0) return { total: 0, completed: 0 };
  let completed = 0;
  for (const d of dispositivos) {
    if (dispositivoFdsMap?.[d.id]?.fueraDeServicio && dispositivoIntervencionMap?.[d.id]) {
      completed += 1;
      continue;
    }
    const pasos = (d.categoriaId && pasosByCatId?.get?.(d.categoriaId))
      || (d.categoriaId && pasosByCatId?.[d.categoriaId])
      || d.pasos
      || [];
    if (!pasos.length) continue;
    const intervencionId = dispositivoIntervencionMap?.[d.id];
    const actKey = (actId) => (intervencionId ? `${intervencionId}:${actId}` : actId);
    const done = pasos.every(paso =>
      (paso.actividades || []).length === 0
      || (paso.actividades || []).every(a => {
        const e = ejecucionActividades?.[actKey(a.id)]?.estado;
        return e === 'completada' || e === 'omitida';
      }),
    );
    if (done) completed += 1;
  }
  return { total, completed };
};

/** Shape liviano de dispositivo en la lista (sin pasos embebidos). */
const toDeviceLite = (d) => ({
  id: d.id,
  label: d.id_inmotika || d.codigo_unico || d.modelo || d.serial || d.id,
  serial: d.serial || null,
  modelo: d.modelo || null,
  idInmotika: d.id_inmotika || null,
  categoriaId: d.categoria_id || null,
  categoria: d.categoria?.nombre || null,
});

// ─── Mapper ───────────────────────────────────────────────────────────────────
/**
 * Convierte una fila de Supabase en el shape Visita del frontend.
 * Los nombres de técnicos se inyectan después en el paso 2 del fetch.
 * @param {Object} row - Fila cruda de Supabase con joins anidados
 * @param {Map<string,string>} tecnicoNameMap - tecnico_id (perfil_usuario.id) → nombre completo
 * @returns {Visita}
 */
const mapRow = (row, tecnicoNameMap = new Map(), dispositivosBySolicitud = new Map(), tecnicoProfileMap = new Map()) => {
  const tecnicoIds = (row.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean);
  const dispositivos = dispositivosBySolicitud.get(row.solicitud_id) || [];
  return {
    id: row.id,
    /** Código corto de referencia (primeros 8 del UUID) — visible en agenda, lista y seguimiento. */
    codigoRef: row.id ? String(row.id).slice(0, 8) : '',
    solicitudId: row.solicitud_id || null,
    contratoId: row.contrato_id || null,
    clienteId: row.cliente_id || row.solicitud?.cliente_id || '',
    clienteNombre: row.solicitud?.cliente?.razon_social || row.cliente?.razon_social || '',
    sucursalId: row.sucursal_id || row.solicitud?.sucursal_id || '',
    sucursalNombre: row.solicitud?.sucursal?.nombre || row.sucursal?.nombre || '',
    sucursalCiudad: row.solicitud?.sucursal?.ciudad || row.sucursal?.ciudad || '',
    tipoVisitaId: row.tipo_visita_id || row.solicitud?.tipo_visita_id || '',
    tipoVisitaCodigo: row.solicitud?.tipo_visita?.codigo || row.tipo_visita?.codigo || '',
    tipoVisitaLabel: row.solicitud?.tipo_visita?.nombre || row.tipo_visita?.nombre || '',
    fechaProgramada: row.fecha_programada || null,
    fechaInicio: row.fecha_inicio || null,
    fechaFin: row.fecha_fin || null,
    observaciones: row.observaciones || '',
    estadoId: row.estado_id || '',
    estadoCodigo: row.estado?.codigo || '',
    estadoLabel: row.estado?.nombre || '',
    tecnicoIds,
    tecnicosNombres: tecnicoIds.map(id => tecnicoNameMap.get(id) || id),
    tecnicos: tecnicoIds.map(id => tecnicoProfileMap.get(id)).filter(Boolean),
    dispositivos,
    esEditable: !row.fecha_inicio && row.estado?.codigo !== 'CANCELADA',
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Gestión completa de visitas programadas.
 * Solo Admin/Coordinador/Director puede crear, editar y cancelar visitas.
 * Técnicos asignados pueden verlas vía RLS.
 */
/**
 * Estado compartido de visitas (un solo fetch para Schedule + Gestión + Programación).
 * No exportar directamente: usar VisitasProvider + useVisitas().
 */
const useVisitasState = () => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  /** true mientras protocolos/ejecución se cargan en segundo plano tras la lista. */
  const [enriching, setEnriching] = useState(false);
  /** Protocolos por categoria_id — compartidos, no duplicados en cada dispositivo. */
  const [pasosByCategoria, setPasosByCategoria] = useState({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const notify = useNotify();
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; });
  const userId = user?.id ?? null;
  /** Descarta resultados de fetches obsoletos (StrictMode / refetch concurrente). */
  const fetchGenRef = useRef(0);

  /**
   * Carga visitas en dos fases:
   * 1) Lista usable (visitas + técnicos + dispositivos) → quita el skeleton.
   * 2) Protocolos + estado de ejecución (detalle) en segundo plano.
   *
   * @param {{ silent?: boolean }} [opts] - silent: no muestra skeleton (refresco en background)
   */
  const fetchVisitas = useCallback(async (opts = {}) => {
    const silent = opts?.silent === true;
    if (!userId) {
      setVisitas([]);
      setLoading(false);
      setEnriching(false);
      return;
    }
    const gen = ++fetchGenRef.current;
    const isStale = () => gen !== fetchGenRef.current;
    const isTecnico = user?.role === ROLES.TECNICO;

    if (!silent) setLoading(true);
    else setEnriching(true);
    try {
      // Técnico: filtrar por asignación explícita.
      // 1) IDs de visitas del técnico  2) fetch de esas visitas (con todos los visita_tecnico).
      // Evita el full-scan + RLS fila a fila sobre toda la tabla `visita`.
      let tecnicoIdFiltro = null;
      /** @type {string[]|null} */
      let visitaIdsFiltro = null;
      if (isTecnico) {
        const { data: tecRow, error: tecErr } = await supabase
          .from('tecnico')
          .select('id')
          .eq('usuario_id', userId)
          .eq('activo', true)
          .maybeSingle();
        if (tecErr) throw tecErr;
        tecnicoIdFiltro = tecRow?.id || null;
        if (!tecnicoIdFiltro) {
          setVisitas([]);
          if (!silent) setLoading(false);
          setEnriching(false);
          return [];
        }

        const { data: asignaciones, error: asgErr } = await supabase
          .from('visita_tecnico')
          .select('visita_id')
          .eq('tecnico_id', tecnicoIdFiltro);
        if (asgErr) throw asgErr;

        visitaIdsFiltro = [...new Set((asignaciones || []).map(a => a.visita_id).filter(Boolean))];
        if (visitaIdsFiltro.length === 0) {
          setVisitas([]);
          if (!silent) setLoading(false);
          setEnriching(false);
          return [];
        }
      }

      // Select liviano: cliente/sucursal/tipo desde la visita (sin nest profundo de solicitud).
      const visitaSelect = `
          id,
          solicitud_id,
          contrato_id,
          coordinador_usuario_id,
          cliente_id,
          sucursal_id,
          tipo_visita_id,
          fecha_programada,
          fecha_inicio,
          fecha_fin,
          observaciones,
          observacion_final,
          estado_id,
          cliente:cliente_id(razon_social),
          sucursal:sucursal_id(nombre,ciudad),
          tipo_visita:tipo_visita_id(codigo,nombre),
          estado:estado_id(codigo,nombre),
          visita_tecnico(tecnico_id,es_lider)
        `;

      let visitaQuery = supabase
        .from('visita')
        .select(visitaSelect)
        .order('fecha_programada', { ascending: false, nullsFirst: false });

      if (visitaIdsFiltro) {
        visitaQuery = visitaQuery.in('id', visitaIdsFiltro);
      }

      const { data: rows, error } = await visitaQuery;

      if (error) throw error;
      if (isStale()) return null;

      const allTecnicoIds = [
        ...new Set(
          (rows || []).flatMap(r =>
            (r.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean)
          )
        ),
      ];
      const allSolicitudIds = [
        ...new Set((rows || []).map(r => r.solicitud_id).filter(Boolean)),
      ];

      // Paso 2 + 3a en paralelo: técnicos y junction (solo IDs — basta para el conteo de la lista)
      const [tecRows, sdRows] = await Promise.all([
        allTecnicoIds.length > 0
          ? supabase.from('tecnico').select('id, usuario_id').in('id', allTecnicoIds).then(({ data, error: e }) => {
              if (e) throw e;
              return data || [];
            })
          : Promise.resolve([]),
        allSolicitudIds.length > 0
          ? fetchInChunks(
              () => supabase.from('solicitud_dispositivo').select('solicitud_id,dispositivo_id').eq('activo', true),
              'solicitud_id',
              allSolicitudIds,
            )
          : Promise.resolve([]),
      ]);

      if (isStale()) return null;

      /** @type {Map<string,string>} tecnico.id → perfil_usuario.id */
      const tecnicoUsuarioMap = new Map();
      tecRows.forEach(t => {
        if (t.usuario_id) tecnicoUsuarioMap.set(t.id, t.usuario_id);
      });

      const allUsuarioIds = [...new Set(tecnicoUsuarioMap.values())];

      // Perfiles de técnicos (nombres en las tarjetas)
      const perfiles = allUsuarioIds.length > 0
        ? await supabase
            .from('perfil_usuario')
            .select('id, nombres, apellidos, email, telefono, avatar_url')
            .in('id', allUsuarioIds)
            .then(({ data, error: e }) => {
              if (e) throw e;
              return data || [];
            })
        : [];

      if (isStale()) return null;

      /** @type {Map<string, object>} */
      const perfilMap = new Map();
      perfiles.forEach(p => perfilMap.set(p.id, p));

      /** @type {Map<string,string>} */
      const tecnicoNameMap = new Map();
      /** @type {Map<string, object>} */
      const tecnicoProfileMap = new Map();
      allTecnicoIds.forEach(tecId => {
        const usuarioId = tecnicoUsuarioMap.get(tecId);
        const p = usuarioId ? perfilMap.get(usuarioId) : null;
        const nombre = p
          ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.email || tecId
          : tecId;
        tecnicoNameMap.set(tecId, nombre);
        tecnicoProfileMap.set(tecId, {
          tecnicoId: tecId,
          usuarioId: usuarioId || null,
          nombres: p?.nombres || '',
          apellidos: p?.apellidos || '',
          telefono: p?.telefono || null,
          avatarUrl: p?.avatar_url || null,
        });
      });

      // Dispositivos livianos solo con id (conteo en agenda). Detalle en fase 2.
      /** @type {Map<string, Array>} */
      let dispositivosBySolicitud = new Map();
      sdRows.forEach(sd => {
        if (!sd.dispositivo_id) return;
        const list = dispositivosBySolicitud.get(sd.solicitud_id) || [];
        list.push({
          id: sd.dispositivo_id,
          label: sd.dispositivo_id,
          serial: null,
          modelo: null,
          idInmotika: null,
          categoriaId: null,
          categoria: null,
        });
        dispositivosBySolicitud.set(sd.solicitud_id, list);
      });

      // Fase 1: pintar lista YA (visitas + conteo dispositivos + técnicos)
      const emptyExec = {
        ejecucionActividades: {},
        ejecucionPasos: {},
        deviceEvidencias: {},
        codigoEtiquetaByDevice: {},
        dispositivoIntervencionMap: {},
        dispositivoFdsMap: {},
      };
      const listMapped = (rows || []).map(r => {
        const base = mapRow(r, tecnicoNameMap, dispositivosBySolicitud, tecnicoProfileMap);
        return {
          ...base,
          ...emptyExec,
          observacionFinal: r.observacion_final || '',
          deviceProgress: { total: base.dispositivos?.length || 0, completed: 0 },
        };
      });
      setVisitas(listMapped);
      if (!silent) setLoading(false);
      setEnriching(true);

      // Fase 2: detalle de dispositivos + protocolos + ejecución
      try {
        const allDeviceIds = [...new Set(sdRows.map(sd => sd.dispositivo_id).filter(Boolean))];
        const dispositivosRows = allDeviceIds.length > 0
          ? await fetchInChunks(
              () => supabase
                .from('dispositivo')
                .select('id,id_inmotika,codigo_unico,modelo,serial,categoria_id,categoria:categoria_id(nombre)'),
              'id',
              allDeviceIds,
            )
          : [];

        if (isStale()) return listMapped;

        /** @type {Map<string, object>} */
        const dispositivoById = new Map();
        dispositivosRows.forEach(d => dispositivoById.set(d.id, d));

        dispositivosBySolicitud = new Map();
        sdRows.forEach(sd => {
          const d = dispositivoById.get(sd.dispositivo_id);
          if (!d) return;
          const list = dispositivosBySolicitud.get(sd.solicitud_id) || [];
          list.push(toDeviceLite(d));
          dispositivosBySolicitud.set(sd.solicitud_id, list);
        });

        const allCategoriaIds = [
          ...new Set(dispositivosRows.map(d => d.categoria_id).filter(Boolean)),
        ];
        /** @type {Map<string, Array>} */
        let pasosByCatId = new Map();
        if (allCategoriaIds.length > 0) {
          const pasos = await fetchInChunks(
            () => supabase
              .from('paso_protocolo')
              .select(`
                id, descripcion, orden, categoria_id,
                actividades:actividad_protocolo(id, descripcion, orden, activo)
              `)
              .eq('activo', true)
              .order('orden', { ascending: true }),
            'categoria_id',
            allCategoriaIds,
          );
          if (isStale()) return listMapped;

          pasos.forEach(paso => {
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

        if (!isStale()) {
          setPasosByCategoria(Object.fromEntries(pasosByCatId));
        }

        const visitaIds = (rows || []).map(r => r.id);
        let ejecucionActividadMap = new Map();
        let ejecucionPasoMap = new Map();
        let evidenciasMap = new Map();
        let codigoEtiquetaMap = new Map();
        const dispositivoIntervencionMap = new Map();
        const dispositivoFdsMap = new Map();

        if (visitaIds.length > 0) {
          const intervenciones = await fetchInChunks(
            () => supabase
              .from('intervencion')
              .select('id, visita_id, dispositivo_id, codigo_etiqueta, observacion_final, fuera_de_servicio, motivo_fuera_de_servicio')
              .eq('activo', true),
            'visita_id',
            visitaIds,
          );
          if (isStale()) return listMapped;

          const intervencionIds = intervenciones.map(i => i.id);
          const intervencionByVisita = new Map();
          intervenciones.forEach(i => {
            intervencionByVisita.set(i.id, i.visita_id);
            if (i.codigo_etiqueta) {
              const byDevice = codigoEtiquetaMap.get(i.visita_id) || {};
              byDevice[i.dispositivo_id] = i.codigo_etiqueta;
              codigoEtiquetaMap.set(i.visita_id, byDevice);
            }
            const dm = dispositivoIntervencionMap.get(i.visita_id) || {};
            dm[i.dispositivo_id] = i.id;
            dispositivoIntervencionMap.set(i.visita_id, dm);

            const fds = dispositivoFdsMap.get(i.visita_id) || {};
            fds[i.dispositivo_id] = { fueraDeServicio: !!i.fuera_de_servicio, motivo: i.motivo_fuera_de_servicio || null };
            dispositivoFdsMap.set(i.visita_id, fds);
          });

          if (intervencionIds.length > 0) {
            const [actRows, pasoRows, evRows] = await Promise.all([
              fetchInChunks(
                () => supabase
                  .from('ejecucion_actividad')
                  .select('intervencion_id, actividad_id, estado_id, catalogo:estado_id(codigo), observacion'),
                'intervencion_id',
                intervencionIds,
              ),
              fetchInChunks(
                () => supabase
                  .from('ejecucion_paso')
                  .select('intervencion_id, paso_protocolo_id, comentarios, fecha_inicio, fecha_fin'),
                'intervencion_id',
                intervencionIds,
              ),
              fetchInChunks(
                () => supabase
                  .from('evidencia_intervencion')
                  .select('intervencion_id, url, numero_foto, es_etiqueta')
                  .eq('activo', true)
                  .order('numero_foto', { ascending: true }),
                'intervencion_id',
                intervencionIds,
              ),
            ]);
            if (isStale()) return listMapped;

            actRows.forEach(a => {
              const vId = intervencionByVisita.get(a.intervencion_id);
              if (!vId) return;
              const catalogoCodigo = a.catalogo?.codigo || 'PENDIENTE';
              const estadoInterno =
                catalogoCodigo === 'COMPLETADA' ? 'completada' :
                catalogoCodigo === 'INCOMPLETA' ? 'omitida'    : 'pendiente';
              const map = ejecucionActividadMap.get(vId) || {};
              map[`${a.intervencion_id}:${a.actividad_id}`] = { estado: estadoInterno, observacion: a.observacion || null };
              ejecucionActividadMap.set(vId, map);
            });

            pasoRows.forEach(p => {
              const vId = intervencionByVisita.get(p.intervencion_id);
              if (!vId) return;
              const map = ejecucionPasoMap.get(vId) || {};
              map[`${p.intervencion_id}:${p.paso_protocolo_id}`] = {
                comentarios: p.comentarios || '',
                fechaInicio: p.fecha_inicio,
                fechaFin: p.fecha_fin,
              };
              ejecucionPasoMap.set(vId, map);
            });

            const intervencionDispositivoMap = new Map();
            intervenciones.forEach(i => intervencionDispositivoMap.set(i.id, i.dispositivo_id));

            evRows.forEach(ev => {
              const vId = intervencionByVisita.get(ev.intervencion_id);
              const dId = intervencionDispositivoMap.get(ev.intervencion_id);
              if (!vId || !dId) return;
              const path = toStoragePath(ev.url);
              const byDevice = evidenciasMap.get(vId) || {};
              const current = byDevice[dId] || { etiqueta: null, fotos: [] };
              if (ev.es_etiqueta) {
                current.etiqueta = { url: path, preview: path, file: null };
              } else {
                current.fotos.push({ url: path, preview: path, file: null });
              }
              byDevice[dId] = current;
              evidenciasMap.set(vId, byDevice);
            });
          }
        }

        if (isStale()) return listMapped;

        const mapped = (rows || []).map(r => {
          const base = mapRow(r, tecnicoNameMap, dispositivosBySolicitud, tecnicoProfileMap);
          const ejecucionActividades = ejecucionActividadMap.get(r.id) || {};
          const dispositivoIntervencionMapRow = dispositivoIntervencionMap.get(r.id) || {};
          const dispositivoFdsMapRow = dispositivoFdsMap.get(r.id) || {};
          return {
            ...base,
            ejecucionActividades,
            ejecucionPasos: ejecucionPasoMap.get(r.id) || {},
            deviceEvidencias: evidenciasMap.get(r.id) || {},
            codigoEtiquetaByDevice: codigoEtiquetaMap.get(r.id) || {},
            observacionFinal: r.observacion_final || '',
            dispositivoIntervencionMap: dispositivoIntervencionMapRow,
            dispositivoFdsMap: dispositivoFdsMapRow,
            deviceProgress: computeDeviceProgress(
              base.dispositivos,
              pasosByCatId,
              ejecucionActividades,
              dispositivoIntervencionMapRow,
              dispositivoFdsMapRow,
            ),
          };
        });
        setVisitas(mapped);
        return mapped;
      } catch (enrichErr) {
        console.error('[useVisitas] enrich error (lista ya visible):', enrichErr);
        return listMapped;
      } finally {
        if (!isStale()) setEnriching(false);
      }
    } catch (err) {
      console.error('[useVisitas] fetch error:', err);
      if (!isStale()) {
        notifyRef.current('error', 'No se pudieron cargar las visitas programadas.');
        setLoading(false);
        setEnriching(false);
      }
      return null;
    }
  }, [userId, user?.role]);

  useEffect(() => {
    fetchVisitas();
  }, [fetchVisitas]);

  // ── Create ─────────────────────────────────────────────────────────────────
  /**
   * Crea una visita a partir de una solicitud aprobada por el coordinador.
   * Inserta en `visita`, crea los registros `visita_tecnico` y actualiza
   * el estado de la `solicitud_visita` a PROGRAMADA.
   * Tanto `visita.estado_id` como `solicitud_visita.estado_id` referencian
   * la tabla `catalogo` con tipo ESTADO_VISITA.
   *
   * @param {CreateVisitaPayload} payload
   * @param {EstadoOption[]} estadoOptions - opciones de catalogo tipo ESTADO_VISITA
   * @returns {Promise<string|null>} - id de la visita creada o null si falla
   */
  const createVisita = useCallback(async (payload, estadoOptions) => {
    setSaving(true);
    try {
      // Buscar estado PROGRAMADA en catalogo tipo ESTADO_VISITA
      const estadoProgramadaVisitaId = estadoOptions.find(o => o.codigo === 'PROGRAMADA')?.value;
      if (!estadoProgramadaVisitaId) {
        notify('error', 'Estado PROGRAMADA no encontrado en el catálogo de estados. Contacta al administrador.');
        return null;
      }

      // Mismo UUID sirve para ambas tablas (mismo catálogo)
      const estadoProgramadaSolicitudId = estadoProgramadaVisitaId;

      // Insertar la visita principal
      const { data: inserted, error: insertError } = await supabase
        .from('visita')
        .insert({
          solicitud_id: payload.solicitudId || null,
          coordinador_usuario_id: payload.coordinadorId || null,
          cliente_id: payload.clienteId || null,
          sucursal_id: payload.sucursalId || null,
          tipo_visita_id: payload.tipoVisitaId || null,
          fecha_programada: payload.fechaProgramada
            ? new Date(payload.fechaProgramada).toISOString()
            : null,
          observaciones: payload.observaciones || null,
          estado_id: estadoProgramadaVisitaId,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Insertar técnicos asignados
      if (payload.tecnicoIds?.length > 0) {
        const { error: tecError } = await supabase
          .from('visita_tecnico')
          .insert(
            payload.tecnicoIds.map((tid, idx) => ({
              visita_id: inserted.id,
              tecnico_id: tid,
              es_lider: idx === 0, // el primero es líder por defecto
            }))
          );
        if (tecError) throw tecError;
      }

      // Actualizar estado de la solicitud origen a PROGRAMADA
      if (payload.solicitudId && estadoProgramadaSolicitudId) {
        const { error: solError } = await supabase
          .from('solicitud_visita')
          .update({ estado_id: estadoProgramadaSolicitudId })
          .eq('id', payload.solicitudId);
        if (solError) {
          // No lanzamos: la visita ya fue creada; solo notificamos
          console.warn('[useVisitas] No se pudo actualizar estado solicitud:', solError.message);
        }
      }

      // Notificar a los contactos de la sucursal (fire-and-forget)
      if (payload.sucursalId) {
        notificarVisitaProgramada(inserted.id, payload, { id: user?.id, role: user?.role });
      }

      await fetchVisitas();
      return inserted.id;
    } catch (err) {
      console.error('[useVisitas] create error:', err);
      notify('error', `No se pudo programar la visita: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchVisitas, notify]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update ─────────────────────────────────────────────────────────────────
  /**
   * Actualiza una visita existente. Solo permitido si `fecha_inicio` es null.
   * Sincroniza los técnicos: inserta los nuevos, elimina (hard delete) los removidos.
   *
   * @param {string} visitaId
   * @param {UpdateVisitaPayload} payload
   * @returns {Promise<boolean>}
   */
  const updateVisita = useCallback(async (visitaId, payload) => {
    // Verificar editabilidad desde el estado local (evita round-trip innecesario)
    const current = visitas.find(v => v.id === visitaId);
    if (current && !current.esEditable) {
      notify('warning', 'Esta visita ya inició y no puede ser editada.');
      return false;
    }

    setSaving(true);
    try {
      const updates = {};
      if (payload.fechaProgramada !== undefined) {
        updates.fecha_programada = payload.fechaProgramada
          ? new Date(payload.fechaProgramada).toISOString()
          : null;
      }
      if (payload.observaciones !== undefined) {
        updates.observaciones = payload.observaciones;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('visita')
          .update(updates)
          .eq('id', visitaId);
        if (updateError) throw updateError;
      }

      // Sincronizar técnicos: hard delete de removidos, insert de nuevos
      if (payload.tecnicoIds !== undefined) {
        // Obtener asignaciones actuales
        const { data: existing, error: fetchError } = await supabase
          .from('visita_tecnico')
          .select('id,tecnico_id')
          .eq('visita_id', visitaId);
        if (fetchError) throw fetchError;

        const existingMap = new Map((existing || []).map(e => [e.tecnico_id, e.id]));
        const newSet = new Set(payload.tecnicoIds);

        const toDelete = [];
        const toInsert = [];

        existingMap.forEach((rowId, tecId) => {
          if (!newSet.has(tecId)) toDelete.push(rowId);
        });

        newSet.forEach((tecId, idx) => {
          if (!existingMap.has(tecId)) toInsert.push({ tecnico_id: tecId, idx });
        });

        const ops = [];

        if (toDelete.length > 0) {
          ops.push(
            supabase.from('visita_tecnico').delete().in('id', toDelete)
          );
        }

        if (toInsert.length > 0) {
          ops.push(
            supabase.from('visita_tecnico').insert(
              toInsert.map(({ tecnico_id, idx }) => ({
                visita_id: visitaId,
                tecnico_id,
                es_lider: idx === 0 && existingMap.size === 0,
              }))
            )
          );
        }

        if (ops.length > 0) {
          const results = await Promise.all(ops);
          const firstErr = results.find(r => r.error)?.error;
          if (firstErr) throw firstErr;
        }
      }

      await fetchVisitas();
      return true;
    } catch (err) {
      console.error('[useVisitas] update error:', err);
      notify('error', `No se pudo actualizar la visita: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [visitas, fetchVisitas, notify]);

  // ── Cancel ─────────────────────────────────────────────────────────────────
  /**
   * Cancela una visita estableciendo su estado a CANCELADA.
   * Si la visita tiene solicitud origen, la regresa a PENDIENTE para que pueda
   * ser reprogramada por el coordinador.
   *
   * @param {string} visitaId
   * @param {EstadoOption[]} estadoOptions - opciones de catalogo tipo ESTADO_VISITA
   * @returns {Promise<boolean>}
   */
  const cancelVisita = useCallback(async (visitaId, estadoOptions) => {
    setSaving(true);
    try {
      const estadoCanceladaId = estadoOptions.find(o => o.codigo === 'CANCELADA')?.value;
      if (!estadoCanceladaId) throw new Error('Estado CANCELADA no encontrado en el catálogo.');

      const estadoPendienteId = estadoOptions.find(o => o.codigo === 'PENDIENTE')?.value;

      // Cancelar la visita
      const { error } = await supabase
        .from('visita')
        .update({ estado_id: estadoCanceladaId })
        .eq('id', visitaId);

      if (error) throw error;

      // Regresar la solicitud origen a PENDIENTE para que pueda ser reprogramada
      const visitaLocal = visitas.find(v => v.id === visitaId);
      if (visitaLocal?.solicitudId && estadoPendienteId) {
        const { error: solError } = await supabase
          .from('solicitud_visita')
          .update({ estado_id: estadoPendienteId })
          .eq('id', visitaLocal.solicitudId);
        if (solError) {
          // No bloqueante — la visita ya fue cancelada; solo avisar en consola
          console.warn('[useVisitas] No se pudo regresar solicitud a PENDIENTE:', solError.message);
        }
      }

      await fetchVisitas();
      return true;
    } catch (err) {
      console.error('[useVisitas] cancel error:', err);
      notify('error', `No se pudo cancelar la visita: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [visitas, fetchVisitas, notify]);

  /**
   * Inyecta pasos de protocolo en los dispositivos de una visita (al abrir detalle).
   * En la lista los dispositivos van sin pasos para no inflar el estado (~1MB+).
   */
  const withDevicePasos = useCallback((visita) => {
    if (!visita) return visita;
    return {
      ...visita,
      dispositivos: (visita.dispositivos || []).map(d => ({
        ...d,
        pasos: (d.categoriaId && pasosByCategoria[d.categoriaId]) || d.pasos || [],
      })),
    };
  }, [pasosByCategoria]);

  return {
    visitas,
    loading,
    enriching,
    saving,
    pasosByCategoria,
    withDevicePasos,
    fetchVisitas,
    createVisita,
    updateVisita,
    cancelVisita,
  };
};

/**
 * Provider único: Schedule, Gestión y Programación comparten el mismo cache.
 * Evita un refetch completo (~10s+) cada vez que el técnico abre una visita.
 */
export const VisitasProvider = ({ children }) => {
  const value = useVisitasState();
  return createElement(VisitasContext.Provider, { value }, children);
};

/**
 * Hook de consumo. Debe usarse dentro de VisitasProvider.
 */
export const useVisitas = () => {
  const ctx = useContext(VisitasContext);
  if (!ctx) {
    throw new Error('useVisitas must be used within a VisitasProvider');
  }
  return ctx;
};
