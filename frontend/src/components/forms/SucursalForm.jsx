import { MapPin } from 'lucide-react';
import Input from '../ui/Input';

const SucursalForm = ({ sucursales, isViewMode, handleSucursalChange }) => {
  return (
    <div className="space-y-8">
      {sucursales.map((sucursal) => (
        <div key={sucursal.id} className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre de Sucursal"
              value={sucursal.nombre}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'nombre', e.target.value)}
            />
            <Input
              label="Ciudad"
              icon={MapPin}
              value={sucursal.ciudad}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'ciudad', e.target.value)}
            />
            <Input
              label="Dirección"
              icon={MapPin}
              value={sucursal.direccion}
              viewMode={isViewMode}
              onChange={(e) => handleSucursalChange(sucursal.id, 'direccion', e.target.value)}
              className="md:col-span-2"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SucursalForm;
