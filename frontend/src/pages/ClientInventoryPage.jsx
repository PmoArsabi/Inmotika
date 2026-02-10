import { useState } from 'react';
import { Cpu, ChevronRight, MapPin, Calendar, Activity, Filter } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

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
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="mb-6"><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-1">Inventario Instalado</h2><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Equipos gestionados bajo contrato</p></header>
      
      <Card className="p-6 bg-gray-50 border-none shadow-inner mb-6">
        <div className="flex items-center gap-2 mb-4 text-[#D32F2F]"><Filter size={18} /><h3 className="text-[10px] font-black uppercase tracking-[0.25em]">Filtros de Inventario</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select label="Sucursal" icon={MapPin} value={invFilters.sucursal} onChange={(e) => setInvFilters({...invFilters, sucursal: e.target.value})} options={[{value: '', label: 'Todas las Sedes'}, {value: 'Norte', label: 'Sede Norte'}, {value: 'Centro', label: 'Sede Centro'}, {value: 'Poblado', label: 'Sede Poblado'}]} />
          <Select label="Tipo de Equipo" icon={Cpu} value={invFilters.tipo} onChange={(e) => setInvFilters({...invFilters, tipo: e.target.value})} options={[{value: '', label: 'Todos los Tipos'}, {value: 'Cámara IP', label: 'Cámaras'}, {value: 'Sensor PIR', label: 'Sensores'}, {value: 'Panel Control', label: 'Paneles'}]} />
          <Input label="Fecha Mantenimiento" type="date" icon={Calendar} value={invFilters.fecha} onChange={(e) => setInvFilters({...invFilters, fecha: e.target.value})} />
          <Select label="Estado Actual" icon={Activity} value={invFilters.estado} onChange={(e) => setInvFilters({...invFilters, estado: e.target.value})} options={[{value: '', label: 'Todos los Estados'}, {value: 'Operativo', label: 'Operativo'}, {value: 'Falla', label: 'En Falla'}, {value: 'Mantenimiento', label: 'En Mantenimiento'}]} />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.length > 0 ? (
          filteredDevices.map((dev, idx) => (
            <Card key={idx} className="p-6 hover:border-[#D32F2F] transition-all cursor-default">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><Cpu size={22} /></div>
                <div className="text-right">
                  <span className="block text-[9px] font-black bg-[#1A1A1A] text-white px-3 py-1 rounded-lg uppercase mb-1">{dev.code}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{dev.sucursal}</span>
                </div>
              </div>
              <h4 className="text-lg font-black text-gray-900 uppercase mb-2">{dev.modelo ? `Dispositivo ${dev.modelo}` : `Dispositivo ${dev.code.split('-')[1]}`}</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{dev.tipo} - Serie Pro-Security</p>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${dev.estado === 'Operativo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{dev.estado}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-400">{dev.fechaMant}</span>
                  <button className="text-gray-300 hover:text-[#D32F2F]"><ChevronRight size={18} /></button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No se encontraron equipos con estos filtros</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientInventoryPage;
