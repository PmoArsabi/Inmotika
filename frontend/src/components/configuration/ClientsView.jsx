import { Plus, Eye, Edit2, Trash2, Building2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { Subtitle, TextSmall, Label } from '../ui/Typography';
import SectionHeader from '../ui/SectionHeader';

const ClientsView = ({ config, data }) => {
  const {
    viewLevel, selectedClient, selectedBranch,
    handleView, handleEdit, removeSucursal, removeContacto,
    setViewLevel, setSelectedBranch,
    setEditingItem, setEditingType, setIsViewMode, setSucursales, setShowForm, setEditingParentId
  } = config;

  // 1. Client Details View
  if (viewLevel === 'client-details' && selectedClient) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <div className="flex justify-between items-start">
          <SectionHeader title="Información General" />
          <Button onClick={() => setViewLevel('branches-list')}>
            <Building2 size={16}/> Ver Sucursales
          </Button>
        </div>
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
        <div className="flex justify-between items-center px-2">
          <SectionHeader title={`Sucursales de ${selectedClient.nombre}`} />
          <Button onClick={() => { 
            setEditingItem(null); 
            setEditingType('sucursal'); 
            setIsViewMode(false); 
            setSucursales([{ id: Date.now(), nombre: '', ciudad: '', direccion: '', telefono: '', email: '', contactos: [] }]); 
            setShowForm(true); 
          }}>
            <Plus size={16}/> Nueva Sucursal
          </Button>
        </div>
        <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
          <Table>
            <THead variant="dark">
              <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th>Acción</Th></tr>
            </THead>
            <TBody>
              {(selectedClient.sucursales || []).map((sucursal, idx) => (
                <Tr key={idx}>
                  <Td>
                    <button onClick={() => { setSelectedBranch(sucursal); setViewLevel('branch-details'); }} className="hover:underline text-left block leading-tight">
                      <Subtitle className="text-primary normal-case tracking-normal">{sucursal.nombre}</Subtitle>
                    </button>
                    <TextSmall className="text-gray-400 mt-1">{sucursal.id}</TextSmall>
                  </Td>
                  <Td>
                    <Subtitle className="normal-case tracking-normal">{sucursal.ciudad} — {sucursal.direccion}</Subtitle>
                    <TextSmall className="text-gray-400 mt-1">{(sucursal.contactos || []).length} Contactos Registrados</TextSmall>
                  </Td>
                  <Td>
                    <div className="flex gap-4">
                      <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => handleView(sucursal, 'sucursal')} />
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
          <div className="flex justify-between items-center px-2">
            <SectionHeader title={`Contactos — ${selectedBranch.nombre}`} />
            <Button onClick={() => { 
              setEditingItem(null);
              setEditingType('contacto');
              setEditingParentId(selectedBranch.id);
              setShowForm(true);
            }}>
              <Plus size={16}/> Nuevo Contacto
            </Button>
          </div>
          <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
            <Table>
              <THead variant="dark">
                <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th>Acción</Th></tr>
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
                    <Td>
                      <div className="flex gap-4">
                        <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => console.log('View Contacto', contacto)} />
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
        {/* Dispositivos Vinculados section could be here too, but for brevity/cleanliness I'll skip deep nesting logic refactor unless requested */}
      </div>
    );
  }

  // 4. Default List View
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <SectionHeader title="Maestros de Clientes" />
        <Button onClick={() => { setEditingItem(null); setEditingType('cliente'); setIsViewMode(false); setSucursales([]); setShowForm(true); }}>
          <Plus size={16}/> Nuevo Registro
        </Button>
      </div>
      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead variant="dark">
            <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th>Acción</Th></tr>
          </THead>
          <TBody>
            {data.clientes.map((item, idx) => (
              <Tr key={idx}>
                <Td>
                  <button onClick={() => handleView(item, 'cliente')} className="hover:underline text-left block leading-tight">
                    <Subtitle className="text-primary normal-case tracking-normal">{item.nombre}</Subtitle>
                  </button>
                  <TextSmall className="text-gray-400 mt-1">{item.nit}</TextSmall>
                </Td>
                <Td>
                  <Subtitle className="normal-case tracking-normal">{item.ciudad} — {(item.sucursales || []).length} Sucursales</Subtitle>
                  <TextSmall className="text-gray-400 mt-1">{item.email}</TextSmall>
                </Td>
                <Td>
                  <div className="flex gap-4">
                    <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => handleView(item, 'cliente')} />
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
