import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { H3, Subtitle, TextSmall } from '../components/ui/Typography';
import { useConfiguration } from '../hooks/useConfiguration';
import ClientsView from '../components/configuration/Client/ClientsView';
import ContactsView from '../components/Contact/ContactsView';
import DevicesView from '../components/Device/DevicesView';
import GenericListView from '../components/configuration/GenericListView';
import Breadcrumbs from '../components/configuration/Breadcrumbs';
import ConfigurationNavigator from '../components/configuration/ConfigurationNavigator';
import Tabs from '../components/ui/Tabs';

const ConfigurationPage = ({ data, setData, initialSubTab = 'clientes', isSingleTabView = false }) => {
  const config = useConfiguration(data, setData, initialSubTab);
  const [clientModalParams, setClientModalParams] = useState(null);
  const { 
    activeSubTab, setActiveSubTab, showForm, handleCloseForm,
    success, isViewMode, editingItem, editingType
  } = config;

  // Reset state when initialSubTab changes (e.g., when navigating from sidebar)
  useEffect(() => {
    if (initialSubTab && initialSubTab !== activeSubTab) {
      setActiveSubTab(initialSubTab);
      config.setViewLevel('list');
      config.setSelectedClient(null);
      config.setSelectedBranch(null);
      config.setShowForm(false);
      setClientModalParams(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubTab]);

  // Determine if we should show all tabs or just a single tab
  // If isSingleTabView is true, we're accessing from a specific sidebar sub-item
  const showSingleTab = isSingleTabView && initialSubTab && ['clientes', 'contactos', 'tecnicos', 'dispositivos'].includes(initialSubTab);
  const availableTabs = showSingleTab ? [initialSubTab] : ['clientes', 'contactos', 'tecnicos', 'dispositivos'];

  const contactsFlat = useMemo(() => {
    const result = [];
    // Contactos asociados a sedes
    (data?.clientes || []).forEach(c => {
      (c.sucursales || []).forEach(s => {
        (s.contactos || []).forEach(ct => {
          result.push({
            ...ct,
            clientId: c.id,
            branchId: s.id,
            clienteNombre: c.nombre,
            sucursalNombre: s.nombre,
          });
        });
      });
    });
    // Contactos independientes
    (data?.contactos || []).forEach(ct => {
      result.push({
        ...ct,
        clientId: null,
        branchId: null,
        clienteNombre: 'Sin Asignar',
        sucursalNombre: '-',
      });
    });
    return result;
  }, [data]);

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
        if (type === 'sucursal') {
          setClientModalParams({ type: 'branch', clientId: config.selectedClient?.id, branchId: item.id, mode: 'view' });
          return;
        }
        if (type === 'contacto') {
          const clientId = item.clientId || config.selectedClient?.id;
          const branchId = item.branchId || config.selectedBranch?.id;
          setClientModalParams({ type: 'contact', clientId, branchId, contactId: item.id, mode: 'view' });
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
        if (type === 'sucursal') {
          setClientModalParams({ type: 'branch', clientId: config.selectedClient?.id, branchId: item.id, mode: 'edit' });
          return;
        }
        if (type === 'contacto') {
          const clientId = item.clientId || config.selectedClient?.id;
          const branchId = parentId || item.branchId || config.selectedBranch?.id;
          setClientModalParams({ type: 'contact', clientId, branchId, contactId: item.id, mode: 'edit' });
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
          const newClientId = `N-${Date.now()}`;
          config.setViewLevel('client-details');
          config.setSelectedClient(null);
          setClientModalParams({ id: newClientId, type: 'cliente', mode: 'edit', clientId: newClientId });
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
        if (targetType === 'sucursal') {
          setClientModalParams({ type: 'branch', clientId: config.selectedClient?.id, branchId: `S-${Date.now()}`, mode: 'edit' });
          return;
        }
        if (targetType === 'contacto') {
          // Para nuevos contactos desde la vista de contactos global, permitir crear sin cliente/sucursal predefinidos
          setClientModalParams({ type: 'contact', clientId: config.selectedClient?.id || null, branchId: config.selectedBranch?.id || null, contactId: `C-${Date.now()}`, mode: 'edit' });
          return;
        }
        config.handleNew(type);
      }
    };
  }, [activeSubTab, config, data]);

  const dataForView = activeSubTab === 'contactos'
    ? { ...data, contactos: contactsFlat }
    : data;

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {!clientModalParams && !showSingleTab && (
        <Tabs 
          tabs={availableTabs} 
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

      <div className="space-y-4">
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
            ) : activeSubTab === 'contactos' ? (
              <ContactsView config={configWithInPageNav} data={dataForView} />
            ) : activeSubTab === 'dispositivos' ? (
              <DevicesView config={configWithInPageNav} data={dataForView} />
            ) : (
              <GenericListView config={configWithInPageNav} data={dataForView} type={activeSubTab} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;
