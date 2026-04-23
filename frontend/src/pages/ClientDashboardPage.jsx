import { useMemo } from 'react';
import { BarChart3, Calendar, CheckCircle, Clock, FileText, AlertTriangle, Activity, User } from 'lucide-react';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { Subtitle, TextSmall, TextTiny } from '../components/ui/Typography';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import CardHeader from '../components/ui/CardHeader';
import { useClienteData } from '../hooks/useClienteData';
import { useVisitasCliente } from '../hooks/useVisitasCliente';
import { SkeletonKpiCard, SkeletonLine } from '../components/ui/SkeletonLoader';

const ClientDashboardPage = () => {
  const { cliente, sucursales, dispositivos, loading: loadingData } = useClienteData();
  const sucursalIds = useMemo(() => sucursales.map(s => s.id), [sucursales]);
  const { visitas, loading: loadingVisitas } = useVisitasCliente(sucursalIds);

  const loading = loadingData || loadingVisitas;

  const kpis = useMemo(() => ({
    total:       visitas.length,
    pendientes:  visitas.filter(v => v.estadoCodigo === 'PROGRAMADA').length,
    finalizadas: visitas.filter(v => v.estadoCodigo === 'COMPLETADA').length,
    enProgreso:  visitas.filter(v => v.estadoCodigo === 'EN_PROGRESO').length,
  }), [visitas]);

  /** Formatea fecha ISO a dd/mm/aaaa. */
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLine width="w-64" height="h-7" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonKpiCard key={i} />)}
        </div>
        <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title={cliente?.razon_social ? `Operación — ${cliente.razon_social}` : 'Informe General de Operación'}
        subtitle={`${sucursales.length} sucursal${sucursales.length !== 1 ? 'es' : ''} · ${dispositivos.length} dispositivo${dispositivos.length !== 1 ? 's' : ''}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Visitas"  value={kpis.total}       icon={Calendar}      color="blue"   />
        <StatCard label="Programadas"    value={kpis.pendientes}  icon={Clock}         color="yellow" />
        <StatCard label="Finalizadas"    value={kpis.finalizadas} icon={CheckCircle}   color="green"  />
        <StatCard label="En Progreso"    value={kpis.enProgreso}  icon={Activity}      color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Historial de visitas */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 pb-0">
              <CardHeader icon={FileText} title="Historial de Visitas" className="mb-4 border-none pb-0" />
            </div>

            {visitas.length === 0 ? (
              <div className="px-6 pb-6 pt-4">
                <TextSmall className="text-gray-400 text-center py-6">No hay visitas registradas aún.</TextSmall>
              </div>
            ) : (
              <>
                {/* Desktop: tabla */}
                <div className="hidden md:block">
                  <Table>
                    <THead variant="light">
                      <tr>
                        <Th>Tipo</Th>
                        <Th>Sucursal</Th>
                        <Th>Fecha</Th>
                        <Th>Técnico(s)</Th>
                        <Th>Estado</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {visitas.map((v) => (
                        <Tr key={v.id}>
                          <Td><TextSmall className="text-gray-900">{v.tipoVisitaLabel || '—'}</TextSmall></Td>
                          <Td><TextSmall className="text-gray-500">{v.sucursalNombre || '—'}</TextSmall></Td>
                          <Td><TextSmall className="text-gray-500">{fmt(v.fechaProgramada || v.fechaFin)}</TextSmall></Td>
                          <Td><TextSmall className="text-gray-500">{v.tecnicosNombres?.join(', ') || '—'}</TextSmall></Td>
                          <Td><StatusBadge status={v.estadoCodigo} /></Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>

                {/* Mobile: cards */}
                <div className="flex flex-col gap-4 md:hidden px-4 pb-4">
                  {visitas.map((v) => (
                    <Card key={v.id} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
                      <div className="divide-y divide-gray-50">
                        <div className="flex items-start gap-3 py-2.5 first:pt-0">
                          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
                          <TextSmall className="font-semibold text-gray-900 flex-1">{v.tipoVisitaLabel || '—'}</TextSmall>
                        </div>
                        <div className="flex items-start gap-3 py-2.5">
                          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
                          <div className="flex-1"><StatusBadge status={v.estadoCodigo} /></div>
                        </div>
                        <div className="flex items-start gap-3 py-2.5">
                          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Fecha</TextTiny>
                          <div className="flex items-center gap-1.5 flex-1">
                            <Calendar size={13} className="text-gray-300 shrink-0" />
                            <TextTiny className="text-gray-600">{fmt(v.fechaProgramada || v.fechaFin)}</TextTiny>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-2.5 last:pb-0">
                          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Técnico</TextTiny>
                          <div className="flex items-center gap-1.5 flex-1">
                            <User size={13} className="text-gray-300 shrink-0" />
                            <TextTiny className="text-gray-600">{v.tecnicosNombres?.join(', ') || '—'}</TextTiny>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Actividad reciente */}
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader icon={Activity} title="Actividad Reciente" className="mb-3" />
            {visitas.length === 0 ? (
              <TextSmall className="text-gray-400 text-center py-4">Sin actividad reciente.</TextSmall>
            ) : (
              visitas.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 mb-2 last:mb-0">
                  <div className="min-w-0 flex-1 mr-3">
                    <TextSmall className="text-gray-900 mb-0.5 truncate">{v.tipoVisitaLabel || '—'}</TextSmall>
                    <TextSmall className="text-gray-400">{fmt(v.fechaProgramada || v.fechaFin)}</TextSmall>
                  </div>
                  <StatusBadge status={v.estadoCodigo} />
                </div>
              ))
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ClientDashboardPage;
