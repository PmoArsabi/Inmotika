import { CheckCircle2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { H3, Subtitle, TextSmall } from '../components/ui/Typography';
import ContactoForm from '../components/forms/ContactForm';
import SucursalForm from '../components/forms/BranchForm';
import ClienteForm from '../components/forms/ClientForm';
import TecnicoForm from '../components/forms/TechnicalForm';
import DispositivoForm from '../components/forms/DeviceForm';

import { useConfiguration } from '../hooks/useConfiguration';
import ClientsView from '../components/configuration/ClientsView';
import GenericListView from '../components/configuration/GenericListView';
import Breadcrumbs from '../components/configuration/Breadcrumbs';
import ClientModalNavigator from '../components/configuration/ClientModalNavigator';

const ConfigurationPage = ({ data, setData }) => {
  const config = useConfiguration(data, setData);
  const [clientModalParams, setClientModalParams] = useState(null);
  const { 
    activeSubTab, setActiveSubTab, showForm, handleCloseForm, handleSubmit, 
    success, isViewMode, editingItem, editingType, sucursales, handleSucursalChange,
    attachedFiles, setAttachedFiles, maintenanceSteps, setMaintenanceSteps,
    currentStepText, setCurrentStepText, addStep
  } = config;

  const configWithClientModal = useMemo(() => {
    const openClient = (clientId, mode) => setClientModalParams({ clientId, mode });
    return {
      ...config,
      handleView: (item, type = activeSubTab.slice(0, -1)) => {
        if (type === 'cliente' || type === 'clientes') {
          openClient(item.id, 'view');
          return;
        }
        config.handleView(item, type);
      },
      handleEdit: (item, type = activeSubTab.slice(0, -1), parentId = null) => {
        if (type === 'cliente' || type === 'clientes') {
          openClient(item.id, 'edit');
          return;
        }
        config.handleEdit(item, type, parentId);
      }
    };
  }, [activeSubTab, config]);

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
        {['clientes', 'tecnicos', 'dispositivos'].map(tab => (
          <button key={tab} onClick={() => {
            setActiveSubTab(tab);
            config.setViewLevel('list');
            config.setSelectedClient(null);
            config.setSelectedBranch(null);
            config.setShowForm(false);
          }} className={`px-6 py-2 rounded-lg transition-all ${activeSubTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>
            <TextSmall className={`uppercase font-bold ${activeSubTab === tab ? 'text-primary' : 'text-gray-400'}`}>
              {tab}
            </TextSmall>
          </button>
        ))}
      </div>

      <Breadcrumbs config={config} />

      <div className="space-y-6">
        {activeSubTab === 'clientes' ? (
          <ClientsView config={configWithClientModal} data={data} />
        ) : (
          <GenericListView config={config} data={data} type={activeSubTab} />
        )}
      </div>

      {activeSubTab === 'clientes' && (
        <ClientModalNavigator
          openParams={clientModalParams}
          data={data}
          setData={setData}
          onClose={() => setClientModalParams(null)}
        />
      )}

      <Modal 
        isOpen={showForm} 
        onClose={handleCloseForm}
        title={`${isViewMode ? 'Ver' : editingItem ? 'Editar' : 'Configurar'} ${editingType || activeSubTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {success && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-[2.5rem] animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <H3 className="text-gray-900">¡Éxito!</H3>
                  <Subtitle className="text-gray-500">La información ha sido guardada correctamente</Subtitle>
                </div>
              </div>
            </div>
          )}
          <fieldset disabled={isViewMode} className="space-y-6">
            {editingType === 'contacto' && <ContactoForm editingItem={editingItem} isViewMode={isViewMode} />}
            {editingType === 'sucursal' && <SucursalForm sucursales={sucursales} isViewMode={isViewMode} handleSucursalChange={handleSucursalChange} />}
            {editingType !== 'sucursal' && activeSubTab === 'clientes' && editingType !== 'contacto' && editingType !== 'dispositivo' && (
              <ClienteForm editingItem={editingItem} isViewMode={isViewMode} />
            )}
            {activeSubTab === 'tecnicos' && (
              <TecnicoForm editingItem={editingItem} isViewMode={isViewMode} attachedFiles={attachedFiles} setAttachedFiles={setAttachedFiles} />
            )}
            {activeSubTab === 'dispositivos' && (
              <DispositivoForm 
                editingItem={editingItem} isViewMode={isViewMode} 
                maintenanceSteps={maintenanceSteps} setMaintenanceSteps={setMaintenanceSteps} 
                currentStepText={currentStepText} setCurrentStepText={setCurrentStepText} addStep={addStep} 
              />
            )}
          </fieldset>
          {!isViewMode && (
             <div className="flex justify-end pt-4">
               <Button type="submit">
                 <Save size={18} /> Guardar Cambios
               </Button>
             </div>
           )}
        </form>
      </Modal>
    </div>
  );
};

export default ConfigurationPage;
