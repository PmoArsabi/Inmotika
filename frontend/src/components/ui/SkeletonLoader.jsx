/**
 * Sistema de loading unificado para Inmotika.
 *
 * Usa animate-pulse con tokens del design system.
 * Exports:
 *
 * Skeletons estructurados:
 *  - SkeletonLine        — línea genérica de texto
 *  - SkeletonTableRow    — fila de tabla con N celdas
 *  - SkeletonTable       — tabla completa (rows × cols)
 *  - SkeletonCard        — tarjeta mobile con campos apilados
 *  - SkeletonListView    — estado de carga para GenericListView (tabla + cards)
 *  - SkeletonImage       — placeholder shimmer para imágenes
 *  - SkeletonKpiCard     — tarjeta KPI del dashboard
 *
 * Spinners / loaders contextuales:
 *  - LoadingSpinner      — spinner brand circular, tamaños xs/sm/md/lg
 *  - LoadingInline       — spinner centrado con texto, para áreas pequeñas
 *  - LoadingPage         — pantalla completa de carga (auth, ruta inicial)
 *  - LoadingTableCell    — spinner para celdas de tabla (colSpan)
 */

// ─── Primitivo base ───────────────────────────────────────────────────────────

const pulse = 'animate-pulse bg-gray-100 rounded-lg';

// ─── Skeletons estructurados ──────────────────────────────────────────────────

/** Línea de texto genérica. `width` acepta clases Tailwind como "w-1/2", "w-32". */
export const SkeletonLine = ({ width = 'w-full', height = 'h-3', className = '' }) => (
  <div className={`${pulse} ${width} ${height} ${className}`} />
);

/** Fila de tabla skeleton. `cols` define cuántas celdas. */
export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr className="border-b border-gray-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className={`${pulse} h-3 ${i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-8 ml-auto' : 'w-full'}`} />
      </td>
    ))}
  </tr>
);

/**
 * Tabla skeleton completa.
 * @param {{ rows?: number, cols?: number }} props
 */
export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div className="rounded-xl overflow-hidden bg-white shadow-(--shadow-card)">
    {/* Header simulado */}
    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={`${pulse} h-2.5 bg-gray-200 ${i === cols - 1 ? 'w-8 ml-auto' : 'w-2/3'}`} />
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

/** Card mobile skeleton — imita la estructura de cards auto-generadas. */
export const SkeletonCard = ({ fields = 4 }) => (
  <div className="bg-white rounded-2xl shadow-(--shadow-card) p-5 space-y-3">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-0.5">
        <div className={`${pulse} h-2.5 w-20 shrink-0`} />
        <div className={`${pulse} h-2.5 flex-1 ${i % 2 === 0 ? 'w-full' : 'w-2/3'}`} />
      </div>
    ))}
    <div className="flex gap-2 pt-3 border-t border-gray-50 mt-1">
      <div className={`${pulse} h-9 flex-1 rounded-xl`} />
      <div className={`${pulse} h-9 flex-1 rounded-xl`} />
    </div>
  </div>
);

/**
 * Estado de carga completo para GenericListView.
 * Renderiza tabla en desktop y cards en mobile.
 * @param {{ rows?: number, cols?: number, cards?: number }} props
 */
export const SkeletonListView = ({ rows = 6, cols = 5, cards = 3 }) => (
  <>
    <div className="hidden md:block">
      <SkeletonTable rows={rows} cols={cols} />
    </div>
    <div className="flex flex-col gap-4 md:hidden">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </>
);

/** Placeholder shimmer para imágenes — reemplaza el spinner en SecureImage. */
export const SkeletonImage = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 ${className}`} />
);

/** Tarjeta KPI skeleton para dashboards. */
export const SkeletonKpiCard = () => (
  <div className="bg-white rounded-2xl shadow-(--shadow-card) p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className={`${pulse} h-3 w-28`} />
      <div className={`${pulse} h-8 w-8 rounded-xl`} />
    </div>
    <div className={`${pulse} h-7 w-16`} />
    <div className={`${pulse} h-2.5 w-24`} />
  </div>
);

// ─── Spinners y loaders contextuales ─────────────────────────────────────────

const SPINNER_SIZES = {
  xs: 'w-3.5 h-3.5 border-[1.5px]',
  sm: 'w-5 h-5 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

/**
 * Spinner circular con color de marca.
 * @param {{ size?: 'xs'|'sm'|'md'|'lg', className?: string }} props
 */
export const LoadingSpinner = ({ size = 'sm', className = '' }) => (
  <div
    className={`${SPINNER_SIZES[size] ?? SPINNER_SIZES.sm} border-brand/20 border-t-brand rounded-full animate-spin shrink-0 ${className}`}
  />
);

/**
 * Spinner centrado con label de texto — para áreas de contenido pequeñas.
 * Reemplaza el LoadingInline disperso por la app.
 * @param {{ label?: string, size?: 'sm'|'md', className?: string }} props
 */
export const LoadingInline = ({ label = 'Cargando...', size = 'sm', className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
    <LoadingSpinner size={size === 'md' ? 'md' : 'sm'} />
    <p className="text-xs text-ink-muted font-medium">{label}</p>
  </div>
);

/**
 * Pantalla completa de carga — para la carga inicial de la app o rutas pesadas.
 * @param {{ label?: string }} props
 */
export const LoadingPage = ({ label = 'Cargando Inmotika...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Anillo exterior difuso */}
        <div className="w-14 h-14 rounded-full border-2 border-brand/10 absolute" />
        <LoadingSpinner size="lg" />
      </div>
      <p className="text-sm text-ink-muted font-medium">{label}</p>
    </div>
  </div>
);

/**
 * Spinner para celdas de tabla (<tr><td colSpan={n}>).
 * Reemplaza los Loader2 dispersos dentro de <tbody>.
 * @param {{ cols?: number }} props
 */
export const LoadingTableCell = ({ cols = 5 }) => (
  <tr>
    <td colSpan={cols} className="py-12 text-center">
      <div className="flex items-center justify-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-xs text-ink-muted font-medium">Cargando...</span>
      </div>
    </td>
  </tr>
);

export default SkeletonListView;
