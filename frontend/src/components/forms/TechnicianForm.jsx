import React from 'react';
import { User, Hash, Briefcase, MapPin, Building2, Activity, Phone, Mail } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { H2, Label } from '../ui/Typography';

const TechnicianForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving
}) => {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
        <H2 className="text-gray-900 normal-case">{isEditing ? 'EDITAR TÉCNICO' : `VER TÉCNICO — ${draft.nombre || 'NUEVO'}`}</H2>
        {isEditing && <Button onClick={onSave} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Técnico'}</Button>}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <User size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">1. Información del Técnico</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Nombre del Técnico" value={draft.nombre} onChange={e => updateDraft({nombre: e.target.value})} error={showErrors ? errors.nombre : null} viewMode={!isEditing} icon={User} required />
          <Input label="Documento / ID" value={draft.identificacion} onChange={e => updateDraft({identificacion: e.target.value})} error={showErrors ? errors.identificacion : null} viewMode={!isEditing} icon={Hash} required />
          <Input label="Especialidad" value={draft.especialidad} onChange={e => updateDraft({especialidad: e.target.value})} viewMode={!isEditing} icon={Briefcase} />
          <Input label="Zona / Región" value={draft.zona} onChange={e => updateDraft({zona: e.target.value})} viewMode={!isEditing} icon={MapPin} />
          <Input label="Ciudad" value={draft.ciudad} onChange={e => updateDraft({ciudad: e.target.value})} viewMode={!isEditing} icon={Building2} />
          <Select label="Estado" value={draft.estado} onChange={e => updateDraft({estado: e.target.value})} viewMode={!isEditing} options={[{value:'Activo', label:'Activo'}, {value:'Inactivo', label:'Inactivo'}]} icon={Activity} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Mail size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">2. Datos de Contacto</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Teléfono / Celular" value={draft.celular} onChange={e => updateDraft({celular: e.target.value})} error={showErrors ? errors.celular : null} viewMode={!isEditing} icon={Phone} required />
          <Input label="Correo Electrónico" value={draft.correo} onChange={e => updateDraft({correo: e.target.value})} error={showErrors ? errors.correo : null} viewMode={!isEditing} icon={Mail} />
        </div>
      </section>
    </div>
  );
};

export default TechnicianForm;
