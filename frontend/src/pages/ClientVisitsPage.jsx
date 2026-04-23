import { useMemo } from 'react';
import { CalendarDays, User, FileDown, Eye } from 'lucide-react';
import { supabase } from '../utils/supabase';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { Subtitle, TextSmall, TextTiny } from '../components/ui/Typography';
import StatusBadge from '../components/ui/StatusBadge';
import { useClienteData } from '../hooks/useClienteData';
import { useVisitasCliente } from '../hooks/useVisitasCliente';

/**
 * Vista de visitas/intervenciones para el usuario con rol CLIENTE.
 * Obtiene las visitas de las sucursales asociadas al contacto autenticado.
 */
const ClientVisitsPage = () => {
  const { sucursales, loading: loadingData } = useClienteData();
  const sucursalIds = useMemo(() => sucursales.map(s => s.id), [sucursales]);
  const { visitas, loading: loadingVisitas } = useVisitasCliente(sucursalIds);

  const loading = loadingData || loadingVisitas;

  /**
   * Genera URL firmada temporal para ver o descargar el PDF del informe.
   * @param {string} storagePath
   * @param {'view'|'download'} mode
   */
  const handleInforme = async (storagePath, mode = 'view') => {
    if (!storagePath) return;
    const { data } = await supabase.storage
      .from('inmotika')
      .createSignedUrl(storagePath, 3600);
    if (!data?.signedUrl) return;
    if (mode === 'download') {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = 'informe.pdf';
      a.click();
    } else {
      window.open(data.signedUrl, '_blank');
    }
  };

  /** Formatea fecha ISO a dd/mm/aaaa */
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <SectionHeader
        title="Control de Visitas"
        subtitle="Historial de intervenciones de mantenimiento"
      />

      {/* ── Desktop: tabla ── */}
      <Card className="hidden md:block p-0 overflow-hidden rounded-md border-none shadow-xl">
        <Table>
          <THead variant="light">
            <tr>
              <Th>Fecha Programada</Th>
              <Th>Sucursal</Th>
              <Th>Técnico(s)</Th>
              <Th>Tipo</Th>
              <Th>Estado</Th>
              <Th>Informe</Th>
            </tr>
          </THead>
          <TBody>
            {visitas.length > 0 ? (
              visitas.map((v) => (
                <Tr key={v.id}>
                  <Td>
                    <Subtitle className="text-gray-900 normal-case tracking-normal">
                      {fmt(v.fechaProgramada)}
                    </Subtitle>
                  </Td>
                  <Td>
                    <TextSmall className="text-gray-700 font-semibold">{v.sucursalNombre || '—'}</TextSmall>
                  </Td>
                  <Td>
                    <TextSmall className="text-gray-600">
                      {v.tecnicosNombres.length > 0 ? v.tecnicosNombres.join(', ') : '—'}
                    </TextSmall>
                  </Td>
                  <Td>
                    <TextSmall className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold inline-block">
                      {v.tipoVisitaLabel || '—'}
                    </TextSmall>
                  </Td>
                  <Td><StatusBadge status={v.estadoLabel || v.estadoCodigo} /></Td>
                  <Td>
                    {v.informeStoragePath ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInforme(v.informeStoragePath, 'view')}
                          className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                          title="Ver informe"
                        >
                          <Eye size={14} /> Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInforme(v.informeStoragePath, 'download')}
                          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                          title="Descargar PDF"
                        >
                          <FileDown size={14} /> PDF
                        </button>
                      </div>
                    ) : (
                      <TextTiny className="text-gray-300">—</TextTiny>
                    )}
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} className="text-center py-10">
                  <TextSmall className="text-gray-400 italic">No hay visitas registradas para sus sucursales</TextSmall>
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </Card>

      {/* ── Mobile: cards ── */}
      {visitas.length > 0 ? (
        <div className="flex flex-col gap-4 md:hidden">
          {visitas.map((v) => (
            <Card key={v.id} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
              <div className="divide-y divide-gray-50">
                <div className="flex items-start gap-3 py-2.5 first:pt-0">
                  <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-2xs font-bold inline-block">
                    {v.tipoVisitaLabel || '—'}
                  </span>
                </div>
                <div className="flex items-start gap-3 py-2.5">
                  <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
                  <div className="flex-1"><StatusBadge status={v.estadoLabel || v.estadoCodigo} /></div>
                </div>
                <div className="flex items-start gap-3 py-2.5">
                  <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Fecha</TextTiny>
                  <div className="flex items-center gap-1.5 flex-1">
                    <CalendarDays size={13} className="text-gray-300 shrink-0" />
                    <TextTiny className="text-gray-600 font-semibold">{fmt(v.fechaProgramada)}</TextTiny>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2.5">
                  <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Sucursal</TextTiny>
                  <TextTiny className="text-gray-700 font-semibold flex-1">{v.sucursalNombre || '—'}</TextTiny>
                </div>
                <div className="flex items-start gap-3 py-2.5">
                  <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Técnico</TextTiny>
                  <div className="flex items-center gap-1.5 flex-1">
                    <User size={13} className="text-gray-300 shrink-0" />
                    <TextTiny className="text-gray-600">
                      {v.tecnicosNombres.length > 0 ? v.tecnicosNombres.join(', ') : '—'}
                    </TextTiny>
                  </div>
                </div>
                {v.informeStoragePath && (
                  <div className="flex items-start gap-3 py-2.5 last:pb-0">
                    <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Informe</TextTiny>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleInforme(v.informeStoragePath, 'view')}
                        className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                      >
                        <Eye size={13} /> Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInforme(v.informeStoragePath, 'download')}
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <FileDown size={13} /> PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="md:hidden text-center py-10">
          <TextSmall className="text-gray-400 italic">No hay visitas registradas para sus sucursales</TextSmall>
        </div>
      )}
    </div>
  );
};

export default ClientVisitsPage;
