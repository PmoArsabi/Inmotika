import { UserCog, MapPin, Phone } from 'lucide-react';
import Input from '../ui/Input';
import FileUploader from '../ui/FileUploader';

const TecnicoForm = ({ editingItem, isViewMode, attachedFiles, setAttachedFiles }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Input 
        name="nombre" 
        label="Nombre Completo" 
        icon={UserCog} 
        defaultValue={editingItem?.nombre} 
        viewMode={isViewMode} 
        required 
      />
      <Input 
        name="identificacion" 
        label="Documento ID" 
        defaultValue={editingItem?.identificacion} 
        viewMode={isViewMode} 
        required 
      />
      <Input 
        name="celular" 
        label="Móvil de Contacto" 
        icon={Phone} 
        defaultValue={editingItem?.celular} 
        viewMode={isViewMode} 
        required 
      />
      <Input 
        name="ciudad" 
        label="Sede de Operación" 
        icon={MapPin} 
        defaultValue={editingItem?.ciudad} 
        viewMode={isViewMode} 
        required 
      />
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
        <FileUploader 
          label="Credencial ID" 
          type="carnet" 
          isLoaded={attachedFiles.carnet} 
          viewMode={isViewMode} 
          onLoad={(type) => setAttachedFiles(p => ({ ...p, [type]: true }))} 
        />
        <FileUploader 
          label="Cert. ARL" 
          type="arl" 
          isLoaded={attachedFiles.arl} 
          viewMode={isViewMode} 
          onLoad={(type) => setAttachedFiles(p => ({ ...p, [type]: true }))} 
        />
        <FileUploader 
          label="Certificación" 
          type="matriz" 
          isLoaded={attachedFiles.matriz} 
          viewMode={isViewMode} 
          onLoad={(type) => setAttachedFiles(p => ({ ...p, [type]: true }))} 
        />
      </div>
    </div>
  );
};

export default TecnicoForm;
