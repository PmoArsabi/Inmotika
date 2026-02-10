import { ShieldCheck, LayoutDashboard, Users, Smartphone, Building2 } from 'lucide-react';
import Card from '../components/ui/Card';
import { ROLES } from '../utils/constants';

const LoginPage = ({ onLogin }) => {
  const quickAccess = [
    { label: 'Director General', role: ROLES.DIRECTOR, icon: LayoutDashboard },
    { label: 'Coordinador Operativo', role: ROLES.COORDINADOR, icon: Users },
    { label: 'Técnico de Campo', role: ROLES.TECNICO, icon: Smartphone },
    { label: 'Clientes Corporativos', role: ROLES.CLIENTE, icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 md:p-12 space-y-10 animate-in zoom-in duration-500 shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#D32F2F] rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-red-200">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">INMOTIKA</h1>
          <p className="text-gray-500 font-semibold uppercase text-[10px] tracking-[0.3em]">Gestión de Alta Disponibilidad</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {quickAccess.map((acc) => (
            <button
              key={acc.role}
              onClick={() => onLogin({ name: acc.label === 'Clientes Corporativos' ? 'Residencial Horizonte' : acc.label, role: acc.role })}
              className="flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-50 hover:border-[#D32F2F] hover:bg-red-50 transition-all group text-left"
            >
              <div className="p-3 bg-gray-100 rounded-2xl group-hover:bg-white group-hover:text-[#D32F2F] transition-colors shadow-sm">
                <acc.icon size={22} />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-gray-400 group-hover:text-[#D32F2F] tracking-widest mb-1">Nivel de Acceso</span>
                <span className="block text-base font-black text-gray-800">{acc.label}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
