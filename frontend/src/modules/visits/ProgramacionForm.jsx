/**
 * Componentes de presentación para ProgramacionVisitaPage:
 *   - ProgramacionForm   — formulario de programar / editar visita
 *   - ProgramacionDetalle — vista de detalle de visita/solicitud
 */
import { useState } from 'react';
import {
  ArrowLeft, Save, Edit,
  Calendar, Building2, User, AlertCircle, Users, Cpu, CalendarCheck, Plus, Tag,
} from 'lucide-react';
import { H2, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
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
 * }} props
 */
export const ProgramacionForm = ({
  draft, updateDraft, onSave, onCancel, saving,
  isEditing, solicitudOrigen, tecnicosOptions, dispositivosDisponibles,
}) => {
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const tecnicosSeleccionados = draft.tecnicoIds.map(id => ({
    value: id,
    label: tecnicosOptions.find(o => o.value === id)?.label || id,
  }));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
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
          onClick={onSave}
          disabled={saving || !draft.fechaProgramada || draft.tecnicoIds.length === 0}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Programar Visita'}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D32F2F] border border-[#D32F2F]/30 rounded-lg hover:bg-red-50 transition-colors"
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
            </div>
          </Card>
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
 * }} props
 */
export const ProgramacionDetalle = ({ item, solicitudOrigen, onBack, onEdit }) => {
  const canEdit = item._type === 'visita' ? item.esEditable : item.estadoCodigo === 'PENDIENTE';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
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
          <VisitStatusBadge status={item.estadoCodigo} />
          {canEdit && (
            <Button onClick={() => onEdit(item)} className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
};
