import React from 'react';
import { User, Building2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import NitInput from '../ui/NitInput';
import Tabs from '../ui/Tabs';
import { LocationPickerRows } from './LocationPickerRows';

const ClientForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving, activeTab, onTabChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs 
          tabs={[{key:'details', label:'Detalles generales'}, {key:'branches', label:'Sucursales'}]} 
          active={activeTab} 
          onChange={onTabChange} 
        />
        {isEditing && (
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select 
          label="Tipo de Persona" 
          value={draft.tipoPersona} 
          onChange={e => updateDraft({tipoPersona: e.target.value})} 
          options={[{value:'natural', label:'Persona Natural'}, {value:'juridica', label:'Persona Jurídica'}]} 
          viewMode={!isEditing} 
          icon={User} 
          required 
        />
        <Input 
          label="Nombre / Razón Social" 
          value={draft.nombre} 
          onChange={e => updateDraft({nombre: e.target.value})} 
          error={showErrors ? errors.nombre : null} 
          viewMode={!isEditing} 
          icon={Building2} 
          required 
        />
        <NitInput 
          label="NIT / RUT" 
          nitValue={draft.nit} 
          dvValue={draft.dv} 
          onNitChange={v => updateDraft({nit: v})} 
          onDvChange={v => updateDraft({dv: v})} 
          error={showErrors ? (errors.nit || errors.dv) : null} 
          viewMode={!isEditing} 
          required 
        />
        <LocationPickerRows 
          countryValue={draft.pais} 
          stateValue={draft.estado_depto} 
          cityValue={draft.ciudad} 
          direccion={draft.direccion} 
          onLocationChange={l => updateDraft({pais: l.country, estado_depto: l.state, ciudad: l.city})} 
          onDireccionChange={v => updateDraft({direccion: v})} 
          direccionError={showErrors ? errors.direccion : null} 
          viewMode={!isEditing} 
          required 
        />
      </div>
    </div>
  );
};

export default ClientForm;
