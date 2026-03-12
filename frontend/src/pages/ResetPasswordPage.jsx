import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginBackground from '../components/auth/LoginBackground';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const ResetPasswordPage = ({ onComplete }) => {
  const { updatePassword } = useAuth();
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
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
