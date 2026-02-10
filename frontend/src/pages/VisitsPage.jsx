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
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500 pb-20">
        <header className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedVisit(null)} className="p-3 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
            <div>
              <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedVisit.id}</span></div>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Detalle de Visita</h2>
            </div>
          </div>
          <Button variant="outline"><FileText size={16} /> Exportar Ficha</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 text-[#D32F2F] border-b border-gray-100 pb-3"><Building2 size={20} /><h4 className="text-xs font-black uppercase tracking-widest">Datos de la Visita</h4></div>
            <DataField label="Ciudad" value={clientInfo.ciudad || selectedVisit.ciudad} icon={MapPin} />
            <DataField label="Cliente" value={selectedVisit.cliente} icon={Users} />
            <DataField label="Sucursal" value={selectedVisit.sucursal} />
            <DataField label="Total Dispositivos" value={selectedVisit.dispositivos?.length || 0} icon={Cpu} />
            <DataField label="Nombre Contacto" value={selectedVisit.contactoNombre} icon={UserCircle2} />
            <DataField label="# Celular Contacto" value={selectedVisit.contactoCelular} icon={Phone} />
          </Card>
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 text-[#D32F2F] border-b border-gray-100 pb-3"><CalendarDays size={20} /><h4 className="text-xs font-black uppercase tracking-widest">Agenda</h4></div>
            <DataField label="Fecha Programada" value={selectedVisit.fecha} icon={Calendar} />
            <DataField label="Hora Programada" value={selectedVisit.hora} icon={Clock} />
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tener en cuenta comentario</label>
              <p className="text-xs font-bold text-gray-700 italic">"{selectedVisit.observaciones || 'Sin comentarios'}"</p>
            </div>
          </Card>
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-3 text-[#D32F2F] border-b border-gray-100 pb-3"><UserCog size={20} /><h4 className="text-xs font-black uppercase tracking-widest">Técnico Asignado</h4></div>
            <DataField label="Nombre del Técnico" value={selectedVisit.tecnico_asignado} />
            <DataField label="# Celular Técnico" value={techInfo.celular} icon={Phone} />
            <div className="mt-2 p-3 bg-gray-900 rounded-xl text-white text-center">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Zona Operativa</p>
              <p className="font-bold text-sm">{techInfo.zona || 'General'}</p>
            </div>
          </Card>
        </div>

        <Card className="p-8 space-y-8 border-l-8 border-[#D32F2F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="p-3 bg-gray-100 rounded-xl text-[#D32F2F]"><Activity size={24} /></div><h4 className="text-lg font-black uppercase tracking-tighter">Estado de la Visita</h4></div>
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedVisit.estado === 'Finalizada' ? 'bg-green-50 text-white' : 'bg-[#D32F2F] text-white'}`}>{selectedVisit.estado}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
            <DataField label="Fecha y Hora Inicio" value={executionData.horaInicio ? `${selectedVisit.fecha} ${executionData.horaInicio}` : 'Pendiente'} icon={Timer} />
            <DataField label="# Dispositivos Terminados" value={executionData.dispositivosTerminados || 0} icon={CheckCircle2} />
            <div className="col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">Comentarios del Técnico</label>
              <div className="p-4 bg-gray-50 rounded-xl text-xs font-bold text-gray-700 border border-gray-100">{executionData.observacionesTecnico || 'Sin reporte de campo aún.'}</div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- CREATE VIEW ---
  if (isCreating) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500 pb-20">
        <header className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsCreating(false)} className="p-3 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Agendar Nueva Visita</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mt-1">Configuración de Despliegue Operativo</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCreating(false)}>Anular</Button>
            <Button variant="danger" onClick={handleAssign}>Confirmar</Button>
          </div>
        </header>

        <form onSubmit={handleAssign} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-8 space-y-8 bg-white">
              <div className="space-y-6">
                <div className="flex items-center gap-4"><div className="p-3 bg-red-50 text-[#D32F2F] rounded-xl shadow-sm"><MapPin size={24} /></div><h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 border-l-4 border-[#D32F2F] pl-4">Localización y Sede</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select label="Cliente Solicitante" options={[{value: '', label: 'Seleccionar Cliente'}, ...data.clientes.map(c => ({ value: c.nombre, label: c.nombre }))]} value={newVisit.cliente} onChange={e => setNewVisit({...newVisit, cliente: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4"><Input label="Ciudad" value={newVisit.ciudad} placeholder="Ciudad" readOnly /><Input label="Sucursal" value={newVisit.sucursal} placeholder="Sucursal" readOnly /></div>
                </div>
              </div>
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4"><div className="p-3 bg-red-50 text-[#D32F2F] rounded-xl shadow-sm"><Cpu size={24} /></div><h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 border-l-4 border-[#D32F2F] pl-4">Inventario a Intervenir</h4></div>
                {!newVisit.cliente ? (
                  <div className="p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 text-center"><p className="text-xs font-black text-gray-300 uppercase tracking-widest">Seleccione un cliente para ver dispositivos disponibles</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedClientData?.dispositivos.map(code => (
                      <button key={code} type="button" onClick={() => handleToggleDevice(code)} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all group ${newVisit.dispositivos.includes(code) ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-xl scale-[1.02]' : 'bg-white border-gray-100 hover:border-[#D32F2F]/30 text-gray-500'}`}>
                        <span className="text-xs font-black tracking-tight">{code}</span>
                        {newVisit.dispositivos.includes(code) ? <CheckCircle2 size={20} className="text-[#D32F2F]" /> : <Plus size={18} className="opacity-0 group-hover:opacity-100" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Observaciones Técnicas</h4>
                  <span className={`text-[9px] font-black ${newVisit.observaciones.length > 900 ? 'text-red-500' : 'text-gray-300'}`}>{newVisit.observaciones.length} / 1000</span>
                </div>
                <textarea className="w-full h-40 p-6 bg-gray-50 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/5 focus:bg-white focus:border-[#D32F2F] transition-all text-sm font-semibold resize-none leading-relaxed" placeholder="Instrucciones especiales para la visita..." maxLength={1000} value={newVisit.observaciones} onChange={e => setNewVisit({...newVisit, observaciones: e.target.value})}></textarea>
              </div>
            </Card>
          </div>
          <aside className="lg:col-span-4 space-y-6">
            <Card className="p-8 space-y-8 bg-[#1A1A1A] text-white shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4"><div className="p-3 bg-white/5 rounded-xl text-[#D32F2F] shadow-inner"><CalendarDays size={24} /></div><h4 className="text-xs font-black uppercase tracking-[0.3em]">Agenda</h4></div>
                <div className="grid grid-cols-2 gap-4">
                  <Input dark label="Fecha" type="date" value={newVisit.fecha} onChange={e => setNewVisit({...newVisit, fecha: e.target.value})} required />
                  <Input dark label="Hora" type="time" value={newVisit.hora} onChange={e => setNewVisit({...newVisit, hora: e.target.value})} required />
                </div>
                <Select dark label="Especialista" options={[{value: '', label: 'Por Asignar'}, ...data.tecnicos.map(t => ({ value: t.nombre, label: t.nombre }))]} value={newVisit.tecnico} onChange={e => setNewVisit({...newVisit, tecnico: e.target.value})} />
                <Select dark label="Prioridad" options={[{value: 'Baja', label: 'Baja'}, {value: 'Media', label: 'Media'}, {value: 'Alta', label: 'Alta'}]} value={newVisit.prioridad} onChange={e => setNewVisit({...newVisit, prioridad: e.target.value})} />
              </div>
              <div className="space-y-6 pt-2 border-t border-white/10">
                <Input dark label="Nombre Contacto" icon={Users} value={newVisit.contactoNombre} onChange={e => setNewVisit({...newVisit, contactoNombre: e.target.value})} required />
                <Input dark label="Celular" icon={Phone} type="tel" value={newVisit.contactoCelular} onChange={e => setNewVisit({...newVisit, contactoCelular: e.target.value})} required />
              </div>
              <div className="space-y-4 pt-2 border-t border-white/10">
                <Select dark label="Tipo Servicio" options={[{value: 'Preventivo', label: 'Preventivo'}, {value: 'Correctivo', label: 'Correctivo'}]} value={newVisit.tipoMantenimiento} onChange={e => setNewVisit({...newVisit, tipoMantenimiento: e.target.value})} />
                <Select dark label="Solicitante" options={[{value: 'Cliente', label: 'Cliente'}, {value: 'Inmotika', label: 'Inmotika'}, {value: 'Técnico', label: 'Técnico'}]} value={newVisit.solicitadoPor} onChange={e => setNewVisit({...newVisit, solicitadoPor: e.target.value})} />
              </div>
              <Button variant="danger" className="w-full py-4 text-xs" type="submit">Generar Visita</Button>
            </Card>
          </aside>
        </form>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex overflow-x-auto w-full sm:w-auto no-scrollbar gap-2 p-1.5 bg-gray-100 rounded-2xl">
          {['Todas', 'Pendiente', 'Asignada', 'En Ejecución', 'Finalizada'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] transition-all ${filter === f ? 'bg-white text-[#D32F2F] shadow-sm' : 'text-gray-400'}`}>{f}</button>
          ))}
        </div>
        <Button onClick={() => setIsCreating(true)}><Plus size={20} /> Nueva Programación</Button>
      </header>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">ID Servicio</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] hidden md:table-cell">Responsable Técnico</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Status Actual</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVisitas.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedVisit(v)}>
                  <td className="px-8 py-6"><p className="font-black text-sm text-gray-900">{v.id}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{v.cliente}</p></td>
                  <td className="px-8 py-6 hidden md:table-cell"><p className="text-xs font-bold text-gray-600 italic">{v.tecnico_asignado || 'Sin Asignar'}</p></td>
                  <td className="px-8 py-6"><span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-xl tracking-tighter shadow-sm ${v.estado === 'En Ejecución' ? 'bg-[#D32F2F] text-white animate-pulse' : v.estado === 'Asignada' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>{v.estado}</span></td>
                  <td className="px-8 py-6 text-right"><button className="text-gray-200 group-hover:text-black transition-all group-hover:translate-x-2"><ChevronRight size={20} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default VisitsPage;
