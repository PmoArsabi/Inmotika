import React, { useState } from 'react';
import { Plus, Eye, Edit2, Trash2, Building2, Navigation2, MapPin, Globe, Users } from 'lucide-react';
import { Country } from 'country-state-city';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import Select from '../../components/ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { Subtitle, TextSmall, Label, H3 } from '../../components/ui/Typography';
import SectionHeader from '../../components/ui/SectionHeader';
import GenericListView from '../../components/shared/GenericListView';
import BranchForm from '../../components/forms/BranchForm';
import SecureImage from '../../components/ui/SecureImage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg overflow-auto">
          <h2 className="text-red-700 font-bold mb-2">Error de React Detectado</h2>
          <pre className="text-xs text-red-600 whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</pre>
          <pre className="text-xs text-red-500 whitespace-pre-wrap mt-2">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

const ClientsView = ({ config, data }) => {
  const {
    viewLevel, selectedClient, selectedBranch,
    handleView, handleEdit, handleNew, removeSucursal,
    setViewLevel, setSelectedBranch,
    setEditingItem, setEditingType, setIsViewMode, setSucursales, setShowForm
  } = config;

  // Hooks deben estar antes de cualquier early return
  const [filterStatus, setFilterStatus] = useState('all');

  const getCountryName = (countryCode) => {
    if (!countryCode) return 'No especificado';
    const country = ALL_COUNTRIES?.find(c => c.value === countryCode);
    return country?.label || countryCode;
  };

  // 1. Client Details View
  if (viewLevel === 'client-details' && selectedClient) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <SectionHeader 
          title="Información General" 
          className="px-2 mb-2! items-center"
          rightContent={
            <Button onClick={() => setViewLevel('branches-list')}>
              <Building2 size={16}/> Ver Sucursales
            </Button>
          }
        />
        <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
          <Table>
            <THead variant="light">
              <tr><Th>Campo</Th><Th>Información Registrada</Th></tr>
            </THead>
            <TBody>
              <Tr><Td><Label>Razón Social</Label></Td><Td><Subtitle className="text-primary normal-case tracking-normal">{selectedClient.nombre}</Subtitle></Td></Tr>
              <Tr><Td><Label>NIT / RUT</Label></Td><Td><Subtitle className="normal-case tracking-normal">{selectedClient.nit}</Subtitle></Td></Tr>
              <Tr><Td><Label>Ubicación</Label></Td><Td><Subtitle className="normal-case tracking-normal">{selectedClient.ciudad} — {selectedClient.direccion}</Subtitle></Td></Tr>
            </TBody>
          </Table>
        </Card>
      </div>
    );
  }

  // 2. Branches List View
  if (viewLevel === 'branches-list' && selectedClient) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <SectionHeader 
          title={`Sucursales de ${selectedClient.nombre}`} 
          className="px-2 mb-2! items-center"
          rightContent={
            <Button onClick={() => {
              setEditingItem(null); setEditingType('sucursal'); setIsViewMode(false);
              setSucursales([{ id: Date.now(), nombre: '', ciudad: '', direccion: '', telefono: '', email: '', contactos: [] }]);
              setShowForm(true);
            }}>
              <Plus size={16}/> Nueva Sucursal
            </Button>
          }
        />
        <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
          <Table>
            <THead variant="light">
              <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th narrow>Acción</Th></tr>
            </THead>
            <TBody>
              {(selectedClient.sucursales || []).map((sucursal, idx) => (
                <Tr key={idx}>
                  <Td>
                    <button
                      onClick={() => { setSelectedBranch(sucursal); setViewLevel('branch-details'); }}
                      className="text-left block leading-tight group"
                    >
                      <Subtitle className="text-primary normal-case tracking-normal group-hover:underline">{sucursal.nombre}</Subtitle>
                    </button>
                    <TextSmall className="text-gray-400 mt-1">{sucursal.id}</TextSmall>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <Subtitle className="normal-case tracking-normal">{sucursal.ciudad}</Subtitle>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Navigation2 size={13} className="text-gray-400 shrink-0" />
                      <TextSmall className="text-gray-400">{sucursal.direccion}</TextSmall>
                    </div>
                  </Td>
                  <Td narrow>
                    <div className="flex gap-3">
                      <IconButton icon={Eye}   className="text-gray-300 hover:text-primary" onClick={() => { setSelectedBranch(sucursal); setViewLevel('branch-details'); }} />
                      <IconButton icon={Edit2} className="text-gray-300 hover:text-primary" onClick={() => handleEdit(sucursal, 'sucursal')} />
                      <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => removeSucursal(sucursal.id)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    );
  }

  // 3. Branch Details View
  if (viewLevel === 'branch-details' && selectedBranch) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <SectionHeader 
          title={`Detalles de Sucursal — ${selectedBranch.nombre}`} 
          className="px-2 mb-0! items-center"
        />
        <div className="bg-white rounded-md shadow-xs border border-gray-100 p-6">
          <ErrorBoundary>
            <BranchSubForm
              newBranchDraft={{
                ...selectedBranch, 
                associatedContactIds: (selectedBranch.contactos || []).map(c => String(c.id)),
                associatedDeviceIds: (data?.dispositivos?.filter(d => String(d.sucursalId) === String(selectedBranch.id)) || []).map(d => String(d.id))
              }}
              updateNewBranchDraft={() => {}}
              newBranchErrors={{}}
              onSaveNewBranch={() => {}}
              isEditing={false}
              isSaving={false}
              onAssociateContacts={() => {}}
              onAssociateDevices={() => {}}
              showErrors={false}
              activoId="est-1"
              inactivoId="est-2"
              clientId={selectedClient.id}
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // 4. Default — Clients List

  const columns = [
    {
      header: 'Razón Social / Nombre',
      render: (item) => (
        <div className="flex flex-row items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
            <SecureImage 
              path={item.logoUrl} 
              alt="Logo" 
              className="w-full h-full object-cover" 
              fallback={<Building2 size={16} className="text-gray-400" />}
            />
          </div>
          <div className="flex flex-col">
            <Subtitle className="text-gray-900 normal-case tracking-normal">
              {item.nombre || 'Sin nombre'}
            </Subtitle>
          </div>
        </div>
      )
    },
    {
      header: 'NIT / Identificación',
      render: (item) => (
        <TextSmall className="text-gray-700">
          {item.nit || item.nit_numero || 'No registrado'}
        </TextSmall>
      )
    },
    {
      header: 'País',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Globe size={14} className="text-gray-400" />
          <TextSmall className="text-gray-600">
            {getCountryName(item.pais) || 'No especificado'}
          </TextSmall>
        </div>
      )
    },
    {
      header: 'Dirección Física',
      render: (item) => (
        <TextSmall className="text-gray-700 font-medium">
          {item.direccion || 'No registrada'}
        </TextSmall>
      )
    }
  ];

  const filterFunction = (client, q) => (
    client.nombre?.toLowerCase().includes(q) ||
    client.nit?.toLowerCase().includes(q) ||
    client.nit_numero?.toLowerCase().includes(q)
  );

  return (
    <GenericListView
      title="Información Clientes"
      icon={Users}
      items={data.clientes || []}
      columns={columns}
      onNew={() => handleNew('cliente')}
      onView={(item) => handleView(item, 'cliente')}
      onEdit={(item) => handleEdit(item, 'cliente')}
      onDelete={(item) => config.removeItem(item.id, 'clientes')}
      newButtonLabel="Nuevo Cliente"
      searchPlaceholder="Buscar: NIT / Nombre"
      filterFunction={filterFunction}
      extraFilters={
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los Clientes' },
            { value: 'active', label: 'Activos' },
            { value: 'inactive', label: 'Inactivos' },
          ]}
          className="w-48"
        />
      }
    />
  );
};

export default ClientsView;
