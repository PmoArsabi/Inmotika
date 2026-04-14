import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROLES, isManagementRole } from './utils/constants';
import { useAuth } from './context/AuthContext';
import { useMasterData } from './context/MasterDataContext';

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
import UsersPage from './modules/users/UsersPage';
import CategoriasPage from './pages/CategoriasPage';
import SolicitudVisitaPage from './pages/visits/SolicitudVisitaPage';
import ProgramacionVisitaPage from './pages/visits/ProgramacionVisitaPage';
import GestionVisitasPage from './pages/visits/GestionVisitasPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

/** Shown whenever the current user's role lacks permission for a route. */
const AccessDenied = () => (
  <div className="p-8 text-center text-red-500 font-bold">
    No tienes permisos para acceder a esta sección.
  </div>
);

/**
 * Declarative route guard that renders children only when the user's role is allowed.
 * @param {string[]} roles - Roles permitidos para esta ruta.
 * @param {string} userRole - Rol del usuario actual.
 * @param {React.ReactNode} children
 */
const ProtectedRoute = ({ roles, userRole, children }) => {
  if (!roles.includes(userRole)) return <AccessDenied />;
  return children;
};

function App() {
  const { user, signOut, loading: authLoading, isRecoveryFlow, setIsRecoveryFlow, clearRecoveryFlow } = useAuth();
  const { data, setData } = useMasterData();
  const [activeTab, setActiveTab] = useState(() => {
    const role = user?.role;
    if (role === ROLES.CLIENTE) return 'client-dashboard';
    if (role === ROLES.TECNICO) return 'schedule';
    return 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  /** ID de visita pendiente de abrir al entrar a GestionVisitasPage. */
  const [pendingVisitId, setPendingVisitId] = useState(null);

  /**
   * Navega al detalle de ejecución de una visita desde cualquier pantalla.
   * Guarda el ID para que GestionVisitasPage lo consuma y lo abre automáticamente.
   * @param {string} visitaId
   */
  const handleNavigateToVisit = (visitaId) => {
    setPendingVisitId(visitaId);
    setActiveTab('visits-gestion');
  };

  // Efecto para limpiar la URL
  useEffect(() => {
    if (window.location.pathname !== '/' && !isRecoveryFlow) {
      window.history.replaceState(null, '', '/');
    }
  }, [isRecoveryFlow]);

  // Redirigir al tab correcto cuando el rol cambia (ej. login posterior al mount).
  const userRole = user?.role;
  useEffect(() => {
    if (!userRole) return;
    const tab = userRole === ROLES.CLIENTE ? 'client-dashboard'
      : userRole === ROLES.TECNICO ? 'schedule'
      : 'dashboard';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTab(tab);
  }, [userRole]);

  const handleLogout = async () => {
    await signOut();
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Mostrar ResetPasswordPage si se detecta flujo de recuperación o invitación
  if (isRecoveryFlow) {
    return <ResetPasswordPage onComplete={() => clearRecoveryFlow?.() || setIsRecoveryFlow(false)} />;
  }

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

  // Extract subTab from configuration tabs (cada ítem lleva directo a su módulo)
  const getConfigurationSubTab = (tab) => {
    if (tab.startsWith('configuration-')) {
      const subTab = tab.replace('configuration-', '');
      if (subTab === 'sucursal') return 'clientes';
      if (subTab === 'contacto') return 'contactos';
      return subTab;
    }
    return null;
  };

  const renderPage = () => {
    try {
      // Identificar el rol del usuario para restringir módulos
      const userRole = user?.role || 'TECNICO';
      const _isAdminGroup = isManagementRole(userRole);

      // 1. Handle visits sub-tabs
      const visitsSubTab = getVisitsSubTab(activeTab);

      if (visitsSubTab === 'solicitudes') {
        return (
          <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.CLIENTE]} userRole={userRole}>
            <SolicitudVisitaPage />
          </ProtectedRoute>
        );
      }

      if (visitsSubTab === 'programacion') {
        return (
          <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR]} userRole={userRole}>
            <ProgramacionVisitaPage />
          </ProtectedRoute>
        );
      }

      if (visitsSubTab === 'gestion') {
        return (
          <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.TECNICO]} userRole={userRole}>
            <GestionVisitasPage
              data={data}
              setData={setData}
              initialVisitaId={pendingVisitId}
              onInitialVisitaConsumed={() => setPendingVisitId(null)}
            />
          </ProtectedRoute>
        );
      }

      // Handle configuration sub-tabs (Solo Admin Group)
      const configSubTab = getConfigurationSubTab(activeTab);
      if (configSubTab) {
        if (configSubTab === 'usuarios') {
          return (
            <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR]} userRole={userRole}>
              <UsersPage data={data} setData={setData} />
            </ProtectedRoute>
          );
        }
        if (configSubTab === 'categorias') {
          return (
            <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR]} userRole={userRole}>
              <CategoriasPage />
            </ProtectedRoute>
          );
        }
        return (
          <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR]} userRole={userRole}>
            <ConfigurationPage key={activeTab} data={data} setData={setData} initialSubTab={configSubTab} isSingleTabView={true} />
          </ProtectedRoute>
        );
      }

      switch (activeTab) {
        case 'dashboard':
          return (
            <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR]} userRole={userRole}>
              <DashboardPage data={data} />
            </ProtectedRoute>
          );
        case 'visits':
          return <VisitsPage data={data} setData={setData} />;
        case 'schedule':
          return (
            <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.COORDINADOR, ROLES.TECNICO]} userRole={userRole}>
              <SchedulePage data={data} setData={setData} onVisitClick={handleNavigateToVisit} />
            </ProtectedRoute>
          );

        // Vistas específicas de cliente
        case 'client-dashboard':
          return (
            <ProtectedRoute roles={[ROLES.CLIENTE]} userRole={userRole}>
              <ClientDashboardPage data={data} />
            </ProtectedRoute>
          );
        case 'client-data':
          return (
            <ProtectedRoute roles={[ROLES.CLIENTE]} userRole={userRole}>
              <ClientDataPage />
            </ProtectedRoute>
          );
        case 'client-inventory':
          return (
            <ProtectedRoute roles={[ROLES.CLIENTE]} userRole={userRole}>
              <ClientInventoryPage />
            </ProtectedRoute>
          );
        case 'client-visits':
          return (
            <ProtectedRoute roles={[ROLES.CLIENTE]} userRole={userRole}>
              <ClientVisitsPage />
            </ProtectedRoute>
          );

        default:
          // Default fallbacks by role
          if (userRole === ROLES.CLIENTE) return <ClientDashboardPage data={data} />;
          if (userRole === ROLES.TECNICO) return <SchedulePage data={data} setData={setData} />;
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
    <div className="flex min-h-screen bg-transparent">
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
        <div className="absolute top-[50%] -translate-y-1/2 right-0 translate-x-3.75 z-50 pointer-events-none 
                        opacity-0 group-hover/sidebarwrap:opacity-100 transition-opacity duration-200">
           <div className="relative">
              {/* Protrusion: High-Precision Gauss Bell Shape */}
              <button
                onClick={handleToggleSidebar}
                title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                className="relative pointer-events-auto
                           w-4 h-20 flex items-center justify-center
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
              <div className="absolute -top-4 left-0 w-4 h-4 bg-transparent rounded-br-2xl shadow-[4px_4px_0_0_#f9fafb] pointer-events-none" />
              <div className="absolute -bottom-4 left-0 w-4 h-4 bg-transparent rounded-tr-2xl shadow-[4px_-4px_0_0_#f9fafb] pointer-events-none" />
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
