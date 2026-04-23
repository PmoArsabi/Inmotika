import { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, Edit2, Trash2, X,
  Calendar, Building2, Cpu, Clock, AlertCircle, Tag, Users, Phone, ChevronDown, ChevronUp,
  Eye, FileDown,
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import SecureImage from '../../components/ui/SecureImage';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Select from '../../components/ui/Select';
import InfoRow from '../../components/ui/InfoRow';
import SectionHeader from '../../components/ui/SectionHeader';
import VisitProgressPanel from '../../components/visits/VisitProgressPanel';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import DevicePickerModal from '../../components/shared/DevicePickerModal';
import DocumentList from '../../components/ui/DocumentList';
import { useDocumentosTecnicosVisita } from '../../hooks/useUserDocuments';
import { useAuth } from '../../context/AuthContext';
import { H2, H3, TextSmall, TextTiny, Label } from '../../components/ui/Typography';

// ─── Form compartido (crear / editar) ─────────────────────────────────────────

/**
 * Formulario de creación y edición de solicitud de visita.
 * @param {{ draft: object, updateDraft: function, onSubmit: function, onCancel: function, saving: boolean, tipoVisitaSelectOptions: Array, clienteOptions: Array, sucursalOptions: Array, dispositivoOptions: Array, isEdit: boolean, isClienteLocked: boolean }} props
 */
const SolicitudForm = ({
  draft, updateDraft, onSubmit, onCancel, saving,
  tipoVisitaSelectOptions, clienteOptions, sucursalOptions,
  dispositivoOptions, isEdit, isClienteLocked,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 bg-gray-50 hover:bg-brand hover:text-white rounded-md transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <H2>{isEdit ? 'Editar Solicitud de Visita' : 'Nueva Solicitud de Visita'}</H2>
            <TextSmall className="text-gray-500">
              {isEdit ? 'Modifica los datos de la solicitud' : 'Complete los datos para solicitar una visita técnica'}
            </TextSmall>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={saving} className="flex items-center gap-2">
          <FileText size={16} />
          {saving ? (isEdit ? 'Guardando...' : 'Enviando...') : (isEdit ? 'Guardar Cambios' : 'Enviar Solicitud')}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5">
            <SectionHeader icon={FileText} title="Datos de la Solicitud" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <Select
                label="Tipo de Mantenimiento"
                icon={AlertCircle}
                options={tipoVisitaSelectOptions}
                value={draft.tipoVisitaCodigo}
                onChange={e => updateDraft({ tipoVisitaCodigo: e.target.value })}
                required
              />

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cliente <span className="text-red-500">*</span></Label>
                {isClienteLocked ? (
                  <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-200 rounded-md">
                    <Building2 size={14} className="text-gray-400 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {draft.clienteNombre || '—'}
                    </span>
                  </div>
                ) : (
                  <SearchableSelect
                    options={clienteOptions}
                    value={draft.clienteId ? { value: draft.clienteId, label: draft.clienteNombre } : null}
                    onChange={opt => updateDraft({
                      clienteId:           opt?.value || '',
                      clienteNombre:       opt?.label || '',
                      sucursalId:          '',
                      sucursalNombre:      '',
                      dispositivoIds:      [],
                      dispositivosNombres: [],
                    })}
                    placeholder="Seleccionar cliente..."
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Sucursal <span className="text-red-500">*</span>
                </Label>
                <SearchableSelect
                  options={sucursalOptions}
                  value={draft.sucursalId ? { value: draft.sucursalId, label: draft.sucursalNombre } : null}
                  onChange={opt => updateDraft({
                    sucursalId:          opt?.value || '',
                    sucursalNombre:      opt?.label || '',
                    dispositivoIds:      [],
                    dispositivosNombres: [],
                  })}
                  placeholder={draft.clienteId ? 'Seleccionar sucursal...' : 'Seleccione un cliente primero'}
                  isDisabled={!draft.clienteId}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                  Fecha y Hora Sugerida <span className="text-red-500">*</span>
                </Label>
                <input
                  type="datetime-local"
                  value={draft.fechaSugerida}
                  onChange={e => updateDraft({ fechaSugerida: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all"
                />
              </div>
            </div>

            {/* ── Dispositivos a Revisar — Device Picker ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Dispositivos a Revisar <span className="text-red-500">*</span>
                </Label>
                {draft.dispositivoIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateDraft({ dispositivoIds: [], dispositivosNombres: [] })}
                    className="text-2xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <X size={10} /> Limpiar selección
                  </button>
                )}
              </div>

              {/* Botón de apertura del picker */}
              <button
                type="button"
                disabled={!draft.sucursalId}
                onClick={() => setPickerOpen(true)}
                className={`w-full flex items-center justify-between gap-3 h-10 px-3 border rounded-md text-sm transition-all ${
                  !draft.sucursalId
                    ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                    : draft.dispositivoIds.length > 0
                      ? 'border-brand bg-white text-gray-700 hover:bg-red-50'
                      : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Cpu size={14} className="shrink-0" />
                  {!draft.sucursalId
                    ? 'Seleccione una sucursal primero'
                    : draft.dispositivoIds.length > 0
                      ? `${draft.dispositivoIds.length} dispositivo${draft.dispositivoIds.length !== 1 ? 's' : ''} seleccionado${draft.dispositivoIds.length !== 1 ? 's' : ''}`
                      : 'Seleccionar dispositivos...'
                  }
                </span>
                {draft.dispositivoIds.length > 0 && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-brand text-white text-2xs font-bold leading-none">
                    {draft.dispositivoIds.length}
                  </span>
                )}
              </button>

              {/* Listado de dispositivos seleccionados agrupados por categoría */}
              {draft.dispositivoIds.length > 0 && (
                <div className="mt-2 space-y-3">
                  {(() => {
                    const groups = {};
                    draft.dispositivoIds.forEach(id => {
                      const dev = dispositivoOptions.find(o => o.value === id);
                      const cat = dev?.categoria || 'Sin categoría';
                      if (!groups[cat]) groups[cat] = [];
                      groups[cat].push({ id, dev });
                    });
                    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                      <div key={cat}>
                        <p className="text-2xs font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                          <Tag size={9} /> {cat}
                        </p>
                        <ul className="space-y-1">
                          {items.map(({ id, dev }) => (
                            <li key={id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-100 group">
                              <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium min-w-0">
                                <Cpu size={11} className="text-gray-400 shrink-0" />
                                <span className="truncate">{dev?.label || id}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => updateDraft({
                                  dispositivoIds:      draft.dispositivoIds.filter(x => x !== id),
                                  dispositivosNombres: draft.dispositivosNombres?.filter((_, i) => draft.dispositivoIds[i] !== id) || [],
                                })}
                                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Observación / Motivo <span className="text-red-500">*</span>
              </Label>
              <textarea
                value={draft.motivo}
                onChange={e => updateDraft({ motivo: e.target.value })}
                rows={3}
                placeholder="Describe el motivo o detalles adicionales de la solicitud..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all"
              />
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-blue-600" />
              <Label className="text-sm font-bold text-blue-900">Información</Label>
            </div>
            <TextSmall className="text-blue-800 text-xs leading-relaxed">
              {isEdit
                ? 'Solo puedes editar solicitudes en estado Pendiente. Los cambios se verán reflejados de inmediato.'
                : 'Al enviar la solicitud, el equipo de coordinación la revisará y asignará los técnicos y fechas correspondientes.'}
            </TextSmall>
          </Card>
        </div>
      </div>

      <DevicePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        devices={dispositivoOptions}
        selected={draft.dispositivoIds}
        onConfirm={ids => updateDraft({
          dispositivoIds:      ids,
          dispositivosNombres: ids.map(id => dispositivoOptions.find(o => o.value === id)?.label || id),
        })}
      />
    </div>
  );
};

// ─── Vista de detalle / traza ─────────────────────────────────────────────────

/**
 * Vista de detalle y traza de una solicitud de visita.
 * @param {{ sol: object, visitas: object[], onBack: function, onEdit: function, onCancel: function }} props
 */
const SolicitudDetalle = ({ sol, visitas, onBack, onEdit, onCancel: onRequestCancel }) => {
  const canEdit   = sol.estadoCodigo === 'PENDIENTE';
  const canCancel = sol.estadoCodigo === 'PENDIENTE' || sol.estadoCodigo === 'PROGRAMADA';
  const visitaVinculada = visitas.find(v => v.solicitudId === sol.id) || null;
  const { user } = useAuth();
  const isCliente = user?.role === 'CLIENTE';

  // Panel de técnicos expandido (tecnicoId seleccionado o null)
  const [selectedTecnico, setSelectedTecnico] = useState(null);

  // Informe aprobado de la visita (solo para CLIENTE)
  const [informeStoragePath, setInformeStoragePath] = useState(null);

  useEffect(() => {
    if (!isCliente || !visitaVinculada?.id) { setInformeStoragePath(null); return; }
    let cancelled = false;
    supabase
      .from('informe')
      .select('storage_path')
      .eq('visita_id', visitaVinculada.id)
      .eq('estado', 'APROBADO')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setInformeStoragePath(data?.storage_path || null);
      });
    return () => { cancelled = true; };
  }, [isCliente, visitaVinculada?.id]);

  // Documentos de técnicos — solo se cargan si hay visita asignada y el viewer es CLIENTE
  const { documentos: docsTecnicos, loading: loadingDocs } = useDocumentosTecnicosVisita(
    isCliente && visitaVinculada ? visitaVinculada.id : null
  );

  const handleInforme = async (mode = 'view') => {
    if (!informeStoragePath) return;
    const { data } = await supabase.storage.from('inmotika').createSignedUrl(informeStoragePath, 3600);
    if (!data?.signedUrl) return;
    if (mode === 'download') {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = 'informe.pdf';
      a.click();
    } else {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-gray-50 hover:bg-brand hover:text-white rounded-md transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <H3>Traza de Solicitud</H3>
            <TextSmall className="text-gray-500">Seguimiento del estado y avance de la visita</TextSmall>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VisitStatusBadge status={sol.estadoCodigo} />
          {canEdit && (
            <Button variant="secondary" onClick={() => onEdit(sol)} className="flex items-center gap-1.5 text-sm">
              <Edit2 size={14} /> Editar
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => onRequestCancel(sol)} className="flex items-center gap-1.5 text-sm">
              <Trash2 size={14} /> Cancelar
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 space-y-4">
            <SectionHeader icon={FileText} title="Datos de la Solicitud" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={AlertCircle} label="Tipo de Mantenimiento" value={sol.tipoVisitaLabel} />
              <InfoRow icon={Building2}   label="Sucursal"              value={sol.sucursalNombre} />
              <InfoRow icon={Calendar}    label="Fecha Sugerida"        value={sol.fechaSugerida ? new Date(sol.fechaSugerida).toLocaleString('es-ES') : '—'} />
              <InfoRow icon={Clock}       label="Fecha de Solicitud"    value={sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleString('es-ES') : '—'} />
            </div>
            {sol.dispositivosNombres?.length > 0 && (
              <div>
                <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                  <Cpu size={11} /> Dispositivos solicitados
                </p>
                <div className="flex flex-wrap gap-2">
                  {sol.dispositivosNombres.map((nombre, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                      {nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {sol.motivo && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-1">Observación del solicitante</p>
                <p className="text-sm text-gray-700">{sol.motivo}</p>
              </div>
            )}
          </Card>

          {/* Visita vinculada — muestra avance real si ya fue programada */}
          {visitaVinculada ? (
            <Card className="p-5 space-y-4">
              <SectionHeader icon={Clock} title="Visita Programada" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Calendar} label="Fecha Programada"
                  value={visitaVinculada.fechaProgramada
                    ? new Date(visitaVinculada.fechaProgramada).toLocaleString('es-ES')
                    : '—'} />
                <InfoRow icon={Clock} label="Estado de la Visita"
                  value={<VisitStatusBadge status={visitaVinculada.estadoCodigo} />} />
                {visitaVinculada.fechaInicio && (
                  <InfoRow icon={Clock} label="Iniciada"
                    value={new Date(visitaVinculada.fechaInicio).toLocaleString('es-ES')} />
                )}
                {visitaVinculada.fechaFin && (
                  <InfoRow icon={Clock} label="Finalizada"
                    value={new Date(visitaVinculada.fechaFin).toLocaleString('es-ES')} />
                )}
              </div>

              {/* Técnicos asignados — misma vista para todos los roles */}
              {visitaVinculada.tecnicosNombres?.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                    <Users size={11} /> Técnicos asignados
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visitaVinculada.tecnicosNombres.map((nombre, idx) => {
                      const tec = visitaVinculada.tecnicos?.[idx];
                      const fullName = nombre;
                      const initial = fullName.charAt(0).toUpperCase();
                      const tecnicoId = tec?.tecnicoId || idx;
                      const isOpen = selectedTecnico === tecnicoId;
                      const tecDocs = docsTecnicos.filter(d => d.usuario_id === tec?.usuarioId);
                      return (
                        <div key={tecnicoId} className="rounded-xl border border-gray-100 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedTecnico(isOpen ? null : tecnicoId)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm">
                              {tec?.avatarUrl ? (
                                <SecureImage
                                  path={tec.avatarUrl}
                                  bucket="inmotika"
                                  alt={fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-brand text-white flex items-center justify-center text-sm font-black">
                                  {initial}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{fullName}</p>
                              {tec?.telefono && (
                                <p className="text-2xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Phone size={9} /> {tec.telefono}
                                </p>
                              )}
                            </div>
                            {isOpen
                              ? <ChevronUp size={13} className="text-gray-400 shrink-0" />
                              : <ChevronDown size={13} className="text-gray-400 shrink-0" />
                            }
                          </button>
                          {isOpen && (
                            <div className="px-3 py-2.5 border-t border-gray-100 bg-white">
                              <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-2">Documentos</p>
                              {loadingDocs ? (
                                <div className="space-y-1.5">
                                  {[1, 2].map(i => <div key={i} className="h-7 bg-gray-100 rounded animate-pulse" />)}
                                </div>
                              ) : tecDocs.length > 0 ? (
                                <DocumentList documentos={tecDocs} loading={false} groupByUser={false} emptyText="Sin documentos." />
                              ) : (
                                <p className="text-xs text-gray-400 italic">Sin documentos disponibles.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {visitaVinculada.dispositivos?.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-3">Avance de dispositivos</p>
                  <VisitProgressPanel
                    dispositivos={visitaVinculada.dispositivos}
                    ejecucionPasos={visitaVinculada.ejecucionPasos}
                    ejecucionActividades={visitaVinculada.ejecucionActividades}
                    deviceEvidencias={visitaVinculada.deviceEvidencias}
                  />
                </div>
              )}
              {visitaVinculada.observacionFinal && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-2xs font-bold uppercase tracking-widest text-green-600 mb-1">Observación final</p>
                  <p className="text-sm text-green-900">{visitaVinculada.observacionFinal}</p>
                </div>
              )}

              {isCliente && informeStoragePath && (
                <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                  <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 flex-1">Informe de visita</p>
                  <button
                    type="button"
                    onClick={() => handleInforme('view')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/8 text-brand hover:bg-brand/15 transition-colors text-xs font-bold"
                  >
                    <Eye size={13} /> Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInforme('download')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold"
                  >
                    <FileDown size={13} /> PDF
                  </button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center gap-3 text-gray-400">
                <Clock size={18} />
                <p className="text-sm">La solicitud aún no tiene una visita asignada. El coordinador la programará próximamente.</p>
              </div>
            </Card>
          )}

        </div>

        <div className="space-y-4">
          <Card className="p-5 bg-linear-to-br from-gray-50 to-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-gray-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-700">Información del Cliente</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{sol.clienteNombre || '—'}</p>
              <p className="text-xs text-gray-500">{sol.sucursalNombre}</p>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">Historial de Estado</p>
            <ol className="relative border-l border-gray-200 space-y-5 pl-6">
              {[
                { label: 'Solicitud enviada', active: true,                                                    fecha: sol.fechaSolicitud },
                { label: 'Visita programada', active: !!visitaVinculada,                                       fecha: visitaVinculada?.fechaProgramada || null },
                { label: 'En curso',          active: !!visitaVinculada?.fechaInicio,                          fecha: visitaVinculada?.fechaInicio || null },
                { label: 'Finalizada',        active: sol.estadoCodigo === 'COMPLETADA' || !!visitaVinculada?.fechaFin,  fecha: visitaVinculada?.fechaFin || null },
                { label: 'Cancelada',         active: sol.estadoCodigo === 'CANCELADA' || sol.estadoCodigo === 'CANCELADO', fecha: null },
              ].map((step, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-7.5 top-1 w-3 h-3 rounded-full border-2 ${
                    step.active ? 'bg-brand border-brand' : 'bg-white border-gray-300'
                  }`} />
                  <p className={`text-sm font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.fecha && (
                    <p className="text-xs text-gray-400">
                      {new Date(step.fecha).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { SolicitudForm, SolicitudDetalle };
