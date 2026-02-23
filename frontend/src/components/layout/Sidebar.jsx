import {
  LayoutDashboard, ClipboardList, Settings, Calendar, Building2,
  Cpu, Eye, LogOut, X, ChevronLeft, ChevronRight, Users
} from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { H3, TextSmall, Subtitle } from '../ui/Typography';

/**
 * SIDEBAR COMPONENT - REFINED v5.0 (Perfect Centered Squares)
 * - Narrower collapsed mode: 52px (w-[52px])
 * - Centered SQUARE highlights (active/hover): rounded-xl (12px)
 * - NO concave joins here (as per clarified user request)
 */
const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  className = '',
  onToggleMobileMenu,
  collapsed = false,
  onToggleCollapsed,
}) => {
  const getMenuItems = () => {
    if (user.role === ROLES.DIRECTOR || user.role === ROLES.COORDINADOR) {
      return [
        { id: 'dashboard',     label: 'Tablero Control', icon: LayoutDashboard },
        { id: 'visits',        label: 'Gestión Visitas', icon: ClipboardList },
        { id: 'configuration', label: 'Configuración',   icon: Settings },
      ];
    }
    if (user.role === ROLES.TECNICO)  return [{ id: 'schedule', label: 'Mi Agenda', icon: Calendar }];
    if (user.role === ROLES.CLIENTE) {
      return [
        { id: 'client-dashboard', label: 'Dashboard',  icon: LayoutDashboard },
        { id: 'client-data',      label: 'Datos',      icon: Building2 },
        { id: 'client-inventory', label: 'Inventario', icon: Cpu },
        { id: 'client-visits',    label: 'Visitas',    icon: Eye },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`flex flex-col bg-[#1A1A1A] text-white h-screen sticky top-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-[52px]' : 'w-60'
      } ${className}`}
    >
      {/* Logo Section */}
      <div className={`flex items-center border-b border-white/5 h-16 shrink-0 ${collapsed ? 'justify-center' : 'px-4'}`}>
        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-[#D32F2F] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0">
            <span className="text-white font-black text-lg">I</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-in fade-in duration-300">
              <H3 className="text-white text-sm leading-none whitespace-nowrap">Inmotika</H3>
              <TextSmall className="text-gray-500 uppercase mt-0.5 text-[8px] whitespace-nowrap">Field Service</TextSmall>
            </div>
          )}
        </div>
      </div>

      {/* Navigation section */}
      <nav className={`flex-1 py-10 flex flex-col items-center ${collapsed ? 'space-y-6' : 'px-2 space-y-1'}`}>
        {menuItems.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center transition-all outline-none rounded-xl ${
                collapsed 
                  ? 'w-10 h-10 justify-center' 
                  : 'w-full gap-3 px-3 py-2.5'
              } ${
                active
                  ? 'bg-[#D32F2F] text-white shadow-lg shadow-red-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={22} className="shrink-0" />
              {!collapsed && (
                <div className="overflow-hidden animate-in fade-in duration-300">
                  <TextSmall className={`uppercase font-bold whitespace-nowrap ${active ? 'text-white' : 'text-gray-400'}`}>
                    {item.label}
                  </TextSmall>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User block & Logout */}
      <div className={`border-t border-white/5 py-10 flex flex-col items-center shrink-0 ${collapsed ? 'space-y-8' : 'space-y-2'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'w-full gap-3 px-4 py-2'}`}>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Users size={18} className="text-gray-400" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-in fade-in duration-300 min-w-0">
              <Subtitle className="text-white text-xs truncate normal-case tracking-normal font-bold">
                {user.name}
              </Subtitle>
              <TextSmall className="text-[#D32F2F] uppercase mt-0.5">{user.role}</TextSmall>
            </div>
          )}
        </div>

        <div className={collapsed ? 'w-full flex justify-center' : 'w-full px-2'}>
          <button
            onClick={onLogout}
            title={collapsed ? 'Salir del sistema' : undefined}
            className={`flex items-center transition-all group outline-none rounded-xl ${
              collapsed 
                ? 'w-10 h-10 justify-center' 
                : 'w-full gap-3 px-2 py-2'
            } text-gray-500 hover:text-[#D32F2F] hover:bg-red-500/5`}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && (
              <div className="overflow-hidden animate-in fade-in duration-300">
                <TextSmall className="uppercase font-bold text-gray-500 group-hover:text-[#D32F2F] whitespace-nowrap">
                  Salir del Sistema
                </TextSmall>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
