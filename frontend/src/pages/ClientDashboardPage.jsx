import { ClipboardList, Cpu, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import Card from '../components/ui/Card';

const ClientDashboardPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myData = data.clientes.find(c => c.nombre === currentClientName) || {};
  const myVisits = data.visitas.filter(v => v.cliente === currentClientName);
  const myDevices = myData.dispositivos || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="mb-4">
        <h2 className="text-xl font-bold uppercase tracking-tighter text-gray-900 mb-1">Informe General de Operación</h2>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Resumen ejecutivo del estado del contrato</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Total Visitas Mes</p><h3 className="text-2xl font-bold text-blue-600">{myVisits.length}</h3></div><div className="p-3 bg-blue-50 rounded-md text-blue-500"><ClipboardList size={20} /></div></div>
        </Card>
        <Card className="p-4 border-l-4 border-[#D32F2F]">
          <div className="flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Dispositivos Activos</p><h3 className="text-2xl font-bold text-[#D32F2F]">{myDevices.length}</h3></div><div className="p-3 bg-red-50 rounded-md text-[#D32F2F]"><Cpu size={20} /></div></div>
        </Card>
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Cumplimiento SLA</p><h3 className="text-2xl font-bold text-green-600">100%</h3></div><div className="p-3 bg-green-50 rounded-md text-green-500"><CheckCircle2 size={20} /></div></div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-3"><div className="p-2 bg-gray-100 rounded-md"><Activity size={18} className="text-[#D32F2F]"/></div><h4 className="text-xs font-bold uppercase tracking-widest">Actividad Reciente</h4></div>
          {myVisits.slice(0, 3).map((v, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100">
              <div><p className="text-[9px] font-bold text-gray-900 uppercase">{v.tipoMantenimiento}</p><p className="text-[8px] font-bold text-gray-400">{v.fecha}</p></div>
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ${v.estado === 'Finalizada' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{v.estado}</span>
            </div>
          ))}
        </Card>
        <Card className="p-6 flex flex-col justify-center items-center text-center space-y-4 bg-[#1A1A1A] text-white">
          <ShieldCheck size={48} className="text-[#D32F2F] animate-pulse" />
          <div><h3 className="text-xl font-bold uppercase tracking-tighter">Estado de Seguridad: Óptimo</h3><p className="text-[10px] font-bold text-gray-400 mt-1">Todos los sistemas reportan normalidad.</p></div>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
