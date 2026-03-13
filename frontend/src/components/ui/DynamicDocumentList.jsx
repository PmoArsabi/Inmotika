import { Plus, Trash2 } from 'lucide-react';
import FileUploader from './FileUploader';
import Input from './Input';
import { Label, TextTiny } from './Typography';

/**
 * A generic component for managing a dynamic list of documents.
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the list (e.g., "Certificados")
 * @param {string} props.addButtonLabel - Label for the "Add" button
 * @param {Array} props.items - Array of document objects { id, nombre, url }
 * @param {Function} props.onChange - Callback when items change
 * @param {boolean} props.viewMode - If true, restricts editing
 * @param {string} props.storagePathPrefix - Prefix for the file storage path
 * @param {string} props.itemPlaceholder - Placeholder for the name input
 */
const DynamicDocumentList = ({ 
  title, 
  addButtonLabel = 'Agregar', 
  items = [], 
  onChange, 
  viewMode = false, 
  storagePathPrefix = null,
  itemPlaceholder = 'Nombre del documento',
  renderExtraFields = null
}) => {
  const addRow = () => {
    const newItems = [...items, { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), nombre: '', url: null }];
    onChange(newItems);
  };

  const removeRow = (id) => {
    const newItems = items.filter(item => item.id !== id);
    onChange(newItems);
  };

  const updateRow = (id, patch) => {
    const newItems = items.map(item => item.id === id ? { ...item, ...patch } : item);
    onChange(newItems);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        {title && (
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            {title}
          </span>
        )}
        {!viewMode && (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-semibold text-[#D32F2F] hover:text-[#B71C1C] transition-colors ml-auto"
          >
            <Plus size={13} /> {addButtonLabel}
          </button>
        )}
      </div>

      {items.length === 0 && viewMode && (
        <p className="text-xs italic text-gray-400">Sin documentos registrados</p>
      )}

      {items.map(item => (
        <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300 transition-all space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:w-64 shrink-0">
              {viewMode ? (
                <p className="text-sm font-semibold text-gray-700 px-1 truncate">
                  {item.nombre || <span className="italic text-gray-400">Sin nombre</span>}
                </p>
              ) : (
                <Input
                  label="Descripción"
                  placeholder={itemPlaceholder}
                  value={item.nombre}
                  onChange={e => updateRow(item.id, { nombre: e.target.value.toUpperCase() })}
                  viewMode={viewMode}
                  uppercase
                  className="h-10"
                />
              )}
            </div>

            <div className="flex-1 w-full min-w-0">
              <FileUploader
                label="Documento"
                bucket="inmotika"
                storagePath={storagePathPrefix ? `${storagePathPrefix}/${item.id}.pdf` : null}
                value={item.url}
                viewMode={viewMode}
                onChange={(path) => updateRow(item.id, { url: path })}
              />
            </div>

            {!viewMode && (
              <button
                type="button"
                onClick={() => removeRow(item.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-end sm:self-center"
                title="Quitar"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {renderExtraFields && (
            <div className="pt-2 border-t border-gray-100">
              {renderExtraFields(item, (patch) => updateRow(item.id, patch))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicDocumentList;
