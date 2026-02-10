import Card from '../components/ui/Card';

const ClientVisitsPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myVisits = data.visitas.filter(v => v.cliente === currentClientName);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
      <header className="mb-6"><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-1">Control de Visitas</h2><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Historial de intervenciones de mantenimiento</p></header>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] text-white">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">ID</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Fecha</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Técnico</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Tipo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myVisits.map((v, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-5 font-black text-gray-900 text-sm">{v.id}</td>
                  <td className="px-6 py-5 text-sm font-bold text-gray-600">{v.fecha}</td>
                  <td className="px-6 py-5 text-sm font-bold text-gray-600">{v.tecnico_asignado}</td>
                  <td className="px-6 py-5"><span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">{v.tipoMantenimiento}</span></td>
                  <td className="px-6 py-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${v.estado === 'Finalizada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClientVisitsPage;
