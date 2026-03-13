import React, { useState, useMemo, useRef } from 'react';
import {
  Building2, MapPin, Phone, Mail, Hash, Briefcase,
  Camera, Plus, Edit2, Search, FileText, Calendar, Trash2, Link2, FileSignature,
  Navigation, Eye,
} from 'lucide-react';
import { Country } from 'country-state-city';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import NitInput from '../../ui/NitInput';
import Switch from '../../ui/Switch';
import Tabs from '../../ui/Tabs';
import FileUploader from '../../ui/FileUploader';
import PhoneInput from '../../ui/PhoneInput';
import SchedulePicker from '../../ui/SchedulePicker';
import { LocationPickerRows } from '../../forms/LocationPickerRows';
import Card from '../../ui/Card';
import { TextSmall, Subtitle, Label, TextTiny } from '../../ui/Typography';
import IconButton from '../../ui/IconButton';
import DynamicDocumentList from '../../ui/DynamicDocumentList';
import { supabase } from '../../../utils/supabase';
import { useEstados, useCatalog, useActivoInactivo } from '../../../hooks/useCatalog';
import { emptyContractDraft } from '../../../utils/entityMappers';

const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

const ClientForm = ({
  draft, updateDraft, errors = {}, showErrors = false, isEditing = false,
  onSave, isSaving = false, activeTab, onTabChange,
  branches = [], onNewBranch, onEditBranch, onViewBranch,
  newBranchDraft, updateNewBranchDraft, newBranchErrors = {}, onSaveNewBranch,
  onAssociateContacts, onAssociateDevices,
  totalSucursales = 0, totalContactos = 0, totalDispositivos = 0,
  editingBranchId = null, onCancelEdit = null,
}) => {
  const { options: estadoOptions, loading: loadingEstados } = useEstados();
  const { options: tipoDocOptions, loading: loadingTipoDoc } = useCatalog('TIPO_DOCUMENTO');
  const { activoId, inactivoId } = useActivoInactivo();

  // Sigue usado por el Select de estado de contratos
  const estadoSelectOptions = loadingEstados
    ? [{ value: '', label: 'Cargando...' }]
    : [{ value: '', label: 'Seleccionar estado...' }, ...estadoOptions];

  const tipoDocSelectOptions = loadingTipoDoc
    ? [{ value: '', label: 'Cargando...' }]
    : [{ value: '', label: 'Seleccionar tipo...' }, ...tipoDocOptions.map(o => ({ value: o.codigo, label: o.label }))];

  // Derivar si es persona jurídica según el tipo de documento seleccionado
  const isJuridica = draft.tipoDocumento === 'NIT';

  const getCountryName = (code) => ALL_COUNTRIES.find(c => c.value === code)?.label || code;

  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const logoInputRef = useRef(null);

  const filteredBranches = useMemo(() => {
    if (!branchSearchQuery.trim()) return branches;
    const q = branchSearchQuery.toLowerCase();
    return branches.filter(b =>
      (b.nombre || '').toLowerCase().includes(q) ||
      (b.id || '').toLowerCase().includes(q) ||
      getCountryName(b.pais || '').toLowerCase().includes(q)
    );
  }, [branches, branchSearchQuery]);

  // Logo upload
  const handleLogoClick = () => {
    if (!isEditing) return;
    logoInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !draft.id) return;
    const ext = file.name.split('.').pop();
    const path = `clientes/${draft.id}/logo.${ext}`;
    try {
      const { error } = await supabase.storage.from('inmotika').upload(path, file, { upsert: true });
      if (error) throw error;
      updateDraft({ logoUrl: path });
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Document change handler
  const handleOtrosDocumentosChange = (newDocs) => {
    updateDraft({ otrosDocumentos: newDocs });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* ─── Left Column — Summary ─── */}
      <div className="lg:col-span-1">
        <Card className="p-6 space-y-6 h-full">
          {/* Logo / Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div
                onClick={handleLogoClick}
                className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shadow-lg border-2 border-gray-200 ${
                  isEditing ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                } bg-linear-to-brrom-[#D32F2F] to-[#8B0000]`}
              >
                {draft.logoUrl ? (
                  <img src={draft.logoUrl.startsWith('http') ? draft.logoUrl : undefined} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} className="text-white" />
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Camera size={16} className="text-gray-700" />
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">{draft.nombre || 'Nuevo Cliente'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {draft.tipoDocumento
                  ? (isJuridica ? 'Persona Jurídica' : 'Persona Natural')
                  : 'Nuevo Cliente'}
              </p>
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {draft.nit && (
              <div className="flex items-start gap-3">
                <Hash size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Número de Identificación</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {draft.tipoDocumento && <span className="text-gray-400 mr-1">{draft.tipoDocumento}</span>}
                    {draft.nit}{isJuridica && draft.dv ? `-${draft.dv}` : ''}
                  </p>
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
            {draft.celular && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Celular</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{draft.celular}</p>
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
                    {draft.pais ? ` — ${getCountryName(draft.pais)}` : ''}
                  </p>
                </div>
              </div>
            )}
            {/* Documentos cargados */}
            {(draft.rutUrl || draft.certBancariaUrl || (draft.otrosDocumentos || []).some(d => d.url)) && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Documentos</TextSmall>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.rutUrl && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">RUT</span>}
                    {draft.certBancariaUrl && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Cert. Bancaria</span>}
                    {(draft.otrosDocumentos || []).filter(d => d.url).map(d => (
                      <span key={d.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">{d.nombre || 'Doc'}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas */}
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

      {/* ─── Right Column — Form ─── */}
      <div className="lg:col-span-2">
        <Card className="p-6 h-full flex flex-col">
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 shrink-0">
              <Tabs
                tabs={[
                  { key: 'details', label: 'Paso 1  Detalle General' },
                  { key: 'branches', label: 'Paso 2  Sucursal' },
                ]}
                active={activeTab}
                onChange={onTabChange}
              />
            </div>

            {/* ─────────── TAB: DETALLE GENERAL ─────────── */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {isEditing && (
                  <div className="flex items-center justify-between">
                    <Subtitle className="text-gray-700">Detalles generales</Subtitle>
                    <Button
                      onClick={onSave}
                      disabled={isSaving}
                      className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Tipo de Documento"
                    value={draft.tipoDocumento || ''}
                    onChange={e => updateDraft({ tipoDocumento: e.target.value, dv: '' })}
                    options={tipoDocSelectOptions}
                    viewMode={!isEditing}
                    icon={FileSignature}
                    error={showErrors ? errors.tipoDocumento : null}
                    required
                  />
                  <Input
                    label={isJuridica ? 'Razón Social' : 'Nombre'}
                    value={draft.nombre || ''}
                    onChange={e => updateDraft({ nombre: e.target.value.toUpperCase() })}
                    error={showErrors ? errors.nombre : null}
                    viewMode={!isEditing}
                    icon={Building2}
                    uppercase
                    required
                  />
                  <NitInput
                    label="Número de Identificación"
                    nitValue={draft.nit}
                    dvValue={draft.dv}
                    onNitChange={v => updateDraft({ nit: v })}
                    onDvChange={v => updateDraft({ dv: v })}
                    showDv={isJuridica}
                    error={showErrors ? (errors.nit || errors.dv) : null}
                    viewMode={!isEditing}
                    required
                  />
                  <Input
                    label="Dirección Física"
                    icon={MapPin}
                    value={draft.direccion || ''}
                    onChange={e => updateDraft({ direccion: e.target.value })}
                    error={showErrors ? errors.direccion : null}
                    viewMode={!isEditing}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={(draft.email || '').toLowerCase()}
                    onChange={e => updateDraft({ email: e.target.value.toLowerCase() })}
                    error={showErrors ? errors.email : null}
                    viewMode={!isEditing}
                    icon={Mail}
                  />
                  <PhoneInput
                    label="Celular"
                    countryValue={draft.celularPaisIso || 'CO'}
                    phoneValue={draft.celular || ''}
                    onCountryChange={v => updateDraft({ celularPaisIso: v })}
                    onPhoneChange={v => updateDraft({ celular: v })}
                    error={showErrors ? errors.celular : null}
                    viewMode={!isEditing}
                  />
                  <Input
                    label={isJuridica ? 'Fecha de Constitución' : 'Fecha de Nacimiento'}
                    type="date"
                    value={draft.fechaNacimiento || ''}
                    onChange={e => updateDraft({ fechaNacimiento: e.target.value })}
                    viewMode={!isEditing}
                    icon={Calendar}
                  />
                  <Switch
                    label="Estado"
                    checked={!!activoId && draft.estadoId === activoId}
                    onChange={checked => updateDraft({ estadoId: checked ? activoId : inactivoId })}
                    viewMode={!isEditing}
                    checkedLabel="Activo"
                    uncheckedLabel="Inactivo"
                  />
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <LocationPickerRows
                        countryValue={draft.pais}
                        stateValue={draft.estado_depto}
                        cityValue={draft.ciudad}
                        direccion={draft.direccion}
                        onLocationChange={l => updateDraft({ pais: l.country, estado_depto: l.state, ciudad: l.city })}
                        onDireccionChange={v => updateDraft({ direccion: v })}
                        direccionError={showErrors ? errors.direccion : null}
                        viewMode={!isEditing}
                        required
                        showDireccion={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Documentos */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-bold text-gray-900">Documentos del Cliente</Label>
                      <TextTiny className="text-gray-500">Subir documentos requeridos</TextTiny>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUploader
                      label="RUT"
                      bucket="inmotika"
                      storagePath={draft.id ? `clientes/${draft.id}/rut.pdf` : undefined}
                      value={draft.rutUrl || ''}
                      onChange={path => updateDraft({ rutUrl: path })}
                      accept="application/pdf,image/*"
                      viewMode={!isEditing}
                    />
                    <FileUploader
                      label="Certificación Bancaria"
                      bucket="inmotika"
                      storagePath={draft.id ? `clientes/${draft.id}/cert_bancaria.pdf` : undefined}
                      value={draft.certBancariaUrl || ''}
                      onChange={path => updateDraft({ certBancariaUrl: path })}
                      accept="application/pdf,image/*"
                      viewMode={!isEditing}
                    />
                  </div>

                  {/* Otros documentos dinámicos */}
                  <DynamicDocumentList
                    title="Otros Documentos"
                    addButtonLabel="Agregar"
                    items={draft.otrosDocumentos || []}
                    onChange={handleOtrosDocumentosChange}
                    viewMode={!isEditing}
                    storagePathPrefix={draft.id ? `clientes/${draft.id}/otros` : null}
                    itemPlaceholder="Nombre del documento"
                  />
                </div>
              </div>
            )}

            {/* ─────────── TAB: SUCURSAL ─────────── */}
            {activeTab === 'branches' && (
              (newBranchDraft || (branches.length === 0 && isEditing)) ? (
                <BranchSubForm
                  newBranchDraft={newBranchDraft}
                  updateNewBranchDraft={updateNewBranchDraft}
                  newBranchErrors={newBranchErrors}
                  onSaveNewBranch={onSaveNewBranch}
                  isEditing={isEditing}
                  isSaving={isSaving}
                  editingBranchId={editingBranchId}
                  onCancelEdit={onCancelEdit}
                  onAssociateContacts={onAssociateContacts}
                  onAssociateDevices={onAssociateDevices}
                  showErrors={showErrors}
                  estadoSelectOptions={estadoSelectOptions}
                  activoId={activoId}
                  inactivoId={inactivoId}
                  clientId={draft.id}
                />
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
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar sucursal..."
                        value={branchSearchQuery}
                        onChange={e => setBranchSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F] text-sm"
                      />
                    </div>
                    {isEditing && onNewBranch && (
                      <Button
                        onClick={onNewBranch}
                        className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] text-white border-0 shrink-0"
                      >
                        <Plus size={16} className="mr-2" /> Nueva Sucursal
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {filteredBranches.length === 0 ? (
                      <TextSmall className="text-gray-500 text-center py-6">
                        {branchSearchQuery ? 'Sin resultados' : 'Sin sucursales'}
                      </TextSmall>
                    ) : (
                      filteredBranches.map(branch => (
                        <BranchCard
                          key={branch.id}
                          branch={branch}
                          isEditing={isEditing}
                          editingBranchId={editingBranchId}
                          onEditBranch={onEditBranch}
                          onViewBranch={onViewBranch}
                        />
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: formulario de creación/edición de sucursal
// ─────────────────────────────────────────────────────────────────────────────
export const BranchSubForm = ({
  newBranchDraft, updateNewBranchDraft, newBranchErrors = {}, onSaveNewBranch,
  isEditing, isSaving, editingBranchId, onCancelEdit,
  onAssociateContacts, onAssociateDevices, showErrors,
  estadoSelectOptions, activoId, inactivoId, clientId,
}) => (
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
          className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] text-white border-0"
        >
          {isSaving ? 'Guardando...' : editingBranchId ? 'Guardar Cambios' : 'Guardar Sucursal'}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Briefcase size={16} className="text-purple-600" /></div>
          <div>
            <Subtitle className="text-gray-700">Contratos</Subtitle>
            <TextTiny className="text-gray-500">Documentos y vigencias contractuales de la sucursal</TextTiny>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={() => updateNewBranchDraft({ contratos: [...(newBranchDraft.contratos || []), emptyContractDraft()] })}
            className="flex items-center gap-1.5 text-xs text-[#D32F2F] hover:text-[#B71C1C] font-semibold transition-colors"
          >
            <Plus size={13} /> Agregar
          </button>
        )}
      </div>

      {(!newBranchDraft.contratos || newBranchDraft.contratos.length === 0) ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Briefcase size={28} className="mx-auto mb-2 text-gray-300" />
          <TextTiny className="text-gray-400">
            {isEditing ? 'Sin contratos — haz clic en "+ Agregar" para añadir uno' : 'Sin contratos registrados'}
          </TextTiny>
        </div>
      ) : (
        <div className="space-y-4">
          {(newBranchDraft.contratos || []).map((contrato, idx) => {
            const updateContrato = (patch) =>
              updateNewBranchDraft({
                contratos: newBranchDraft.contratos.map((c, i) => i === idx ? { ...c, ...patch } : c),
              });
            const removeContrato = () =>
              updateNewBranchDraft({
                contratos: newBranchDraft.contratos.filter((_, i) => i !== idx),
              });

            return (
              <div key={contrato.id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <TextSmall className="font-bold text-gray-700">Contrato {idx + 1}</TextSmall>
                  {isEditing && (
                    <button type="button" onClick={removeContrato} className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {/* Fila 1: Descripción + Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Descripción del Contrato"
                    icon={Briefcase}
                    value={contrato.tema || ''}
                    onChange={e => updateContrato({ tema: e.target.value })}
                    placeholder="Ej: MANTENIMIENTO PREVENTIVO"
                    viewMode={!isEditing}
                  />
                  <Select
                    label="Estado del Contrato"
                    value={contrato.estadoId || ''}
                    onChange={e => updateContrato({ estadoId: e.target.value })}
                    options={estadoSelectOptions}
                    viewMode={!isEditing}
                  />
                </div>
                {/* Fila 2: Fecha Inicio + Fecha Fin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Fecha Inicio"
                    type="date"
                    icon={Calendar}
                    value={contrato.fechaInicio || ''}
                    onChange={e => updateContrato({ fechaInicio: e.target.value })}
                    viewMode={!isEditing}
                  />
                  <Input
                    label="Fecha Fin"
                    type="date"
                    icon={Calendar}
                    value={contrato.fechaFin || ''}
                    onChange={e => updateContrato({ fechaFin: e.target.value })}
                    viewMode={!isEditing}
                  />
                </div>
                {/* Fila 3: Adjuntar Contrato (fila completa) */}
                <FileUploader
                  label="Adjuntar Contrato"
                  bucket="inmotika"
                  storagePath={newBranchDraft.id ? `contratos/${newBranchDraft.id}/${contrato.id || idx}.pdf` : undefined}
                  value={contrato.documentoUrl || ''}
                  onChange={path => updateContrato({ documentoUrl: path })}
                  accept="application/pdf"
                  viewMode={!isEditing}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: tarjeta de sucursal en el listado
// ─────────────────────────────────────────────────────────────────────────────
const BranchCard = ({ branch, isEditing, editingBranchId, onEditBranch, onViewBranch }) => (
  <div
    onClick={() => {
      if (isEditing && onEditBranch) onEditBranch(branch);
      else if (!isEditing && onViewBranch) onViewBranch(branch);
    }}
    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <TextSmall className="font-bold text-gray-900 text-base">{branch.nombre}</TextSmall>
          {(branch.esPrincipal || branch.es_principal) && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">Principal</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            <MapPin size={12} />{branch.direccion || 'Sin dirección'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            <Building2 size={12} />{branch.ciudad || 'Sin ciudad'}
          </span>
        </div>
        {/* Contratos (array) */}
        {(() => {
          const contratos = branch.contratos || (branch.contrato ? [branch.contrato] : []);
          if (!contratos.length) return null;
          return (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              {contratos.map((c, i) => (
                <div key={c.id || i} className="flex flex-wrap gap-2">
                  {c.tema && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                      <Briefcase size={11} />{c.tema}
                    </span>
                  )}
                  {c.fechaInicio && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      <Calendar size={11} />Inicio: {new Date(c.fechaInicio).toLocaleDateString('es-CO')}
                    </span>
                  )}
                  {c.fechaFin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">
                      <Calendar size={11} />Fin: {new Date(c.fechaFin).toLocaleDateString('es-CO')}
                    </span>
                  )}
                  {c.documentoUrl && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                      <FileText size={11} />Contrato adjunto
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      {isEditing && !editingBranchId && (
        <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
          {onEditBranch && (
            <IconButton icon={Edit2} onClick={() => onEditBranch(branch)} className="text-gray-400 hover:text-green-600" />
          )}
        </div>
      )}
    </div>
  </div>
);

export default ClientForm;
