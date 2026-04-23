/**
 * Card — superficie contenedora del Design System Inmotika.
 *
 * @typedef {'default'|'brand-top'|'glass'|'elevated'|'flat'} CardVariant
 *
 * @param {object}      props
 * @param {CardVariant} [props.variant='default']
 * @param {string}      [props.className]
 * @param {Function}    [props.onClick]
 * @param {React.ReactNode} props.children
 */
const CARD_VARIANTS = {
  default:       'bg-white shadow-(--shadow-card)',
  elevated:      'bg-white shadow-(--shadow-elevated)',
  flat:          'bg-gray-50/80',
  glass:         'bg-white/72 backdrop-blur-xl border border-white/60 shadow-(--shadow-card)',
  'brand-top':   'bg-white shadow-(--shadow-card) border-t-2 border-t-brand',
};

const Card = ({ children, className = '', onClick, variant = 'default' }) => {
  const base        = CARD_VARIANTS[variant] ?? CARD_VARIANTS.default;
  const interactive = onClick
    ? 'cursor-pointer hover:shadow-(--shadow-elevated) hover:-translate-y-0.5 active:scale-[0.99] active:shadow-(--shadow-card)'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl overflow-hidden transition-all duration-(--transition-smooth) ${base} ${interactive} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
