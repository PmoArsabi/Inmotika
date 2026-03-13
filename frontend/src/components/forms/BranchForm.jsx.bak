import React from 'react';
import { Building2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Tabs from '../ui/Tabs';
import { LocationPickerRows } from './LocationPickerRows';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { TextSmall, Subtitle } from '../ui/Typography';
import { User, Phone, Mail, Cpu, Settings } from 'lucide-react';

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
      {activeTab === 'details' && (
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
      )}

      {activeTab === 'contacts' && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <Table>
            <THead variant="dark">
              <tr>
                <Th>Nombre</Th>
                <Th>Cargo / Rol</Th>
                <Th>Contacto</Th>
              </tr>
            </THead>
            <TBody>
              {draft.contactos && draft.contactos.length > 0 ? (
                draft.contactos.map((contact, idx) => (
                  <Tr key={idx}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{contact.nombre} {contact.apellido}</span>
                      </div>
                    </Td>
                    <Td>{contact.cargo || contact.tipo || '—'}</Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={13} className="shrink-0" />
                          <TextSmall>{contact.telefono || contact.celular || '—'}</TextSmall>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={13} className="shrink-0" />
                          <TextSmall>{contact.email || '—'}</TextSmall>
                        </div>
                      </div>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr><Td colSpan={3} className="text-center text-gray-400 py-6">No hay contactos registrados</Td></Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <Table>
            <THead variant="dark">
              <tr>
                <Th>Dispositivo / Modelo</Th>
                <Th>Categoría</Th>
                <Th>Serial / Ref</Th>
              </tr>
            </THead>
            <TBody>
              {draft.dispositivos && draft.dispositivos.length > 0 ? (
                draft.dispositivos.map((dev, idx) => (
                  <Tr key={idx}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{dev.nombre} {dev.modelo}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        {dev.categoria || '—'}
                      </span>
                    </Td>
                    <Td>
                      <TextSmall className="font-mono text-gray-600 border border-gray-200 bg-gray-50 px-1 py-0.5 rounded inline-block">
                        {dev.serial || '—'}
                      </TextSmall>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr><Td colSpan={3} className="text-center text-gray-400 py-6">No hay dispositivos instalados</Td></Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default BranchForm;
