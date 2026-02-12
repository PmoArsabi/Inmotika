import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { Subtitle, TextSmall } from '../ui/Typography';
import SectionHeader from '../ui/SectionHeader';

const GenericListView = ({ config, data, type }) => {
  const { handleView, handleEdit, removeItem, setEditingItem, setEditingType, setIsViewMode, setSucursales, setShowForm } = config;
  const items = data[type] || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <SectionHeader title={`Maestros de ${type}`} />
        <Button onClick={() => { setEditingItem(null); setEditingType(type.slice(0, -1)); setIsViewMode(false); setSucursales([]); setShowForm(true); }}>
          <Plus size={16}/> Nuevo Registro
        </Button>
      </div>
      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead variant="dark">
            <tr><Th>Nombre / Razón</Th><Th>Detalles Técnicos</Th><Th>Acción</Th></tr>
          </THead>
          <TBody>
            {items.map((item, idx) => (
              <Tr key={idx}>
                <Td>
                  <Subtitle className="text-primary tracking-normal">{item.nombre || item.tipo}</Subtitle>
                  <TextSmall className="text-gray-400 mt-1">{item.nit || item.identificacion || item.serial || item.codigoUnico}</TextSmall>
                </Td>
                <Td>
                  <Subtitle className="tracking-normal">{item.ciudad || item.marca} — {item.sucursal || item.linea || item.zona}</Subtitle>
                  <TextSmall className="text-gray-400 uppercase mt-1">{item.email || item.correo || item.proveedor || 'SIN EMAIL REGISTRADO'}</TextSmall>
                </Td>
                <Td>
                  <div className="flex gap-4">
                    <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => handleView(item, type.slice(0, -1))} />
                    <IconButton icon={Edit2} className="text-gray-300 hover:text-primary" onClick={() => handleEdit(item, type.slice(0, -1))} />
                    <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => removeItem(item.id, type)} />
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

export default GenericListView;
