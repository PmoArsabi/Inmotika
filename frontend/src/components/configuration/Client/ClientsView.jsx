import React, { useState, useMemo } from 'react';
import { Plus, Eye, Edit2, Trash2, Building2, Navigation2, MapPin, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, Globe, Users } from 'lucide-react';
import { Country } from 'country-state-city';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import IconButton from '../../ui/IconButton';
import Select from '../../ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../../ui/Table';
import { Subtitle, TextSmall, Label, H3 } from '../../ui/Typography';
import SectionHeader from '../../ui/SectionHeader';
import ModuleHeader from '../../ui/ModuleHeader';
import { BranchSubForm } from './ClientForm';

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
    handleView, handleEdit, handleNew, removeSucursal, removeContacto,
    setViewLevel, setSelectedBranch,
    setEditingItem, setEditingType, setIsViewMode, setSucursales, setShowForm, setEditingParentId
  } = config;

  const [activeTab, setActiveTab] = useState('details');

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
            <THead variant="dark">
              <tr><Th>Campo</Th><Th>Información Registrada</Th></tr>
            </THead>
            <TBody>
              <Tr><Td><Label>Razón Social</Label></Td><Td><Subtitle className="text-primary normal-case tracking-normal">{selectedClient.nombre}</Subtitle></Td></Tr>
              <Tr><Td><Label>NIT / RUT</Label></Td><Td><Subtitle className="normal-case tracking-normal">{selectedClient.nit}</Subtitle></Td></Tr>
              <Tr><Td><Label>Ubicación</Label></Td><Td><Subtitle className="normal-case tracking-normal">{selectedClient.ciudad} — {selectedClient.direccion}</Subtitle></Td></Tr>
              <Tr><Td><Label>Contacto</Label></Td><Td><Subtitle className="normal-case tracking-normal">{selectedClient.telefono} — {selectedClient.email}</Subtitle></Td></Tr>
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
            <THead variant="dark">
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
        <div className="flex items-center justify-between mb-2">
          <SectionHeader 
            title={`Detalles de Sucursal — ${selectedBranch.nombre}`} 
            className="px-2 mb-0! items-center"
          />
        </div>
        
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
              editingBranchId={null}
              onCancelEdit={null}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [showFilters, setShowFilters] = useState(false);

  const getTipoClienteLabel = (tipo) => {
    if (!tipo) return 'No especificado';
    return tipo === 'juridica' ? 'Persona Jurídica' : tipo === 'natural' ? 'Persona Natural' : tipo;
  };

  const getCountryName = (countryCode) => {
    if (!countryCode) return 'No especificado';
    const country = ALL_COUNTRIES?.find(c => c.value === countryCode);
    return country?.label || countryCode;
  };

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    console.log('Total clientes cargados:', data.clientes?.length || 0);
    let filtered = [...data.clientes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.nombre?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.nit?.toLowerCase().includes(query) ||
        client.nit_numero?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.nombre || '';
          bValue = b.nombre || '';
          break;
        case 'lastUpdated':
        default:
          aValue = a.nombre || '';
          bValue = b.nombre || '';
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [data.clientes, searchQuery, sortBy, sortOrder, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClients.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 -mt-2">
      {/* Header with count and actions */}
      <ModuleHeader
        title="Información Clientes"
        icon={Users}
        onNewClick={() => handleNew('cliente')}
        newButtonLabel="Nuevo Cliente"
        filterContent={
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar: NIT / Email / Nombre"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm w-64"
                />
              </div>
              <Select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'Todos los Clientes' },
                  { value: 'active', label: 'Activos' },
                  { value: 'inactive', label: 'Inactivos' },
                ]}
                className="w-48"
              />
            </div>
          </div>
        }
      />

      {/* Pagination */}
      {filteredAndSortedClients.length > 0 && (
        <div className="flex items-center justify-between pt-2 pb-2 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <TextSmall className="text-gray-600 text-[10px]">Mostrar</TextSmall>
            <Select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5 Entradas' },
                { value: 10, label: '10 Entradas' },
                { value: 25, label: '25 Entradas' },
                { value: 50, label: '50 Entradas' },
                { value: 100, label: '100 Entradas' },
              ]}
              className="w-24 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-linear-to-r from-red-500 to-red-700 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {filteredAndSortedClients.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
          <Subtitle className="text-gray-500 mb-2">No se encontraron clientes</Subtitle>
          <TextSmall className="text-gray-400">
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer cliente'}
          </TextSmall>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
          <Table>
            <THead variant="dark">
              <tr>
                <Th>Razón Social / Nombre</Th>
                <Th>NIT / Identificación</Th>
                <Th>País</Th>
                <Th>Tipo de Negocio</Th>
                <Th narrow className="text-right">Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {paginatedClients.map((item, idx) => (
                <Tr key={idx} className="hover:bg-gray-50">
                  <Td>
                    <div className="text-sm font-medium text-gray-900">
                      {item.nombre || 'Sin nombre'}
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-gray-700">
                      {item.nit || item.nit_numero || 'No registrado'}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Globe size={14} className="text-gray-400" />
                      <div className="text-sm text-gray-600">
                        {getCountryName(item.pais) || 'No especificado'}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-sm font-medium text-gray-700">
                      {item.tipoNegocio || getTipoClienteLabel(item.tipoPersona) || 'No especificado'}
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(item, 'cliente')}
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(item, 'cliente')}
                        className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Está seguro de eliminar este cliente?')) {
                            config.removeItem(item.id, 'clientes');
                          }
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default ClientsView;
