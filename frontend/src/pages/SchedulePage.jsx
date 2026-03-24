import { useState, useMemo } from 'react';
import {
  CheckCircle2, Clock, MapPin, ClipboardList,
  Search, CalendarDays, Cpu, Activity, Filter,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import StatCard from '../components/ui/StatCard';
import VisitStatusBadge from '../components/visits/VisitStatusBadge';
import { TechnicianChipList } from '../components/ui/TechnicianChip';
import { H1, H2, Subtitle, TextSmall, Metric, Label } from '../components/ui/Typography';
import { useVisitas } from '../hooks/useVisitas';
import { useAuth } from '../context/AuthContext';

// ─── Date formatting ──────────────────────────────────────────────────────────

const MONTHS_ES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const DAYS_ES   = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];

/**
 * Formats a JS Date into "21 ENE · JUEVES 2026".
 * @param {Date} date
 * @returns {string}
 */
const formatHeaderDate = (date) => {
  const day     = date.getDate();
  const month   = MONTHS_ES[date.getMonth()];
  const weekday = DAYS_ES[date.getDay()];
  const year    = date.getFullYear();
  return { dayMonth: `${day} ${month}`, weekYear: `${weekday} ${year}` };
};

/**
 * Formats an ISO datetime string to "DD MMM YYYY · HH:MM".
 * @param {string|null} iso
 * @returns {string}
 */
