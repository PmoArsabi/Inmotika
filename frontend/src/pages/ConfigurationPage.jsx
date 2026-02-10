import { useState } from 'react';
import {
  Plus, X, Edit2, Trash2, CheckCircle2, Users, MapPin, Building2,
  Phone, Mail, UserCog, Activity, RotateCcw, Timer, ListChecks, Smartphone
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import FileUploader from '../components/ui/FileUploader';

const ConfigurationPage = ({ data, setData }) => {
  const [activeSubTab, setActiveSubTab] = useState('clientes');
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deviceCodes, setDeviceCodes] = useState([]);
  const [currentDeviceCode, setCurrentDeviceCode] = useState('');
  const [maintenanceSteps, setMaintenanceSteps] = useState([]);
  const [currentStepText, setCurrentStepText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState({ carnet: false, arl: false, matriz: false, manual: false, mantenimiento: false });

  const addDeviceCode = () => { if (currentDeviceCode && !deviceCodes.includes(currentDeviceCode)) { setDeviceCodes([...deviceCodes, currentDeviceCode]); setCurrentDeviceCode(''); } };
  const addStep = () => { if (currentStepText) { setMaintenanceSteps([...maintenanceSteps, currentStepText]); setCurrentStepText(''); } };

  const handleCreate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = Object.fromEntries(formData.entries());
    newItem.id = Date.now();
    if (activeSubTab === 'clientes') newItem.dispositivos = deviceCodes;
    if (activeSubTab === 'dispositivos') newItem.pasoAPaso = maintenanceSteps;
    setData({ ...data, [activeSubTab]: [newItem, ...data[activeSubTab]] });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setShowForm(false); setDeviceCodes([]); setMaintenanceSteps([]); }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex bg-gray-100 p-2 rounded-[2rem] w-fit">
        {['clientes', 'tecnicos', 'dispositivos'].map(tab => (
          <button key={tab} onClick={() => { setActiveSubTab(tab); setShowForm(false); }} className={`px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.25em] transition-all ${activeSubTab === tab ? 'bg-white text-[#D32F2F] shadow-sm' : 'text-gray-400'}`}>{tab}</button>
        ))}
      </div>
      {!showForm ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-black uppercase text-gray-900 tracking-tighter">Maestros de {activeSubTab}</h3>
            <Button onClick={() => setShowForm(true)}><Plus size={20}/> Nuevo Registro</Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#1A1A1A] text-white">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em]">Nombre / Razón</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] hidden md:table-cell">Detalles Técnicos</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data[activeSubTab].map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-6"><p className="font-black text-base text-gray-900 leading-none mb-1">{item.nombre || item.tipo}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.nit || item.identificacion || item.serial || item.codigoUnico}</p></td>
                      <td className="px-8 py-6 hidden md:table-cell"><p className="text-sm font-bold text-gray-600">{item.ciudad || item.marca} — {item.sucursal || item.linea || item.zona}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.email || item.correo || item.proveedor}</p></td>
                      <td className="px-8 py-6 text-right flex justify-end gap-4 text-gray-200 group-hover:text-gray-400"><Edit2 size={18}/><Trash2 size={18}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-12 duration-500 pb-20">
          <Card className="max-w-5xl p-10 md:p-16 mx-auto shadow-2xl">
            <header className="flex justify-between items-center mb-12 border-b border-gray-100 pb-8">
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Configurar {activeSubTab.slice(0, -1)}</h3>
              <button onClick={() => setShowForm(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-3xl transition-all"><X size={24}/></button>
            </header>
            <form onSubmit={handleCreate} className="space-y-10">
              {activeSubTab === 'clientes' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input name="nombre" label="Razón Social" icon={Users} required />
                    <Input name="nit" label="NIT / RUT" required />
                    <div className="grid grid-cols-2 gap-6 md:col-span-2">
                      <Input name="ciudad" label="Ciudad Principal" icon={MapPin} required />
                      <Input name="sucursal" label="Sucursal" icon={Building2} required />
                    </div>
                    <Input name="direccion" label="Dirección Física" icon={MapPin} className="md:col-span-2" required />
                    <Input name="telefono" label="Teléfono" type="tel" icon={Phone} />
                    <Input name="email" label="Email Corporativo" type="email" icon={Mail} />
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-red-50 text-[#D32F2F] rounded-xl"><Building2 size={24} /></div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Sucursales</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input name="sucursal_nombre" label="Nombre" />
                      <Input name="sucursal_ciudad" label="Ciudad" icon={MapPin} />
                      <Input name="sucursal_direccion" label="Dirección" icon={MapPin} />
                      <Input name="sucursal_telefono" label="Teléfono" icon={Phone} />
                      <Input name="sucursal_email" label="Email" icon={Mail} />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-red-50 text-[#D32F2F] rounded-xl"><Users size={24} /></div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Usuarios</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input name="usuario_email" label="Email" icon={Mail} />
                      <Input name="usuario_nombre" label="Nombre" />
                      <Input name="usuario_apellido" label="Apellido" />
                      <Input name="usuario_celular" label="# Celular" icon={Smartphone} />
                      <Input name="usuario_cargo" label="Cargo" />
                      <Input name="usuario_ciudad" label="Ciudad Consulta" icon={MapPin} />
                      <Input name="usuario_sede" label="Sede Consulta" icon={Building2} />
                    </div>
                  </div>
                </div>
              )}
              {activeSubTab === 'tecnicos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input name="nombre" label="Nombre Completo" icon={UserCog} required />
                  <Input name="identificacion" label="Documento ID" required />
                  <Input name="celular" label="Móvil de Contacto" icon={Phone} required />
                  <Input name="ciudad" label="Sede de Operación" icon={MapPin} required />
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
                    <FileUploader label="Credencial ID" type="carnet" isLoaded={attachedFiles.carnet} onLoad={(type) => setAttachedFiles(p => ({...p, [type]: true}))} />
                    <FileUploader label="Cert. ARL" type="arl" isLoaded={attachedFiles.arl} onLoad={(type) => setAttachedFiles(p => ({...p, [type]: true}))} />
                    <FileUploader label="Certificación" type="matriz" isLoaded={attachedFiles.matriz} onLoad={(type) => setAttachedFiles(p => ({...p, [type]: true}))} />
                  </div>
                </div>
              )}
              {activeSubTab === 'dispositivos' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <Select className="md:col-span-2" name="tipo" label="Categoría" options={[{value: 'Cámara', label: 'Cámara IP'}, {value: 'Sensor', label: 'Sensor Mov.'}, {value: 'Panel', label: 'Panel Control'}]} />
                    <Input className="md:col-span-2" name="modelo" label="Modelo Técnico" required />
                    <Input name="serial" label="Número Serie" required />
                    <Input name="codigoUnico" label="Cod. Único" required />
                    <Input name="marca" label="Marca" />
                    <Input name="proveedor" label="Proveedor" />
                    <Input name="linea" label="Línea" />
                    <Input name="imac" label="IMAC (MAC)" icon={Activity} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                    <Select label="Mantenimiento Preventivo" icon={RotateCcw} options={[{value: 'Mensual', label: 'Cada Mes'}, {value: 'Anual', label: 'Anual'}]} />
                    <Input name="tiempoPromedio" label="Tiempo Estimado (min)" icon={Timer} type="number" />
                  </div>
                  <div className="space-y-6 pt-8 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <ListChecks size={24} className="text-[#D32F2F]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 border-l-4 border-[#D32F2F] pl-4">Protocolo Paso a Paso</h4>
                    </div>
                    <div className="flex gap-4">
                      <input value={currentStepText} onChange={e => setCurrentStepText(e.target.value)} className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-[2rem] text-sm font-bold focus:border-[#D32F2F]" placeholder="Defina una tarea de revisión técnica..." />
                      <Button variant="secondary" onClick={addStep}>Añadir</Button>
                    </div>
                    <div className="space-y-2">
                      {maintenanceSteps.map((s, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-[1.5rem] flex items-center justify-between font-bold text-gray-600 text-sm">
                          <span>{i+1}. {s}</span>
                          <button type="button" onClick={() => setMaintenanceSteps(maintenanceSteps.filter((_, idx) => idx !== i))}><Trash2 size={18} className="text-gray-300 hover:text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-6 pt-8 border-t border-gray-100">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Descartar</Button>
                <Button variant="danger" className="flex-1" type="submit">Guardar Maestro</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;