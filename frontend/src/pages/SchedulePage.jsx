import { useState, useMemo } from 'react';
import {
  CheckCircle2, ChevronRight, AlertCircle, Clock, MapPin,
  ClipboardList, ArrowLeft, Search, CalendarDays
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ActiveVisitView from '../components/schedule/ActiveVisitView';

const SchedulePage = ({ data, setData }) => {
  const [activeVisit, setActiveVisit] = useState(null);
  const [formSent, setFormSent] = useState(false);
  const [filterClient, setFilterClient] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const myVisits = data.visitas.filter(v => v.tecnico_asignado === "Carlos Perez");

  const kpis = useMemo(() => {
    const total = myVisits.length;
    const completed = myVisits.filter(v => v.estado === 'Finalizada').length;
    const pending = myVisits.filter(v => v.estado !== 'Finalizada').length;
    return { total, completed, pending };
  }, [myVisits]);

  const filteredVisits = useMemo(() => {
    return myVisits.filter(v => {
      const matchClient = v.cliente.toLowerCase().includes(filterClient.toLowerCase());
      const matchDate = filterDate === '' || v.fecha === filterDate;
      const clientDetails = data.clientes.find(c => c.nombre === v.cliente);
      const matchCity = filterCity === '' || (clientDetails?.ciudad.toLowerCase().includes(filterCity.toLowerCase()));
      return matchClient && matchDate && matchCity;
    });
  }, [myVisits, filterClient, filterDate, filterCity, data.clientes]);

  const handleStartService = (visit) => {
    if (visit.estado !== 'En Ejecución') {
      const updatedVisits = data.visitas.map(v => v.id === visit.id ? { ...v, estado: 'En Ejecución' } : v);
      setData({ ...data, visitas: updatedVisits });
    }
    setActiveVisit(visit);
  };

  const handleFinish = () => {
    setFormSent(true);
    const updatedVisits = data.visitas.map(v => v.id === activeVisit.id ? {...v, estado: 'Finalizada'} : v);
    setTimeout(() => { setData({...data, visitas: updatedVisits}); setFormSent(false); setActiveVisit(null); }, 2000);
  };

  if (formSent) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in">
      <div className="w-24 h-24 bg-green-50 text-green-600 rounded-md flex items-center justify-center animate-bounce shadow-2xl shadow-green-100"><CheckCircle2 size={48} /></div>
      <h2 className="text-2xl font-bold text-gray-900 uppercase">Visita Sincronizada</h2>
    </div>
  );

  if (activeVisit) return (
    <ActiveVisitView
      activeVisit={activeVisit}
      data={data}
      setData={setData}
      onBack={() => setActiveVisit(null)}
      onFinish={handleFinish}
      setActiveVisit={setActiveVisit}
    />
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end bg-white p-6 rounded-md border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none mb-2">Hola, Carlos</h2>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-200"></span> Operación Activa</div>
        </div>
        <div className="text-right"><p className="text-xl font-bold text-[#D32F2F] leading-none mb-1">21 ENE</p><p className="text-[10px] font-bold text-gray-300 uppercase">JUEVES 2026</p></div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-[#1A1A1A]"><div className="flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Visitas Asignadas</p><h3 className="text-2xl font-bold text-gray-900">{kpis.total}</h3></div><div className="p-3 bg-gray-50 rounded-md"><ClipboardList size={20} className="text-gray-400" /></div></div></Card>
        <Card className="p-4 border-l-4 border-green-500"><div className="flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Realizadas</p><h3 className="text-2xl font-bold text-green-600">{kpis.completed}</h3></div><div className="p-3 bg-green-50 rounded-md"><CheckCircle2 size={20} className="text-green-500" /></div></div></Card>
        <Card className="p-4 border-l-4 border-[#D32F2F]"><div className="flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Pendientes</p><h3 className="text-2xl font-bold text-[#D32F2F]">{kpis.pending}</h3></div><div className="p-3 bg-red-50 rounded-md"><Clock size={20} className="text-[#D32F2F]" /></div></div></Card>
      </div>
      <Card className="p-4 bg-gray-50 border-none shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Filtrar Cliente" placeholder="Nombre..." icon={Search} value={filterClient} onChange={e => setFilterClient(e.target.value)} />
          <Input label="Fecha" type="date" icon={CalendarDays} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <Input label="Ciudad" placeholder="Ej: Bogotá" icon={MapPin} value={filterCity} onChange={e => setFilterCity(e.target.value)} />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
        {filteredVisits.length > 0 ? filteredVisits.map(v => (
          <Card key={v.id} className={`p-6 group ${v.estado === 'Finalizada' ? 'opacity-60 grayscale' : ''}`} onClick={() => v.estado !== 'Finalizada' && handleStartService(v)}>
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-300 uppercase">{v.id}</span>
                  <span className={`text-[9px] font-bold uppercase px-3 py-1 rounded-md ${v.estado === 'En Ejecución' ? 'bg-[#D32F2F] text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>{v.estado}</span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 group-hover:text-[#D32F2F] transition-colors">{v.cliente}</h4>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400"><MapPin size={16} className="text-[#D32F2F]" /> <span>{v.direccion}</span></div>
              </div>
              {v.prioridad === 'Alta' && <div className="p-5 bg-red-50 text-[#D32F2F] rounded-md animate-pulse"><AlertCircle size={36} /></div>}
            </div>
            <div className="flex justify-end border-t border-gray-50 pt-10"><span className="text-xs font-bold uppercase text-gray-900 group-hover:text-[#D32F2F] transition-all flex items-center gap-4">Iniciar Registro Técnico <ChevronRight size={24}/></span></div>
          </Card>
        )) : (
          <div className="p-20 text-center border-2 border-dashed border-gray-100 rounded-md"><p className="text-gray-300 font-bold uppercase">Sin resultados</p></div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
