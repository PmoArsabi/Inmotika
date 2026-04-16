import { useState, useMemo } from 'react';
import { Eye, FileText, Edit2, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import { TextSmall, TextTiny } from '../../components/ui/Typography';
import ActionResultModal from '../../components/ui/ActionResultModal';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import { useSolicitudesVisita } from '../../hooks/useSolicitudesVisita';
import { useVisitas } from '../../hooks/useVisitas';
import { useCatalog } from '../../hooks/useCatalog';
import { useMasterData } from '../../context/MasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useClienteData } from '../../hooks/useClienteData';
import { useConfirm } from '../../context/ConfirmContext';
import { ROLES } from '../../utils/constants';
import { SolicitudForm, SolicitudDetalle } from '../../modules/visits/SolicitudForm';
import { emptySolicitud, solicitudToDraft } from '../../modules/visits/solicitudHelpers';

// ─── Main ─────────────────────────────────────────────────────────────────────
const SolicitudVisitaPage = () => {
  const [mode,             setMode]          = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [selectedSol,      setSelectedSol]   = useState(null);
  const [draft,            setDraft]         = useState(emptySolicitud());
  const [filters,          setFilters]       = useState({ cliente: [], sucursal: [], estado: [], tipo: [], fechaDesde: '', fechaHasta: '' });
  const [solicitudResult,  setSolicitudResult] = useState(null); // { id, isUpdate, error?, message? } → modal resultado

  // ── Data ────────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const userRole = user?.role;
  const isClienteRole = userRole === ROLES.CLIENTE;

  const confirm = useConfirm();

  const { solicitudes, loading, saving, createSolicitud, updateSolicitud, cancelSolicitud } = useSolicitudesVisita();
  const { data } = useMasterData();
  const { options: tipoVisitaOptions } = useCatalog('TIPO_VISITA');
  const { options: estadoVisitaOptions } = useCatalog('ESTADO_VISITA');

  // Para rol CLIENTE: datos del contacto autenticado
  const { cliente: clienteContacto, sucursales: sucursalesContacto, dispositivos: dispositivosContacto } = useClienteData();

  const { visitas } = useVisitas();

  // Auto-populate draft con el cliente del contacto al abrir el formulario de creación.
  // Se hace durante el render (no en effect) para evitar setState-in-effect.
  const clienteContactoId = clienteContacto?.id ? String(clienteContacto.id) : '';
  const clienteContactoNombre = clienteContacto?.razon_social || clienteContacto?.nombre || '';
  if (isClienteRole && mode === 'create' && clienteContactoId && draft.clienteId !== clienteContactoId) {
    setDraft(prev => ({ ...prev, clienteId: clienteContactoId, clienteNombre: clienteContactoNombre }));
  }

  const tipoVisitaSelectOptions = useMemo(() => [
    { value: '', label: 'Seleccionar tipo...' },
    ...tipoVisitaOptions.map(o => ({ value: o.codigo, label: o.label })),
  ], [tipoVisitaOptions]);

  const clientes = useMemo(() => data?.clientes || [], [data?.clientes]);

  const clienteOptions = useMemo(
    () => clientes.map(c => ({ value: c.id, label: c.nombre || c.razonSocial || c.razon_social })),
    [clientes]
  );

  const sucursalOptions = useMemo(() => {
    if (!draft.clienteId) return [];
    if (isClienteRole) {
      return sucursalesContacto.map(s => ({ value: String(s.id), label: s.nombre }));
    }
    const c = clientes.find(cl => String(cl.id) === String(draft.clienteId));
    return (c?.sucursales || []).map(s => ({ value: s.id, label: s.nombre }));
  }, [isClienteRole, sucursalesContacto, clientes, draft.clienteId]);

  const dispositivoOptions = useMemo(() => {
    if (!draft.sucursalId) return [];
    const getName = (val) => (typeof val === 'object' ? val?.nombre : val) || '';
    if (isClienteRole) {
      return dispositivosContacto
        .filter(d => String(d.sucursal_id || d.branchId) === String(draft.sucursalId))
        .map(d => ({
          value:      String(d.id),
          label:      d.serial || d.id_inmotika || d.idInmotika || d.codigo_unico || `Dispositivo ${d.id}`,
          serial:     d.serial || '',
          idInmotika: d.id_inmotika || d.idInmotika || '',
          modelo:     d.modelo || '',
          categoria:  getName(d.categoria),
          marca:      getName(d.marca),
          proveedor:  getName(d.proveedor),
        }));
    }
    return (data?.dispositivos || [])
      .filter(d => String(d.branchId) === String(draft.sucursalId))
      .map(d => ({
        value:      String(d.id),
        label:      d.serial || d.idInmotika || d.codigoUnico || d.modelo || String(d.id),
        serial:     d.serial || '',
        idInmotika: d.id_inmotika || d.idInmotika || '',
        modelo:     d.modelo || '',
        categoria:  getName(d.categoria),
        marca:      getName(d.marca),
        proveedor:  getName(d.proveedor),
      }));
  }, [isClienteRole, dispositivosContacto, data?.dispositivos, draft.sucursalId]);

  // Opciones para FilterBar
  const clienteFilterOptions = useMemo(() => {
    const seen = new Set();
    return solicitudes
      .map(s => ({ value: s.clienteId || '', label: s.clienteNombre || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes]);

  const sucursalFilterOptions = useMemo(() => {
    const selectedClientes = filters.cliente;
    const seen = new Set();
    return solicitudes
      .filter(s => selectedClientes.length === 0 || selectedClientes.includes(s.clienteId || ''))
      .map(s => ({ value: s.sucursalId || '', label: s.sucursalNombre || '', parentValue: s.clienteId || '' }))
      .filter(o => {
        const key = `${o.value}__${o.parentValue}`;
        return o.value && o.label && !seen.has(key) && seen.add(key);
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes, filters.cliente]);

  const estadoFilterOptions = useMemo(() => {
    const seen = new Set();
    return solicitudes
      .map(s => ({ value: s.estadoCodigo || '', label: s.estadoLabel || s.estadoCodigo || '' }))
      .filter(o => o.value && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes]);

  const tipoFilterOptions = useMemo(() => {
    const seen = new Set();
    return solicitudes
      .map(s => ({ value: s.tipoVisitaCodigo || s.tipoVisitaLabel || '', label: s.tipoVisitaLabel || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes]);

  const filterDefs = [
    { key: 'cliente',    label: 'Cliente',      options: clienteFilterOptions,  multi: true },
    { key: 'sucursal',   label: 'Sucursal',     options: sucursalFilterOptions,  multi: true, dependsOn: 'cliente', dependsOnLabel: 'un cliente' },
    { key: 'estado',     label: 'Estado',       options: estadoFilterOptions,    multi: true },
    { key: 'tipo',       label: 'Tipo',         options: tipoFilterOptions,      multi: true },
    { key: 'fechaDesde', label: 'Fecha desde',  type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta',  type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  const filtered = useMemo(() => {
    let list = solicitudes;
    if (filters.cliente.length > 0)
      list = list.filter(s => filters.cliente.includes(s.clienteId || ''));
    if (filters.sucursal.length > 0)
      list = list.filter(s => filters.sucursal.includes(s.sucursalId || ''));
    if (filters.estado.length > 0)
      list = list.filter(s => filters.estado.includes(s.estadoCodigo || ''));
    if (filters.tipo.length > 0)
      list = list.filter(s => filters.tipo.includes(s.tipoVisitaCodigo || s.tipoVisitaLabel || ''));
    if (filters.fechaDesde)
      list = list.filter(s => s.fechaSugerida && s.fechaSugerida >= filters.fechaDesde);
    if (filters.fechaHasta)
      list = list.filter(s => s.fechaSugerida && s.fechaSugerida <= filters.fechaHasta + 'T23:59:59');
    return list;
  }, [solicitudes, filters]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateDraft = (patch) => setDraft(prev => ({ ...prev, ...patch }));

  const handleGoList = () => { setMode('list'); setSelectedSol(null); };

  const handleCreate = () => {
    setDraft(emptySolicitud());
    setMode('create');
  };

  const handleEdit = (sol) => {
    setDraft(solicitudToDraft(sol));
    setSelectedSol(sol);
    setMode('edit');
  };

  const handleView = (sol) => {
    setSelectedSol(sol);
    setMode('view');
  };

  const handleSaveCreate = async () => {
    if (!draft.tipoVisitaCodigo || !draft.clienteId || !draft.sucursalId || !draft.fechaSugerida || draft.dispositivoIds.length === 0 || !draft.motivo?.trim()) {
      await confirm({
        title: 'Campos incompletos',
        message: 'Para enviar la solicitud debes completar todos los campos: Tipo de Mantenimiento, Cliente, Sucursal, Fecha sugerida, al menos un Dispositivo y la Observación.',
        confirmText: 'Entendido',
        type: 'warning',
        hideCancel: true,
      });
      return;
    }
    const ok = await confirm({
      title: '¿Enviar solicitud?',
      message: 'Revisa que todos los datos estén correctos antes de enviar. El equipo de coordinación recibirá la solicitud y la asignará próximamente.',
      confirmText: 'Sí, enviar',
      cancelText: 'Revisar',
      type: 'primary',
    });
    if (!ok) return;
    const result = await createSolicitud(
      {
        clienteId:       draft.clienteId || null,
        sucursalId:      draft.sucursalId,
        tipoVisitaCodigo: draft.tipoVisitaCodigo,
        fechaSugerida:   draft.fechaSugerida,
        motivo:          draft.motivo,
        dispositivoIds:  draft.dispositivoIds,
      },
      tipoVisitaOptions,
      estadoVisitaOptions
    );
    if (result) {
      setSolicitudResult({ id: result, isUpdate: false });
    } else {
      setSolicitudResult({ id: null, isUpdate: false, error: true, message: 'No se pudo enviar la solicitud. Intenta nuevamente.' });
    }
  };

  const handleSaveEdit = async () => {
    if (!draft.tipoVisitaCodigo || !draft.sucursalId || !draft.fechaSugerida || draft.dispositivoIds.length === 0 || !draft.motivo?.trim()) {
      await confirm({
        title: 'Campos incompletos',
        message: 'Para guardar los cambios debes completar todos los campos: Tipo de Mantenimiento, Sucursal, Fecha sugerida, al menos un Dispositivo y la Observación.',
        confirmText: 'Entendido',
        type: 'warning',
        hideCancel: true,
      });
      return;
    }
    const ok = await confirm({
      title: '¿Guardar cambios?',
      message: 'Se actualizarán los datos de la solicitud. ¿Deseas continuar?',
      confirmText: 'Sí, guardar',
      cancelText: 'Revisar',
      type: 'primary',
    });
    if (!ok) return;
    const saved = await updateSolicitud(
      selectedSol.id,
      {
        tipoVisitaCodigo: draft.tipoVisitaCodigo,
        fechaSugerida:    draft.fechaSugerida,
        motivo:           draft.motivo,
        dispositivoIds:   draft.dispositivoIds,
      },
      tipoVisitaOptions
    );
    if (saved) {
      setSolicitudResult({ id: selectedSol.id, isUpdate: true });
    } else {
      setSolicitudResult({ id: selectedSol.id, isUpdate: true, error: true, message: 'No se pudieron guardar los cambios. Intenta nuevamente.' });
    }
  };

  const handleRequestCancel = async (sol) => {
    const confirmed = await confirm({
      title: '¿Cancelar solicitud?',
      message: `¿Estás seguro de cancelar esta solicitud? Esta acción no se puede deshacer.`,
      confirmText: 'Cancelar solicitud',
      type: 'danger',
    });
    if (!confirmed) return;
    const ok = await cancelSolicitud(sol.id, estadoVisitaOptions);
    setSolicitudResult({
      id: sol.id,
      isCancel: true,
      error: !ok,
      message: ok ? null : 'No se pudo cancelar la solicitud. Intenta nuevamente.',
    });
  };

  // ── Overlay modal resultado — se monta encima de cualquier vista ─────────────
  const resultModal = (
    <ActionResultModal
      open={!!solicitudResult}
      error={!!solicitudResult?.error}
      title={
        solicitudResult?.error ? 'Error en la operación'
        : solicitudResult?.isCancel ? '¡Solicitud cancelada!'
        : solicitudResult?.isUpdate ? '¡Cambios guardados!'
        : '¡Solicitud enviada!'
      }
      subtitle={
        solicitudResult?.isCancel ? 'La solicitud fue cancelada correctamente.'
        : solicitudResult?.isUpdate ? 'Los datos de la solicitud fueron actualizados correctamente.'
        : 'El equipo de coordinación la revisará y asignará próximamente.'
      }
      errorMessage={solicitudResult?.message}
      onBackdropClick={() => { setSolicitudResult(null); handleGoList(); }}
      actions={
        solicitudResult?.error
          ? [{ label: 'Entendido', variant: 'danger', onClick: () => setSolicitudResult(null) }]
          : [
              ...(!solicitudResult?.isCancel ? [{
                label: 'Ver Solicitud',
                variant: 'success',
                onClick: () => {
                  const sol = solicitudes.find(s => s.id === solicitudResult.id);
                  setSolicitudResult(null);
                  if (sol) handleView(sol);
                  else handleGoList();
                },
              }] : []),
              {
                label: 'Volver a Solicitudes',
                variant: 'outline',
                onClick: () => { setSolicitudResult(null); handleGoList(); },
              },
            ]
      }
    />
  );

  // ══════════════════════════════════════════════════════════════════════════
  // FORM (create / edit)
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'create' || mode === 'edit') {
    return (
      <>
        <SolicitudForm
          draft={draft}
          updateDraft={updateDraft}
          onSubmit={mode === 'create' ? handleSaveCreate : handleSaveEdit}
          onCancel={handleGoList}
          saving={saving}
          tipoVisitaSelectOptions={tipoVisitaSelectOptions}
          clienteOptions={clienteOptions}
          sucursalOptions={sucursalOptions}
          dispositivoOptions={dispositivoOptions}
          isEdit={mode === 'edit'}
          isClienteLocked={isClienteRole}
        />
        {resultModal}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / TRACE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'view' && selectedSol) {
    return (
      <>
        <SolicitudDetalle
          sol={selectedSol}
          visitas={visitas}
          onBack={handleGoList}
          onEdit={handleEdit}
          onCancel={handleRequestCancel}
        />
        {resultModal}
      </>
    );
  }

  // ── Columnas para desktop ───────────────────────────────────────────────────
  const tipoBg = (codigo) =>
    codigo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700'
    : codigo === 'CORRECTIVO' ? 'bg-orange-100 text-orange-700'
    : 'bg-gray-100 text-gray-700';

  const columns = [
    {
      header: 'Tipo',
      render: (sol) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tipoBg(sol.tipoVisitaCodigo)}`}>
          {sol.tipoVisitaLabel || sol.tipoVisitaCodigo || '—'}
        </span>
      ),
    },
    {
      header: 'Cliente / Sucursal',
      render: (sol) => (
        <>
          <TextSmall className="font-semibold">{sol.clienteNombre || '—'}</TextSmall>
          <TextTiny className="text-gray-400">{sol.sucursalNombre}</TextTiny>
        </>
      ),
    },
    {
      header: 'Fecha Sugerida',
      render: (sol) => sol.fechaSugerida ? (
        <>
          <TextSmall>{new Date(sol.fechaSugerida).toLocaleDateString('es-ES')}</TextSmall>
          <TextTiny className="text-gray-400">
            {new Date(sol.fechaSugerida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </TextTiny>
        </>
      ) : <TextSmall className="text-gray-400">—</TextSmall>,
    },
    {
      header: 'Fecha Solicitud',
      render: (sol) => (
        <TextSmall>{sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString('es-ES') : '—'}</TextSmall>
      ),
    },
    {
      header: 'Dispositivos',
      render: (sol) => (
        <TextSmall>{sol.dispositivoIds?.length || 0} dispositivo{sol.dispositivoIds?.length !== 1 ? 's' : ''}</TextSmall>
      ),
    },
    {
      header: 'Estado',
      render: (sol) => <VisitStatusBadge status={sol.estadoCodigo} />,
    },
    {
      header: 'Acciones',
      align: 'right',
      narrow: true,
      render: (sol) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleView(sol)}
            title="Ver detalle"
            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye size={15} />
          </button>
          {sol.estadoCodigo === 'PENDIENTE' && (
            <button
              onClick={() => handleEdit(sol)}
              title="Editar"
              className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors"
            >
              <Edit2 size={15} />
            </button>
          )}
          {(sol.estadoCodigo === 'PENDIENTE' || sol.estadoCodigo === 'PROGRAMADA') && (
            <button
              onClick={() => handleRequestCancel(sol)}
              title="Cancelar solicitud"
              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── Card mobile personalizada ────────────────────────────────────────────────
  const renderMobileCard = (sol) => (
    <Card className="p-5 border border-gray-200 shadow-sm rounded-2xl">
      <div className="divide-y divide-gray-50 mb-4">
        <div className="flex items-start gap-3 py-2.5 first:pt-0">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Cliente</TextTiny>
          <div className="flex-1 min-w-0">
            <TextSmall className="font-bold text-gray-900">{sol.clienteNombre || '—'}</TextSmall>
            <TextTiny className="text-gray-400">{sol.sucursalNombre}</TextTiny>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
          <div className="flex-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tipoBg(sol.tipoVisitaCodigo)}`}>
              {sol.tipoVisitaLabel || sol.tipoVisitaCodigo || '—'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
          <div className="flex-1"><VisitStatusBadge status={sol.estadoCodigo} /></div>
        </div>
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">F. Sugerida</TextTiny>
          <TextTiny className="text-gray-600 flex-1">
            {sol.fechaSugerida ? new Date(sol.fechaSugerida).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
          </TextTiny>
        </div>
        <div className="flex items-start gap-3 py-2.5 last:pb-0">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">F. Solicitud</TextTiny>
          <TextTiny className="text-gray-600 flex-1">
            {sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString('es-ES') : '—'}
          </TextTiny>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button onClick={() => handleView(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold">
          <Eye size={14} /> Ver
        </button>
        {sol.estadoCodigo === 'PENDIENTE' && (
          <button onClick={() => handleEdit(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-xs font-semibold">
            <Edit2 size={14} /> Editar
          </button>
        )}
        {(sol.estadoCodigo === 'PENDIENTE' || sol.estadoCodigo === 'PROGRAMADA') && (
          <button onClick={() => handleRequestCancel(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold">
            <Trash2 size={14} /> Cancelar
          </button>
        )}
      </div>
    </Card>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-700">
        <GenericListView
          icon={FileText}
          title="Solicitudes de Visita"
          items={filtered}
          columns={columns}
          onNew={handleCreate}
          newButtonLabel="Nueva Solicitud"
          loading={loading}
          loadingText="Cargando solicitudes..."
          emptyText="No hay solicitudes registradas. Crea la primera."
          filterFunction={(sol, q) =>
            sol.clienteNombre?.toLowerCase().includes(q) ||
            sol.sucursalNombre?.toLowerCase().includes(q) ||
            sol.tipoVisitaLabel?.toLowerCase().includes(q) ||
            sol.motivo?.toLowerCase().includes(q)
          }
          renderMobileCard={renderMobileCard}
          filteredCount={filtered.length}
          totalItems={solicitudes.length}
          activeFiltersCount={filters.cliente.length + filters.sucursal.length + filters.estado.length + filters.tipo.length + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0)}
          onClearFilters={() => setFilters({ cliente: [], sucursal: [], estado: [], tipo: [], fechaDesde: '', fechaHasta: '' })}
          extraFilters={
            <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
          }
        />
      </div>
      {resultModal}
    </>
  );
};

export default SolicitudVisitaPage;
