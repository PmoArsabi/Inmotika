import { Eye, Edit2, Edit, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import { TextSmall, TextTiny } from '../ui/Typography';
import VisitStatusBadge from './VisitStatusBadge';
import { TechnicianChipList } from '../ui/TechnicianChip';

/**
 * Card mobile reutilizable para mostrar una visita o solicitud en listas.
 * Mismo layout que GenericListView mobile cards: badges arriba, divide-y detalles, acciones footer.
 *
 * @param {object}   visita           - Objeto visita/solicitud con campos estándar
 * @param {string}   [tipoCodigo]     - Código del tipo de visita (PREVENTIVO, CORRECTIVO…)
 * @param {string}   [tipoLabel]      - Etiqueta legible del tipo de visita
 * @param {string}   [fechaDisplay]   - ISO string de fecha a mostrar
 * @param {string}   estadoCodigo     - Código de estado para el badge
 * @param {string[]} [tecnicos]       - Nombres de técnicos asignados
 * @param {number}   [totalDevices]   - Total de dispositivos
 * @param {number}   [completedDevices] - Dispositivos completados (para la barra de progreso)
 * @param {Array}    actions          - [{ label, icon: LucideIcon, onClick, colorClass }]
 */
const VisitaMobileCard = ({
  visita,
  tipoCodigo,
  tipoLabel,
  fechaDisplay,
  estadoCodigo,
  tecnicos = [],
  totalDevices,
  completedDevices,
  actions = [],
}) => {
  const tipoBgClass = tipoCodigo === 'PREVENTIVO'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-orange-100 text-orange-700';

  return (
    <Card className="p-5 border border-gray-200 shadow-sm rounded-2xl">
      {/* ── Detalles con divide-y (mismo patrón que GenericListView) ── */}
      <div className="divide-y divide-gray-50 mb-4">

        {/* Cliente */}
        <div className="flex items-start gap-3 py-2.5 first:pt-0">
          <TextTiny className="text-gray-400 shrink-0 pt-px w-28 font-bold uppercase tracking-wide leading-tight">Cliente</TextTiny>
          <div className="flex-1 min-w-0">
            <TextSmall className="font-bold text-gray-900">{visita.clienteNombre || '—'}</TextSmall>
            <TextTiny className="text-gray-400">{visita.sucursalNombre || ''}</TextTiny>
          </div>
        </div>

        {/* Tipo */}
        {(tipoLabel || tipoCodigo) && (
          <div className="flex items-start gap-3 py-2.5">
            <TextTiny className="text-gray-400 shrink-0 pt-px w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
            <div className="flex-1 min-w-0">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tipoBgClass}`}>
                {tipoLabel || tipoCodigo}
              </span>
            </div>
          </div>
        )}

        {/* Estado */}
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-px w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
          <div className="flex-1 min-w-0">
            <VisitStatusBadge status={estadoCodigo} />
          </div>
        </div>

        {/* Fecha */}
        {fechaDisplay && (
          <div className="flex items-start gap-3 py-2.5">
            <TextTiny className="text-gray-400 shrink-0 pt-px w-28 font-bold uppercase tracking-wide leading-tight">Fecha</TextTiny>
            <TextTiny className="text-gray-600 font-semibold flex-1">
              {new Date(fechaDisplay).toLocaleDateString('es-ES')}{' '}
              {new Date(fechaDisplay).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </TextTiny>
          </div>
        )}

        {/* Técnicos */}
        {tecnicos.length > 0 && (
          <div className="flex items-start gap-3 py-2.5">
            <TextTiny className="text-gray-400 shrink-0 pt-px w-28 font-bold uppercase tracking-wide leading-tight">Técnico(s)</TextTiny>
            <div className="flex-1 min-w-0">
              <TechnicianChipList names={tecnicos} />
            </div>
          </div>
        )}

        {/* Dispositivos */}
        {totalDevices > 0 && (
          <div className="flex items-start gap-3 py-2.5 last:pb-0">
            <TextTiny className="text-gray-400 shrink-0 pt-px w-28 font-bold uppercase tracking-wide leading-tight">Dispositivos</TextTiny>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D32F2F] rounded-full transition-all"
                  style={{ width: `${((completedDevices ?? 0) / totalDevices) * 100}%` }}
                />
              </div>
              <TextTiny className="text-gray-400 shrink-0">{completedDevices ?? 0}/{totalDevices}</TextTiny>
            </div>
          </div>
        )}

      </div>

      {/* ── Acciones ── */}
      {actions.length > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors text-xs font-semibold ${
                action.colorClass || 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {action.icon && <action.icon size={14} />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default VisitaMobileCard;
