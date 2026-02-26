import { Plus, Eye, Edit2, Trash2, Building2, Navigation2, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { Subtitle, TextSmall, Label } from '../ui/Typography';
import SectionHeader from '../ui/SectionHeader';

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
  return (
    <div className="space-y-4">
      <SectionHeader 
        title="Maestros de Clientes" 
        className="px-2 mb-2! items-center"
        rightContent={
          <Button onClick={() => handleNew('cliente')}>
            <Plus size={16}/> Nuevo Registro
          </Button>
        }
      />
      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead variant="dark">
            <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th narrow>Acción</Th></tr>
          </THead>
          <TBody>
            {data.clientes.map((item, idx) => (
              <Tr key={idx}>
                <Td>
                  <Subtitle className="normal-case tracking-normal font-bold text-gray-800">
                    {item.nombre}
                  </Subtitle>
                  <TextSmall className="text-gray-400 mt-1">{item.nit}</TextSmall>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-400 shrink-0" />
                    <Subtitle className="normal-case tracking-normal">{item.ciudad}</Subtitle>
                  </div>
                  <TextSmall className="text-gray-400 mt-1">{(item.sucursales || []).length} Sucursales</TextSmall>
                </Td>
                <Td narrow>
                  <div className="flex gap-3">
                    <IconButton icon={Eye}   className="text-gray-300 hover:text-primary" onClick={() => handleView(item, 'cliente')} />
                    <IconButton icon={Edit2} className="text-gray-300 hover:text-primary" onClick={() => handleEdit(item, 'cliente')} />
                    <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => config.removeItem(item.id, 'clientes')} />
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default ClientsView;
