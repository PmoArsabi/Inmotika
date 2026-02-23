import { MapPin, Clock, Calendar } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import SchedulePicker from '../ui/SchedulePicker';

const SucursalForm = ({ sucursales, isViewMode, handleSucursalChange }) => {
  return (
    <div className="space-y-8">
      {sucursales.map((sucursal) => (
        <div key={sucursal.id} className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Input
              label="Nombre de Sede"
              value={sucursal.nombre}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'nombre', e.target.value)}
              placeholder="Ej: Sede Norte, Bodega 5"
              required
            />

            <Select
              label="Clasificación"
              value={sucursal.clasificacion || 'secundaria'}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'clasificacion', e.target.value)}
              options={[
                { value: 'principal', label: 'Sede Principal' },
                { value: 'secundaria', label: 'Sede Secundaria' }
              ]}
            />

            {/* Simplificado para coincidir con la lógica del cliente en el formulario de creación */}
            <Input
              label="Ciudad"
              icon={MapPin}
              value={sucursal.ciudad}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'ciudad', e.target.value)}
              required
            />

            <Input
              label="Dirección Física"
              icon={MapPin}
              value={sucursal.direccion}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'direccion', e.target.value)}
              required
            />

            <SchedulePicker
              label="Configuración de Horarios"
              value={sucursal.horario}
              viewMode={isViewMode}
              onChange={(val) => handleSucursalChange(sucursal.id, 'horario', val)}
              className="md:col-span-2 mt-4"
            />

            <Switch
              label="Estado de la Sede"
              checked={sucursal.estatus === 'activo'}
              onChange={(val) => handleSucursalChange(sucursal.id, 'estatus', val ? 'activo' : 'inactivo')}
              viewMode={isViewMode}
              className="mt-2"
            />
          </div>
          <div className="border-b border-gray-100 pb-4 last:border-0" />
        </div>
      ))}
    </div>
  );
};

export default SucursalForm;
