import { CheckCircle2, UploadCloud } from 'lucide-react';
import { Label } from './Typography';

const FileUploader = ({ label, type, isLoaded, viewMode = false, onLoad }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <Label className="ml-1">{label}</Label>}
    {viewMode ? (
      <div className={`flex items-center gap-3 px-4 h-14 rounded-md ${isLoaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
        {isLoaded ? <CheckCircle2 size={16} /> : <UploadCloud size={16} />}
        <span className="text-xs font-bold uppercase tracking-normal">
          {isLoaded ? 'Documento Cargado' : 'No Cargado'}
        </span>
      </div>
    ) : (
      <div
        onClick={() => onLoad && onLoad(type)}
        className={`h-14 border-2 border-dashed rounded-md flex items-center justify-center gap-3 cursor-pointer transition-all select-none ${
          isLoaded
            ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
            : 'border-gray-300 bg-gray-50 hover:border-[#D32F2F] hover:bg-gray-100 text-gray-500'
        }`}
      >
        {isLoaded ? <CheckCircle2 size={18} /> : <UploadCloud size={18} />}
        <span className="text-xs font-bold uppercase tracking-normal">
          {isLoaded ? 'Documento Listo' : 'Subir Archivo'}
        </span>
      </div>
    )}
  </div>
);

export default FileUploader;
