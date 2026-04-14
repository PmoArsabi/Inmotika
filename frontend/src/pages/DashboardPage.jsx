import { useState, useMemo } from 'react';
import {
  ClipboardList, CheckCircle2, Users, CalendarDays, UserCheck,
  Building2, Filter, Activity, TrendingUp,
} from 'lucide-react';
import Card from '../components/ui/Card';
import FilterBar from '../components/shared/FilterBar';
import { ROLES } from '../utils/constants';
import { H3, H2, Subtitle, TextSmall, Metric, Label, TextTiny } from '../components/ui/Typography';
import { useDashboardKpis } from '../hooks/useDashboardKpis';
import { useAuth } from '../context/AuthContext';

// ─── Sub-componentes locales ──────────────────────────────────────────────────

/** Tarjeta de stat simple (visitas / totales). */
 
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <Card className="p-4 sm:p-6 lg:p-8">
    <div className="flex justify-between items-start gap-2">
      <div className="flex flex-col gap-1.5 sm:gap-3 min-w-0">
        <Label className="block text-[10px] sm:text-xs leading-tight">{label}</Label>
        <Metric className="block text-2xl sm:text-3xl text-gray-900">{value}</Metric>
        <TextSmall className="text-[9px] sm:text-[10px] uppercase text-gray-400 leading-tight">{sub}</TextSmall>
      </div>
      <div className="p-2.5 sm:p-4 bg-gray-50 rounded-2xl sm:rounded-4xl shadow-inner shrink-0">
        <Icon className={color} size={20} strokeWidth={1.8} />
      </div>
    </div>
  </Card>
);

/** Fila de KPI de un coordinador (para Director y Admin). */
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

// ─── Componente principal ─────────────────────────────────────────────────────

const DashboardPage = ({ data }) => {
  const { user } = useAuth();
  const kpis = useDashboardKpis();
  const [filters, setFilters] = useState({ fecha: '', estado: [], cliente: [], ciudad: [], tecnico: [], coordinador: [] });

  const role = user?.role;
  const isDirector = role === ROLES.DIRECTOR;
  const isCoordinador = role === ROLES.COORDINADOR;

  const filterDefs = useMemo(() => {
    const ciudades = [...new Set((data.clientes || []).map(c => c.ciudad).filter(Boolean))];
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
        options: (data.clientes || []).map(c => ({ value: c.nombre, label: c.nombre })),
      },
      {
        key: 'ciudad',
        label: 'Ciudad / Zona',
        multi: true,
        options: ciudades.map(c => ({ value: c, label: c })),
      },
      {
        key: 'tecnico',
        label: 'Líder Técnico',
        multi: true,
        options: (data.tecnicos || []).map(t => ({ value: t.nombre, label: t.nombre })),
      },
      ...(isDirector ? [{
        key: 'coordinador',
        label: 'Coordinador',
        multi: true,
        options: kpis.coordinadores.map(c => ({ value: c.id, label: c.nombre })),
      }] : []),
      { key: 'fecha', label: 'Fecha de Corte', type: 'date', dateRole: 'desde' },
    ];
  }, [data.clientes, data.tecnicos, isDirector, kpis.coordinadores]);

  // ── Stats de visitas (comunes a todos los roles) ──
  const visitaStats = [
    { label: 'Visitas Total', value: kpis.visitas.total, sub: 'Acumulado', icon: ClipboardList, color: 'text-blue-500' },
    { label: 'Completadas', value: kpis.visitas.completadas, sub: `${kpis.visitas.total ? Math.round((kpis.visitas.completadas / kpis.visitas.total) * 100) : 0}% efectividad`, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'En Progreso', value: kpis.visitas.enProgreso, sub: 'Activas ahora', icon: Activity, color: 'text-purple-500' },
    { label: 'Programadas', value: kpis.visitas.programadas, sub: 'Por ejecutar', icon: CalendarDays, color: 'text-yellow-500' },
  ];

  // ── Stats extra para DIRECTOR (visión global) ──
  const directorStats = [
    { label: 'Clientes', value: kpis.totalClientes, sub: 'Registrados', icon: Building2, color: 'text-orange-500' },
    { label: 'Técnicos', value: kpis.totalTecnicos, sub: 'En planta', icon: UserCheck, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* Filtros */}
      <Card className="p-8 bg-white shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 text-[#D32F2F]">
          <div className="p-3 bg-red-50 rounded-xl"><Filter size={20} /></div>
          <H3 className="text-xs">Panel de Filtros</H3>
        </div>
        <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
      </Card>

      {/* KPIs de visitas — comunes a todos los roles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {visitaStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* KPIs globales extra — solo DIRECTOR */}
      {isDirector && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {directorStats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      )}

      {/* KPIs por coordinador — solo DIRECTOR */}
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
              {isDirector ? 'No tienes coordinadores asignados.' : 'No hay coordinadores registrados.'}
            </TextSmall>
          ) : (
            <div>
              {kpis.coordinadores
                .filter(c => filters.coordinador.length === 0 || filters.coordinador.includes(c.id))
                .map(coord => (
                  <CoordRow key={coord.id} coord={coord} />
                ))
              }
            </div>
          )}
        </Card>
      )}

      {/* Tendencia mensual */}
      <Card className="p-8">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl text-primary"><TrendingUp size={20} /></div>
            <div>
              <H2>Tendencia de Cumplimiento</H2>
              <Subtitle>
                {isCoordinador ? 'Tus visitas completadas por mes' : 'Visitas completadas / programadas por mes'}
              </Subtitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <Label>{new Date().getFullYear()}</Label>
          </div>
        </div>
        <div className="h-64 flex items-end gap-2 sm:gap-6 overflow-hidden pb-4">
          {kpis.tendenciaMeses.map((h, i) => (
            <div key={i} className="flex-1 min-w-5 flex flex-col items-center gap-4 group">
              <div
                className={`w-full rounded-t-3xl transition-all duration-700 group-hover:bg-primary group-hover:shadow-2xl shadow-red-500/30 ${h >= 80 ? 'bg-primary' : 'bg-[#F5F5F5]'}`}
                style={{ height: `${Math.max(h, 4)}%` }}
              />
              <TextSmall className="text-gray-400 uppercase">M{i + 1}</TextSmall>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
