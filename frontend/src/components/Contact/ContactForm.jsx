import React from 'react';
import { User, IdCard, Phone, Mail, Calendar, Star } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Switch from '../ui/Switch';

const ContactForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {isEditing && (
          <Button 
            onClick={onSave} 
            disabled={isSaving}
            className="bg-gradient-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
          >
            {isSaving ? 'Guardando...' : 'GUARDAR CONTACTO'}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <Input 
          label="Nombre" 
          value={draft.nombre || ''} 
          onChange={e => updateDraft({ nombre: e.target.value })} 
          error={showErrors ? errors.nombre : null} 
          viewMode={!isEditing} 
          icon={User} 
          required 
        />
        {/* Apellido */}
        <Input 
          label="Apellido" 
          value={draft.apellido || ''} 
          onChange={e => updateDraft({ apellido: e.target.value })} 
          viewMode={!isEditing} 
          icon={User} 
        />
        {/* Tipo de documento */}
        <Select
          label="Tipo de documento"
          value={draft.tipoDocumento || ''}
          onChange={e => updateDraft({ tipoDocumento: e.target.value })}
          options={[
            { value: 'cc', label: 'Cédula de ciudadanía' },
            { value: 'ce', label: 'Cédula de extranjería' },
            { value: 'ti', label: 'Tarjeta de identidad' },
            { value: 'pasaporte', label: 'Pasaporte' }
          ]}
          viewMode={!isEditing}
          icon={IdCard}
        />
        {/* Número de documento */}
        <Input 
          label="Número de documento" 
          value={draft.numeroDocumento || ''} 
          onChange={e => updateDraft({ numeroDocumento: e.target.value })} 
          viewMode={!isEditing} 
          icon={IdCard} 
        />
        {/* Fecha de nacimiento */}
        <Input 
          label="Fecha de nacimiento" 
          type="date"
          value={draft.fechaCumpleanos || ''} 
          onChange={e => updateDraft({ fechaCumpleanos: e.target.value })} 
          viewMode={!isEditing} 
          icon={Calendar} 
        />
        {/* Correo */}
        <Input 
          label="Correo" 
          value={draft.email || ''} 
          onChange={e => updateDraft({ email: e.target.value })} 
          error={showErrors ? errors.email : null} 
          viewMode={!isEditing} 
          icon={Mail} 
        />
        {/* Celular */}
        <Input 
          label="Celular" 
          value={draft.telefonoMovil || ''} 
          onChange={e => updateDraft({ telefonoMovil: e.target.value })} 
          error={showErrors ? errors.telefonoMovil : null} 
          viewMode={!isEditing} 
          icon={Phone} 
          required 
        />
        {/* Contacto principal y Estado */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <Switch
              label="Principal"
              checked={!!draft.esPrincipal}
              onChange={(checked) => updateDraft({ esPrincipal: checked })}
              icon={Star}
              viewMode={!isEditing}
            />
          </div>
          <div className="flex items-center">
            <Switch
              label="Estado del contacto"
              checked={draft.estatus === 'activo'}
              onChange={(checked) => updateDraft({ estatus: checked ? 'activo' : 'inactivo' })}
              viewMode={!isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
