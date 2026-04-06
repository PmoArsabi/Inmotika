import { useState } from 'react';
import { Menu } from 'lucide-react';
import { TextSmall } from '../ui/Typography';
import SecureImage from '../ui/SecureImage';
import ProfileEditModal from '../ui/ProfileEditModal';
import { useAuth } from '../../context/AuthContext';

// Maps route IDs to human-readable section names
const SECTION_LABELS = {
  'dashboard':        { title: 'Tablero de Control', subtitle: 'Módulo Operativo' },
  'visits':           { title: 'Gestión de Visitas', subtitle: 'Módulo Operativo' },
  'configuration':    { title: 'Maestros',           subtitle: 'Módulo Operativo' },
  'schedule':         { title: 'Tablero',            subtitle: 'Módulo Técnico'  },
  'client-dashboard': { title: 'Tablero',            subtitle: 'Portal Cliente'  },
  'client-data':      { title: 'Mis Datos',          subtitle: 'Portal Cliente'  },
  'client-inventory': { title: 'Inventario',         subtitle: 'Portal Cliente'  },
  'client-visits':    { title: 'Visitas',            subtitle: 'Portal Cliente'  },
};

const getDisplayName = (user) => {
  if (!user) return 'Usuario';
  const full = `${user.nombres || ''} ${user.apellidos || ''}`.trim();
  return full || user.email?.split('@')[0] || 'Usuario';
};

const getInitial = (user) => {
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase();
};

const Header = ({ user, onToggleMobileMenu }) => {
  const { refreshProfile } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const displayName = getDisplayName(user);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Left — section title */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Right — user info + avatar clickeable */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-gray-100 transition-colors cursor-pointer group"
              title="Editar perfil"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-red-900/20 shrink-0 ring-2 ring-transparent group-hover:ring-[#D32F2F]/30 transition-all">
                {user?.avatar_url ? (
                  <SecureImage
                    path={user.avatar_url}
                    bucket="inmotika"
                    alt={getDisplayName(user)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#D32F2F] text-white flex items-center justify-center text-xs font-black">
                    {getInitial(user)}
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-wide leading-none">
                  {displayName}
                </p>
                <TextSmall className="text-gray-400 uppercase mt-0.5">{user?.role}</TextSmall>
              </div>
            </button>
          </div>

        </div>
      </header>

      <ProfileEditModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onProfileUpdated={refreshProfile}
      />
    </>
  );
};

export default Header;
