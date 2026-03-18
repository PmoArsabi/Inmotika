import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Hash, Monitor, User, Activity,
  ClipboardList, CheckCircle2, ChevronUp, ChevronDown,
  Trash2, ArrowRightLeft, Calendar, Plus, Loader2, QrCode,
  FileText, Tag, Wrench, Navigation2, IdCard, Layers, Barcode,
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

const SectionHeader = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
    <Icon size={15} className="text-gray-500" />
    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
  </div>
);

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

const HistoryTable = ({ title, icon: Icon, headers, rows, emptyText }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-gray-400" />
      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{title}</span>
    </div>
    <Card className="p-0 border border-gray-200 overflow-hidden shadow-sm">
      <Table>
        <THead variant="dark">
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
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const DeviceForm = ({
  draft, updateDraft, errors = {}, showErrors = false, isEditing = false,
  onSave, isSaving = false, clients = [],
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { activoId, inactivoId } = useActivoInactivo();

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



  // ─── Vista principal ──────────────────────────────────────────────────────
  const isActivo = !!activoId && draft.estadoId === activoId;

  return (
    <>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

      {/* ── Columna izquierda: Resumen ── */}
      <div className="lg:col-span-1">
        <Card className="p-6 space-y-6 h-full">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-linear-to-br from-[#D32F2F] to-[#8B0000] rounded-full flex items-center justify-center shadow-lg">
              <Monitor size={32} className="text-white" />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">
                {draft.serial || 'Nuevo Dispositivo'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {categorias.find(c => c.value === draft.categoriaId)?.label || 'Sin categoría'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200">
            {draft.marca && (
              <SummaryRow icon={Monitor} label="Marca / Modelo" value={`${draft.marca?.nombre || draft.marca}${draft.modelo ? ` — ${draft.modelo}` : ''}`} />
            )}
            {draft.serial && (
              <SummaryRow icon={Hash} label="Serie" value={draft.serial} />
            )}
            {draft.idInmotika && (
              <SummaryRow icon={Hash} label="ID Inmotika" value={draft.idInmotika} />
            )}
            {draft.codigoUnico && (
              <SummaryRow icon={Barcode} label="Código Único" value={draft.codigoUnico} />
            )}
            {draft.imac && (
              <SummaryRow icon={Navigation2} label="IMAC / MAC" value={draft.imac} />
            )}
            <SummaryRow 
              icon={User} 
              label="Dueño" 
              value={draft.esDeInmotika ? 'Inmotika' : 'Cliente'} 
            />
            {draft.estadoGestionId && (
              <SummaryRow 
                icon={Activity} 
                label="Estado Gestión" 
                value={gestiones.find(g => g.value === draft.estadoGestionId)?.label || '—'} 
              />
            )}
            {activeClientName !== '—' && (
              <SummaryRow icon={Building2} label="Cliente" value={activeClientName} sub={activeBranchName !== '—' ? activeBranchName : undefined} />
            )}
          </div>

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

              {/* Sección 4 — Mantenimiento Preventivo */}
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
                    <Card className="p-4 bg-gray-50/50">
                      <TextSmall className="text-gray-600">{draft.notasTecnicas || 'Sin observaciones.'}</TextSmall>
                    </Card>
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
            <div className="flex-1">
              <HistoryTable
                title="Historial de Visitas"
                icon={Calendar}
                headers={['Fecha', 'Tipo de Mantenimiento', 'Estado']}
                rows={(draft.historialVisitas || []).map(h => [h.fecha, h.tipo || h.tecnico, h.estado || h.observaciones])}
                emptyText="Sin visitas registradas"
              />
            </div>
          )}

        </Card>
      </div>
    </div>
    </>
  );
};


export default DeviceForm;
