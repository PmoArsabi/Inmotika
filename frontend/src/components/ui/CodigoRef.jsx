import { TextSmall } from './Typography';

/**
 * Código corto de referencia (primeros 8 del UUID).
 * @param {string|null|undefined} id
 * @returns {string}
 */
export const toCodigoRef = (id) => (id ? String(id).slice(0, 8) : '');

/**
 * Celda / badge reutilizable para mostrar el código de visita o solicitud.
 * @param {{ id?: string|null, codigo?: string|null, className?: string }} props
 */
const CodigoRef = ({ id = null, codigo = null, className = '' }) => {
  const value = codigo || toCodigoRef(id);
  if (!value) {
    return <TextSmall className={`text-gray-300 ${className}`}>—</TextSmall>;
  }
  return (
    <TextSmall className={`font-mono font-bold text-gray-500 tracking-wide ${className}`}>
      {value}
    </TextSmall>
  );
};

export default CodigoRef;
