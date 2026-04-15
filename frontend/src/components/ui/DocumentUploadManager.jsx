import { useState } from 'react';
import { Plus, Trash2, Loader2, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { useUserDocuments } from '../../hooks/useUserDocuments';
import { openDocumentoSignedUrl } from '../../api/usuarioDocumentoApi';
import { useConfirm } from '../../context/ConfirmContext';
import { useCatalog } from '../../hooks/useCatalog';

/** Estado inicial de un documento nuevo. */
const emptyDoc = () => ({ nombre: '', tipo: '', file: null });

/**
 * Gestión completa de documentos del usuario (crear, ver, eliminar).
 * Diseñado para integrarse dentro del modal de perfil.
 *
 * @param {Object}  props
 * @param {string}  props.usuarioId - ID del usuario cuyos documentos se gestionan
 * @param {boolean} [props.canManage=false] - Si true, muestra controles de alta/baja
 */
const DocumentUploadManager = ({ usuarioId, canManage = false }) => {
  const { documentos, loading, saving, create, remove } = useUserDocuments(usuarioId);
  const { options: tipoOptions, loading: loadingTipos } = useCatalog('TIPO_DOCUMENTO_USUARIO');
  const confirm = useConfirm();

  const [adding,   setAdding]   = useState(false);
  const [draft,    setDraft]    = useState(emptyDoc());
  const [error,    setError]    = useState(null);
  const [opening,  setOpening]  = useState(null);

  const handleOpen = async (doc) => {
    if (!doc.url) return;
    setOpening(doc.id);
    try {
      const url = await openDocumentoSignedUrl(doc.url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('No se pudo abrir el documento. Intenta de nuevo.');
    } finally {
      setOpening(null);
    }
  };

  const handleAdd = async () => {
    setError(null);
    if (!draft.nombre.trim()) { setError('El nombre del documento es requerido.'); return; }
    if (!draft.tipo) { setError('Selecciona el tipo de documento.'); return; }

    try {
      await create({ nombre: draft.nombre.trim(), tipo: draft.tipo, file: draft.file });
      setDraft(emptyDoc());
      setAdding(false);
    } catch (e) {
      setError(e.message || 'Error al guardar el documento.');
    }
  };

  const handleRemove = async (doc) => {
    const ok = await confirm({
      title: 'Eliminar documento',
      message: `¿Eliminar "${doc.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await remove(doc.id, doc.url);
    } catch (e) {
      setError(e.message || 'Error al eliminar el documento.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista existente */}
      {documentos.length === 0 && !adding && (
        <p className="text-xs italic text-gray-400">Sin documentos registrados.</p>
      )}

      <ul className="space-y-1.5">
        {documentos.map(doc => (
          <li key={doc.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 group">
            <FileText size={13} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{doc.nombre}</p>
              <p className="text-[10px] text-gray-400">
                {tipoOptions.find(t => t.codigo === doc.tipo)?.label || doc.tipo}
              </p>
            </div>
            {doc.url && (
              <button
                type="button"
                onClick={() => handleOpen(doc)}
                disabled={opening === doc.id}
                title="Ver documento"
                className="p-1.5 rounded text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {opening === doc.id
                  ? <Loader2 size={13} className="animate-spin" />
                  : <ExternalLink size={13} />
                }
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => handleRemove(doc)}
                disabled={saving}
                title="Eliminar"
                className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Formulario inline de nuevo documento */}
      {canManage && adding && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nombre del documento"
              value={draft.nombre}
              onChange={e => setDraft(p => ({ ...p, nombre: e.target.value }))}
              className="col-span-2 h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
            />
            <select
              value={draft.tipo}
              onChange={e => setDraft(p => ({ ...p, tipo: e.target.value }))}
              className="h-9 px-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
              disabled={loadingTipos}
            >
              <option value="">Tipo de documento...</option>
              {tipoOptions.map(t => <option key={t.value} value={t.codigo}>{t.label}</option>)}
            </select>
            <label className="flex items-center justify-center h-9 px-2 text-xs border border-gray-300 rounded-md bg-white cursor-pointer hover:border-[#D32F2F] transition-colors truncate">
              {draft.file ? draft.file.name : 'Adjuntar PDF…'}
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={e => setDraft(p => ({ ...p, file: e.target.files?.[0] || null }))}
              />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 rounded px-2.5 py-1.5">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setAdding(false); setDraft(emptyDoc()); setError(null); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#D32F2F] hover:bg-[#B71C1C] rounded-md transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Error fuera del formulario (ej: al abrir/eliminar) */}
      {error && !adding && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 rounded px-2.5 py-1.5">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {canManage && !adding && (
        <button
          type="button"
          onClick={() => { setAdding(true); setError(null); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#D32F2F] hover:text-[#B71C1C] transition-colors"
        >
          <Plus size={13} /> Agregar documento
        </button>
      )}
    </div>
  );
};

export default DocumentUploadManager;
