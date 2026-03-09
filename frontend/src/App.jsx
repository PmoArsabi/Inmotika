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

function App() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [data, setData]               = useState(INITIAL_DATA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );

  // Efecto para limpiar la URL y redirigir según el rol
  useEffect(() => {
    // Si la URL tiene un path (como /dashboard), lo limpiamos ya que usamos estado interno
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }

    if (user) {
      if (user.role === ROLES.TECNICO) setActiveTab('schedule');
      else if (user.role === ROLES.CLIENTE) setActiveTab('client-dashboard');
      else setActiveTab('dashboard');
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

  if (!user) return <LoginPage />;

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
    // Handle configuration sub-tabs
    const configSubTab = getConfigurationSubTab(activeTab);
    if (configSubTab) {
      return <ConfigurationPage key={activeTab} data={data} setData={setData} initialSubTab={configSubTab} isSingleTabView={true} />;
    }

    switch (activeTab) {
      case 'dashboard':        return <DashboardPage data={data} />;
      case 'visits':           return <VisitsPage data={data} setData={setData} />;
      case 'configuration':    return <ConfigurationPage key={activeTab} data={data} setData={setData} isSingleTabView={false} />;
      case 'schedule':         return <SchedulePage data={data} setData={setData} />;
      case 'client-dashboard': return <ClientDashboardPage data={data} />;
      case 'client-data':      return <ClientDataPage data={data} />;
      case 'client-inventory': return <ClientInventoryPage data={data} />;
      case 'client-visits':    return <ClientVisitsPage data={data} />;
      default:                 return <DashboardPage data={data} />;
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
