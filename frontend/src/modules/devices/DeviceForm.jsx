import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Hash, Monitor, User, Activity,
  ClipboardList, CheckCircle2, ChevronUp, ChevronDown,
  Trash2, ArrowRightLeft, Calendar, Plus, Loader2,
  FileText, Tag, Wrench, Navigation2, IdCard, Layers,
} from 'lucide-react';
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
import { INITIAL_DATA } from '../../utils/mockData';
import { useActivoInactivo } from '../../hooks/useCatalog';

// ─── Constantes ───────────────────────────────────────────────────────────────
const FORM_TABS = [
  { key: 'details',   label: 'Detalles del Dispositivo' },
  { key: 'traslados', label: 'Historial de Traslados'   },
  { key: 'visitas',   label: 'Historial de Visitas'     },
];

const PROVEEDOR_OPTIONS = [
  { value: '',       label: 'Seleccionar proveedor...' },
  { value: 'DORLET', label: 'Dorlet'  },
  { value: 'MORFO',  label: 'Morfo'   },
  { value: 'OTRO',   label: 'Otro'    },
];


const calcProximaFecha = (meses) => {
  if (!meses || isNaN(Number(meses))) return '';
  const d = new Date();
  d.setMonth(d.getMonth() + Number(meses));
  return d.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const DeviceForm = ({
  draft, updateDraft, errors = {}, showErrors = false, isEditing = false,
  onSave, isSaving = false, clients = [], devices = [],
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { activoId, inactivoId } = useActivoInactivo();

  // ─── Categorías ───────────────────────────────────────────────────────────
  const [categorias, setCategorias]       = useState([]);
  const [loadingCats, setLoadingCats]     = useState(true);
  const [categoryPasos, setCategoryPasos] = useState([]);

  const loadCategorias = useCallback(() => {
    setLoadingCats(true);
    setTimeout(() => {
      const catsMock = INITIAL_DATA.categorias || [];
      setCategorias(catsMock.map(c => ({ value: c.id, label: c.nombre, raw: c })));
      setLoadingCats(false);
    }, 200);
  }, []);

  useEffect(() => { loadCategorias(); }, [loadCategorias]);

  useEffect(() => {
    if (!draft.categoriaId) { setCategoryPasos([]); return; }
    
    // Extrayendo plantilla de pasos mockeados buscando un dispositivo de esa categoría
    const targetCat = categorias.find(c => c.value === draft.categoriaId);
    if (!targetCat) return;

    // Buscar si hay algun dispositivo asociado a esta categoría (por nombre o id)
    const mockDevWithSteps = INITIAL_DATA.dispositivos.find(d => 
      d.categoria === targetCat.label || d.categoriaId === draft.categoriaId
    );

    if (mockDevWithSteps && mockDevWithSteps.pasos) {
      setCategoryPasos(mockDevWithSteps.pasos);
    } else {
      setCategoryPasos([]); // Simular que no tiene protocolo mockeado
    }
  }, [draft.categoriaId, categorias]);

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

  // ─── Nueva Categoría (delegado a CategoriaForm) ──────────────────────────
  const [showNewCat, setShowNewCat] = useState(false);

  if (showNewCat) {
    return (
      <CategoriaForm
        mode="create"
        onSave={async (saved) => {
          await loadCategorias();
          updateDraft({ categoriaId: saved.id });
          setShowNewCat(false);
        }}
        onCancel={() => setShowNewCat(false)}
      />
    );
  }

  // ─── Vista principal ──────────────────────────────────────────────────────
  const isActivo = !!activoId && draft.estadoId === activoId;

  return (
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
              {draft.descripcion && (
                <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">{draft.descripcion}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200">
            {draft.marca && (
              <SummaryRow icon={Monitor} label="Marca / Modelo" value={`${draft.marca}${draft.modelo ? ` — ${draft.modelo}` : ''}`} />
            )}
            {draft.serial && (
              <SummaryRow icon={Hash} label="Serie" value={draft.serial} />
            )}
            {draft.imac && (
              <SummaryRow icon={Navigation2} label="IMAC" value={draft.imac} />
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

                {/* Descripción (fila completa) */}
                <div className="flex flex-col gap-1.5">
                  <Label className="ml-1">Descripción del Equipo</Label>
                  {isEditing ? (
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md text-sm font-semibold min-h-[40px] resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                      rows={1}
                      value={draft.descripcion || ''}
                      onChange={e => updateDraft({ descripcion: e.target.value })}
                      placeholder="Describe el equipo brevemente..."
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 min-h-[40px]">
                      {draft.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Categoría con botón crear */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center justify-between h-[15px]">
                      <Label className="ml-1">Categoría</Label>
                      {isEditing && (
                        <button type="button" onClick={() => setShowNewCat(true)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#D32F2F] transition-colors" title="Crear nueva categoría">
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                    {loadingCats ? (
                      <div className="h-10 flex items-center px-3 border border-gray-200 rounded-md text-sm text-gray-400">
                        <Loader2 size={14} className="animate-spin mr-2" /> Cargando...
                      </div>
                    ) : (
                      <SearchableSelect
                        options={categorias}
                        value={draft.categoriaId || ''}
                        onChange={opt => updateDraft({ categoriaId: opt?.value || '' })}
                        isDisabled={!isEditing}
                        placeholder="Seleccionar categoría..."
                        viewMode={!isEditing}
                      />
                    )}
                  </div>

                  <Select
                    label="Proveedor"
                    value={draft.proveedor || ''}
                    onChange={e => updateDraft({ proveedor: e.target.value })}
                    options={PROVEEDOR_OPTIONS}
                    viewMode={!isEditing}
                    icon={FileText}
                  />
                  <Input
                    label="Marca"
                    value={draft.marca || ''}
                    onChange={e => updateDraft({ marca: e.target.value })}
                    viewMode={!isEditing}
                    icon={Tag}
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
                  />
                  <Input
                    label="Modelo"
                    value={draft.modelo || ''}
                    onChange={e => updateDraft({ modelo: e.target.value })}
                    viewMode={!isEditing}
                    icon={Layers}
                  />
                  <Input
                    label="IMAC"
                    value={draft.imac || ''}
                    onChange={e => updateDraft({ imac: e.target.value })}
                    viewMode={!isEditing}
                    icon={Navigation2}
                    placeholder="00:1A:2B:3C:4D:5E"
                  />
                  <Input
                    label="Identificación del Cliente"
                    value={draft.identificacionCliente || ''}
                    onChange={e => updateDraft({ identificacionCliente: e.target.value })}
                    viewMode={!isEditing}
                    icon={IdCard}
                    placeholder="Código interno del cliente"
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
                    required
                  />
                  <SearchableSelect
                    label="Sucursal"
                    options={activeBranchOpts}
                    value={draft.branchId}
                    onChange={opt => updateDraft({ branchId: opt?.value || '' })}
                    isDisabled={!isEditing || !draft.clientId}
                    placeholder={draft.clientId ? 'Seleccionar sucursal...' : 'Primero seleccione un cliente'}
                    icon={MapPin}
                    error={showErrors ? errors.branchId : null}
                    required
                  />
                </div>
              </section>

              {/* Sección 3 — Propiedad y Estado */}
              <section className="space-y-4">
                <SectionHeader icon={User} label="Propiedad y Estado" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Switch
                    label="Dispositivo de Inmotika"
                    checked={!!draft.esDeInmotika}
                    onChange={checked => updateDraft({ esDeInmotika: checked })}
                    viewMode={!isEditing}
                    checkedLabel="Sí"
                    uncheckedLabel="No"
                  />
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
  );
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

export default DeviceForm;
