import { CheckCircle2, X } from 'lucide-react';
import { H3, TextSmall, Subtitle } from './Typography';
import Button from './Button';

/**
 * Modal overlay de resultado post-acción (éxito o error).
 * Diseño glassmorphism con header de gradiente emerald/red.
 *
 * @param {Object}   props
 * @param {boolean}  props.open            - Controla visibilidad
 * @param {boolean}  props.error           - true → header rojo + botón "Entendido"
 * @param {string}   props.title           - Título en el header
 * @param {string}   props.subtitle        - Subtítulo bajo el título (solo éxito)
 * @param {string}   [props.errorMessage]  - Mensaje de error debajo del header
 * @param {Array<{label:string, variant?:string, onClick:Function}>} props.actions
 *   Botones del footer. El primero recibe `variant="success"` por defecto en éxito.
 * @param {Function} props.onBackdropClick - Callback al hacer click en el backdrop
 */
const ActionResultModal = ({
  open,
  error = false,
  title,
  subtitle,
  errorMessage,
  actions = [],
  onBackdropClick,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {error ? (
          <>
            {/* ── Error header ─────────────────────────────────────────── */}
            <div className="bg-linear-to-br from-red-500 to-red-700 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 border-2 border-white/30">
                  <X size={32} className="text-white" />
                </div>
                <H3 className="normal-case text-white font-black text-2xl tracking-tight">
                  {title || 'Error en la operación'}
                </H3>
              </div>
            </div>
            <div className="p-6 space-y-4 text-center">
              {errorMessage && <TextSmall className="text-gray-600">{errorMessage}</TextSmall>}
              {actions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant ?? 'danger'}
                  className="w-full"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* ── Success header ────────────────────────────────────────── */}
            <div className="bg-linear-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col items-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 border-2 border-white/30 backdrop-blur-sm">
                  <CheckCircle2 size={32} />
                </div>
                <H3 className="normal-case text-white font-black text-2xl tracking-tight">{title}</H3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {subtitle && (
                <TextSmall className="text-gray-500 text-center block">{subtitle}</TextSmall>
              )}
              {actions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant ?? (i === 0 ? 'success' : 'outline')}
                  className="w-full"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionResultModal;
