import Card from '../components/ui/Card';

const ClientVisitsPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myVisits = data.visitas.filter(v => v.cliente === currentClientName);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <header className="mb-4"><h2 className="text-xl font-bold uppercase tracking-tighter text-gray-900 mb-0.5">Control de Visitas</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Historial de intervenciones de mantenimiento</p></header>
      <Card className="rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] text-white">
              <tr>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em]">ID</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em]">Fecha</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em]">Técnico</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em]">Tipo</th>
                <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myVisits.map((v, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{v.id}</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-600">{v.fecha}</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-600">{v.tecnico_asignado}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-bold uppercase">{v.tipoMantenimiento}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${v.estado === 'Finalizada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.estado}</span></td>
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
