import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ClipboardList, Settings, Calendar, Building2,
  Cpu, Eye, LogOut, Menu, ChevronUp, ChevronDown, Users,
  FileText, Wallet, BarChart, Bell, Phone, UserCog, Tag,
  CalendarCheck, PlayCircle, List
} from 'lucide-react';
import { ROLES, isManagementRole } from '../../utils/constants';
import { H3, TextSmall, Subtitle } from '../ui/Typography';

/**
 * SIDEBAR COMPONENT - Updated to match reference design
 * - Expandable menu items with sub-items
 * - Hamburger menu toggle
 * - User profile with name and email
 */
const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  className = '',
  collapsed = false,
  onToggleCollapsed,
}) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Memoized so the auto-expand effect only fires when activeTab truly changes,
  // not on every render (which was causing the menu to re-open after the user closed it).
  const userRole = user?.role;
  const menuItems = useMemo(() => {
    if (isManagementRole(userRole)) {
      return [
        {
          id: 'dashboard',
          label: 'Tablero',
          icon: LayoutDashboard
        },
        {
          id: 'configuration',
          label: 'Configuración',
          icon: Settings,
          hasSubItems: true,
          subItems: [
            { id: 'configuration-clientes',     label: 'Clientes',    icon: Users   },
            { id: 'configuration-contacto',     label: 'Contactos',    icon: Phone   },
            { id: 'configuration-dispositivos', label: 'Dispositivos', icon: Cpu    },
            { id: 'configuration-categorias',   label: 'Categorías',  icon: Tag     },
            { id: 'configuration-usuarios',     label: 'Usuarios Ap', icon: UserCog },
          ]
        },
        {
          id: 'visits',
          label: 'Gestión Visitas',
          icon: ClipboardList,
          hasSubItems: true,
          subItems: [
            { id: 'visits-solicitudes',  label: 'Solicitud Visita', icon: List         },
            { id: 'visits-programacion', label: 'Programación',     icon: CalendarCheck },
            { id: 'visits-gestion',      label: 'Gestión Visitas',  icon: PlayCircle   },
          ],
        },
      ];
    }
    if (userRole === ROLES.TECNICO) {
      return [
        { id: 'schedule', label: 'Tablero', icon: Calendar },
        {
          id: 'visits',
          label: 'Gestión Visitas',
          icon: ClipboardList,
          hasSubItems: true,
          subItems: [
            { id: 'visits-gestion', label: 'Gestión Visitas', icon: PlayCircle },
          ],
        }
      ];
    }
    if (userRole === ROLES.CLIENTE) {
      return [
        { id: 'client-dashboard', label: 'Tablero', icon: LayoutDashboard },
        {
          id: 'client-config',
          label: 'Configuración',
          icon: Building2,
          hasSubItems: true,
          subItems: [
            { id: 'client-data',      label: 'Mis Datos',   icon: Building2 },
            { id: 'client-inventory', label: 'Dispositivos', icon: Cpu },
          ],
        },
        {
          id: 'visits',
          label: 'Gestión Visitas',
          icon: ClipboardList,
          hasSubItems: true,
          subItems: [
            { id: 'visits-solicitudes', label: 'Solicitar Visita', icon: List }
          ],
        },
      ];
    }
    return [];
  }, [userRole]);

  // Auto-expand parent when navigating to a sub-item from outside the sidebar.
  // Only opens — never fights against an explicit user collapse.
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.hasSubItems && item.subItems) {
        const hasActiveSubItem = item.subItems.some(sub => activeTab === sub.id);
        if (hasActiveSubItem) {
          setExpandedMenus(prev =>
            prev[item.id] ? prev : { ...prev, [item.id]: true }
          );
        }
      }
    });
  }, [activeTab, menuItems]);

  return (
    <aside
      className={`flex flex-col bg-[#1A1A1A] text-white h-screen sticky top-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-[52px]' : 'w-60'
      } ${className}`}
    >
      {/* Logo Section */}
      <div className={`flex items-center justify-between border-b border-white/5 h-16 shrink-0 ${collapsed ? 'px-0 justify-center' : 'px-4'}`}>
        {!collapsed && (
          <div className="overflow-hidden animate-in fade-in duration-300">
            <H3 className="text-white text-sm leading-none whitespace-nowrap">Inmotika</H3>
            <TextSmall className="text-gray-500 uppercase mt-0.5 text-[8px] whitespace-nowrap">Gestión Inmobiliaria</TextSmall>
          </div>
        )}
        {!collapsed && onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Colapsar menú"
          >
            <Menu size={18} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Navigation section */}
      <nav className={`flex-1 py-10 flex flex-col ${collapsed ? 'items-center space-y-6' : 'px-2 space-y-1'}`}>
        {menuItems.map(item => {
          const active = activeTab === item.id || (item.subItems && item.subItems.some(sub => activeTab === sub.id));
          const isExpanded = expandedMenus[item.id] && !collapsed;
          const hasSubItems = item.hasSubItems && item.subItems;

          return (
            <div key={item.id} className="w-full">
              <button
                onClick={() => {
                  if (hasSubItems && !collapsed) {
                    toggleMenu(item.id);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center transition-all outline-none rounded-xl ${
                  collapsed 
                    ? 'w-10 h-10 justify-center mx-auto' 
                    : 'w-full gap-3 px-3 py-2.5 justify-between'
                } ${
                  active
                    ? 'bg-blue-500/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <item.icon size={22} className="shrink-0" />
                  {!collapsed && (
                    <div className="overflow-hidden animate-in fade-in duration-300">
                      <TextSmall className={`font-medium whitespace-nowrap ${active ? 'text-white' : 'text-gray-400'}`}>
                        {item.label}
                      </TextSmall>
                    </div>
                  )}
                </div>
                {hasSubItems && !collapsed && (
                  <ChevronUp 
                    size={16} 
                    className={`shrink-0 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
                  />
                )}
              </button>
              
              {/* Sub-items */}
              {hasSubItems && isExpanded && !collapsed && (
                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                  {item.subItems.map(subItem => {
                    const subActive = activeTab === subItem.id;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveTab(subItem.id)}
                        className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-all outline-none ${
                          subActive
                            ? 'bg-blue-500/20 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <subItem.icon size={18} className="shrink-0" />
                        <TextSmall className={`font-medium whitespace-nowrap ${subActive ? 'text-white' : 'text-gray-400'}`}>
                          {subItem.label}
                        </TextSmall>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User block & Logout */}
      <div className={`border-t border-white/5 py-4 flex flex-col shrink-0 ${collapsed ? 'items-center space-y-4' : 'space-y-2'}`}>
        {!collapsed && (
          <>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-all outline-none text-gray-400 hover:text-white hover:bg-white/5"
            >
              <LogOut size={20} className="shrink-0" />
              <TextSmall className="font-medium whitespace-nowrap">Cerrar sesión</TextSmall>
            </button>
          </>
        )}

        {collapsed && (
          <>
            <button
              onClick={onLogout}
              className="w-10 h-10 mx-auto rounded-lg transition-all outline-none text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center"
              title="Salir del sistema"
            >
              <LogOut size={20} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
