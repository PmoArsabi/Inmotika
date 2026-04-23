import { ShieldCheck, LayoutDashboard, Users, Smartphone, Building2 } from 'lucide-react';
import Card from '../ui/Card';
import { ROLES } from '../../utils/constants';
import { H3, TextSmall } from '../ui/Typography';

const RoleSelection = ({ onRoleSelect, onBack, email }) => {
  const quickAccess = [
    { label: 'Director General', role: ROLES.DIRECTOR, icon: LayoutDashboard },
    { label: 'Coordinador Operativo', role: ROLES.COORDINADOR, icon: Users },
    { label: 'Técnico de Campo', role: ROLES.TECNICO, icon: Smartphone },
    { label: 'Clientes Corporativos', role: ROLES.CLIENTE, icon: Building2 },
  ];

  const handleRoleSelect = (role, label) => {
    onRoleSelect({ 
      name: label === 'Clientes Corporativos' ? 'Residencial Horizonte' : label, 
      role: role,
      email: email 
    });
  };

  return (
    <Card className="bg-white shadow-2xl border-0 overflow-hidden animate-in zoom-in duration-300">
      <div className="p-8 md:p-10 space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <H3 className="text-gray-900 mb-2">Selecciona tu Perfil</H3>
          <TextSmall className="text-gray-500">Elige el nivel de acceso correspondiente</TextSmall>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {quickAccess.map((acc) => (
            <button
              key={acc.role}
              onClick={() => handleRoleSelect(acc.role, acc.label)}
              className="flex items-center gap-5 p-5 rounded-2xl border-2 border-gray-100 hover:border-brand hover:bg-red-50 transition-all group text-left"
            >
              <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-brand group-hover:text-white transition-colors shadow-sm">
                <acc.icon size={22} className="text-gray-600 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <TextSmall className="block font-bold uppercase text-gray-400 group-hover:text-brand mb-1 text-2xs">
                  Nivel de Acceso
                </TextSmall>
                <H3 className="text-gray-800 text-base group-hover:text-brand">{acc.label}</H3>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="w-full text-center text-sm text-gray-500 hover:text-brand transition-colors mt-4"
        >
          ← Volver al login
        </button>
      </div>
    </Card>
  );
};

export default RoleSelection;
