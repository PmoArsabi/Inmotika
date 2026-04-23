/**
 * DateRangeFilter — dos inputs de fecha que van en un flex row fuera del grid.
 * Siempre juntos, se apilan solo cuando no caben (mobile muy estrecho).
 *
 * @param {string}   desde         - Valor ISO de fecha inicio (yyyy-mm-dd)
 * @param {string}   hasta         - Valor ISO de fecha fin (yyyy-mm-dd)
 * @param {Function} onDesdeChange - (e) => void
 * @param {Function} onHastaChange - (e) => void
 * @param {string}   [desdeLabel]  - Label del input inicio
 * @param {string}   [hastaLabel]  - Label del input fin
 */
const DateRangeFilter = ({
  desde = '',
  hasta = '',
  onDesdeChange,
  onHastaChange,
  desdeLabel = 'Fecha desde',
  hastaLabel = 'Fecha hasta',
}) => {
  const hasValue = desde || hasta;

  const inputClass = `w-full h-10 px-3 border rounded-md bg-white text-sm text-gray-600
    focus:outline-none transition-all cursor-pointer
    ${hasValue
      ? 'border-brand ring-2 ring-brand/10'
      : 'border-gray-300 hover:border-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10'
    }`;

  return (
    <>
      <div className="flex flex-col gap-0.5 flex-1 min-w-35">
        <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
          {desdeLabel}
        </span>
        <input
          type="date"
          value={desde}
          max={hasta || undefined}
          onChange={onDesdeChange}
          aria-label={desdeLabel}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-35">
        <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
          {hastaLabel}
        </span>
        <input
          type="date"
          value={hasta}
          min={desde || undefined}
          onChange={onHastaChange}
          aria-label={hastaLabel}
          className={inputClass}
        />
      </div>
    </>
  );
};

export default DateRangeFilter;
