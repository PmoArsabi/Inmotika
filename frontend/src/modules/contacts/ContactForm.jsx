import React, { useRef, useState } from 'react';
import {
  User, IdCard, Mail, Calendar, Briefcase, Heart, MessageSquare,
  Building2, Shield, CheckCircle2, Camera, KeyRound, Copy, RefreshCw, Check,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import PhoneInput from '../../components/ui/PhoneInput';
import MultiSelectDropdown from '../../components/ui/MultiSelectDropdown';
import SearchableSelect from '../../components/ui/SearchableSelect';
import SecureImage from '../../components/ui/SecureImage';
import { TextTiny } from '../../components/ui/Typography';
import { useCatalog, useActivoInactivo } from '../../hooks/useCatalog';
import { generateProvisionalPassword } from '../../utils/provisionalPassword';

/**
 * Bloque de clave provisional (generada automáticamente, con copiar).
 */
const ProvisionalPasswordBlock = ({
  enabled,
  password,
  onToggle,
  onRegenerate,
  existingUser = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <KeyRound size={15} className="text-amber-700 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-amber-900">
            {existingUser ? 'Generar nueva clave provisional' : 'Clave provisional (sin correo)'}
          </p>
          <TextTiny className="text-amber-800/80 mt-0.5">
            {existingUser
              ? 'Útil si el contacto no puede recibir correos (p. ej. universidad). Al guardar se reemplaza su contraseña.'
              : 'Crea el acceso con una clave temporal. Entrégala al contacto; podrá cambiarla desde su perfil.'}
          </TextTiny>
        </div>
      </div>

      <Switch
        label={existingUser ? 'Asignar nueva clave al guardar' : 'Usar clave provisional'}
        checked={enabled}
        onChange={onToggle}
        checkedLabel="Sí"
        uncheckedLabel="No"
      />

      {enabled && (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <Input
              label="Clave generada"
              value={password}
              readOnly
              icon={KeyRound}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={onRegenerate} className="h-10">
              <RefreshCw size={14} /> Regenerar
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy} className="h-10">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiada' : 'Copiar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Avatar centrado para contacto con acceso al sistema.
 * - hasAccess + usuarioId: muestra foto real (SecureImage) con botón editar en modo edición
 * - !hasAccess (darAcceso): muestra preview del File seleccionado o iniciales
 * - viewMode: solo muestra, sin interacción
 * @param {{ hasAccess: boolean, usuarioId: string|null, avatarFile: File|null, avatarPreview: string|null, nombres: string, isEditing: boolean, onChange: Function }} props
 */
const ContactAvatarBlock = ({ hasAccess, usuarioId, avatarPreview, nombres, isEditing, onChange }) => {
  const inputRef = useRef(null);
  const initials = (nombres || '?').charAt(0).toUpperCase();
  const avatarPath = usuarioId ? `usuarios/${usuarioId}/avatar` : null;
  // Para contactos existentes con usuario vinculado usamos SecureImage (ruta en storage)
  // Para contactos nuevos con darAcceso usamos preview local (ObjectURL)
  const canEdit = isEditing;

  const handleClick = () => {
    if (!canEdit) return;
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange(file, preview);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="relative">
        <div
          onClick={handleClick}
          className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shadow-md border-2 border-gray-200 bg-linear-to-br from-brand to-brand-deeper ${canEdit ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        >
          {hasAccess && avatarPath && !avatarPreview ? (
            <SecureImage path={avatarPath} bucket="inmotika" alt="Avatar" className="w-full h-full object-cover" fallback={<span className="text-white text-2xl font-black">{initials}</span>} />
          ) : avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-2xl font-black">{initials}</span>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={handleClick}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
          >
            <Camera size={13} className="text-gray-600" />
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
      {canEdit && (
        <TextTiny className="text-gray-400">Haz clic para cambiar la foto</TextTiny>
      )}
    </div>
  );
};

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
  hasAccess = false,
  perfilAccesoActivo = null,
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
            className="bg-linear-to-r from-brand to-brand-deeper hover:from-brand-dark hover:to-brand-deeper text-white border-0 min-w-40"
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
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Asignación</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente — single select */}
          <SearchableSelect
            label="Cliente"
            options={clientOptions}
            value={selectedClientId ? (clientOptions.find(o => String(o.value) === String(selectedClientId)) || null) : null}
            onChange={(opt) => { if (isEditing) onClientChange(opt || null); }}
            placeholder="Seleccionar cliente..."
            isDisabled={!isEditing}
            isClearable
            error={clientError}
          />

          {/* Sucursales */}
          <MultiSelectDropdown
            label="Sucursales"
            options={availableBranchOptions}
            value={selectedBranchValues}
            onChange={isEditing ? onBranchesChange : () => {}}
            placeholder={hasClient ? 'Seleccionar sucursales...' : 'Selecciona un cliente primero'}
            disabled={!isEditing || !hasClient}
            error={branchError}
          />
        </div>
      </div>

      {/* ─── Datos Personales ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <User size={15} className="text-gray-500" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Datos Personales</span>
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
            label="Fecha de Nacimiento"
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
                label="Fecha de Boda"
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
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Datos de Contacto</span>
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
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Cargo y Área</span>
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
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Acceso a la plataforma</span>
        </div>

        {/* Avatar centrado — visible siempre que haya acceso (ver o editar) o cuando se va a dar acceso */}
        {(hasAccess || draft.darAcceso) && (
          <ContactAvatarBlock
            hasAccess={hasAccess}
            usuarioId={draft.usuarioId || null}
            avatarFile={draft.avatarFile}
            avatarPreview={draft.avatarPreview}
            nombres={draft.nombres}
            isEditing={isEditing}
            onChange={(file, preview) => updateDraft({ avatarFile: file, avatarPreview: preview })}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {hasAccess ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                <Switch
                  label="Acceso al sistema"
                  checked={perfilAccesoActivo === true || (perfilAccesoActivo === null && true)}
                  onChange={checked => updateDraft({ perfilAccesoActivo: checked })}
                  viewMode={!isEditing}
                  checkedLabel="Activo"
                  uncheckedLabel="Inactivo"
                />
              </div>
            ) : (
              <Switch
                label="Acceso al sistema"
                checked={!!draft.darAcceso}
                onChange={checked => updateDraft(
                  checked
                    ? { darAcceso: true }
                    : { darAcceso: false, usarClaveProvisional: false, claveProvisional: '' }
                )}
                viewMode={!isEditing}
                checkedLabel="Sí"
                uncheckedLabel="No"
              />
            )}
          </div>
        </div>

        {/* Clave provisional — sin correo (universidades / restricciones de inbox) */}
        {isEditing && !hasAccess && draft.darAcceso && (
          <ProvisionalPasswordBlock
            enabled={!!draft.usarClaveProvisional}
            password={draft.claveProvisional || ''}
            onToggle={(checked) => {
              if (checked) {
                updateDraft({
                  usarClaveProvisional: true,
                  claveProvisional: draft.claveProvisional || generateProvisionalPassword(),
                });
              } else {
                updateDraft({ usarClaveProvisional: false, claveProvisional: '' });
              }
            }}
            onRegenerate={() => updateDraft({ claveProvisional: generateProvisionalPassword() })}
          />
        )}

        {isEditing && hasAccess && (
          <ProvisionalPasswordBlock
            enabled={!!draft.usarClaveProvisional}
            password={draft.claveProvisional || ''}
            existingUser
            onToggle={(checked) => {
              if (checked) {
                updateDraft({
                  usarClaveProvisional: true,
                  claveProvisional: draft.claveProvisional || generateProvisionalPassword(),
                });
              } else {
                updateDraft({ usarClaveProvisional: false, claveProvisional: '' });
              }
            }}
            onRegenerate={() => updateDraft({ claveProvisional: generateProvisionalPassword() })}
          />
        )}
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
