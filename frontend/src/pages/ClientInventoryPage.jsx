import { useState } from 'react';
import { Cpu, ChevronRight, MapPin, Calendar, Activity, Filter, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';

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
      <header className="mb-4"><h2 className="text-xl font-bold uppercase tracking-tighter text-gray-900 mb-0.5">Inventario Instalado</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Equipos gestionados bajo contrato</p></header>
      
      <Card className="p-4 bg-gray-50 border-none shadow-inner mb-4">
        <div className="flex items-center gap-2 mb-3 text-[#D32F2F]"><Filter size={16} /><h3 className="text-[9px] font-bold uppercase tracking-[0.25em]">Filtros de Inventario</h3></div>
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
                    <p className="font-bold text-base text-[#D32F2F] leading-tight uppercase tracking-tight">
                      {dev.modelo ? `Dispositivo ${dev.modelo}` : `Dispositivo ${dev.code.split('-')[1]}`}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold tracking-tight mt-0.5">{dev.code}</p>
                  </Td>
                  <Td>
                    <p className="text-sm font-bold text-gray-700 leading-tight uppercase">{dev.tipo}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{dev.sucursal}</p>
                  </Td>
                  <Td>
                    <span className={`inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded mb-0.5 ${dev.estado === 'Operativo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {dev.estado}
                    </span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{dev.fechaMant}</p>
                  </Td>
                  <Td align="right">
                    <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => console.log('View device info', dev)} />
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={4} className="text-center py-8 text-gray-400 italic">
                  No se encontraron equipos con estos filtros
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
