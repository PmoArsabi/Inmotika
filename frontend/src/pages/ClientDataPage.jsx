import { Building2, MapPin, Phone, Mail, Hash, Briefcase, UserCircle2, Info } from 'lucide-react';
import Card from '../components/ui/Card';

const ClientDataPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myData = data.clientes.find(c => c.nombre === currentClientName) || {};

  const DataField = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col gap-1.5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">{Icon && <Icon size={12} className="text-[#D32F2F]" />} {label}</span>
      <p className="text-sm font-bold text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
  );

  const sucursales = [
    { nombre: "Sede Principal (Norte)", ciudad: "Bogotá", direccion: "Calle 10 #5-20", contacto: "Javier Martinez", telefono: "3009988776" },
    { nombre: "Centro de Operaciones", ciudad: "Bogotá", direccion: "Av. Suba #100-55", contacto: "Claudia Lopez", telefono: "3105551212" },
    { nombre: "Almacén General", ciudad: "Cota", direccion: "Km 3 Vía Siberia", contacto: "Roberto Gomez", telefono: "3129988776" }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-12 duration-500">
      <header className="flex justify-between items-center mb-6">
        <div><h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2">Datos Corporativos</h2><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Información registrada en el sistema</p></div>
        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Building2 size={28} /></div>
      </header>
      <Card className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataField label="Razón Social" value={myData.nombre} icon={Briefcase} />
          <DataField label="NIT / Identificación" value={myData.nit} icon={Hash} />
          <DataField label="Dirección Sede Principal" value={myData.direccion} icon={MapPin} />
          <DataField label="Ciudad" value={myData.ciudad} icon={MapPin} />
          <DataField label="Teléfono de Contacto" value={myData.telefono} icon={Phone} />
          <DataField label="Correo Electrónico" value={myData.email} icon={Mail} />
        </div>
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
          <Info size={20} className="text-[#D32F2F] mt-1" />
          <div><h5 className="text-xs font-black text-[#D32F2F] uppercase mb-1">Nota Informativa</h5><p className="text-[10px] font-bold text-red-800/70">Para actualizar estos datos, por favor contacte a su Director de Cuenta asignado o envíe una solicitud a soporte@inmotika.com.</p></div>
        </div>
      </Card>

      <div className="space-y-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-100 rounded-xl text-gray-500"><MapPin size={22} /></div>
          <div><h4 className="text-xl font-black uppercase tracking-tighter text-gray-900">Red de Sucursales</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sedes vinculadas al contrato</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((sucursal, idx) => (
            <Card key={idx} className="p-6 hover:border-[#D32F2F] transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 group-hover:bg-[#D32F2F] transition-colors rounded-xl text-gray-400 group-hover:text-white"><Building2 size={18} /></div>
                <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-lg uppercase">{sucursal.ciudad}</span>
              </div>
              <h5 className="text-base font-black text-gray-900 uppercase mb-3 tracking-tight">{sucursal.nombre}</h5>
              <div className="space-y-3 pt-3 border-t border-gray-50">
                <div className="flex gap-2"><MapPin size={14} className="text-[#D32F2F] shrink-0 mt-0.5" /><div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dirección</p><p className="text-[10px] font-bold text-gray-700">{sucursal.direccion}</p></div></div>
                <div className="flex gap-2"><UserCircle2 size={14} className="text-[#D32F2F] shrink-0 mt-0.5" /><div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Admin. Contacto</p><p className="text-[10px] font-bold text-gray-700">{sucursal.contacto}</p><p className="text-[9px] font-bold text-gray-400">{sucursal.telefono}</p></div></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDataPage;
