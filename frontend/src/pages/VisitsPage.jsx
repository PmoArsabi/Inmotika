import { useState, useMemo } from 'react';
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

import { Subtitle, TextSmall, H2, TextTiny, Label } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import CardHeader from '../components/ui/CardHeader';

const VisitsPage = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('Todas');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [newVisit, setNewVisit] = useState({ cliente: '', tecnico: '', prioridad: 'Media', fecha: '', hora: '', contactoNombre: '', contactoCelular: '', dispositivos: [], tipoMantenimiento: 'Preventivo', solicitadoPor: 'Cliente', observaciones: '' });

  const filteredVisitas = useMemo(() => filter === 'Todas' ? data.visitas : data.visitas.filter(v => v.estado === filter), [data.visitas, filter]);
  const selectedClientData = useMemo(() => data.clientes.find(c => c.nombre === newVisit.cliente), [newVisit.cliente, data.clientes]);
  const selectedClientCity = selectedClientData?.ciudad || '';
  const selectedClientBranch = selectedClientData?.sucursal || selectedClientData?.sucursales?.[0]?.nombre || '';

  const handleToggleDevice = (code) => {
    setNewVisit(prev => ({ ...prev, dispositivos: prev.dispositivos.includes(code) ? prev.dispositivos.filter(d => d !== code) : [...prev.dispositivos, code] }));
  };

  const handleAssign = (e) => {
    e.preventDefault();
    const visit = { id: `V-00${data.visitas.length + 1}`, ...newVisit, ciudad: selectedClientCity, sucursal: selectedClientBranch, tecnico_asignado: newVisit.tecnico || null, estado: newVisit.tecnico ? 'Asignada' : 'Pendiente' };
    setData({ ...data, visitas: [visit, ...data.visitas] });
    setIsCreating(false);
    setNewVisit({ cliente: '', tecnico: '', prioridad: 'Media', fecha: '', hora: '', contactoNombre: '', contactoCelular: '', dispositivos: [], tipoMantenimiento: 'Preventivo', solicitadoPor: 'Cliente', observaciones: '' });
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
              <div className="flex items-center gap-2 mb-0.5"><Subtitle>{selectedVisit.id}</Subtitle></div>
              <H2>Detalle de Visita</H2>
            </div>
          </div>
          <Button variant="outline"><FileText size={14} /> Exportar Ficha</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 space-y-4">
            <CardHeader icon={Building2} title="Datos de la Visita" />
            <DataField label="Ciudad" value={clientInfo.ciudad || selectedVisit.ciudad} icon={MapPin} />
            <DataField label="Cliente" value={selectedVisit.cliente} icon={Users} />
            <DataField label="Sucursal" value={selectedVisit.sucursal} />
            <DataField label="Total Dispositivos" value={selectedVisit.dispositivos?.length || 0} icon={Cpu} />
            <DataField label="Nombre Contacto" value={selectedVisit.contactoNombre} icon={UserCircle2} />
            <DataField label="# Celular Contacto" value={selectedVisit.contactoCelular} icon={Phone} />
          </Card>
          <Card className="p-4 space-y-4">
            <CardHeader icon={CalendarDays} title="Agenda" />
            <DataField label="Fecha Programada" value={selectedVisit.fecha} icon={Calendar} />
            <DataField label="Hora Programada" value={selectedVisit.hora} icon={Clock} />
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <TextTiny className="text-gray-400 block mb-1">Tener en cuenta comentario</TextTiny>
              <TextSmall className="text-gray-700 italic uppercase font-bold">"{selectedVisit.observaciones || 'Sin comentarios'}"</TextSmall>
            </div>
          </Card>
          <Card className="p-4 space-y-4">
            <CardHeader icon={UserCog} title="Técnico Asignado" />
            <DataField label="Nombre del Técnico" value={selectedVisit.tecnico_asignado} />
            <DataField label="# Celular Técnico" value={techInfo.celular} icon={Phone} />
            <div className="mt-1 p-2 bg-gray-900 rounded-md text-white text-center">
              <TextTiny className="opacity-50">Zona Operativa</TextTiny>
              <p className="font-bold text-xs uppercase">{techInfo.zona || 'General'}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 space-y-6 border-l-4 border-[#D32F2F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="p-2 bg-gray-100 rounded-md text-[#D32F2F]"><Activity size={20} /></div><H2 className="text-lg">Estado de la Visita</H2></div>
            <StatusBadge status={selectedVisit.estado} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            <DataField label="Fecha y Hora Inicio" value={executionData.horaInicio ? `${selectedVisit.fecha} ${executionData.horaInicio}` : 'Pendiente'} icon={Timer} />
            <DataField label="# Dispositivos Terminados" value={executionData.dispositivosTerminados || 0} icon={CheckCircle2} />
            <div className="col-span-2 space-y-1">
              <TextTiny className="text-gray-400 block ml-1">Comentarios del Técnico</TextTiny>
              <div className="p-3 bg-gray-50 rounded-md text-[11px] font-bold text-gray-700 border border-gray-100 uppercase">{executionData.observacionesTecnico || 'Sin reporte de campo aún.'}</div>
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
              <H2>Agendar Nueva Visita</H2>
              <Subtitle>Configuración de Despliegue Operativo</Subtitle>
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
                <div className="flex items-center gap-3"><div className="p-2 bg-red-50 text-[#D32F2F] rounded-md shadow-sm"><MapPin size={20} /></div><Label className="text-gray-900 border-l-2 border-[#D32F2F] pl-3">Localización y Sede</Label></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Cliente Solicitante" options={[{value: '', label: 'Seleccionar Cliente'}, ...data.clientes.map(c => ({ value: c.nombre, label: c.nombre }))]} value={newVisit.cliente} onChange={e => setNewVisit({...newVisit, cliente: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-3"><Input label="Ciudad" value={selectedClientCity} placeholder="Ciudad" readOnly /><Input label="Sucursal" value={selectedClientBranch} placeholder="Sucursal" readOnly /></div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3"><div className="p-2 bg-red-50 text-[#D32F2F] rounded-md shadow-sm"><Cpu size={20} /></div><Label className="text-gray-900 border-l-2 border-[#D32F2F] pl-3">Inventario a Intervenir</Label></div>
                {!newVisit.cliente ? (
                  <div className="p-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-100 text-center"><Label className="text-gray-300">Seleccione un cliente para ver dispositivos disponibles</Label></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedClientData?.dispositivos.map(code => (
                      <button key={code} type="button" onClick={() => handleToggleDevice(code)} className={`flex items-center justify-between p-4 rounded-md border-2 transition-all group ${newVisit.dispositivos.includes(code) ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-xl scale-[1.01]' : 'bg-white border-gray-100 hover:border-[#D32F2F]/30 text-gray-500'}`}>
                        <TextSmall className="tracking-tight">{code}</TextSmall>
                        {newVisit.dispositivos.includes(code) ? <CheckCircle2 size={16} className="text-[#D32F2F]" /> : <Plus size={14} className="opacity-0 group-hover:opacity-100" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center px-1">
                  <TextSmall className="text-gray-400 uppercase">Observaciones Técnicas</TextSmall>
                  <TextTiny className={newVisit.observaciones.length > 900 ? 'text-red-500' : 'text-gray-300'}>{newVisit.observaciones.length} / 1000</TextTiny>
                </div>
                <textarea className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/5 focus:bg-white focus:border-[#D32F2F] transition-all text-xs font-semibold resize-none leading-relaxed" placeholder="Instrucciones especiales para la visita..." maxLength={1000} value={newVisit.observaciones} onChange={e => setNewVisit({...newVisit, observaciones: e.target.value})}></textarea>
              </div>
            </Card>
          </div>
          <aside className="lg:col-span-4 space-y-4">
            <Card className="p-6 space-y-6 bg-[#1A1A1A] text-white shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3"><div className="p-2 bg-white/5 rounded-md text-[#D32F2F] shadow-inner"><CalendarDays size={20} /></div><Label className="text-white">Agenda</Label></div>
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
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-4 py-1.5 rounded-md transition-all ${filter === f ? 'bg-white text-[#D32F2F] shadow-sm' : 'text-gray-400'}`}>
              <TextSmall className={`uppercase ${filter === f ? 'text-[#D32F2F]' : 'text-gray-400'}`}>{f}</TextSmall>
            </button>
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
                  <TextSmall className="text-sm text-gray-900">{v.id}</TextSmall>
                  <Label className="text-gray-400 mt-0.5">{v.cliente}</Label>
                </Td>
                <Td className="hidden md:table-cell">
                  <TextSmall className="text-xs text-gray-600 italic">{v.tecnico_asignado || 'Sin Asignar'}</TextSmall>
                </Td>
                <Td>
                  <StatusBadge status={v.estado} className="px-4 py-1.5 shadow-sm" />
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
