import { Users, MapPin, Phone, Mail } from 'lucide-react';
import Input from '../ui/Input';

const ClienteForm = ({ editingItem, isViewMode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Input 
        name="nombre" 
        label="Razón Social" 
        icon={Users} 
        defaultValue={editingItem?.nombre} 
        viewMode={isViewMode} 
        required 
      />
      <Input 
        name="nit" 
        label="NIT / RUT" 
        defaultValue={editingItem?.nit} 
        viewMode={isViewMode} 
        required 
      />
      <div className="md:col-span-2">
        <Input 
          name="ciudad" 
          label="Ciudad Principal" 
          icon={MapPin} 
          defaultValue={editingItem?.ciudad} 
          viewMode={isViewMode} 
          required 
        />
      </div>
      <Input 
        name="direccion" 
        label="Dirección Física" 
        icon={MapPin} 
        className="md:col-span-2" 
        defaultValue={editingItem?.direccion} 
        viewMode={isViewMode} 
        required 
      />
      <Input 
        name="telefono" 
        label="Teléfono" 
        type="tel" 
        icon={Phone} 
        defaultValue={editingItem?.telefono} 
        viewMode={isViewMode} 
      />
      <Input 
        name="email" 
        label="Email Corporativo" 
        type="email" 
        icon={Mail} 
        defaultValue={editingItem?.email} 
        viewMode={isViewMode} 
      />
    </div>
  );
};

export default ClienteForm;
