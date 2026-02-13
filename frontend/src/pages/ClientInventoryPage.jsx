import { useState } from 'react';
import { Cpu, ChevronRight, MapPin, Calendar, Activity, Filter, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';
import SectionHeader from '../components/ui/SectionHeader';
import { Subtitle, TextSmall, Label } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';

const ClientInventoryPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myData = data.clientes.find(c => c.nombre === currentClientName) || {};
  const myDevices = myData.dispositivos || [];

  const [invFilters, setInvFilters] = useState({ sucursal: '', tipo: '', fecha: '', estado: '' });

  const enrichedDevices = myDevices.map((code, index) => {
    const globalDevice = data.dispositivos.find(d => d.codigoUnico === code) || {};
    return {
      code,
      tipo: globalDevice.tipo || (code.includes('CAM') ? 'Cámara IP' : code.includes('SENSOR') ? 'Sensor PIR' : 'Panel Control'),
      sucursal: index % 2 === 0 ? 'Norte' : 'Centro',
      fechaMant: '2025-12-15',
      estado: 'Operativo',
      modelo: globalDevice.modelo,
      ...globalDevice
    };
  });

  const filteredDevices = enrichedDevices.filter(dev => {
    const matchSucursal = !invFilters.sucursal || dev.sucursal === invFilters.sucursal;
    const matchTipo = !invFilters.tipo || dev.tipo === invFilters.tipo;
    const matchFecha = !invFilters.fecha || dev.fechaMant === invFilters.fecha;
    const matchEstado = !invFilters.estado || dev.estado === invFilters.estado;
    return matchSucursal && matchTipo && matchFecha && matchEstado;
  });

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <SectionHeader title="Inventario Instalado" subtitle="Equipos gestionados bajo contrato" />
      
      <Card className="p-4 bg-gray-50 border-none shadow-inner mb-4">
        <div className="flex items-center gap-2 mb-3 text-[#D32F2F]">
          <Filter size={16} />
          <TextSmall className="font-bold uppercase tracking-[0.25em] text-[#D32F2F]">Filtros de Inventario</TextSmall>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select label="Sucursal" icon={MapPin} value={invFilters.sucursal} onChange={(e) => setInvFilters({...invFilters, sucursal: e.target.value})} options={[{value: '', label: 'Todas las Sedes'}, {value: 'Norte', label: 'Sede Norte'}, {value: 'Centro', label: 'Sede Centro'}, {value: 'Poblado', label: 'Sede Poblado'}]} />
          <Select label="Tipo de Equipo" icon={Cpu} value={invFilters.tipo} onChange={(e) => setInvFilters({...invFilters, tipo: e.target.value})} options={[{value: '', label: 'Todos los Tipos'}, {value: 'Cámara IP', label: 'Cámaras'}, {value: 'Sensor PIR', label: 'Sensores'}, {value: 'Panel Control', label: 'Paneles'}]} />
          <Input label="Fecha Mantenimiento" type="date" icon={Calendar} value={invFilters.fecha} onChange={(e) => setInvFilters({...invFilters, fecha: e.target.value})} />
          <Select label="Estado Actual" icon={Activity} value={invFilters.estado} onChange={(e) => setInvFilters({...invFilters, estado: e.target.value})} options={[{value: '', label: 'Todos los Estados'}, {value: 'Operativo', label: 'Operativo'}, {value: 'Falla', label: 'En Falla'}, {value: 'Mantenimiento', label: 'En Mantenimiento'}]} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead>
            <tr>
              <Th>Equipo / Código</Th>
              <Th>Sede y Categoría</Th>
              <Th>Estado / Próx. Mant.</Th>
              <Th align="right">Acción</Th>
            </tr>
          </THead>
          <TBody>
            {filteredDevices.length > 0 ? (
              filteredDevices.map((dev, idx) => (
                <Tr key={idx}>
                  <Td>
                    <Subtitle className="text-[#D32F2F] normal-case tracking-normal">
                      {dev.modelo ? `Dispositivo ${dev.modelo}` : `Dispositivo ${dev.code.split('-')[1]}`}
                    </Subtitle>
                    <TextSmall className="text-gray-400 mt-0.5">{dev.code}</TextSmall>
                  </Td>
                  <Td>
                    <Subtitle className="text-gray-700 normal-case tracking-normal">{dev.tipo}</Subtitle>
                    <TextSmall className="text-gray-400 mt-0.5">{dev.sucursal}</TextSmall>
                  </Td>
                  <Td>
                    <div className="mb-0.5">
                      <StatusBadge status={dev.estado} />
                    </div>
                    <TextSmall className="text-gray-400">{dev.fechaMant}</TextSmall>
                  </Td>
                  <Td align="right">
                    <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => console.log('View device info', dev)} />
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={4} className="text-center py-8">
                  <TextSmall className="text-gray-400 italic">No se encontraron equipos con estos filtros</TextSmall>
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default ClientInventoryPage;
