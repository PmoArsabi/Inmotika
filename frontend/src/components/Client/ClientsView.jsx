import { Plus, Eye, Edit2, Trash2, Building2, Navigation2, MapPin, Globe, User, Mail, ChevronRight } from 'lucide-react';
import { Country } from 'country-state-city';
import Card from '../ui/Card';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { Subtitle, TextSmall, Label } from '../ui/Typography';
import SectionHeader from '../ui/SectionHeader';

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
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="space-y-4">
          <SectionHeader 
            title={`Contactos — ${selectedBranch.nombre}`} 
            className="px-2 mb-2! items-center"
            rightContent={
              <Button onClick={() => {
                setEditingItem(null); setEditingType('contacto');
                setEditingParentId(selectedBranch.id); setShowForm(true);
              }}>
                <Plus size={16}/> Nuevo Contacto
              </Button>
            }
          />
          <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
            <Table>
              <THead variant="dark">
                <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th narrow>Acción</Th></tr>
              </THead>
              <TBody>
                {(selectedBranch.contactos || []).map((contacto, idx) => (
                  <Tr key={idx}>
                    <Td>
                      <Subtitle className="text-primary normal-case tracking-normal">{contacto.nombre}</Subtitle>
                      <TextSmall className="text-gray-400 mt-1">{contacto.cargo}</TextSmall>
                    </Td>
                    <Td>
                      <Subtitle className="normal-case tracking-normal">{contacto.celular}</Subtitle>
                      <TextSmall className="text-gray-400 mt-1">{contacto.email}</TextSmall>
                    </Td>
                    <Td narrow>
                      <div className="flex gap-3">
                        <IconButton icon={Edit2} className="text-gray-300 hover:text-primary" onClick={() => handleEdit(contacto, 'contacto', selectedBranch.id)} />
                        <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => removeContacto(selectedBranch.id, contacto.id)} />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>
      </div>
    );
  }

  // 4. Default — Clients List
  const getTipoClienteLabel = (tipo) => {
    if (!tipo) return 'No especificado';
    return tipo === 'juridica' ? 'Persona Jurídica' : tipo === 'natural' ? 'Persona Natural' : tipo;
  };

  const getCountryName = (countryCode) => {
    if (!countryCode) return 'No especificado';
    // Buscar en los países disponibles
    const country = ALL_COUNTRIES?.find(c => c.value === countryCode);
    return country?.label || countryCode;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Clientes</h2>
          <TextSmall className="text-gray-500">Gestiona la información de tus clientes</TextSmall>
        </div>
        <Button 
          onClick={() => handleNew('cliente')}
          variant="danger"
        >
          <Plus size={16}/> Nuevo Cliente
        </Button>
      </div>

      {data.clientes.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
          <Subtitle className="text-gray-500 mb-2">No hay clientes registrados</Subtitle>
          <TextSmall className="text-gray-400">Comienza agregando tu primer cliente</TextSmall>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Header de columnas */}
          <div className="hidden md:grid grid-cols-12 gap-4 py-2 px-4 pl-6 bg-gray-50 rounded-md border border-gray-200">
            <div className="col-span-1"></div>
            <div className="col-span-2">
              <TextSmall className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider">País</TextSmall>
            </div>
            <div className="col-span-2">
              <TextSmall className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider">Tipo Cliente</TextSmall>
            </div>
            <div className="col-span-3">
              <TextSmall className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider">Razón Social / Nombre</TextSmall>
            </div>
            <div className="col-span-2">
              <TextSmall className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider">Identificación</TextSmall>
            </div>
            <div className="col-span-2 text-right">
              <TextSmall className="text-gray-600 font-semibold uppercase text-[10px] tracking-wider">Acciones</TextSmall>
            </div>
          </div>

          {/* Lista de clientes */}
          {data.clientes.map((item, idx) => (
            <Card 
              key={idx}
              className="relative overflow-hidden border border-gray-200 hover:border-[#D32F2F]/40 hover:shadow-md transition-all duration-200"
            >
              {/* Barra vertical roja */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D32F2F]"></div>
              
              <div className="grid grid-cols-12 gap-4 items-center py-4 px-4 pl-6">
                {/* Espacio para la barra roja */}
                <div className="col-span-1 hidden md:block"></div>
                
                {/* País */}
                <div className="col-span-12 md:col-span-2">
                  <div className="md:hidden flex items-center gap-2">
                    <Globe size={14} className="text-gray-400 shrink-0" />
                    <TextSmall className="text-gray-500 text-[10px] uppercase tracking-wider">País</TextSmall>
                  </div>
                  <Subtitle className="text-[#1A1A1A] font-semibold text-sm mt-0.5 md:mt-0">
                    {getCountryName(item.pais) || 'No especificado'}
                  </Subtitle>
                </div>

                {/* Tipo Cliente */}
                <div className="col-span-12 md:col-span-2">
                  <div className="md:hidden flex items-center gap-2">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <TextSmall className="text-gray-500 text-[10px] uppercase tracking-wider">Tipo Cliente</TextSmall>
                  </div>
                  <Subtitle className="text-[#1A1A1A] font-semibold text-sm mt-0.5 md:mt-0">
                    {getTipoClienteLabel(item.tipoPersona)}
                  </Subtitle>
                </div>

                {/* Razón Social / Nombre */}
                <div className="col-span-12 md:col-span-3">
                  <div className="md:hidden flex items-center gap-2">
                    <Building2 size={16} className="text-[#D32F2F] shrink-0" />
                    <TextSmall className="text-gray-500 text-[10px] uppercase tracking-wider">Razón Social / Nombre</TextSmall>
                  </div>
                  <div className="mt-0.5 md:mt-0">
                    <Subtitle className="text-[#1A1A1A] font-bold text-sm truncate">
                      {item.nombre || 'Sin nombre'}
                    </Subtitle>
                    {item.email && (
                      <TextSmall className="text-gray-500 text-xs truncate mt-0.5">
                        {item.email}
                      </TextSmall>
                    )}
                  </div>
                </div>

                {/* Identificación */}
                <div className="col-span-12 md:col-span-2">
                  <div className="md:hidden">
                    <TextSmall className="text-gray-500 text-[10px] uppercase tracking-wider">Identificación</TextSmall>
                  </div>
                  <Subtitle className="text-[#1A1A1A] font-semibold text-sm mt-0.5 md:mt-0">
                    {item.nit || item.nit_numero || 'No registrado'}
                  </Subtitle>
                </div>

                {/* Acciones */}
                <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleView(item, 'cliente')}
                    className="p-2 rounded-md hover:bg-[#D32F2F]/10 text-gray-400 hover:text-[#D32F2F] transition-colors"
                    title="Ver detalles"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(item, 'cliente')}
                    className="p-2 rounded-md hover:bg-[#D32F2F]/10 text-gray-400 hover:text-[#D32F2F] transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Está seguro de eliminar este cliente?')) {
                        config.removeItem(item.id, 'clientes');
                      }
                    }}
                    className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientsView;
