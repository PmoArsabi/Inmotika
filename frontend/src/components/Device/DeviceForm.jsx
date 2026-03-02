import React from 'react';
import { 
  Building2, MapPin, Hash, Monitor, User, Navigation2, Activity, 
  ClipboardList, Timer, CheckCircle2, ChevronUp, ChevronDown, Trash2, Plus, ArrowRightLeft, Calendar 
} from 'lucide-react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SearchableSelect from '../ui/SearchableSelect';
import { H2, Label, Subtitle, TextSmall } from '../ui/Typography';
import Card from '../ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';

const DeviceForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving, clients
}) => {
  const activeClient = (clients || []).find(c => String(c.id) === String(draft.clientId));
  const activeBranchOptions = activeClient ? (activeClient.sucursales || []).map(b => ({ value: b.id, label: b.nombre })) : [];

  const addStep = () => {
    const newStep = prompt('Descripción del paso de mantenimiento:');
    if (newStep && newStep.trim() !== '') {
      updateDraft({ pasoAPaso: [...(draft.pasoAPaso || []), newStep.trim()] });
    }
  };

  const removeStep = (idx) => {
    updateDraft({ pasoAPaso: (draft.pasoAPaso || []).filter((_, i) => i !== idx) });
  };

  const updateStep = (idx, value) => {
    const newSteps = [...(draft.pasoAPaso || [])];
    newSteps[idx] = value;
    updateDraft({ pasoAPaso: newSteps });
  };

  const moveStep = (idx, dir) => {
    const newSteps = [...(draft.pasoAPaso || [])];
    if (dir === 'up' && idx > 0) {
      [newSteps[idx - 1], newSteps[idx]] = [newSteps[idx], newSteps[idx - 1]];
    } else if (dir === 'down' && idx < newSteps.length - 1) {
      [newSteps[idx + 1], newSteps[idx]] = [newSteps[idx], newSteps[idx + 1]];
    }
    updateDraft({ pasoAPaso: newSteps });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
        <H2 className="text-gray-900 normal-case">{isEditing ? 'CONFIGURACIÓN DE DISPOSITIVO' : `VER DISPOSITIVO — ${draft.codigoUnico || 'SIN ID'}`}</H2>
        {isEditing && <Button onClick={onSave} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Equipo'}</Button>}
      </div>

      {/* 1. UBICACIÓN */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <MapPin size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">1. Ubicación</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchableSelect 
            label="Cliente" 
            options={(clients || []).map(c => ({ value: c.id, label: c.nombre }))} 
            value={draft.clientId} 
            onChange={val => updateDraft({ clientId: val, branchId: '' })} 
            isDisabled={!isEditing} 
            icon={Building2}
            required 
          />
          <SearchableSelect 
            label="Sucursal" 
            options={activeBranchOptions} 
            value={draft.branchId} 
            onChange={val => updateDraft({ branchId: val })} 
            isDisabled={!isEditing || !draft.clientId} 
            placeholder={draft.clientId ? 'Seleccionar sucursal...' : 'Primero seleccione un cliente'}
            icon={MapPin}
            required 
          />
        </div>
      </section>

      {/* 2. IDENTIFICADORES ÚNICOS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Hash size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">2. Identificadores Únicos</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input label="ID Inmotika" value={draft.idInmotika} onChange={e => updateDraft({idInmotika: e.target.value})} viewMode={!isEditing} icon={Hash} placeholder="Ej: IMK-001" />
          <Input label="Código Único" value={draft.codigoUnico} onChange={e => updateDraft({codigoUnico: e.target.value})} error={showErrors ? errors.codigoUnico : null} viewMode={!isEditing} icon={Hash} placeholder="Ej: CAM-771" required />
          <Input label="Número de Serie" value={draft.serial} onChange={e => updateDraft({serial: e.target.value})} error={showErrors ? errors.serial : null} viewMode={!isEditing} icon={Hash} placeholder="SN-9988..." required />
        </div>
      </section>

      {/* 3. CLASIFICACIÓN TÉCNICA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Monitor size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">3. Clasificación Técnica</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select label="Categoría" value={draft.categoria} onChange={e => updateDraft({categoria: e.target.value})} viewMode={!isEditing} options={[ {value:'', label:'No especificada'}, {value:'Cámara', label:'Cámara'}, {value:'Sensor', label:'Sensor'}, {value:'Panel', label:'Panel'} ]} />
          <Input label="Proveedor" value={draft.proveedor} onChange={e => updateDraft({proveedor: e.target.value})} viewMode={!isEditing} />
          <Input label="Marca" value={draft.marca} onChange={e => updateDraft({marca: e.target.value})} viewMode={!isEditing} />
          <Input label="Línea" value={draft.linea} onChange={e => updateDraft({linea: e.target.value})} viewMode={!isEditing} placeholder="Ej: Industrial / Residencial" />
          <Input label="Modelo" value={draft.modelo} onChange={e => updateDraft({modelo: e.target.value})} viewMode={!isEditing} />
          <Input label="Dirección IMAC" value={draft.imac} onChange={e => updateDraft({imac: e.target.value})} viewMode={!isEditing} icon={Navigation2} placeholder="00:1A:2B:..." />
        </div>
      </section>

      {/* 4. GESTIÓN DE PROPIEDAD */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <User size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">4. Gestión de Propiedad</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select label="Dueño" value={draft.dueno} onChange={e => updateDraft({dueno: e.target.value})} viewMode={!isEditing} options={[{value:'', label:'No especificado'}, {value:'Inmotika', label:'Inmotika'}, {value:'Cliente', label:'Cliente'}]} icon={User} />
          <Select label="Estado" value={draft.estatus} onChange={e => updateDraft({estatus: e.target.value})} viewMode={!isEditing} options={[{value:'Activo', label:'Activo'}, {value:'Inactivo', label:'Inactivo'}, {value:'Mantenimiento', label:'Mantenimiento'}]} icon={Activity} />
        </div>
      </section>

      {/* 5. MANTENIMIENTO PREVENTIVO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <ClipboardList size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">5. Mantenimiento Preventivo (Configuración)</Label>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Input label="Frecuencia / Tiempo" value={draft.frecuencia} onChange={e => updateDraft({frecuencia: e.target.value})} viewMode={!isEditing} placeholder="Ej: cada 6 meses / Anual" icon={Timer} />
          <div>
            <Label className="block mb-2">Notas Técnicas</Label>
            {isEditing ? (
              <textarea 
                className="w-full p-3 border border-gray-200 rounded-lg min-h-[80px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={draft.notasTecnicas || draft.notas || ''}
                onChange={e => updateDraft({notasTecnicas: e.target.value, notas: e.target.value})}
              />
            ) : (
              <Card className="p-4 bg-gray-50/50"><TextSmall className="text-gray-600">{draft.notasTecnicas || draft.notas || 'Sin notas.'}</TextSmall></Card>
            )}
          </div>
          
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gray-500" />
                <Subtitle className="uppercase text-gray-600 font-semibold text-[11px] tracking-wide">Pasos del Mantenimiento</Subtitle>
              </div>
              {isEditing && <IconButton icon={Plus} onClick={addStep} title="Añadir paso" className="hover:text-primary" />}
            </div>
            
            <div className="space-y-2">
              {!(draft.pasoAPaso?.length) ? (
                <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center">
                  <TextSmall className="text-gray-400 italic">No hay pasos configurados</TextSmall>
                </div>
              ) : (
                draft.pasoAPaso.map((step, idx) => (
                  <div key={idx} className="flex flex-row items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex flex-col gap-1 text-gray-300">
                      {isEditing && <button onClick={() => moveStep(idx, 'up')} disabled={idx===0} className="hover:text-primary -mb-1"><ChevronUp size={14}/></button>}
                      <span className="font-bold text-gray-400 text-xs text-center w-full">{idx + 1}</span>
                      {isEditing && <button onClick={() => moveStep(idx, 'down')} disabled={idx===draft.pasoAPaso.length-1} className="hover:text-primary -mt-1"><ChevronDown size={14}/></button>}
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <input className="w-full bg-transparent text-sm text-gray-700 outline-none font-medium" value={step} onChange={e => updateStep(idx, e.target.value)} placeholder="Descripción del paso..." />
                      ) : (
                        <TextSmall className="font-medium text-gray-700">{step}</TextSmall>
                      )}
                    </div>
                    {isEditing && <IconButton icon={Trash2} onClick={() => removeStep(idx)} className="text-gray-300 hover:text-red-500" size={16} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRAZABILIDAD */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <ArrowRightLeft size={18} className="text-gray-600" />
          <Label className="text-[11px] text-gray-700 tracking-wide">6. Trazabilidad</Label>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft size={14} className="text-gray-400" />
              <Label className="uppercase text-[10px] tracking-wider text-gray-500">Historial de Traslados entre Sucursales</Label>
            </div>
            <Card className="p-0 border-none overflow-hidden shadow-sm">
              <Table>
                <THead variant="dark"><tr><Th>Fecha</Th><Th>Origen</Th><Th>Destino</Th></tr></THead>
                <TBody>
                  {!(draft.historialTraslados?.length) ? (
                    <Tr><Td colSpan={3} className="text-center py-4"><TextSmall className="italic text-gray-400">Sin traslados</TextSmall></Td></Tr>
                  ) : (
                    draft.historialTraslados.map((h, i) => (
                      <Tr key={i}><Td><TextSmall>{h.fecha}</TextSmall></Td><Td><TextSmall>{h.origen}</TextSmall></Td><Td><TextSmall>{h.destino}</TextSmall></Td></Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </Card>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-gray-400" />
              <Label className="uppercase text-[10px] tracking-wider text-gray-500">Historial de Visitas Técnicas Realizadas</Label>
            </div>
            <Card className="p-0 border-none overflow-hidden shadow-sm">
              <Table>
                <THead variant="dark"><tr><Th>Fecha</Th><Th>Técnico</Th><Th>Tipo / Obs.</Th></tr></THead>
                <TBody>
                  {!(draft.historialVisitas?.length) ? (
                    <Tr><Td colSpan={3} className="text-center py-4"><TextSmall className="italic text-gray-400">No hay registros</TextSmall></Td></Tr>
                  ) : (
                    draft.historialVisitas.map((h, i) => (
                      <Tr key={i}><Td><TextSmall>{h.fecha}</TextSmall></Td><Td><TextSmall>{h.tecnico}</TextSmall></Td><Td><TextSmall>{h.observaciones}</TextSmall></Td></Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeviceForm;
