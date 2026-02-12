import { Home, Users, Building2, MapPin, ChevronRight } from 'lucide-react';
import { TextSmall } from '../ui/Typography';

const Breadcrumbs = ({ config }) => {
  const { activeSubTab, viewLevel, selectedClient, selectedBranch, setViewLevel, setSelectedClient, setSelectedBranch } = config;

  if (activeSubTab !== 'clientes' || viewLevel === 'list') return null;

  const items = [
    { label: 'Clientes', level: 'list', icon: Home },
  ];

  if (selectedClient) {
    items.push({ label: selectedClient.nombre, level: 'client-details', icon: Users });
  }

  if (viewLevel === 'branches-list' || viewLevel === 'branch-details') {
    items.push({ label: 'Sucursales', level: 'branches-list', icon: Building2 });
  }

  if (selectedBranch) {
    items.push({ label: selectedBranch.nombre, level: 'branch-details', icon: MapPin });
  }

  return (
    <nav className="flex items-center gap-1.5 mb-4 bg-white p-2 rounded-md shadow-sm border border-gray-100 w-fit">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <ChevronRight size={12} className="text-gray-300" />}
          <button
            onClick={() => {
              setViewLevel(item.level);
              if (item.level === 'list') { setSelectedClient(null); setSelectedBranch(null); }
              if (item.level === 'client-details') { setSelectedBranch(null); }
              if (item.level === 'branches-list') { setSelectedBranch(null); }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${viewLevel === item.level
                ? 'bg-red-50 text-primary'
                : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <item.icon size={14} />
            <TextSmall className={`capitalize ${viewLevel === item.level ? 'text-primary font-bold' : 'text-gray-500'}`}>
              {item.label}
            </TextSmall>
          </button>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
