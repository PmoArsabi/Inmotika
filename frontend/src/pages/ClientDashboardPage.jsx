import { useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, FileText, Activity, User, Filter, Search, X } from 'lucide-react';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/shared/FilterBar';
import { TextSmall, TextTiny } from '../components/ui/Typography';
import CodigoRef, { toCodigoRef } from '../components/ui/CodigoRef';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import CardHeader from '../components/ui/CardHeader';
import { useClienteData } from '../hooks/useClienteData';
import { useVisitasCliente } from '../hooks/useVisitasCliente';
import { SkeletonKpiCard, SkeletonLine } from '../components/ui/SkeletonLoader';
import { matchesDateRange } from '../utils/dateFilter';

const EMPTY_FILTERS = {
  sucursal: [],
  estado: [],
  tipo: [],
  tecnico: [],
  fechaDesde: '',
  fechaHasta: '',
};

const ClientDashboardPage = () => {
  const {
    cliente,
    sucursales,
    dispositivosCount,
    loading: loadingData,
  } = useClienteData({ mode: 'dashboard' });
  const sucursalIds = useMemo(() => sucursales.map(s => s.id), [sucursales]);
  const { visitas, loading: loadingVisitas } = useVisitasCliente(sucursalIds);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loading = loadingData || loadingVisitas;

  const kpis = useMemo(() => ({
    total: visitas.length,
    pendientes: visitas.filter(v => v.estadoCodigo === 'PROGRAMADA').length,
    finalizadas: visitas.filter(v => v.estadoCodigo === 'COMPLETADA').length,
    enProgreso: visitas.filter(v => v.estadoCodigo === 'EN_PROGRESO').length,
  }), [visitas]);

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

  const filteredVisitas = useMemo(() => {
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
      list = list.filter(v =>
        matchesDateRange(v.fechaProgramada || v.fechaFin, filters.fechaDesde, filters.fechaHasta)
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(v =>
        toCodigoRef(v.id).includes(q) ||
        v.sucursalNombre?.toLowerCase().includes(q) ||
        v.tipoVisitaLabel?.toLowerCase().includes(q) ||
        v.estadoLabel?.toLowerCase().includes(q) ||
        v.estadoCodigo?.toLowerCase().includes(q) ||
        (v.tecnicosNombres || []).some(n => n.toLowerCase().includes(q))
      );
    }
    return list;
  }, [visitas, filters, searchQuery]);

  const activeFiltersCount =
    filters.sucursal.length +
    filters.estado.length +
    filters.tipo.length +
    filters.tecnico.length +
    (filters.fechaDesde ? 1 : 0) +
    (filters.fechaHasta ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

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
        subtitle={`${sucursales.length} sucursal${sucursales.length !== 1 ? 'es' : ''} · ${dispositivosCount} dispositivo${dispositivosCount !== 1 ? 's' : ''}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Visitas" value={kpis.total} icon={Calendar} color="blue" />
        <StatCard label="Programadas" value={kpis.pendientes} icon={Clock} color="yellow" />
        <StatCard label="Finalizadas" value={kpis.finalizadas} icon={CheckCircle} color="green" />
        <StatCard label="En Progreso" value={kpis.enProgreso} icon={Activity} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Historial de visitas */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between gap-3 mb-4">
                <CardHeader icon={FileText} title="Historial de Visitas" className="mb-0 border-none pb-0" />
                <button
                  type="button"
                  onClick={() => setShowFilters(f => !f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-brand/5 border-brand/30 text-brand'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Filter size={14} />
                  Filtro
                  {activeFiltersCount > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-brand text-white text-2xs">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="mb-4 space-y-3 pb-4 border-b border-gray-100">
                  <FilterBar
                    filters={filterDefs}
                    values={filters}
                    onChange={setFilters}
                    leadingSlot={(
                      <div className="flex flex-col gap-0.5">
                        <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
                          Buscar
                        </span>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Código, sucursal, técnico…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-700 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    )}
                  />
                  {activeFiltersCount > 0 && (
                    <div className="flex items-center justify-between">
                      <TextTiny className="text-gray-400">
                        {filteredVisitas.length} de {visitas.length} visitas
                      </TextTiny>
                      <button
                        type="button"
                        onClick={() => { setFilters(EMPTY_FILTERS); setSearchQuery(''); }}
                        className="flex items-center gap-1 text-xs text-brand underline underline-offset-2 hover:text-brand-dark"
                      >
                        <X size={12} /> Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {filteredVisitas.length === 0 ? (
              <div className="px-6 pb-6 pt-4">
                <TextSmall className="text-gray-400 text-center py-6">
                  {visitas.length === 0
                    ? 'No hay visitas registradas aún.'
                    : 'Ninguna visita coincide con los filtros.'}
                </TextSmall>
              </div>
            ) : (
              <>
                {/* Desktop: tabla */}
                <div className="hidden md:block">
                  <Table>
                    <THead variant="light">
                      <tr>
                        <Th>Código</Th>
                        <Th>Tipo</Th>
                        <Th>Sucursal</Th>
                        <Th>Fecha</Th>
                        <Th>Técnico(s)</Th>
                        <Th>Estado</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {filteredVisitas.map((v) => (
                        <Tr key={v.id}>
                          <Td><CodigoRef id={v.id} /></Td>
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
                  {filteredVisitas.map((v) => (
                    <Card key={v.id} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
                      <div className="divide-y divide-gray-50">
                        <div className="flex items-start gap-3 py-2.5 first:pt-0">
                          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Código</TextTiny>
                          <div className="flex-1 min-w-0"><CodigoRef id={v.id} /></div>
                        </div>
                        <div className="flex items-start gap-3 py-2.5">
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
