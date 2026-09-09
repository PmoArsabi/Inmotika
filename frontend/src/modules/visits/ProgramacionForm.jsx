/**
 * Componentes de presentación para ProgramacionVisitaPage:
 *   - ProgramacionForm   — formulario de programar / editar visita
 *   - ProgramacionDetalle — vista de detalle de visita/solicitud
 */
import { useState } from 'react';
import {
  ArrowLeft, Save, Edit,
  Calendar, Building2, User, AlertCircle, Users, Cpu, CalendarCheck, Plus, Tag,
  History,
} from 'lucide-react';
import { H2, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CheckSelect } from '../../components/shared/FilterBar';
import InfoRow from '../../components/ui/InfoRow';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import DevicePickerModal from '../../components/shared/DevicePickerModal';

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Formatea un ISO string a formato legible en español.
 * @param {string|null} iso
 * @returns {string}
 */
const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Encabezado de sección dentro de un Card.
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

/**
 * Lista de altas/bajas de dispositivos asociadas a una visita.
 * @param {{ items: Array<{ id: string, accion: string, motivo: string|null, createdAt: string, dispositivoLabel: string, usuarioNombre: string }> }} props
 */
export const HistorialDispositivosList = ({ items }) => {
  if (!items?.length) {
    return (
      <TextTiny className="text-gray-400 italic">Aún no hay cambios registrados de asignación.</TextTiny>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(h => (
        <div key={h.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${
                h.accion === 'AGREGADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {h.accion === 'AGREGADO' ? 'Agregado' : 'Retirado'}
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-gray-100 text-gray-600">
                {h.tipoEntidad === 'TECNICO' ? 'Técnico' : 'Dispositivo'}
              </span>
            </div>
            <TextTiny className="text-gray-400 whitespace-nowrap">
              {new Date(h.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
            </TextTiny>
          </div>
          <TextSmall className="font-semibold text-gray-800">{h.entidadLabel || h.dispositivoLabel}</TextSmall>
          <TextTiny className="text-gray-500 block">{h.usuarioNombre}</TextTiny>
          {h.motivo && (
            <TextTiny className="text-gray-600 italic block mt-1">“{h.motivo}”</TextTiny>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── ProgramacionForm ─────────────────────────────────────────────────────────

/**
 * Formulario para programar una visita nueva o editar una existente.
 * @param {{
 *   draft: Object,
 *   updateDraft: (patch: Object) => void,
 *   onSave: () => void,
 *   onCancel: () => void,
 *   saving: boolean,
 *   isEditing: boolean,
 *   solicitudOrigen: Object|null,
 *   tecnicosOptions: Array,
 *   dispositivosDisponibles: Array,
 *   inProgressEdit: boolean,
 *   historial: Array,
 * }} props
 */
export const ProgramacionForm = ({
  draft, updateDraft, onSave, onCancel, saving,
  isEditing, solicitudOrigen, tecnicosOptions, dispositivosDisponibles,
  inProgressEdit = false,
  historial = [],
}) => {
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const devicesChanged = JSON.stringify([...(draft.dispositivoIdsIniciales || [])].sort())
    !== JSON.stringify([...(draft.dispositivoIds || [])].sort());
  const tecnicosChanged = JSON.stringify([...(draft.tecnicoIdsIniciales || [])].sort())
    !== JSON.stringify([...(draft.tecnicoIds || [])].sort());
  const assignmentChanged = devicesChanged || tecnicosChanged;
  const saveDisabled = saving
    || !draft.fechaProgramada
    || draft.tecnicoIds.length === 0
    || (inProgressEdit && assignmentChanged && !draft.motivoCambio?.trim())
    || (inProgressEdit && (draft.dispositivoIds || []).length === 0);

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
            <H2>{inProgressEdit ? 'Editar asignación' : isEditing ? 'Editar Programación' : 'Programar Visita'}</H2>
            <TextSmall className="text-gray-500">
              {inProgressEdit
                ? 'La visita ya está en progreso. Puedes cambiar técnicos y dispositivos asociados.'
                : solicitudOrigen
                  ? `Origen: solicitud ${solicitudOrigen.id.slice(0, 8)}...`
                  : 'Sin solicitud origen'}
            </TextSmall>
          </div>
        </div>
        <Button
          onClick={onSave}
          disabled={saveDisabled}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Programar Visita'}
        </Button>
      </header>

      {inProgressEdit && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <TextTiny className="text-blue-800">
            Fecha y observaciones quedan bloqueadas. Cada cambio de técnico o dispositivo
            queda registrado en el historial de la visita.
          </TextTiny>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Técnicos */}
          <Card className="p-5 space-y-4">
            <CardSection icon={Users} title="Asignación de Técnicos" />
            <CheckSelect
              placeholder="Asignar técnicos..."
              options={tecnicosOptions}
              value={draft.tecnicoIds}
              onChange={ids => updateDraft({ tecnicoIds: ids })}
            />
            {draft.tecnicoIds.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <TextTiny className="text-red-700 font-semibold">
                  Debes asignar al menos un técnico para poder programar la visita.
                </TextTiny>
              </div>
            )}
          </Card>

          {/* Dispositivos */}
          {solicitudOrigen && (
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <CardSection icon={Cpu} title="Dispositivos a Revisar" />
                <button
                  type="button"
                  onClick={() => setDevicePickerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand border border-brand/30 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Plus size={12} /> Seleccionar
                </button>
              </div>

              {draft.dispositivoIds.length === 0 ? (
                <TextTiny className="text-gray-400 italic">
                  {dispositivosDisponibles.length === 0
                    ? 'No hay dispositivos registrados para esta sucursal.'
                    : 'Ningún dispositivo seleccionado. Haz clic en "Seleccionar".'}
                </TextTiny>
              ) : (
                /* Seleccionados agrupados por categoría */
                (() => {
                  const seleccionados = dispositivosDisponibles.filter(d =>
                    draft.dispositivoIds.includes(d.value)
                  );
                  const porCategoria = seleccionados.reduce((acc, d) => {
                    const cat = d.categoria || 'Sin categoría';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(d);
                    return acc;
                  }, {});
                  return (
                    <div className="space-y-3">
                      {Object.entries(porCategoria).map(([cat, devs]) => (
                        <div key={cat}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Tag size={10} className="text-blue-500" />
                            <TextTiny className="font-bold text-blue-600 uppercase tracking-wide">{cat}</TextTiny>
                          </div>
                          <div className="space-y-1 pl-3">
                            {devs.map(d => (
                              <div key={d.value} className="flex items-center justify-between py-1 border-b border-gray-50">
                                <div className="min-w-0">
                                  <TextSmall className="font-semibold truncate">{d.label}</TextSmall>
                                  {(d.marca || d.modelo) && (
                                    <TextTiny className="text-gray-400">{[d.marca, d.modelo].filter(Boolean).join(' · ')}</TextTiny>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              <TextTiny className="text-gray-400">
                {draft.dispositivoIds.length} dispositivo{draft.dispositivoIds.length !== 1 ? 's' : ''} seleccionado{draft.dispositivoIds.length !== 1 ? 's' : ''}
              </TextTiny>

              <DevicePickerModal
                isOpen={devicePickerOpen}
                onClose={() => setDevicePickerOpen(false)}
                devices={dispositivosDisponibles}
                selected={draft.dispositivoIds}
                onConfirm={ids => updateDraft({ dispositivoIds: ids })}
              />
            </Card>
          )}

          {inProgressEdit && (
            <Card className="p-5 space-y-2">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Motivo del cambio {assignmentChanged && <span className="text-red-500">*</span>}
              </Label>
              <textarea
                value={draft.motivoCambio || ''}
                onChange={e => updateDraft({ motivoCambio: e.target.value })}
                rows={3}
                placeholder="Ej: El técnico asignado no pudo continuar por enfermedad / se asoció un equipo que no aplica."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all"
              />
              {assignmentChanged && !draft.motivoCambio?.trim() && (
                <TextTiny className="text-red-500">Indica el motivo para dejar constancia del cambio.</TextTiny>
              )}
            </Card>
          )}

          {/* Fecha programada */}
          <Card className={`p-5 space-y-4 ${inProgressEdit ? 'opacity-70' : ''}`}>
            <CardSection icon={Calendar} title="Fecha Programada" />
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                Fecha y Hora <span className="text-red-500">*</span>
              </Label>
              <input
                type="datetime-local"
                value={draft.fechaProgramada}
                onChange={e => updateDraft({ fechaProgramada: e.target.value })}
                disabled={inProgressEdit}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!draft.fechaProgramada && (
                <TextTiny className="text-red-500 mt-1">Este campo es obligatorio.</TextTiny>
              )}
            </div>
          </Card>

          {/* Observaciones */}
          <Card className={`p-5 space-y-2 ${inProgressEdit ? 'opacity-70' : ''}`}>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
              Observaciones del Coordinador
            </Label>
            <textarea
              value={draft.observaciones}
              onChange={e => updateDraft({ observaciones: e.target.value })}
              disabled={inProgressEdit}
              rows={3}
              placeholder="Instrucciones adicionales, acceso al sitio, contacto en sitio..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {solicitudOrigen && (
            <Card className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-blue-600" />
                <Label className="text-sm font-bold text-blue-900">Solicitud Origen</Label>
              </div>
              <div className="space-y-2">
                <InfoRow icon={Building2} label="Cliente"       value={solicitudOrigen.clienteNombre} />
                <InfoRow icon={Building2} label="Sucursal"      value={solicitudOrigen.sucursalNombre} />
                <InfoRow icon={AlertCircle} label="Tipo Visita" value={solicitudOrigen.tipoVisitaLabel} />
                <InfoRow icon={Calendar}  label="Fecha sugerida" value={fmtDateTime(solicitudOrigen.fechaSugerida)} />
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
              <InfoRow icon={Cpu} label="Dispositivos"
                value={`${draft.dispositivoIds.length} seleccionado${draft.dispositivoIds.length !== 1 ? 's' : ''}`} />
            </div>
          </Card>

          {isEditing && (
            <Card className="p-5 space-y-3">
              <CardSection icon={History} title="Historial de asignación" />
              <HistorialDispositivosList items={historial} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ProgramacionDetalle ──────────────────────────────────────────────────────

/**
 * Vista de detalle de una visita o solicitud de programación.
 * @param {{
 *   item: Object,
 *   solicitudOrigen: Object|null,
 *   onBack: () => void,
 *   onEdit: (item: Object) => void,
 *   historial?: Array,
 * }} props
 */
export const ProgramacionDetalle = ({ item, solicitudOrigen, onBack, onEdit, historial = [] }) => {
  const canEdit = item._type === 'solicitud'
    ? item.estadoCodigo === 'PENDIENTE'
    : item.esEditable || item.estadoCodigo === 'EN_PROGRESO';
  const dispositivos = item.dispositivos || [];

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
            <H2>{item.tipoVisitaLabel || item.tipoVisitaCodigo || 'Visita'}</H2>
            <TextSmall className="text-gray-500">
              {item.clienteNombre} — {item.sucursalNombre}
            </TextSmall>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <VisitStatusBadge status={item.estadoCodigo} />
          {canEdit && (
            <Button onClick={() => onEdit(item)} className="flex items-center gap-2">
              <Edit size={14} /> {item.estadoCodigo === 'EN_PROGRESO' ? 'Editar asignación' : 'Editar'}
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 space-y-4">
            <CardSection icon={CalendarCheck} title="Datos de la Visita" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={AlertCircle} label="Tipo"      value={item.tipoVisitaLabel || item.tipoVisitaCodigo || '—'} />
              <InfoRow icon={Building2}   label="Sucursal"  value={item.sucursalNombre} />
              {item._type === 'visita' && (
                <>
                  <InfoRow icon={Calendar} label="Fecha Programada" value={fmtDateTime(item.fechaProgramada)} />
                  <InfoRow icon={Calendar} label="Fecha Inicio"     value={fmtDateTime(item.fechaInicio)} />
                  <InfoRow icon={Calendar} label="Fecha Fin"        value={fmtDateTime(item.fechaFin)} />
                  <InfoRow icon={User}     label="Técnicos"         value={item.tecnicosNombres?.join(', ') || '—'} />
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

          {(dispositivos.length > 0 || item._type === 'visita') && (
            <Card className="p-5 space-y-3">
              <CardSection icon={Cpu} title="Dispositivos asociados" />
              {dispositivos.length === 0 ? (
                <TextTiny className="text-gray-400 italic">Sin dispositivos asociados.</TextTiny>
              ) : (
                <div className="space-y-1">
                  {dispositivos.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-none">
                      <div>
                        <TextSmall className="font-semibold">{d.label || d.serial || d.id}</TextSmall>
                        {(d.categoria || d.modelo) && (
                          <TextTiny className="text-gray-400">{[d.categoria, d.modelo].filter(Boolean).join(' · ')}</TextTiny>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {solicitudOrigen && item._type === 'visita' && (
            <Card className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-blue-600" />
                <Label className="text-sm font-bold text-blue-900">Solicitud Origen</Label>
              </div>
              <InfoRow icon={Building2}   label="Cliente"          value={solicitudOrigen.clienteNombre} />
              <InfoRow icon={Building2}   label="Sucursal"         value={solicitudOrigen.sucursalNombre} />
              <InfoRow icon={Calendar}    label="Solicitada el"
                value={solicitudOrigen.fechaSolicitud
                  ? new Date(solicitudOrigen.fechaSolicitud).toLocaleDateString('es-ES')
                  : '—'} />
              <InfoRow icon={AlertCircle} label="Tipo Solicitado"  value={solicitudOrigen.tipoVisitaLabel} />
              <VisitStatusBadge status={solicitudOrigen.estadoCodigo} />
            </Card>
          )}

          {item._type === 'visita' && (
            <Card className="p-5 space-y-3">
              <CardSection icon={History} title="Historial de asignación" />
              <HistorialDispositivosList items={historial} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
