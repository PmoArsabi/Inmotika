import React, { useState } from 'react';
import {
  User, IdCard, Mail, Calendar, Briefcase, Heart, MessageSquare,
  Building2, GitBranch, Shield, Lock, Link2, Eye,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import PhoneInput from '../../components/ui/PhoneInput';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { useCatalog, useActivoInactivo } from '../../hooks/useCatalog';
import { Label } from '../../components/ui/Typography';

const ContactForm = ({
  draft,
  updateDraft,
  errors = {},
  showErrors = false,
  isEditing = false,
  onSave,
  isSaving = false,
  savingStep = '',
  isNew = false,
  // Selectors pasados desde ConfigurationNavigator
  clientOptions = [],
  selectedClientId = '',
  onClientChange,
  availableBranchOptions = [],
  selectedBranchValues = [],
  onBranchesChange,
  clientError = null,
  branchError = null,
}) => {
  const { options: tipoDocOptions, loading: loadingTipoDoc } = useCatalog('TIPO_DOCUMENTO');
  const { options: generoOptions, loading: loadingGenero } = useCatalog('GENERO');
  const { options: cargoOptions, loading: loadingCargo } = useCatalog('CARGO_CONTACTO');
  const { activoId, inactivoId } = useActivoInactivo();

  const [showBranchesSelector, setShowBranchesSelector] = useState(false);

  const buildOpts = (loading, opts, placeholder = 'Seleccionar...') =>
    loading
      ? [{ value: '', label: 'Cargando...' }]
      : [{ value: '', label: placeholder }, ...opts];

  const hasClient = !!selectedClientId;

  return (
    <div className="space-y-6">
      {/* Botón guardar */}
      {isEditing && (
        <div className="flex items-center justify-end">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0 min-w-[160px]"
          >
            {isSaving ? (
              savingStep === 'inviting' ? 'Enviando invitación...' : 'Guardando...'
            ) : (
              'GUARDAR CONTACTO'
            )}
          </Button>
        </div>
      )}

      {/* ─── Asignación — Cliente y Sucursal ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <Building2 size={15} className="text-gray-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Asignación</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente: desplegable normal */}
          <Select
            label="Cliente"
            value={selectedClientId || ''}
            onChange={(e) => {
              if (!isEditing) return;
              const value = e.target.value || '';
              const opt = clientOptions.find(o => String(o.value) === String(value)) || null;
              onClientChange(opt);
            }}
            options={[{ value: '', label: 'Seleccionar cliente...' }, ...clientOptions]}
            icon={Building2}
            viewMode={!isEditing}
            error={clientError}
          />

          {/* Sucursales: desplegable multi-select */}
          {hasClient && (
            <SearchableSelect
              label="Sucursales"
              value={selectedBranchValues}
              onChange={onBranchesChange}
              options={availableBranchOptions}
              isMulti
              error={branchError}
              placeholder="Buscar sucursales..."
              icon={GitBranch}
              isDisabled={!isEditing}
            />
          )}
        </div>
      </div>

      {/* ─── Datos Personales ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <User size={15} className="text-gray-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Datos Personales</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombres"
            value={draft.nombres || ''}
            onChange={e => updateDraft({ nombres: e.target.value.toUpperCase() })}
            error={showErrors ? errors.nombres : null}
            viewMode={!isEditing}
            icon={User}
            required
          />
          <Input
            label="Apellidos"
            value={draft.apellidos || ''}
            onChange={e => updateDraft({ apellidos: e.target.value.toUpperCase() })}
            error={showErrors ? errors.apellidos : null}
            viewMode={!isEditing}
            icon={User}
            required
          />
          <Select
            label="Tipo de Documento"
            value={draft.tipoDocumento || ''}
            onChange={e => updateDraft({ tipoDocumento: e.target.value })}
            options={buildOpts(loadingTipoDoc, tipoDocOptions.map(o => ({ value: o.codigo, label: o.label })), 'Tipo de documento...')}
            viewMode={!isEditing}
            icon={IdCard}
          />
          <Input
            label="Número de Documento"
            value={draft.identificacion || ''}
            onChange={e => updateDraft({ identificacion: e.target.value.replace(/\D/g, '') })}
            error={showErrors ? errors.identificacion : null}
            viewMode={!isEditing}
            icon={IdCard}
            inputMode="numeric"
          />
          <Select
            label="Género"
            value={draft.generoId || ''}
            onChange={e => updateDraft({ generoId: e.target.value })}
            options={buildOpts(loadingGenero, generoOptions, 'Seleccionar género...')}
            viewMode={!isEditing}
          />
          <Input
            label="Fecha de Cumpleaños"
            type="date"
            value={draft.fechaNacimiento || ''}
            onChange={e => updateDraft({ fechaNacimiento: e.target.value })}
            viewMode={!isEditing}
            icon={Calendar}
          />

          {/* ESTADO CIVIL */}
          <div className="space-y-4">
            <Switch
              label="Estado Civil"
              checked={!!draft.esMarido}
              onChange={checked => updateDraft({ esMarido: checked, fechaMatrimonio: checked ? draft.fechaMatrimonio : '' })}
              viewMode={!isEditing}
              checkedLabel="Casado/a"
              uncheckedLabel="Soltero/a"
            />
            {draft.esMarido && (
              <Input
                label="Fecha de Aniversario"
                type="date"
                value={draft.fechaMatrimonio || ''}
                onChange={e => updateDraft({ fechaMatrimonio: e.target.value })}
                viewMode={!isEditing}
                icon={Heart}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Datos de Contacto ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <Mail size={15} className="text-gray-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Datos de Contacto</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Correo Electrónico"
            type="email"
            value={(draft.email || '').toLowerCase()}
            onChange={e => updateDraft({ email: e.target.value.toLowerCase() })}
            error={showErrors ? errors.email : null}
            viewMode={!isEditing}
            icon={Mail}
          />
          <PhoneInput
            label="Celular"
            countryValue={draft.telefonoMovilPais || 'CO'}
            phoneValue={draft.telefonoMovil || ''}
            onCountryChange={v => updateDraft({ telefonoMovilPais: v })}
            onPhoneChange={v => updateDraft({ telefonoMovil: v })}
            error={showErrors ? errors.telefonoMovil : null}
            viewMode={!isEditing}
            required
          />
        </div>
      </div>

      {/* ─── Cargo y Área ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <Briefcase size={15} className="text-gray-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Cargo y Área</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Cargo"
            value={draft.cargoId || ''}
            onChange={e => updateDraft({ cargoId: e.target.value })}
            options={buildOpts(loadingCargo, cargoOptions, 'Seleccionar cargo...')}
            viewMode={!isEditing}
            icon={Briefcase}
          />
          <Input
            label="Descripción del Cargo"
            value={draft.descripcionCargo || ''}
            onChange={e => updateDraft({ descripcionCargo: e.target.value })}
            viewMode={!isEditing}
            icon={MessageSquare}
            placeholder="Descripción opcional del rol"
          />
        </div>
      </div>

      {/* ─── Acceso a la Plataforma ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <Shield size={15} className="text-gray-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Acceso a la plataforma</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Switch
              label="¿Dar acceso al sistema?"
              checked={!!draft.darAcceso}
              onChange={checked => updateDraft({ darAcceso: checked })}
              viewMode={!isEditing}
              checkedLabel="Sí"
              uncheckedLabel="No"
            />
            {draft.darAcceso && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50/30 border-l-2 border-blue-400 rounded-r-lg animate-in fade-in slide-in-from-top-1 duration-300">
                <Mail size={14} className="text-blue-500 shrink-0" />
                <p className="text-[12px] text-blue-900/80 leading-relaxed">
                  Se enviará una invitación a <span className="font-bold text-blue-700 underline decoration-blue-200 underline-offset-4">{draft.email || 'la dirección registrada'}</span> al guardar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Estado — solo visible en ver/editar (no en creación nueva) ─── */}
      {!isNew && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Switch
            label="Estado"
            checked={!!activoId && draft.estadoId === activoId}
            onChange={checked => updateDraft({ estadoId: checked ? activoId : inactivoId })}
            viewMode={!isEditing}
            checkedLabel="Activo"
            uncheckedLabel="Inactivo"
          />
        </div>
      )}
    </div>
  );
};

export default ContactForm;
