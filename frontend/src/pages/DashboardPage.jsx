import { useState, useMemo } from 'react';
import {
  ClipboardList, CheckCircle2, Users, CalendarDays, UserCheck,
  Building2, Filter, Activity, TrendingUp,
} from 'lucide-react';
import Card from '../components/ui/Card';
import FilterBar from '../components/shared/FilterBar';
import { ROLES, isAdminRole } from '../utils/constants';
import { H3, H2, Subtitle, TextSmall, Metric, Label, TextTiny } from '../components/ui/Typography';
import {
  useDashboardKpis,
  filterVisitasDashboard,
  summarizeVisitas,
  calcTendenciaCompletadas,
} from '../hooks/useDashboardKpis';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <Card className="p-4 sm:p-6 lg:p-8">
    <div className="flex justify-between items-start gap-2">
      <div className="flex flex-col gap-1.5 sm:gap-3 min-w-0">
        <Label className="block text-2xs sm:text-xs leading-tight">{label}</Label>
        <Metric className="block text-2xl sm:text-3xl text-gray-900">{value}</Metric>
        <TextSmall className="text-2xs sm:text-2xs uppercase text-gray-400 leading-tight">{sub}</TextSmall>
      </div>
      <div className="p-2.5 sm:p-4 bg-gray-50 rounded-2xl sm:rounded-4xl shadow-inner shrink-0">
        <Icon className={color} size={20} strokeWidth={1.8} />
      </div>
    </div>
  </Card>
);

