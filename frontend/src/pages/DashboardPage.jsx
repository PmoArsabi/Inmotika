import { useState } from 'react';
import {
  ClipboardList, CheckCircle2, Users, Clock, CalendarDays, UserCheck,
  Smartphone, Target, Heart, AlertTriangle, Building2, Filter, Calendar,
  Activity, MapPin, UserCircle2
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import KPICardGroup from '../components/ui/KPICardGroup';
import { ROLES } from '../utils/constants';

const DashboardPage = ({ data, user }) => {
  const [filters, setFilters] = useState({ fecha: '', estado: '', cliente: '', ciudad: '', tecnico: '' });
  const ciudades = [...new Set(data.clientes.map(c => c.ciudad))];

  const stats = [
    { label: "Visitas Mes", value: data.visitas.length, sub: "+12% vs anterior", icon: ClipboardList, color: "text-blue-500" },
    { label: "Efectividad %", value: "94.2", sub: "Meta: 90%", icon: CheckCircle2, color: "text-green-500" },
    { label: "Líder Operativo", value: "Carlos P.", sub: "Rendimiento óptimo", icon: Users, color: "text-[#D32F2F]" },
  ];

  const kpiGroups = {
    coordinadores: [
      { label: "Tiempos Asignación", value: "15 min", sub: "Promedio Global", icon: Clock },
      { label: "Cumplimiento Agenda", value: "98.5%", sub: "Desviación < 2%", icon: CalendarDays },
      { label: "Recursos Activos", value: "12/15", sub: "Disponibilidad", icon: UserCheck }
    ],
    tecnicos: [
      { label: "Visitas / Técnico", value: "4.2", sub: "Diario Promedio", icon: Smartphone },
      { label: "Resolución 1er Nivel", value: "88%", sub: "Éxito en Sitio", icon: Target },
      { label: "Adherencia SLA", value: "95%", sub: "Meta 90%", icon: CheckCircle2 }
    ],
    clientes: [
      { label: "NPS / Satisfacción", value: "4.8/5", sub: "Encuestas Post-Visita", icon: Heart },
      { label: "Alertas Críticas", value: "2", sub: "Requieren Atención", icon: AlertTriangle, alert: true },
      { label: "Retención", value: "99.1%", sub: "Renovaciones Mes", icon: Building2 }
    ]
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="p-8 bg-white shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 text-[#D32F2F]">
          <div className="p-3 bg-red-50 rounded-xl"><Filter size={20} /></div>
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-900">Panel de Filtros de Gestión</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input label="Fecha de Corte" type="date" icon={Calendar} value={filters.fecha} onChange={e => setFilters({...filters, fecha: e.target.value})} />
          <Select label="Estado Operativo" icon={Activity} options={[{value: '', label: 'Todos'}, {value: 'Pendiente', label: 'Pendiente'}, {value: 'En Ejecución', label: 'En Ejecución'}, {value: 'Finalizada', label: 'Finalizada'}, {value: 'Cancelada', label: 'Cancelada'}]} value={filters.estado} onChange={e => setFilters({...filters, estado: e.target.value})} />
          <Select label="Cliente Corporativo" icon={Building2} options={[{value: '', label: 'Todos'}, ...data.clientes.map(c => ({value: c.nombre, label: c.nombre}))]} value={filters.cliente} onChange={e => setFilters({...filters, cliente: e.target.value})} />
          <Select label="Ciudad / Zona" icon={MapPin} options={[{value: '', label: 'Todas'}, ...ciudades.map(c => ({value: c, label: c}))]} value={filters.ciudad} onChange={e => setFilters({...filters, ciudad: e.target.value})} />
          <Select label="Líder Técnico" icon={UserCircle2} options={[{value: '', label: 'Todos'}, ...data.tecnicos.map(t => ({value: t.nombre, label: t.nombre}))]} value={filters.tecnico} onChange={e => setFilters({...filters, tecnico: e.target.value})} />
        </div>
      </Card>
      
      {user?.role === ROLES.DIRECTOR ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICardGroup title="KPI Coordinadores" items={kpiGroups.coordinadores} colorTheme="text-blue-600" />
          <KPICardGroup title="KPI Técnicos" items={kpiGroups.tecnicos} colorTheme="text-green-600" />
          <KPICardGroup title="KPI Clientes" items={kpiGroups.clientes} colorTheme="text-orange-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
                    {stat.label.includes('%') && <span className="text-xl font-bold text-gray-300">%</span>}
                  </div>
                  <p className={`text-[10px] font-black uppercase ${stat.sub.includes('+') ? 'text-green-500' : 'text-gray-400'}`}>{stat.sub}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-[2rem] shadow-inner"><stat.icon className={stat.color} size={32} /></div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <Card className="p-8">
        <div className="flex justify-between items-center mb-10">
          <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Tendencia de Cumplimiento Técnico</h4>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#D32F2F] rounded-full"></div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">2026</span>
            </div>
          </div>
        </div>
        <div className="h-64 flex items-end gap-2 sm:gap-6 overflow-hidden pb-4">
          {[60, 85, 40, 100, 75, 90, 50, 70, 80, 65, 88, 72].map((h, i) => (
            <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-4 group">
              <div className="w-full rounded-t-[1.5rem] transition-all duration-700 group-hover:bg-[#D32F2F] group-hover:shadow-2xl shadow-red-500/30" style={{ height: `${h}%`, backgroundColor: i === 3 ? '#D32F2F' : '#F5F5F5' }}></div>
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">MES {i+1}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
