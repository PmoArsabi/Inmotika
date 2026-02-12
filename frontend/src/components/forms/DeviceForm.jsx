import { Plus, Trash2, Activity, RotateCcw, Timer } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Card from '../ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { Subtitle, TextSmall } from '../ui/Typography';

const DispositivoForm = ({ 
  editingItem, 
  isViewMode, 
  maintenanceSteps, 
  setMaintenanceSteps, 
  currentStepText, 
  setCurrentStepText, 
  addStep 
}) => {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Select 
          className="md:col-span-2" 
          name="tipo" 
          label="Categoría" 
          defaultValue={editingItem?.tipo} 
          viewMode={isViewMode} 
          options={[
            { value: 'Cámara', label: 'Cámara IP' }, 
            { value: 'Sensor', label: 'Sensor Mov.' }, 
            { value: 'Panel', label: 'Panel Control' }
          ]} 
        />
        <Input 
          className="md:col-span-2" 
          name="modelo" 
          label="Modelo Técnico" 
          defaultValue={editingItem?.modelo} 
          viewMode={isViewMode} 
          required 
        />
        <Input 
          name="serial" 
          label="Número Serie" 
          defaultValue={editingItem?.serial} 
          viewMode={isViewMode} 
          required 
        />
        <Input 
          name="codigoUnico" 
          label="Cod. Único" 
          defaultValue={editingItem?.codigoUnico} 
          viewMode={isViewMode} 
          required 
        />
        <Input 
          name="marca" 
          label="Marca" 
          defaultValue={editingItem?.marca} 
          viewMode={isViewMode} 
        />
        <Input 
          name="proveedor" 
          label="Proveedor" 
          defaultValue={editingItem?.proveedor} 
          viewMode={isViewMode} 
        />
        <Input 
          name="linea" 
          label="Línea" 
          defaultValue={editingItem?.linea} 
          viewMode={isViewMode} 
        />
        <Input 
          name="imac" 
          label="IMAC (MAC)" 
          icon={Activity} 
          defaultValue={editingItem?.imac} 
          viewMode={isViewMode} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
        <Select 
          label="Mantenimiento Preventivo" 
          icon={RotateCcw} 
          defaultValue={editingItem?.mantenimiento} 
          viewMode={isViewMode} 
          options={[
            { value: 'Mensual', label: 'Cada Mes' }, 
            { value: 'Anual', label: 'Anual' }
          ]} 
        />
        <Input 
          name="tiempoPromedio" 
          label="Tiempo Estimado (Min)" 
          icon={Timer} 
          type="number" 
          defaultValue={editingItem?.tiempoPromedio} 
          viewMode={isViewMode} 
        />
      </div>

      <div className="pt-8 border-t border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <Subtitle className="uppercase text-gray-900">Pasos de Mantenimiento</Subtitle>
          {!isViewMode && (
            <div className="flex gap-2 w-1/2">
              <Input
                placeholder="Nuevo paso..."
                value={currentStepText}
                onChange={(e) => setCurrentStepText(e.target.value)}
              />
              <Button onClick={addStep} type="button"><Plus size={18} /></Button>
            </div>
          )}
        </div>
        <Card className="p-0 overflow-hidden rounded-md border border-gray-100">
          <Table>
            <THead>
              <tr>
                <Th>#</Th>
                <Th>Descripción del Paso</Th>
                {!isViewMode && <Th align="right">Acción</Th>}
              </tr>
            </THead>
            <TBody>
              {maintenanceSteps.length === 0 ? (
                <Tr>
                  <Td colSpan={!isViewMode ? 3 : 2} className="text-center py-8">
                    <TextSmall className="text-gray-400 italic">No hay pasos definidos</TextSmall>
                  </Td>
                </Tr>
              ) : (
                maintenanceSteps.map((step, idx) => (
                  <Tr key={idx}>
                    <Td className="w-12">
                      <TextSmall className="font-bold text-gray-400">{idx + 1}</TextSmall>
                    </Td>
                    <Td>
                      <input
                        className="w-full bg-transparent font-medium text-gray-700 outline-none border-none text-sm"
                        value={step}
                        disabled={isViewMode}
                        onChange={(e) => {
                          const newSteps = [...maintenanceSteps];
                          newSteps[idx] = e.target.value;
                          setMaintenanceSteps(newSteps);
                        }}
                      />
                    </Td>
                    {!isViewMode && (
                      <Td align="right">
                        <IconButton
                          icon={Trash2}
                          className="text-gray-300 hover:text-red-500"
                          onClick={() => setMaintenanceSteps(maintenanceSteps.filter((_, i) => i !== idx))}
                        />
                      </Td>
                    )}
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default DispositivoForm;