const CoordRow = ({ coord }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-3 border-b border-gray-50 last:border-0">
    <div className="min-w-0">
      <TextSmall className="font-semibold text-gray-900 truncate">{coord.nombre}</TextSmall>
      <TextTiny className="text-gray-400">{coord.visitasTotal} visitas asignadas</TextTiny>
    </div>
    <div className="grid grid-cols-3 sm:flex sm:items-center sm:gap-6 gap-2">
      <div className="text-center">
        <TextTiny className="text-gray-400 uppercase tracking-wide">Completadas</TextTiny>
        <TextSmall className="font-bold text-green-600">{coord.visitasCompletadas}</TextSmall>
      </div>
      <div className="text-center">
        <TextTiny className="text-gray-400 uppercase tracking-wide">Pendientes</TextTiny>
        <TextSmall className="font-bold text-yellow-500">{coord.visitasPendientes}</TextSmall>
      </div>
      <div className="text-center sm:min-w-14">
        <TextTiny className="text-gray-400 uppercase tracking-wide">Efectividad</TextTiny>
        <TextSmall className={`font-bold ${coord.efectividad >= 80 ? 'text-green-600' : coord.efectividad >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
          {coord.efectividad}%
        </TextSmall>
      </div>
    </div>
  </div>
);

const DashboardPage = ({ data }) => {
  const { user } = useAuth();
  const kpis = useDashboardKpis();
  const [filters, setFilters] = useState({
    fechaDesde: '', fechaHasta: '', estado: [], cliente: [], ciudad: [], tecnico: [], coordinador: [],
  });

  const role = user?.role;
  const isDirector = role === ROLES.DIRECTOR || isAdminRole(role);
  const isCoordinador = role === ROLES.COORDINADOR;

  const coordinadorUsuarioById = useMemo(() => {
    const map = {};
    (kpis.coordinadores || []).forEach(c => {
      // coordinadores del KPI no traen usuario_id; se resuelve abajo si hace falta
      if (c.usuario_id) map[c.id] = c.usuario_id;
    });
    return map;
  }, [kpis.coordinadores]);

  // Un solo cálculo: KPIs y gráfica usan exactamente el mismo set filtrado
  const { visitaStatsData, tendenciaHeights, tendenciaCounts, chartYear } = useMemo(() => {
    const filtradas = filterVisitasDashboard(kpis.visitasRaw || [], filters, { coordinadorUsuarioById });
    const year = filters.fechaDesde
      ? Number(filters.fechaDesde.slice(0, 4))
      : new Date().getFullYear();
    const { heights, counts } = calcTendenciaCompletadas(filtradas, year);
    return {
      visitaStatsData: summarizeVisitas(filtradas),
      tendenciaHeights: heights,
      tendenciaCounts: counts,
      chartYear: year,
    };
  }, [kpis.visitasRaw, filters, coordinadorUsuarioById]);

  const filterDefs = useMemo(() => {
    const fromVisitas = kpis.visitasRaw || [];
    const clientesOpts = [...new Set(fromVisitas.map(v => v.cliente?.razon_social).filter(Boolean))]
      .sort()
      .map(n => ({ value: n, label: n }));
    const ciudadesOpts = [...new Set(fromVisitas.map(v => v.sucursal?.ciudad).filter(Boolean))]
      .sort()
      .map(c => ({ value: c, label: c }));

    // Preferir líderes (es_lider); value = tecnico.id para filtrar de forma fiable
    const tecnicosMap = new Map();
    fromVisitas.forEach(v => {
      (v.visita_tecnico || []).forEach(vt => {
        const tid = vt.tecnico?.id || vt.tecnico_id;
        if (!tid) return;
        const p = vt.tecnico?.perfil;
        const label = p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : '';
        if (!label) return;
        const prev = tecnicosMap.get(tid);
        if (!prev || (vt.es_lider && !prev.isLider)) {
          tecnicosMap.set(tid, { value: String(tid), label, isLider: !!vt.es_lider });
        }
      });
    });
    const tecnicosOpts = [...tecnicosMap.values()]
      .sort((a, b) => a.label.localeCompare(b.label));

    return [
      {
        key: 'estado',
        label: 'Estado Operativo',
        multi: true,
        options: [
          { value: 'PROGRAMADA',  label: 'Programada' },
          { value: 'EN_PROGRESO', label: 'En Ejecución' },
          { value: 'COMPLETADA',  label: 'Finalizada' },
          { value: 'CANCELADA',   label: 'Cancelada' },
        ],
      },
      {
        key: 'cliente',
        label: 'Cliente',
        multi: true,
        options: clientesOpts.length
          ? clientesOpts
          : (data.clientes || []).map(c => ({ value: c.nombre || c.razonSocial || c.razon_social, label: c.nombre || c.razonSocial || c.razon_social })),
      },
      {
        key: 'ciudad',
        label: 'Ciudad / Zona',
        multi: true,
        options: ciudadesOpts,
      },
      {
        key: 'tecnico',
        label: 'Líder Técnico',
        multi: true,
        options: tecnicosOpts,
      },
      ...(isDirector ? [{
        key: 'coordinador',
        label: 'Coordinador',
        multi: true,
        options: kpis.coordinadores.map(c => ({ value: c.id, label: c.nombre })),
      }] : []),
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
    ];
  }, [data.clientes, isDirector, kpis.coordinadores, kpis.visitasRaw]);

  const emptyFilters = {
    fechaDesde: '', fechaHasta: '', estado: [], cliente: [], ciudad: [], tecnico: [], coordinador: [],
  };

  const activeFiltersCount =
    (filters.estado?.length || 0) +
    (filters.cliente?.length || 0) +
    (filters.ciudad?.length || 0) +
    (filters.tecnico?.length || 0) +
    (filters.coordinador?.length || 0) +
    (filters.fechaDesde ? 1 : 0) +
    (filters.fechaHasta ? 1 : 0);

  const visitaStats = [
    { label: 'Visitas Total', value: visitaStatsData.total, sub: 'Acumulado', icon: ClipboardList, color: 'text-blue-500' },
    { label: 'Completadas', value: visitaStatsData.completadas, sub: `${visitaStatsData.total ? Math.round((visitaStatsData.completadas / visitaStatsData.total) * 100) : 0}% efectividad`, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'En Progreso', value: visitaStatsData.enProgreso, sub: 'Activas ahora', icon: Activity, color: 'text-purple-500' },
    { label: 'Programadas', value: visitaStatsData.programadas, sub: 'Por ejecutar', icon: CalendarDays, color: 'text-yellow-500' },
  ];

  const directorStats = [
    { label: 'Clientes', value: kpis.totalClientes, sub: 'Registrados', icon: Building2, color: 'text-orange-500' },
    { label: 'Técnicos', value: kpis.totalTecnicos, sub: 'En planta', icon: UserCheck, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

      <Card className="p-8 bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 text-brand">
            <div className="p-3 bg-red-50 rounded-xl"><Filter size={20} /></div>
            <H3 className="text-xs">Panel de Filtros</H3>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="text-xs font-semibold text-brand hover:text-brand-dark underline underline-offset-2 transition-colors"
            >
              Limpiar filtros ({activeFiltersCount})
            </button>
          )}
        </div>
        <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {visitaStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {isDirector && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {directorStats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      )}

      {isDirector && (
        <Card className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2.5 sm:p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Users size={18} /></div>
            <div className="min-w-0">
              <H2 className="text-sm sm:text-base">Rendimiento por Coordinador</H2>
              <Subtitle className="text-xs leading-tight">Coordinadores bajo tu supervisión</Subtitle>
            </div>
          </div>
          {kpis.loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : kpis.coordinadores.length === 0 ? (
            <TextSmall className="text-gray-400 text-center py-6">
              No tienes coordinadores asignados.
            </TextSmall>
          ) : (
            <div>
              {kpis.coordinadores
                .filter(c => !filters.coordinador?.length || filters.coordinador.includes(c.id))
                .map(coord => (
                  <CoordRow key={coord.id} coord={coord} />
                ))
              }
            </div>
          )}
        </Card>
      )}

      <Card className="p-8">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-light rounded-xl text-success"><TrendingUp size={20} /></div>
            <div>
              <H2>Tendencia de Cumplimiento</H2>
              <Subtitle>
                {isCoordinador
                  ? 'Visitas completadas en tus sucursales por mes'
                  : 'Visitas completadas por mes'}
              </Subtitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <Label>{chartYear}</Label>
          </div>
        </div>

        <div
          key={`tendencia-${chartYear}-${tendenciaCounts.join('-')}`}
          className="flex items-end gap-2 sm:gap-3 pt-2"
          style={{ height: 280 }}
        >
          {tendenciaHeights.map((h, i) => {
            const count = tendenciaCounts[i] || 0;
            const barPx = count > 0 ? Math.max(Math.round((h / 100) * 220), 32) : 8;
            return (
              <div key={i} className="flex-1 min-w-5 h-full flex flex-col items-center justify-end gap-1.5 group">
                <span
                  className={`text-xs font-bold tabular-nums leading-none ${
                    count > 0 ? 'text-ink' : 'text-transparent'
                  }`}
                >
                  {count}
                </span>
                <div
                  title={`${count} completada${count !== 1 ? 's' : ''}`}
                  className={`w-full max-w-12 mx-auto rounded-t-xl transition-all duration-500 ${
                    count > 0
                      ? 'bg-success group-hover:bg-emerald-700 shadow-md shadow-success/25'
                      : 'bg-border'
                  }`}
                  style={{ height: barPx }}
                />
                <TextSmall className="text-ink-muted uppercase shrink-0">M{i + 1}</TextSmall>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
