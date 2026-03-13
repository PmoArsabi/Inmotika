import React, { useRef, useState } from 'react';
import { CheckCircle2, UploadCloud, ExternalLink, Loader2 } from 'lucide-react';
import { Label } from './Typography';
import { supabase } from '../../utils/supabase';

/**
 * FileUploader — integrado con Supabase Storage (bucket privado).
 *
 * Props:
 *   label         — etiqueta visible
 *   bucket        — nombre del bucket (default: 'inmotika')
 *   storagePath   — ruta destino en el bucket (ej: 'tecnicos/uuid/cedula.pdf')
 *   value         — ruta actualmente almacenada (vacío = sin archivo)
 *   onChange(path)— callback con la ruta después del upload
 *   accept        — MIME types permitidos
 *   viewMode      — solo lectura
 *   dark          — tema oscuro
 */
const FileUploader = ({
  label,
  bucket = 'inmotika',
  storagePath,
  value,
  onChange,
  accept = 'application/pdf,image/*',
  viewMode = false,
  dark = false,
  className = '',
  deferred = false,
}) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // If deferred, the value might be a File object from a local selection
  const isLoaded = !!value;
  const isLocalFile = value instanceof File;
  const canUpload = !!storagePath && !uploading;

  const handleClick = () => {
    if (!canUpload && !deferred) return; // If deferred, storagePath might not be needed yet
    setUploadError(null);
    fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (deferred) {
      // In deferred mode, we just pass the File object back
      onChange?.(file);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    if (!storagePath) return;

    setUploading(true);
    setUploadError(null);

    try {
      const { error: err } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { upsert: true, cacheControl: '3600' });

      if (err) throw err;
      onChange?.(storagePath);
    } catch (err) {
      console.error('FileUploader upload error:', err);
      setUploadError('Error al subir. Intenta de nuevo.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleView = async (e) => {
    e?.stopPropagation();
    if (!value) return;
    try {
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(value, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('FileUploader view error:', err);
    }
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && <Label className="ml-1">{label}</Label>}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {viewMode ? (
        <div
          className={`flex items-center gap-3 px-4 h-14 rounded-md ${
            isLoaded
              ? 'bg-green-50 text-green-700'
              : dark ? 'bg-[#2A2A2A] text-gray-500' : 'bg-gray-50 text-gray-500'
          }`}
        >
          {isLoaded ? <CheckCircle2 size={16} /> : <UploadCloud size={16} />}
          <span className="text-xs font-bold uppercase tracking-normal flex-1">
            {isLoaded ? 'Documento Cargado' : 'No Cargado'}
          </span>
          {isLoaded && (
            <button
              type="button"
              onClick={handleView}
              className="p-1 rounded hover:bg-green-100 transition-colors"
              title="Ver documento"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div
            onClick={handleClick}
            className={`h-14 border-2 border-dashed rounded-md flex items-center justify-center gap-3 transition-all select-none ${
              !canUpload ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              isLoaded
                ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                : dark
                  ? 'border-gray-600 bg-[#2A2A2A] text-gray-400 hover:border-[#D32F2F]'
                  : 'border-gray-300 bg-gray-50 hover:border-[#D32F2F] hover:bg-gray-100 text-gray-500'
            }`}
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isLoaded ? (
              <CheckCircle2 size={18} />
            ) : (
              <UploadCloud size={18} />
            )}
            <span className="text-xs font-bold uppercase tracking-normal">
              {uploading ? 'Subiendo...' : isLocalFile ? 'Listo Para Guardar' : (isLoaded ? 'Documento Listo' : 'Subir Archivo')}
            </span>
            {isLoaded && !uploading && !isLocalFile && (
              <button
                type="button"
                onClick={handleView}
                className="p-1 rounded hover:bg-green-100 transition-colors shrink-0"
                title="Ver documento"
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {uploadError && (
        <span className="text-xs text-red-500 font-bold ml-1">{uploadError}</span>
      )}
    </div>
  );
};

export default FileUploader;
