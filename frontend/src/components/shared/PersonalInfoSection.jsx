import React, { useRef } from 'react';
import { Camera, User, Mail } from 'lucide-react';
import Input from '../ui/Input';
import PhoneInput from '../ui/PhoneInput';
import { Label, TextTiny } from '../ui/Typography';
import { supabase } from '../../utils/supabase';

/**
 * PersonalInfoSection — Sección reutilizable de información personal de usuario.
 * Incluye: avatar, nombres, apellidos, email, teléfono.
 *
 * Props:
 *   draft          — objeto con nombres, apellidos, email, telefono, telefonoPaisIso, avatarUrl
 *   updateDraft    — función para actualizar campos del draft
 *   errors         — objeto con errores por campo
 *   showErrors     — mostrar errores activos
 *   isEditing      — modo edición
 *   emailReadOnly  — bloquear email (ej: cuando viene de auth)
 *   avatarBucket   — bucket de storage para avatar (default: 'inmotika')
 *   avatarPath     — ruta en storage (ej: 'usuarios/uuid/avatar.jpg')
 *   dark           — tema oscuro
 */
const PersonalInfoSection = ({
  draft,
  updateDraft,
  errors = {},
  showErrors = false,
  isEditing = true,
  emailReadOnly = false,
  avatarBucket = 'inmotika',
  avatarPath,
  dark = false,
}) => {
  const avatarInputRef = useRef(null);

  const handleAvatarClick = () => {
    if (!isEditing || !avatarPath) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !avatarPath) return;
    try {
      const { error } = await supabase.storage
        .from(avatarBucket)
        .upload(avatarPath, file, { upsert: true });
      if (error) throw error;
      updateDraft({ avatarUrl: avatarPath });
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const getAvatarSrc = () => {
    if (!draft.avatarUrl) return null;
    if (draft.avatarUrl.startsWith('http')) return draft.avatarUrl;
    return null;
  };

  const initials = [
    (draft.nombres || '').charAt(0),
    (draft.apellidos || '').charAt(0),
  ].join('').toUpperCase() || '?';

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            onClick={handleAvatarClick}
            className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shadow-md border-2 border-gray-200 ${
              isEditing && avatarPath ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
            } bg-gradient-to-br from-[#D32F2F] to-[#8B0000]`}
          >
            {getAvatarSrc() ? (
              <img src={getAvatarSrc()} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold select-none">{initials}</span>
            )}
          </div>
          {isEditing && avatarPath && (
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow border-2 border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Camera size={14} className="text-gray-600" />
            </button>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        {isEditing && avatarPath && (
          <TextTiny className="text-gray-400 text-center">Clic para cambiar foto</TextTiny>
        )}
      </div>

      {/* Nombres + Apellidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombres"
          value={draft.nombres || ''}
          onChange={e => updateDraft({ nombres: e.target.value.toUpperCase() })}
          error={showErrors ? errors.nombres : null}
          viewMode={!isEditing}
          icon={User}
          uppercase
          required
          dark={dark}
        />
        <Input
          label="Apellidos"
          value={draft.apellidos || ''}
          onChange={e => updateDraft({ apellidos: e.target.value.toUpperCase() })}
          error={showErrors ? errors.apellidos : null}
          viewMode={!isEditing}
          icon={User}
          uppercase
          required
          dark={dark}
        />
      </div>

      {/* Email + Teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          {emailReadOnly ? (
            <>
              <Label className="ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <div className="w-full h-10 pl-9 px-3 text-sm font-semibold text-gray-500 flex items-center bg-gray-50 border border-gray-200 rounded-md">
                  {draft.email || <span className="italic">No disponible</span>}
                </div>
              </div>
              <TextTiny className="text-gray-400 ml-1">El email se gestiona desde autenticación</TextTiny>
            </>
          ) : (
            <Input
              label="Correo Electrónico"
              type="email"
              value={(draft.email || '').toLowerCase()}
              onChange={e => updateDraft({ email: e.target.value.toLowerCase() })}
              error={showErrors ? errors.email : null}
              viewMode={!isEditing}
              icon={Mail}
              dark={dark}
            />
          )}
        </div>

        <PhoneInput
          label="Teléfono / Celular"
          countryValue={draft.telefonoPaisIso || 'CO'}
          phoneValue={draft.telefono || ''}
          onCountryChange={v => updateDraft({ telefonoPaisIso: v })}
          onPhoneChange={v => updateDraft({ telefono: v })}
          error={showErrors ? errors.telefono : null}
          viewMode={!isEditing}
          dark={dark}
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
