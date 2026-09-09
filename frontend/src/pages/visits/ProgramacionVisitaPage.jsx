import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Eye, Edit, CalendarCheck,
  Trash2, CheckCircle2,
} from 'lucide-react';
import { H3, TextSmall, TextTiny } from '../../components/ui/Typography';
import Button from '../../components/ui/Button';
import VisitaMobileCard from '../../components/visits/VisitaMobileCard';
import { ProgramacionForm, ProgramacionDetalle } from '../../modules/visits/ProgramacionForm';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import { TechnicianChipList } from '../../components/ui/TechnicianChip';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../context/AuthContext';
import { useMasterData } from '../../context/MasterDataContext';
import { useCatalog } from '../../hooks/useCatalog';
import { useSolicitudesVisita } from '../../hooks/useSolicitudesVisita';
import { useVisitas } from '../../hooks/useVisitas';
import { useConfirm } from '../../context/ConfirmContext';
import { useNotify } from '../../context/NotificationContext';
import ActionResultModal from '../../components/ui/ActionResultModal';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import {
  fetchHistorialDispositivoVisita,
  syncDispositivosVisita,
  syncTecnicosVisita,
} from '../../api/visitaDispositivoApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Construye el draft vacío para programar una visita desde una solicitud.
 * @param {import('../../hooks/useSolicitudesVisita').SolicitudVisita|null} solicitud
 * @returns {Object}
 */
const emptyDraft = (solicitud = null) => ({
  solicitudId:     solicitud?.id            || null,
  clienteId:       solicitud?.clienteId     || '',
  sucursalId:      solicitud?.sucursalId    || '',
  tipoVisitaId:    solicitud?.tipoVisitaId  || '',
  tecnicoIds:      [],
  tecnicoIdsIniciales: [],
  dispositivoIds:  solicitud?.dispositivoIds || [],
  dispositivoIdsIniciales: solicitud?.dispositivoIds || [],
  motivoCambio:    '',
  fechaProgramada: '',
  observaciones:   '',
});

/**
 * Solicitudes pendientes y visitas programadas son editables por completo.
 * Visitas en progreso solo permiten corregir dispositivos asociados.
 */
const canEditItem = (item) => {
  if (item._type === 'solicitud') return item.estadoCodigo === 'PENDIENTE';
  return item.esEditable || item.estadoCodigo === 'EN_PROGRESO';
};

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * Página de programación de visitas para coordinadores.
 * Muestra solicitudes PENDIENTE sin visita asignada + todas las visitas activas.
 * Permite programar (crear visita desde solicitud), editar visitas no iniciadas
 * y corregir técnicos y dispositivos de visitas en progreso.
 */
