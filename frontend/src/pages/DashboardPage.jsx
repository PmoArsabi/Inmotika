import { useState } from 'react';
import {
  ClipboardList, CheckCircle2, Users, Clock, CalendarDays, UserCheck,
  Smartphone, Target, Building2, Filter, Calendar,
  Activity, MapPin, UserCircle2, TrendingUp, AlertTriangle, BarChart3,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { ROLES } from '../utils/constants';
import { H3, H2, Subtitle, TextSmall, Metric, Label, TextTiny } from '../components/ui/Typography';
import { useDashboardKpis } from '../hooks/useDashboardKpis';
import { useAuth } from '../context/AuthContext';

// ─── Sub-componentes locales ──────────────────────────────────────────────────

/** Tarjeta de stat simple (visitas / totales). */
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <Card className="p-8">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <Label>{label}</Label>
        <Metric className="text-3xl text-gray-900">{value}</Metric>
        <TextSmall className="text-[10px] uppercase text-gray-400">{sub}</TextSmall>
      </div>
      <div className="p-4 bg-gray-50 rounded-4xl shadow-inner">
        <Icon className={color} size={32} />
      </div>
    </div>
  </Card>
);

/** Fila de KPI de un coordinador (para Director y Admin). */
const CoordRow = ({ coord }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
    <div className="flex-1 min-w-0">
      <TextSmall className="font-semibold text-gray-900 truncate">{coord.nombre}</TextSmall>
      <TextTiny className="text-gray-400">{coord.visitasTotal} visitas asignadas</TextTiny>
    </div>
    <div className="flex items-center gap-6 shrink-0">
      <div className="text-center">
        <TextTiny className="text-gray-400 uppercase tracking-wide">Completadas</TextTiny>
        <TextSmall className="font-bold text-green-600">{coord.visitasCompletadas}</TextSmall>
      </div>
      <div className="text-center">
        <TextTiny className="text-gray-400 uppercase tracking-wide">Pendientes</TextTiny>
        <TextSmall className="font-bold text-yellow-500">{coord.visitasPendientes}</TextSmall>
      </div>
      <div className="text-center min-w-[56px]">
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
  const [filters, setFilters] = useState({ fecha: '', estado: '', cliente: '', ciudad: '', tecnico: '' });

  const role = user?.role;
  const isAdmin = role === ROLES.ADMIN;
  const isDirector = role === ROLES.DIRECTOR;
  const isCoordinador = role === ROLES.COORDINADOR;

  const ciudades = [...new Set((data.clientes || []).map(c => c.ciudad).filter(Boolean))];

  // ── Stats de visitas (comunes a todos los roles) ──
  const visitaStats = [
    { label: 'Visitas Total', value: kpis.visitas.total, sub: 'Acumulado', icon: ClipboardList, color: 'text-blue-500' },
    { label: 'Completadas', value: kpis.visitas.completadas, sub: `${kpis.visitas.total ? Math.round((kpis.visitas.completadas / kpis.visitas.total) * 100) : 0}% efectividad`, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'En Progreso', value: kpis.visitas.enProgreso, sub: 'Activas ahora', icon: Activity, color: 'text-purple-500' },
    { label: 'Programadas', value: kpis.visitas.programadas, sub: 'Por ejecutar', icon: CalendarDays, color: 'text-yellow-500' },
  ];

  // ── Stats extra solo para ADMIN ──
  const adminStats = [
    { label: 'Clientes', value: kpis.totalClientes, sub: 'Registrados', icon: Building2, color: 'text-orange-500' },
    { label: 'Técnicos', value: kpis.totalTecnicos, sub: 'En planta', icon: UserCheck, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* Filtros */}
      <Card className="p-8 bg-white shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 text-[#D32F2F]">
          <div className="p-3 bg-red-50 rounded-xl"><Filter size={20} /></div>
          <H3 className="text-xs">Panel de Filtros de Gestión</H3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input label="Fecha de Corte" type="date" icon={Calendar} value={filters.fecha} onChange={e => setFilters({ ...filters, fecha: e.target.value })} />
          <Select label="Estado Operativo" icon={Activity} options={[{ value: '', label: 'Todos' }, { value: 'PROGRAMADA', label: 'Programada' }, { value: 'EN_PROGRESO', label: 'En Ejecución' }, { value: 'COMPLETADA', label: 'Finalizada' }, { value: 'CANCELADA', label: 'Cancelada' }]} value={filters.estado} onChange={e => setFilters({ ...filters, estado: e.target.value })} />
          <Select label="Cliente Corporativo" icon={Building2} options={[{ value: '', label: 'Todos' }, ...(data.clientes || []).map(c => ({ value: c.nombre, label: c.nombre }))]} value={filters.cliente} onChange={e => setFilters({ ...filters, cliente: e.target.value })} />
          <Select label="Ciudad / Zona" icon={MapPin} options={[{ value: '', label: 'Todas' }, ...ciudades.map(c => ({ value: c, label: c }))]} value={filters.ciudad} onChange={e => setFilters({ ...filters, ciudad: e.target.value })} />
          <Select label="Líder Técnico" icon={UserCircle2} options={[{ value: '', label: 'Todos' }, ...(data.tecnicos || []).map(t => ({ value: t.nombre, label: t.nombre }))]} value={filters.tecnico} onChange={e => setFilters({ ...filters, tecnico: e.target.value })} />
        </div>
      </Card>

      {/* KPIs de visitas — comunes a todos los roles */}
      <div className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-4'} gap-6`}>
        {visitaStats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* KPIs globales extra — solo ADMIN */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {adminStats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      )}

      {/* KPIs por coordinador — DIRECTOR y ADMIN */}
      {(isDirector || isAdmin) && (
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={20} /></div>
            <div>
              <H2>Rendimiento por Coordinador</H2>
              <Subtitle>
                {isDirector ? 'Coordinadores bajo tu supervisión' : 'Todos los coordinadores activos'}
              </Subtitle>
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
              {kpis.coordinadores.map(coord => (
                <CoordRow key={coord.id} coord={coord} />
              ))}
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
            <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-4 group">
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
