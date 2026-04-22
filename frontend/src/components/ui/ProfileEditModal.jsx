import { useState, useRef } from 'react';
import { Camera, Lock, CheckCircle, Loader2, AlertCircle, Mail, FileText } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import SecureImage from './SecureImage';
import DocumentUploadManager from './DocumentUploadManager';
import UserSuccessModal from '../../modules/users/components/UserSuccessModal';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import { useAuth } from '../../context/AuthContext';
import { isManagementRole } from '../../utils/constants';

/**
 * Modal para que el usuario actualice su foto de perfil y/o contraseña.
 *
 * @param {boolean}  isOpen        - Controla visibilidad del modal
 * @param {Function} onClose       - Callback al cerrar
 * @param {{ id: string, nombres: string, apellidos: string, avatar_url: string, email: string }} user
 * @param {Function} onProfileUpdated - Callback para refrescar el perfil en AuthContext
 */
const ProfileEditModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
  const { uploadAvatar, loading } = useUpdateProfile();
  const { resetPassword } = useAuth();

  // ── Foto ──────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // ── Contraseña ────────────────────────────────────────────────────
  const [pwSending, setPwSending] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState(null);

  // ── Documentos ────────────────────────────────────────────────────
  const [docSuccessInfo, setDocSuccessInfo] = useState(null);

  const displayName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  // ── Handlers ──────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoSuccess(false);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La imagen no puede superar 5 MB');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSavePhoto = async () => {
    if (!selectedFile || !user?.id) return;
    setPhotoError(null);
    try {
      await uploadAvatar(user.id, selectedFile);
      setPhotoSuccess(true);
      setSelectedFile(null);
      onProfileUpdated?.();
    } catch (err) {
      setPhotoError(err.message || 'Error al guardar la foto');
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setPwSending(true);
    setPwError(null);
    try {
      await resetPassword(user.email);
      setPwSuccess(true);
    } catch (err) {
      setPwError(err.message || 'Error al enviar el correo');
    } finally {
      setPwSending(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setPhotoSuccess(false);
    setPhotoError(null);
    setPwSuccess(false);
    setPwError(null);
    onClose();
  };

  // Gestión de documentos propia: solo roles que no son CLIENTE
  // canManage: el propio usuario puede subir sus documentos (o el staff sobre otro)
  const canManage = user?.role && user.role !== 'CLIENTE';

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose} title="Mi Perfil" maxWidth="max-w-2xl">
      {/* Layout: 1 col móvil, 2 cols en md+ */}
      <div className="flex flex-col md:flex-row md:gap-8 md:items-start gap-8">

        {/* ── Columna izquierda: Foto + Contraseña ── */}
        <div className="flex flex-col gap-8 md:w-64 md:shrink-0">

          {/* Foto de perfil */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg shadow-red-900/15 ring-2 ring-gray-100">
                {previewUrl ? (
                  <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                ) : user?.avatar_url ? (
                  <SecureImage
                    path={user.avatar_url}
                    bucket="inmotika"
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#D32F2F] text-white flex items-center justify-center text-3xl font-black">
                    {initial}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center shadow-md hover:bg-[#D32F2F] transition-colors cursor-pointer"
                title="Cambiar foto"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm font-black text-gray-900 uppercase tracking-wide">{displayName}</p>
              <p className="text-xs text-gray-400 uppercase mt-0.5">{user?.role}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {photoError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 w-full">
                <AlertCircle size={13} />
                {photoError}
              </div>
            )}

            {photoSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 w-full">
                <CheckCircle size={13} />
                Foto actualizada correctamente
              </div>
            )}

            {selectedFile && !photoSuccess && (
              <Button onClick={handleSavePhoto} disabled={loading} variant="primary" className="w-full">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                Guardar foto
              </Button>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Cambiar contraseña */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-[#D32F2F]" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-700">Contraseña</span>
            </div>

            <p className="text-xs text-gray-500">
              Te enviaremos un correo a <span className="font-semibold text-gray-700">{user?.email}</span> para restablecer tu contraseña.
            </p>

            {pwError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={13} />
                {pwError}
              </div>
            )}

            {pwSuccess ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle size={13} />
                Correo enviado — revisa tu bandeja de entrada
              </div>
            ) : (
              <Button onClick={handleSendResetEmail} disabled={pwSending} variant="outline" className="w-full">
                {pwSending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Enviar correo de restablecimiento
              </Button>
            )}
          </div>
        </div>

        {/* Divisor vertical (solo en md+) / horizontal (móvil) */}
        {canManage && user?.id && (
          <>
            <div className="hidden md:block w-px bg-gray-100 self-stretch" />
            <div className="md:hidden border-t border-gray-100" />
          </>
        )}

        {/* ── Columna derecha: Documentos ── */}
        {canManage && user?.id && (
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-[#D32F2F]" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-700">Mis Documentos</span>
            </div>
            <DocumentUploadManager
              usuarioId={user.id}
              canManage={isManagementRole(user.role) || user.role === 'TECNICO'}
              onSaved={(doc, isReplace) => setDocSuccessInfo({
                isUpdate: true,
                hideDetails: true,
                title: isReplace ? '¡Documento reemplazado!' : '¡Documento guardado!',
                message: isReplace
                  ? `"${doc.nombre}" fue reemplazado correctamente.`
                  : `"${doc.nombre}" fue guardado correctamente.`,
              })}
              onError={(msg) => setDocSuccessInfo({ error: true, message: msg })}
            />
          </div>
        )}

      </div>
    </Modal>

    <UserSuccessModal
      successInfo={docSuccessInfo}
      onClose={() => setDocSuccessInfo(null)}
    />
    </>
  );
};

export default ProfileEditModal;
