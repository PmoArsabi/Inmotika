import React from 'react';
import { TextTiny } from './Typography';

const StatusBadge = ({ status, className = "" }) => {
  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'finalizada':
      case 'completada':
      case 'activo':
      case 'alta':
        return 'bg-green-100 text-green-600';
      case 'pendiente':
      case 'en proceso':
      case 'programada':
      case 'media':
        return 'bg-yellow-100 text-yellow-600';
      case 'cancelada':
      case 'inactivo':
      case 'baja':
      case 'crítica':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <TextTiny className={`px-2 py-0.5 rounded-md inline-block ${getStatusColor(status)} ${className}`}>
      {status}
    </TextTiny>
  );
};

export default StatusBadge;
