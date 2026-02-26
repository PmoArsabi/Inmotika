import { useMemo, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { H3, Subtitle, TextSmall } from '../components/ui/Typography';
import { useConfiguration } from '../hooks/useConfiguration';
import ClientsView from '../components/configuration/ClientsView';
import GenericListView from '../components/configuration/GenericListView';
import Breadcrumbs from '../components/configuration/Breadcrumbs';
import ConfigurationNavigator from '../components/configuration/ConfigurationNavigator';
import Tabs from '../components/ui/Tabs';

const ConfigurationPage = ({ data, setData }) => {
  const config = useConfiguration(data, setData);
  const [clientModalParams, setClientModalParams] = useState(null);
  const { 
    activeSubTab, setActiveSubTab, showForm, handleCloseForm, handleSubmit, 
    success, isViewMode, editingItem, editingType, sucursales, handleSucursalChange,
    attachedFiles, setAttachedFiles, maintenanceSteps, setMaintenanceSteps,
    currentStepText, setCurrentStepText, addStep
  } = config;

  const configWithInPageNav = useMemo(() => {
    const drillDown = (entityId, type, mode = 'view') => {
      let level = 'device-details';
      if (type === 'cliente') level = 'client-details';
      else if (type === 'tecnico') level = 'tecnico-details';
      
      config.setViewLevel(level);

      if (type === 'cliente') {
        config.setSelectedClient(entityId ? data.clientes.find(c => String(c.id) === String(entityId)) : null);
      }
      
      setClientModalParams({ 
        id: entityId, 
        type, 
        mode, 
        clientId: (type === 'cliente' || type === 'tecnico') ? entityId : null,
        deviceId: type === 'dispositivo' ? entityId : null
      }); 
    };

    return {
      ...config,
      handleView: (item, type = activeSubTab.slice(0, -1)) => {
        if (type === 'cliente' || type === 'clientes') {
          drillDown(item.id, 'cliente', 'view');
          return;
        }
        if (type === 'dispositivo' || type === 'dispositivos') {
          drillDown(item.id, 'dispositivo', 'view');
          return;
        }
        if (type === 'tecnico' || type === 'tecnicos') {
          drillDown(item.id, 'tecnico', 'view');
          return;
        }
        config.handleView(item, type);
      },
      handleEdit: (item, type = activeSubTab.slice(0, -1), parentId = null) => {
        if (type === 'cliente' || type === 'clientes') {
          drillDown(item.id, 'cliente', 'edit');
          return;
        }
        if (type === 'dispositivo' || type === 'dispositivos') {
          drillDown(item.id, 'dispositivo', 'edit');
          return;
        }
        if (type === 'tecnico' || type === 'tecnicos') {
          drillDown(item.id, 'tecnico', 'edit');
          return;
        }
        config.handleEdit(item, type, parentId);
      },
      handleNew: (type = activeSubTab.slice(0, -1)) => {
        const targetType = (type === 'clientes' || type === 'cliente' || type === 'cliente-details') ? 'cliente' 
                         : (type === 'dispositivos' || type === 'dispositivo' || type === 'device-details') ? 'dispositivo' 
                         : (type === 'tecnicos' || type === 'tecnico' || type === 'tecnico-details') ? 'tecnico'
                         : type;

        if (targetType === 'cliente') {
          config.setViewLevel('client-details');
          config.setSelectedClient(null);
          setClientModalParams({ id: `N-${Date.now()}`, type: 'cliente', mode: 'edit', clientId: `N-${Date.now()}` });
          return;
        }
        if (targetType === 'dispositivo') {
          config.setViewLevel('device-details');
          setClientModalParams({ id: `new-${Date.now()}`, type: 'dispositivo', mode: 'edit', clientId: null });
          return;
        }
        if (targetType === 'tecnico') {
          config.setViewLevel('tecnico-details');
          setClientModalParams({ id: `new-${Date.now()}`, type: 'tecnico', mode: 'edit', clientId: null });
          return;
        }
        config.handleNew(type);
      }
    };
  }, [activeSubTab, config, data]);

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {!clientModalParams && (
        <Tabs 
          tabs={['clientes', 'tecnicos', 'dispositivos']} 
          active={activeSubTab} 
          onChange={(tab) => {
            setActiveSubTab(tab);
            config.setViewLevel('list');
            config.setSelectedClient(null);
            config.setSelectedBranch(null);
            config.setShowForm(false);
          }} 
        />
      )}

      {!clientModalParams && <Breadcrumbs config={config} />}

      <div className="space-y-6">
        {clientModalParams ? (
          <ConfigurationNavigator
            openParams={clientModalParams}
            data={data}
            setData={setData}
            onClose={() => {
              setClientModalParams(null);
              config.setViewLevel('list');
              config.setSelectedClient(null);
              config.setSelectedBranch(null);
            }}
          />
        ) : (
          <>
            {activeSubTab === 'clientes' ? (
              <ClientsView config={configWithInPageNav} data={data} />
            ) : (
              <GenericListView config={configWithInPageNav} data={data} type={activeSubTab} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;
