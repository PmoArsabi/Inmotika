/**
 * Colección de skeletons animate-pulse para perceived-performance.
 *
 * Exports:
 *  - SkeletonLine      — línea genérica de texto
 *  - SkeletonTableRow  — fila de tabla con N celdas
 *  - SkeletonTable     — tabla completa (rows × cols)
 *  - SkeletonCard      — tarjeta mobile con campos apilados
 *  - SkeletonListView  — estado de carga completo para GenericListView
 */

const base = 'animate-pulse bg-gray-200 rounded';

/** Línea de texto genérica. `width` acepta clases Tailwind como "w-1/2", "w-32". */
export const SkeletonLine = ({ width = 'w-full', height = 'h-3', className = '' }) => (
  <div className={`${base} ${width} ${height} ${className}`} />
);

/** Fila de tabla skeleton. `cols` define cuántas celdas se simulan. */
export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr className="border-b border-gray-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className={`${base} h-3 ${i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-8 ml-auto' : 'w-full'}`} />
      </td>
    ))}
  </tr>
);

/**
 * Tabla skeleton completa.
 * @param {{ rows?: number, cols?: number }} props
 */
export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div className="rounded-md border border-gray-200 overflow-hidden bg-white shadow-[var(--shadow-card)]">
    {/* Header simulado */}
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`${base} h-2.5 bg-gray-300 ${i === cols - 1 ? 'w-8 ml-auto' : 'w-2/3'}`} />
      ))}
    </div>
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

/** Card mobile skeleton — imita la estructura de auto-generated mobile card. */
export const SkeletonCard = ({ fields = 4 }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-card)] p-5 space-y-3">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-1">
        <div className={`${base} h-2.5 w-20 shrink-0`} />
        <div className={`${base} h-2.5 flex-1 ${i % 2 === 0 ? 'w-full' : 'w-2/3'}`} />
      </div>
    ))}
    <div className="flex gap-2 pt-3 border-t border-gray-100 mt-1">
      <div className={`${base} h-9 flex-1 rounded-xl`} />
      <div className={`${base} h-9 flex-1 rounded-xl`} />
    </div>
  </div>
);

/**
 * Estado de carga completo para GenericListView.
 * Renderiza tabla en desktop y cards en mobile.
 *
 * @param {{ rows?: number, cols?: number, cards?: number }} props
 */
export const SkeletonListView = ({ rows = 6, cols = 5, cards = 3 }) => (
  <>
    {/* Desktop */}
    <div className="hidden md:block">
      <SkeletonTable rows={rows} cols={cols} />
    </div>
    {/* Mobile */}
    <div className="flex flex-col gap-4 md:hidden">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </>
);

export default SkeletonListView;
