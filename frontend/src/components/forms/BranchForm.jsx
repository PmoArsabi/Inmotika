import React from 'react';
import { 
  Building2, MapPin, Navigation, Link2, Eye,
  Plus, Calendar
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import { LocationPickerRows } from './LocationPickerRows';
import SchedulePicker from '../ui/SchedulePicker';
import DynamicDocumentList from '../ui/DynamicDocumentList';
import { Subtitle, TextSmall, Label } from '../ui/Typography';

/**
 * Formulario dedicado para la creación y edición de sucursales (sedes).
 * Extraído de ClientForm para mejorar la modularidad.
 */
export const BranchForm = (props) => {
  console.log('BranchForm render props:', { editingBranchId: props.editingBranchId, hasDraft: !!props.newBranchDraft, viewBranchMode: props.viewBranchMode });
  const {
    newBranchDraft, updateNewBranchDraft, newBranchErrors = {}, onSaveNewBranch,
    isEditing, isSaving, editingBranchId, onCancelEdit,
    onAssociateContacts, onAssociateDevices, showErrors,
    estadoSelectOptions, activoId, inactivoId, clientId, viewBranchMode
  } = props;

  if (!newBranchDraft) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Subtitle className="text-gray-700">
          {editingBranchId ? 'Editar Sucursal' : 'Nueva Sucursal'}
        </Subtitle>
        <div className="flex gap-2">
          {editingBranchId && onCancelEdit && (
            <Button onClick={onCancelEdit} className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancelar
            </Button>
          )}
          <Button
            onClick={onSaveNewBranch}
            disabled={isSaving}
            className={`${!isEditing ? 'hidden' : ''} bg-linear-to-r from-[#D32F2F] to-[#8B0000] text-white border-0`}
          >
            {isSaving ? 'Guardando...' : (editingBranchId ? 'Guardar Cambios' : 'Crear Sucursal')}
          </Button>
        </div>
      </div>

      {/* Datos principales — nombre a la izquierda, sede+estado llenan la derecha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre Sucursal"
          icon={Building2}
          value={newBranchDraft.nombre || ''}
          onChange={e => updateNewBranchDraft({ nombre: e.target.value.toUpperCase() })}
          error={showErrors ? newBranchErrors.nombre : null}
          uppercase
          required
          viewMode={!isEditing}
        />
        <div className="flex items-end gap-4">
          <div className="shrink-0">
            <Switch
              label="Sede Principal"
              checked={!!newBranchDraft.esPrincipal}
              onChange={checked => updateNewBranchDraft({ esPrincipal: checked })}
              checkedLabel="Sí"
              uncheckedLabel="No"
              disabled={!isEditing}
            />
          </div>
          <div className="flex-1 min-w-0">
            <Switch
              label="Estado"
              checked={!!activoId && newBranchDraft.estadoId === activoId}
              onChange={checked => updateNewBranchDraft({ estadoId: checked ? activoId : inactivoId })}
              checkedLabel="Activo"
              uncheckedLabel="Inactivo"
              viewMode={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* Ubicación — 2 columnas: País+Estado / Ciudad+Dirección / Latitud+Longitud */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationPickerRows
          countryValue={newBranchDraft.pais}
          stateValue={newBranchDraft.estado_depto}
          cityValue={newBranchDraft.ciudad}
          direccion={newBranchDraft.direccion}
          onLocationChange={l => updateNewBranchDraft({ pais: l.country, estado_depto: l.state, ciudad: l.city })}
          onDireccionChange={v => updateNewBranchDraft({ direccion: v })}
          direccionError={showErrors ? newBranchErrors.direccion : null}
          required
          showDireccion
          twoColumns
          viewMode={!isEditing}
        />
        <Input
          label="Latitud (Opcional)"
          icon={Navigation}
          value={newBranchDraft.latitud || ''}
          onChange={e => updateNewBranchDraft({ latitud: e.target.value })}
          placeholder="Ej: 4.710989"
          inputMode="decimal"
          viewMode={!isEditing}
        />
        <Input
          label="Longitud (Opcional)"
          icon={Navigation}
          value={newBranchDraft.longitud || ''}
          onChange={e => updateNewBranchDraft({ longitud: e.target.value })}
          placeholder="Ej: -74.072090"
          inputMode="decimal"
          viewMode={!isEditing}
        />
      </div>

      {/* Horario de Atención */}
      <div className="pt-4 border-t border-gray-200">
        <SchedulePicker
          label="Horario de Atención"
          value={newBranchDraft.horarioAtencion || null}
          onChange={v => updateNewBranchDraft({ horarioAtencion: v })}
          viewMode={!isEditing}
        />
      </div>

      {/* Asociaciones */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <Subtitle className="text-gray-700">Asociaciones</Subtitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Asociar contactos', sub: 'Relaciona contactos responsables a esta sucursal.', count: newBranchDraft?.associatedContactIds?.length, onClick: onAssociateContacts },
            { label: 'Asociar dispositivos', sub: 'Vincula los dispositivos instalados.', count: newBranchDraft?.associatedDeviceIds?.length, onClick: onAssociateDevices },
          ].map(({ label, sub, count, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              disabled={!isEditing && (!count || count === 0)}
              className={`flex items-center justify-between p-4 rounded-lg border border-gray-200 transition-all text-left w-full group
                ${isEditing || count > 0 ? "bg-gray-50 hover:bg-white hover:border-[#D32F2F] hover:shadow-sm cursor-pointer" : "bg-gray-50 opacity-70 cursor-not-allowed"}`}
            >
              <div className="flex-1 min-w-0">
                <TextSmall className={`font-semibold text-gray-900 transition-colors ${isEditing || count > 0 ? "group-hover:text-[#D32F2F]" : ""}`}>{label}</TextSmall>
                <TextSmall className="text-gray-500 mt-0.5">
                  {count > 0
                    ? <span className="text-[#D32F2F] font-semibold">{count} asociado{count !== 1 ? 's' : ''}</span>
                    : sub
                  }
                </TextSmall>
              </div>
              {(isEditing || count > 0) && (
                <div className="ml-3 flex items-center gap-1.5 shrink-0 px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md text-xs font-bold uppercase tracking-wide group-hover:bg-[#D32F2F] transition-colors shadow-sm">
                  {isEditing ? <><Link2 size={12} /> Asociar</> : <><Eye size={12} /> Ver</>}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contratos */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <DynamicDocumentList
          title="Contratos"
          addButtonLabel="Agregar Contrato"
          items={(newBranchDraft.contratos || []).map(c => ({
            ...c,
            nombre: c.tema || '',
            url: c.documentoUrl || '',
            fechaInicio: c.fechaInicio || '',
            fechaFin: c.fechaFin || '',
          }))}
          onChange={(newItems) => {
            updateNewBranchDraft({
              contratos: newItems.map(item => ({
                id: item.id,
                tema: item.nombre,
                documentoUrl: item.url,
                fechaInicio: item.fechaInicio || '',
                fechaFin: item.fechaFin || '',
              }))
            });
          }}
          viewMode={!isEditing}
          storagePathPrefix={null}
          deferred
          renderExtraFields={(item, updateRow) => isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Fecha inicio</Label>
                <input
                  type="date"
                  value={item.fechaInicio || ''}
                  onChange={e => updateRow({ fechaInicio: e.target.value || '' })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Fecha fin</Label>
                <input
                  type="date"
                  value={item.fechaFin || ''}
                  onChange={e => updateRow({ fechaFin: e.target.value || '' })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]"
                />
              </div>
            </div>
          ) : (item.fechaInicio || item.fechaFin) ? (
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {item.fechaInicio && (
                <span><Calendar size={12} className="inline mr-1" />Inicio: {new Date(item.fechaInicio).toLocaleDateString('es-CO')}</span>
              )}
              {item.fechaFin && (
                <span><Calendar size={12} className="inline mr-1" />Fin: {new Date(item.fechaFin).toLocaleDateString('es-CO')}</span>
              )}
            </div>
          ) : null}
        />
      </div>
    </div>
  );
};

export default BranchForm;
