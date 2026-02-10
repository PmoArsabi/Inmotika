import { useState, useMemo } from 'react';
import {
  ArrowLeft, AlertCircle, ClipboardList, CalendarDays, Clock, Building2,
  MapPin, Settings, UserCircle2, UserCog, Phone, ShieldCheck, Cpu,
  Filter, Hash, Plus, CheckCircle2, Activity, FileText, History, Zap,
  ClipboardCheck
} from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DataField from '../ui/DataField';

const VisitInfoPanel = ({ activeVisit, data, setData, onBack, onFinish, setActiveVisit, DeviceReportCard }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [newDeviceSerial, setNewDeviceSerial] = useState('');

  const detailedInfo = useMemo(() => {
    const client = data.clientes.find(c => c.nombre === activeVisit.cliente);
    const allDevices = activeVisit.dispositivos?.map(code =>
      data.dispositivos.find(d => d.codigoUnico === code || d.serial === code)
    ).filter(Boolean) || [];
    const filteredDevices = selectedDeviceId ? allDevices.filter(dev => dev.codigoUnico === selectedDeviceId) : allDevices;
    return { client, devices: filteredDevices, totalDevices: allDevices.length, allAssigned: allDevices };
  }, [activeVisit, data.clientes, data.dispositivos, selectedDeviceId]);

  const handleAddNewDevice = () => {
    if (!newDeviceSerial) return;
    const globalDevice = data.dispositivos.find(d => d.serial === newDeviceSerial);
    if (globalDevice) {
      if (activeVisit.dispositivos.includes(globalDevice.codigoUnico)) return;
      const updatedVisits = data.visitas.map(v =>
        v.id === activeVisit.id ? { ...v, dispositivos: [...v.dispositivos, globalDevice.codigoUnico] } : v
      );
      setData({ ...data, visitas: updatedVisits });
      setActiveVisit({ ...activeVisit, dispositivos: [...activeVisit.dispositivos, globalDevice.codigoUnico] });
      setNewDeviceSerial('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-12 duration-700 pb-24">
      <button onClick={onBack} className="flex items-center gap-4 text-[11px] font-black uppercase text-gray-400 tracking-widest hover:text-black transition-colors"><ArrowLeft size={24}/> Volver a Mi Agenda</button>
      <div className="grid grid-cols-1 gap-8">
        <Card className="p-10 bg-white shadow-xl space-y-12">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-8 border-gray-100 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{activeVisit.id}</span>
                <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-xl ${activeVisit.estado === 'En Ejecución' ? 'bg-[#D32F2F] text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>{activeVisit.estado}</span>
              </div>
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Ficha del Servicio</h2>
            </div>
            {activeVisit.prioridad === 'Alta' && (
              <div className="flex items-center gap-3 px-6 py-3 bg-red-50 text-[#D32F2F] rounded-2xl font-black text-[10px] uppercase border border-red-100"><AlertCircle size={18} /> Prioridad Crítica</div>
            )}
          </header>

          {/* Assignment + Client Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-4 text-[#D32F2F] border-b border-gray-50 pb-4"><ClipboardList size={22} /><h4 className="text-sm font-black uppercase tracking-[0.2em]">Datos de Asignación</h4></div>
              <div className="grid grid-cols-2 gap-8">
                <DataField label="Fecha Programada" value={activeVisit.fecha} icon={CalendarDays} />
                <DataField label="Hora Inicio" value={activeVisit.hora} icon={Clock} />
                <DataField label="Cliente Solicitante" value={activeVisit.cliente} icon={Building2} />
                <DataField label="Sucursal / Sede" value={activeVisit.sucursal} icon={MapPin} />
                <DataField label="Tipo Mantenimiento" value={activeVisit.tipoMantenimiento} icon={Settings} />
                <DataField label="Solicitado por" value={activeVisit.solicitadoPor} icon={UserCircle2} />
              </div>
              <div className="p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Observación del Coordinador</span>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed italic">"{activeVisit.observaciones || 'Sin instrucciones adicionales'}"</p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="flex items-center gap-4 text-[#D32F2F] border-b border-gray-50 pb-4"><UserCog size={22} /><h4 className="text-sm font-black uppercase tracking-[0.2em]">Datos del Cliente</h4></div>
              <div className="grid grid-cols-2 gap-8">
                <DataField label="Nombre Comercial" value={detailedInfo.client?.nombre} />
                <DataField label="NIT / Identificación" value={detailedInfo.client?.nit} />
                <div className="col-span-2"><DataField label="Dirección Física" value={(detailedInfo.client?.direccion || '') + ' (' + (detailedInfo.client?.ciudad || '') + ')'} icon={MapPin} /></div>
                <DataField label="Contacto en Sitio" value={activeVisit.contactoNombre || detailedInfo.client?.email} icon={UserCog} />
                <DataField label="Celular de Contacto" value={activeVisit.contactoCelular || detailedInfo.client?.telefono} icon={Phone} />
              </div>
              <div className="p-6 bg-[#1A1A1A] rounded-[1.5rem] flex items-center justify-between text-white">
                <div className="flex items-center gap-4"><ShieldCheck size={24} className="text-[#D32F2F]" /><div><p className="text-[10px] font-black uppercase text-gray-400">Estado de Seguridad</p><p className="text-xs font-bold">Cliente en Cumplimiento</p></div></div>
              </div>
            </div>
          </div>

          {/* Devices filter + list */}
          <div className="space-y-8 pt-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-gray-50 pb-8">
              <div className="flex items-center gap-4 text-[#D32F2F]"><Cpu size={22} /><h4 className="text-sm font-black uppercase tracking-[0.2em]">Equipos Asignados ({detailedInfo.devices.length}/{detailedInfo.totalDevices})</h4></div>
              <div className="flex flex-col sm:flex-row gap-6 flex-1 max-w-3xl justify-end">
                <div className="w-full sm:w-64">
                  <Select label="Filtrar Equipo" icon={Filter} value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} options={[{ value: '', label: 'Ver todos' }, ...detailedInfo.allAssigned.map(dev => ({ value: dev.codigoUnico, label: `${dev.codigoUnico} - ${dev.tipo}` }))]} />
                </div>
                <div className="w-full sm:w-80 space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Vincular por Serial</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1"><Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Número de Serial..." value={newDeviceSerial} onChange={(e) => setNewDeviceSerial(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#D32F2F]" /></div>
                    <button onClick={handleAddNewDevice} disabled={!newDeviceSerial} className="p-3.5 bg-gray-900 text-white rounded-xl hover:bg-[#D32F2F] disabled:opacity-30 shadow-md transition-all"><Plus size={20} /></button>
                  </div>
                </div>
              </div>
            </div>
            {/* Device info cards */}
            <div className="grid grid-cols-1 gap-10">
              {detailedInfo.devices.map((dev, idx) => (
                <div key={idx} className="p-8 border-2 border-gray-100 rounded-[2.5rem] bg-white overflow-hidden">
                  <div className="flex justify-between items-start mb-8"><span className="px-5 py-2 bg-[#1A1A1A] text-white text-[10px] font-black uppercase rounded-xl tracking-widest">{dev.tipo}</span><div className="flex gap-3"><button type="button" className="p-3 bg-gray-50 rounded-xl text-gray-400 shadow-sm"><FileText size={18} /></button><button type="button" className="p-3 bg-gray-50 rounded-xl text-gray-400 shadow-sm"><Activity size={18} /></button></div></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 mb-12"><DataField label="Marca" value={dev.marca} /><DataField label="Modelo" value={dev.modelo} /><DataField label="Código Único" value={dev.codigoUnico} /><DataField label="Serial #" value={dev.serial} /><DataField label="Dirección MAC" value={dev.imac} /><DataField label="Mantenimiento" value={dev.frecuencia} /></div>
                  <div className="mt-6 pt-8 border-t border-gray-100 space-y-6">
                    <div className="flex items-center gap-3"><History size={18} className="text-[#D32F2F]" /><h5 className="text-[11px] font-black uppercase tracking-widest text-gray-900">Bitácora Técnica</h5></div>
                    <div className="overflow-hidden border border-gray-50 rounded-2xl bg-gray-50/20"><div className="overflow-x-auto"><table className="w-full text-left text-xs border-collapse min-w-[500px]"><thead><tr className="bg-gray-50/50"><th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px]">Fecha</th><th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px]">Técnico</th><th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px]">Tipo</th><th className="px-6 py-4 font-black text-gray-400 uppercase text-[9px]">Observaciones</th></tr></thead><tbody className="divide-y divide-gray-50">{dev.historial?.map((log, lIdx) => (<tr key={lIdx} className="hover:bg-white"><td className="px-6 py-4 font-bold text-gray-600">{log.fecha}</td><td className="px-6 py-4 font-bold text-gray-800">{log.tecnico}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg font-black text-[8px] uppercase ${log.tipo === 'Correctivo' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{log.tipo}</span></td><td className="px-6 py-4 text-gray-500 font-medium italic">{log.observaciones}</td></tr>))}</tbody></table></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Device report cards */}
        <div className="space-y-12">
          {detailedInfo.devices.map((dev, devIdx) => (
            <DeviceReportCard key={`report-${devIdx}`} dev={dev} />
          ))}
        </div>

        {/* Summary */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-10">
            <div className="flex items-center gap-4"><div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg"><ClipboardCheck size={24} /></div><div><h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Control de Equipos Procesados</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consolidado final</p></div></div>
            <div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</p><p className="text-xl font-black text-[#D32F2F]">{detailedInfo.allAssigned.length} Activos</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailedInfo.allAssigned.map((dev, idx) => (
              <div key={`summary-${idx}`} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm border-b-8 border-b-green-500">
                <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dev.codigoUnico}</span></div><CheckCircle2 size={18} className="text-green-500" /></div>
                <h5 className="text-sm font-black text-gray-900 uppercase truncate mb-2">{dev.marca} {dev.modelo}</h5>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50"><div><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Estado</p><span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-lg border border-green-100">Certificado</span></div><div className="text-right"><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Hora Cierre</p><p className="text-[10px] font-black text-gray-700">09:45 AM</p></div></div>
              </div>
            ))}
          </div>
        </section>

        {/* Close visit */}
        <section className="pt-8">
          <div className="p-10 bg-[#D32F2F] rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-red-900/30 border-4 border-white">
            <div className="flex items-center gap-8"><div className="p-6 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/20"><Zap size={48} className="animate-pulse" /></div><div><h3 className="text-3xl font-black uppercase tracking-tighter">Cierre Total de la Visita</h3><p className="text-xs font-bold text-red-100/70 mt-1">"Confirmo la finalización de todas las actividades."</p></div></div>
            <button onClick={onFinish} className="w-full md:w-auto px-16 py-10 bg-white text-[#D32F2F] rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] hover:bg-gray-50 active:scale-[0.97] transition-all shadow-xl">Cerrar y Sincronizar</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VisitInfoPanel;
