import { useMemo, useState } from 'react';
import { CalendarDays, User, FileDown, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import GenericListView from '../components/shared/GenericListView';
import FilterBar from '../components/shared/FilterBar';
import { Subtitle, TextSmall, TextTiny } from '../components/ui/Typography';
import CodigoRef, { toCodigoRef } from '../components/ui/CodigoRef';
import StatusBadge from '../components/ui/StatusBadge';
import { useClienteData } from '../hooks/useClienteData';
import { useVisitasCliente } from '../hooks/useVisitasCliente';
import { useNotify } from '../context/NotificationContext';
import { openInformePdf } from '../utils/informeDownload';
import { matchesDateRange } from '../utils/dateFilter';

const EMPTY_FILTERS = {
  sucursal: [],
  estado: [],
  tipo: [],
  tecnico: [],
  fechaDesde: '',
  fechaHasta: '',
};

/**
 * Vista de visitas/intervenciones para el usuario con rol CLIENTE.
 * Obtiene las visitas de las sucursales asociadas al contacto autenticado.
 */
const ClientVisitsPage = () => {
  const { sucursales, loading: loadingData } = useClienteData({ mode: 'corporate' });
  const sucursalIds = useMemo(() => sucursales.map(s => s.id), [sucursales]);
  const { visitas, loading: loadingVisitas } = useVisitasCliente(sucursalIds);
  const notify = useNotify();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const loading = loadingData || loadingVisitas;

  /**
   * Abre/descarga el PDF vía token (download-informe). Storage de informes es privado.
   * @param {string} visitaId
   * @param {'view'|'download'} mode
   */
  const handleInforme = async (visitaId, mode = 'view') => {
    if (!visitaId) return;
    try {
      await openInformePdf(visitaId, mode);
    } catch (err) {
      console.error('[ClientVisitsPage] informe:', err);
      notify('error', err?.message || 'No se pudo abrir el informe');
    }
  };

  /** Formatea fecha ISO a dd/mm/aaaa */
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const sucursalOptions = useMemo(() => {
    const seen = new Set();
    return visitas
      .map(v => ({ value: v.sucursalId || '', label: v.sucursalNombre || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visitas]);

  const estadoOptions = useMemo(() => {
    const seen = new Set();
    return visitas
      .map(v => ({
        value: v.estadoCodigo || '',
        label: v.estadoLabel || v.estadoCodigo || '',
      }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visitas]);

  const tipoOptions = useMemo(() => {
    const seen = new Set();
    return visitas
      .map(v => ({ value: v.tipoVisitaLabel || '', label: v.tipoVisitaLabel || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visitas]);

  const tecnicoOptions = useMemo(() => {
    const seen = new Set();
    return visitas
      .flatMap(v => (v.tecnicos || []).map(t => ({
        value: t.tecnicoId || `${t.nombres} ${t.apellidos}`.trim(),
        label: `${t.nombres} ${t.apellidos}`.trim(),
      })))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visitas]);

  const filterDefs = [
    { key: 'sucursal', label: 'Sucursal', options: sucursalOptions, multi: true },
    { key: 'estado', label: 'Estado', options: estadoOptions, multi: true },
    { key: 'tipo', label: 'Tipo', options: tipoOptions, multi: true },
    { key: 'tecnico', label: 'Técnico', options: tecnicoOptions, multi: true },
    { key: 'fechaDesde', label: 'Fecha desde', type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta', type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  const filtered = useMemo(() => {
    let list = visitas;
    if (filters.sucursal.length > 0) {
      list = list.filter(v => filters.sucursal.includes(v.sucursalId || ''));
    }
    if (filters.estado.length > 0) {
      list = list.filter(v => filters.estado.includes(v.estadoCodigo || ''));
    }
    if (filters.tipo.length > 0) {
      list = list.filter(v => filters.tipo.includes(v.tipoVisitaLabel || ''));
    }
    if (filters.tecnico.length > 0) {
      list = list.filter(v =>
        (v.tecnicos || []).some(t =>
          filters.tecnico.includes(t.tecnicoId || `${t.nombres} ${t.apellidos}`.trim())
        )
      );
    }
    if (filters.fechaDesde || filters.fechaHasta) {
      list = list.filter(v => matchesDateRange(v.fechaProgramada, filters.fechaDesde, filters.fechaHasta));
    }
    return list;
  }, [visitas, filters]);

  const activeFiltersCount =
    filters.sucursal.length +
    filters.estado.length +
    filters.tipo.length +
    filters.tecnico.length +
    (filters.fechaDesde ? 1 : 0) +
    (filters.fechaHasta ? 1 : 0);

  const columns = [
    {
      header: 'Código',
      narrow: true,
      render: (v) => <CodigoRef id={v.id} />,
    },
    {
      header: 'Fecha Programada',
      render: (v) => (
        <Subtitle className="text-gray-900 normal-case tracking-normal">
          {fmt(v.fechaProgramada)}
        </Subtitle>
      ),
    },
    {
      header: 'Sucursal',
      render: (v) => (
        <TextSmall className="text-gray-700 font-semibold">{v.sucursalNombre || '—'}</TextSmall>
      ),
    },
    {
      header: 'Técnico(s)',
      render: (v) => (
        <TextSmall className="text-gray-600">
          {v.tecnicosNombres.length > 0 ? v.tecnicosNombres.join(', ') : '—'}
        </TextSmall>
      ),
    },
    {
      header: 'Tipo',
      render: (v) => (
        <TextSmall className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold inline-block">
          {v.tipoVisitaLabel || '—'}
        </TextSmall>
      ),
    },
    {
      header: 'Estado',
      render: (v) => <StatusBadge status={v.estadoLabel || v.estadoCodigo} />,
    },
    {
      header: 'Informe',
      narrow: true,
      render: (v) => (
        v.informeStoragePath ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleInforme(v.id, 'view')}
              className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
              title="Ver informe"
            >
              <Eye size={14} /> Ver
            </button>
            <button
              type="button"
              onClick={() => handleInforme(v.id, 'download')}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
              title="Descargar PDF"
            >
              <FileDown size={14} /> PDF
            </button>
          </div>
        ) : (
          <TextTiny className="text-gray-300">—</TextTiny>
        )
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in slide-in-from-right-12 duration-500">
      <GenericListView
        title="Control de Visitas"
        icon={CalendarDays}
        items={filtered}
        columns={columns}
        loading={loading}
        loadingText="Cargando visitas…"
        emptyText={
          activeFiltersCount > 0
            ? 'Ninguna visita coincide con los filtros'
            : 'No hay visitas registradas para sus sucursales'
        }
        emptyIcon={CalendarDays}
        searchPlaceholder="Buscar por código, sucursal o técnico…"
        filterFunction={(v, q) =>
          toCodigoRef(v.id).includes(q) ||
          v.sucursalNombre?.toLowerCase().includes(q) ||
          v.tipoVisitaLabel?.toLowerCase().includes(q) ||
          v.estadoLabel?.toLowerCase().includes(q) ||
          v.estadoCodigo?.toLowerCase().includes(q) ||
          (v.tecnicosNombres || []).some(n => n.toLowerCase().includes(q))
        }
        activeFiltersCount={activeFiltersCount}
        filteredCount={filtered.length}
        totalItems={visitas.length}
        onClearFilters={() => setFilters(EMPTY_FILTERS)}
        extraFilters={<FilterBar filters={filterDefs} values={filters} onChange={setFilters} />}
        renderMobileCard={(v) => (
          <Card className="p-5 border border-gray-200 shadow-sm rounded-2xl">
            <div className="divide-y divide-gray-50">
              <div className="flex items-start gap-3 py-2.5 first:pt-0">
                <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Código</TextTiny>
                <div className="flex-1 min-w-0"><CodigoRef id={v.id} /></div>
              </div>
              <div className="flex items-start gap-3 py-2.5">
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
                      onClick={() => handleInforme(v.id, 'view')}
                      className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                    >
                      <Eye size={13} /> Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInforme(v.id, 'download')}
                      className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <FileDown size={13} /> PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      />
    </div>
  );
};

export default ClientVisitsPage;
