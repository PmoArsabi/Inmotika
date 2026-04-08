import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, ChevronDown, ChevronUp, Eye, Cpu, Tag, Layers, Truck, Hash } from 'lucide-react';

/**
 * DevicePickerModal — selector de dispositivos en lote con filtros, búsqueda y detalle.
 *
 * @typedef {Object} Device
 * @property {string}  value      - ID del dispositivo
 * @property {string}  label      - Texto corto (serial/idInmotika)
 * @property {string}  [serial]
 * @property {string}  [modelo]
 * @property {string}  [categoria]
 * @property {string}  [marca]
 * @property {string}  [proveedor]
 * @property {string}  [idInmotika]
 *
 * @param {boolean}   isOpen
 * @param {Function}  onClose
 * @param {Device[]}  devices      - Lista de dispositivos disponibles
 * @param {string[]}  selected     - IDs de los seleccionados actualmente
 * @param {Function}  onConfirm    - (ids: string[]) => void
 */
const DevicePickerModal = ({ isOpen, onClose, devices = [], selected = [], onConfirm }) => {
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState([]);   // array de strings
  const [marcaFilter, setMarcaFilter] = useState([]);   // array de strings
  const [draft,       setDraft]       = useState(selected);
  const [expanded,    setExpanded]    = useState(null); // device.value expandido
  const [openFilter,  setOpenFilter]  = useState(null); // 'cat' | 'marca' | null

  // ── Opciones de filtro derivadas ────────────────────────────────────────────
  const categoriaOpts = useMemo(() => {
    const s = new Set(devices.map(d => d.categoria).filter(Boolean));
    return [...s].sort().map(c => ({ value: c, label: c }));
  }, [devices]);

  const marcaOpts = useMemo(() => {
    const s = new Set(devices.map(d => d.marca).filter(Boolean));
    return [...s].sort().map(m => ({ value: m, label: m }));
  }, [devices]);

  // ── Lista filtrada ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return devices.filter(d => {
      if (catFilter.length   > 0 && !catFilter.includes(d.categoria))   return false;
      if (marcaFilter.length > 0 && !marcaFilter.includes(d.marca))     return false;
      if (q && !(
        (d.label        || '').toLowerCase().includes(q) ||
        (d.serial       || '').toLowerCase().includes(q) ||
        (d.modelo       || '').toLowerCase().includes(q) ||
        (d.idInmotika   || '').toLowerCase().includes(q) ||
        (d.categoria    || '').toLowerCase().includes(q) ||
        (d.marca        || '').toLowerCase().includes(q) ||
        (d.proveedor    || '').toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [devices, search, catFilter, marcaFilter]);

  // ── Selección ───────────────────────────────────────────────────────────────
  const toggle = (id) =>
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    const filteredIds = filtered.map(d => d.value);
    const allChecked  = filteredIds.every(id => draft.includes(id));
    if (allChecked) {
      setDraft(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setDraft(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const filteredIds   = filtered.map(d => d.value);
  const allChecked    = filteredIds.length > 0 && filteredIds.every(id => draft.includes(id));
  const someChecked   = filteredIds.some(id => draft.includes(id)) && !allChecked;

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
  };

  const handleClose = () => {
    setDraft(selected); // descarta cambios
    onClose();
  };

  const hasFilters = search || catFilter.length > 0 || marcaFilter.length > 0;

  const clearAll = () => {
    setSearch('');
    setCatFilter([]);
    setMarcaFilter([]);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-9990 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg border border-white/30">
              <Cpu size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm uppercase tracking-wide">Seleccionar Dispositivos</p>
              <p className="text-white/70 text-xs">
                {draft.length > 0 ? `${draft.length} seleccionado${draft.length !== 1 ? 's' : ''}` : 'Ninguno seleccionado'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: búsqueda + filtros */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Buscador */}
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por serial, modelo, categoría..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filtro categoría */}
            {categoriaOpts.length > 0 && (
              <PickerFilterSelect
                label="Categoría"
                icon={Tag}
                options={categoriaOpts}
                selected={catFilter}
                isOpen={openFilter === 'cat'}
                onToggle={() => setOpenFilter(prev => prev === 'cat' ? null : 'cat')}
                onClose={() => setOpenFilter(null)}
                onChange={setCatFilter}
              />
            )}

            {/* Filtro marca */}
            {marcaOpts.length > 0 && (
              <PickerFilterSelect
                label="Marca"
                icon={Layers}
                options={marcaOpts}
                selected={marcaFilter}
                isOpen={openFilter === 'marca'}
                onToggle={() => setOpenFilter(prev => prev === 'marca' ? null : 'marca')}
                onClose={() => setOpenFilter(null)}
                onChange={setMarcaFilter}
              />
            )}

            {/* Limpiar filtros */}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="h-9 px-3 text-xs text-gray-500 hover:text-[#D32F2F] border border-gray-200 rounded-lg hover:border-[#D32F2F]/30 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Cpu size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin dispositivos disponibles</p>
              <p className="text-xs mt-1">Prueba ajustando los filtros</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                <tr>
                  {/* Checkbox seleccionar todos */}
                  <th className="w-10 px-4 py-3 text-left">
                    <button
                      onClick={toggleAll}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        allChecked   ? 'bg-[#D32F2F] border-[#D32F2F]' :
                        someChecked  ? 'bg-white border-gray-400'       :
                                       'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {allChecked  && <Check size={10} className="text-white" strokeWidth={3} />}
                      {someChecked && <span className="w-2 h-0.5 bg-gray-500 rounded-full block" />}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Serial / ID</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Modelo</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Categoría</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Marca</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => {
                  const isChecked  = draft.includes(d.value);
                  const isExpanded = expanded === d.value;
                  return (
                    <>
                      <tr
                        key={d.value}
                        onClick={() => toggle(d.value)}
                        className={`cursor-pointer transition-colors group ${isChecked ? 'bg-red-50/60' : 'hover:bg-gray-50'}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => toggle(d.value)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isChecked ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-white border-gray-300 hover:border-[#D32F2F]/50'
                            }`}
                          >
                            {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                          </button>
                        </td>

                        {/* Serial / ID Inmotika */}
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-900 text-xs">{d.serial || d.label || '—'}</p>
                          {d.idInmotika && (
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Hash size={9} /> {d.idInmotika}
                            </p>
                          )}
                        </td>

                        {/* Modelo */}
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <p className="text-xs text-gray-700">{d.modelo || '—'}</p>
                        </td>

                        {/* Categoría */}
                        <td className="px-3 py-3 hidden md:table-cell">
                          {d.categoria ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              <Tag size={9} /> {d.categoria}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>

                        {/* Marca */}
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <p className="text-xs text-gray-600 font-medium">{d.marca || '—'}</p>
                        </td>

                        {/* Expand toggle */}
                        <td className="px-3 py-3" onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : d.value); }}>
                          <button className="p-1 rounded text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Row expand — detalle del dispositivo */}
                      {isExpanded && (
                        <tr key={`${d.value}-detail`} className="bg-gray-50/80">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              <DetailCell icon={Hash}     label="ID Inmotika" value={d.idInmotika} />
                              <DetailCell icon={Hash}     label="Serial"      value={d.serial} />
                              <DetailCell icon={Cpu}      label="Modelo"      value={d.modelo} />
                              <DetailCell icon={Tag}      label="Categoría"   value={d.categoria} />
                              <DetailCell icon={Layers}   label="Marca"       value={d.marca} />
                              <DetailCell icon={Truck}    label="Proveedor"   value={d.proveedor} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {filtered.length} de {devices.length} dispositivo{devices.length !== 1 ? 's' : ''}
            </span>
            {draft.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] text-xs font-bold">
                {draft.length} seleccionado{draft.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-bold text-white bg-[#D32F2F] hover:bg-[#B71C1C] rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── PickerFilterSelect ────────────────────────────────────────────────────────
/**
 * Dropdown de checkboxes para filtros internos del DevicePickerModal.
 * Misma UX que FilterSelect de FilterBar: badge de count, X para limpiar,
 * "Limpiar" en rojo al fondo del dropdown.
 *
 * @param {string}   label
 * @param {React.ElementType} icon
 * @param {{value:string, label:string}[]} options
 * @param {string[]} selected
 * @param {boolean}  isOpen
 * @param {Function} onToggle
 * @param {Function} onClose
 * @param {Function} onChange   - (newSelected: string[]) => void
 */
// eslint-disable-next-line no-unused-vars
const PickerFilterSelect = ({ label, icon: Icon, options, selected, isOpen, onToggle, onClose, onChange }) => {
  const triggerRef  = useRef(null);
  const dropdownRef = useRef(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const count       = selected.length;
  const allSelected = options.length > 0 && count === options.length;
  const someSelected = count > 0 && !allSelected;

  const displayText = count === 0
    ? label
    : count === 1
      ? (options.find(o => o.value === selected[0])?.label ?? `1 sel.`)
      : `${count} sel.`;

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const toggleOpt = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : options.map(o => o.value));
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className={[
          'flex items-center gap-1.5 h-9 px-2.5 border rounded-lg text-xs font-medium transition-all select-none',
          isOpen
            ? 'border-[#D32F2F] ring-2 ring-[#D32F2F]/20 bg-white text-[#D32F2F]'
            : count > 0
              ? 'border-[#D32F2F] bg-white text-[#D32F2F]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
        ].join(' ')}
      >
        <Icon size={12} className="shrink-0" />
        <span>{displayText}</span>
        {count > 0 && (
          <span className="flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold leading-none">
            {count}
          </span>
        )}
        {count > 0 ? (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange([]); }}
            onKeyDown={e => e.key === 'Enter' && onChange([])}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
          >
            <X size={10} />
          </span>
        ) : (
          <ChevronDown size={12} className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.max(dropPos.width, 180), zIndex: 10000 }}
          className="bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
        >
          <ul className="max-h-60 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={toggleAll}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors border-b border-gray-100
                  ${allSelected ? 'bg-red-50 text-[#D32F2F]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors
                  ${allSelected ? 'bg-[#D32F2F] border-[#D32F2F]' : 'border-gray-300 bg-white'}`}>
                  {allSelected
                    ? <Check size={10} className="text-white" strokeWidth={3} />
                    : someSelected
                      ? <span className="w-2 h-0.5 bg-gray-400 rounded-full block" />
                      : null
                  }
                </span>
                <span className="font-semibold text-gray-700">Seleccionar todo</span>
              </button>
            </li>
            {options.map(opt => {
              const isChecked = selected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => toggleOpt(opt.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                      ${isChecked ? 'bg-red-50 text-[#D32F2F]' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors
                      ${isChecked ? 'bg-[#D32F2F] border-[#D32F2F]' : 'border-gray-300 bg-white'}`}>
                      {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {count > 0 && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange([]); onClose(); }}
                className="text-xs text-[#D32F2F] hover:underline font-medium"
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Celda de detalle ──────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const DetailCell = ({ icon: IconComp, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
      <IconComp size={9} /> {label}
    </span>
    <span className="text-xs font-semibold text-gray-700">{value || <span className="text-gray-300 font-normal">—</span>}</span>
  </div>
);

export default DevicePickerModal;