const formatVisitDate = (iso) => {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_ES[d.getMonth()];
  const year  = d.getFullYear();
  const hh    = String(d.getHours()).padStart(2, '0');
  const mm    = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hh}:${mm}`;
};

/**
 * Returns the ISO date-only string "YYYY-MM-DD" for a given ISO datetime.
 * Used to compare against the date input value.
 * @param {string|null} iso
 * @returns {string}
 */
const toDateOnly = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

// ─── Estado options for the select filter ─────────────────────────────────────

/** @type {Array<{value: string, label: string}>} */
const ESTADO_OPTIONS = [
  { value: '',           label: 'Todos los estados' },
  { value: 'PROGRAMADA', label: 'Programada'        },
  { value: 'EN_PROGRESO', label: 'En progreso'      },
  { value: 'COMPLETADA', label: 'Completada'        },
];

// ─── Tipo badge ────────────────────────────────────────────────────────────────

/**
 * Small pill badge for the visit type label.
 * @param {{ label: string }} props
 */
const TipoBadge = ({ label }) => {
  if (!label) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
      {label}
    </span>
  );
};

// ─── Visit card ───────────────────────────────────────────────────────────────

/**
 * Read-only card for a single visita. Navigation is handled externally.
 * @param {{ visita: import('../hooks/useVisitas').Visita }} props
 */
const VisitCard = ({ visita }) => {
  const isCompleted = visita.estadoCodigo === 'COMPLETADA';

  return (
    <Card
      className={`p-5 transition-all duration-200 ${isCompleted ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-px'}`}
    >
      {/* Top row: tipo + estado */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TipoBadge label={visita.tipoVisitaLabel} />
          <VisitStatusBadge
            status={visita.estadoCodigo}
            className={visita.estadoCodigo === 'EN_PROGRESO' ? 'animate-pulse' : ''}
          />
        </div>
        <TextSmall className="text-gray-300 shrink-0">{visita.id.slice(0, 8)}</TextSmall>
      </div>

      {/* Client + branch */}
      <div className="mb-3">
        <H2 className="text-base leading-tight text-gray-900 mb-0.5 normal-case tracking-normal">
          {visita.clienteNombre || '—'}
        </H2>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
          <MapPin size={12} className="text-[#D32F2F] shrink-0" />
          <span>{visita.sucursalNombre || 'Sin sucursal'}</span>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold mb-4">
        <CalendarDays size={12} className="text-gray-400 shrink-0" />
        <span>{formatVisitDate(visita.fechaProgramada)}</span>
      </div>

      {/* Bottom row: technicians + devices */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3 gap-4 flex-wrap">
        <TechnicianChipList names={visita.tecnicosNombres} max={3} />
        <div className="flex items-center gap-1 text-xs font-bold text-gray-400 shrink-0">
          <Cpu size={12} />
          <span>
            {visita.dispositivos?.length ?? 0}{' '}
            {(visita.dispositivos?.length ?? 0) === 1 ? 'dispositivo' : 'dispositivos'}
          </span>
        </div>
      </div>
    </Card>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const VisitSkeleton = () => (
  <Card className="p-5 animate-pulse">
    <div className="flex gap-2 mb-3">
      <div className="h-5 w-20 bg-gray-100 rounded-full" />
      <div className="h-5 w-24 bg-gray-100 rounded-full" />
    </div>
    <div className="h-5 w-48 bg-gray-100 rounded mb-1" />
    <div className="h-3 w-32 bg-gray-100 rounded mb-4" />
    <div className="h-3 w-40 bg-gray-100 rounded mb-4" />
    <div className="flex gap-2 border-t border-gray-50 pt-3">
      <div className="h-5 w-16 bg-gray-100 rounded-full" />
      <div className="h-5 w-16 bg-gray-100 rounded-full" />
    </div>
  </Card>
);

// ─── Main page ─────────────────────────────────────────────────────────────────

/**
 * SchedulePage — dashboard de visitas para el rol Técnico.
 * Consumes `useVisitas` para datos reales y `useAuth` para el nombre del usuario.
 * Sin props de datos externos; sin navegación interna a detalle de visita.
 */
const SchedulePage = () => {
  const { visitas, loading } = useVisitas();
  const { user } = useAuth();

  const [filterClient, setFilterClient] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // ── Computed values ─────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total:      visitas.length,
    completada: visitas.filter(v => v.estadoCodigo === 'COMPLETADA').length,
    programada: visitas.filter(v => v.estadoCodigo === 'PROGRAMADA').length,
    enProgreso: visitas.filter(v => v.estadoCodigo === 'EN_PROGRESO').length,
  }), [visitas]);

  const filteredVisits = useMemo(() => {
    return visitas.filter(v => {
      const matchClient = !filterClient || (v.clienteNombre || '').toLowerCase().includes(filterClient.toLowerCase());
      const matchDate   = !filterDate   || toDateOnly(v.fechaProgramada) === filterDate;
      const matchEstado = !filterEstado || v.estadoCodigo === filterEstado;
      return matchClient && matchDate && matchEstado;
    });
  }, [visitas, filterClient, filterDate, filterEstado]);

  const { dayMonth, weekYear } = formatHeaderDate(new Date());
  const firstName = user?.nombres || 'Técnico';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-700 pb-20">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end bg-white p-6 rounded-md border border-gray-100 shadow-sm gap-4">
        <div>
          <H1 className="mb-2 tracking-tighter leading-none">
            Hola, {firstName}
          </H1>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-200" />
            Operación Activa
          </div>
        </div>
        <div className="text-right">
          <Metric className="text-[#D32F2F] leading-none mb-1 text-xl block">
            {dayMonth}
          </Metric>
          <Label className="text-gray-300">{weekYear}</Label>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Asignadas"
          value={loading ? '—' : kpis.total}
          icon={ClipboardList}
          color="gray"
        />
        <StatCard
          label="Realizadas"
          value={loading ? '—' : kpis.completada}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Pendientes"
          value={loading ? '—' : kpis.programada}
          icon={Clock}
          color="red"
        />
        <StatCard
          label="En Progreso"
          value={loading ? '—' : kpis.enProgreso}
          icon={Activity}
          color="yellow"
        />
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gray-50 border-none shadow-inner">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400" />
          <Subtitle>Filtros</Subtitle>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar cliente"
            placeholder="Nombre del cliente..."
            icon={Search}
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
          />
          <Input
            label="Fecha programada"
            type="date"
            icon={CalendarDays}
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          {/* Estado native select styled consistently with Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <Label className="ml-1">Estado</Label>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400 transition-all text-sm font-semibold text-gray-900 bg-white"
            >
              {ESTADO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Visit list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <>
            <VisitSkeleton />
            <VisitSkeleton />
            <VisitSkeleton />
          </>
        ) : filteredVisits.length > 0 ? (
          filteredVisits.map(v => (
            <VisitCard key={v.id} visita={v} />
          ))
        ) : (
          <div className="col-span-full p-16 text-center border-2 border-dashed border-gray-100 rounded-md">
            <ClipboardList size={32} className="text-gray-200 mx-auto mb-3" />
            <Label className="text-gray-300">
              {visitas.length === 0 ? 'Sin visitas asignadas' : 'Sin resultados para los filtros aplicados'}
            </Label>
          </div>
        )}
      </div>

    </div>
  );
};

export default SchedulePage;
