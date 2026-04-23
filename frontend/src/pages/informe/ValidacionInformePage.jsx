import { useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardCheck, Building2, Calendar, Tag, Eye, Edit2 } from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import ActionResultModal from '../../components/ui/ActionResultModal';
import { TextSmall, TextTiny } from '../../components/ui/Typography';
import { getInformesEnRevision } from '../../api/informeApi';
import InformeRevisionPage from './InformeRevisionPage';


// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Badges ──────────────────────────────────────────────────────────────────

const EstadoBadge = ({ estado }) => {
  const cfg = {
    EN_REVISION:    { label: 'En revisión',           cls: 'bg-yellow-100 text-yellow-800' },
    RECHAZADO:      { label: 'Rechazado por director', cls: 'bg-red-100 text-red-800'      },
    EN_APROBACION:  { label: 'En aprobación',          cls: 'bg-blue-100 text-blue-800'    },
    APROBADO:       { label: 'Aprobado',               cls: 'bg-green-100 text-green-800'  },
  }[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ValidacionInformePage = () => {
  const [informes, setInformes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null); // informe abierto en InformeRevisionPage
  const [resultModal, setResultModal] = useState(null);
  const [filters, setFilters]         = useState({ estado: [], cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' });

  const loadInformes = useCallback(async () => {
    setLoading(true);
    try { setInformes(await getInformesEnRevision()); }
    catch (err) { console.error('[ValidacionInformePage]', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInformes(); }, [loadInformes]);

  const filterDefs = useMemo(() => {
    const clientes   = [...new Map(informes.map(i => [i.cliente_nombre, i.cliente_nombre])).entries()].map(([v]) => ({ value: v, label: v }));
    const sucursales = [...new Map(informes.map(i => [i.sucursal_nombre, i.cliente_nombre])).entries()].map(([v, p]) => ({ value: v, label: v, parentValue: p }));
    return [
      { key: 'estado', label: 'Estado', multi: true, options: [
        { value: 'EN_REVISION',   label: 'En revisión'           },
        { value: 'RECHAZADO',     label: 'Rechazado por director' },
        { value: 'EN_APROBACION', label: 'En aprobación'          },
        { value: 'APROBADO',      label: 'Aprobado'               },
      ]},
      { key: 'cliente',    label: 'Cliente',       multi: true, options: clientes },
      { key: 'sucursal',   label: 'Sucursal',      multi: true, options: sucursales, dependsOn: 'cliente', dependsOnLabel: 'Cliente' },
      { key: 'fechaDesde', label: 'Fecha desde',   type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
      { key: 'fechaHasta', label: 'Fecha hasta',   type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
    ];
  }, [informes]);

  const informesFiltrados = useMemo(() => informes.filter(inf => {
    if (filters.estado?.length   && !filters.estado.includes(inf.estado))             return false;
    if (filters.cliente?.length  && !filters.cliente.includes(inf.cliente_nombre))    return false;
    if (filters.sucursal?.length && !filters.sucursal.includes(inf.sucursal_nombre))  return false;
    if (filters.fechaDesde && inf.fecha_fin && inf.fecha_fin < filters.fechaDesde)    return false;
    if (filters.fechaHasta && inf.fecha_fin && inf.fecha_fin > filters.fechaHasta + 'T23:59:59') return false;
    return true;
  }), [informes, filters]);

  const activeFiltersCount = (filters.estado?.length || 0) + (filters.cliente?.length || 0)
    + (filters.sucursal?.length || 0) + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0);

  const columns = useMemo(() => [
    {
      header: 'Cliente / Sucursal',
      render: inf => (
        <div>
          <TextSmall className="font-bold text-gray-900">{inf.cliente_nombre}</TextSmall>
          <TextTiny className="text-gray-400 flex items-center gap-1 mt-0.5">
            <Building2 size={10} /> {inf.sucursal_nombre}{inf.sucursal_ciudad ? ` · ${inf.sucursal_ciudad}` : ''}
          </TextTiny>
        </div>
      ),
    },
    {
      header: 'Tipo',
      render: inf => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-2xs font-bold">
          <Tag size={10} /> {inf.tipo_visita}
        </span>
      ),
    },
    {
      header: 'Fecha cierre',
      render: inf => (
        <TextSmall className="flex items-center gap-1.5 text-gray-600">
          <Calendar size={12} className="text-gray-400" /> {fmt(inf.fecha_fin)}
        </TextSmall>
      ),
    },
    { header: 'Estado',   render: inf => <EstadoBadge estado={inf.estado} /> },
    {
      header: 'Progreso',
      render: inf => {
        const pct = inf.total_intervenciones > 0 ? Math.round((inf.revisadas / inf.total_intervenciones) * 100) : 0;
        return (
          <div className="flex items-center gap-2 min-w-24">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
            </div>
            <TextTiny className="text-gray-500 shrink-0">{inf.revisadas}/{inf.total_intervenciones}</TextTiny>
          </div>
        );
      },
    },
    {
      header: 'Obs. director',
      render: inf => inf.observacion_director
        ? <TextTiny className="text-red-600 max-w-48 truncate">{inf.observacion_director}</TextTiny>
        : <TextTiny className="text-gray-300">—</TextTiny>,
    },
  ], []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (selected) {
    return (
      <InformeRevisionPage
        informe={selected}
        onBack={() => {
          setSelected(null);
          loadInformes(); // refresca la lista al volver
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-in slide-in-from-right-12 duration-500">
      <GenericListView
        title="Validación de Informes"
        icon={ClipboardCheck}
        items={informesFiltrados}
        columns={columns}
        loading={loading}
        loadingText="Cargando informes…"
        emptyText="No hay informes registrados"
        emptyIcon={ClipboardCheck}
        searchPlaceholder="Buscar por cliente o sucursal…"
        filterFunction={(inf, q) =>
          inf.cliente_nombre.toLowerCase().includes(q) ||
          inf.sucursal_nombre.toLowerCase().includes(q)
        }
        rowActions={inf => (
          ['EN_REVISION', 'RECHAZADO'].includes(inf.estado) ? (
            <button onClick={() => setSelected(inf)} className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors" title="Editar">
              <Edit2 size={16} />
            </button>
          ) : (
            <button onClick={() => setSelected(inf)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors" title="Ver">
              <Eye size={16} />
            </button>
          )
        )}
        activeFiltersCount={activeFiltersCount}
        filteredCount={informesFiltrados.length}
        totalItems={informes.length}
        onClearFilters={() => setFilters({ estado: [], cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' })}
        extraFilters={<FilterBar filters={filterDefs} values={filters} onChange={setFilters} />}
      />
      <ActionResultModal
        open={!!resultModal}
        error={resultModal?.error || false}
        title={resultModal?.title || ''}
        subtitle={resultModal?.subtitle || ''}
        errorMessage={resultModal?.errorMessage}
        actions={[{ label: 'Cerrar', onClick: () => setResultModal(null) }]}
        onBackdropClick={() => setResultModal(null)}
      />
    </div>
  );
};

export default ValidacionInformePage;
