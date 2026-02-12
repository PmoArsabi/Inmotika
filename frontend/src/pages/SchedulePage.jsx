import { useState, useMemo } from 'react';
import {
  CheckCircle2, ChevronRight, AlertCircle, Clock, MapPin,
  ClipboardList, ArrowLeft, Search, CalendarDays
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ActiveVisitView from '../components/schedule/ActiveVisitView';
import { H1, H2, Subtitle, TextSmall, Metric, Label } from '../components/ui/Typography';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';

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
      <H2>Visita Sincronizada</H2>
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
          <H1 className="mb-2 tracking-tighter leading-none">Hola, Carlos</H1>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-200"></span> Operación Activa</div>
        </div>
        <div className="text-right">
          <Metric className="text-[#D32F2F] leading-none mb-1 text-xl">21 ENE</Metric>
          <Label className="text-gray-300">JUEVES 2026</Label>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Visitas Asignadas" value={kpis.total} icon={ClipboardList} color="gray" />
        <StatCard label="Realizadas" value={kpis.completed} icon={CheckCircle2} color="green" />
        <StatCard label="Pendientes" value={kpis.pending} icon={Clock} color="red" />
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
                  <TextSmall className="text-gray-300">{v.id}</TextSmall>
                  <StatusBadge status={v.estado} className={v.estado === 'En Ejecución' ? 'animate-pulse' : ''} />
                </div>
                <Metric className="text-2xl text-gray-900 group-hover:text-[#D32F2F] transition-colors">{v.cliente}</Metric>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400"><MapPin size={16} className="text-[#D32F2F]" /> <span>{v.direccion}</span></div>
              </div>
              {v.prioridad === 'Alta' && <div className="p-5 bg-red-50 text-[#D32F2F] rounded-md animate-pulse"><AlertCircle size={36} /></div>}
            </div>
            <div className="flex justify-end border-t border-gray-50 pt-10"><span className="text-xs font-bold uppercase text-gray-900 group-hover:text-[#D32F2F] transition-all flex items-center gap-4">Iniciar Registro Técnico <ChevronRight size={24}/></span></div>
          </Card>
        )) : (
          <div className="p-20 text-center border-2 border-dashed border-gray-100 rounded-md"><Label className="text-gray-300">Sin resultados</Label></div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
