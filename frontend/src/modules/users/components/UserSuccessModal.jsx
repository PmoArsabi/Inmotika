import { X, CheckCircle, Send, RefreshCw, User, Mail, Shield } from 'lucide-react';
import { H2 } from '../../../components/ui/Typography';

const UserSuccessModal = ({ successInfo, onClose }) => {
  if (!successInfo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {successInfo.error ? (
          /* ── Error ── */
          <>
            <div className="bg-linear-to-br from-red-500 to-red-700 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <X size={32} className="text-white" />
              </div>
              <h2 className="text-white font-bold text-xl">Error en la operación</h2>
            </div>
            <div className="p-6 text-center space-y-4">
              <p className="text-gray-600 text-sm">{successInfo.message}</p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </>
        ) : (
          /* ── Éxito ── */
          <>
            {successInfo.isUpdate ? (
              <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -translate-x-12 translate-y-12 blur-xl" />
                
                <div className="relative flex flex-col items-center text-center">
                  <div className="bg-white/20 p-3 rounded-full mb-4 backdrop-blur-sm">
                    <CheckCircle size={32} />
                  </div>
                  <H2 className="text-white font-black text-2xl tracking-tight">¡Actualizado!</H2>
                  <p className="text-white/80 text-sm mt-1">
                    Los datos han sido guardados exitosamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-linear-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 text-center relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 border-2 border-white/30 backdrop-blur-sm">
                    {successInfo.isResend ? <RefreshCw size={28} /> : <Send size={28} />}
                  </div>
                  <h2 className="font-black text-2xl tracking-tight">
                    {successInfo.isResend ? '¡Invitación Reenviada!' : '¡Invitación Enviada!'}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    {successInfo.isResend ? 'Se volvió a enviar el correo de activación.' : 'El correo de activación fue enviado con éxito.'}
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={15} className="text-gray-400 shrink-0" />
                  <span className="text-gray-500">Usuario:</span>
                  <span className="font-semibold text-gray-800">{successInfo.nombres}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={15} className="text-gray-400 shrink-0" />
                  <span className="text-gray-500">Correo:</span>
                  <span className="font-semibold text-gray-800 break-all">{successInfo.email}</span>
                </div>
                {!successInfo.isUpdate && successInfo.rol && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield size={15} className="text-gray-400 shrink-0" />
                    <span className="text-gray-500">Rol asignado:</span>
                    <span className="font-semibold text-gray-800">{successInfo.rol}</span>
                  </div>
                )}
              </div>

              {!successInfo.isUpdate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-700 text-xs leading-relaxed">
                    <strong>Próximo paso:</strong> El usuario recibirá un correo con un enlace para configurar su contraseña y acceder a la plataforma.
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                Perfecto
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserSuccessModal;
