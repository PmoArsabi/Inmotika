import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROLES } from './utils/constants';
import { INITIAL_DATA } from './utils/mockData';
import { useAuth } from './context/AuthContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VisitsPage from './pages/VisitsPage';
import ConfigurationPage from './pages/ConfigurationPage';
import SchedulePage from './pages/SchedulePage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ClientDataPage from './pages/ClientDataPage';
import ClientInventoryPage from './pages/ClientInventoryPage';
import ClientVisitsPage from './pages/ClientVisitsPage';
import UsersPage from './pages/UsersPage';
import CategoriasPage from './pages/CategoriasPage';
import SolicitudVisitaPage from './pages/visits/SolicitudVisitaPage';
import ProgramacionVisitaPage from './pages/visits/ProgramacionVisitaPage';
import GestionVisitasPage from './pages/visits/GestionVisitasPage';

function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [data, setData]               = useState(INITIAL_DATA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );

  // Efecto para limpiar la URL y redirigir según el rol
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
    
    // Sólo empujamos la pestaña por defecto si el usuario se acaba de firmar
    // (o sea, si estaba en dashboard que es el origen por default)
    if (user && activeTab === 'dashboard') {
      const uRole = user.role || 'TECNICO';
      const isAdmGrp = uRole === 'ADMIN' || uRole === 'DIRECTOR' || uRole === 'COORDINADOR';

      // Default tabs & protection from URL forcing
      if (uRole === 'CLIENTE') {
        if (!activeTab.startsWith('client-') && activeTab !== 'visits-solicitudes') {
          setActiveTab('client-dashboard');
        }
      } else if (uRole === 'TECNICO') {
        if (activeTab !== 'schedule' && activeTab !== 'visits-gestion') {
          setActiveTab('schedule');
        }
      } else if (isAdmGrp) {
        if (!activeTab || activeTab.startsWith('client-')) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
  };

  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  // Mostrar LoginPage si no hay usuario y no está cargando
  if (!authLoading && !user) {
    return <LoginPage />;
  }

  // Si está cargando, el AuthContext ya muestra el spinner
  if (authLoading) {
    return null;
  }

  // Si no hay usuario después de cargar, mostrar LoginPage
  if (!user) {
    return <LoginPage />;
  }

  // Extract subTab from visits tabs
  const getVisitsSubTab = (tab) => {
    if (tab.startsWith('visits-')) return tab.replace('visits-', '');
    return null;
  };

  // Extract subTab from configuration tabs
  const getConfigurationSubTab = (tab) => {
    if (tab.startsWith('configuration-')) {
      const subTab = tab.replace('configuration-', '');
      // Map 'sucursal' to 'clientes' (se maneja dentro del flujo de clientes)
      if (subTab === 'sucursal') {
        return 'clientes';
      }
      // Contacto tiene su propia vista de contactos
      if (subTab === 'contacto') {
        return 'contactos';
      }
      return subTab;
    }
    return null;
  };

  const renderPage = () => {
    try {
      // Identificar el rol del usuario para restringir módulos
      const userRole = user?.role || 'TECNICO';
      const isAdminGroup = userRole === 'ADMIN' || userRole === 'DIRECTOR' || userRole === 'COORDINADOR';

      // 1. Handle visits sub-tabs
      const visitsSubTab = getVisitsSubTab(activeTab);
      
      if (visitsSubTab === 'solicitudes') {
        if (isAdminGroup || userRole === 'CLIENTE') return <SolicitudVisitaPage data={data} setData={setData} />;
        return <div className="p-8 text-red-500 font-bold">Acceso Denegado</div>;
      }
      
      if (visitsSubTab === 'programacion') {
        if (isAdminGroup) return <ProgramacionVisitaPage data={data} setData={setData} />;
        return <div className="p-8 text-red-500 font-bold">Acceso Denegado</div>;
      }
      
      if (visitsSubTab === 'gestion') {
        if (isAdminGroup || userRole === 'TECNICO') return <GestionVisitasPage data={data} setData={setData} />;
        return <div className="p-8 text-red-500 font-bold">Acceso Denegado</div>;
      }

      // Handle configuration sub-tabs (Sólo Admin Group)
      const configSubTab = getConfigurationSubTab(activeTab);
      if (configSubTab) {
        if (!isAdminGroup) return <div className="p-8 text-red-500 font-bold">Acceso Denegado: Requiere permisos de Administración</div>;
        
        if (configSubTab === 'usuarios') return <UsersPage data={data} setData={setData} />;
        if (configSubTab === 'categorias') return <CategoriasPage />;
        return <ConfigurationPage key={activeTab} data={data} setData={setData} initialSubTab={configSubTab} isSingleTabView={true} />;
      }

      switch (activeTab) {
        case 'dashboard':        return isAdminGroup ? <DashboardPage data={data} /> : <div className="p-8">Acceso Denegado</div>;
        case 'visits':           return <VisitsPage data={data} setData={setData} />; // Esta página madre debe manejar su propio render
        case 'configuration':    return isAdminGroup ? <ConfigurationPage key={activeTab} data={data} setData={setData} isSingleTabView={false} /> : <div className="p-8">Acceso Denegado</div>;
        case 'schedule':         return (isAdminGroup || userRole === 'TECNICO') ? <SchedulePage data={data} setData={setData} /> : <div className="p-8">Acceso Denegado</div>;
        
        // Vistas específicas de cliente
        case 'client-dashboard': return userRole === 'CLIENTE' ? <ClientDashboardPage data={data} /> : <div className="p-8">Acceso Denegado</div>;
        case 'client-data':      return userRole === 'CLIENTE' ? <ClientDataPage data={data} /> : <div className="p-8">Acceso Denegado</div>;
        case 'client-inventory': return userRole === 'CLIENTE' ? <ClientInventoryPage data={data} /> : <div className="p-8">Acceso Denegado</div>;
        case 'client-visits':    return userRole === 'CLIENTE' ? <ClientVisitsPage data={data} /> : <div className="p-8">Acceso Denegado</div>;
        
        default:                 
          // Default fallbacks by role
          if (userRole === 'CLIENTE') return <ClientDashboardPage data={data} />;
          if (userRole === 'TECNICO') return <SchedulePage data={data} setData={setData} />;
          return <DashboardPage data={data} />;
      }
    } catch (error) {
      console.error('Error al renderizar página:', error);
      return (
        <div className="p-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error al cargar la página</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar wrapper — Fixed height sticky to ensure perfect toggle centering */}
      <div className="hidden lg:flex group/sidebarwrap shrink-0 h-screen sticky top-0 overflow-visible">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
        />
        
        {/* THE REAL SLEEK GAUSS TOGGLE - v19.0 (Mathematical Gauss Bell) */}
        <div className="absolute top-[50%] -translate-y-1/2 right-0 translate-x-[15px] z-50 pointer-events-none 
                        opacity-0 group-hover/sidebarwrap:opacity-100 transition-opacity duration-200">
           <div className="relative">
              {/* Protrusion: High-Precision Gauss Bell Shape */}
              <button
                onClick={handleToggleSidebar}
                title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                className="relative pointer-events-auto
                           w-[16px] h-20 flex items-center justify-center
                           bg-[#1A1A1A] outline-none group z-10"
                style={{
                  // v19: Mathematical Normal Distribution Approximation
                  // Ensures vertical tangents at start (0,0) and peak (16,40)
                  clipPath: 'path("M 0 0 C 0 12, 16 28, 16 40 C 16 52, 0 68, 0 80 Z")',
                  // Softens the "digital cut" for a more organic, handled feel
                  filter: 'drop-shadow(0px 0px 1px rgba(26,26,26,0.6)) blur(0.2px)'
                }}
              >
                <div className="flex items-center justify-center w-full h-full pr-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {sidebarCollapsed
                    ? <ChevronRight size={14} className="text-gray-400 group-hover:text-white transition-colors" strokeWidth={3} />
                    : <ChevronLeft  size={14} className="text-gray-400 group-hover:text-white transition-colors" strokeWidth={3} />
                  }
                </div>
              </button>

              {/* Concave Joins - Matched to h-20 */}
              <div className="absolute -top-4 left-0 w-4 h-4 bg-transparent rounded-br-[16px] shadow-[4px_4px_0_0_#f9fafb] pointer-events-none" />
              <div className="absolute -bottom-4 left-0 w-4 h-4 bg-transparent rounded-tr-[16px] shadow-[4px_-4px_0_0_#f9fafb] pointer-events-none" />
           </div>
        </div>
      </div>


      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 animate-in slide-in-from-left duration-300">
            <Sidebar
              user={user}
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
              onLogout={handleLogout}
              onToggleMobileMenu={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          activeTab={activeTab}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
