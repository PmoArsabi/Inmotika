import { Menu, Bell } from 'lucide-react';
import { TextSmall } from '../ui/Typography';

// Maps route IDs to human-readable section names
const SECTION_LABELS = {
  'dashboard':        { title: 'Tablero de Control', subtitle: 'Módulo Operativo' },
  'visits':           { title: 'Gestión de Visitas', subtitle: 'Módulo Operativo' },
  'configuration':    { title: 'Maestros',            subtitle: 'Módulo Operativo' },
  'schedule':         { title: 'Mi Agenda',           subtitle: 'Módulo Técnico' },
  'client-dashboard': { title: 'Dashboard',           subtitle: 'Portal Cliente' },
  'client-data':      { title: 'Mis Datos',           subtitle: 'Portal Cliente' },
  'client-inventory': { title: 'Inventario',          subtitle: 'Portal Cliente' },
  'client-visits':    { title: 'Visitas',             subtitle: 'Portal Cliente' },
};

const Header = ({ user, activeTab, onToggleMobileMenu }) => {
  const section = SECTION_LABELS[activeTab];

  return (
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

          {/* Section name — styled like the reference image */}
          {section && (
            <div className="leading-tight">
              <p className="text-[10px] font-black text-[#D32F2F] uppercase tracking-[0.15em]">
                {section.subtitle}
              </p>
              <h1 className="text-xl font-black text-gray-900 uppercase leading-none tracking-tight">
                {section.title}
              </h1>
            </div>
          )}
        </div>

        {/* Right — notifications + user */}
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <Bell size={18} className="text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D32F2F] rounded-full animate-pulse border-2 border-white" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#D32F2F] text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-red-900/20">
              {user.name?.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] font-black text-gray-900 uppercase tracking-wide leading-none">
                {user.name}
              </p>
              <TextSmall className="text-gray-400 uppercase mt-0.5">{user.role}</TextSmall>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
