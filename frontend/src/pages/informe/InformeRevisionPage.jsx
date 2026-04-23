import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, Send, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, Edit3, X, Loader2, ThumbsUp, ThumbsDown,
  Camera, ClipboardEdit, Trash2, Plus, ImagePlus,
} from 'lucide-react';
import ActionResultModal from '../../components/ui/ActionResultModal';
import { TextSmall, TextTiny } from '../../components/ui/Typography';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import InformePDFTemplate from '../../components/visits/InformePDFTemplate';
import {
  getInformeDetalle,
  fetchInformeData,
  getChatInforme,
  sendChatInforme,
  updateComentarioPaso,
  updateObservacionActividad,
  updateObservacionIntervencion,
  updateObservacionCoordinador,
  updateObservacionDirector,
  registrarRevisionDirector,
  aprobarYGenerarPDF,
  enviarInformeADirector,
  getRevisionesCoordinador,
  upsertRevisionCoordinador,
  upsertSolicitudCorrectiva,
  deleteEvidenciaInforme,
  uploadEvidenciaInforme,
} from '../../api/informeApi';
import { supabase } from '../../utils/supabase';
import { listDocumentos, openDocumentoSignedUrl } from '../../api/usuarioDocumentoApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

/** Color del avatar según nombre del rol (viene del campo rol_id.nombre en perfil_usuario) */
const ROL_AVATAR_COLOR = {
  'Administrador':      { bg: '#7c3aed', text: '#fff' },
  'Director':           { bg: '#1d4ed8', text: '#fff' },
  'Coordinador de Zona':{ bg: '#D32F2F', text: '#fff' },
  'Técnico de Campo':   { bg: '#0f766e', text: '#fff' },
};
const DEFAULT_AVATAR = { bg: '#6b7280', text: '#fff' };

const ChatAvatar = ({ nombre, rol }) => {
  const colors = ROL_AVATAR_COLOR[rol] || DEFAULT_AVATAR;
  const inicial = (nombre || '?')[0].toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
      background: colors.bg, color: colors.text,
      fontSize: '10px', fontWeight: '700', lineHeight: 1,
    }}>
      {inicial}
    </span>
  );
};

const ChatBubble = ({ msg, isMe }) => (
  <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
    <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      <ChatAvatar nombre={isMe ? 'Tú' : msg.autor_nombre} rol={msg.autor_rol} />
      <TextTiny className={`font-bold text-2xs ${isMe ? 'text-brand' : 'text-gray-600'}`}>
        {isMe ? 'Tú' : msg.autor_nombre}
      </TextTiny>
      {msg.autor_rol && (
        <span className="text-2xs text-gray-400">{msg.autor_rol}</span>
      )}
      <TextTiny className="text-gray-300 text-2xs">{fmtHora(msg.created_at)}</TextTiny>
    </div>
    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
      isMe ? 'bg-brand text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
    }`}>
      {msg.mensaje}
    </div>
  </div>
);

const ChatPanel = ({ informeId, userId }) => {
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef(null);

  const loadChat = useCallback(async () => {
    try { setMensajes(await getChatInforme(informeId)); } catch { /* silencioso */ }
  }, [informeId]);

  useEffect(() => { loadChat(); }, [loadChat]);

  useEffect(() => {
    const ch = supabase.channel(`chat_informe_${informeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_informe', filter: `informe_id=eq.${informeId}` }, () => loadChat())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [informeId, loadChat]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  const handleSend = async () => {
    const texto = input.trim();
    if (!texto || sending) return;
    setSending(true);
    try { await sendChatInforme(informeId, userId, texto); setInput(''); }
    catch { /* silencioso */ } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare size={24} className="text-gray-200" />
            <TextTiny className="text-gray-400 italic">Sin comentarios aún.</TextTiny>
          </div>
        )}
        {mensajes.map(msg => <ChatBubble key={msg.id} msg={msg} isMe={msg.autor_id === userId} />)}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all min-h-9 max-h-24"
            placeholder="Escribe un comentario interno…"
            rows={1} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button type="button" disabled={!input.trim() || sending} onClick={handleSend}
            className="p-2 rounded-xl bg-brand text-white hover:bg-brand-dark disabled:opacity-40 transition-colors shrink-0">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Editores inline (guardado inmediato al confirmar) ────────────────────────

/**
 * Editor de comentario de un paso. Guarda al confirmar (no cache).
 * @param {{ value: string|null, onSave: Function, saving: boolean }} props
 */
