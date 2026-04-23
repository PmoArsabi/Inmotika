import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, ClipboardList, Settings, Calendar, Building2,
  Cpu, ChevronDown, Users,
  Phone, UserCog, Tag,
  CalendarCheck, PlayCircle, List, ClipboardCheck, MessageSquare,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ROLES, isManagementRole } from '../../utils/constants';
import { H3, TextSmall } from '../ui/Typography';

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  className = '',
  collapsed = false,
  onToggleCollapsed,
}) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const userRole = user?.role;
  const menuItems = useMemo(() => {
    if (isManagementRole(userRole)) {
      return [
        { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard },
        {
          id: 'configuration',
          label: 'Configuración',
          icon: Settings,
          hasSubItems: true,
          subItems: [
            { id: 'configuration-clientes',     label: 'Clientes',     icon: Users   },
            { id: 'configuration-contacto',     label: 'Contactos',    icon: Phone   },
            { id: 'configuration-dispositivos', label: 'Dispositivos', icon: Cpu     },
            { id: 'configuration-categorias',   label: 'Categorías',   icon: Tag     },
            { id: 'configuration-usuarios',     label: 'Usuarios',     icon: UserCog },
          ],
        },
        {
          id: 'visits',
          label: 'Gestión Visitas',
          icon: ClipboardList,
          hasSubItems: true,
          subItems: [
            { id: 'visits-solicitudes',  label: 'Solicitud Visita', icon: List          },
            { id: 'visits-programacion', label: 'Programación',     icon: CalendarCheck },
            { id: 'visits-gestion',      label: 'Gestión Visitas',  icon: PlayCircle    },
            ...(userRole === ROLES.COORDINADOR
              ? [{ id: 'visits-validacion-informes', label: 'Validar Informes',  icon: ClipboardCheck }]
              : []),
            ...(userRole === ROLES.DIRECTOR
              ? [{ id: 'visits-aprobacion-informes', label: 'Aprobar Informes', icon: ClipboardCheck }]
              : []),
            { id: 'visits-mensajes', label: 'Mensajes', icon: MessageSquare },
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
            { id: 'visits-gestion',  label: 'Gestión Visitas', icon: PlayCircle    },
            { id: 'visits-mensajes', label: 'Mensajes',        icon: MessageSquare },
          ],
        },
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
            { id: 'client-data',      label: 'Mis Datos',    icon: Building2 },
            { id: 'client-inventory', label: 'Dispositivos', icon: Cpu       },
          ],
        },
        {
          id: 'visits',
          label: 'Gestión Visitas',
          icon: ClipboardList,
          hasSubItems: true,
          subItems: [
            { id: 'visits-solicitudes', label: 'Solicitar Visita', icon: List },
          ],
        },
      ];
    }
    return [];
  }, [userRole]);

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.hasSubItems && item.subItems) {
        const hasActiveSubItem = item.subItems.some(sub => activeTab === sub.id);
        if (hasActiveSubItem) {
          setExpandedMenus(prev => prev[item.id] ? prev : { ...prev, [item.id]: true });
        }
      }
    });
  }, [activeTab, menuItems]);

  return (
    <aside
      className={`flex flex-col bg-canvas text-white h-screen transition-[width] duration-300 ease-in-out border-r border-white/5 ${
        collapsed ? 'w-14' : 'w-60'
      } ${className}`}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center border-b border-white/5 h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'pl-4 pr-2'}`}>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <H3 className="text-white text-sm leading-none whitespace-nowrap">Inmotika</H3>
            <TextSmall className="text-gray-500 uppercase mt-0.5 text-2xs whitespace-nowrap">Acceso a un mundo diferente</TextSmall>
          </div>
        )}
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-colors duration-(--transition-fast) shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 flex flex-col overflow-y-auto ${collapsed ? 'items-center px-2 gap-1' : 'px-2 gap-0.5'}`}>
        {menuItems.map(item => {
          const active = activeTab === item.id || (item.subItems && item.subItems.some(sub => activeTab === sub.id));
          const isExpanded = expandedMenus[item.id] && !collapsed;
          const hasSubItems = item.hasSubItems && item.subItems;

          return (
            <div key={item.id} className="w-full">
              <button
                onClick={() => {
                  if (hasSubItems && !collapsed) toggleMenu(item.id);
                  else setActiveTab(item.id);
                }}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full rounded-xl transition-colors duration-(--transition-fast) outline-none ${
                  collapsed ? 'w-10 h-10 justify-center' : 'gap-3 px-3 py-2.5 justify-between'
                } ${
                  active
                    ? 'bg-brand/15 text-white border border-brand/20'
                    : 'text-gray-500 hover:text-white hover:bg-white/6 border border-transparent'
                }`}
              >
                <div className={`flex items-center gap-3 ${collapsed ? '' : 'flex-1 min-w-0'}`}>
                  <item.icon size={19} className="shrink-0" />
                  {!collapsed && (
                    <TextSmall className={`font-medium whitespace-nowrap ${active ? 'text-white' : 'text-gray-400'}`}>
                      {item.label}
                    </TextSmall>
                  )}
                </div>
                {hasSubItems && !collapsed && (
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-(--transition-fast) text-gray-500 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {hasSubItems && isExpanded && !collapsed && (
                <div className="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-white/8 pl-3">
                  {item.subItems.map(subItem => {
                    const subActive = activeTab === subItem.id;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => setActiveTab(subItem.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 w-full rounded-lg transition-colors duration-(--transition-fast) outline-none ${
                          subActive
                            ? 'bg-brand/15 text-white border border-brand/20'
                            : 'text-gray-500 hover:text-white hover:bg-white/6 border border-transparent'
                        }`}
                      >
                        <subItem.icon size={15} className="shrink-0" />
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
    </aside>
  );
};

export default Sidebar;
