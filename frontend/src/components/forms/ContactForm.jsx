import React from 'react';
import { User, Briefcase, Phone, Mail } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ContactForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {isEditing && (
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Nombre del Contacto" 
          value={draft.nombre} 
          onChange={e => updateDraft({nombre: e.target.value})} 
          error={showErrors ? errors.nombre : null} 
          viewMode={!isEditing} 
          icon={User} 
          required 
        />
        <Input 
          label="Cargo / Puesto" 
          value={draft.puesto} 
          onChange={e => updateDraft({puesto: e.target.value})} 
          viewMode={!isEditing} 
          icon={Briefcase} 
        />
        <Input 
          label="Teléfono Móvil" 
          value={draft.telefonoMovil} 
          onChange={e => updateDraft({telefonoMovil: e.target.value})} 
          error={showErrors ? errors.telefonoMovil : null} 
          viewMode={!isEditing} 
          icon={Phone} 
          required 
        />
        <Input 
          label="Email" 
          value={draft.email} 
          onChange={e => updateDraft({email: e.target.value})} 
          error={showErrors ? errors.email : null} 
          viewMode={!isEditing} 
          icon={Mail} 
        />
      </div>
    </div>
  );
};

export default ContactForm;
