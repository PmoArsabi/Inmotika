import { User, Briefcase, Smartphone, Mail } from 'lucide-react';
import Input from '../ui/Input';

const ContactoForm = ({ editingItem, isViewMode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Input 
        name="nombre" 
        label="Nombre Completo" 
        icon={User} 
        defaultValue={editingItem?.nombre} 
        viewMode={isViewMode} 
        required 
      />
      <Input 
        name="cargo" 
        label="Cargo" 
        icon={Briefcase} 
        defaultValue={editingItem?.cargo} 
        viewMode={isViewMode} 
      />
      <Input 
        name="celular" 
        label="Celular" 
        icon={Smartphone} 
        defaultValue={editingItem?.celular} 
        viewMode={isViewMode} 
      />
      <Input 
        name="email" 
        label="Email" 
        icon={Mail} 
        defaultValue={editingItem?.email} 
        viewMode={isViewMode} 
      />
    </div>
  );
};

export default ContactoForm;
