import React from 'react';

/**
 * Colores por estado — dot saturado + fondo suave.
 * @type {Record<string, { label: string, dot: string, classes: string }>}
 */
const STATUS_CONFIG = {
  SOLICITUD:    { label: 'Solicitud',    dot: 'bg-blue-500',   classes: 'bg-blue-50 text-blue-700'    },
  PROGRAMADO:   { label: 'Programado',   dot: 'bg-violet-500', classes: 'bg-violet-50 text-violet-700' },
  EN_CURSO:     { label: 'En curso',     dot: 'bg-amber-500',  classes: 'bg-amber-50 text-amber-700'  },
  FINALIZADO:   { label: 'Finalizado',   dot: 'bg-emerald-500',classes: 'bg-emerald-50 text-emerald-700' },
  CANCELADO:    { label: 'Cancelado',    dot: 'bg-red-500',    classes: 'bg-red-50 text-red-700'      },
  REPROGRAMADO: { label: 'Reprogramado', dot: 'bg-orange-500', classes: 'bg-orange-50 text-orange-700' },
  PENDIENTE:    { label: 'Pendiente',    dot: 'bg-amber-500',  classes: 'bg-amber-50 text-amber-700'  },
  PROGRAMADA:   { label: 'Programada',   dot: 'bg-violet-500', classes: 'bg-violet-50 text-violet-700' },
  EN_PROGRESO:  { label: 'En progreso',  dot: 'bg-blue-500',   classes: 'bg-blue-50 text-blue-700'    },
  COMPLETADA:   { label: 'Completada',   dot: 'bg-emerald-500',classes: 'bg-emerald-50 text-emerald-700' },
  CANCELADA:    { label: 'Cancelada',    dot: 'bg-red-500',    classes: 'bg-red-50 text-red-700'      },
};

/**
 * @param {string} s
 * @returns {{ dot: string, classes: string }}
 */
const resolveLegacy = (s) => {
  switch (s?.toLowerCase()) {
    case 'finalizada':
    case 'completada':
    case 'activo':
    case 'alta':
      return { dot: 'bg-emerald-500', classes: 'bg-emerald-50 text-emerald-700' };
    case 'pendiente':
    case 'en proceso':
    case 'programada':
    case 'media':
      return { dot: 'bg-amber-500', classes: 'bg-amber-50 text-amber-700' };
    case 'cancelada':
    case 'inactivo':
    case 'baja':
    case 'crítica':
      return { dot: 'bg-red-500', classes: 'bg-red-50 text-red-700' };
    default:
      return { dot: 'bg-gray-400', classes: 'bg-gray-100 text-gray-600' };
  }
};

/**
 * Badge de estado con dot de color saturado para separación visual en listas densas.
 * @param {{ status: string, className?: string }} props
 */
const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status];
  const { dot, classes } = config ?? resolveLegacy(status);
  const label = config?.label ?? status ?? '—';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
