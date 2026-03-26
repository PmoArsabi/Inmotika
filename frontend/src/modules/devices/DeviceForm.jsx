import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Hash, Monitor, User, Activity,
  ClipboardList, CheckCircle2, ChevronUp, ChevronDown,
  Trash2, ArrowRightLeft, Calendar, Plus, Loader2,
  Tag, Wrench, Navigation2, Layers, Barcode,
  ShoppingCart, AlertTriangle, Wrench as WrenchIcon, Shield,
  Image as ImageIcon, ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon,
  Search, X, Filter,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Tabs from '../../components/ui/Tabs';
import { Label, TextSmall } from '../../components/ui/Typography';
import Card from '../../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import SecureImage from '../../components/ui/SecureImage';
import CategoriaForm from './CategoriaForm';
import { useActivoInactivo } from '../../hooks/useCatalog';
import { useConfigurationContext } from '../../context/ConfigurationContext';

// ─── Constantes ───────────────────────────────────────────────────────────────
const FORM_TABS = [
  { key: 'details',   label: 'Detalles del Dispositivo' },
  { key: 'traslados', label: 'Historial de Traslados'   },
  { key: 'visitas',   label: 'Historial de Visitas'     },
];


const calcProximaFecha = (meses) => {
  if (!meses || isNaN(Number(meses))) return '';
  const d = new Date();
  d.setMonth(d.getMonth() + Number(meses));
  return d.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes de presentación
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const SectionHeader = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
    <Icon size={15} className="text-gray-500" />
    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
  </div>
);


// eslint-disable-next-line no-unused-vars
const CompactSummaryItem = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-gray-400">
      <Icon size={11} className="shrink-0" />
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-[11px] font-semibold text-gray-700 truncate leading-none">
      {value || '—'}
    </span>
  </div>
);

// eslint-disable-next-line no-unused-vars
const SummaryRow = ({ icon: Icon, label, value, sub }) => (
  <div className="flex items-start gap-3">
    <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <TextSmall className="text-gray-500">{label}</TextSmall>
      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  </div>
);

// eslint-disable-next-line no-unused-vars
const HistoryTable = ({ title, icon: Icon, headers, rows, emptyText }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-gray-400" />
      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{title}</span>
    </div>
    <Card className="p-0 border border-gray-200 overflow-hidden shadow-sm">
      <Table>
        <THead variant="light">
          <tr>{headers.map(h => <Th key={h}>{h}</Th>)}</tr>
        </THead>
        <TBody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-10 text-center">
                <Icon size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs italic text-gray-400">{emptyText}</p>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <Tr key={i}>{row.map((cell, j) => <Td key={j}><TextSmall>{cell}</TextSmall></Td>)}</Tr>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  </div>
);

