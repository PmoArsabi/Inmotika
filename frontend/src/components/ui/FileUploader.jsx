import { CheckCircle2, UploadCloud } from 'lucide-react';

const FileUploader = ({ label, type, isLoaded, viewMode = false, onLoad }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    {viewMode ? (
      <div className={`flex items-center gap-3 p-3 rounded-md ${isLoaded ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
        {isLoaded ? <CheckCircle2 size={16} /> : <UploadCloud size={16} />}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {isLoaded ? 'Documento Cargado' : 'No Cargado'}
        </span>
      </div>
    ) : (
      <div
        onClick={() => onLoad && onLoad(type)}
        className={`relative h-16 border-2 border-dashed rounded-md flex items-center px-6 gap-4 cursor-pointer transition-all ${
          isLoaded
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-100 bg-gray-50 hover:border-[#D32F2F] text-gray-400'
        }`}
      >
        {isLoaded ? <CheckCircle2 size={20} /> : <UploadCloud size={20} />}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
          {isLoaded ? 'Documento Listo' : 'Subir Archivo'}
        </span>
      </div>
    )}
  </div>
);

export default FileUploader;
