import { BarChart3, Calendar, CheckCircle, Clock, FileText, AlertTriangle, Activity, User } from 'lucide-react';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { Subtitle, TextSmall, TextTiny } from '../components/ui/Typography';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import CardHeader from '../components/ui/CardHeader';

const ClientDashboardPage = () => {
  const myVisits = [
    { id: 1, tipoMantenimiento: 'Preventivo - Cámaras', fecha: '2023-10-15', estado: 'Finalizada', tecnico: 'Juan Pérez' },
    { id: 2, tipoMantenimiento: 'Correctivo - Sensor Hall', fecha: '2023-10-20', estado: 'Pendiente', tecnico: 'Carlos Ruiz' },
    { id: 3, tipoMantenimiento: 'Preventivo - General', fecha: '2023-11-01', estado: 'Programada', tecnico: 'Ana Gómez' },
    { id: 4, tipoMantenimiento: 'Instalación - Nuevos Puntos', fecha: '2023-11-05', estado: 'Pendiente', tecnico: 'Juan Pérez' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader 
        title="Informe General de Operación" 
        subtitle="Resumen ejecutivo del estado del contrato" 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Visitas" value={12} icon={Calendar} color="blue" />
        <StatCard label="Pendientes" value={3} icon={Clock} color="yellow" />
        <StatCard label="Finalizadas" value={8} icon={CheckCircle} color="green" />
        <StatCard label="Incidencias" value={1} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 pb-0">
               <CardHeader icon={FileText} title="Historial de Visitas" className="mb-4 border-none pb-0" />
            </div>

            {/* Desktop: tabla */}
            <div className="hidden md:block">
              <Table>
                <THead variant="light">
                  <tr>
                    <Th>Tipo</Th>
                    <Th>Fecha</Th>
                    <Th>Técnico</Th>
                    <Th>Estado</Th>
                  </tr>
                </THead>
                <TBody>
                  {myVisits.map((v) => (
                    <Tr key={v.id}>
                      <Td><TextSmall className="text-gray-900">{v.tipoMantenimiento}</TextSmall></Td>
                      <Td><TextSmall className="text-gray-500">{v.fecha}</TextSmall></Td>
                      <Td><TextSmall className="text-gray-500">{v.tecnico}</TextSmall></Td>
                      <Td><StatusBadge status={v.estado} /></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>

            {/* Mobile: cards */}
            <div className="flex flex-col gap-4 md:hidden px-4 pb-4">
              {myVisits.map((v) => (
                <Card key={v.id} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
                  <div className="divide-y divide-gray-50">
                    <div className="flex items-start gap-3 py-2.5 first:pt-0">
                      <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
                      <TextSmall className="font-semibold text-gray-900 flex-1">{v.tipoMantenimiento}</TextSmall>
                    </div>
                    <div className="flex items-start gap-3 py-2.5">
                      <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
                      <div className="flex-1"><StatusBadge status={v.estado} /></div>
                    </div>
                    <div className="flex items-start gap-3 py-2.5">
                      <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Fecha</TextTiny>
                      <div className="flex items-center gap-1.5 flex-1">
                        <Calendar size={13} className="text-gray-300 shrink-0" />
                        <TextTiny className="text-gray-600">{v.fecha}</TextTiny>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-2.5 last:pb-0">
                      <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Técnico</TextTiny>
                      <div className="flex items-center gap-1.5 flex-1">
                        <User size={13} className="text-gray-300 shrink-0" />
                        <TextTiny className="text-gray-600">{v.tecnico}</TextTiny>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader icon={Activity} title="Actividad Reciente" className="mb-3" />
            {myVisits.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 mb-2 last:mb-0">
                <div>
                  <TextSmall className="text-gray-900 mb-0.5">{v.tipoMantenimiento}</TextSmall>
                  <TextSmall className="text-gray-400">{v.fecha}</TextSmall>
                </div>
                <StatusBadge status={v.estado} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
