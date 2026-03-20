import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import LoginBackground from '../components/auth/LoginBackground';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  const { signIn, resetPassword } = useAuth();
  const notify = useNotify();

  const handleSignIn = async ({ email, password }) => {
    try {
      await signIn(email, password);
    } catch (error) {
      notify('error', 'Error al iniciar sesión: ' + error.message);
    }
  };

  const handleResetPassword = async (email) => {
    await resetPassword(email);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <LoginBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <LoginForm onSignIn={handleSignIn} onResetPassword={handleResetPassword} />
      </div>
    </div>
  );
};

export default LoginPage;
