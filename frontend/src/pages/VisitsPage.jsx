import { useState, useMemo } from 'react';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  Plus, CheckCircle2, ChevronRight, ArrowLeft, Building2, MapPin,
  CalendarDays, Clock, UserCog, Phone, UserCircle2, Cpu, Activity,
  Timer, FileText, Users, Settings, Calendar, Edit, Eye, Trash2, X,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DataField from '../components/ui/DataField';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';

import { Subtitle, TextSmall, H2, H3, TextTiny, Label } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import CardHeader from '../components/ui/CardHeader';

const VisitsPage = ({ data, setData }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('Todas');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'list'
  const [calendarView, setCalendarView] = useState('day'); // 'day', 'week', 'month'
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [newVisit, setNewVisit] = useState({ cliente: '', tecnico: '', prioridad: 'Media', fecha: '', hora: '', contactoNombre: '', contactoCelular: '', dispositivos: [], tipoMantenimiento: 'Preventivo', solicitadoPor: 'Cliente', observaciones: '', sucursal: '' });

  // Todos los hooks deben ejecutarse antes de cualquier return condicional
  const filteredVisitas = useMemo(() => {
    const visitas = data?.visitas;
    if (!visitas) return [];
    return filter === 'Todas' ? visitas : visitas.filter(v => v.estado === filter);
  }, [data?.visitas, filter]);

  const selectedClientData = useMemo(() => {
    if (!data?.clientes) return null;
    return data.clientes.find(c => c.nombre === newVisit.cliente);
  }, [newVisit.cliente, data]);
  
  const selectedClientCity = selectedClientData?.ciudad || '';
  const selectedClientBranch = selectedClientData?.sucursal || selectedClientData?.sucursales?.[0]?.nombre || '';

  const stats = useMemo(() => {
    const visitas = data?.visitas;
    if (!visitas) return { total: 0, pendientes: 0, confirmadas: 0, completadas: 0 };
    const total = visitas.length;
    const pendientes = visitas.filter(v => v.estado === 'Pendiente').length;
    const confirmadas = visitas.filter(v => v.estado === 'Asignada' || v.estado === 'Confirmada').length;
    const completadas = visitas.filter(v => v.estado === 'Finalizada' || v.estado === 'Completada').length;
    return { total, pendientes, confirmadas, completadas };
  }, [data?.visitas]);

  const getDeviceNames = (visit) => {
    if (!visit?.dispositivos || visit.dispositivos.length === 0) return [];
    if (!data?.dispositivos) return visit.dispositivos;
    return visit.dispositivos.map(code => {
      const device = data.dispositivos.find(d => d.codigoUnico === code || d.idInmotika === code);
      return device ? (device.tipo || device.marca || code) : code;
    });
  };

  // Obtener dispositivos completos del cliente/sucursal seleccionado
  const getClientDevices = useMemo(() => {
    const dispositivos = data?.dispositivos;
    if (!newVisit.cliente || !selectedClientData || !dispositivos) return [];

    // Obtener dispositivos de la sucursal seleccionada o de todas las sucursales
    let devices = [];

    if (newVisit.sucursal && selectedClientData.sucursales) {
      const selectedBranch = selectedClientData.sucursales.find(s => s.nombre === newVisit.sucursal);
      if (selectedBranch?.dispositivos) {
        devices = selectedBranch.dispositivos
          .map(id => dispositivos.find(d => d.id === id))
          .filter(Boolean)
          .map(device => ({
            ...device,
            code: device.codigoUnico || device.idInmotika || device.serial || `DEV-${device.id}`,
            displayName: device.tipo || device.marca || `Dispositivo ${device.id}`
          }));
      }
    } else if (selectedClientData.sucursales) {
      const allDeviceIds = new Set();
      selectedClientData.sucursales.forEach(sucursal => {
        if (sucursal.dispositivos) {
          sucursal.dispositivos.forEach(id => allDeviceIds.add(id));
        }
      });
      devices = Array.from(allDeviceIds)
        .map(id => dispositivos.find(d => d.id === id))
        .filter(Boolean)
        .map(device => ({
          ...device,
          code: device.codigoUnico || device.idInmotika || device.serial || `DEV-${device.id}`,
          displayName: device.tipo || device.marca || `Dispositivo ${device.id}`
        }));
    }

    if (devices.length === 0 && selectedClientData.dispositivos) {
      devices = selectedClientData.dispositivos
        .map(code => {
          const device = dispositivos.find(d =>
            d.codigoUnico === code || d.idInmotika === code || d.serial === code
          );
          if (device) return { ...device, code, displayName: device.tipo || device.marca || code };
          return { code, tipo: 'Dispositivo', marca: '', modelo: '', codigoUnico: code, displayName: code };
        })
        .filter(Boolean);
    }

    return devices;
  }, [newVisit.cliente, newVisit.sucursal, selectedClientData, data]);

  const handleToggleDevice = (deviceCode) => {
    setNewVisit(prev => ({ 
      ...prev, 
      dispositivos: prev.dispositivos.includes(deviceCode) 
        ? prev.dispositivos.filter(d => d !== deviceCode) 
        : [...prev.dispositivos, deviceCode] 
    }));
  };

  const handleAssign = (e) => {
    e.preventDefault();
    const visit = { 
      id: `V-00${(data?.visitas?.length || 0) + 1}`, 
      ...newVisit, 
      ciudad: selectedClientCity, 
      sucursal: newVisit.sucursal || selectedClientBranch, 
      tecnico_asignado: newVisit.tecnico || null, 
      estado: newVisit.tecnico ? 'Asignada' : 'Pendiente' 
    };
    setData({ ...data, visitas: [visit, ...(data.visitas || [])] });
    setIsCreating(false);
    setNewVisit({ cliente: '', tecnico: '', prioridad: 'Media', fecha: '', hora: '', contactoNombre: '', contactoCelular: '', dispositivos: [], tipoMantenimiento: 'Preventivo', solicitadoPor: 'Cliente', observaciones: '', sucursal: '' });
  };

  const confirm = useConfirm();
  const notify = useNotify();

  const handleDeleteVisit = async (visitId) => {
    const confirmed = await confirm({
      title: '¿Eliminar visita?',
      message: '¿Está seguro de que desea eliminar esta visita? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Descartar',
      type: 'danger'
    });

    if (confirmed) {
      setData({ ...data, visitas: (data.visitas || []).filter(v => v.id !== visitId) });
      setDetailPanelOpen(false);
      setSelectedVisit(null);
      notify('success', 'Visita eliminada correctamente');
    }
  };

  const handleVisitClick = (visit) => {
    setSelectedVisit(visit);
    setDetailPanelOpen(true);
  };

  // Generar horas del día (8 AM a 8 PM)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 a 20

  // Obtener visitas del día seleccionado
  const getVisitsForDate = (date) => {
    if (!data?.visitas) return [];
    const dateStr = date.toISOString().split('T')[0];
    return filteredVisitas.filter(v => {
      if (!v.fecha) return false;
      const visitDate = new Date(v.fecha).toISOString().split('T')[0];
      return visitDate === dateStr;
    }).sort((a, b) => {
      if (!a.hora || !b.hora) return 0;
      return a.hora.localeCompare(b.hora);
    });
  };

  // Obtener días de la semana
  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Ajustar para que la semana empiece en domingo
    startOfWeek.setDate(diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    return days;
  };

  const weekDays = getWeekDays(timelineDate);

  // Calcular posición y altura del evento en el timeline
  const getEventPosition = (visit) => {
    if (!visit.hora) return { top: 0, height: 60 };
    const [hours, minutes] = visit.hora.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const top = ((startMinutes - 8 * 60) / 60) * 60; // 60px por hora
    const duration = 60; // Duración por defecto de 1 hora
    return { top, height: duration };
  };

  // Formatear hora para mostrar
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'p. m.' : 'a. m.';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes.padStart(2, '0')} ${ampm}`;
  };

  // --- DETAIL VIEW ---
  if (selectedVisit) {
    const techInfo = (data?.tecnicos || []).find(t => t.nombre === selectedVisit.tecnico_asignado) || {};
    const clientInfo = (data?.clientes || []).find(c => c.nombre === selectedVisit.cliente) || {};
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
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500 pb-20">
        {/* Modern Header */}
        <header className="bg-linear-to-r from-[#D32F2F] to-[#B71C1C] rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsCreating(false)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <H2 className="text-white mb-1">Agendar Nueva Visita</H2>
                <Subtitle className="text-white/80">Configuración de Despliegue Operativo</Subtitle>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Anular
              </Button>
              <Button 
                variant="default" 
                onClick={handleAssign}
                className="bg-white text-[#D32F2F] hover:bg-gray-100 shadow-lg"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </header>

        <form onSubmit={handleAssign} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-8 space-y-6">
            {/* Location Section */}
            <Card className="p-6 bg-white shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-linear-to-br from-red-50 to-red-100 rounded-xl">
                  <MapPin size={24} className="text-[#D32F2F]" />
                </div>
                <div>
                  <Label className="text-lg font-bold text-gray-900">Localización y Sede</Label>
                  <TextTiny className="text-gray-500">Seleccione el cliente y ubicación</TextTiny>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select 
                  label="Cliente Solicitante" 
                  options={[{value: '', label: 'Seleccionar Cliente'}, ...(data?.clientes || []).map(c => ({ value: c.nombre, label: c.nombre }))]} 
                  value={newVisit.cliente} 
                  onChange={e => {
                    setNewVisit({...newVisit, cliente: e.target.value, sucursal: ''});
                  }} 
                  required 
                />
                <Select 
                  label="Sucursal" 
                  options={
                    !newVisit.cliente || !selectedClientData?.sucursales 
                      ? [{value: '', label: 'Primero seleccione un cliente'}] 
                      : selectedClientData.sucursales.map(s => ({ value: s.nombre, label: s.nombre }))
                  }
                  value={newVisit.sucursal || selectedClientBranch}
                  onChange={e => setNewVisit({...newVisit, sucursal: e.target.value})}
                  disabled={!newVisit.cliente}
                  required
                />
              </div>
            </Card>

            {/* Devices Section */}
            <Card className="p-6 bg-white shadow-md border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl">
                  <Cpu size={24} className="text-blue-600" />
                </div>
                <div>
                  <Label className="text-lg font-bold text-gray-900">Inventario a Intervenir</Label>
                  <TextTiny className="text-gray-500">Seleccione los dispositivos a revisar</TextTiny>
                </div>
              </div>
              {!newVisit.cliente ? (
                <div className="p-12 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <Cpu size={48} className="mx-auto mb-4 text-gray-300" />
                  <Label className="text-gray-400 text-base">Seleccione un cliente para ver dispositivos disponibles</Label>
                </div>
              ) : getClientDevices.length === 0 ? (
                <div className="p-12 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <Cpu size={48} className="mx-auto mb-4 text-gray-300" />
                  <Label className="text-gray-400 text-base">Este cliente no tiene dispositivos registrados</Label>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getClientDevices.map(device => {
                    const isSelected = newVisit.dispositivos.includes(device.code);
                    return (
                      <button 
                        key={device.code} 
                        type="button" 
                        onClick={() => handleToggleDevice(device.code)} 
                        className={`flex flex-col p-4 rounded-xl border-2 transition-all group text-left ${
                          isSelected
                            ? 'bg-linear-to-br from-[#1A1A1A] to-gray-900 border-[#1A1A1A] text-white shadow-lg scale-[1.02]' 
                            : 'bg-white border-gray-200 hover:border-[#D32F2F] hover:shadow-md text-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Cpu size={16} className={isSelected ? 'text-[#D32F2F]' : 'text-gray-400'} />
                              <TextSmall className={`font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {device.displayName}
                              </TextSmall>
                            </div>
                            {device.marca && (
                              <TextTiny className={isSelected ? 'text-white/80' : 'text-gray-500'}>
                                {device.marca} {device.modelo ? `- ${device.modelo}` : ''}
                              </TextTiny>
                            )}
                          </div>
                          {isSelected ? (
                            <CheckCircle2 size={20} className="text-[#D32F2F] bg-white rounded-full shrink-0" />
                          ) : (
                            <Plus size={18} className="opacity-0 group-hover:opacity-100 text-[#D32F2F] transition-opacity shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200/20">
                          <TextTiny className={isSelected ? 'text-white/60' : 'text-gray-400'}>
                            Código: {device.code}
                          </TextTiny>
                          {device.codigoUnico && device.codigoUnico !== device.code && (
                            <TextTiny className={`block ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                              Único: {device.codigoUnico}
                            </TextTiny>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Observations Section */}
            <Card className="p-6 bg-white shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-linear-to-br from-purple-50 to-purple-100 rounded-xl">
                    <FileText size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <Label className="text-lg font-bold text-gray-900">Observaciones Técnicas</Label>
                    <TextTiny className="text-gray-500">Instrucciones especiales para la visita</TextTiny>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  newVisit.observaciones.length > 900 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {newVisit.observaciones.length} / 1000
                </div>
              </div>
              <textarea 
                className="w-full h-40 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/10 focus:bg-white focus:border-[#D32F2F] transition-all text-sm font-medium resize-none leading-relaxed" 
                placeholder="Escriba aquí las instrucciones especiales, requisitos técnicos o cualquier información relevante para la visita..."
                maxLength={1000} 
                value={newVisit.observaciones} 
                onChange={e => setNewVisit({...newVisit, observaciones: e.target.value})}
              />
            </Card>
          </div>

          {/* Sidebar - Agenda */}
          <aside className="lg:col-span-4 space-y-6">
            <Card className="p-6 bg-linear-to-br from-[#1A1A1A] to-gray-900 text-white shadow-2xl border-0">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <CalendarDays size={24} className="text-[#D32F2F]" />
                </div>
                <div>
                  <Label className="text-white text-lg font-bold">Agenda</Label>
                  <TextTiny className="text-white/60">Programación de la visita</TextTiny>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    dark 
                    label="Fecha" 
                    type="date" 
                    value={newVisit.fecha} 
                    onChange={e => setNewVisit({...newVisit, fecha: e.target.value})} 
                    required 
                  />
                  <Input 
                    dark 
                    label="Hora" 
                    type="time" 
                    value={newVisit.hora} 
                    onChange={e => setNewVisit({...newVisit, hora: e.target.value})} 
                    required 
                  />
                </div>
                <Select 
                  dark 
                  label="Especialista" 
                  options={[{value: '', label: 'Por Asignar'}, ...(data?.tecnicos || []).map(t => ({ value: t.nombre, label: t.nombre }))]} 
                  value={newVisit.tecnico} 
                  onChange={e => setNewVisit({...newVisit, tecnico: e.target.value})} 
                />
                <Select 
                  dark 
                  label="Prioridad" 
                  options={[{value: 'Baja', label: 'Baja'}, {value: 'Media', label: 'Media'}, {value: 'Alta', label: 'Alta'}]} 
                  value={newVisit.prioridad} 
                  onChange={e => setNewVisit({...newVisit, prioridad: e.target.value})} 
                />
              </div>

              <div className="space-y-4 pt-6 mt-6 border-t border-white/10">
                <Input 
                  dark 
                  label="Nombre Contacto" 
                  icon={Users} 
                  value={newVisit.contactoNombre} 
                  onChange={e => setNewVisit({...newVisit, contactoNombre: e.target.value})} 
                  required 
                />
                <Input 
                  dark 
                  label="Celular" 
                  icon={Phone} 
                  type="tel" 
                  value={newVisit.contactoCelular} 
                  onChange={e => setNewVisit({...newVisit, contactoCelular: e.target.value})} 
                  required 
                />
              </div>

              <div className="space-y-4 pt-6 mt-6 border-t border-white/10">
                <Select 
                  dark 
                  label="Tipo Servicio" 
                  options={[{value: 'Preventivo', label: 'Preventivo'}, {value: 'Correctivo', label: 'Correctivo'}]} 
                  value={newVisit.tipoMantenimiento} 
                  onChange={e => setNewVisit({...newVisit, tipoMantenimiento: e.target.value})} 
                />
                <Select 
                  dark 
                  label="Solicitante" 
                  options={[{value: 'Cliente', label: 'Cliente'}, {value: 'Inmotika', label: 'Inmotika'}, {value: 'Técnico', label: 'Técnico'}]} 
                  value={newVisit.solicitadoPor} 
                  onChange={e => setNewVisit({...newVisit, solicitadoPor: e.target.value})} 
                />
              </div>

              <Button 
                variant="danger" 
                className="w-full py-4 mt-6 text-sm font-bold shadow-lg hover:shadow-xl transition-all" 
                type="submit"
              >
                <Plus size={18} className="mr-2" />
                Generar Visita
              </Button>
            </Card>
          </aside>
        </form>
      </div>
    );
  }

  // --- LIST VIEW ---

  // Render Timeline View
  if (viewMode === 'timeline') {
    return (
      <div className="flex h-[calc(100vh-4rem)] animate-in fade-in duration-700 -m-6 lg:-m-10 relative">
        {/* Main Timeline Area */}
        <div className="flex-1 transition-all duration-300 min-w-0">
          <div className="space-y-3 h-full flex flex-col px-6 lg:px-10">
            {/* Header */}
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <CalendarDays size={24} className="text-blue-600" />
                </div>
                <div>
                  <H2 className="text-gray-900 normal-case">Cronograma de Visitas</H2>
                  <Subtitle className="text-gray-500">Sistema de Agendamiento de Mantenimientos</Subtitle>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gray-100' : ''}
                >
                  Lista
                </Button>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus size={18} /> Nueva Visita
                </Button>
              </div>
            </header>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <TextTiny className="text-gray-500 mb-0.5">Total Visitas</TextTiny>
                    <H2 className="text-2xl font-bold text-gray-900">{stats.total}</H2>
                  </div>
                  <CalendarDays size={20} className="text-blue-500" />
                </div>
              </Card>
              <Card className="p-3 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <TextTiny className="text-gray-500 mb-0.5">Pendientes</TextTiny>
                    <H2 className="text-2xl font-bold text-gray-900">{stats.pendientes}</H2>
                  </div>
                  <Activity size={20} className="text-yellow-500" />
                </div>
              </Card>
              <Card className="p-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <TextTiny className="text-gray-500 mb-0.5">Confirmadas</TextTiny>
                    <H2 className="text-2xl font-bold text-gray-900">{stats.confirmadas}</H2>
                  </div>
                  <Clock size={20} className="text-blue-500" />
                </div>
              </Card>
              <Card className="p-3 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <TextTiny className="text-gray-500 mb-0.5">Completadas</TextTiny>
                    <H2 className="text-2xl font-bold text-gray-900">{stats.completadas}</H2>
                  </div>
                  <CheckCircle2 size={20} className="text-green-500" />
                </div>
              </Card>
            </div>

            {/* Calendar Controls - Outlook Style */}
            <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => {
                  const newDate = new Date(timelineDate);
                  if (calendarView === 'day') {
                    newDate.setDate(newDate.getDate() - 1);
                  } else if (calendarView === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  }
                  setTimelineDate(newDate);
                }}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const newDate = new Date(timelineDate);
                  if (calendarView === 'day') {
                    newDate.setDate(newDate.getDate() + 1);
                  } else if (calendarView === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  }
                  setTimelineDate(newDate);
                }}>
                  <ChevronRightIcon size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTimelineDate(new Date())}>
                  Hoy
                </Button>
                <div className="ml-4">
                  {calendarView === 'day' ? (
                    <>
                      <H3 className="text-xl font-bold text-gray-900">
                        {timelineDate.getDate()}
                      </H3>
                      <TextSmall className="text-gray-500">
                        {timelineDate.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', year: 'numeric' })}
                      </TextSmall>
                    </>
                  ) : calendarView === 'week' ? (
                    <>
                      <H3 className="text-lg font-bold text-gray-900">
                        {weekDays[0].getDate()} - {weekDays[6].getDate()} de {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </H3>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-1 bg-gray-100 rounded-md p-1">
                  <Button 
                    variant={calendarView === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCalendarView('day')}
                    className={calendarView === 'day' ? 'bg-white shadow-sm' : ''}
                  >
                    Día
                  </Button>
                  <Button 
                    variant={calendarView === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCalendarView('week')}
                    className={calendarView === 'week' ? 'bg-white shadow-sm' : ''}
                  >
                    Semana
                  </Button>
                  <Button 
                    variant={calendarView === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCalendarView('month')}
                    className={calendarView === 'month' ? 'bg-white shadow-sm' : ''}
                  >
                    Mes
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setFilter(filter === 'Todas' ? 'Pendiente' : 'Todas')}
                  className={filter === 'Todas' ? 'bg-gray-100' : ''}
                >
                  <Settings size={16} /> {filter}
                </Button>
              </div>
            </div>

            {/* Calendar Day View - Outlook Style */}
            <Card className="flex-1 overflow-hidden p-0 min-h-0">
              <div className="h-full overflow-auto bg-white">
                {calendarView === 'day' ? (
                  <div className="flex h-full">
                    {/* Time Column */}
                    <div className="w-20 border-r border-gray-200 bg-gray-50">
                      <div className="h-16 border-b border-gray-200"></div>
                      {hours.map((hour) => (
                        <div key={hour} className="h-15 border-b border-gray-100 relative">
                          <div className="absolute -top-2.5 right-2 text-xs text-gray-500 font-medium">
                            {hour === 12 ? '12' : hour > 12 ? hour - 12 : hour}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Events Column */}
                    <div className="flex-1 relative">
                      {/* Day Header */}
                      <div className="h-16 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center px-4">
                        <div>
                          <H3 className="text-2xl font-bold text-gray-900">{timelineDate.getDate()}</H3>
                          <TextSmall className="text-gray-500">
                            {timelineDate.toLocaleDateString('es-ES', { weekday: 'long' })}
                          </TextSmall>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="relative">
                        {hours.map((hour) => (
                          <div key={hour} className="h-15 border-b border-gray-100 relative">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"></div>
                          </div>
                        ))}

                        {/* Events */}
                        {getVisitsForDate(timelineDate).map((visit) => {
                          const position = getEventPosition(visit);
                          const getStatusColor = (estado) => {
                            switch(estado) {
                              case 'Finalizada':
                              case 'Completada': return 'bg-green-500 border-green-600';
                              case 'Asignada':
                              case 'Confirmada': return 'bg-blue-500 border-blue-600';
                              case 'En Ejecución': return 'bg-purple-500 border-purple-600';
                              case 'Pendiente': return 'bg-yellow-500 border-yellow-600';
                              default: return 'bg-gray-500 border-gray-600';
                            }
                          };

                          return (
                            <div
                              key={visit.id}
                              className={`absolute left-2 right-2 rounded-md border-l-4 ${getStatusColor(visit.estado)} text-white shadow-md hover:shadow-lg transition-all cursor-pointer group`}
                              style={{
                                top: `${position.top}px`,
                                height: `${position.height}px`,
                                minHeight: '60px'
                              }}
                              onClick={() => handleVisitClick(visit)}
                            >
                              <div className="p-3 h-full flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <TextSmall className="font-bold text-white">
                                      {formatTime(visit.hora)}
                                    </TextSmall>
                                    <StatusBadge status={visit.estado} className="text-[10px] px-1.5 py-0.5" />
                                  </div>
                                  <H3 className="text-sm font-bold text-white mb-1 line-clamp-1">
                                    {visit.cliente}
                                  </H3>
                                  <TextTiny className="text-white/90 line-clamp-1">
                                    {visit.sucursal || 'Sin sucursal'}
                                  </TextTiny>
                                </div>
                                {visit.tecnico_asignado && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <UserCog size={12} className="text-white/80" />
                                    <TextTiny className="text-white/80 truncate">
                                      {visit.tecnico_asignado}
                                    </TextTiny>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : calendarView === 'week' ? (
                  <div className="flex h-full">
                    {/* Time Column */}
                    <div className="w-20 border-r border-gray-200 bg-gray-50">
                      <div className="h-16 border-b border-gray-200"></div>
                      {hours.map((hour) => (
                        <div key={hour} className="h-15 border-b border-gray-100 relative">
                          <div className="absolute -top-2.5 right-2 text-xs text-gray-500 font-medium">
                            {hour === 12 ? '12' : hour > 12 ? hour - 12 : hour}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Week Days Columns */}
                    <div className="flex-1 flex">
                      {weekDays.map((day, dayIdx) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayVisits = getVisitsForDate(day);
                        
                        return (
                          <div key={dayIdx} className="flex-1 border-r border-gray-200 relative last:border-r-0">
                            {/* Day Header */}
                            <div className={`h-16 border-b border-gray-200 sticky top-0 z-10 flex flex-col items-center justify-center px-2 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                              <TextTiny className="text-gray-500 uppercase text-[10px]">
                                {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                              </TextTiny>
                              <H3 className={`text-xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                                {day.getDate()}
                              </H3>
                            </div>

                            {/* Time Slots */}
                            <div className="relative">
                              {hours.map((hour) => (
                                <div key={hour} className="h-15 border-b border-gray-100 relative">
                                  <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"></div>
                                </div>
                              ))}

                              {/* Events for this day */}
                              {dayVisits.map((visit) => {
                                const position = getEventPosition(visit);
                                const getStatusColor = (estado) => {
                                  switch(estado) {
                                    case 'Finalizada':
                                    case 'Completada': return 'bg-green-500 border-green-600';
                                    case 'Asignada':
                                    case 'Confirmada': return 'bg-blue-500 border-blue-600';
                                    case 'En Ejecución': return 'bg-purple-500 border-purple-600';
                                    case 'Pendiente': return 'bg-yellow-500 border-yellow-600';
                                    default: return 'bg-gray-500 border-gray-600';
                                  }
                                };

                                return (
                                  <div
                                    key={visit.id}
                                    className={`absolute left-1 right-1 rounded-md border-l-4 ${getStatusColor(visit.estado)} text-white shadow-md hover:shadow-lg transition-all cursor-pointer group`}
                                    style={{
                                      top: `${position.top}px`,
                                      height: `${position.height}px`,
                                      minHeight: '60px'
                                    }}
                                    onClick={() => handleVisitClick(visit)}
                                  >
                                    <div className="p-2 h-full flex flex-col justify-between">
                                      <div>
                                        <TextTiny className="font-bold text-white text-[10px]">
                                          {formatTime(visit.hora)}
                                        </TextTiny>
                                        <H3 className="text-xs font-bold text-white mb-0.5 line-clamp-1">
                                          {visit.cliente}
                                        </H3>
                                        <TextTiny className="text-white/90 line-clamp-1 text-[10px]">
                                          {visit.sucursal || 'Sin sucursal'}
                                        </TextTiny>
                                      </div>
                                      {visit.tecnico_asignado && (
                                        <TextTiny className="text-white/80 truncate text-[9px] mt-1">
                                          {visit.tecnico_asignado}
                                        </TextTiny>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <TextSmall className="text-gray-400">Vista {calendarView} próximamente</TextSmall>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Detail Panel */}
        {detailPanelOpen && selectedVisit && (
          <div className="absolute right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <H3 className="text-lg font-bold text-gray-900">Detalle de Visita</H3>
              <button 
                onClick={() => {
                  setDetailPanelOpen(false);
                  setSelectedVisit(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Visit Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <H3 className="text-xl font-bold text-gray-900">{selectedVisit.cliente}</H3>
                  <StatusBadge status={selectedVisit.estado} />
                </div>
                <div className="space-y-3">
                  <DataField label="ID" value={selectedVisit.id} />
                  <DataField label="Sucursal" value={selectedVisit.sucursal} icon={MapPin} />
                  <DataField label="Fecha" value={selectedVisit.fecha ? new Date(selectedVisit.fecha).toLocaleDateString('es-ES') : 'Sin fecha'} icon={Calendar} />
                  <DataField label="Hora" value={selectedVisit.hora || 'Sin hora'} icon={Clock} />
                  <DataField label="Técnico" value={selectedVisit.tecnico_asignado || 'Sin asignar'} icon={UserCog} />
                  <DataField label="Contacto" value={selectedVisit.contactoNombre || 'Sin contacto'} icon={UserCircle2} />
                  <DataField label="Celular" value={selectedVisit.contactoCelular || 'Sin celular'} icon={Phone} />
                  <DataField label="Tipo" value={selectedVisit.tipoMantenimiento || 'Preventivo'} icon={Settings} />
                </div>
              </div>

              {/* Devices */}
              {getDeviceNames(selectedVisit).length > 0 && (
                <div>
                  <Label className="mb-2 block">Dispositivos</Label>
                  <div className="flex flex-wrap gap-2">
                    {getDeviceNames(selectedVisit).map((name, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Observations */}
              {selectedVisit.observaciones && (
                <div>
                  <Label className="mb-2 block">Observaciones</Label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <TextSmall className="text-gray-700">{selectedVisit.observaciones}</TextSmall>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setDetailPanelOpen(false);
                  setIsCreating(true);
                  setNewVisit({
                    ...selectedVisit,
                    tecnico: selectedVisit.tecnico_asignado || '',
                    cliente: selectedVisit.cliente || '',
                    fecha: selectedVisit.fecha || '',
                    hora: selectedVisit.hora || '',
                    contactoNombre: selectedVisit.contactoNombre || '',
                    contactoCelular: selectedVisit.contactoCelular || '',
                    dispositivos: selectedVisit.dispositivos || [],
                    tipoMantenimiento: selectedVisit.tipoMantenimiento || 'Preventivo',
                    observaciones: selectedVisit.observaciones || ''
                  });
                  // Eliminar la visita antigua si se guarda la nueva
                  // Esto se puede manejar mejor con un ID de edición
                }}
              >
                <Edit size={16} /> Editar Visita
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setDetailPanelOpen(false);
                  // Mantener selectedVisit para que se muestre la vista de detalle completa
                }}
              >
                <Eye size={16} /> Ver Detalle Completo
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteVisit(selectedVisit.id)}
              >
                <Trash2 size={16} /> Eliminar Visita
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <CalendarDays size={24} className="text-blue-600" />
          </div>
          <div>
            <H2 className="text-gray-900 normal-case">Cronograma de Visitas</H2>
            <Subtitle className="text-gray-500">Sistema de Agendamiento de Mantenimientos</Subtitle>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={18} /> Nueva Visita
        </Button>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <TextSmall className="text-gray-500 mb-1">Total Visitas</TextSmall>
              <H2 className="text-3xl font-bold text-gray-900">{stats.total}</H2>
            </div>
            <CalendarDays size={24} className="text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <TextSmall className="text-gray-500 mb-1">Pendientes</TextSmall>
              <H2 className="text-3xl font-bold text-gray-900">{stats.pendientes}</H2>
            </div>
            <Activity size={24} className="text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <TextSmall className="text-gray-500 mb-1">Confirmadas</TextSmall>
              <H2 className="text-3xl font-bold text-gray-900">{stats.confirmadas}</H2>
            </div>
            <Clock size={24} className="text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <TextSmall className="text-gray-500 mb-1">Completadas</TextSmall>
              <H2 className="text-3xl font-bold text-gray-900">{stats.completadas}</H2>
            </div>
            <CheckCircle2 size={24} className="text-green-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Settings size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, sucursal o solicitante..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setViewMode('timeline')}
            className={viewMode === 'timeline' ? 'bg-gray-100' : ''}
          >
            <Calendar size={16} /> Cronograma
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setFilter(filter === 'Todas' ? 'Pendiente' : 'Todas')}
            className={filter === 'Todas' ? 'bg-gray-100' : ''}
          >
            <Settings size={16} /> {filter}
          </Button>
        </div>
      </div>

      {/* Visit Cards */}
      <div className="space-y-4">
        {filteredVisitas.length === 0 ? (
          <Card className="p-12 text-center">
            <TextSmall className="text-gray-400">No hay visitas programadas</TextSmall>
          </Card>
        ) : (
          filteredVisitas.map(visit => {
            const deviceNames = getDeviceNames(visit);
            
            return (
              <Card 
                key={visit.id} 
                className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-[#D32F2F]"
                onClick={() => handleVisitClick(visit)}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <H3 className="text-lg font-bold text-gray-900">{visit.cliente}</H3>
                          <StatusBadge status={visit.estado} />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {visit.sucursal && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-gray-400" />
                              <TextSmall>{visit.sucursal}</TextSmall>
                            </div>
                          )}
                          {visit.contactoNombre && (
                            <div className="flex items-center gap-1.5">
                              <UserCircle2 size={14} className="text-gray-400" />
                              <TextSmall>{visit.contactoNombre}</TextSmall>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                        <Settings size={18} className="text-gray-400" />
                      </button>
                    </div>

                    {/* Devices */}
                    {deviceNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {deviceNames.slice(0, 3).map((name, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold"
                          >
                            {name}
                          </span>
                        ))}
                        {deviceNames.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                            +{deviceNames.length - 3} más
                          </span>
                        )}
                      </div>
                    )}

                    {/* Observations */}
                    {visit.observaciones && (
                      <div className="pt-2 border-t border-gray-100">
                        <TextSmall className="text-gray-600 italic">{visit.observaciones}</TextSmall>
                      </div>
                    )}

                    {/* Type */}
                    <div className="flex items-center gap-2">
                      <Settings size={14} className="text-gray-400" />
                      <TextSmall className="text-gray-600 font-medium">
                        {visit.tipoMantenimiento || 'Mantenimiento Preventivo'}
                      </TextSmall>
                    </div>
                  </div>

                  {/* Schedule Card */}
                  <div className="lg:w-48 shrink-0">
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-600" />
                          <TextSmall className="text-blue-900 font-semibold">
                            {visit.fecha ? new Date(visit.fecha).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 'Sin fecha'}
                          </TextSmall>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-600" />
                          <TextSmall className="text-blue-900 font-semibold">
                            {visit.hora || 'Sin hora'}
                          </TextSmall>
                        </div>
                        {visit.tecnico_asignado && (
                          <div className="pt-2 border-t border-blue-200">
                            <TextTiny className="text-blue-700 mb-1">Técnico</TextTiny>
                            <TextSmall className="text-blue-900 font-semibold">
                              {visit.tecnico_asignado}
                            </TextSmall>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VisitsPage;
