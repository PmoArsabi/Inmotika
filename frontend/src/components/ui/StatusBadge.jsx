import React from 'react';
import { TextTiny } from './Typography';

/**
 * Configuración de estados de visita con clave exacta (uppercase).
 * Cubre tanto los estados del módulo de programación como los de solicitudes.
 * @type {Record<string, { label: string, classes: string }>}
 */
const STATUS_CONFIG = {
  // Estados del módulo de programación (VisitStatusBadge legacy)
  SOLICITUD:    { label: 'Solicitud',    classes: 'bg-blue-100 text-blue-700'    },
  PROGRAMADO:   { label: 'Programado',   classes: 'bg-purple-100 text-purple-700' },
  EN_CURSO:     { label: 'En curso',     classes: 'bg-yellow-100 text-yellow-700' },
  FINALIZADO:   { label: 'Finalizado',   classes: 'bg-green-100 text-green-700'  },
  CANCELADO:    { label: 'Cancelado',    classes: 'bg-red-100 text-red-700'      },
  REPROGRAMADO: { label: 'Reprogramado', classes: 'bg-orange-100 text-orange-700' },
  // Estados del módulo de solicitudes de visita
  PENDIENTE:    { label: 'Pendiente',    classes: 'bg-yellow-100 text-yellow-700' },
  PROGRAMADA:   { label: 'Programada',   classes: 'bg-purple-100 text-purple-700' },
  EN_CAMINO:    { label: 'En camino',    classes: 'bg-indigo-100 text-indigo-700' },
  EN_PROGRESO:  { label: 'En progreso',  classes: 'bg-blue-100 text-blue-700'    },
  COMPLETADA:   { label: 'Completada',   classes: 'bg-green-100 text-green-700'  },
  CANCELADA:    { label: 'Cancelada',    classes: 'bg-red-100 text-red-700'      },
};

/**
 * Resuelve clases CSS para estados legacy por string matching (lowercase).
 * Mantiene compatibilidad con StatusBadge anterior para estados genéricos.
 * @param {string} s - estado en cualquier capitalización
 * @returns {string} clases Tailwind
 */
const resolveLegacyClasses = (s) => {
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

/**
 * Badge de estado unificado. Soporta estados de visita (clave exacta uppercase)
 * y estados genéricos legacy (string matching case-insensitive).
 *
 * @param {{ status: string, className?: string }} props
 */
const StatusBadge = ({ status, className = '' }) => {
  const configEntry = STATUS_CONFIG[status];

  if (configEntry) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${configEntry.classes} ${className}`}>
        {configEntry.label}
      </span>
    );
  }

  return (
    <TextTiny className={`px-2 py-0.5 rounded-md inline-block ${resolveLegacyClasses(status)} ${className}`}>
      {status || '—'}
    </TextTiny>
  );
};

export default StatusBadge;
