import { CheckCircle2, UploadCloud } from 'lucide-react';

const FileUploader = ({ label, type, isLoaded, onLoad }) => (
  <div className="flex flex-col gap-3 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-2">{label}</label>
    <div
      onClick={() => onLoad && onLoad(type)}
      className={`relative h-20 border-3 border-dashed rounded-[1.8rem] flex items-center px-8 gap-5 cursor-pointer transition-all ${
        isLoaded
          ? 'border-green-500 bg-green-50 text-green-700'
          : 'border-gray-100 bg-gray-50 hover:border-[#D32F2F] text-gray-400'
      }`}
    >
      {isLoaded ? <CheckCircle2 size={24} /> : <UploadCloud size={24} />}
      <span className="text-xs font-black uppercase tracking-[0.2em]">
        {isLoaded ? 'Documento Listo' : 'Subir Archivo'}
      </span>
    </div>
  </div>
);

export default FileUploader;
