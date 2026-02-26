import { Home, Users, Building2, MapPin, ChevronRight } from 'lucide-react';
import { TextSmall } from '../ui/Typography';

const Breadcrumbs = ({ config, items: customItems }) => {
  const { activeSubTab, viewLevel, selectedClient, selectedBranch, setViewLevel, setSelectedClient, setSelectedBranch } = config || {};

  const items = customItems || (() => {
    if (!['clientes', 'dispositivos'].includes(activeSubTab)) return null;
    const list = [];
    if (selectedClient) {
      list.push({ label: selectedClient.nombre, level: 'client-details', icon: Users });
    }
    if (viewLevel === 'branches-list' || viewLevel === 'branch-details') {
      list.push({ label: 'Sucursales', level: 'branches-list', icon: Building2 });
    }
    if (selectedBranch) {
      list.push({ label: selectedBranch.nombre, level: 'branch-details', icon: MapPin });
    }
    return list;
  })();

  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 mb-6 bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 w-fit animate-in fade-in slide-in-from-left-2 duration-500">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <ChevronRight size={12} className="text-gray-300" />}
          <button
            onClick={() => {
              if (item.onClick) {
                item.onClick();
                return;
              }
              if (!config) return;
              setViewLevel(item.level);
              if (item.level === 'list') { 
                setSelectedClient(null); 
                setSelectedBranch(null); 
              }
              if (item.level === 'client-details') { setSelectedBranch(null); }
              if (item.level === 'branches-list') { setSelectedBranch(null); }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${item.isActive
                ? 'bg-primary/5 text-primary'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
          >
            <item.icon size={14} className={item.isActive ? 'text-primary' : 'text-gray-400'} />
            <TextSmall className={`capitalize whitespace-nowrap ${item.isActive ? 'text-primary font-bold' : 'font-medium'}`}>
              {item.label}
            </TextSmall>
          </button>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
