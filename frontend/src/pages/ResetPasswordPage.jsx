import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginBackground from '../components/auth/LoginBackground';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ResetPasswordPage = ({ onComplete }) => {
  const { updatePassword, session, clearRecoveryFlow } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (newPassword) => {
    setLoading(true);
    try {
      if (updatePassword) {
        await updatePassword(newPassword);
      } else {
        // Fallback para modo mock
        console.log('Mock Update Password:', newPassword);
        return new Promise(resolve => setTimeout(resolve, 1500));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
        <LoginBackground />
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-white shadow-2xl border-0 overflow-hidden text-center p-10">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={30} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
            <p className="text-sm text-gray-600 mb-8">
              El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo desde la pantalla de ingreso.
            </p>
            <Button
              onClick={() => {
                clearRecoveryFlow?.();
                onComplete?.();
              }}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-full"
            >
              VOLVER AL INICIO
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <LoginBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <ResetPasswordForm 
          onUpdatePassword={handleUpdatePassword} 
          onComplete={onComplete}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
