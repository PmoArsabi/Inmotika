import React, { useState, useMemo, useRef } from 'react';
import {
  Building2, MapPin, Phone, Mail, Hash, Briefcase,
  Camera, Plus, Edit2, Search, FileText, Calendar, Trash2, Link2, FileSignature,
  Navigation, Eye,
} from 'lucide-react';
import { Country } from 'country-state-city';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import NitInput from '../../components/ui/NitInput';
import Switch from '../../components/ui/Switch';
import Tabs from '../../components/ui/Tabs';
import FileUploader from '../../components/ui/FileUploader';
import PhoneInput from '../../components/ui/PhoneInput';
import SchedulePicker from '../../components/ui/SchedulePicker';
import { LocationPickerRows } from '../../components/forms/LocationPickerRows';
import Card from '../../components/ui/Card';
import { TextSmall, Subtitle, Label, TextTiny } from '../../components/ui/Typography';
import IconButton from '../../components/ui/IconButton';
import DynamicDocumentList from '../../components/ui/DynamicDocumentList';
import { supabase } from '../../utils/supabase';
import { useEstados, useCatalog, useActivoInactivo } from '../../hooks/useCatalog';
import { emptyContractDraft } from '../../utils/entityMappers';
import BranchForm from '../../components/forms/BranchForm';

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
  viewBranchMode = null,
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

  // Logo upload (deferred, real upload happens in ClientNavigator with uploadAndSyncFile)
  const handleLogoClick = () => {
    if (!isEditing) return;
    logoInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateDraft({ logoUrl: file });
    if (logoInputRef.current) logoInputRef.current.value = '';
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
                  } bg-linear-to-br from-[#D32F2F] to-[#8B0000]`}
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
                  : 'Cliente'}
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
                  { key: 'details', label: 'Detalle General' },
                  { key: 'branches', label: 'Sucursal' },
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
                      onChange={fileOrPath => updateDraft({ rutUrl: fileOrPath })}
                      accept="application/pdf,image/*"
                      viewMode={!isEditing}
                      deferred
                    />
                    <FileUploader
                      label="Certificación Bancaria"
                      bucket="inmotika"
                      storagePath={draft.id ? `clientes/${draft.id}/cert_bancaria.pdf` : undefined}
                      value={draft.certBancariaUrl || ''}
                      onChange={fileOrPath => updateDraft({ certBancariaUrl: fileOrPath })}
                      accept="application/pdf,image/*"
                      viewMode={!isEditing}
                      deferred
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
                    deferred
                  />
                </div>
              </div>
            )}

            {/* ─────────── TAB: SUCURSAL ─────────── */}
            {activeTab === 'branches' && (
              (newBranchDraft || editingBranchId || (branches.length === 0 && isEditing)) ? (
                <BranchForm
                  newBranchDraft={newBranchDraft}
                  updateNewBranchDraft={updateNewBranchDraft}
                  newBranchErrors={newBranchErrors}
                  onSaveNewBranch={onSaveNewBranch}
                  isEditing={viewBranchMode ? (viewBranchMode === 'edit') : isEditing}
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
                  viewBranchMode={viewBranchMode}
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
          <TextSmall className="font-bold text-gray-900">{branch.nombre}</TextSmall>
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
      <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
        {isEditing && !editingBranchId && onEditBranch && (
          <IconButton 
            icon={Edit2} 
            size={16}
            onClick={() => onEditBranch(branch)} 
            className="text-gray-400 hover:text-green-600 bg-gray-50 hover:bg-green-50" 
            title="Editar Sucursal"
          />
        )}
        {!isEditing && onViewBranch && (
          <IconButton 
            icon={Eye} 
            size={16}
            onClick={() => onViewBranch(branch)} 
            className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50" 
            title="Ver Detalles"
          />
        )}
      </div>
    </div>
  </div>
);

export default ClientForm;
