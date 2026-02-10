import { useState } from 'react';
import { ROLES } from './utils/constants';
import { INITIAL_DATA } from './utils/mockData';

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
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(INITIAL_DATA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === ROLES.TECNICO) setActiveTab('schedule');
    else if (userData.role === ROLES.CLIENTE) setActiveTab('client-dashboard');
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage data={data} />;
      case 'visits': return <VisitsPage data={data} setData={setData} />;
      case 'configuration': return <ConfigurationPage data={data} setData={setData} />;
      case 'schedule': return <SchedulePage data={data} setData={setData} />;
      case 'client-dashboard': return <ClientDashboardPage data={data} />;
      case 'client-data': return <ClientDataPage data={data} />;
      case 'client-inventory': return <ClientInventoryPage data={data} />;
      case 'client-visits': return <ClientVisitsPage data={data} />;
      default: return <DashboardPage data={data} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
        onLogout={handleLogout}
      />

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 animate-in slide-in-from-left duration-300">
            <Sidebar
              user={user}
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {renderPage()}
        </main>
        <footer className="border-t border-gray-100 px-6 lg:px-10 py-4 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-center text-[9px] font-bold text-gray-300 uppercase tracking-[0.25em]">
            <span>© 2026 Inmotika Field Service v1.0</span>
            <span>ISO 9001 · ISO 27001</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
