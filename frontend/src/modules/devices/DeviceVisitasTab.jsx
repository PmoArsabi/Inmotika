/**
 * Tab "Historial de Visitas" del formulario de dispositivos.
 * Incluye contadores de trazabilidad, filtros y lista expandible.
 */
import React, { useState } from 'react';
import {
  Shield, Wrench, Search, Filter, X, Calendar,
  Loader2, ChevronUp, ChevronDown, Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import SecureImage from '../../components/ui/SecureImage';

// ─── VisitaHistorialCard ──────────────────────────────────────────────────────

/**
 * Card expandible que muestra el resumen y detalle de una intervención.
 * @param {{ intervencion: object }} props
 */
const VisitaHistorialCard = ({ intervencion }) => {
  const [expanded, setExpanded] = useState(false);

  const visita       = intervencion.visita;
  const tipo         = visita?.tipo_visita?.codigo || '';
  const esCorrectivo = tipo === 'CORRECTIVO';
  const fecha        = visita?.fecha_inicio || visita?.fecha_programada;
  const fechaFin     = visita?.fecha_fin;
  const tecnicos     = (visita?.visita_tecnico || [])
    .map(vt => {
      const p = vt.tecnico?.perfil;
      return p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : null;
    })
    .filter(Boolean);
  const evidencias = (intervencion.evidencias || []).filter(e => e.activo);
  const fmtDate    = (d) => d
    ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${esCorrectivo ? 'bg-orange-400' : 'bg-green-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              esCorrectivo ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
            }`}>
              {visita?.tipo_visita?.nombre || tipo || 'Visita'}
            </span>
            <span className="text-xs text-gray-500">
              {fmtDate(fecha)}{fechaFin ? ` → ${fmtDate(fechaFin)}` : ''}
            </span>
          </div>
          {tecnicos.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">Técnico(s): {tecnicos.join(', ')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {evidencias.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <ImageIcon size={11} /> {evidencias.length}
            </span>
          )}
          {expanded
            ? <ChevronUp size={14} className="text-gray-400" />
            : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-3">
          {intervencion.observacion_final && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Observación final</p>
              <p className="text-xs text-gray-700 leading-relaxed">{intervencion.observacion_final}</p>
            </div>
          )}
          {evidencias.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Evidencias fotográficas</p>
              <div className="flex flex-wrap gap-2">
                {evidencias.map(e => (
                  <div
                    key={e.id}
                    className="w-16 h-16 rounded-md overflow-hidden border border-gray-200 bg-gray-100 hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => {
                      supabase.storage.from('inmotika').createSignedUrl(e.url, 3600)
                        .then(({ data }) => { if (data?.signedUrl) window.open(data.signedUrl, '_blank'); });
                    }}
                  >
                    <SecureImage
                      path={e.url}
                      bucket="inmotika"
                      alt={e.es_etiqueta ? 'etiqueta' : 'evidencia'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {!intervencion.observacion_final && evidencias.length === 0 && (
            <p className="text-xs text-gray-400 italic">Sin observaciones ni evidencias registradas.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── DeviceVisitasTab ─────────────────────────────────────────────────────────

/**
 * Tab completa del historial de visitas de un dispositivo.
 * @param {{ visitaHistory: Array, loadingHistory: boolean }} props
 */
const DeviceVisitasTab = ({ visitaHistory, loadingHistory }) => {
  const [visitaTipoFilter, setVisitaTipoFilter] = useState('');
  const [visitaSearch, setVisitaSearch] = useState('');

  const tiposDisponibles = [...new Set(
    visitaHistory.map(v => v.visita?.tipo_visita?.codigo).filter(Boolean)
  )];

  const filteredVisitas = visitaHistory.filter(v => {
    const matchTipo   = !visitaTipoFilter || v.visita?.tipo_visita?.codigo === visitaTipoFilter;
    const needle      = visitaSearch.trim().toLowerCase();
    const matchSearch = !needle
      || (v.observacion_final || '').toLowerCase().includes(needle)
      || (v.visita?.tipo_visita?.nombre || '').toLowerCase().includes(needle)
      || (v.visita?.visita_tecnico || []).some(vt => {
           const p = vt.tecnico?.perfil;
           return p && `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase().includes(needle);
         });
    return matchTipo && matchSearch;
  });

  const hasActiveFilters = visitaTipoFilter || visitaSearch.trim();

  const preventivos = visitaHistory.filter(v => v.visita?.tipo_visita?.codigo === 'PREVENTIVO').length;
  const correctivos = visitaHistory.filter(v => v.visita?.tipo_visita?.codigo === 'CORRECTIVO').length;

  return (
    <div className="flex-1 space-y-3 overflow-y-auto">

      {/* Contadores de trazabilidad */}
      {visitaHistory.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <Shield size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Preventivos</p>
              <p className="text-xl font-black text-green-800">{preventivos}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
            <Wrench size={18} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Correctivos</p>
              <p className="text-xl font-black text-orange-800">{correctivos}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {visitaHistory.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={visitaSearch}
              onChange={e => setVisitaSearch(e.target.value)}
              placeholder="Buscar por observación, técnico..."
              className="w-full h-8 pl-7 pr-7 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all bg-white"
            />
            {visitaSearch && (
              <button
                onClick={() => setVisitaSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={visitaTipoFilter}
              onChange={e => setVisitaTipoFilter(e.target.value)}
              className="h-8 pl-7 pr-6 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all bg-white appearance-none cursor-pointer font-medium text-gray-700"
            >
              <option value="">Todos los tipos</option>
              {tiposDisponibles.map(codigo => (
                <option key={codigo} value={codigo}>
                  {visitaHistory.find(v => v.visita?.tipo_visita?.codigo === codigo)?.visita?.tipo_visita?.nombre || codigo}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setVisitaTipoFilter(''); setVisitaSearch(''); }}
              className="shrink-0 h-8 px-2.5 text-xs font-semibold text-[#D32F2F] border border-[#D32F2F]/30 rounded-md hover:bg-[#D32F2F]/5 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Lista */}
      {loadingHistory ? (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando historial...</span>
        </div>
      ) : visitaHistory.length === 0 ? (
        <div className="py-10 text-center">
          <Calendar size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-xs italic text-gray-400">Sin visitas registradas</p>
        </div>
      ) : filteredVisitas.length === 0 ? (
        <div className="py-8 text-center">
          <Search size={24} className="mx-auto mb-2 text-gray-200" />
          <p className="text-xs italic text-gray-400">No hay visitas que coincidan con los filtros</p>
          <button
            onClick={() => { setVisitaTipoFilter(''); setVisitaSearch(''); }}
            className="mt-2 text-xs font-semibold text-[#D32F2F] hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {hasActiveFilters && (
            <p className="text-[10px] text-gray-400 font-medium px-0.5">
              {filteredVisitas.length} de {visitaHistory.length} visita{visitaHistory.length !== 1 ? 's' : ''}
            </p>
          )}
          {filteredVisitas.map(v => <VisitaHistorialCard key={v.id} intervencion={v} />)}
        </div>
      )}
    </div>
  );
};

export default DeviceVisitasTab;
