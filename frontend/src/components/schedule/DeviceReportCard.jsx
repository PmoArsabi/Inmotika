import {
  Camera, Plus, Image as ImageIcon, Clock, Timer, Calendar,
  Activity, ListChecks, RotateCcw, CalendarDays, ShieldCheck
} from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SignaturePad from '../ui/SignaturePad';

const DeviceReportCard = ({ dev }) => (
  <Card className="p-0 border-l-[12px] border-[#D32F2F] shadow-2xl">
    <div className="p-12 space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start gap-6 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-50">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-[#1A1A1A] text-white text-[9px] font-black uppercase rounded-lg tracking-widest">{dev.tipo}</span>
            <span className="text-xs font-black text-[#D32F2F] uppercase tracking-widest">{dev.codigoUnico}</span>
          </div>
          <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{dev.marca} {dev.modelo}</h4>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Serial #</p><p className="text-xs font-bold text-gray-700">{dev.serial}</p></div>
          <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MAC</p><p className="text-xs font-bold text-gray-700">{dev.imac}</p></div>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Input label="Fecha Ejecución" type="date" icon={Calendar} defaultValue={new Date().toISOString().split('T')[0]} />
        <Input label="Hora Inicio" type="time" icon={Clock} />
        <Input label="Hora Fin" type="time" icon={Timer} />
        <Select label="Estado Final" icon={Activity} options={[{value: 'Optimo', label: 'Operativo / Óptimo'}, {value: 'Regular', label: 'Requiere Ajustes'}, {value: 'Critico', label: 'No Operativo'}]} />
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4"><ListChecks size={20} className="text-[#D32F2F]" /><h5 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Protocolo de Mantenimiento (Checklist)</h5></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(dev.pasoAPaso || ['Limpieza General', 'Validación Conectividad']).map((step, sIdx) => (
            <label key={sIdx} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
              <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">{step}</span>
              <input type="checkbox" className="w-6 h-6 accent-[#D32F2F]" />
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2"><Camera size={14} className="text-[#D32F2F]" /> Evidencia Fotográfica</label>
          <div className="grid grid-cols-3 gap-4">
            <div className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 hover:border-[#D32F2F] hover:text-[#D32F2F] cursor-pointer"><Plus size={32} /></div>
            <div className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200"><ImageIcon size={32} /></div>
            <div className="aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200"><ImageIcon size={32} /></div>
          </div>
        </div>
        <div className="space-y-6">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Observaciones Técnicas</label>
          <textarea className="w-full h-32 p-6 bg-gray-50/50 border-2 border-gray-100 rounded-[2rem] focus:outline-none focus:border-[#D32F2F] text-sm font-bold resize-none" placeholder="Hallazgos técnicos..."></textarea>
        </div>
      </div>
      <div className="p-10 bg-[#1A1A1A] rounded-[3rem] text-white shadow-xl space-y-10">
        <div className="flex items-center gap-5 border-b border-white/10 pb-6">
          <div className="p-3 bg-[#D32F2F] rounded-xl"><ShieldCheck size={28} /></div>
          <div><h4 className="text-lg font-black uppercase tracking-tighter">Certificación de Integridad</h4><p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Validación técnico-legal por activo</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <Select dark label="Tipo de Intervención" icon={RotateCcw} options={[{value: 'Preventivo', label: 'Mantenimiento Preventivo'}, {value: 'Correctivo', label: 'Mantenimiento Correctivo'}]} />
            <Input dark label="Fecha Próximo Mant." type="date" icon={CalendarDays} />
          </div>
          <div className="lg:col-span-7">
            <SignaturePad label={`Firma: Técnico Carlos Perez - ID ${dev.codigoUnico}`} />
          </div>
        </div>
      </div>
    </div>
  </Card>
);

export default DeviceReportCard;
