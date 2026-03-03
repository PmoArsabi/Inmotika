import React, { useState, useMemo } from 'react';
import { User, Building2, MapPin, Phone, Mail, Hash, Briefcase, Camera, Plus, Eye, Edit2, Search } from 'lucide-react';
import { Country } from 'country-state-city';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import NitInput from '../../ui/NitInput';
import Switch from '../../ui/Switch';
import Checkbox from '../../ui/Checkbox';
import Tabs from '../../ui/Tabs';
import { LocationPickerRows } from '../../forms/LocationPickerRows';
import Card from '../../ui/Card';
import { TextSmall, Subtitle } from '../../ui/Typography';
import { Table, THead, TBody, Tr, Th, Td } from '../../ui/Table';
import IconButton from '../../ui/IconButton';

const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

const ClientForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving, activeTab, onTabChange,
  branches = [], onNewBranch, onEditBranch, onViewBranch,
  newBranchDraft, updateNewBranchDraft, newBranchErrors, onSaveNewBranch,
  onAssociateContacts,
  onAssociateDevices,
  totalSucursales = 0,
  totalContactos = 0,
  totalDispositivos = 0,
  editingBranchId = null,
  onCancelEdit = null,
}) => {
  const getTipoPersonaLabel = (tipo) => {
    return tipo === 'juridica' ? 'Persona Jurídica' : tipo === 'natural' ? 'Persona Natural' : 'No especificado';
  };

  const getCountryName = (countryCode) => {
    if (!countryCode) return '';
    const country = ALL_COUNTRIES?.find(c => c.value === countryCode);
    return country?.label || countryCode;
  };

  // Estado para el buscador de sucursales
  const [branchSearchQuery, setBranchSearchQuery] = useState('');

  // Filtrar sucursales por clave, nombre o país
  const filteredBranches = useMemo(() => {
    if (!branchSearchQuery.trim()) return branches;
    
    const query = branchSearchQuery.toLowerCase().trim();
    return branches.filter(branch => {
      const nombre = (branch.nombre || '').toLowerCase();
      const id = (branch.id || '').toLowerCase();
      const pais = getCountryName(branch.pais || '').toLowerCase();
      
      return nombre.includes(query) || 
             id.includes(query) || 
             pais.includes(query);
    });
  }, [branches, branchSearchQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Left Column - Client Preview/Summary */}
      <div className="lg:col-span-1">
        <Card className="p-6 space-y-6 h-full">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D32F2F] to-[#8B0000] rounded-full flex items-center justify-center shadow-lg">
                <Building2 size={32} className="text-white" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                  <Camera size={16} className="text-gray-700" />
                </button>
              )}
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">
                {draft.nombre || 'Nuevo Cliente'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {getTipoPersonaLabel(draft.tipoPersona)}
              </p>
            </div>
          </div>

          {/* Client Info Summary - Solo informativo */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <Hash size={18} className="text-gray-400 mt-0.5" />
              <div>
                <TextSmall className="text-gray-500">NIT / RUT</TextSmall>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {draft.nit ? `${draft.nit}${draft.dv ? `-${draft.dv}` : ''}` : 'No registrado'}
                </p>
              </div>
            </div>
            {draft.direccion && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Dirección</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{draft.direccion}</p>
                </div>
              </div>
            )}
            {draft.email && (
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Email</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{draft.email}</p>
                </div>
              </div>
            )}
            {draft.telefono && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Teléfono</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{draft.telefono}</p>
                </div>
              </div>
            )}
            {draft.ciudad && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Ubicación</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {draft.ciudad}{draft.estado_depto ? `, ${draft.estado_depto}` : ''}
                    {draft.pais ? ` - ${getCountryName(draft.pais)}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics or Additional Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#D32F2F]">{totalSucursales}</p>
                <TextSmall className="text-gray-500 mt-1">Sucursales</TextSmall>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{totalContactos}</p>
                <TextSmall className="text-gray-500 mt-1">Contactos</TextSmall>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{totalDispositivos}</p>
                <TextSmall className="text-gray-500 mt-1">Dispositivos</TextSmall>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column - Form */}
      <div className="lg:col-span-2">
        <Card className="p-6 h-full flex flex-col">
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 flex-shrink-0">
              <Tabs 
                tabs={[
                  {key:'details', label:'Paso 1 Detalle General'}, 
                  {key:'branches', label:'Paso 2 Sucursal'}
                ]} 
                active={activeTab} 
                onChange={onTabChange} 
              />
            </div>

            {/* Form Fields */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                {isEditing && (
                  <div className="flex items-center justify-between">
                    <Subtitle className="text-gray-700">Detalles generales</Subtitle>
                    <Button 
                      onClick={onSave} 
                      disabled={isSaving}
                      className="bg-gradient-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={draft.nombre || ''} 
                    onChange={e => updateDraft({nombre: e.target.value.toUpperCase()})} 
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
                  <Input
                    label="Dirección Física"
                    icon={MapPin}
                    value={draft.direccion || ''}
                    onChange={(e) => updateDraft({direccion: e.target.value})}
                    error={showErrors ? errors.direccion : null}
                    viewMode={!isEditing}
                    required
                  />
                  <Input 
                    label="Email" 
                    value={draft.email || ''} 
                    onChange={e => updateDraft({email: e.target.value.toLowerCase()})} 
                    error={showErrors ? errors.email : null} 
                    viewMode={!isEditing} 
                    icon={Mail} 
                    type="email"
                  />
                  <Input 
                    label="Teléfono" 
                    value={draft.telefono || ''} 
                    onChange={e => updateDraft({telefono: e.target.value.toUpperCase()})} 
                    error={showErrors ? errors.telefono : null} 
                    viewMode={!isEditing} 
                    icon={Phone} 
                    type="tel"
                  />
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        showDireccion={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Branches Tab */}
            {activeTab === 'branches' && (
              (newBranchDraft || (branches.length === 0 && isEditing)) ? (
                // Mostrar formulario de nueva sucursal cuando no hay sucursales o cuando se está editando
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Subtitle className="text-gray-700">
                      {editingBranchId ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </Subtitle>
                    <div className="flex gap-2">
                      {editingBranchId && onCancelEdit && (
                        <Button 
                          onClick={onCancelEdit}
                          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button 
                        onClick={onSaveNewBranch}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
                      >
                        {isSaving ? 'Guardando...' : editingBranchId ? 'Guardar Cambios' : 'Guardar Sucursal'}
                      </Button>
                    </div>
                  </div>

                  {/* Datos principales de la sucursal */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Nombre de sucursal ocupa 2 columnas en escritorio */}
                    <div className="md:col-span-2">
                      <Input
                        label="Nombre Sucursal"
                        icon={Building2}
                        value={newBranchDraft.nombre || ''}
                        onChange={(e) => updateNewBranchDraft({nombre: e.target.value.toUpperCase()})}
                        error={showErrors ? newBranchErrors.nombre : null}
                        required
                      />
                    </div>

                    {/* Sucursal principal en la tercera columna */}
                    <div className="md:col-span-1 flex items-center">
                      <Checkbox
                        label="Principal"
                        checked={newBranchDraft.clasificacion === 'principal'}
                        onChange={(checked) => updateNewBranchDraft({clasificacion: checked ? 'principal' : 'secundaria'})}
                      />
                    </div>

                    {/* Estado de la sucursal */}
                    <div className="md:col-span-1 flex items-center">
                      <Switch
                        label="Estado"
                        checked={newBranchDraft.estatus === 'activo'}
                        onChange={(checked) => updateNewBranchDraft({estatus: checked ? 'activo' : 'inactivo'})}
                      />
                    </div>

                    {/* País / Depto / Ciudad / Dirección en una fila completa */}
                    <div className="md:col-span-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <LocationPickerRows 
                          countryValue={newBranchDraft.pais} 
                          stateValue={newBranchDraft.estado_depto} 
                          cityValue={newBranchDraft.ciudad} 
                          direccion={newBranchDraft.direccion} 
                          onLocationChange={l => updateNewBranchDraft({pais: l.country, estado_depto: l.state, ciudad: l.city})} 
                          onDireccionChange={v => updateNewBranchDraft({direccion: v})} 
                          direccionError={showErrors ? newBranchErrors.direccion : null} 
                          required
                          showDireccion={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Asociaciones */}
                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <Subtitle className="text-gray-700">Asociaciones</Subtitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div>
                          <TextSmall className="text-gray-900 font-semibold">Asociar contactos</TextSmall>
                          <TextSmall className="text-gray-600">
                            Relaciona contactos responsables a esta sucursal.
                            {newBranchDraft?.associatedContactIds?.length > 0 && (
                              <span className="ml-2 text-[#D32F2F] font-semibold">
                                ({newBranchDraft.associatedContactIds.length} asociados)
                              </span>
                            )}
                          </TextSmall>
                        </div>
                        <Button
                          type="button"
                          onClick={onAssociateContacts}
                          className="px-3 py-1 text-[10px] uppercase bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        >
                          Asociar
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div>
                          <TextSmall className="text-gray-900 font-semibold">Asociar dispositivos</TextSmall>
                          <TextSmall className="text-gray-600">
                            Vincula los dispositivos instalados en esta sucursal.
                            {newBranchDraft?.associatedDeviceIds?.length > 0 && (
                              <span className="ml-2 text-[#D32F2F] font-semibold">
                                ({newBranchDraft.associatedDeviceIds.length} asociados)
                              </span>
                            )}
                          </TextSmall>
                        </div>
                        <Button
                          type="button"
                          onClick={onAssociateDevices}
                          className="px-3 py-1 text-[10px] uppercase bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        >
                          Asociar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                  <Subtitle className="text-gray-500 mb-2">No hay sucursales registradas</Subtitle>
                  <TextSmall className="text-gray-400">
                    {isEditing ? 'Agrega tu primera sucursal' : 'Este cliente no tiene sucursales'}
                  </TextSmall>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    {/* Buscador */}
                    <div className="flex-1 max-w-md">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar por clave, nombre o país..."
                          value={branchSearchQuery}
                          onChange={(e) => setBranchSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] text-sm"
                        />
                      </div>
                    </div>
                    {isEditing && onNewBranch && (
                      <Button 
                        onClick={onNewBranch}
                        className="bg-gradient-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
                      >
                        <Plus size={16} className="mr-2" />
                        Nueva Sucursal
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {filteredBranches.length === 0 ? (
                      <div className="text-center py-8">
                        <TextSmall className="text-gray-500">
                          {branchSearchQuery ? 'No se encontraron sucursales con ese criterio' : 'No hay sucursales registradas'}
                        </TextSmall>
                      </div>
                    ) : (
                      filteredBranches.map(branch => (
                      <div 
                        key={branch.id}
                        onClick={() => isEditing && onEditBranch && onEditBranch(branch)}
                        className={`border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${isEditing ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TextSmall className="font-bold text-gray-900 text-base">
                                {branch.nombre}
                              </TextSmall>
                              {branch.clasificacion === 'principal' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                  Principal
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                <MapPin size={12} />
                                {branch.direccion || 'Sin dirección'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                <Building2 size={12} />
                                {branch.ciudad || 'Sin ciudad'}
                              </span>
                              {branch.telefono && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                  <Phone size={12} />
                                  {branch.telefono}
                                </span>
                              )}
                            </div>
                          </div>
                          {isEditing && !editingBranchId && (
                            <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                              {onEditBranch && (
                                <IconButton 
                                  icon={Edit2} 
                                  onClick={() => onEditBranch(branch)} 
                                  className="text-gray-400 hover:text-green-600"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientForm;
