const STATUS_CONFIG = {
  SOLICITUD:    { label: 'Solicitud',    classes: 'bg-blue-100 text-blue-700'    },
  PROGRAMADO:   { label: 'Programado',   classes: 'bg-purple-100 text-purple-700' },
  EN_CURSO:     { label: 'En curso',     classes: 'bg-yellow-100 text-yellow-700' },
  FINALIZADO:   { label: 'Finalizado',   classes: 'bg-green-100 text-green-700'  },
  CANCELADO:    { label: 'Cancelado',    classes: 'bg-red-100 text-red-700'      },
  REPROGRAMADO: { label: 'Reprogramado', classes: 'bg-orange-100 text-orange-700' },
};

const VisitStatusBadge = ({ status, className = '' }) => {
  const cfg = STATUS_CONFIG[status] || { label: status || '—', classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.classes} ${className}`}>
      {cfg.label}
    </span>
  );
};

export default VisitStatusBadge;
