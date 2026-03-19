import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Search, X, Edit, Eye, CalendarCheck,
  Calendar, Building2, User, AlertCircle, Users, Save, Trash2, CheckCircle2,
} from 'lucide-react';
import { H2, H3, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ModuleHeader from '../../components/ui/ModuleHeader';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import InfoRow from '../../components/ui/InfoRow';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import { TechnicianChipList } from '../../components/ui/TechnicianChip';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../hooks/useCatalog';
import { useSolicitudesVisita } from '../../hooks/useSolicitudesVisita';
import { useVisitas } from '../../hooks/useVisitas';

// ─── Local card-section label header (distinct from the page-level SectionHeader) ──
/**
 * Encabezado de sección dentro de un Card — icono + label pequeño en uppercase.
 * @param {{ icon: React.ElementType, title: string }} props
 */
const CardSection = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 bg-gray-100 rounded-lg">
      <Icon size={14} className="text-gray-600" />
    </div>
    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</Label>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Construye el draft vacío para programar una visita desde una solicitud.
 * @param {import('../../hooks/useSolicitudesVisita').SolicitudVisita|null} solicitud
 * @returns {Object}
 */
const emptyDraft = (solicitud = null) => ({
  solicitudId:    solicitud?.id            || null,
  clienteId:      solicitud?.clienteId     || '',
  sucursalId:     solicitud?.sucursalId    || '',
  tipoVisitaId:   solicitud?.tipoVisitaId  || '',
  tecnicoIds:     [],
  fechaProgramada: '',
  observaciones:  '',
});

/**
 * Formatea un ISO string a formato legible en español.
 * @param {string|null} iso
 * @returns {string}
 */
const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * Página de programación de visitas para coordinadores.
 * Muestra solicitudes PENDIENTE sin visita asignada + todas las visitas activas.
 * Permite programar (crear visita desde solicitud) o editar visitas no iniciadas.
 */
const ProgramacionVisitaPage = () => {
  const { user } = useAuth();

  // ── Remote data ────────────────────────────────────────────────────────────
  const { solicitudes, loading: loadingSol, fetchSolicitudes } = useSolicitudesVisita();
  const { visitas, loading: loadingVis, saving, createVisita, updateVisita, cancelVisita } = useVisitas();

  // Ambas tablas (visita y solicitud_visita) referencian catalogo con tipo ESTADO_VISITA
  const { options: estadoOptions } = useCatalog('ESTADO_VISITA');

  /** @type {[Array<{value:string,label:string}>, Function]} */
  const [tecnicosOptions, setTecnicosOptions] = useState([]);

  // Cargar técnicos activos una sola vez al montar
  useEffect(() => {
    // value = tecnico.id (PK de tabla tecnico, FK requerida por visita_tecnico)
    supabase
      .from('tecnico')
      .select('id,perfil_usuario:usuario_id(nombres,apellidos,email)')
      .eq('activo', true)
      .then(({ data: tecnicos }) => {
        setTecnicosOptions(
          (tecnicos || [])
            .map(t => {
              const p = t.perfil_usuario;
              if (!p) return null;
              const label = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.email || t.id;
              return { value: t.id, label };
            })
            .filter(Boolean)
        );
      });
  }, []);

  // ── UI state ───────────────────────────────────────────────────────────────
  /** @type {['list'|'form'|'view', Function]} */
  const [view, setView]                 = useState('list');
  const [editingVisitaId, setEditingVisitaId] = useState(null); // null = creating
  const [solicitudOrigen, setSolicitudOrigen] = useState(null);
  const [draft, setDraft]               = useState(emptyDraft());
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [viewingItem, setViewingItem]   = useState(null);

  const updateDraft = useCallback(patch => setDraft(prev => ({ ...prev, ...patch })), []);

  // Modal de éxito post-acción
  const [successModal, setSuccessModal] = useState({ open: false, visitaId: null, isEdit: false });
  // Modal de confirmación de cancelar visita
  const [cancelModal, setCancelModal]   = useState({ open: false, item: null });

  // ── Combined list: PENDIENTE solicitudes without visita + all visitas ────────
  const combinedList = useMemo(() => {
    const visitaSolicitudIds = new Set(visitas.map(v => v.solicitudId).filter(Boolean));

    // Solicitudes PENDIENTE que aún no tienen visita programada
    const pendientes = solicitudes
      .filter(s => s.estadoCodigo === 'PENDIENTE' && !visitaSolicitudIds.has(s.id))
      .map(s => ({ ...s, _type: 'solicitud' }));

    const todasVisitas = visitas.map(v => ({ ...v, _type: 'visita' }));

    return [...pendientes, ...todasVisitas];
  }, [solicitudes, visitas]);

  const filtered = useMemo(() => {
    let list = combinedList;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item =>
        item.clienteNombre?.toLowerCase().includes(q) ||
        item.sucursalNombre?.toLowerCase().includes(q)
      );
    }

    if (filterEstado !== 'TODOS') {
      list = list.filter(item => {
        // Para solicitudes usamos estadoCodigo, para visitas también
        const codigo = item.estadoCodigo || '';
        return codigo === filterEstado;
      });
    }

    return list;
  }, [combinedList, searchTerm, filterEstado]);

  const loading = loadingSol || loadingVis;

  // ── Handlers ─────────────────────────────────────────────────────────────
  /**
   * Abre el formulario para programar una visita desde una solicitud PENDIENTE,
   * o para editar una visita existente aún no iniciada.
   * @param {Object} item - Elemento de combinedList (_type: 'solicitud' | 'visita')
   */
  const handleSchedule = useCallback(item => {
    if (item._type === 'solicitud') {
      setSolicitudOrigen(item);
      setDraft(emptyDraft(item));
      setEditingVisitaId(null);
    } else {
      // visita existente editable
      const sol = solicitudes.find(s => s.id === item.solicitudId) || null;
      setSolicitudOrigen(sol);
      setDraft({
        solicitudId:     item.solicitudId,
        clienteId:       item.clienteId,
        sucursalId:      item.sucursalId,
        tipoVisitaId:    item.tipoVisitaId,
        tecnicoIds:      item.tecnicoIds || [],
        fechaProgramada: item.fechaProgramada
          ? new Date(item.fechaProgramada).toISOString().slice(0, 16)
          : '',
        observaciones: item.observaciones || '',
      });
      setEditingVisitaId(item.id);
    }
    setView('form');
  }, [solicitudes]);

  const handleView = useCallback(item => {
    const sol = item._type === 'solicitud'
      ? item
      : solicitudes.find(s => s.id === item.solicitudId) || null;
    setSolicitudOrigen(sol);
    setViewingItem(item);
    setView('view');
  }, [solicitudes]);

  const handleCancel = useCallback(() => {
    setView('list');
    setEditingVisitaId(null);
    setSolicitudOrigen(null);
    setDraft(emptyDraft());
    setViewingItem(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft.fechaProgramada) {
      // Light inline validation — no modal
      return;
    }

    const payload = {
      solicitudId:     draft.solicitudId,
      clienteId:       draft.clienteId,
      sucursalId:      draft.sucursalId,
      tipoVisitaId:    draft.tipoVisitaId,
      fechaProgramada: draft.fechaProgramada,
      observaciones:   draft.observaciones,
      tecnicoIds:      draft.tecnicoIds,
      coordinadorId:   user?.id,
    };

    let savedId = null;
    if (editingVisitaId) {
      const ok = await updateVisita(editingVisitaId, {
        fechaProgramada: draft.fechaProgramada,
        observaciones:   draft.observaciones,
        tecnicoIds:      draft.tecnicoIds,
      });
      if (ok) {
        setView('list');
        setEditingVisitaId(null);
        setSolicitudOrigen(null);
        setDraft(emptyDraft());
        setSuccessModal({ open: true, visitaId: editingVisitaId, isEdit: true });
      }
    } else {
      const id = await createVisita(payload, estadoOptions);
      if (id) {
        savedId = id;
        await fetchSolicitudes();
        setView('list');
        setSolicitudOrigen(null);
        setDraft(emptyDraft());
        setSuccessModal({ open: true, visitaId: id, isEdit: false });
      }
    }
    void savedId;
  }, [
    draft, editingVisitaId, user,
    estadoOptions,
    createVisita, updateVisita, fetchSolicitudes,
  ]);

  const handleConfirmCancel = useCallback(async () => {
    const item = cancelModal.item;
    if (!item) return;
    const ok = await cancelVisita(item.id, estadoOptions);
    if (ok) setCancelModal({ open: false, item: null });
  }, [cancelModal.item, cancelVisita, estadoOptions]);

  // ══════════════════════════════════════════════════════════════════════════
  // FORM VIEW — Programar / Editar
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'form') {
    const isEditing = !!editingVisitaId;
    const tecnicosSeleccionados = draft.tecnicoIds.map(id => ({
      value: id,
      label: tecnicosOptions.find(o => o.value === id)?.label || id,
    }));

    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>{isEditing ? 'Editar Programación' : 'Programar Visita'}</H2>
              <TextSmall className="text-gray-500">
                {solicitudOrigen
                  ? `Origen: solicitud ${solicitudOrigen.id.slice(0, 8)}...`
                  : 'Sin solicitud origen'}
              </TextSmall>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !draft.fechaProgramada}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saving
              ? 'Guardando...'
              : isEditing
                ? 'Guardar Cambios'
                : 'Programar Visita'}
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Formulario principal ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Técnicos */}
            <Card className="p-5 space-y-4">
              <CardSection icon={Users} title="Asignación de Técnicos" />
              <SearchableSelect
                options={tecnicosOptions}
                value={tecnicosSeleccionados}
                onChange={opts => updateDraft({ tecnicoIds: opts.map(o => o.value) })}
                placeholder="Asignar técnicos..."
                isMulti
              />
              {draft.tecnicoIds.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle size={14} className="text-yellow-600 shrink-0" />
                  <TextTiny className="text-yellow-700">
                    Se recomienda asignar al menos un técnico antes de programar.
                  </TextTiny>
                </div>
              )}
            </Card>

            {/* Fecha programada */}
            <Card className="p-5 space-y-4">
              <CardSection icon={Calendar} title="Fecha Programada" />
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                  Fecha y Hora <span className="text-red-500">*</span>
                </Label>
                <input
                  type="datetime-local"
                  value={draft.fechaProgramada}
                  onChange={e => updateDraft({ fechaProgramada: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                />
                {!draft.fechaProgramada && (
                  <TextTiny className="text-red-500 mt-1">Este campo es obligatorio.</TextTiny>
                )}
              </div>
            </Card>

            {/* Observaciones */}
            <Card className="p-5 space-y-2">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Observaciones del Coordinador
              </Label>
              <textarea
                value={draft.observaciones}
                onChange={e => updateDraft({ observaciones: e.target.value })}
                rows={3}
                placeholder="Instrucciones adicionales, acceso al sitio, contacto en sitio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
              />
            </Card>
          </div>

          {/* ── Panel lateral: datos de solicitud origen ─────────────── */}
          <div className="space-y-4">
            {solicitudOrigen && (
              <Card className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-blue-600" />
                  <Label className="text-sm font-bold text-blue-900">Solicitud Origen</Label>
                </div>
                <div className="space-y-2">
                  <InfoRow icon={Building2} label="Cliente"        value={solicitudOrigen.clienteNombre}  />
                  <InfoRow icon={Building2} label="Sucursal"       value={solicitudOrigen.sucursalNombre} />
                  <InfoRow icon={AlertCircle} label="Tipo Visita"  value={solicitudOrigen.tipoVisitaLabel} />
                  <InfoRow icon={Calendar}  label="Fecha sugerida"
                    value={fmtDateTime(solicitudOrigen.fechaSugerida)} />
                </div>
                {solicitudOrigen.motivo && (
                  <div className="p-2 rounded bg-white/60 border border-blue-100">
                    <TextTiny className="text-blue-800 font-semibold mb-0.5">Motivo</TextTiny>
                    <TextTiny className="text-blue-700 italic">{solicitudOrigen.motivo}</TextTiny>
                  </div>
                )}
                <div className="pt-1">
                  <VisitStatusBadge status={solicitudOrigen.estadoCodigo} />
                </div>
              </Card>
            )}

            {/* Resumen de programación */}
            <Card className="p-5 bg-linear-to-br from-gray-50 to-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={15} className="text-gray-600" />
                <Label className="text-sm font-bold text-gray-900">Resumen</Label>
              </div>
              <div className="space-y-2">
                <InfoRow icon={Users} label="Técnicos asignados"
                  value={`${draft.tecnicoIds.length} asignado${draft.tecnicoIds.length !== 1 ? 's' : ''}`} />
                <InfoRow icon={Calendar} label="Fecha programada"
                  value={draft.fechaProgramada ? fmtDateTime(draft.fechaProgramada) : '—'} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / VIEW MODE
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'view' && viewingItem) {
    const item = viewingItem;
    const canEdit = item._type === 'visita'
      ? item.esEditable
      : item.estadoCodigo === 'PENDIENTE';

    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>Detalle · {item.id.slice(0, 8)}...</H2>
              <TextSmall className="text-gray-500">
                {item.clienteNombre} — {item.sucursalNombre}
              </TextSmall>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VisitStatusBadge status={item._type === 'visita' ? item.estadoCodigo : item.estadoCodigo} />
            {canEdit && (
              <Button onClick={() => handleSchedule(item)} className="flex items-center gap-2">
                <Edit size={14} /> Editar
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 space-y-4">
              <CardSection icon={CalendarCheck} title="Datos de la Visita" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={AlertCircle} label="Tipo"
                  value={item.tipoVisitaLabel || item.tipoVisitaCodigo || '—'} />
                <InfoRow icon={Building2}   label="Sucursal"       value={item.sucursalNombre} />
                {item._type === 'visita' && (
                  <>
                    <InfoRow icon={Calendar} label="Fecha Programada" value={fmtDateTime(item.fechaProgramada)} />
                    <InfoRow icon={Calendar} label="Fecha Inicio"     value={fmtDateTime(item.fechaInicio)} />
                    <InfoRow icon={Calendar} label="Fecha Fin"        value={fmtDateTime(item.fechaFin)} />
                    <InfoRow icon={User}     label="Técnicos"
                      value={item.tecnicosNombres?.join(', ') || '—'} />
                  </>
                )}
                {item._type === 'solicitud' && (
                  <InfoRow icon={Calendar} label="Fecha Sugerida" value={fmtDateTime(item.fechaSugerida)} />
                )}
              </div>
              {item.observaciones && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <TextTiny className="text-gray-400 mb-1">Observación</TextTiny>
                  <TextSmall className="text-gray-700">{item.observaciones}</TextSmall>
                </div>
              )}
              {item.motivo && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <TextTiny className="text-gray-400 mb-1">Motivo</TextTiny>
                  <TextSmall className="text-gray-700">{item.motivo}</TextSmall>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            {solicitudOrigen && item._type === 'visita' && (
              <Card className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-blue-600" />
                  <Label className="text-sm font-bold text-blue-900">Solicitud Origen</Label>
                </div>
                <InfoRow icon={Calendar} label="Solicitada el"
                  value={solicitudOrigen.fechaSolicitud
                    ? new Date(solicitudOrigen.fechaSolicitud).toLocaleDateString('es-ES')
                    : '—'} />
                <InfoRow icon={AlertCircle} label="Tipo Solicitado"
                  value={solicitudOrigen.tipoVisitaLabel} />
                <VisitStatusBadge status={solicitudOrigen.estadoCodigo} />
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <ModuleHeader
        icon={CalendarCheck}
        title="Programación de Visitas"
        subtitle="Asigna técnicos y fechas a las solicitudes pendientes"
        filterContent={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cliente o sucursal..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <Select
              options={[
                { value: 'TODOS',       label: 'Todos los estados' },
                { value: 'PENDIENTE',   label: 'Pendiente'         },
                { value: 'PROGRAMADA',  label: 'Programada'        },
                { value: 'EN_PROCESO',  label: 'En proceso'        },
                { value: 'FINALIZADO',  label: 'Finalizado'        },
                { value: 'CANCELADO',   label: 'Cancelado'         },
              ]}
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
            />
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <Table>
          <THead variant="light">
            <tr>
              <Th>Tipo</Th>
              <Th>Cliente / Sucursal</Th>
              <Th>Fecha</Th>
              <Th>Técnicos</Th>
              <Th>Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </THead>
          <TBody>
            {loading ? (
              <Tr>
                <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                  Cargando...
                </td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                  No hay visitas o solicitudes pendientes con los filtros aplicados.
                </td>
              </Tr>
            ) : (
              filtered.map(item => {
                const tipoCodigo = item.tipoVisitaCodigo || '';
                const fechaDisplay = item._type === 'visita'
                  ? item.fechaProgramada
                  : item.fechaSugerida;
                const estadoCodigo = item.estadoCodigo || '';
                const canEdit = item._type === 'solicitud'
                  ? estadoCodigo === 'PENDIENTE'
                  : item.esEditable;

                return (
                  <Tr key={item.id}>
                    <Td>
                      {tipoCodigo ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                          tipoCodigo === 'PREVENTIVO'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.tipoVisitaLabel || tipoCodigo}
                        </span>
                      ) : (
                        <TextSmall className="text-gray-400">—</TextSmall>
                      )}
                    </Td>
                    <Td>
                      <TextSmall className="font-semibold">{item.clienteNombre}</TextSmall>
                      <TextTiny className="text-gray-400">{item.sucursalNombre}</TextTiny>
                    </Td>
                    <Td>
                      {fechaDisplay ? (
                        <div className="whitespace-nowrap">
                          <TextSmall>
                            {new Date(fechaDisplay).toLocaleDateString('es-ES')}
                          </TextSmall>
                          <TextTiny className="text-gray-400">
                            {new Date(fechaDisplay).toLocaleTimeString('es-ES', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </TextTiny>
                        </div>
                      ) : (
                        <TextSmall className="text-gray-400 italic whitespace-nowrap">
                          Sin programar
                        </TextSmall>
                      )}
                    </Td>
                    <Td>
                      {item._type === 'visita' ? (
                        <TechnicianChipList names={item.tecnicosNombres || []} />
                      ) : (
                        <TextTiny className="text-gray-400 italic">—</TextTiny>
                      )}
                    </Td>
                    <Td>
                      <VisitStatusBadge status={estadoCodigo} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(item)}
                          className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} className="text-blue-600" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleSchedule(item)}
                            className="p-2 hover:bg-green-50 rounded-md transition-colors"
                            title={item._type === 'solicitud' ? 'Programar' : 'Editar'}
                          >
                            <Edit size={15} className="text-green-600" />
                          </button>
                        )}
                        {item._type === 'visita' && item.esEditable && (
                          <button
                            onClick={() => setCancelModal({ open: true, item })}
                            className="p-2 hover:bg-red-50 rounded-md transition-colors"
                            title="Cancelar visita"
                          >
                            <Trash2 size={15} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </TBody>
        </Table>
      </Card>

      {/* ── Modal éxito post-acción ───────────────────────────────────────── */}
      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} />
              <H3 className="normal-case text-gray-900">
                {successModal.isEdit ? 'Visita actualizada' : 'Visita programada'}
              </H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              {successModal.isEdit
                ? 'Los cambios en la programación fueron guardados correctamente. ¿Qué deseas hacer ahora?'
                : 'La visita fue programada correctamente. ¿Qué deseas hacer ahora?'}
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  const id = successModal.visitaId;
                  setSuccessModal({ open: false, visitaId: null, isEdit: false });
                  if (id) {
                    const found = visitas.find(v => v.id === id);
                    if (found) handleView({ ...found, _type: 'visita' });
                  }
                }}
                variant="success"
                className="w-full"
              >
                Ver visita programada
              </Button>
              <Button
                onClick={() => setSuccessModal({ open: false, visitaId: null, isEdit: false })}
                variant="outline"
                className="w-full"
              >
                Volver a Programación de Visitas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmación cancelar ───────────────────────────────────── */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash2 size={32} />
              <H3 className="normal-case text-gray-900">Cancelar visita</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas cancelar esta visita? Esta acción no se puede deshacer.
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirmCancel}
                disabled={saving}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {saving ? 'Cancelando...' : 'Sí, cancelar visita'}
              </Button>
              <Button
                onClick={() => setCancelModal({ open: false, item: null })}
                variant="outline"
                className="w-full"
              >
                Mantener visita
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramacionVisitaPage;