const ProgramacionVisitaPage = () => {
  const { user } = useAuth();
  const { data: masterData } = useMasterData();

  // ── Remote data ────────────────────────────────────────────────────────────
  const { solicitudes, loading: loadingSol, fetchSolicitudes, updateSolicitud } = useSolicitudesVisita();
  const { visitas, loading: loadingVis, saving, fetchVisitas, createVisita, updateVisita, cancelVisita } = useVisitas();

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
  const [filters, setFilters]           = useState({ cliente: [], sucursal: [], estado: [], tecnico: [], fechaDesde: '', fechaHasta: '' });
  const [viewingItem, setViewingItem]   = useState(null);
  const [historial, setHistorial]       = useState([]);
  const [savingDevices, setSavingDevices] = useState(false);

  const updateDraft = useCallback(patch => setDraft(prev => ({ ...prev, ...patch })), []);
  const notify = useNotify();

  // Modal de éxito post-acción
  const [successModal, setSuccessModal] = useState({ open: false, visitaId: null, isEdit: false });
  const confirm = useConfirm();
  const [cancelResult, setCancelResult] = useState(null); // { error, message? }

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

  // Opciones para FilterBar (derivadas de combinedList)
  const clienteOptions = useMemo(() => {
    const seen = new Set();
    return combinedList
      .map(item => ({ value: item.clienteId || '', label: item.clienteNombre || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [combinedList]);

  const sucursalOptions = useMemo(() => {
    const selectedClientes = filters.cliente;
    const seen = new Set();
    return combinedList
      .filter(item => selectedClientes.length === 0 || selectedClientes.includes(item.clienteId || ''))
      .map(item => ({
        value: item.sucursalId || '',
        label: item.sucursalNombre || '',
        parentValue: item.clienteId || '',
      }))
      .filter(o => {
        const key = `${o.value}__${o.parentValue}`;
        return o.value && o.label && !seen.has(key) && seen.add(key);
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [combinedList, filters.cliente]);

  const estadoFilterOptions = useMemo(() => {
    const seen = new Set();
    return combinedList
      .map(item => ({ value: item.estadoCodigo || '', label: item.estadoLabel || item.estadoCodigo || '' }))
      .filter(o => o.value && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [combinedList]);

  const tecnicoFilterOptions = useMemo(() => tecnicosOptions, [tecnicosOptions]);

  const filterDefs = [
    { key: 'cliente',    label: 'Cliente',      options: clienteOptions,       multi: true },
    { key: 'sucursal',   label: 'Sucursal',     options: sucursalOptions,       multi: true, dependsOn: 'cliente', dependsOnLabel: 'un cliente' },
    { key: 'estado',     label: 'Estado',       options: estadoFilterOptions,   multi: true },
    { key: 'tecnico',    label: 'Técnico',      options: tecnicoFilterOptions,  multi: true },
    { key: 'fechaDesde', label: 'Fecha desde',  type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta',  type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  const filtered = useMemo(() => {
    let list = combinedList;
    if (filters.cliente.length > 0)
      list = list.filter(item => filters.cliente.includes(item.clienteId || ''));
    if (filters.sucursal.length > 0)
      list = list.filter(item => filters.sucursal.includes(item.sucursalId || ''));
    if (filters.estado.length > 0)
      list = list.filter(item => filters.estado.includes(item.estadoCodigo || ''));
    if (filters.tecnico.length > 0)
      list = list.filter(item =>
        (item.tecnicoIds || []).some(id => filters.tecnico.includes(id))
      );
    if (filters.fechaDesde)
      list = list.filter(item => {
        const fecha = item._type === 'visita' ? item.fechaProgramada : item.fechaSugerida;
        return fecha && fecha >= filters.fechaDesde;
      });
    if (filters.fechaHasta)
      list = list.filter(item => {
        const fecha = item._type === 'visita' ? item.fechaProgramada : item.fechaSugerida;
        return fecha && fecha <= filters.fechaHasta + 'T23:59:59';
      });
    return list;
  }, [combinedList, filters]);

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
      const deviceIds = (sol?.dispositivoIds || item.dispositivos?.map(d => d.id) || []).map(String);
      setSolicitudOrigen(sol);
      setDraft({
        solicitudId:     item.solicitudId,
        clienteId:       item.clienteId,
        sucursalId:      item.sucursalId,
        tipoVisitaId:    item.tipoVisitaId,
        tecnicoIds:      item.tecnicoIds || [],
        tecnicoIdsIniciales: item.tecnicoIds || [],
        dispositivoIds:  deviceIds,
        dispositivoIdsIniciales: deviceIds,
        motivoCambio:    '',
        fechaProgramada: item.fechaProgramada
          ? (() => {
              const d = new Date(item.fechaProgramada);
              const offset = d.getTimezoneOffset() * 60000;
              return new Date(d.getTime() - offset).toISOString().slice(0, 16);
            })()
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
    setHistorial([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft.fechaProgramada || draft.tecnicoIds.length === 0) {
      return;
    }

    const current = editingVisitaId ? visitas.find(v => v.id === editingVisitaId) : null;
    const inProgressEdit = current?.estadoCodigo === 'EN_PROGRESO';
    const initialIds = draft.dispositivoIdsIniciales || [];
    const nextIds = draft.dispositivoIds || [];
    const sameDevices = [...initialIds].sort().join() === [...nextIds].sort().join();
    const initialTecnicos = (draft.tecnicoIdsIniciales || []).map(String);
    const nextTecnicos = (draft.tecnicoIds || []).map(String);
    const sameTecnicos = [...initialTecnicos].sort().join() === [...nextTecnicos].sort().join();

    if (inProgressEdit) {
      if (nextIds.length === 0 || nextTecnicos.length === 0) return;
      if ((!sameDevices || !sameTecnicos) && !draft.motivoCambio?.trim()) return;

      if (!sameDevices || !sameTecnicos) {
        const removed = initialIds.filter(id => !nextIds.includes(id));
        const removedWithWork = removed.filter(id => current?.dispositivoIntervencionMap?.[id]);
        if (removedWithWork.length > 0) {
          const confirmed = await confirm({
            title: 'Dispositivos con avance',
            message: 'Uno o más dispositivos a retirar ya tienen trabajo registrado. Se ocultarán de la visita y el cambio quedará en el historial. ¿Continuar?',
            confirmText: 'Sí, actualizar asignación',
            cancelText: 'Volver',
            type: 'warning',
          });
          if (!confirmed) return;
        }

        setSavingDevices(true);
        try {
          const motivo = draft.motivoCambio.trim();
          if (!sameDevices) {
            await syncDispositivosVisita({
              visitaId: editingVisitaId,
              solicitudId: draft.solicitudId,
              newIds: nextIds,
              usuarioId: user?.id,
              motivo,
            });
          }
          if (!sameTecnicos) {
            await syncTecnicosVisita({
              visitaId: editingVisitaId,
              solicitudId: draft.solicitudId,
              newIds: nextTecnicos,
              usuarioId: user?.id,
              motivo,
            });
          }
          await Promise.all([fetchVisitas(), fetchSolicitudes()]);
        } catch (err) {
          notify('error', err.message || 'No se pudo actualizar la asignación.');
          return;
        } finally {
          setSavingDevices(false);
        }
      }

      setView('list');
      setEditingVisitaId(null);
      setSolicitudOrigen(null);
      setDraft(emptyDraft());
      setSuccessModal({ open: true, visitaId: editingVisitaId, isEdit: true });
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

    if (editingVisitaId) {
      const ok = await updateVisita(editingVisitaId, {
        fechaProgramada: draft.fechaProgramada,
        observaciones:   draft.observaciones,
        tecnicoIds:      draft.tecnicoIds,
      });
      if (ok && draft.solicitudId && !sameDevices) {
        try {
          await syncDispositivosVisita({
            visitaId: editingVisitaId,
            solicitudId: draft.solicitudId,
            newIds: nextIds,
            usuarioId: user?.id,
            motivo: draft.motivoCambio?.trim() || 'Ajuste en la programación',
          });
          await fetchSolicitudes();
          await fetchVisitas();
        } catch (err) {
          notify('error', err.message || 'La visita se actualizó, pero no se pudieron guardar los dispositivos.');
          return;
        }
      }
      if (ok) {
        setView('list');
        setEditingVisitaId(null);
        setSolicitudOrigen(null);
        setDraft(emptyDraft());
        setSuccessModal({ open: true, visitaId: editingVisitaId, isEdit: true });
      }
    } else {
      if (draft.solicitudId) {
        await updateSolicitud(draft.solicitudId, { dispositivoIds: draft.dispositivoIds }, []);
      }
      const id = await createVisita(payload, estadoOptions);
      if (id) {
        await fetchSolicitudes();
        setView('list');
        setSolicitudOrigen(null);
        setDraft(emptyDraft());
        setSuccessModal({ open: true, visitaId: id, isEdit: false });
      }
    }
  }, [
    draft, editingVisitaId, user, visitas, confirm, notify,
    estadoOptions,
    createVisita, updateVisita, updateSolicitud, fetchSolicitudes, fetchVisitas,
  ]);

  const handleRequestCancel = useCallback(async (item) => {
    const confirmed = await confirm({
      title: '¿Cancelar visita?',
      message: '¿Estás seguro de que deseas cancelar esta visita? Esta acción no se puede deshacer.',
      confirmText: 'Sí, cancelar visita',
      cancelText: 'Mantener visita',
      type: 'danger',
    });
    if (!confirmed) return;
    const ok = await cancelVisita(item.id, estadoOptions);
    setCancelResult({
      error: !ok,
      message: ok ? null : 'No se pudo cancelar la visita. Intenta nuevamente.',
    });
  }, [confirm, cancelVisita, estadoOptions]);

  const historialVisitaId = editingVisitaId
    || (view === 'view' && viewingItem?._type === 'visita' ? viewingItem.id : null);

  useEffect(() => {
    if (!historialVisitaId) {
      setHistorial([]);
      return;
    }
    let cancelled = false;
    fetchHistorialDispositivoVisita(historialVisitaId)
      .then(rows => { if (!cancelled) setHistorial(rows); })
      .catch(() => { if (!cancelled) setHistorial([]); });
    return () => { cancelled = true; };
  }, [historialVisitaId]);

  // ══════════════════════════════════════════════════════════════════════════
  // FORM VIEW — Programar / Editar
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'form') {
    const allDispositivos = masterData?.dispositivos || [];
    const getName = (val) => (typeof val === 'object' ? val?.nombre : val) || '';
    const dispositivosDisponibles = (draft.sucursalId
      ? allDispositivos.filter(d => d.branchId === draft.sucursalId)
      : allDispositivos
    ).map(d => ({
      value:      String(d.id),
      label:      d.serial || d.idInmotika || d.id_inmotika || d.codigoUnico || d.modelo || String(d.id),
      serial:     d.serial || '',
      idInmotika: d.id_inmotika || d.idInmotika || '',
      modelo:     d.modelo || '',
      categoria:  getName(d.categoria),
      marca:      getName(d.marca),
      proveedor:  getName(d.proveedor),
    }));

    return (
      <ProgramacionForm
        draft={draft}
        updateDraft={updateDraft}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving || savingDevices}
        isEditing={!!editingVisitaId}
        solicitudOrigen={solicitudOrigen}
        tecnicosOptions={tecnicosOptions}
        dispositivosDisponibles={dispositivosDisponibles}
        inProgressEdit={!!editingVisitaId && visitas.find(v => v.id === editingVisitaId)?.estadoCodigo === 'EN_PROGRESO'}
        historial={historial}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / VIEW MODE
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'view' && viewingItem) {
    return (
      <ProgramacionDetalle
        item={viewingItem}
        solicitudOrigen={solicitudOrigen}
        onBack={handleCancel}
        onEdit={handleSchedule}
        historial={historial}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════

  const progColumns = [
    {
      header: 'Tipo',
      render: item => {
        const tipoCodigo = item.tipoVisitaCodigo || '';
        return tipoCodigo
          ? <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold uppercase whitespace-nowrap ${tipoCodigo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              {item.tipoVisitaLabel || tipoCodigo}
            </span>
          : <TextSmall className="text-gray-400">—</TextSmall>;
      },
    },
    {
      header: 'Cliente / Sucursal',
      render: item => <>
        <TextSmall className="font-semibold">{item.clienteNombre}</TextSmall>
        <TextTiny className="text-gray-400">{item.sucursalNombre}</TextTiny>
      </>,
    },
    {
      header: 'Fecha',
      render: item => {
        const fecha = item._type === 'visita' ? item.fechaProgramada : item.fechaSugerida;
        return fecha
          ? <div className="whitespace-nowrap">
              <TextSmall>{new Date(fecha).toLocaleDateString('es-ES')}</TextSmall>
              <TextTiny className="text-gray-400">{new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</TextTiny>
            </div>
          : <TextSmall className="text-gray-400 italic whitespace-nowrap">Sin programar</TextSmall>;
      },
    },
    {
      header: 'Técnicos',
      render: item => item._type === 'visita'
        ? <TechnicianChipList names={item.tecnicosNombres || []} />
        : <TextTiny className="text-gray-400 italic">—</TextTiny>,
    },
    {
      header: 'Estado',
      render: item => <VisitStatusBadge status={item.estadoCodigo || ''} />,
    },
    {
      header: 'Acciones',
      narrow: true,
      align: 'right',
      render: item => {
        const canEdit = canEditItem(item);
        return (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleView(item)} className="p-2 hover:bg-blue-50 rounded-md transition-colors" title="Ver detalle">
              <Eye size={15} className="text-blue-600" />
            </button>
            {canEdit && (
              <button onClick={() => handleSchedule(item)} className="p-2 hover:bg-green-50 rounded-md transition-colors" title={item._type === 'solicitud' ? 'Programar' : item.estadoCodigo === 'EN_PROGRESO' ? 'Editar asignación' : 'Editar'}>
                <Edit size={15} className="text-green-600" />
              </button>
            )}
            {item._type === 'visita' && item.esEditable && (
              <button onClick={() => handleRequestCancel(item)} className="p-2 hover:bg-red-50 rounded-md transition-colors" title="Cancelar">
                <Trash2 size={15} className="text-red-500" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <GenericListView
        icon={CalendarCheck}
        title="Programación de Visitas"
        items={filtered}
        columns={progColumns}
        loading={loading}
        loadingText="Cargando..."
        emptyText="No hay visitas o solicitudes pendientes con los filtros aplicados."
        emptyIcon={CalendarCheck}
        filteredCount={filtered.length}
        totalItems={combinedList.length}
        activeFiltersCount={filters.cliente.length + filters.sucursal.length + filters.estado.length + filters.tecnico.length + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0)}
        onClearFilters={() => setFilters({ cliente: [], sucursal: [], estado: [], tecnico: [], fechaDesde: '', fechaHasta: '' })}
        extraFilters={
          <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
        }
        renderMobileCard={item => {
          const tipoCodigo   = item.tipoVisitaCodigo || '';
          const fechaDisplay = item._type === 'visita' ? item.fechaProgramada : item.fechaSugerida;
          const estadoCodigo = item.estadoCodigo || '';
          const canEdit      = canEditItem(item);
          return (
            <VisitaMobileCard
              visita={item}
              tipoCodigo={tipoCodigo}
              tipoLabel={item.tipoVisitaLabel}
              fechaDisplay={fechaDisplay}
              estadoCodigo={estadoCodigo}
              tecnicos={item._type === 'visita' ? (item.tecnicosNombres || []) : []}
              actions={[
                { label: 'Ver', icon: Eye, onClick: () => handleView(item), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                ...(canEdit ? [{ label: item._type === 'solicitud' ? 'Programar' : item.estadoCodigo === 'EN_PROGRESO' ? 'Editar asignación' : 'Editar', icon: Edit, onClick: () => handleSchedule(item), colorClass: 'bg-green-50 text-green-700 hover:bg-green-100' }] : []),
                ...(item._type === 'visita' && item.esEditable ? [{ label: 'Cancelar', icon: Trash2, onClick: () => handleRequestCancel(item), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' }] : []),
              ]}
            />
          );
        }}
      />

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

      {/* ── Overlay modal resultado cancelación ──────────────────────────── */}
      <ActionResultModal
        open={!!cancelResult}
        error={!!cancelResult?.error}
        title={cancelResult?.error ? 'Error en la operación' : '¡Visita cancelada!'}
        subtitle="La visita fue cancelada correctamente."
        errorMessage={cancelResult?.message}
        onBackdropClick={() => setCancelResult(null)}
        actions={
          cancelResult?.error
            ? [{ label: 'Entendido', variant: 'danger', onClick: () => setCancelResult(null) }]
            : [{ label: 'Volver a Programación de Visitas', variant: 'outline', onClick: () => setCancelResult(null) }]
        }
      />
    </div>
  );
};

export default ProgramacionVisitaPage;
