/**
 * Formulario de dispositivo con 3 tabs:
 *   - Detalles: clasificación, ubicación, estado, ciclo de vida, mantenimiento
 *   - Traslados: historial de traslados entre sucursales + modal de registro
 *   - Visitas: historial de intervenciones con filtros y evidencias
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, MapPin, Hash, Monitor, User, Activity,
  ArrowRightLeft, Calendar, Plus, Loader2,
  Tag, Wrench, Navigation2, Layers, Barcode,
  ShoppingCart, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Tabs from '../../components/ui/Tabs';
import { Label, TextSmall, TextTiny } from '../../components/ui/Typography';
import Card from '../../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import CategoriaForm from './CategoriaForm';
import { useActivoInactivo } from '../../hooks/useCatalog';
import { useConfigurationContext } from '../../context/ConfigurationContext';
import { useAuth } from '../../context/AuthContext';
import { isManagementRole } from '../../utils/constants';
import { getTrasladosByDevice } from '../../api/deviceApi';

import { SectionHeader, CompactSummaryItem, SummaryRow } from './DeviceFormHelpers';
import ProtocoloPasos from './ProtocoloPasos';
import TrasladoModal from './TrasladoModal';
import DeviceVisitasTab from './DeviceVisitasTab';
import { useDeviceVisitHistory } from './useDeviceVisitHistory';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FORM_TABS = [
  { key: 'details',   label: 'Detalles del Dispositivo', shortLabel: 'Detalles'  },
  { key: 'traslados', label: 'Historial de Traslados',   shortLabel: 'Traslados' },
  { key: 'visitas',   label: 'Historial de Visitas',     shortLabel: 'Visitas'   },
];

const calcProximaFecha = (meses) => {
  if (!meses || isNaN(Number(meses))) return '';
  const d = new Date();
  d.setMonth(d.getMonth() + Number(meses));
  return d.toISOString().split('T')[0];
};

// ─── Componente principal ─────────────────────────────────────────────────────

const DeviceForm = ({
  draft, updateDraft, errors = {}, showErrors = false, isEditing = false,
  onSave, isSaving = false, clients = [],
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { activoId, inactivoId } = useActivoInactivo();
  const { visitas: visitaHistory, loading: loadingHistory } = useDeviceVisitHistory(draft.id);
  const { user } = useAuth();
  const canManageTraslados = isManagementRole(user?.role);

  // ─── Traslados ────────────────────────────────────────────────────────────
  const [traslados, setTraslados] = useState([]);
  const [loadingTraslados, setLoadingTraslados] = useState(false);
  const [showTrasladoModal, setShowTrasladoModal] = useState(false);

  const sucursalesDestino = useMemo(() => {
    if (draft.esDeInmotika) {
      return (clients || []).flatMap(c =>
        (c.sucursales || []).map(s => ({
          value: s.id,
          label: `${s.nombre} — ${c.nombre || c.razon_social || ''}`,
        }))
      );
    }
    const activeClient = (clients || []).find(c => String(c.id) === String(draft.clientId));
    return (activeClient?.sucursales || []).map(s => ({ value: s.id, label: s.nombre }));
  }, [draft.esDeInmotika, draft.clientId, clients]);

  const sucursalOrigenNombre = useMemo(() => {
    for (const c of (clients || [])) {
      const s = (c.sucursales || []).find(s => String(s.id) === String(draft.branchId));
      if (s) return s.nombre;
    }
    return '—';
  }, [draft.branchId, clients]);

  const fetchTraslados = useCallback(async () => {
    if (!draft.id || String(draft.id).startsWith('new-')) return;
    setLoadingTraslados(true);
    try {
      const data = await getTrasladosByDevice(draft.id);
      setTraslados(data);
    } catch (err) {
      console.error('[DeviceForm] fetchTraslados:', err);
    } finally {
      setLoadingTraslados(false);
    }
  }, [draft.id]);

  useEffect(() => {
    if (activeTab === 'traslados') fetchTraslados();
  }, [activeTab, fetchTraslados]);

  // ─── Catálogos ────────────────────────────────────────────────────────────
  const [categorias, setCategorias]         = useState([]);
  const [loadingCats, setLoadingCats]       = useState(true);
  const [proveedores, setProveedores]       = useState([]);
  const [loadingProvs, setLoadingProvs]     = useState(true);
  const [marcas, setMarcas]                 = useState([]);
  const [loadingMarcas, setLoadingMarcas]   = useState(false);
  const [gestiones, setGestiones]           = useState([]);
  const [loadingGestiones, setLoadingGest]  = useState(true);
  const [categoryPasos, setCategoryPasos]   = useState([]);

  const loadCategorias = useCallback(async () => {
    setLoadingCats(true);
    try {
      const { data, error } = await supabase
        .from('categoria_dispositivo')
        .select('id, nombre')
        .or('activo.eq.true,activo.is.null')
        .order('nombre');
      if (error) throw error;
      setCategorias((data || []).map(c => ({ value: c.id, label: c.nombre })));
    } catch (err) {
      console.error('[DeviceForm] loadCategorias:', err);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const loadProveedores = useCallback(async () => {
    setLoadingProvs(true);
    try {
      const { data, error } = await supabase
        .from('proveedor')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      setProveedores((data || []).map(p => ({ value: p.id, label: p.nombre })));
    } catch (err) {
      console.error('[DeviceForm] loadProveedores:', err);
    } finally {
      setLoadingProvs(false);
    }
  }, []);

  const loadMarcas = useCallback(async (proveedorId) => {
    if (!proveedorId) { setMarcas([]); return; }
    setLoadingMarcas(true);
    try {
      const { data, error } = await supabase
        .from('marca')
        .select('id, nombre')
        .eq('proveedor_id', proveedorId)
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      setMarcas((data || []).map(m => ({ value: m.id, label: m.nombre })));
    } catch (err) {
      console.error('[DeviceForm] loadMarcas:', err);
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
      console.error('[DeviceForm] loadGestiones:', err);
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
    if (draft.proveedorId) loadMarcas(draft.proveedorId);
    else setMarcas([]);
  }, [draft.proveedorId, loadMarcas]);

  useEffect(() => {
    if (!draft.categoriaId) { setCategoryPasos([]); return; }
    const loadProtocol = async () => {
      try {
        const { data, error } = await supabase
          .from('paso_protocolo')
          .select('*, actividades:actividad_protocolo(*)')
          .eq('categoria_id', draft.categoriaId)
          .or('activo.eq.true,activo.is.null')
          .order('orden');
        if (error) throw error;
        setCategoryPasos((data || []).map(p => ({
          ...p,
          actividades: (p.actividades || [])
            .filter(a => a.activo !== false)
            .sort((a, b) => a.orden - b.orden),
        })));
      } catch (err) {
        console.error('[DeviceForm] loadProtocol:', err);
      }
    };
    loadProtocol();
  }, [draft.categoriaId]);

  useEffect(() => {
    if (!draft.estadoId && activoId) updateDraft({ estadoId: activoId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activoId]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleFrecuenciaChange = (val) => {
    const n = val === '' ? '' : parseInt(val, 10);
    updateDraft({
      frecuenciaMantenimientoMeses: isNaN(n) ? '' : n,
      fechaProximoMantenimiento: calcProximaFecha(n),
    });
  };

  const activeClient     = (clients || []).find(c => String(c.id) === String(draft.clientId));
  const activeBranchOpts = (activeClient?.sucursales || []).map(b => ({ value: b.id, label: b.nombre }));
  const activeClientName = activeClient?.nombre || '—';
  const activeBranchName = activeClient?.sucursales?.find(b => String(b.id) === String(draft.branchId))?.nombre || '—';

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

  const { pushRoute, route } = useConfigurationContext();
  const currentKey = `dispositivo:${route.deviceId}`;
  const isActivo   = !!activoId && draft.estadoId === activoId;

  // ─── Render ───────────────────────────────────────────────────────────────
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
                    <SummaryRow
                      icon={Monitor}
                      label="Marca / Modelo"
                      value={`${draft.marca?.nombre || draft.marca}${draft.modelo ? ` — ${draft.modelo}` : ''}`}
                    />
                  </div>
                )}
                <CompactSummaryItem icon={Hash}        label="Serie"          value={draft.serial} />
                <CompactSummaryItem icon={Hash}        label="ID Inmotika"    value={draft.idInmotika} />
                <CompactSummaryItem icon={Barcode}     label="Código"         value={draft.codigoUnico} />
                <CompactSummaryItem icon={Navigation2} label="MAC"            value={draft.imac} />
                <CompactSummaryItem icon={User}        label="Dueño"          value={draft.esDeInmotika ? 'Inmotika' : 'Cliente'} />
                <CompactSummaryItem icon={Activity}    label="Estado Gestión" value={gestiones.find(g => g.value === draft.estadoGestionId)?.label} />

                {activeClientName !== '—' && (
                  <div className="col-span-2 pt-3 mt-1 border-t border-gray-100">
                    <SummaryRow
                      icon={Building2}
                      label="Cliente / Ubicación"
                      value={activeClientName}
                      sub={activeBranchName !== '—' ? activeBranchName : undefined}
                    />
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

        {/* ── Columna derecha: Tabs ── */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full flex flex-col gap-4">
            <div className="border-b border-gray-200 pb-2 shrink-0">
              <Tabs tabs={FORM_TABS} active={activeTab} onChange={setActiveTab} />
            </div>

            {/* ── Tab: Detalles ── */}
            {activeTab === 'details' && (
              <div className="space-y-8 overflow-y-auto flex-1">

                {/* Clasificación Técnica */}
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
                    <SearchableSelect
                      label="Categoría" icon={Layers}
                      options={categorias} value={draft.categoriaId || ''}
                      isLoading={loadingCats}
                      onChange={opt => updateDraft({ categoriaId: opt?.value || '' })}
                      isDisabled={!isEditing} placeholder="Buscar categoría..." viewMode={!isEditing}
                      action={isEditing && (
                        <button type="button"
                          onClick={() => pushRoute({ type: 'categoria', mode: 'create', originKey: currentKey, originField: 'categoriaId' })}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nueva categoría">
                          <Plus size={12} />
                        </button>
                      )}
                    />
                    <SearchableSelect
                      label="Proveedor" icon={Building2}
                      options={proveedores} value={draft.proveedorId || ''}
                      isLoading={loadingProvs}
                      onChange={opt => updateDraft({ proveedorId: opt?.value || '', marcaId: '' })}
                      isDisabled={!isEditing} placeholder="Buscar proveedor..." viewMode={!isEditing}
                      action={isEditing && (
                        <button type="button"
                          onClick={() => pushRoute({ type: 'proveedor', mode: 'create', originKey: currentKey, originField: 'proveedorId' })}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nuevo proveedor">
                          <Plus size={12} />
                        </button>
                      )}
                    />
                    <SearchableSelect
                      label="Marca" icon={Tag}
                      options={marcas} value={draft.marcaId || ''}
                      isLoading={loadingMarcas}
                      onChange={opt => updateDraft({ marcaId: opt?.value || '' })}
                      isDisabled={!isEditing || !draft.proveedorId}
                      placeholder={draft.proveedorId ? 'Buscar marca...' : 'Primero seleccione proveedor'}
                      viewMode={!isEditing}
                      action={isEditing && draft.proveedorId && (
                        <button type="button"
                          onClick={() => pushRoute({ type: 'marca', mode: 'create', originKey: currentKey, originField: 'marcaId', proveedorId: draft.proveedorId })}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nueva marca">
                          <Plus size={12} />
                        </button>
                      )}
                    />
                    <Input label="Número de Serie" value={draft.serial || ''}
                      onChange={e => updateDraft({ serial: e.target.value })}
                      error={showErrors ? errors.serial : null} viewMode={!isEditing} icon={Hash} required />
                    <Input label="Línea" value={draft.linea || ''}
                      onChange={e => updateDraft({ linea: e.target.value })}
                      viewMode={!isEditing} placeholder="Ej: Industrial / Residencial" icon={Activity} />
                    <Input label="Modelo" value={draft.modelo || ''}
                      onChange={e => updateDraft({ modelo: e.target.value })}
                      viewMode={!isEditing} icon={Layers} />
                    <Input label="ID Inmotika" value={draft.idInmotika || ''}
                      onChange={e => updateDraft({ idInmotika: e.target.value })}
                      viewMode={!isEditing} icon={Hash} placeholder="ID interno Inmotika" />
                    <Input label="Código Único" value={draft.codigoUnico || ''}
                      onChange={e => updateDraft({ codigoUnico: e.target.value })}
                      viewMode={!isEditing} icon={Barcode} placeholder="Identificador único adicional" />
                    <Input label="IMAC / MAC" value={draft.imac || ''}
                      onChange={e => updateDraft({ imac: e.target.value })}
                      viewMode={!isEditing} icon={Navigation2} placeholder="Dirección física del equipo" />
                  </div>
                </section>

                {/* Gestión de Propiedad */}
                <section className="space-y-4">
                  <SectionHeader icon={User} label="Gestión de Propiedad" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Switch label="¿Quién es el dueño?" checked={draft.esDeInmotika}
                      onChange={val => updateDraft({ esDeInmotika: val })}
                      viewMode={!isEditing} checkedLabel="Inmotika" uncheckedLabel="Cliente" />
                    <SearchableSelect label="Estado de Propiedad"
                      options={gestiones} value={draft.estadoGestionId || ''}
                      isLoading={loadingGestiones}
                      onChange={opt => updateDraft({ estadoGestionId: opt?.value || '' })}
                      isDisabled={!isEditing} placeholder="Seleccionar estado..." viewMode={!isEditing} icon={Activity} />
                  </div>
                </section>

                {/* Ubicación Sede */}
                <section className="space-y-4">
                  <SectionHeader icon={MapPin} label="Ubicación Sede" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableSelect label="Cliente"
                      options={(clients || []).map(c => ({ value: c.id, label: c.nombre }))}
                      value={draft.clientId}
                      onChange={opt => updateDraft({ clientId: opt?.value || '', branchId: '' })}
                      isDisabled={!isEditing} viewMode={!isEditing} icon={Building2}
                      error={showErrors ? errors.clientId : null} placeholder="Buscar cliente..." />
                    <SearchableSelect label="Sucursal"
                      options={activeBranchOpts} value={draft.branchId}
                      onChange={opt => updateDraft({ branchId: opt?.value || '' })}
                      isDisabled={!isEditing || !draft.clientId} viewMode={!isEditing}
                      placeholder={draft.clientId ? 'Buscar sucursal...' : 'Primero seleccione un cliente'}
                      icon={MapPin} error={showErrors ? errors.branchId : null} />
                  </div>
                </section>

                {/* Estado del Equipo */}
                <section className="space-y-4">
                  <SectionHeader icon={User} label="Estado del Equipo" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Switch label="Estado"
                      checked={!!activoId && draft.estadoId === activoId}
                      onChange={checked => updateDraft({ estadoId: checked ? activoId : inactivoId })}
                      viewMode={!isEditing} checkedLabel="Activo" uncheckedLabel="Inactivo" />
                  </div>
                </section>

                {/* Ciclo de Vida */}
                <section className="space-y-4">
                  <SectionHeader icon={ShoppingCart} label="Ciclo de Vida del Equipo" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Fecha de Compra" type="date" value={draft.fechaCompra || ''}
                      onChange={e => updateDraft({ fechaCompra: e.target.value })}
                      viewMode={!isEditing} icon={ShoppingCart} />
                    <Input label="Fecha de Caducidad / Garantía" type="date" value={draft.fechaCaducidad || ''}
                      onChange={e => updateDraft({ fechaCaducidad: e.target.value })}
                      viewMode={!isEditing} icon={AlertTriangle} />
                  </div>
                </section>

                {/* Mantenimiento Preventivo */}
                <section className="space-y-4">
                  <SectionHeader icon={Wrench} label="Mantenimiento Preventivo" />
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
                    <Input label="Fecha Próximo Mantenimiento" type="date"
                      value={draft.fechaProximoMantenimiento || ''}
                      onChange={e => updateDraft({ fechaProximoMantenimiento: e.target.value })}
                      viewMode={!isEditing} icon={Calendar} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Observación</Label>
                    {isEditing ? (
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-md text-sm font-semibold min-h-20 resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
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

            {/* ── Tab: Traslados ── */}
            {activeTab === 'traslados' && (
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={15} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Historial de Traslados</span>
                  </div>
                  {canManageTraslados && draft.id && !String(draft.id).startsWith('new-') && (
                    <Button onClick={() => setShowTrasladoModal(true)} className="flex items-center gap-1.5 text-xs">
                      <Plus size={13} /> Nuevo Traslado
                    </Button>
                  )}
                </div>

                {/* Desktop */}
                <div className="hidden md:block">
                  <Card className="p-0 border border-gray-200 overflow-hidden shadow-sm">
                    <Table>
                      <THead variant="light">
                        <tr>
                          <Th>Fecha</Th><Th>Origen</Th><Th>Destino</Th><Th>Motivo</Th><Th>Registrado por</Th>
                        </tr>
                      </THead>
                      <TBody>
                        {loadingTraslados ? (
                          <tr><td colSpan={5} className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></td></tr>
                        ) : traslados.length === 0 ? (
                          <tr><td colSpan={5} className="py-10 text-center">
                            <ArrowRightLeft size={28} className="mx-auto mb-2 text-gray-200" />
                            <p className="text-xs italic text-gray-400">Sin traslados registrados</p>
                          </td></tr>
                        ) : traslados.map(t => {
                          const fecha = t.fecha_traslado
                            ? new Date(t.fecha_traslado).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
                            : '—';
                          const origen  = t.sucursal_origen  ? `${t.sucursal_origen.nombre}${t.sucursal_origen.cliente   ? ` — ${t.sucursal_origen.cliente.razon_social}`  : ''}` : '—';
                          const destino = t.sucursal_destino ? `${t.sucursal_destino.nombre}${t.sucursal_destino.cliente ? ` — ${t.sucursal_destino.cliente.razon_social}` : ''}` : '—';
                          const por = t.usuario ? `${t.usuario.nombres || ''} ${t.usuario.apellidos || ''}`.trim() : '—';
                          return (
                            <Tr key={t.id}>
                              <Td><TextSmall className="whitespace-nowrap">{fecha}</TextSmall></Td>
                              <Td><TextSmall>{origen}</TextSmall></Td>
                              <Td><TextSmall>{destino}</TextSmall></Td>
                              <Td><TextSmall className="max-w-xs truncate">{t.motivo || '—'}</TextSmall></Td>
                              <Td><TextSmall>{por}</TextSmall></Td>
                            </Tr>
                          );
                        })}
                      </TBody>
                    </Table>
                  </Card>
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-3 md:hidden">
                  {loadingTraslados ? (
                    <div className="py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-gray-300" /></div>
                  ) : traslados.length === 0 ? (
                    <div className="py-10 text-center">
                      <ArrowRightLeft size={28} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-xs italic text-gray-400">Sin traslados registrados</p>
                    </div>
                  ) : traslados.map(t => {
                    const fecha = t.fecha_traslado
                      ? new Date(t.fecha_traslado).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
                      : '—';
                    const origen  = t.sucursal_origen  ? `${t.sucursal_origen.nombre}${t.sucursal_origen.cliente   ? ` — ${t.sucursal_origen.cliente.razon_social}`  : ''}` : '—';
                    const destino = t.sucursal_destino ? `${t.sucursal_destino.nombre}${t.sucursal_destino.cliente ? ` — ${t.sucursal_destino.cliente.razon_social}` : ''}` : '—';
                    const por = t.usuario ? `${t.usuario.nombres || ''} ${t.usuario.apellidos || ''}`.trim() : '—';
                    return (
                      <Card key={t.id} className="p-4 border border-gray-200 shadow-sm rounded-2xl">
                        <div className="divide-y divide-gray-50">
                          <div className="flex items-start gap-3 pb-2.5">
                            <div className="p-2 rounded-lg bg-[#D32F2F]/10 shrink-0">
                              <ArrowRightLeft size={14} className="text-[#D32F2F]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <TextSmall className="font-bold text-gray-900 whitespace-nowrap">{fecha}</TextSmall>
                              <TextTiny className="text-gray-400">{por}</TextTiny>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 py-2.5">
                            <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-16 font-bold uppercase tracking-wide leading-tight">Origen</TextTiny>
                            <TextTiny className="text-gray-700 font-semibold flex-1">{origen}</TextTiny>
                          </div>
                          <div className="flex items-start gap-3 py-2.5">
                            <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-16 font-bold uppercase tracking-wide leading-tight">Destino</TextTiny>
                            <TextTiny className="text-gray-700 font-semibold flex-1">{destino}</TextTiny>
                          </div>
                          <div className="flex items-start gap-3 pt-2.5">
                            <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-16 font-bold uppercase tracking-wide leading-tight">Motivo</TextTiny>
                            <TextTiny className="text-gray-600 flex-1">{t.motivo || '—'}</TextTiny>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Tab: Visitas ── */}
            {activeTab === 'visitas' && (
              <DeviceVisitasTab visitaHistory={visitaHistory} loadingHistory={loadingHistory} />
            )}

          </Card>
        </div>
      </div>

      {/* Modal de traslado */}
      {showTrasladoModal && (
        <TrasladoModal
          deviceId={draft.id}
          branchId={draft.branchId}
          sucursalOrigenNombre={sucursalOrigenNombre}
          sucursalesDestino={sucursalesDestino}
          userId={user?.id}
          onClose={() => setShowTrasladoModal(false)}
          onSuccess={(nuevaSucursalId) => {
            setShowTrasladoModal(false);
            if (nuevaSucursalId) updateDraft({ branchId: nuevaSucursalId });
            fetchTraslados();
          }}
        />
      )}
    </>
  );
};

export default DeviceForm;
