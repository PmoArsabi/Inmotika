import React from 'react';
import { Camera, CheckCircle2, AlertTriangle, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import Card from '../ui/Card';
import InfoField from '../ui/InfoField';
import { H3, Label, TextSmall, TextTiny } from '../ui/Typography';

const DeviceReportCard = ({ device, onStatusChange, onObservationChange }) => {
  return (
    <Card className="p-4 border-l-4 border-gray-200 hover:border-[#D32F2F] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-md text-gray-500 group-hover:text-[#D32F2F] group-hover:bg-red-50 transition-colors">
            <Camera size={20} />
          </div>
          <div>
            <H3 className="text-sm">{device.tipo} - {device.modelo}</H3>
            <Label className="text-gray-400">{device.ubicacion}</Label>
          </div>
        </div>
        <div className="flex gap-1">
          {['Operativo', 'Falla', 'Mantenimiento'].map(status => (
            <button
              key={status}
              onClick={() => onStatusChange(device.id, status)}
              className={`px-2 py-1 rounded-md transition-all border ${
                device.estado === status
                  ? status === 'Operativo' ? 'bg-green-50 text-green-600 border-green-200' 
                  : status === 'Falla' ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
              }`}
            >
              <TextTiny>{status}</TextTiny>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
        <InfoField label="Serial" value={device.serial} />
        <InfoField label="Último Mant." value={device.ultimoMantenimiento} icon={Clock} />
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5 text-gray-500">
              <FileText size={12} />
              <Label>Observaciones Técnicas</Label>
            </div>
            <TextTiny className="text-gray-300">{device.observaciones?.length || 0}/500</TextTiny>
          </div>
          <textarea
            value={device.observaciones || ''}
            onChange={(e) => onObservationChange(device.id, e.target.value)}
            placeholder="Describa el estado del dispositivo o hallazgos importantes..."
            className="w-full text-xs font-medium bg-white border border-gray-200 rounded-md p-2 h-20 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/10 focus:border-[#D32F2F] resize-none placeholder:text-gray-300"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-gray-500 mb-2">
            <ImageIcon size={12} />
            <Label>Evidencia Fotográfica</Label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-[#D32F2F] hover:text-[#D32F2F] hover:bg-red-50 transition-all">
              <Camera size={16} />
              <TextTiny>Agregar</TextTiny>
            </button>
            {/* Mock de fotos */}
            {[1, 2].map(i => (
              <div key={i} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md border border-gray-200 relative group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                   <TextTiny>Foto {i}</TextTiny>
                </div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <TextTiny className="text-white">Ver</TextTiny>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeviceReportCard;
