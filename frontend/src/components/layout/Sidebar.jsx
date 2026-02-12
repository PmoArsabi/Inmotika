import {
  LayoutDashboard, ClipboardList, Settings, Calendar, Building2,
  Database, Cpu, Eye, LogOut, X
} from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { H3, TextSmall, Subtitle } from '../ui/Typography';

const Sidebar = ({ user, activeTab, setActiveTab, onLogout, className = "", onToggleMobileMenu }) => {
  const getMenuItems = () => {
    if (user.role === ROLES.DIRECTOR || user.role === ROLES.COORDINADOR) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'visits', label: 'Visitas', icon: ClipboardList },
        { id: 'configuration', label: 'Maestros', icon: Settings },
      ];
    }
    if (user.role === ROLES.TECNICO) {
      return [
        { id: 'schedule', label: 'Mi Agenda', icon: Calendar },
      ];
    }
    if (user.role === ROLES.CLIENTE) {
      return [
        { id: 'client-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'client-data', label: 'Datos', icon: Building2 },
        { id: 'client-inventory', label: 'Inventario', icon: Cpu },
        { id: 'client-visits', label: 'Visitas', icon: Eye },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`flex flex-col w-72 bg-[#1A1A1A] text-white h-screen sticky top-0 ${className}`}>
      {/* Logo */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D32F2F] rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
            <Database size={24} />
          </div>
          <div>
            <H3 className="uppercase leading-none text-white text-lg">Inmotika</H3>
            <TextSmall className="text-gray-500 uppercase mt-1 text-[8px]">Field Service</TextSmall>
          </div>
        </div>
        {onToggleMobileMenu && (
          <button onClick={onToggleMobileMenu} className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-8 py-6 border-b border-white/5">
        <Subtitle className="truncate text-white text-sm">{user.name}</Subtitle>
        <TextSmall className="text-gray-500 uppercase mt-1">{user.role}</TextSmall>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
              activeTab === item.id
                ? 'bg-white text-[#1A1A1A] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <TextSmall className={`uppercase font-bold ${activeTab === item.id ? 'text-[#1A1A1A]' : 'text-gray-400 hover:text-white'}`}>
              {item.label}
            </TextSmall>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-500 hover:text-[#D32F2F] hover:bg-red-500/5 transition-all group"
        >
          <LogOut size={20} />
          <TextSmall className="uppercase font-bold text-gray-500 group-hover:text-[#D32F2F]">Cerrar Sesión</TextSmall>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
