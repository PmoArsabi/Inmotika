import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Label, TextSmall } from '../ui/Typography';

const LoginForm = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onSignIn({ email, password });
    }
  };

  return (
    <Card className="bg-white shadow-2xl border-0 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-8 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <h1 className="text-white text-2xl font-bold mb-2">Bienvenidos</h1>
          <h1 className="text-white text-2xl font-bold mb-2">Gestión Inmotik</h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="p-8 md:p-10 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold text-sm">Correo</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="sahina8017@gmail.com"
                className="w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 focus:border-[#D32F2F] outline-none transition-colors bg-transparent"
              />
              {emailValid && email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
              )}
            </div>
          </div>

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
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 border-b-2 border-gray-200 focus:border-[#D32F2F] outline-none transition-colors bg-transparent"
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

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-[#D32F2F] transition-colors underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#6A1B9A] text-white font-bold text-base uppercase rounded-full shadow-lg transition-all"
          >
            SIGN IN
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center pt-4">
          <TextSmall className="text-gray-600">
            Don't have account?{' '}
            <button
              type="button"
              className="text-[#D32F2F] font-semibold hover:underline"
            >
              Sign up
            </button>
          </TextSmall>
        </div>
      </div>
    </Card>
  );
};

export default LoginForm;
