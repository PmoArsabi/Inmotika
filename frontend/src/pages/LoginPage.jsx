import { useState } from 'react';
import LoginBackground from '../components/auth/LoginBackground';
import LoginForm from '../components/auth/LoginForm';
import RoleSelection from '../components/auth/RoleSelection';

const LoginPage = ({ onLogin }) => {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleSignIn = ({ email, password }) => {
    setUserEmail(email);
    setShowRoleSelection(true);
  };

  const handleRoleSelect = (userData) => {
    onLogin(userData);
  };

  const handleBack = () => {
    setShowRoleSelection(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <LoginBackground />
      
      <div className="relative z-10 w-full max-w-md">
        {!showRoleSelection ? (
          <LoginForm onSignIn={handleSignIn} />
        ) : (
          <RoleSelection 
            onRoleSelect={handleRoleSelect} 
            onBack={handleBack}
            email={userEmail}
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
