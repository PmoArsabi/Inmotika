import React from 'react';
import { Building2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Tabs from '../ui/Tabs';
import { LocationPickerRows } from './LocationPickerRows';

const BranchForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving, activeTab, onTabChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs 
          tabs={[
            {key:'details', label:'Detalles'}, 
            {key:'contacts', label:'Contactos'}, 
            {key:'devices', label:'Dispositivos'}
          ]} 
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
        <Input 
          label="Nombre de Sucursal" 
          value={draft.nombre} 
          onChange={e => updateDraft({nombre: e.target.value})} 
          error={showErrors ? errors.nombre : null} 
          viewMode={!isEditing} 
          icon={Building2} 
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

export default BranchForm;