const ProtocoloPasos = ({ categoriaId, categoryPasos, pasos, isEditing, onUpdateStep, onMoveStep, onRemoveStep }) => (
  <div className="pt-2 space-y-3">
    <div className="flex items-center gap-2">
      <ClipboardList size={15} className="text-gray-500" />
      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
        Protocolo de Mantenimiento
        {categoriaId && <span className="ml-2 text-[#D32F2F] font-normal normal-case text-[10px]">(según categoría)</span>}
      </span>
    </div>

    {categoriaId && categoryPasos.length > 0 ? (
      <div className="space-y-2">
        {categoryPasos.map((paso, idx) => (
          <div key={paso.id || idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#D32F2F] to-[#8B0000] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                <TextSmall className="font-semibold text-gray-800">{paso.descripcion}</TextSmall>
                {paso.esObligatorio && (
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide block mt-0.5">Obligatorio</span>
                )}
              </div>
            </div>
            
            {/* Actividades del paso (si existen) de Categorias */}
            {paso.actividades && paso.actividades.length > 0 && (
              <div className="pl-10 space-y-1.5 mt-1 border-l-2 border-gray-100 ml-3">
                {paso.actividades.map((act, actIdx) => (
                  <div key={actIdx} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <TextSmall className="text-gray-600">{act.descripcion}</TextSmall>
                      {act.esObligatorio && <span className="ml-2 text-[9px] font-bold text-orange-500 uppercase tracking-wide">Oblig.</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ) : categoriaId ? (
      <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
        <TextSmall className="text-gray-400 italic">Esta categoría no tiene protocolo definido</TextSmall>
      </div>
    ) : pasos.length === 0 ? (
      <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
        <TextSmall className="text-gray-400 italic">Seleccione una categoría para ver el protocolo</TextSmall>
      </div>
    ) : (
      <div className="space-y-2">
        {pasos.map((step, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5 shrink-0">
                {isEditing && <button onClick={() => onMoveStep(idx, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-30"><ChevronUp size={13} /></button>}
                <span className="font-bold text-gray-400 text-[10px] text-center">{idx + 1}</span>
                {isEditing && <button onClick={() => onMoveStep(idx, 'down')} disabled={idx === pasos.length - 1} className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-30"><ChevronDown size={13} /></button>}
              </div>
              <div className="flex-1 space-y-1">
                {isEditing ? (
                  <input
                    className="w-full bg-transparent text-sm text-gray-700 outline-none font-medium"
                    value={step.descripcion}
                    onChange={e => onUpdateStep(idx, { descripcion: e.target.value })}
                    placeholder="Descripción del paso..."
                  />
                ) : (
                  <TextSmall className="font-medium text-gray-700">{step.descripcion}</TextSmall>
                )}
                {isEditing && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={!!step.esObligatorio} onChange={e => onUpdateStep(idx, { esObligatorio: e.target.checked })} className="w-3 h-3 accent-[#D32F2F]" />
                    <span className="text-[10px] font-semibold text-gray-500">Obligatorio</span>
                  </label>
                )}
                {!isEditing && step.esObligatorio && (
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Obligatorio</span>
                )}
              </div>
              {isEditing && (
                <IconButton icon={Trash2} onClick={() => onRemoveStep(idx)} className="text-gray-300 hover:text-red-500 shrink-0" size={13} />
              )}
            </div>
            
            {/* Actividades del paso (si existen) */}
            {step.actividades && step.actividades.length > 0 && (
              <div className="pl-10 space-y-1.5 mt-1 border-l-2 border-gray-100 ml-3">
                {step.actividades.map((act, actIdx) => (
                  <div key={actIdx} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <TextSmall className="text-gray-600">{act.descripcion}</TextSmall>
                      {act.esObligatorio && <span className="ml-2 text-[9px] font-bold text-orange-500 uppercase tracking-wide">Oblig.</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Hook: carga historial de visitas de un dispositivo desde Supabase
// ─────────────────────────────────────────────────────────────────────────────
const useDeviceVisitHistory = (deviceId) => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deviceId || String(deviceId).startsWith('new-')) return;
    setLoading(true);

    supabase
      .from('intervencion')
      .select(`
        id,
        observacion_final,
        estado:estado_id(codigo, nombre),
        visita:visita_id(
          id,
          fecha_programada,
          fecha_inicio,
          fecha_fin,
          tipo_visita:tipo_visita_id(codigo, nombre),
          visita_tecnico(
            tecnico:tecnico_id(
              perfil:usuario_id(nombres, apellidos)
            )
          )
        ),
        evidencias:evidencia_intervencion(id, url, es_etiqueta, activo)
      `)
      .eq('dispositivo_id', deviceId)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setVisitas(data || []);
        setLoading(false);
      });
  }, [deviceId]);

  return { visitas, loading };
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente: card expandible por cada visita del historial
// ─────────────────────────────────────────────────────────────────────────────
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
  const fmtDate    = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
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
            <span className="text-xs text-gray-500">{fmtDate(fecha)}{fechaFin ? ` → ${fmtDate(fechaFin)}` : ''}</span>
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
          {expanded ? <ChevronUpIcon size={14} className="text-gray-400" /> : <ChevronDownIcon size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Detalle expandido */}
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
                  <div key={e.id}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const DeviceForm = ({
  draft, updateDraft, errors = {}, showErrors = false, isEditing = false,
  onSave, isSaving = false, clients = [],
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { activoId, inactivoId } = useActivoInactivo();
  const { visitas: visitaHistory, loading: loadingHistory } = useDeviceVisitHistory(draft.id);

  // ─── Filtros del historial de visitas ─────────────────────────────────────
  const [visitaTipoFilter, setVisitaTipoFilter] = useState('');
  const [visitaSearch, setVisitaSearch] = useState('');

  // ─── Categorías, Proveedores y Marcas ────────────────────────────────────
  const [categorias, setCategorias]       = useState([]);
  const [loadingCats, setLoadingCats]     = useState(true);
  const [proveedores, setProveedores]     = useState([]);
  const [loadingProvs, setLoadingProvs]   = useState(true);
  const [marcas, setMarcas]               = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [gestiones, setGestiones]         = useState([]);
  const [loadingGestiones, setLoadingGest] = useState(true);
  const [categoryPasos, setCategoryPasos] = useState([]);

  const loadCategorias = useCallback(async () => {
    setLoadingCats(true);
    try {
      const { data: cats, error } = await supabase
        .from('categoria_dispositivo')
        .select('id, nombre')
        .or('activo.eq.true,activo.is.null')
        .order('nombre');
      
      if (error) throw error;
      setCategorias((cats || []).map(c => ({ value: c.id, label: c.nombre })));
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const loadProveedores = useCallback(async () => {
    setLoadingProvs(true);
    try {
      const { data: provs, error } = await supabase
        .from('proveedor')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      setProveedores((provs || []).map(p => ({ value: p.id, label: p.nombre })));
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setLoadingProvs(false);
    }
  }, []);

  const loadMarcas = useCallback(async (proveedorId) => {
    if (!proveedorId) { setMarcas([]); return; }
    setLoadingMarcas(true);
    try {
      const { data: mks, error } = await supabase
        .from('marca')
        .select('id, nombre')
        .eq('proveedor_id', proveedorId)
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      setMarcas((mks || []).map(m => ({ value: m.id, label: m.nombre })));
    } catch (err) {
      console.error('Error loading brands:', err);
    } finally {
      setLoadingMarcas(false);
    }
  }, []);

  const loadGestiones = useCallback(async () => {
    setLoadingGest(true);
    try {
      const { data, error } = await supabase
        .from('catalogo_estado_dispositivo')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      setGestiones((data || []).map(g => ({ value: g.id, label: g.nombre })));
    } catch (err) {
      console.error('Error loading gestiones:', err);
    } finally {
      setLoadingGest(false);
    }
  }, []);

  useEffect(() => { 
    loadCategorias();
    loadProveedores();
    loadGestiones();
  }, [loadCategorias, loadProveedores, loadGestiones]);

  useEffect(() => {
    if (draft.proveedorId) {
      loadMarcas(draft.proveedorId);
    } else {
      setMarcas([]);
    }
  }, [draft.proveedorId, loadMarcas]);

  useEffect(() => {
    if (!draft.categoriaId) { setCategoryPasos([]); return; }
    
    const loadProtocol = async () => {
      try {
        const { data: pasos, error } = await supabase
          .from('paso_protocolo')
          .select(`
            *,
            actividades:actividad_protocolo(*)
          `)
          .eq('categoria_id', draft.categoriaId)
          .or('activo.eq.true,activo.is.null')
          .order('orden');
        
        if (error) throw error;
        
        // Map activities to camelCase for UI consistency if needed
        const mappedPasos = (pasos || []).map(p => ({
          ...p,
          actividades: (p.actividades || [])
            .filter(a => a.activo !== false)
            .sort((a, b) => a.orden - b.orden)
            .map(a => ({
              ...a,
              esObligatorio: a.es_obligatorio
            }))
        }));
        
        setCategoryPasos(mappedPasos);
      } catch (err) {
        console.error('Error loading protocol:', err);
      }
    };

    loadProtocol();
  }, [draft.categoriaId]);

  // Default state to ACTIVO for new devices (only once when activoId loads)
  useEffect(() => {
    if (!draft.estadoId && activoId) {
      updateDraft({ estadoId: activoId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activoId]);

  // ─── Frecuencia → fecha automática ────────────────────────────────────────
  const handleFrecuenciaChange = (val) => {
    const n = val === '' ? '' : parseInt(val, 10);
    updateDraft({
      frecuenciaMantenimientoMeses: isNaN(n) ? '' : n,
      fechaProximoMantenimiento: calcProximaFecha(n),
    });
  };

  // ─── Cliente / Sucursal ───────────────────────────────────────────────────
  const activeClient      = (clients || []).find(c => String(c.id) === String(draft.clientId));
  const activeBranchOpts  = (activeClient?.sucursales || []).map(b => ({ value: b.id, label: b.nombre }));
  const activeClientName  = activeClient?.nombre || '—';
  const activeBranchName  = activeClient?.sucursales?.find(b => String(b.id) === String(draft.branchId))?.nombre || '—';

  // ─── Pasos manuales ───────────────────────────────────────────────────────
  const pasos = (Array.isArray(draft.pasoAPaso) ? draft.pasoAPaso : [])
    .map((p, i) => typeof p === 'string' ? { descripcion: p, esObligatorio: true, orden: i + 1 } : p);

  const updateStep = (idx, patch) => {
    const next = [...pasos]; next[idx] = { ...next[idx], ...patch };
    updateDraft({ pasoAPaso: next });
  };
  const moveStep = (idx, dir) => {
    const next = [...pasos];
    if (dir === 'up'   && idx > 0)              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    if (dir === 'down' && idx < next.length - 1) [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    updateDraft({ pasoAPaso: next.map((p, i) => ({ ...p, orden: i + 1 })) });
  };
  const removeStep = (idx) =>
    updateDraft({ pasoAPaso: pasos.filter((_, i) => i !== idx).map((p, i) => ({ ...p, orden: i + 1 })) });

  // ─── Navegación ──────────────────────────────────────────────────────────
  const { pushRoute, route } = useConfigurationContext();
  const currentKey = `dispositivo:${route.deviceId}`;



  // ─── Lista de visitas filtrada ────────────────────────────────────────────
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

  // ─── Vista principal ──────────────────────────────────────────────────────
  const isActivo = !!activoId && draft.estadoId === activoId;

  return (
    <>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

      {/* ── Columna izquierda: Resumen ── */}
      <div className="lg:col-span-1">
        <Card className="p-6 space-y-6 h-full">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-linear-to-br from-[#D32F2F] to-[#8B0000] rounded-2xl flex items-center justify-center shadow-lg shrink-0 rotate-3">
              <Monitor size={24} className="text-white -rotate-3" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-gray-900 truncate tracking-tight">
                {draft.serial || 'NUEVO EQUIPO'}
              </h3>
              <p className="text-[10px] font-bold text-[#D32F2F] uppercase tracking-widest opacity-80">
                {categorias.find(c => c.value === draft.categoriaId)?.label || 'Sin categoría'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {draft.marca && (
                <div className="col-span-2 mb-1">
                  <SummaryRow icon={Monitor} label="Marca / Modelo" value={`${draft.marca?.nombre || draft.marca}${draft.modelo ? ` — ${draft.modelo}` : ''}`} />
                </div>
              )}
              
              <CompactSummaryItem icon={Hash} label="Serie" value={draft.serial} />
              <CompactSummaryItem icon={Hash} label="ID Inmotika" value={draft.idInmotika} />
              <CompactSummaryItem icon={Barcode} label="Código" value={draft.codigoUnico} />
              <CompactSummaryItem icon={Navigation2} label="MAC" value={draft.imac} />
              
              <CompactSummaryItem 
                icon={User} 
                label="Dueño" 
                value={draft.esDeInmotika ? 'Inmotika' : 'Cliente'} 
              />
              <CompactSummaryItem 
                icon={Activity} 
                label="Estado Gestión" 
                value={gestiones.find(g => g.value === draft.estadoGestionId)?.label} 
              />

              {activeClientName !== '—' && (
                <div className="col-span-2 pt-3 mt-1 border-t border-gray-100">
                  <SummaryRow icon={Building2} label="Cliente / Ubicación" value={activeClientName} sub={activeBranchName !== '—' ? activeBranchName : undefined} />
                </div>
              )}
            </div>
          </div>

          {/* Ciclo de vida */}
          {(draft.fechaCompra || draft.fechaCaducidad) && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              {draft.fechaCompra && (
                <CompactSummaryItem
                  icon={ShoppingCart}
                  label="Compra"
                  value={new Date(draft.fechaCompra + 'T00:00:00').toLocaleDateString('es-CO')}
                />
              )}
              {draft.fechaCaducidad && (() => {
                const hoy = new Date();
                const cad = new Date(draft.fechaCaducidad + 'T00:00:00');
                const diasRestantes = Math.ceil((cad - hoy) / (1000 * 60 * 60 * 24));
                const vencido = diasRestantes < 0;
                const proximo = diasRestantes >= 0 && diasRestantes <= 30;
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <AlertTriangle size={11} className={`shrink-0 ${vencido ? 'text-red-500' : proximo ? 'text-orange-400' : ''}`} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Caducidad</span>
                    </div>
                    <span className={`text-[11px] font-semibold leading-none ${vencido ? 'text-red-600' : proximo ? 'text-orange-500' : 'text-gray-700'}`}>
                      {cad.toLocaleDateString('es-CO')}
                      {vencido && <span className="ml-1 text-[9px] font-bold uppercase">· Vencido</span>}
                      {proximo && !vencido && <span className="ml-1 text-[9px] font-bold uppercase">· {diasRestantes}d</span>}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Trazabilidad rápida */}
          {visitaHistory.length > 0 && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Activity size={11} className="shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Trazabilidad</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center p-2 bg-green-50 rounded-md">
                  <span className="text-lg font-black text-green-700">
                    {visitaHistory.filter(v => v.visita?.tipo_visita?.codigo === 'PREVENTIVO').length}
                  </span>
                  <span className="text-[9px] text-green-600 font-semibold uppercase tracking-wide">Prev.</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-orange-50 rounded-md">
                  <span className="text-lg font-black text-orange-700">
                    {visitaHistory.filter(v => v.visita?.tipo_visita?.codigo === 'CORRECTIVO').length}
                  </span>
                  <span className="text-[9px] text-orange-600 font-semibold uppercase tracking-wide">Corr.</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 flex justify-center">
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              isActivo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {isActivo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </Card>
      </div>

      {/* ── Columna derecha: Tabs + contenido ── */}
      <div className="lg:col-span-2">
        <Card className="p-6 h-full flex flex-col gap-4">

          {/* Header: solo tabs */}
          <div className="border-b border-gray-200 pb-2 shrink-0">
            <Tabs tabs={FORM_TABS} active={activeTab} onChange={setActiveTab} />
          </div>

          {/* ── Tab: Detalles ── */}
          {activeTab === 'details' && (
            <div className="space-y-8 overflow-y-auto flex-1">

              {/* Sección 1 — Clasificación Técnica + botón guardar a la derecha */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Tag size={15} className="text-gray-500" />
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Clasificación Técnica</span>
                  </div>
                  {isEditing && (
                    <Button onClick={onSave} disabled={isSaving}
                      className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] text-white border-0 shrink-0">
                      {isSaving ? 'Guardando...' : 'Guardar Equipo'}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Categoría */}
                  <SearchableSelect
                    label="Categoría"
                    icon={Layers}
                    options={categorias}
                    value={draft.categoriaId || ''}
                    isLoading={loadingCats}
                    onChange={opt => updateDraft({ categoriaId: opt?.value || '' })}
                    isDisabled={!isEditing}
                    placeholder="Buscar categoría..."
                    viewMode={!isEditing}
                    action={isEditing && (
                      <button type="button" onClick={() => pushRoute({ 
                        type: 'categoria', 
                        mode: 'create', 
                        originKey: currentKey, 
                        originField: 'categoriaId' 
                      })}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nueva categoría">
                        <Plus size={12} />
                      </button>
                    )}
                  />

                  {/* Proveedor */}
                  <SearchableSelect
                    label="Proveedor"
                    icon={Building2}
                    options={proveedores}
                    value={draft.proveedorId || ''}
                    isLoading={loadingProvs}
                    onChange={opt => updateDraft({ proveedorId: opt?.value || '', marcaId: '' })}
                    isDisabled={!isEditing}
                    placeholder="Buscar proveedor..."
                    viewMode={!isEditing}
                    action={isEditing && (
                      <button type="button" onClick={() => pushRoute({ 
                        type: 'proveedor', 
                        mode: 'create', 
                        originKey: currentKey, 
                        originField: 'proveedorId' 
                      })}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nuevo proveedor">
                        <Plus size={12} />
                      </button>
                    )}
                  />

                  {/* Marca */}
                  <SearchableSelect
                    label="Marca"
                    icon={Tag}
                    options={marcas}
                    value={draft.marcaId || ''}
                    isLoading={loadingMarcas}
                    onChange={opt => updateDraft({ marcaId: opt?.value || '' })}
                    isDisabled={!isEditing || !draft.proveedorId}
                    placeholder={draft.proveedorId ? "Buscar marca..." : "Primero seleccione proveedor"}
                    viewMode={!isEditing}
                    action={isEditing && draft.proveedorId && (
                      <button type="button" onClick={() => pushRoute({ 
                        type: 'marca', 
                        mode: 'create', 
                        originKey: currentKey, 
                        originField: 'marcaId',
                        proveedorId: draft.proveedorId
                      })}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nueva marca">
                        <Plus size={12} />
                      </button>
                    )}
                  />

                  <Input
                    label="Número de Serie"
                    value={draft.serial || ''}
                    onChange={e => updateDraft({ serial: e.target.value })}
                    error={showErrors ? errors.serial : null}
                    viewMode={!isEditing}
                    icon={Hash}
                    required
                  />
                  <Input
                    label="Línea"
                    value={draft.linea || ''}
                    onChange={e => updateDraft({ linea: e.target.value })}
                    viewMode={!isEditing}
                    placeholder="Ej: Industrial / Residencial"
                    icon={Activity}
                  />
                  <Input
                    label="Modelo"
                    value={draft.modelo || ''}
                    onChange={e => updateDraft({ modelo: e.target.value })}
                    viewMode={!isEditing}
                    icon={Layers}
                  />
                  <Input
                    label="ID Inmotika"
                    value={draft.idInmotika || ''}
                    onChange={e => updateDraft({ idInmotika: e.target.value })}
                    viewMode={!isEditing}
                    icon={Hash}
                    placeholder="ID interno Inmotika"
                  />
                  <Input
                    label="Código Único"
                    value={draft.codigoUnico || ''}
                    onChange={e => updateDraft({ codigoUnico: e.target.value })}
                    viewMode={!isEditing}
                    icon={Barcode}
                    placeholder="Identificador único adicional"
                  />
                  <Input
                    label="IMAC / MAC"
                    value={draft.imac || ''}
                    onChange={e => updateDraft({ imac: e.target.value })}
                    viewMode={!isEditing}
                    icon={Navigation2}
                    placeholder="Dirección física del equipo"
                  />
                </div>
              </section>

              {/* ─── Gestión de Propiedad ─── */}
              <section className="space-y-4">
                <SectionHeader icon={User} label="Gestión de Propiedad" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Switch
                    label="¿Quién es el dueño?"
                    checked={draft.esDeInmotika}
                    onChange={val => updateDraft({ esDeInmotika: val })}
                    viewMode={!isEditing}
                    checkedLabel="Inmotika"
                    uncheckedLabel="Cliente"
                  />
                  <SearchableSelect
                    label="Estado de Propiedad"
                    options={gestiones}
                    value={draft.estadoGestionId || ''}
                    isLoading={loadingGestiones}
                    onChange={opt => updateDraft({ estadoGestionId: opt?.value || '' })}
                    isDisabled={!isEditing}
                    placeholder="Seleccionar estado..."
                    viewMode={!isEditing}
                    icon={Activity}
                  />
                </div>
              </section>

              {/* Sección 2 — Ubicación Sede */}
              <section className="space-y-4">
                <SectionHeader icon={MapPin} label="Ubicación Sede" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SearchableSelect
                    label="Cliente"
                    options={(clients || []).map(c => ({ value: c.id, label: c.nombre }))}
                    value={draft.clientId}
                    onChange={opt => updateDraft({ clientId: opt?.value || '', branchId: '' })}
                    isDisabled={!isEditing}
                    viewMode={!isEditing}
                    icon={Building2}
                    error={showErrors ? errors.clientId : null}
                    placeholder="Buscar cliente..."
                  />
                  <SearchableSelect
                    label="Sucursal"
                    options={activeBranchOpts}
                    value={draft.branchId}
                    onChange={opt => updateDraft({ branchId: opt?.value || '' })}
                    isDisabled={!isEditing || !draft.clientId}
                    viewMode={!isEditing}
                    placeholder={draft.clientId ? 'Buscar sucursal...' : 'Primero seleccione un cliente'}
                    icon={MapPin}
                    error={showErrors ? errors.branchId : null}
                  />
                </div>
              </section>

              {/* Sección 3 — Propiedad y Estado */}
              <section className="space-y-4">
                <SectionHeader icon={User} label="Estado del Equipo" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Switch
                    label="Estado"
                    checked={!!activoId && draft.estadoId === activoId}
                    onChange={checked => updateDraft({ estadoId: checked ? activoId : inactivoId })}
                    viewMode={!isEditing}
                    checkedLabel="Activo"
                    uncheckedLabel="Inactivo"
                  />
                </div>
              </section>

              {/* Sección 4 — Ciclo de Vida */}
              <section className="space-y-4">
                <SectionHeader icon={ShoppingCart} label="Ciclo de Vida del Equipo" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Fecha de Compra"
                    type="date"
                    value={draft.fechaCompra || ''}
                    onChange={e => updateDraft({ fechaCompra: e.target.value })}
                    viewMode={!isEditing}
                    icon={ShoppingCart}
                  />
                  <Input
                    label="Fecha de Caducidad / Garantía"
                    type="date"
                    value={draft.fechaCaducidad || ''}
                    onChange={e => updateDraft({ fechaCaducidad: e.target.value })}
                    viewMode={!isEditing}
                    icon={AlertTriangle}
                  />
                </div>
              </section>

              {/* Sección 5 — Mantenimiento Preventivo */}
              <section className="space-y-4">
                <SectionHeader icon={Wrench} label="Mantenimiento Preventivo" />

                {/* Frecuencia + Fecha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="ml-1">Período de Mantenimiento (meses)</Label>
                    {isEditing ? (
                      <input
                        type="number" min="1" step="1"
                        value={draft.frecuenciaMantenimientoMeses || ''}
                        onChange={e => handleFrecuenciaChange(e.target.value)}
                        placeholder="Ej: 6"
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] text-sm font-semibold transition-all"
                      />
                    ) : (
                      <div className="w-full h-10 px-3 text-sm font-semibold text-gray-900 flex items-center">
                        {draft.frecuenciaMantenimientoMeses
                          ? `${draft.frecuenciaMantenimientoMeses} mes(es)`
                          : <span className="text-gray-400 italic">No especificado</span>}
                      </div>
                    )}
                  </div>
                  <Input
                    label="Fecha Próximo Mantenimiento"
                    type="date"
                    value={draft.fechaProximoMantenimiento || ''}
                    onChange={e => updateDraft({ fechaProximoMantenimiento: e.target.value })}
                    viewMode={!isEditing}
                    icon={Calendar}
                  />
                </div>

                {/* Observación / Notas técnicas */}
                <div className="flex flex-col gap-1.5">
                  <Label>Observación</Label>
                  {isEditing ? (
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md text-sm font-semibold min-h-[80px] resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                      value={draft.notasTecnicas || ''}
                      onChange={e => updateDraft({ notasTecnicas: e.target.value })}
                      placeholder="Observaciones técnicas del equipo..."
                    />
                  ) : (
                    <div className="px-1 py-1">
                      <TextSmall className="text-gray-700 leading-relaxed">
                        {draft.notasTecnicas || <span className="text-gray-400 italic">Sin observaciones</span>}
                      </TextSmall>
                    </div>
                  )}
                </div>

                {/* Protocolo de mantenimiento (solo lectura — derivado de categoría) */}
                <ProtocoloPasos
                  categoriaId={draft.categoriaId}
                  categoryPasos={categoryPasos}
                  pasos={pasos}
                  isEditing={isEditing}
                  onUpdateStep={updateStep}
                  onMoveStep={moveStep}
                  onRemoveStep={removeStep}
                />
              </section>
            </div>
          )}

          {/* ── Tab: Historial de Traslados ── */}
          {activeTab === 'traslados' && (
            <div className="flex-1">
              <HistoryTable
                title="Historial de Traslados"
                icon={ArrowRightLeft}
                headers={['Fecha', 'Origen', 'Destino']}
                rows={(draft.historialTraslados || []).map(h => [h.fecha, h.origen, h.destino])}
                emptyText="Sin traslados registrados"
              />
            </div>
          )}

          {/* ── Tab: Historial de Visitas ── */}
          {activeTab === 'visitas' && (
            <div className="flex-1 space-y-3 overflow-y-auto">

              {/* Contadores de trazabilidad */}
              {visitaHistory.length > 0 && (() => {
                const preventivos = visitaHistory.filter(v => v.visita?.tipo_visita?.codigo === 'PREVENTIVO').length;
                const correctivos = visitaHistory.filter(v => v.visita?.tipo_visita?.codigo === 'CORRECTIVO').length;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <Shield size={18} className="text-green-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Preventivos</p>
                        <p className="text-xl font-black text-green-800">{preventivos}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                      <WrenchIcon size={18} className="text-orange-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Correctivos</p>
                        <p className="text-xl font-black text-orange-800">{correctivos}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Barra de filtros */}
              {visitaHistory.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {/* Buscador por comentario */}
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

                  {/* Filtro por tipo */}
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

                  {/* Limpiar filtros */}
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

              {/* Lista de visitas */}
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
          )}

        </Card>
      </div>
    </div>
    </>
  );
};


export default DeviceForm;
