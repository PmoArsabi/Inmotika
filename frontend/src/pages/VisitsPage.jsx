import { useState, useMemo, useEffect } from 'react';
import {
  Plus, CheckCircle2, ChevronRight, ArrowLeft, Building2, MapPin,
  CalendarDays, Clock, UserCog, Phone, UserCircle2, Cpu, Activity,
  Timer, FileText, Users, Settings, Calendar
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DataField from '../components/ui/DataField';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';

const VisitsPage = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('Todas');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [newVisit, setNewVisit] = useState({ cliente: '', tecnico: '', prioridad: 'Media', fecha: '', hora: '', ciudad: '', sucursal: '', contactoNombre: '', contactoCelular: '', dispositivos: [], tipoMantenimiento: 'Preventivo', solicitadoPor: 'Cliente', observaciones: '' });

  const filteredVisitas = useMemo(() => filter === 'Todas' ? data.visitas : data.visitas.filter(v => v.estado === filter), [data.visitas, filter]);
  const selectedClientData = useMemo(() => data.clientes.find(c => c.nombre === newVisit.cliente), [newVisit.cliente, data.clientes]);

  useEffect(() => {
    if (selectedClientData) setNewVisit(prev => ({ ...prev, ciudad: selectedClientData.ciudad || '', sucursal: selectedClientData.sucursal || '', dispositivos: [] }));
  }, [selectedClientData]);

  const handleToggleDevice = (code) => {
    setNewVisit(prev => ({ ...prev, dispositivos: prev.dispositivos.includes(code) ? prev.dispositivos.filter(d => d !== code) : [...prev.dispositivos, code] }));
  };

  const handleAssign = (e) => {
    e.preventDefault();
    const visit = { id: `V-00${data.visitas.length + 1}`, ...newVisit, tecnico_asignado: newVisit.tecnico || null, estado: newVisit.tecnico ? 'Asignada' : 'Pendiente' };
    setData({ ...data, visitas: [visit, ...data.visitas] });
    setIsCreating(false);
    setNewVisit({ cliente: '', tecnico: '', prioridad: 'Media', fecha: '', hora: '', ciudad: '', sucursal: '', contactoNombre: '', contactoCelular: '', dispositivos: [], tipoMantenimiento: 'Preventivo', solicitadoPor: 'Cliente', observaciones: '' });
  };

  // --- DETAIL VIEW ---
  if (selectedVisit) {
    const techInfo = data.tecnicos.find(t => t.nombre === selectedVisit.tecnico_asignado) || {};
    const clientInfo = data.clientes.find(c => c.nombre === selectedVisit.cliente) || {};
    const executionData = selectedVisit.ejecucion || {};
    return (
      <div className="space-y-4 animate-in slide-in-from-right-12 duration-500 pb-20">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedVisit(null)} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"><ArrowLeft size={16} /></button>
            <div>
              <div className="flex items-center gap-2 mb-0.5"><span className="text-[9px] font-bold text-gray-400 uppercase">{selectedVisit.id}</span></div>
              <h2 className="text-xl font-bold uppercase tracking-tighter leading-none">Detalle de Visita</h2>
            </div>
          </div>
          <Button variant="outline"><FileText size={14} /> Exportar Ficha</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#D32F2F] border-b border-gray-100 pb-2"><Building2 size={16} /><h4 className="text-[10px] font-bold uppercase">Datos de la Visita</h4></div>
            <DataField label="Ciudad" value={clientInfo.ciudad || selectedVisit.ciudad} icon={MapPin} />
            <DataField label="Cliente" value={selectedVisit.cliente} icon={Users} />
            <DataField label="Sucursal" value={selectedVisit.sucursal} />
            <DataField label="Total Dispositivos" value={selectedVisit.dispositivos?.length || 0} icon={Cpu} />
            <DataField label="Nombre Contacto" value={selectedVisit.contactoNombre} icon={UserCircle2} />
            <DataField label="# Celular Contacto" value={selectedVisit.contactoCelular} icon={Phone} />
          </Card>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#D32F2F] border-b border-gray-100 pb-2"><CalendarDays size={16} /><h4 className="text-[10px] font-bold uppercase">Agenda</h4></div>
            <DataField label="Fecha Programada" value={selectedVisit.fecha} icon={Calendar} />
            <DataField label="Hora Programada" value={selectedVisit.hora} icon={Clock} />
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Tener en cuenta comentario</label>
              <p className="text-[11px] font-bold text-gray-700 italic">"{selectedVisit.observaciones || 'Sin comentarios'}"</p>
            </div>
          </Card>
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[#D32F2F] border-b border-gray-100 pb-2"><UserCog size={16} /><h4 className="text-[10px] font-bold uppercase">Técnico Asignado</h4></div>
            <DataField label="Nombre del Técnico" value={selectedVisit.tecnico_asignado} />
            <DataField label="# Celular Técnico" value={techInfo.celular} icon={Phone} />
            <div className="mt-1 p-2 bg-gray-900 rounded-md text-white text-center">
              <p className="text-[8px] font-bold uppercase opacity-50">Zona Operativa</p>
              <p className="font-bold text-xs">{techInfo.zona || 'General'}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 space-y-6 border-l-4 border-[#D32F2F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 bg-gray-100 rounded-md text-[#D32F2F]"><Activity size={20} /></div><h4 className="text-lg font-bold uppercase tracking-tighter">Estado de la Visita</h4></div>
            <span className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase ${selectedVisit.estado === 'Finalizada' ? 'bg-green-50 text-white' : 'bg-[#D32F2F] text-white'}`}>{selectedVisit.estado}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            <DataField label="Fecha y Hora Inicio" value={executionData.horaInicio ? `${selectedVisit.fecha} ${executionData.horaInicio}` : 'Pendiente'} icon={Timer} />
            <DataField label="# Dispositivos Terminados" value={executionData.dispositivosTerminados || 0} icon={CheckCircle2} />
            <div className="col-span-2 space-y-1">
              <label className="text-[8px] font-bold text-gray-400 uppercase block ml-1">Comentarios del Técnico</label>
              <div className="p-3 bg-gray-50 rounded-md text-[11px] font-bold text-gray-700 border border-gray-100">{executionData.observacionesTecnico || 'Sin reporte de campo aún.'}</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- CREATE VIEW ---
  if (isCreating) {
    return (
      <div className="space-y-4 animate-in slide-in-from-right-12 duration-500 pb-20">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreating(false)} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"><ArrowLeft size={16} /></button>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tighter leading-none">Agendar Nueva Visita</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Configuración de Despliegue Operativo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>Anular</Button>
            <Button variant="danger" onClick={handleAssign}>Confirmar</Button>
          </div>
        </header>

        <form onSubmit={handleAssign} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-red-50 text-[#D32F2F] rounded-md shadow-sm"><MapPin size={20} /></div><h4 className="text-[10px] font-bold uppercase text-gray-900 border-l-2 border-[#D32F2F] pl-3">Localización y Sede</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Cliente Solicitante" options={[{value: '', label: 'Seleccionar Cliente'}, ...data.clientes.map(c => ({ value: c.nombre, label: c.nombre }))]} value={newVisit.cliente} onChange={e => setNewVisit({...newVisit, cliente: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-3"><Input label="Ciudad" value={newVisit.ciudad} placeholder="Ciudad" readOnly /><Input label="Sucursal" value={newVisit.sucursal} placeholder="Sucursal" readOnly /></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3"><div className="p-2 bg-red-50 text-[#D32F2F] rounded-md shadow-sm"><Cpu size={20} /></div><h4 className="text-[10px] font-bold uppercase text-gray-900 border-l-2 border-[#D32F2F] pl-3">Inventario a Intervenir</h4></div>
                {!newVisit.cliente ? (
                  <div className="p-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-100 text-center"><p className="text-[10px] font-bold text-gray-300 uppercase">Seleccione un cliente para ver dispositivos disponibles</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedClientData?.dispositivos.map(code => (
                      <button key={code} type="button" onClick={() => handleToggleDevice(code)} className={`flex items-center justify-between p-4 rounded-md border-2 transition-all group ${newVisit.dispositivos.includes(code) ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-xl scale-[1.01]' : 'bg-white border-gray-100 hover:border-[#D32F2F]/30 text-gray-500'}`}>
                        <span className="text-[11px] font-bold tracking-tight">{code}</span>
                        {newVisit.dispositivos.includes(code) ? <CheckCircle2 size={16} className="text-[#D32F2F]" /> : <Plus size={14} className="opacity-0 group-hover:opacity-100" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[9px] font-bold uppercase text-gray-400">Observaciones Técnicas</h4>
                  <span className={`text-[8px] font-bold ${newVisit.observaciones.length > 900 ? 'text-red-500' : 'text-gray-300'}`}>{newVisit.observaciones.length} / 1000</span>
                </div>
                <textarea className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/5 focus:bg-white focus:border-[#D32F2F] transition-all text-xs font-semibold resize-none leading-relaxed" placeholder="Instrucciones especiales para la visita..." maxLength={1000} value={newVisit.observaciones} onChange={e => setNewVisit({...newVisit, observaciones: e.target.value})}></textarea>
              </div>
            </Card>
          </div>
          <aside className="lg:col-span-4 space-y-4">
            <Card className="p-6 space-y-6 bg-[#1A1A1A] text-white shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3"><div className="p-2 bg-white/5 rounded-md text-[#D32F2F] shadow-inner"><CalendarDays size={20} /></div><h4 className="text-[10px] font-bold uppercase">Agenda</h4></div>
                <div className="grid grid-cols-2 gap-3">
                  <Input dark label="Fecha" type="date" value={newVisit.fecha} onChange={e => setNewVisit({...newVisit, fecha: e.target.value})} required />
                  <Input dark label="Hora" type="time" value={newVisit.hora} onChange={e => setNewVisit({...newVisit, hora: e.target.value})} required />
                </div>
                <Select dark label="Especialista" options={[{value: '', label: 'Por Asignar'}, ...data.tecnicos.map(t => ({ value: t.nombre, label: t.nombre }))]} value={newVisit.tecnico} onChange={e => setNewVisit({...newVisit, tecnico: e.target.value})} />
                <Select dark label="Prioridad" options={[{value: 'Baja', label: 'Baja'}, {value: 'Media', label: 'Media'}, {value: 'Alta', label: 'Alta'}]} value={newVisit.prioridad} onChange={e => setNewVisit({...newVisit, prioridad: e.target.value})} />
              </div>
              <div className="space-y-4 pt-1 border-t border-white/10">
                <Input dark label="Nombre Contacto" icon={Users} value={newVisit.contactoNombre} onChange={e => setNewVisit({...newVisit, contactoNombre: e.target.value})} required />
                <Input dark label="Celular" icon={Phone} type="tel" value={newVisit.contactoCelular} onChange={e => setNewVisit({...newVisit, contactoCelular: e.target.value})} required />
              </div>
              <div className="space-y-3 pt-1 border-t border-white/10">
                <Select dark label="Tipo Servicio" options={[{value: 'Preventivo', label: 'Preventivo'}, {value: 'Correctivo', label: 'Correctivo'}]} value={newVisit.tipoMantenimiento} onChange={e => setNewVisit({...newVisit, tipoMantenimiento: e.target.value})} />
                <Select dark label="Solicitante" options={[{value: 'Cliente', label: 'Cliente'}, {value: 'Inmotika', label: 'Inmotika'}, {value: 'Técnico', label: 'Técnico'}]} value={newVisit.solicitadoPor} onChange={e => setNewVisit({...newVisit, solicitadoPor: e.target.value})} />
              </div>
              <Button variant="danger" className="w-full py-3 text-[10px]" type="submit">Generar Visita</Button>
            </Card>
          </aside>
        </form>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex overflow-x-auto w-full sm:w-auto no-scrollbar gap-1.5 p-1 bg-gray-100 rounded-md">
          {['Todas', 'Pendiente', 'Asignada', 'En Ejecución', 'Finalizada'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${filter === f ? 'bg-white text-[#D32F2F] shadow-sm' : 'text-gray-400'}`}>{f}</button>
          ))}
        </div>
        <Button onClick={() => setIsCreating(true)}><Plus size={16} /> Nueva Programación</Button>
      </header>
      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead>
            <tr>
              <Th>ID Servicio</Th>
              <Th className="hidden md:table-cell">Responsable Técnico</Th>
              <Th>Status Actual</Th>
              <Th align="right">Ficha</Th>
            </tr>
          </THead>
          <TBody>
            {filteredVisitas.map(v => (
              <Tr key={v.id} onClick={() => setSelectedVisit(v)}>
                <Td>
                  <p className="font-bold text-sm text-gray-900">{v.id}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{v.cliente}</p>
                </Td>
                <Td className="hidden md:table-cell">
                  <p className="text-xs font-bold text-gray-600 italic">{v.tecnico_asignado || 'Sin Asignar'}</p>
                </Td>
                <Td>
                  <span className={`text-[9px] font-bold uppercase px-4 py-1.5 rounded-md shadow-sm ${v.estado === 'En Ejecución' ? 'bg-[#D32F2F] text-white animate-pulse' : v.estado === 'Asignada' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>{v.estado}</span>
                </Td>
                <Td align="right">
                  <button className="text-gray-200 group-hover:text-black transition-all group-hover:translate-x-2">
                    <ChevronRight size={20} />
                  </button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default VisitsPage;
