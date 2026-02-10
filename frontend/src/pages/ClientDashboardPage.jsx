import { ClipboardList, Cpu, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import Card from '../components/ui/Card';

const ClientDashboardPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myData = data.clientes.find(c => c.nombre === currentClientName) || {};
  const myVisits = data.visitas.filter(v => v.cliente === currentClientName);
  const myDevices = myData.dispositivos || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">Informe General de Operación</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resumen ejecutivo del estado del contrato</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-8 border-blue-500">
          <div className="flex justify-between items-center"><div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Visitas Mes</p><h3 className="text-3xl font-black text-blue-600">{myVisits.length}</h3></div><div className="p-4 bg-blue-50 rounded-2xl text-blue-500"><ClipboardList size={24} /></div></div>
        </Card>
        <Card className="p-6 border-l-8 border-[#D32F2F]">
          <div className="flex justify-between items-center"><div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Dispositivos Activos</p><h3 className="text-3xl font-black text-[#D32F2F]">{myDevices.length}</h3></div><div className="p-4 bg-red-50 rounded-2xl text-[#D32F2F]"><Cpu size={24} /></div></div>
        </Card>
        <Card className="p-6 border-l-8 border-green-500">
          <div className="flex justify-between items-center"><div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Cumplimiento SLA</p><h3 className="text-3xl font-black text-green-600">100%</h3></div><div className="p-4 bg-green-50 rounded-2xl text-green-500"><CheckCircle2 size={24} /></div></div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4"><div className="p-3 bg-gray-100 rounded-xl"><Activity size={20} className="text-[#D32F2F]"/></div><h4 className="text-sm font-black uppercase tracking-widest">Actividad Reciente</h4></div>
          {myVisits.slice(0, 3).map((v, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div><p className="text-[10px] font-black text-gray-900 uppercase">{v.tipoMantenimiento}</p><p className="text-[9px] font-bold text-gray-400">{v.fecha}</p></div>
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${v.estado === 'Finalizada' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{v.estado}</span>
            </div>
          ))}
        </Card>
        <Card className="p-8 flex flex-col justify-center items-center text-center space-y-6 bg-[#1A1A1A] text-white">
          <ShieldCheck size={64} className="text-[#D32F2F] animate-pulse" />
          <div><h3 className="text-2xl font-black uppercase tracking-tighter">Estado de Seguridad: Óptimo</h3><p className="text-xs font-bold text-gray-400 mt-2">Todos los sistemas reportan normalidad.</p></div>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
