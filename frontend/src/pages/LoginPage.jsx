import { useAuth } from '../context/AuthContext';
import LoginBackground from '../components/auth/LoginBackground';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  const { signIn } = useAuth();

  const handleSignIn = async ({ email, password }) => {
    try {
      await signIn(email, password);
      // El AuthContext detectará el cambio y el useEffect en App.jsx redirigirá al usuario
    } catch (error) {
      alert('Error al iniciar sesión: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <LoginBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <LoginForm onSignIn={handleSignIn} />
      </div>
    </div>
  );
};

export default LoginPage;
