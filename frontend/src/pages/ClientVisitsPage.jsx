import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { Subtitle, TextSmall, TextTiny } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import { CalendarDays, User, Tag } from 'lucide-react';

const ClientVisitsPage = ({ data }) => {
  const currentClientName = "Residencial Horizonte";
  const myVisits = data.visitas.filter(v => v.cliente === currentClientName);

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <SectionHeader title="Control de Visitas" subtitle="Historial de intervenciones de mantenimiento" />

      {/* ── Desktop: tabla (oculta en mobile) ── */}
      <Card className="hidden md:block p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead variant="light">
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
                <Td><Subtitle className="text-gray-900 normal-case tracking-normal">{v.id}</Subtitle></Td>
                <Td><Subtitle className="text-gray-600 normal-case tracking-normal">{v.fecha}</Subtitle></Td>
                <Td><Subtitle className="text-gray-600 normal-case tracking-normal">{v.tecnico_asignado}</Subtitle></Td>
                <Td>
                  <TextSmall className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold inline-block">
                    {v.tipoMantenimiento}
                  </TextSmall>
                </Td>
                <Td><StatusBadge status={v.estado} /></Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* ── Mobile: cards (oculto en md+) ── */}
      <div className="flex flex-col gap-4 md:hidden">
        {myVisits.map((v, i) => (
          <Card key={i} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
            <div className="divide-y divide-gray-50">
              <div className="flex items-start gap-3 py-2.5 first:pt-0">
                <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold inline-block">{v.tipoMantenimiento}</span>
              </div>
              <div className="flex items-start gap-3 py-2.5">
                <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
                <div className="flex-1"><StatusBadge status={v.estado} /></div>
              </div>
              <div className="flex items-start gap-3 py-2.5">
                <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Fecha</TextTiny>
                <div className="flex items-center gap-1.5 flex-1">
                  <CalendarDays size={13} className="text-gray-300 shrink-0" />
                  <TextTiny className="text-gray-600 font-semibold">{v.fecha}</TextTiny>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2.5 last:pb-0">
                <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Técnico</TextTiny>
                <div className="flex items-center gap-1.5 flex-1">
                  <User size={13} className="text-gray-300 shrink-0" />
                  <TextTiny className="text-gray-600">{v.tecnico_asignado}</TextTiny>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientVisitsPage;
