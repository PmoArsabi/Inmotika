import { Building2, MapPin, Phone, Mail, Hash, Briefcase, UserCircle2, Info, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';

const ClientDataPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myData = data.clientes.find(c => c.nombre === currentClientName) || {};

  const DataField = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-md border border-gray-100">
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">{Icon && <Icon size={12} className="text-[#D32F2F]" />} {label}</span>
      <p className="text-xs font-bold text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
  );

  const sucursales = [
    { nombre: "Sede Principal (Norte)", ciudad: "Bogotá", direccion: "Calle 10 #5-20", contacto: "Javier Martinez", telefono: "3009988776" },
    { nombre: "Centro de Operaciones", ciudad: "Bogotá", direccion: "Av. Suba #100-55", contacto: "Claudia Lopez", telefono: "3105551212" },
    { nombre: "Almacén General", ciudad: "Cota", direccion: "Km 3 Vía Siberia", contacto: "Roberto Gomez", telefono: "3129988776" }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <header className="flex justify-between items-center mb-4">
        <div><h2 className="text-xl font-bold uppercase tracking-tighter text-gray-900 mb-1">Datos Corporativos</h2><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Información registrada en el sistema</p></div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-md"><Building2 size={24} /></div>
      </header>
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField label="Razón Social" value={myData.nombre} icon={Briefcase} />
          <DataField label="NIT / Identificación" value={myData.nit} icon={Hash} />
          <DataField label="Dirección Sede Principal" value={myData.direccion} icon={MapPin} />
          <DataField label="Ciudad" value={myData.ciudad} icon={MapPin} />
          <DataField label="Teléfono de Contacto" value={myData.telefono} icon={Phone} />
          <DataField label="Correo Electrónico" value={myData.email} icon={Mail} />
        </div>
        <div className="p-3 bg-red-50 rounded-md border border-red-100 flex items-start gap-3">
          <Info size={16} className="text-[#D32F2F] mt-0.5" />
          <div><h5 className="text-[10px] font-bold text-[#D32F2F] uppercase mb-0.5">Nota Informativa</h5><p className="text-[9px] font-bold text-red-800/70">Para actualizar estos datos, por favor contacte a su Director de Cuenta asignado o envíe una solicitud a soporte@inmotika.com.</p></div>
        </div>
      </Card>

      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-md text-gray-500"><MapPin size={18} /></div>
          <div><h4 className="text-lg font-bold uppercase tracking-tighter text-gray-900">Red de Sucursales</h4><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sedes vinculadas al contrato</p></div>
        </div>
        
        <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
          <Table>
            <THead>
              <tr>
                <Th>Nombre / Sede</Th>
                <Th>Ubicación y Contacto</Th>
                <Th align="right">Acción</Th>
              </tr>
            </THead>
            <TBody>
              {sucursales.map((sucursal, idx) => (
                <Tr key={idx}>
                  <Td>
                    <p className="font-bold text-base text-[#D32F2F] leading-tight uppercase tracking-tight">{sucursal.nombre}</p>
                    <p className="text-[10px] text-gray-400 font-bold tracking-tight mt-0.5">{sucursal.ciudad}</p>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">{sucursal.direccion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCircle2 size={10} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{sucursal.contacto} — {sucursal.telefono}</span>
                      </div>
                    </div>
                  </Td>
                  <Td align="right">
                    <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => console.log('View sucursal details', sucursal)} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default ClientDataPage;
