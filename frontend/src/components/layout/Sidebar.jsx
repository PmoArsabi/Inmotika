import {
  LayoutDashboard, ClipboardList, Settings, Calendar, Building2,
  Database, Cpu, Eye, LogOut
} from 'lucide-react';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ user, activeTab, setActiveTab, onLogout }) => {
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
    <aside className="hidden lg:flex flex-col w-72 bg-[#1A1A1A] text-white h-screen sticky top-0">
      {/* Logo */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D32F2F] rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Inmotika</h1>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1">Field Service</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-8 py-6 border-b border-white/5">
        <p className="text-sm font-black truncate">{user.name}</p>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{user.role}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === item.id
                ? 'bg-white text-[#1A1A1A] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#D32F2F] hover:bg-red-500/5 transition-all"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