const ComentarioEditor = ({ value, onSave, saving, onStartEdit }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  if (!value && !editing) {
    return (
      <button type="button" onClick={() => { setDraft(''); setEditing(true); onStartEdit?.(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7.5px', color: '#9ca3af' }}
        onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
        <Plus size={9} /> Agregar obs. paso
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-2" style={{ flex: 1 }}>
        <span className="flex-1 text-[8.5px] text-[#1e40af] leading-relaxed">{value}</span>
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(true); onStartEdit?.(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-blue-100">
          <Edit3 size={9} className="text-blue-400" />
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={3}
        style={{ width: '100%', fontSize: '9px', border: '1px solid #93c5fd', borderRadius: '4px', padding: '6px 8px', resize: 'vertical', outline: 'none', background: 'white', minHeight: '60px' }}
        placeholder="Observación sobre este paso…" />
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '3px', color: '#9ca3af' }}>
          <X size={10} />
        </button>
        <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }} disabled={saving}
          style={{ background: '#3b82f6', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: '3px', color: 'white', opacity: saving ? 0.5 : 1, fontSize: '9px' }}>
          {saving ? <Loader2 size={10} className="animate-spin" /> : 'OK'}
        </button>
      </div>
    </div>
  );
};

/**
 * Editor de observación de una actividad. Guarda al confirmar.
 * @param {{ act: object, onSave: Function, saving: boolean }} props
 */
/**
 * Trigger/display inline para la obs de actividad (fuera del modo edición).
 * El modo edición se maneja en ActRow para poder usar colSpan=2.
 */
const ActividadObsEditor = ({ act, onSave, saving, editing, onStartEdit, onCancelEdit }) => {
  const [draft, setDraft] = useState(act.observacion || '');

  if (editing) {
    return (
      <div style={{ padding: '8px 10px', background: '#f0fdf4' }}>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          onKeyDown={e => { if (e.key === 'Escape') { onCancelEdit(); } }}
          style={{ width: '100%', fontSize: '9px', border: '1px solid #86efac', borderRadius: '4px', padding: '6px 10px', resize: 'vertical', outline: 'none', background: 'white', minHeight: '64px', boxSizing: 'border-box' }}
          placeholder="Observación sobre esta actividad…"
        />
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" onClick={() => { onCancelEdit(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '3px', color: '#9ca3af', fontSize: '9px' }}>
            Cancelar
          </button>
          <button type="button" onClick={() => { onSave(draft.trim() || null); onCancelEdit(); }} disabled={saving}
            style={{ background: '#22c55e', border: 'none', cursor: 'pointer', padding: '3px 12px', borderRadius: '3px', color: 'white', opacity: saving ? 0.5 : 1, fontSize: '9px', fontWeight: '700' }}>
            {saving ? <Loader2 size={9} className="animate-spin" /> : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  if (act.observacion) {
    return (
      <div className="group flex items-start gap-1.5">
        <span className="flex-1 text-2xs text-green-800 leading-relaxed">{act.observacion}</span>
        <button type="button" onClick={() => { setDraft(act.observacion || ''); onStartEdit(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-green-100">
          <Edit3 size={9} className="text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => { setDraft(''); onStartEdit(); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7.5px', color: '#9ca3af' }}
      onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
      onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
      <Plus size={9} /> Agregar obs. actividad
    </button>
  );
};

/**
 * Editor de observación de intervención (nivel dispositivo). Guarda al confirmar.
 * @param {{ value: string|null, onSave: Function, saving: boolean }} props
 */
const IntervencionObsEditor = ({ value, onSave, saving, onStartEdit }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        {value ? (
          <>
            <span className="flex-1 text-[8.5px] text-[#1e40af] leading-relaxed">
              <strong>Obs. del técnico:</strong> {value}
            </span>
            <button type="button" onClick={() => { setDraft(value); setEditing(true); onStartEdit?.(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-gray-100">
              <Edit3 size={10} className="text-gray-400" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => { setDraft(''); setEditing(true); onStartEdit?.(); }}
            className="text-[8.5px] text-gray-300 hover:text-blue-500 transition-colors flex items-center gap-1">
            <Plus size={10} /> Agregar observación del dispositivo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={3}
        className="w-full text-2xs border border-blue-300 rounded px-2 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        style={{ minHeight: '64px' }} placeholder="Observación general sobre este dispositivo…" />
      <div className="flex gap-1 justify-end">
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={10} /></button>
        <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }} disabled={saving}
          className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 text-2xs">
          {saving ? <Loader2 size={10} className="animate-spin" /> : 'OK'}
        </button>
      </div>
    </div>
  );
};

/**
 * Editor del valor de texto de la etiqueta (codigo_etiqueta). Guarda al confirmar.
 * @param {{ value: string|null, onSave: Function }} props
 */
const EtiquetaValorEditor = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  if (!editing) {
    return (
      <div className="group inline-flex items-center gap-1">
        <span style={{ fontSize: '8.5px', fontFamily: 'monospace', color: '#374151' }}>
          {value || <em style={{ color: '#9ca3af' }}>Sin valor</em>}
        </span>
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100">
          <Edit3 size={8} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <input autoFocus type="text" value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(draft.trim() || null); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
        style={{ fontSize: '8.5px', border: '1px solid #93c5fd', borderRadius: '3px', padding: '1px 6px', outline: 'none', width: '120px' }}
        placeholder="Ej: 8794-5612" />
      <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }}
        style={{ background: '#3b82f6', border: 'none', cursor: 'pointer', padding: '1px 5px', borderRadius: '3px', color: 'white', fontSize: '8px' }}>OK</button>
      <button type="button" onClick={() => setEditing(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: '#9ca3af' }}><X size={9} /></button>
    </span>
  );
};

/**
 * Editor de observación del coordinador para el PDF. Guarda al confirmar.
 * @param {{ value: string|null, onSave: Function }} props
 */
const ObsCoordinadorEditor = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  if (!editing) {
    return (
      <div className="group flex items-start gap-2" style={{ width: '100%' }}>
        {value ? (
          <>
            <span style={{ flex: 1, fontSize: '9.5px', color: '#111827', lineHeight: '1.6' }}>{value}</span>
            {onSave && (
              <button type="button" onClick={() => { setDraft(value); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-gray-200">
                <Edit3 size={11} className="text-gray-400" />
              </button>
            )}
          </>
        ) : onSave ? (
          <button type="button" onClick={() => { setDraft(''); setEditing(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', color: '#9ca3af', fontStyle: 'italic' }}
            onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
            <Plus size={11} /> Agregar observación del coordinador (aparecerá en el PDF)
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={3}
        style={{ width: '100%', fontSize: '9.5px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', resize: 'vertical', outline: 'none', background: 'white', minHeight: '70px', lineHeight: '1.6' }}
        placeholder="Escribe una observación para incluir en el PDF del informe…" />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); }}
          style={{ background: 'none', border: '1px solid #d1d5db', cursor: 'pointer', padding: '3px 10px', borderRadius: '5px', color: '#6b7280', fontSize: '9px' }}>
          Cancelar
        </button>
        <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }}
          style={{ background: '#374151', border: 'none', cursor: 'pointer', padding: '3px 12px', borderRadius: '5px', color: 'white', fontSize: '9px' }}>
          OK
        </button>
      </div>
    </div>
  );
};

/**
 * Editor de observación del director para el PDF.
 * @param {{ value: string|null, onSave: Function|null }} props
 */
const ObsDirectorEditor = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  if (!editing) {
    return (
      <div className="group flex items-start gap-2" style={{ width: '100%' }}>
        {value ? (
          <>
            <span style={{ flex: 1, fontSize: '9.5px', color: '#111827', lineHeight: '1.6' }}>{value}</span>
            {onSave && (
              <button type="button" onClick={() => { setDraft(value); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-blue-100">
                <Edit3 size={11} className="text-blue-400" />
              </button>
            )}
          </>
        ) : onSave ? (
          <button type="button" onClick={() => { setDraft(''); setEditing(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', color: '#9ca3af', fontStyle: 'italic' }}
            onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
            <Plus size={11} /> Agregar observación del director (aparecerá en el PDF)
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={3}
        style={{ width: '100%', fontSize: '9.5px', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 12px', resize: 'vertical', outline: 'none', background: 'white', minHeight: '70px', lineHeight: '1.6' }}
        placeholder="Escribe una observación del director para incluir en el PDF…" />
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); }}
          style={{ background: 'none', border: '1px solid #d1d5db', cursor: 'pointer', padding: '3px 10px', borderRadius: '5px', color: '#6b7280', fontSize: '9px' }}>
          Cancelar
        </button>
        <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }}
          style={{ background: '#1d4ed8', border: 'none', cursor: 'pointer', padding: '3px 12px', borderRadius: '5px', color: 'white', fontSize: '9px' }}>
          OK
        </button>
      </div>
    </div>
  );
};

// ─── Gestor de evidencias ─────────────────────────────────────────────────────

/**
 * @param {{ dispositivo: object, visitaId: string, onEvidenciaDeleted: Function, onEvidenciaAdded: Function }} props
 */
const EvidenciasEditor = ({ dispositivo: d, visitaId, onEvidenciaDeleted, onEvidenciaAdded }) => {
  const [savingId, setSavingId]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef              = useRef(null);
  const etqInputRef               = useRef(null);

  const handleDelete = async (evidencia, esEtiqueta) => {
    setSavingId(evidencia.id);
    try { await deleteEvidenciaInforme(evidencia.id); onEvidenciaDeleted(d.id, evidencia.id, esEtiqueta); }
    catch { /* silencioso */ } finally { setSavingId(null); }
  };

  const handleUpload = async (file, esEtiqueta) => {
    if (!file) return;
    setUploading(true);
    try {
      const nextNum = esEtiqueta ? 0 : (d.fotos?.length || 0) + 1;
      const result = await uploadEvidenciaInforme(visitaId, d.id, d.intervencion_id, file, esEtiqueta, nextNum);
      onEvidenciaAdded(d.id, result, esEtiqueta);
    } catch { /* silencioso */ } finally { setUploading(false); }
  };

  const fotoEtiqueta = d.foto_etiqueta;
  const fotos        = d.fotos || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Camera size={10} className="text-gray-400" />
        <span style={{ fontSize: '7.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>
          Evidencia fotográfica
        </span>
        {uploading && <Loader2 size={10} className="animate-spin text-gray-400" />}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {/* Etiqueta */}
        {fotoEtiqueta ? (
          <div style={{ width: '150px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => etqInputRef.current?.click()}>
              <img src={fotoEtiqueta.signedUrl} alt="Etiqueta"
                style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; e.currentTarget.firstChild.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.firstChild.style.opacity = '0'; }}>
                <span style={{ color: 'white', fontSize: '9px', fontWeight: '700', opacity: 0, transition: 'opacity 0.2s' }}>Reemplazar</span>
              </div>
            </div>
            <div style={{ background: '#f9fafb', padding: '3px 6px', fontSize: '7.5px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Etiqueta</span>
              <button type="button" onClick={() => handleDelete(fotoEtiqueta, true)} disabled={savingId === fotoEtiqueta.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#ef4444', display: 'flex' }}>
                {savingId === fotoEtiqueta.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
              </button>
            </div>
            <input ref={etqInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, true); e.target.value = ''; }} />
          </div>
        ) : (
          <div role="button" onClick={() => etqInputRef.current?.click()}
            style={{ width: '150px', height: '120px', border: '2px dashed #fbbf24', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', color: '#d97706' }}>
            <Camera size={20} />
            <span style={{ fontSize: '7.5px', fontWeight: '600' }}>Agregar etiqueta</span>
            <input ref={etqInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, true); e.target.value = ''; }} />
          </div>
        )}
        {/* Fotos */}
        {fotos.map((foto, i) => (
          <div key={foto.id} style={{ width: '150px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
            <img src={foto.signedUrl} alt={`Foto ${i + 1}`}
              style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
            <div style={{ background: '#f9fafb', padding: '3px 6px', fontSize: '7.5px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Foto {i + 1}</span>
              <button type="button" onClick={() => handleDelete(foto, false)} disabled={savingId === foto.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#ef4444', display: 'flex' }}>
                {savingId === foto.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
              </button>
            </div>
          </div>
        ))}
        {/* Agregar foto */}
        <div role="button" onClick={() => fileInputRef.current?.click()}
          style={{ width: '80px', height: '80px', border: '2px dashed #e5e7eb', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px', color: '#9ca3af' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6b7280'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
          <ImagePlus size={16} />
          <span style={{ fontSize: '7px' }}>Agregar foto</span>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, false); e.target.value = ''; }} />
        </div>
      </div>
    </div>
  );
};

// ─── Tarjeta de revisión de dispositivo ──────────────────────────────────────

/**
 * @param {{ dispositivo: object, revision: object|null, onRevisionChange: Function }} props
 */
/**
 * @param {{
 *   dispositivo: object,
 *   revision: object|null,
 *   onRevisionChange: Function,
 *   onSelect: Function,
 *   isActive: boolean,
 *   showRechazo: boolean,
 *   onToggleRechazo: Function,
 *   notaDraft: string,
 *   onNotaChange: Function,
 * }} props
 */
const DispositivoRevisionCard = ({
  dispositivo: d, revision, onRevisionChange,
  onSelect, isActive,
  showRechazo, onToggleRechazo,
  notaDraft, onNotaChange,
  isReadOnly,
}) => {
  const [saving, setSaving] = useState(false);

  const aprobado  = revision?.aprobado === true;
  const rechazado = revision?.aprobado === false;

  const handleAprobar = async () => {
    setSaving(true);
    try { await onRevisionChange(d.intervencion_id, true, null); }
    finally { setSaving(false); }
  };

  const handleConfirmarRechazo = async () => {
    setSaving(true);
    try {
      await onRevisionChange(d.intervencion_id, false, notaDraft.trim() || null);
      onToggleRechazo(false);
    }
    finally { setSaving(false); }
  };

  const nombre = [d.modelo, d.marca_nombre].filter(Boolean).join(' · ') || d.codigo_unico || d.categoria_nombre || 'Dispositivo';

  return (
    <div
      data-rev-id={d.intervencion_id}
      className={`border rounded-xl overflow-hidden transition-all ${
        isActive  ? 'border-blue-500 ring-2 ring-blue-400/30 shadow-md' :
        aprobado  ? 'border-green-300' :
        rechazado ? 'border-red-300'   : 'border-gray-200'
      }`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer ${
          isActive  ? 'bg-blue-50' :
          aprobado  ? 'bg-green-50' :
          rechazado ? 'bg-red-50'  : 'bg-gray-50'
        }`}
        onClick={onSelect}
      >
        {aprobado  && <span className="flex items-center gap-1 text-2xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0"><ThumbsUp size={9} /> Aprobado</span>}
        {rechazado && <span className="flex items-center gap-1 text-2xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0"><ThumbsDown size={9} /> Rechazado</span>}
        {!aprobado && !rechazado && <span className="text-2xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">Sin revisar</span>}
        <p className="flex-1 min-w-0 text-2xs font-bold text-gray-800 truncate">{nombre}</p>
        {!isReadOnly && (
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {saving ? <Loader2 size={13} className="animate-spin text-gray-400" /> : (
              <>
                <button type="button" onClick={handleAprobar} title="Aprobar"
                  className={`p-1.5 rounded-lg transition-colors ${aprobado ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600'}`}>
                  <ThumbsUp size={12} />
                </button>
                <button type="button"
                  onClick={() => onToggleRechazo(!showRechazo)}
                  title="Rechazar"
                  className={`p-1.5 rounded-lg transition-colors ${rechazado ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600'}`}>
                  <ThumbsDown size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showRechazo && !isReadOnly && (
        <div className="px-3 py-2 border-t border-red-100 bg-red-50/60 space-y-2">
          <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-2xs">Motivo del rechazo</TextTiny>
          <textarea autoFocus value={notaDraft} onChange={e => onNotaChange(e.target.value)} rows={2}
            placeholder="¿Qué debe corregir el técnico?"
            className="w-full text-xs border border-red-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-red-300 bg-white" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => onToggleRechazo(false)}
              className="px-2 py-1 text-2xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="button" disabled={saving} onClick={handleConfirmarRechazo}
              className="px-2 py-1 text-2xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-40">
              {saving ? 'Guardando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {rechazado && !showRechazo && revision?.nota && (
        <div className="px-3 py-1.5 border-t border-red-100 bg-red-50/40 flex items-start gap-1.5">
          <ClipboardEdit size={10} className="text-red-400 mt-0.5 shrink-0" />
          <TextTiny className="text-red-600 italic text-2xs">{revision.nota}</TextTiny>
        </div>
      )}
    </div>
  );
};

// ─── Panel de revisión ────────────────────────────────────────────────────────

/**
 * @param {{ onCorrectivaGuardada: (guardada: boolean) => void, isReadOnly: boolean, revisionesVersion: number }} props
 */
const RevisionPanel = ({ localInforme, informeId, visitaId, coordinadorId, revisiones, onRevisionChange, activeIntervencionId, onSetActive, onCrearCorrectiva, onCorrectivaGuardada, isReadOnly, revisionesVersion }) => {
  const [openRechazoId,        setOpenRechazoId]        = useState(null);
  const [notaDrafts,           setNotaDrafts]           = useState({});
  const [fechaCorrectiva,      setFechaCorrectiva]      = useState('');
  const [comentarioCorrectiva, setComentarioCorrectiva] = useState('');
  const [errorCorrectiva,      setErrorCorrectiva]      = useState('');
  const [savingCorrectiva,     setSavingCorrectiva]     = useState(false);
  const [correctivaCreada,     setCorrectivaCreada]     = useState(false);
  const [correctivaModal,      setCorrectivaModal]      = useState(null); // { isNew: boolean } | null
  const [tabActiva,            setTabActiva]            = useState('pendientes');
  // Valores guardados en DB para detectar cambios sin guardar
  const [correctivaGuardadaFecha,      setCorrectivaGuardadaFecha]      = useState('');
  const [correctivaGuardadaComentario, setCorrectivaGuardadaComentario] = useState('');

  // Cargar correctiva existente. Re-corre cuando revisionesVersion sube para re-sincronizar
  // estado tras cambios de revisión (evita race entre reset y carga async).
  useEffect(() => {
    if (!informeId) return;
    const cargar = async () => {
      let { data } = await supabase
        .from('solicitud_visita')
        .select('id, motivo, fecha_sugerida')
        .eq('informe_id', informeId)
        .maybeSingle();

      if (!data?.id && visitaId) {
        ({ data } = await supabase
          .from('solicitud_visita')
          .select('id, motivo, fecha_sugerida')
          .eq('visita_id', visitaId)
          .maybeSingle());
      }

      if (!data?.id) {
        setCorrectivaCreada(false);
        setCorrectivaGuardadaFecha('');
        setCorrectivaGuardadaComentario('');
        return;
      }
      const fecha    = data.fecha_sugerida ? data.fecha_sugerida.slice(0, 16) : '';
      const comentario = data.motivo || '';
      setCorrectivaCreada(true);
      setFechaCorrectiva(fecha);
      setComentarioCorrectiva(comentario);
      setCorrectivaGuardadaFecha(fecha);
      setCorrectivaGuardadaComentario(comentario);
    };
    cargar();
  }, [informeId, visitaId, revisionesVersion]);

  // Scroll bidireccional: cuando el activo cambia desde el PDF, desplazar la card
  useEffect(() => {
    if (!activeIntervencionId) return;
    const el = document.querySelector(`[data-rev-id="${activeIntervencionId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeIntervencionId]);

  // Cuando el dispositivo activo cambia de grupo, cambiar a su pestaña automáticamente
  useEffect(() => {
    if (!activeIntervencionId || !localInforme) return;
    const rev = revisiones[activeIntervencionId];
    if (rev === undefined) setTabActiva('pendientes');
    else if (rev.aprobado === true)  setTabActiva('aprobados');
    else setTabActiva('rechazados');
  }, [activeIntervencionId, revisiones, localInforme]);

  // Notificar al padre si la correctiva está guardada o no
  useEffect(() => { onCorrectivaGuardada?.(correctivaCreada); }, [correctivaCreada, onCorrectivaGuardada]);

  if (!localInforme) return null;

  const dispositivos = localInforme.categorias.flatMap(cat => cat.dispositivos);
  const total      = dispositivos.length;
  const revisados  = dispositivos.filter(d => revisiones[d.intervencion_id] !== undefined).length;
  const aprobados  = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === true).length;
  const rechazados = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false).length;
  const pendientes = total - revisados;

  const dispPendientes = dispositivos.filter(d => revisiones[d.intervencion_id] === undefined);
  const dispAprobados  = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === true);
  const dispRechazados = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false);

  const handleToggleRechazo = (intervencionId, revision, open) => {
    if (open) {
      setOpenRechazoId(intervencionId);
      setNotaDrafts(prev => ({ ...prev, [intervencionId]: revision?.nota || '' }));
    } else {
      setOpenRechazoId(null);
    }
  };

  const handleCrearCorrectiva = async () => {
    if (!comentarioCorrectiva.trim()) {
      setErrorCorrectiva('La observación / motivo es obligatoria.');
      return;
    }
    setErrorCorrectiva('');
    setSavingCorrectiva(true);
    try {
      const isNew = await onCrearCorrectiva(
        dispRechazados,
        revisiones,
        fechaCorrectiva || null,
        comentarioCorrectiva.trim(),
      );
      setCorrectivaCreada(true);
      setCorrectivaGuardadaFecha(fechaCorrectiva);
      setCorrectivaGuardadaComentario(comentarioCorrectiva.trim());
      setCorrectivaModal({ isNew });
    } catch (e) {
      setErrorCorrectiva(e.message || 'Error al crear la visita correctiva.');
    } finally {
      setSavingCorrectiva(false);
    }
  };

  const renderCard = (d) => (
    <DispositivoRevisionCard
      key={d.intervencion_id}
      dispositivo={d}
      informeId={informeId}
      coordinadorId={coordinadorId}
      revision={revisiones[d.intervencion_id] ?? null}
      onRevisionChange={onRevisionChange}
      isActive={activeIntervencionId === d.intervencion_id}
      onSelect={() => onSetActive(d.intervencion_id)}
      showRechazo={openRechazoId === d.intervencion_id}
      onToggleRechazo={(open) => handleToggleRechazo(d.intervencion_id, revisiones[d.intervencion_id], open)}
      notaDraft={notaDrafts[d.intervencion_id] || ''}
      onNotaChange={(val) => setNotaDrafts(prev => ({ ...prev, [d.intervencion_id]: val }))}
      isReadOnly={isReadOnly}
    />
  );

  const tabConfig = [
    { key: 'pendientes', label: 'Pendientes', count: pendientes,  color: 'amber'  },
    { key: 'aprobados',  label: 'Aprobados',  count: aprobados,   color: 'green'  },
    { key: 'rechazados', label: 'Rechazados', count: rechazados,  color: 'red'    },
  ];

  const tabColorActive = {
    amber: 'border-amber-500 text-amber-700',
    green: 'border-green-500 text-green-700',
    red:   'border-red-500 text-red-700',
  };
  const tabBadge = {
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    red:   'bg-red-100 text-red-700',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Modal confirmación visita correctiva */}
      {correctivaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {correctivaModal.isNew ? 'Visita correctiva creada' : 'Visita correctiva actualizada'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {correctivaModal.isNew
                    ? 'La solicitud de visita correctiva fue creada exitosamente. El técnico fue notificado en el chat.'
                    : 'La solicitud de visita correctiva fue actualizada con los dispositivos rechazados actuales.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCorrectivaModal(null)}
                className="mt-1 w-full py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header con contadores */}
      <div className="px-4 pt-3 pb-0 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <ClipboardEdit size={14} className="text-brand" />
          <TextSmall className="font-bold text-gray-800">Revisión de dispositivos</TextSmall>
          <TextTiny className="ml-auto text-gray-400">{revisados}/{total} revisados</TextTiny>
        </div>
        {revisados < total && (
          <div className="mb-2 text-2xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
            Debes revisar todos los dispositivos antes de enviar al director.
          </div>
        )}

        {/* Pestañas */}
        <div className="flex gap-0 -mb-px">
          {tabConfig.map(({ key, label, count, color }) => {
            const isActive = tabActiva === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTabActiva(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-2xs font-bold border-b-2 transition-colors ${
                  isActive
                    ? tabColorActive[color] + ' bg-transparent'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? tabBadge[color] : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {/* PESTAÑA: Pendientes */}
        {tabActiva === 'pendientes' && (
          dispPendientes.length === 0
            ? <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                <CheckCircle2 size={28} className="text-green-300" />
                <TextTiny className="text-gray-400">Todos los dispositivos han sido revisados.</TextTiny>
              </div>
            : dispPendientes.map(renderCard)
        )}

        {/* PESTAÑA: Aprobados */}
        {tabActiva === 'aprobados' && (
          dispAprobados.length === 0
            ? <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                <ThumbsUp size={28} className="text-gray-200" />
                <TextTiny className="text-gray-400 italic">Sin dispositivos aprobados aún.</TextTiny>
              </div>
            : dispAprobados.map(renderCard)
        )}

        {/* PESTAÑA: Rechazados */}
        {tabActiva === 'rechazados' && (
          dispRechazados.length === 0
            ? <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                <ThumbsDown size={28} className="text-gray-200" />
                <TextTiny className="text-gray-400 italic">Sin dispositivos rechazados.</TextTiny>
              </div>
            : (
              <div className="space-y-3">
                {/* Bloque global de visita correctiva — PRIMERO */}
                <div className="border border-red-200 rounded-xl bg-red-50/60 p-3 space-y-2.5">
                  <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-2xs">
                    Visita correctiva — {dispRechazados.length} dispositivo(s)
                  </TextTiny>

                  {isReadOnly ? (
                    /* Solo lectura: mostrar resumen sin formulario */
                    <div className="space-y-1.5">
                      {fechaCorrectiva && (
                        <p className="text-2xs text-gray-600">
                          <span className="font-bold uppercase tracking-wide text-2xs text-gray-500 block">Fecha sugerida</span>
                          {new Date(fechaCorrectiva).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {comentarioCorrectiva && (
                        <p className="text-2xs text-gray-600 whitespace-pre-wrap">
                          <span className="font-bold uppercase tracking-wide text-2xs text-gray-500 block">Observación</span>
                          {comentarioCorrectiva}
                        </p>
                      )}
                      {!fechaCorrectiva && !comentarioCorrectiva && (
                        <TextTiny className="text-gray-400 italic">Sin solicitud correctiva registrada.</TextTiny>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-2xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          Fecha y hora sugerida <span className="text-gray-400 normal-case font-normal">(opcional)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={fechaCorrectiva}
                          onChange={e => { setFechaCorrectiva(e.target.value); }}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full text-xs border border-red-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                          Observación / Motivo <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={comentarioCorrectiva}
                          onChange={e => { setComentarioCorrectiva(e.target.value); setErrorCorrectiva(''); }}
                          placeholder="Describe el motivo o instrucciones para la visita correctiva…"
                          className={`w-full text-xs border rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 bg-white transition-colors ${
                            errorCorrectiva ? 'border-red-400 focus:ring-red-300' : 'border-red-200 focus:ring-red-300'
                          }`}
                        />
                        {errorCorrectiva && (
                          <p className="flex items-center gap-1 text-2xs text-red-600 mt-0.5">
                            <AlertCircle size={9} /> {errorCorrectiva}
                          </p>
                        )}
                      </div>

                      {(() => {
                        const sinCambios = correctivaCreada
                          && fechaCorrectiva === correctivaGuardadaFecha
                          && comentarioCorrectiva.trim() === correctivaGuardadaComentario;
                        return (
                          <button
                            type="button"
                            disabled={savingCorrectiva || sinCambios}
                            onClick={handleCrearCorrectiva}
                            className="w-full py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                          >
                            {savingCorrectiva ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                            {correctivaCreada ? 'Actualizar visita correctiva' : 'Crear visita correctiva'}
                          </button>
                        );
                      })()}
                      {correctivaCreada && (
                        <div className="flex items-center gap-1.5 text-2xs text-green-700 font-semibold">
                          <CheckCircle2 size={12} /> Solicitud correctiva guardada — el técnico fue notificado en el chat
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Lista de rechazados debajo del formulario */}
                <p className="text-2xs font-bold uppercase tracking-wide text-red-600 px-1">
                  Dispositivos rechazados ({dispRechazados.length})
                </p>
                {dispRechazados.map(renderCard)}
              </div>
            )
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * @param {{ informe: object, onBack: () => void }} props
 */
const InformeRevisionPage = ({ informe: informeBase, onBack }) => {
  const { user }     = useAuth();
  const isDirector = user?.role === ROLES.DIRECTOR;
  const userId     = user?.id;

  const [informeDetalle, setInformeDetalle] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [savingPasoId,   setSavingPasoId]   = useState(null);
  const [savingActId,    setSavingActId]    = useState(null);
  const [savingIntervId, setSavingIntervId] = useState(null);
  const [_savingObs,     setSavingObs]      = useState(false);
  const [resultModal,    setResultModal]    = useState(null);
  const [showRechazo,    setShowRechazo]    = useState(false);
  const [notaRechazo,    setNotaRechazo]    = useState('');
  const [savingAccion,   setSavingAccion]   = useState(false);
  const [localInforme,   setLocalInforme]   = useState(null);
  const [activeTab,      setActiveTab]      = useState('revision');
  const [revisiones,           setRevisiones]           = useState({});
  const [firmaCoordinadorUrl,  setFirmaCoordinadorUrl]  = useState(null);
  const [firmaDirectorUrl,     setFirmaDirectorUrl]     = useState(null);
  const [coordinadorNombre,    setCoordinadorNombre]    = useState(null);
  const [directorNombre,       setDirectorNombre]       = useState(null);
  const [correctivaGuardada,   setCorrectivaGuardada]   = useState(false);
  const [revisionesVersion,    setRevisionesVersion]    = useState(0);
  const [activeIntervencionId, setActiveIntervencionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, detalle, revRows] = await Promise.all([
        fetchInformeData(informeBase.visita_id),
        getInformeDetalle(informeBase.id),
        getRevisionesCoordinador(informeBase.id),
      ]);
      setLocalInforme(data);
      setInformeDetalle(detalle);
      const revMap = {};
      for (const r of revRows) revMap[r.intervencion_id] = { aprobado: r.aprobado, nota: r.nota };
      setRevisiones(revMap);

      // Firma del coordinador: viene de informe_coordinador.coordinador_id
      // (el coordinador que efectivamente revisó el informe, puede diferir del asignado a la visita)
      const coordFirmaUserId = isDirector
        ? (revRows[0]?.coordinador_id ?? null)
        : userId;
      if (coordFirmaUserId) {
        try {
          const [docs, perfilCoord] = await Promise.all([
            listDocumentos(coordFirmaUserId),
            supabase.from('perfil_usuario').select('nombres, apellidos').eq('id', coordFirmaUserId).maybeSingle(),
          ]);
          const firma = docs.find(d => d.tipo === 'FIRMA' && d.url);
          if (firma) {
            const signedUrl = await openDocumentoSignedUrl(firma.url, 3600);
            setFirmaCoordinadorUrl(signedUrl);
          }
          const p = perfilCoord.data;
          if (p) setCoordinadorNombre(`${p.nombres || ''} ${p.apellidos || ''}`.trim() || null);
        } catch { /* firma no crítica */ }
      }

      // Cargar firma del director + nombre (de la última revisión en informe_director)
      try {
        const { data: dirRow } = await supabase
          .from('informe_director')
          .select('director_usuario_id, perfil:director_usuario_id(nombres, apellidos)')
          .eq('informe_id', informeBase.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dirRow) {
          const p = dirRow.perfil;
          if (p) setDirectorNombre(`${p.nombres || ''} ${p.apellidos || ''}`.trim() || null);
          if (dirRow.director_usuario_id) {
            const dirDocs = await listDocumentos(dirRow.director_usuario_id);
            const firma   = dirDocs.find(d => d.tipo === 'FIRMA' && d.url);
            if (firma) {
              const signedUrl = await openDocumentoSignedUrl(firma.url, 3600);
              setFirmaDirectorUrl(signedUrl);
            }
          }
        }
        // Si el visor es el director y aún no hay fila en informe_director, usar su propia firma
        if (!dirRow && isDirector) {
          const dirDocs = await listDocumentos(userId);
          const firma   = dirDocs.find(d => d.tipo === 'FIRMA' && d.url);
          if (firma) {
            const signedUrl = await openDocumentoSignedUrl(firma.url, 3600);
            setFirmaDirectorUrl(signedUrl);
          }
          const { data: perfil } = await supabase
            .from('perfil_usuario').select('nombres, apellidos').eq('id', userId).maybeSingle();
          if (perfil) setDirectorNombre(`${perfil.nombres || ''} ${perfil.apellidos || ''}`.trim() || null);
        }
      } catch { /* firma director no crítica */ }
    } catch (err) {
      setResultModal({ error: true, title: 'Error al cargar informe', errorMessage: err.message });
    } finally { setLoading(false); }
  }, [informeBase.visita_id, informeBase.id, userId, isDirector]);

  useEffect(() => { load(); }, [load]);

  // Scroll al dispositivo activo en el panel del informe
  useEffect(() => {
    if (!activeIntervencionId) return;
    const el = document.querySelector(`[data-intervencion-id="${activeIntervencionId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIntervencionId]);

  // Si el coordinador está en modo solo-lectura (solo tab Chat), forzar tab chat
  useEffect(() => {
    if (!isDirector && informeDetalle && (informeDetalle.estado === 'EN_APROBACION' || informeDetalle.estado === 'APROBADO')) {
      setActiveTab('chat');
    }
  }, [isDirector, informeDetalle]);

  // ── Guardado inmediato de comentarios ─────────────────────────────────────

  const handleSaveComentario = useCallback(async (intervencionId, pasoProtocoloId, comentarios) => {
    setSavingPasoId(pasoProtocoloId);
    try {
      await updateComentarioPaso(intervencionId, pasoProtocoloId, comentarios);
      setLocalInforme(prev => prev ? ({
        ...prev,
        categorias: prev.categorias.map(cat => ({
          ...cat,
          dispositivos: cat.dispositivos.map(disp => ({
            ...disp,
            pasos: disp.pasos.map(p => p.paso_protocolo_id === pasoProtocoloId ? { ...p, comentarios } : p),
          })),
        })),
      }) : prev);
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar comentario', errorMessage: err.message });
    } finally { setSavingPasoId(null); }
  }, []);

  const handleSaveActividadObs = useCallback(async (ejecucionId, intervencionId, actividadId, observacion) => {
    setSavingActId(ejecucionId);
    try {
      await updateObservacionActividad(ejecucionId, observacion);
      setLocalInforme(prev => prev ? ({
        ...prev,
        categorias: prev.categorias.map(cat => ({
          ...cat,
          dispositivos: cat.dispositivos.map(disp => ({
            ...disp,
            pasos: disp.pasos.map(p => ({
              ...p,
              actividades: p.actividades.map(a => a.ejecucion_id === ejecucionId ? { ...a, observacion } : a),
            })),
          })),
        })),
      }) : prev);
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar observación', errorMessage: err.message });
    } finally { setSavingActId(null); }
  }, []);

  const handleSaveIntervObs = useCallback(async (intervencionId, observacionFinal) => {
    setSavingIntervId(intervencionId);
    try {
      await updateObservacionIntervencion(intervencionId, observacionFinal);
      setLocalInforme(prev => prev ? ({
        ...prev,
        categorias: prev.categorias.map(cat => ({
          ...cat,
          dispositivos: cat.dispositivos.map(d => d.intervencion_id === intervencionId ? { ...d, observacion_final: observacionFinal } : d),
        })),
      }) : prev);
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar observación', errorMessage: err.message });
    } finally { setSavingIntervId(null); }
  }, []);

  const handleSaveEtiquetaValor = useCallback(async (intervencionId, codigo_etiqueta) => {
    try {
      const { error } = await supabase.from('intervencion').update({ codigo_etiqueta }).eq('id', intervencionId);
      if (error) throw new Error(error.message);
      setLocalInforme(prev => prev ? ({
        ...prev,
        categorias: prev.categorias.map(cat => ({
          ...cat,
          dispositivos: cat.dispositivos.map(d => d.intervencion_id === intervencionId ? { ...d, codigo_etiqueta } : d),
        })),
      }) : prev);
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar etiqueta', errorMessage: err.message });
    }
  }, []);

  const handleSaveObsCoordinador = useCallback(async (observacion) => {
    setSavingObs(true);
    try {
      await updateObservacionCoordinador(informeBase.id, observacion);
      setInformeDetalle(prev => ({ ...prev, observacion_coordinador: observacion }));
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar observación', errorMessage: err.message });
    } finally { setSavingObs(false); }
  }, [informeBase.id]);

  const handleSaveObsDirector = useCallback(async (observacion) => {
    try {
      await updateObservacionDirector(informeBase.id, observacion);
      setInformeDetalle(prev => ({ ...prev, observacion_director: observacion }));
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar observación del director', errorMessage: err.message });
    }
  }, [informeBase.id]);

  // ── Evidencias ────────────────────────────────────────────────────────────

  const handleEvidenciaDeleted = useCallback((dispositivoId, evidenciaId, esEtiqueta) => {
    setLocalInforme(prev => prev ? ({
      ...prev,
      categorias: prev.categorias.map(cat => ({
        ...cat,
        dispositivos: cat.dispositivos.map(d => {
          if (d.id !== dispositivoId) return d;
          return esEtiqueta ? { ...d, foto_etiqueta: null } : { ...d, fotos: d.fotos.filter(f => f.id !== evidenciaId) };
        }),
      })),
    }) : prev);
  }, []);

  const handleEvidenciaAdded = useCallback((dispositivoId, evidencia, esEtiqueta) => {
    setLocalInforme(prev => prev ? ({
      ...prev,
      categorias: prev.categorias.map(cat => ({
        ...cat,
        dispositivos: cat.dispositivos.map(d => {
          if (d.id !== dispositivoId) return d;
          return esEtiqueta ? { ...d, foto_etiqueta: evidencia } : { ...d, fotos: [...d.fotos, evidencia] };
        }),
      })),
    }) : prev);
  }, []);

  // ── Revisión ──────────────────────────────────────────────────────────────

  const handleRevisionChange = useCallback(async (intervencionId, aprobado, nota) => {
    setRevisiones(prev => {
      const next = { ...prev, [intervencionId]: { aprobado, nota } };

      // Si al aprobar ya no quedan rechazados, auto-cancelar la solicitud correctiva en BD
      const dispositivos = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
      const aunHayRechazados = dispositivos.some(d =>
        d.intervencion_id === intervencionId
          ? aprobado === false   // el que acaba de cambiar
          : next[d.intervencion_id]?.aprobado === false
      );

      if (!aunHayRechazados) {
        // Cancelar en background — si falla no es crítico
        upsertSolicitudCorrectiva({
          informeId:      informeBase.id,
          clienteId:      localInforme?.cliente_id || null,
          sucursalId:     localInforme?.sucursal_id || informeBase.sucursal_id || null,
          creadoPor:      userId,
          motivo:         '',
          dispositivoIds: [],
        }).catch(() => {});
      }

      return next;
    });
    setRevisionesVersion(v => v + 1);
    try {
      await upsertRevisionCoordinador(informeBase.id, intervencionId, userId, aprobado, nota);
    } catch (err) {
      setRevisiones(prev => { const next = { ...prev }; delete next[intervencionId]; return next; });
      setResultModal({ error: true, title: 'Error al guardar revisión', errorMessage: err.message });
    }
  }, [informeBase.id, informeBase.sucursal_id, userId, localInforme]);

  const handleCrearCorrectiva = useCallback(async (dispRechazados, revisionesActuales, fechaSugerida, comentario) => {
    const motivo = comentario || '';

    const { isNew } = await upsertSolicitudCorrectiva({
      informeId:      informeBase.id,
      clienteId:      localInforme?.cliente_id || null,
      sucursalId:     localInforme?.sucursal_id || informeBase.sucursal_id || null,
      creadoPor:      userId,
      motivo,
      dispositivoIds: dispRechazados.map(d => d.id),
      fechaSugerida,
    });

    // Notificar al técnico en el chat del informe
    const resumen = dispRechazados.map(d => {
      const nombre = [d.modelo, d.marca_nombre].filter(Boolean).join(' · ') || d.codigo_unico || 'Dispositivo';
      const nota   = revisionesActuales[d.intervencion_id]?.nota;
      return nota ? `• ${nombre}: ${nota}` : `• ${nombre}`;
    }).join('\n');
    const chatMsg = `🔧 Visita correctiva creada\n\n${comentario ? `Motivo: ${comentario}\n\n` : ''}Dispositivos a corregir:\n${resumen}${fechaSugerida ? `\n\nFecha sugerida: ${new Date(fechaSugerida).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}`;
    try { await sendChatInforme(informeBase.id, userId, chatMsg); } catch { /* chat no crítico */ }
    return isNew;
  }, [localInforme, informeBase.id, informeBase.sucursal_id, userId]);

  // ── Enviar / Aprobar ──────────────────────────────────────────────────────

  const handleAprobar = async () => {
    setSavingAccion(true);
    try {
      if (isDirector) {
        // Validar correctiva pendiente también para el director
        const dispositivosDir = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
        const rechazadosDir   = dispositivosDir.filter(d => revisiones[d.intervencion_id]?.aprobado === false);
        if (rechazadosDir.length > 0 && !correctivaGuardada) {
          setResultModal({
            error: true,
            title: 'Visita correctiva pendiente',
            errorMessage: `Hay ${rechazadosDir.length} dispositivo(s) rechazado(s) con cambios sin guardar. Actualiza la visita correctiva antes de aprobar.`,
          });
          return;
        }

        // Obtener fecha y cliente_id de la visita
        const { data: visitaRow } = await supabase
          .from('visita')
          .select('fecha_fin, cliente_id')
          .eq('id', informeBase.visita_id)
          .maybeSingle();

        // Obtener emails de contactos del cliente (tabla: contacto, FK: cliente_id)
        const clienteId = visitaRow?.cliente_id || null;
        let clienteEmails = [];
        if (clienteId) {
          const { data: contactos } = await supabase
            .from('contacto')
            .select('email')
            .eq('cliente_id', clienteId)
            .not('email', 'is', null);
          clienteEmails = (contactos || []).map(c => c.email).filter(Boolean);
        }

        // 1. Registrar decisión en historial del director (sin cambiar estado aún)
        await registrarRevisionDirector(informeBase.id, userId, 'APROBADO', null);

        // 2. Generar PDF + cambiar estado a APROBADO + notificar cliente
        // Si falla, el informe queda en EN_APROBACION (puede reintentarse).
        const informeParaPDF = coordinadorNombre
          ? { ...informeFiltrado, coordinador: coordinadorNombre }
          : informeFiltrado;
        await aprobarYGenerarPDF(informeBase.id, informeBase.visita_id, {
          informe:             informeParaPDF,
          firmaCoordinadorUrl: firmaCoordinadorUrl,
          firmaDirectorUrl:    firmaDirectorUrl,
          clienteEmails,
          clienteNombre:  informeBase.cliente_nombre,
          sucursalNombre: informeBase.sucursal_nombre,
          tipoVisita:     informeBase.tipo_visita,
          fechaFin:       visitaRow?.fecha_fin || null,
          appUrl:         import.meta.env.VITE_APP_URL || window.location.origin,
          finalizadoPor:  userId,
        });

        setResultModal({
          error: false,
          title: 'Informe aprobado',
          subtitle: clienteEmails.length
            ? `PDF generado y notificado al cliente.`
            : 'Informe aprobado. No hay email de contacto registrado para el cliente.',
        });
      } else {
        const dispositivos = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
        const sinRevisar   = dispositivos.filter(d => revisiones[d.intervencion_id] === undefined);
        if (sinRevisar.length > 0) {
          setResultModal({ error: true, title: 'Revisión incompleta', errorMessage: `Faltan ${sinRevisar.length} dispositivo(s) por revisar.` });
          return;
        }

        const rechazados = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false);

        if (rechazados.length > 0) {
          // Validar que la solicitud correctiva esté guardada y refleje el estado actual
          if (!correctivaGuardada) {
            setResultModal({
              error: true,
              title: 'Visita correctiva pendiente',
              errorMessage: `Hay ${rechazados.length} dispositivo(s) rechazado(s) con cambios sin guardar. Guarda la visita correctiva antes de enviar al director.`,
            });
            return;
          }
        }

        const { data: coordRow } = await supabase
          .from('coordinador')
          .select('coordinador_director(director:director_id(perfil:usuario_id(email)))')
          .eq('usuario_id', userId).eq('activo', true).maybeSingle();

        const directorEmails = (coordRow?.coordinador_director || []).map(cd => cd.director?.perfil?.email).filter(Boolean);

        const { data: coordPerfil } = await supabase
          .from('perfil_usuario').select('nombres, apellidos').eq('id', userId).maybeSingle();

        const coordNombre = coordPerfil ? `${coordPerfil.nombres || ''} ${coordPerfil.apellidos || ''}`.trim() : 'Coordinador';

        await enviarInformeADirector(informeBase.id, {
          directorEmails,
          clienteNombre:     informeBase.cliente_nombre,
          sucursalNombre:    informeBase.sucursal_nombre,
          tipoVisita:        informeBase.tipo_visita,
          coordinadorNombre: coordNombre,
          appUrl:            import.meta.env.VITE_APP_URL || window.location.origin,
        });

        setResultModal({
          error: false,
          title: 'Informe enviado al director',
          subtitle: [
            directorEmails.length ? `Notificado a ${directorEmails.length} director(es).` : 'Informe marcado como enviado.',
            rechazados.length > 0 ? `${rechazados.length} dispositivo(s) rechazado(s) — crea la visita correctiva desde el panel.` : null,
          ].filter(Boolean).join(' '),
        });
      }
    } catch (err) {
      setResultModal({ error: true, title: 'Error', errorMessage: err.message });
    } finally { setSavingAccion(false); }
  };

  const handleRechazar = async () => {
    setSavingAccion(true);
    try {
      await registrarRevisionDirector(informeBase.id, userId, 'RECHAZADO', notaRechazo.trim() || null);
      setShowRechazo(false); setNotaRechazo('');
      setResultModal({ error: false, title: 'Informe rechazado', subtitle: 'El informe vuelve al coordinador para correcciones.' });
    } catch (err) {
      setResultModal({ error: true, title: 'Error al rechazar', errorMessage: err.message });
    } finally { setSavingAccion(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 size={20} className="animate-spin text-brand" />
        <TextSmall className="text-gray-400">Cargando informe…</TextSmall>
      </div>
    );
  }

  const estadoCodigo   = informeDetalle?.estado || informeBase.estado;
  // Coordinador: bloqueado en EN_APROBACION y APROBADO. Director: bloqueado solo en APROBADO.
  const isReadOnly     = isDirector
    ? estadoCodigo === 'APROBADO'
    : (estadoCodigo === 'EN_APROBACION' || estadoCodigo === 'APROBADO');
  const dispositivos   = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
  const totalDisp      = dispositivos.length;
  const revisadosCount = dispositivos.filter(d => revisiones[d.intervencion_id] !== undefined).length;
  const todosRevisados = revisadosCount === totalDisp && totalDisp > 0;
  const tieneRechazados = dispositivos.some(d => revisiones[d.intervencion_id]?.aprobado === false);
  // Bloqueado si hay rechazados y la correctiva no se ha guardado tras el último cambio
  const correctivaPendiente = tieneRechazados && !correctivaGuardada;

  // Informe filtrado: solo dispositivos aprobados (rechazados no aparecen en el PDF)
  const informeFiltrado = localInforme ? {
    ...localInforme,
    observacion_coordinador: informeDetalle?.observacion_coordinador || null,
    observacion_director:    informeDetalle?.observacion_director    || null,
    coordinador_nombre: localInforme.coordinador,
    director_nombre:    directorNombre,
    categorias: localInforme.categorias.map(cat => ({
      ...cat,
      dispositivos: cat.dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado !== false),
    })).filter(cat => cat.dispositivos.length > 0),
  } : null;

  // Coordinador en modo solo-lectura: solo tab Chat
  const TABS = (!isDirector && isReadOnly)
    ? [{ id: 'chat', label: 'Chat' }]
    : [
        { id: 'revision', label: `Revisión (${revisadosCount}/${totalDisp})` },
        { id: 'chat',     label: 'Chat' },
      ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-120px)] animate-in slide-in-from-right-8 duration-300">

      {/* ── Columna izquierda: informe ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm">

        {/* Header */}
        <div className="bg-linear-to-r from-brand via-brand-dark to-brand-deeper px-5 py-3 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button type="button" onClick={onBack}
              className="p-1.5 bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-colors shrink-0">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm leading-tight truncate">{informeBase.cliente_nombre}</p>
              <p className="text-white/70 text-xs">{informeBase.sucursal_nombre} · {informeBase.tipo_visita}</p>
            </div>
            <span className={`text-2xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${
              estadoCodigo === 'APROBADO'      ? 'bg-green-400/30 text-green-100 border border-green-400/40' :
              estadoCodigo === 'RECHAZADO'     ? 'bg-red-300/30 text-red-100 border border-red-400/40' :
              estadoCodigo === 'EN_APROBACION' ? 'bg-blue-400/30 text-blue-100 border border-blue-400/40' :
                                                'bg-yellow-400/30 text-yellow-100 border border-yellow-400/40'
            }`}>{estadoCodigo === 'EN_APROBACION' ? 'En aprobación' : estadoCodigo}</span>
          </div>
        </div>

        {estadoCodigo === 'RECHAZADO' && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shrink-0">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <TextSmall className="font-bold text-red-700">El director rechazó este informe</TextSmall>
              <TextTiny className="text-red-600 mt-0.5">Revisa los comentarios internos y corrige lo indicado.</TextTiny>
            </div>
          </div>
        )}

        {/* Informe — visor tipo documento: fondo gris, página A4 centrada con scroll */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 lg:p-6">
          <div className="mx-auto w-198.5">
            <div className="w-198.5 bg-white shadow-xl rounded-sm ring-1 ring-gray-200 overflow-hidden">
            {informeFiltrado && (
              <InformePDFTemplate
                informe={coordinadorNombre ? { ...informeFiltrado, coordinador: coordinadorNombre } : informeFiltrado}
                firmaCoordinadorUrl={firmaCoordinadorUrl}
                firmaDirectorUrl={firmaDirectorUrl}
                activeIntervencionId={activeIntervencionId}
                onActivate={setActiveIntervencionId}
                renderComentarioPaso={isReadOnly ? null : (intervencionId, pasoId, pasoProtocoloId, comentarioActual) => (
                  <ComentarioEditor
                    value={comentarioActual}
                    saving={savingPasoId === pasoProtocoloId}
                    onSave={(val) => handleSaveComentario(intervencionId, pasoProtocoloId, val)}
                    onStartEdit={() => setActiveIntervencionId(intervencionId)}
                  />
                )}
                renderComentarioActividad={isReadOnly ? null : (act, editCtx) => (
                  <ActividadObsEditor
                    act={act}
                    saving={savingActId === act.ejecucion_id}
                    onSave={(obs) => handleSaveActividadObs(act.ejecucion_id, act.intervencion_id, act.actividad_id, obs)}
                    editing={editCtx?.editing ?? false}
                    onStartEdit={() => { setActiveIntervencionId(act.intervencion_id); editCtx?.onStartEdit?.(); }}
                    onCancelEdit={editCtx?.onCancelEdit ?? (() => {})}
                  />
                )}
                renderObservacionIntervencion={isReadOnly ? null : (intervencionId, obsActual) => (
                  <IntervencionObsEditor
                    value={obsActual}
                    saving={savingIntervId === intervencionId}
                    onSave={(obs) => handleSaveIntervObs(intervencionId, obs)}
                    onStartEdit={() => setActiveIntervencionId(intervencionId)}
                  />
                )}
                renderEtiquetaValor={isReadOnly ? null : (intervencionId, codigoEtiqueta) => (
                  <EtiquetaValorEditor
                    value={codigoEtiqueta}
                    onSave={(val) => handleSaveEtiquetaValor(intervencionId, val)}
                  />
                )}
                renderObsCoordinador={() => (
                  <ObsCoordinadorEditor
                    value={informeDetalle?.observacion_coordinador || null}
                    onSave={isReadOnly ? null : handleSaveObsCoordinador}
                  />
                )}
                renderObsDirector={isDirector ? () => (
                  <ObsDirectorEditor
                    value={informeDetalle?.observacion_director || null}
                    onSave={isReadOnly ? null : handleSaveObsDirector}
                  />
                ) : (informeDetalle?.observacion_director ? () => (
                  <ObsDirectorEditor
                    value={informeDetalle.observacion_director}
                    onSave={null}
                  />
                ) : null)}
                renderEvidencias={isReadOnly ? null : (dispositivo) => (
                  <EvidenciasEditor
                    dispositivo={dispositivo}
                    visitaId={informeBase.visita_id}
                    onEvidenciaDeleted={handleEvidenciaDeleted}
                    onEvidenciaAdded={handleEvidenciaAdded}
                  />
                )}
              />
            )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <TextTiny className={`text-2xs ${correctivaPendiente ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
            {correctivaPendiente
              ? '⚠ Hay cambios en dispositivos rechazados. Actualiza la visita correctiva antes de continuar.'
              : !isDirector && !isReadOnly
                ? (!todosRevisados && totalDisp > 0
                    ? `Revisa todos los dispositivos (${revisadosCount}/${totalDisp}) antes de enviar.`
                    : 'Todos revisados. Listo para enviar al director.')
                : null}
          </TextTiny>
          <div className="flex gap-2 shrink-0">
            {isDirector && !isReadOnly && (
              <button type="button" disabled={savingAccion} onClick={() => setShowRechazo(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  showRechazo ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`}>
                <XCircle size={14} /> Rechazar
              </button>
            )}
            <button type="button"
              disabled={savingAccion || estadoCodigo === 'APROBADO' || isReadOnly || (!isDirector && !todosRevisados) || correctivaPendiente}
              onClick={handleAprobar}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-brand hover:bg-brand-dark text-white disabled:opacity-40 transition-colors">
              {savingAccion ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isDirector ? 'Aprobar' : estadoCodigo === 'EN_APROBACION' ? 'En revisión por director' : 'Enviar al director'}
            </button>
          </div>
        </div>

        {showRechazo && isDirector && (
          <div className="px-4 pb-4 border-t border-red-100 bg-red-50/50 space-y-2 shrink-0">
            <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-2xs pt-3">Motivo del rechazo (opcional)</TextTiny>
            <textarea autoFocus value={notaRechazo} onChange={e => setNotaRechazo(e.target.value)} rows={2}
              placeholder="Describe qué debe corregir el coordinador…"
              className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-400 bg-white" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowRechazo(false); setNotaRechazo(''); }}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="button" disabled={savingAccion} onClick={handleRechazar}
                className="px-3 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-40">
                {savingAccion ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Columna derecha ── */}
      <div className="w-full lg:w-80 lg:shrink-0 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col lg:h-auto">
        <div className="flex border-b border-gray-100 shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-2 text-2xs font-bold uppercase tracking-wide transition-colors truncate ${
                activeTab === tab.id ? 'text-brand border-b-2 border-brand' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-100 lg:min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'revision' && (
            <RevisionPanel
              localInforme={localInforme}
              informeId={informeBase.id}
              visitaId={informeBase.visita_id}
              coordinadorId={userId}
              revisiones={revisiones}
              onRevisionChange={handleRevisionChange}
              activeIntervencionId={activeIntervencionId}
              onSetActive={(id) => setActiveIntervencionId(prev => prev === id ? null : id)}
              onCrearCorrectiva={handleCrearCorrectiva}
              onCorrectivaGuardada={setCorrectivaGuardada}
              isReadOnly={isReadOnly}
              revisionesVersion={revisionesVersion}
            />
          )}
          {activeTab === 'chat' && (
            <ChatPanel informeId={informeBase.id} userId={userId} />
          )}
        </div>
      </div>

      <ActionResultModal
        open={!!resultModal}
        error={resultModal?.error || false}
        title={resultModal?.title || ''}
        subtitle={resultModal?.subtitle || ''}
        errorMessage={resultModal?.errorMessage}
        actions={[{ label: 'Cerrar', onClick: () => { setResultModal(null); if (!resultModal?.error) onBack(); } }]}
        onBackdropClick={() => { setResultModal(null); if (!resultModal?.error) onBack(); }}
      />
    </div>
  );
};

export default InformeRevisionPage;
