import { useState, useRef } from 'react';
import { Plus, Trash2, Loader2, FileText, ExternalLink, AlertCircle, RefreshCw, PenLine } from 'lucide-react';
import { useUserDocuments } from '../../hooks/useUserDocuments';
import { openDocumentoSignedUrl } from '../../api/usuarioDocumentoApi';
import { useConfirm } from '../../context/ConfirmContext';
import { useCatalog } from '../../hooks/useCatalog';
import Select from './Select';
import SignaturePadModal from './SignaturePadModal';

/** Estado inicial de un documento nuevo. */
const emptyDoc = () => ({ nombre: '', tipo: '', file: null });

const TIPO_FIRMA = 'FIRMA';

/**
 * Gestión completa de documentos del usuario (crear, ver, reemplazar, eliminar).
 * Diseñado para integrarse dentro del modal de perfil.
 *
 * @param {Object}   props
 * @param {string}   props.usuarioId            - ID del usuario cuyos documentos se gestionan
 * @param {boolean}  [props.canManage=false]    - Si true, muestra controles de alta/baja/reemplazo
 * @param {Function} [props.onSaved]            - Callback(doc, isReplace) al guardar exitosamente
 * @param {Function} [props.onError]            - Callback(message) al ocurrir un error
 */
const DocumentUploadManager = ({ usuarioId, canManage = false, onSaved, onError }) => {
  const { documentos, loading, saving, create, update, remove } = useUserDocuments(usuarioId);
  const { options: tipoOptions, loading: loadingTipos } = useCatalog('TIPO_DOCUMENTO_USUARIO');
  const confirm = useConfirm();

  const [adding,    setAdding]    = useState(false);
  const [draft,     setDraft]     = useState(emptyDoc());
  const [error,     setError]     = useState(null);
  const [opening,   setOpening]   = useState(null);
  const [replacing, setReplacing] = useState(null); // docId siendo reemplazado
  // Estado del pad de firma: 'add' | { docId, nombre, tipo } | null
  const [signPad,   setSignPad]   = useState(null);
  const replaceInputRef = useRef(null);
  // Ref al pad inline de creación para confirmar desde el botón Guardar del form
  const addPadRef = useRef(null);

  // ── Ver documento ──────────────────────────────────────────────────────────
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

  // ── Crear documento ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setError(null);
    if (!draft.nombre.trim()) { setError('El nombre del documento es requerido.'); return; }
    if (!draft.tipo)          { setError('Selecciona el tipo de documento.'); return; }

    // Para FIRMA: leer la firma directamente del pad (ref) — buildFile es async
    let file = draft.file;
    if (draft.tipo === TIPO_FIRMA) {
      if (!file && addPadRef.current) {
        file = await addPadRef.current.buildFile();
      }
      if (!file) { setError('Debes dibujar tu firma primero.'); return; }
    }

    try {
      const doc = await create({ nombre: draft.nombre.trim(), tipo: draft.tipo, file });
      setDraft(emptyDoc());
      setAdding(false);
      setSignPad(null);
      onSaved?.(doc, false);
    } catch (e) {
      const msg = e.message || 'Error al guardar el documento.';
      setError(msg);
      onError?.(msg);
    }
  };

  // ── Abrir pad de firma al seleccionar tipo FIRMA en el form de creación ───
  const handleTipoChange = (tipo) => {
    setDraft(p => ({ ...p, tipo, file: null }));
    if (tipo !== TIPO_FIRMA) setSignPad(null);
  };

  // ── Reemplazar: si es FIRMA abre pad; si no, file picker ──────────────────
  const handleReplaceClick = (doc) => {
    if (doc.tipo === TIPO_FIRMA) {
      setSignPad({ docId: doc.id, nombre: doc.nombre, tipo: doc.tipo });
    } else {
      setReplacing(doc.id);
      setTimeout(() => replaceInputRef.current?.click(), 0);
    }
  };

  // ── Pad confirmado al reemplazar ───────────────────────────────────────────
  const handleSignConfirmReplace = async (file) => {
    const ctx = signPad;
    setSignPad(null);
    if (!ctx || ctx === 'add') return;

    setError(null);
    setReplacing(ctx.docId);
    try {
      const updated = await update(ctx.docId, { nombre: ctx.nombre, tipo: ctx.tipo, file });
      onSaved?.(updated, true);
    } catch (e) {
      const msg = e.message || 'Error al reemplazar la firma.';
      setError(msg);
      onError?.(msg);
    } finally {
      setReplacing(null);
    }
  };

  // ── Reemplazar archivo normal (no firma) ───────────────────────────────────
  const handleReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !replacing) { setReplacing(null); return; }

    const doc = documentos.find(d => d.id === replacing);
    if (!doc) { setReplacing(null); return; }

    setError(null);
    try {
      const updated = await update(replacing, { nombre: doc.nombre, tipo: doc.tipo, file });
      onSaved?.(updated, true);
    } catch (e) {
      const msg = e.message || 'Error al reemplazar el documento.';
      setError(msg);
      onError?.(msg);
    } finally {
      setReplacing(null);
    }
  };

  // ── Eliminar documento ─────────────────────────────────────────────────────
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

  const esFirmaEnDraft = draft.tipo === TIPO_FIRMA;

  return (
    <div className="space-y-3">
      {/* Input oculto para reemplazar archivo no-firma */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Lista existente */}
      {documentos.length === 0 && !adding && (
        <p className="text-xs italic text-gray-400">Sin documentos registrados.</p>
      )}

      <ul className="space-y-1.5">
        {documentos.map(doc => {
          const isThisSaving = saving && replacing === doc.id;
          const esFirma = doc.tipo === TIPO_FIRMA;
          const isReplacingWithPad = signPad && signPad !== 'add' && signPad.docId === doc.id;
          return (
            <li key={doc.id} className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 group transition-colors">
                {esFirma
                  ? <PenLine size={13} className="text-brand shrink-0" />
                  : <FileText size={13} className="text-gray-400 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{doc.nombre}</p>
                  <p className="text-2xs text-gray-400">
                    {tipoOptions.find(t => t.codigo === doc.tipo)?.label || doc.tipo}
                  </p>
                </div>

                {/* Ver documento */}
                {doc.url && !isThisSaving && !isReplacingWithPad && (
                  <button
                    type="button"
                    onClick={() => handleOpen(doc)}
                    disabled={opening === doc.id}
                    title="Ver documento"
                    className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {opening === doc.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <ExternalLink size={13} />
                    }
                  </button>
                )}

                {/* Reemplazar */}
                {canManage && !isThisSaving && !isReplacingWithPad && (
                  <button
                    type="button"
                    onClick={() => handleReplaceClick(doc)}
                    disabled={saving}
                    title={esFirma ? 'Redibujar firma' : 'Reemplazar archivo'}
                    className="p-1.5 rounded text-gray-300 hover:text-brand hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}

                {/* Spinner mientras reemplaza con archivo */}
                {isThisSaving && !isReplacingWithPad && (
                  <Loader2 size={13} className="animate-spin text-gray-400 shrink-0" />
                )}

                {/* Eliminar */}
                {canManage && !isThisSaving && !isReplacingWithPad && (
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
              </div>

              {/* Pad de firma inline al reemplazar */}
              {isReplacingWithPad && (
                <div className="p-2 border-t border-gray-100">
                  <SignaturePadModal
                    title={`Redibujar firma — ${doc.nombre}`}
                    onConfirm={handleSignConfirmReplace}
                    onCancel={() => setSignPad(null)}
                  />
                </div>
              )}
            </li>
          );
        })}
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
              className="col-span-2 h-9 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
            <Select
              value={draft.tipo}
              onChange={e => handleTipoChange(e.target.value)}
              options={tipoOptions.map(t => ({ value: t.codigo, label: t.label }))}
              placeholder="Tipo de documento..."
              disabled={loadingTipos}
            />

            {/* Si es FIRMA: indicador (el pad aparece abajo inline) */}
            {esFirmaEnDraft ? (
              <div className="flex items-center justify-center gap-1.5 h-9 px-2 text-xs border border-gray-200 rounded-md bg-white text-gray-400">
                <PenLine size={12} /> Dibuja abajo
              </div>
            ) : (
              <label className="flex items-center justify-center h-9 px-2 text-xs border border-gray-300 rounded-md bg-white cursor-pointer hover:border-brand transition-colors truncate">
                {draft.file ? draft.file.name : 'Adjuntar PDF…'}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={e => setDraft(p => ({ ...p, file: e.target.files?.[0] || null }))}
                />
              </label>
            )}
          </div>

          {/* Pad inline cuando tipo es FIRMA — sin botones propios, el form tiene el Guardar */}
          {esFirmaEnDraft && (
            <SignaturePadModal
              ref={addPadRef}
              title="Dibujar firma"
              showActions={false}
              onConfirm={() => {}}
              onCancel={() => {}}
            />
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded px-2.5 py-1.5">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setAdding(false); setDraft(emptyDoc()); setError(null); setSignPad(null); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleAdd()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-dark rounded-md transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Error fuera del formulario */}
      {error && !adding && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded px-2.5 py-1.5">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {canManage && !adding && (
        <button
          type="button"
          onClick={() => { setAdding(true); setError(null); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          <Plus size={13} /> Agregar documento
        </button>
      )}
    </div>
  );
};

export default DocumentUploadManager;
