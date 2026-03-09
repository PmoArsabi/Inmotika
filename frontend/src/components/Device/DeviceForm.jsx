import React, { useState } from 'react';
import { 
  Building2, MapPin, Hash, Monitor, User, Navigation2, Activity, 
  ClipboardList, Timer, CheckCircle2, ChevronUp, ChevronDown, Trash2, Plus, ArrowRightLeft, Calendar, Camera
} from 'lucide-react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SearchableSelect from '../ui/SearchableSelect';
import { H2, H3, Label, Subtitle, TextSmall } from '../ui/Typography';
import Card from '../ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';

const DeviceForm = ({
  draft, updateDraft, errors, showErrors, isEditing, 
  onSave, isSaving, clients, devices = []
}) => {
  const activeClient = (clients || []).find(c => String(c.id) === String(draft.clientId));
  const activeBranchOptions = activeClient ? (activeClient.sucursales || []).map(b => ({ value: b.id, label: b.nombre })) : [];
  
  // Opciones para ID Inmotika y Código Único basadas en dispositivos existentes
  const idInmotikaOptions = devices
    .filter(d => d.idInmotika)
    .map(d => ({ value: d.idInmotika, label: d.idInmotika }))
    .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i); // Eliminar duplicados
  
  const codigoUnicoOptions = devices
    .filter(d => d.codigoUnico)
    .map(d => ({ value: d.codigoUnico, label: d.codigoUnico }))
    .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i); // Eliminar duplicados

  const [newStepText, setNewStepText] = useState('');
  const [showNewStepInput, setShowNewStepInput] = useState(false);

  const addStep = () => {
    if (newStepText && newStepText.trim() !== '') {
      updateDraft({ pasoAPaso: [...(draft.pasoAPaso || []), newStepText.trim()] });
      setNewStepText('');
      setShowNewStepInput(false);
    }
  };

  const cancelAddStep = () => {
    setNewStepText('');
    setShowNewStepInput(false);
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

  const activeClientName = activeClient?.nombre || 'Sin cliente';
  const activeBranchName = activeClient?.sucursales?.find(b => String(b.id) === String(draft.branchId))?.nombre || 'Sin sucursal';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      {/* Left Column - Device Preview/Summary */}
      <div className="lg:col-span-1">
        <Card className="p-6 space-y-6 h-full">
          {/* Device Icon Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D32F2F] to-[#8B0000] rounded-full flex items-center justify-center shadow-lg">
                <Monitor size={32} className="text-white" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                  <Camera size={16} className="text-gray-700" />
                </button>
              )}
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-gray-900">
                {draft.codigoUnico || draft.idInmotika || 'Nuevo Dispositivo'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {draft.categoria || 'Sin categoría'}
              </p>
            </div>
          </div>

          {/* Device Info Summary */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {draft.marca && (
              <div className="flex items-start gap-3">
                <Monitor size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Marca / Modelo</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {draft.marca} {draft.modelo ? `- ${draft.modelo}` : ''}
                  </p>
                </div>
              </div>
            )}
            {draft.serial && (
              <div className="flex items-start gap-3">
                <Hash size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Número de Serie</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{draft.serial}</p>
                </div>
              </div>
            )}
            {activeClientName && (
              <div className="flex items-start gap-3">
                <Building2 size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Cliente</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{activeClientName}</p>
                </div>
              </div>
            )}
            {activeBranchName && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Sucursal</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{activeBranchName}</p>
                </div>
              </div>
            )}
            {draft.dueno && (
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <TextSmall className="text-gray-500">Dueño</TextSmall>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{draft.dueno}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                draft.estatus === 'Activo' ? 'bg-green-100 text-green-700' :
                draft.estatus === 'Inactivo' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {draft.estatus || 'Activo'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column - Form */}
      <div className="lg:col-span-2">
        <Card className="p-6 h-full flex flex-col">
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 flex-shrink-0">
              <H3 className="text-gray-700 normal-case">{isEditing ? 'Configuración de Dispositivo' : `Ver Dispositivo — ${draft.codigoUnico || 'SIN ID'}`}</H3>
              {isEditing && (
                <Button 
                  onClick={onSave} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Equipo'}
                </Button>
              )}
            </div>

            {/* Form Content */}
            <div className="space-y-6 flex-1 overflow-y-auto">

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
          <SearchableSelect 
            label="ID Inmotika" 
            options={idInmotikaOptions} 
            value={draft.idInmotika} 
            onChange={(opt) => updateDraft({idInmotika: opt?.value || ''})} 
            viewMode={!isEditing} 
            icon={Hash} 
            placeholder="Ej: IMK-001"
            isClearable
          />
          <SearchableSelect 
            label="Código Único" 
            options={codigoUnicoOptions} 
            value={draft.codigoUnico} 
            onChange={(opt) => updateDraft({codigoUnico: opt?.value || ''})} 
            error={showErrors ? errors.codigoUnico : null} 
            viewMode={!isEditing} 
            icon={Hash} 
            placeholder="Ej: CAM-771" 
            required
            isClearable
          />
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
              {isEditing && !showNewStepInput && (
                <IconButton 
                  icon={Plus} 
                  onClick={() => setShowNewStepInput(true)} 
                  title="Añadir paso" 
                  className="hover:text-primary" 
                />
              )}
            </div>
            
            {showNewStepInput && isEditing && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Descripción del paso de mantenimiento..."
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addStep();
                    } else if (e.key === 'Escape') {
                      cancelAddStep();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                  autoFocus
                />
                <Button 
                  onClick={addStep} 
                  disabled={!newStepText.trim()}
                  className="px-4 py-2 text-sm"
                >
                  Agregar
                </Button>
                <Button 
                  onClick={cancelAddStep}
                  variant="outline"
                  className="px-4 py-2 text-sm"
                >
                  Cancelar
                </Button>
              </div>
            )}
            
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeviceForm;
