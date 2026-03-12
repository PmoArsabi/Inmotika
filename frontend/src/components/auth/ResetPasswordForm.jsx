import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Label } from '../ui/Typography';

const ResetPasswordForm = ({ onUpdatePassword, onComplete, loading: externalLoading }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await onUpdatePassword(password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-white shadow-2xl border-0 overflow-hidden text-center p-10 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña Lista!</h2>
        <p className="text-gray-600 mb-8">
          Tu contraseña ha sido configurada correctamente. Ya puedes acceder a todas las funciones de Inmotika.
        </p>
        <Button 
          onClick={() => {
            if (onComplete) {
              onComplete();
            } else {
              window.location.href = '/';
            }
          }}
          className="w-full py-4 bg-linear-to-r from-green-600 to-green-800 text-white font-bold rounded-full"
        >
          IR AL PANEL PRINCIPAL
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-2xl border-0 overflow-hidden">
      {/* Header con gradiente premium */}
      <div className="bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-8 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-white text-2xl font-bold mb-1">Configurar Acceso</h1>
          <p className="text-white/80 text-sm">Define tu nueva contraseña de ingreso</p>
        </div>
      </div>

      <div className="p-8 md:p-10 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold text-sm">Nueva Contraseña</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || externalLoading}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 focus:border-[#D32F2F] outline-none transition-colors bg-transparent disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D32F2F] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold text-sm">Confirmar Contraseña</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || externalLoading}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 focus:border-[#D32F2F] outline-none transition-colors bg-transparent disabled:opacity-50"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || externalLoading}
            className="w-full py-4 bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white font-bold rounded-full shadow-lg transition-all"
          >
            {loading || externalLoading ? 'GUARDANDO...' : 'ACTIVAR CUENTA'}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ResetPasswordForm;
