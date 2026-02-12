import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { Subtitle, TextSmall } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';

const ClientVisitsPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myVisits = data.visitas.filter(v => v.cliente === currentClientName);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <SectionHeader title="Control de Visitas" subtitle="Historial de intervenciones de mantenimiento" />
      
      <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead>
            <tr>
              <Th>ID</Th>
              <Th>Fecha</Th>
              <Th>Técnico</Th>
              <Th>Tipo</Th>
              <Th>Estado</Th>
            </tr>
          </THead>
          <TBody>
            {myVisits.map((v, i) => (
              <Tr key={i}>
                <Td><Subtitle className="text-gray-900">{v.id}</Subtitle></Td>
                <Td><Subtitle className="text-gray-600">{v.fecha}</Subtitle></Td>
                <Td><Subtitle className="text-gray-600">{v.tecnico_asignado}</Subtitle></Td>
                <Td>
                  <TextSmall className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold uppercase inline-block">
                    {v.tipoMantenimiento}
                  </TextSmall>
                </Td>
                <Td>
                  <StatusBadge status={v.estado} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default ClientVisitsPage;
