import { Building2, MapPin, Phone, Mail, Hash, Briefcase, UserCircle2, Info, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import IconButton from '../components/ui/IconButton';
import InfoField from '../components/ui/InfoField';
import SectionHeader from '../components/ui/SectionHeader';
import { Subtitle, TextSmall, Label } from '../components/ui/Typography';

const ClientDataPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myData = data.clientes.find(c => c.nombre === currentClientName) || {};

  const sucursales = [
    { nombre: "Sede Principal (Norte)", ciudad: "Bogotá", direccion: "Calle 10 #5-20", contacto: "Javier Martinez", telefono: "3009988776" },
    { nombre: "Centro de Operaciones", ciudad: "Bogotá", direccion: "Av. Suba #100-55", contacto: "Claudia Lopez", telefono: "3105551212" },
    { nombre: "Almacén General", ciudad: "Cota", direccion: "Km 3 Vía Siberia", contacto: "Roberto Gomez", telefono: "3129988776" }
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
      <div className="flex justify-between items-center mb-4">
        <SectionHeader 
          title="Datos Corporativos" 
          subtitle="Información registrada en el sistema" 
        />
        <div className="p-3 bg-blue-50 text-blue-600 rounded-md"><Building2 size={24} /></div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Razón Social" value={myData.nombre} icon={Briefcase} />
          <InfoField label="NIT / Identificación" value={myData.nit} icon={Hash} />
          <InfoField label="Dirección Sede Principal" value={myData.direccion} icon={MapPin} />
          <InfoField label="Ciudad" value={myData.ciudad} icon={MapPin} />
          <InfoField label="Teléfono de Contacto" value={myData.telefono} icon={Phone} />
          <InfoField label="Correo Electrónico" value={myData.email} icon={Mail} />
        </div>
        <div className="p-3 bg-red-50 rounded-md border border-red-100 flex items-start gap-3">
          <Info size={16} className="text-[#D32F2F] mt-0.5" />
          <div>
            <TextSmall className="text-[#D32F2F] font-bold mb-0.5">NOTA INFORMATIVA</TextSmall>
            <TextSmall className="text-red-800/70 lowercase first-letter:capitalize font-normal">Para actualizar estos datos, por favor contacte a su Director de Cuenta asignado o envíe una solicitud a soporte@inmotika.com.</TextSmall>
          </div>
        </div>
      </Card>

      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-md text-gray-500"><MapPin size={18} /></div>
          <SectionHeader title="Red de Sucursales" subtitle="Sedes vinculadas al contrato" />
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
                    <Subtitle className="text-[#D32F2F]">{sucursal.nombre}</Subtitle>
                    <TextSmall className="text-gray-400 mt-0.5">{sucursal.ciudad}</TextSmall>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="text-gray-400" />
                        <TextSmall className="text-gray-700 font-bold">{sucursal.direccion}</TextSmall>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCircle2 size={10} className="text-gray-400" />
                        <TextSmall className="text-gray-500 uppercase">{sucursal.contacto} — {sucursal.telefono}</TextSmall>
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
