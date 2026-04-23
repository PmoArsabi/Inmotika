import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Label } from '../ui/Typography';
import { useNotify } from '../../context/NotificationContext';

const LoginForm = ({ onSignIn, onResetPassword }) => {
  const notify = useNotify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailValid) return;

    setLoading(true);
    try {
      if (isForgotMode) {
        await onResetPassword(email);
        setIsSuccess(true);
      } else {
        if (password) {
          await onSignIn({ email, password });
        }
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="bg-white shadow-2xl border-0 overflow-hidden text-center p-10">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={30} className="text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
        <p className="text-sm text-gray-600 mb-8">
          Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
        <Button 
          onClick={() => { setIsForgotMode(false); setIsSuccess(false); setPassword(''); }}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-full"
        >
          VOLVER AL INICIO
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-2xl border-0 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-linear-to-r from-brand via-brand-dark to-brand-deeper px-8 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <h1 className="text-white text-2xl font-bold mb-2">
            {isForgotMode ? 'Recuperar Acceso' : 'Gestión Inmotik'}
          </h1>
          <p className="text-white/80 text-sm">
            {isForgotMode ? 'Ingresa tu correo para recibir el enlace' : 'Bienvenido de nuevo'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="p-8 md:p-10 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold text-sm">Correo Electrónico</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                placeholder="usuario@inmotika.co"
                className="w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 focus:border-brand outline-none transition-colors bg-transparent disabled:opacity-50"
                required
              />
              {emailValid && email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
              )}
            </div>
          </div>

          {!isForgotMode && (
            <>
              {/* Password Field */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">Contraseña</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 focus:border-brand outline-none transition-colors bg-transparent disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors cursor-pointer"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotMode(true)}
                  className="text-sm text-gray-600 hover:text-brand transition-colors underline cursor-pointer"
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="space-y-4">
            <Button
              type="submit"
              disabled={loading || !emailValid || (!isForgotMode && !password)}
              className="w-full py-4 bg-linear-to-r from-brand to-brand-deeper hover:from-brand-dark hover:to-brand-deeper text-white font-bold text-base uppercase rounded-full shadow-lg transition-all"
            >
              {loading ? 'Procesando...' : (isForgotMode ? 'ENVIAR ENLACE' : 'INGRESAR')}
            </Button>

            {isForgotMode && (
              <button
                type="button"
                onClick={() => setIsForgotMode(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                disabled={loading}
              >
                VOLVER AL LOGUEO
              </button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
};

export default LoginForm;
