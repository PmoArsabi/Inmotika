import { BarChart3, Calendar, CheckCircle, Clock, FileText, AlertTriangle, Activity } from 'lucide-react';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { Subtitle, TextSmall } from '../components/ui/Typography';
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
            <Table>
              <THead>
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
