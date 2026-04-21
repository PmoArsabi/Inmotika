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
  registrarRevisionDirector,
  enviarInformeADirector,
  getRevisionesCoordinador,
  upsertRevisionCoordinador,
  crearSolicitudCorrectiva,
  deleteEvidenciaInforme,
  uploadEvidenciaInforme,
} from '../../api/informeApi';
import { supabase } from '../../utils/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

const ChatBubble = ({ msg, isMe }) => (
  <div className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
    <div className="flex items-center gap-1.5">
      <TextTiny className={`font-bold text-[10px] ${isMe ? 'text-[#D32F2F]' : 'text-gray-500'}`}>
        {isMe ? 'Tú' : msg.autor_nombre}
      </TextTiny>
      {msg.autor_rol && (
        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{msg.autor_rol}</span>
      )}
      <TextTiny className="text-gray-300 text-[9px]">{fmtHora(msg.created_at)}</TextTiny>
    </div>
    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
      isMe ? 'bg-[#D32F2F] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
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
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
        <MessageSquare size={14} className="text-[#D32F2F]" />
        <TextSmall className="font-bold text-gray-800">Comentarios internos</TextSmall>
        <TextTiny className="text-gray-400 ml-auto">Solo visible para el equipo</TextTiny>
      </div>
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
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all min-h-9 max-h-24"
            placeholder="Escribe un comentario interno…"
            rows={1} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button type="button" disabled={!input.trim() || sending} onClick={handleSend}
            className="p-2 rounded-xl bg-[#D32F2F] text-white hover:bg-[#B71C1C] disabled:opacity-40 transition-colors shrink-0">
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
const ComentarioEditor = ({ value, onSave, saving }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  if (!value && !editing) {
    return (
      <button type="button" onClick={() => { setDraft(''); setEditing(true); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7.5px', color: '#9ca3af' }}
        onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
        <Plus size={9} /> Agregar obs. paso
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-2" style={{ flex: 1 }}>
        <span className="flex-1 text-[8.5px] text-[#1e40af] leading-relaxed">{value}</span>
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(true); }}
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
const ActividadObsEditor = ({ act, onSave, saving }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(act.observacion || '');

  if (!act.observacion && !editing) {
    return (
      <button type="button" onClick={() => { setDraft(''); setEditing(true); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '7.5px', color: '#9ca3af' }}
        onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
        <Plus size={9} /> Agregar obs. actividad
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-1.5">
        <span className="flex-1 text-[8px] text-green-800 leading-relaxed">{act.observacion}</span>
        <button type="button" onClick={() => { setDraft(act.observacion || ''); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-green-100">
          <Edit3 size={9} className="text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} rows={3}
        style={{ width: '100%', fontSize: '8.5px', border: '1px solid #86efac', borderRadius: '4px', padding: '5px 8px', resize: 'vertical', outline: 'none', background: 'white', minHeight: '60px' }}
        placeholder="Observación sobre esta actividad…" />
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button type="button" onClick={() => { setDraft(act.observacion || ''); setEditing(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '3px', color: '#9ca3af' }}>
          <X size={9} />
        </button>
        <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }} disabled={saving}
          style={{ background: '#22c55e', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: '3px', color: 'white', opacity: saving ? 0.5 : 1, fontSize: '9px' }}>
          {saving ? <Loader2 size={9} className="animate-spin" /> : 'OK'}
        </button>
      </div>
    </div>
  );
};

/**
 * Editor de observación de intervención (nivel dispositivo). Guarda al confirmar.
 * @param {{ value: string|null, onSave: Function, saving: boolean }} props
 */
const IntervencionObsEditor = ({ value, onSave, saving }) => {
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
            <button type="button" onClick={() => { setDraft(value); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-gray-100">
              <Edit3 size={10} className="text-gray-400" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => { setDraft(''); setEditing(true); }}
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
        className="w-full text-[9px] border border-blue-300 rounded px-2 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        style={{ minHeight: '64px' }} placeholder="Observación general sobre este dispositivo…" />
      <div className="flex gap-1 justify-end">
        <button type="button" onClick={() => { setDraft(value || ''); setEditing(false); }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"><X size={10} /></button>
        <button type="button" onClick={() => { onSave(draft.trim() || null); setEditing(false); }} disabled={saving}
          className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 text-[9px]">
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
            <button type="button" onClick={() => { setDraft(value); setEditing(true); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-gray-200">
              <Edit3 size={11} className="text-gray-400" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => { setDraft(''); setEditing(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', color: '#9ca3af', fontStyle: 'italic' }}
            onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
            <Plus size={11} /> Agregar observación del coordinador (aparecerá en el PDF)
          </button>
        )}
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
const DispositivoRevisionCard = ({ dispositivo: d, revision, onRevisionChange }) => {
  const [saving, setSaving]           = useState(false);
  const [showRechazo, setShowRechazo] = useState(false);
  const [notaDraft, setNotaDraft]     = useState(revision?.nota || '');

  const aprobado  = revision?.aprobado === true;
  const rechazado = revision?.aprobado === false;

  const handleAprobar = async () => {
    setSaving(true);
    try { await onRevisionChange(d.intervencion_id, true, null); setShowRechazo(false); }
    finally { setSaving(false); }
  };

  const handleRechazar = async () => {
    setSaving(true);
    try { await onRevisionChange(d.intervencion_id, false, notaDraft.trim() || null); setShowRechazo(false); }
    finally { setSaving(false); }
  };

  const nombre = [d.modelo, d.marca_nombre].filter(Boolean).join(' · ') || d.codigo_unico || d.categoria_nombre || 'Dispositivo';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${aprobado ? 'border-green-300' : rechazado ? 'border-red-300' : 'border-gray-200'}`}>
      <div className={`flex items-center gap-2 px-3 py-2.5 ${aprobado ? 'bg-green-50' : rechazado ? 'bg-red-50' : 'bg-gray-50'}`}>
        {aprobado  && <span className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0"><ThumbsUp size={9} /> Aprobado</span>}
        {rechazado && <span className="flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0"><ThumbsDown size={9} /> Rechazado</span>}
        {!aprobado && !rechazado && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">Sin revisar</span>}
        <p className="flex-1 min-w-0 text-[10px] font-bold text-gray-800 truncate">{nombre}</p>
        <div className="flex items-center gap-1 shrink-0">
          {saving ? <Loader2 size={13} className="animate-spin text-gray-400" /> : (
            <>
              <button type="button" onClick={handleAprobar} title="Aprobar"
                className={`p-1.5 rounded-lg transition-colors ${aprobado ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600'}`}>
                <ThumbsUp size={12} />
              </button>
              <button type="button" onClick={() => { setShowRechazo(v => !v); setNotaDraft(revision?.nota || ''); }} title="Rechazar"
                className={`p-1.5 rounded-lg transition-colors ${rechazado ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600'}`}>
                <ThumbsDown size={12} />
              </button>
            </>
          )}
        </div>
      </div>
      {showRechazo && (
        <div className="px-3 py-2 border-t border-red-100 bg-red-50/60 space-y-2">
          <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-[8px]">Motivo del rechazo</TextTiny>
          <textarea autoFocus value={notaDraft} onChange={e => setNotaDraft(e.target.value)} rows={2}
            placeholder="¿Qué debe corregir el técnico?"
            className="w-full text-[11px] border border-red-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-red-300 bg-white" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowRechazo(false)}
              className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="button" disabled={saving} onClick={handleRechazar}
              className="px-2 py-1 text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-40">
              {saving ? 'Guardando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
      {rechazado && revision?.nota && !showRechazo && (
        <div className="px-3 py-1.5 border-t border-red-100 bg-red-50/40 flex items-start gap-1.5">
          <ClipboardEdit size={10} className="text-red-400 mt-0.5 shrink-0" />
          <TextTiny className="text-red-600 italic text-[9px]">{revision.nota}</TextTiny>
        </div>
      )}
    </div>
  );
};

// ─── Panel de revisión ────────────────────────────────────────────────────────

const RevisionPanel = ({ localInforme, informeId, coordinadorId, revisiones, onRevisionChange }) => {
  if (!localInforme) return null;

  const dispositivos = localInforme.categorias.flatMap(cat => cat.dispositivos);
  const total      = dispositivos.length;
  const revisados  = dispositivos.filter(d => revisiones[d.intervencion_id] !== undefined).length;
  const aprobados  = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === true).length;
  const rechazados = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false).length;

  const dispPendientes  = dispositivos.filter(d => revisiones[d.intervencion_id] === undefined);
  const dispAprobados   = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === true);
  const dispRechazados  = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false);

  return (
    <div className="flex flex-col h-full">
      {/* Contadores */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardEdit size={14} className="text-[#D32F2F]" />
          <TextSmall className="font-bold text-gray-800">Revisión de dispositivos</TextSmall>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-sm font-bold text-gray-700">{revisados}/{total}</p>
            <TextTiny className="text-gray-400">revisados</TextTiny>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-green-600">{aprobados}</p>
            <TextTiny className="text-gray-400">aprobados</TextTiny>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-red-600">{rechazados}</p>
            <TextTiny className="text-gray-400">rechazados</TextTiny>
          </div>
        </div>
        {revisados < total && (
          <div className="mt-2 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
            Debes revisar todos los dispositivos antes de enviar al director.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {/* Sin revisar */}
        {dispPendientes.length > 0 && (
          <div className="space-y-2">
            <p className="text-[8px] font-bold uppercase tracking-wide text-gray-400 px-1">Sin revisar</p>
            {dispPendientes.map(d => (
              <DispositivoRevisionCard key={d.intervencion_id} dispositivo={d}
                informeId={informeId} coordinadorId={coordinadorId}
                revision={null} onRevisionChange={onRevisionChange} />
            ))}
          </div>
        )}

        {/* Aprobados */}
        {dispAprobados.length > 0 && (
          <div className="space-y-2">
            <p className="text-[8px] font-bold uppercase tracking-wide text-green-600 px-1">Aprobados ({dispAprobados.length})</p>
            {dispAprobados.map(d => (
              <DispositivoRevisionCard key={d.intervencion_id} dispositivo={d}
                informeId={informeId} coordinadorId={coordinadorId}
                revision={revisiones[d.intervencion_id]} onRevisionChange={onRevisionChange} />
            ))}
          </div>
        )}

        {/* Rechazados — con nota del motivo y aviso de solicitud correctiva */}
        {dispRechazados.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <p className="text-[8px] font-bold uppercase tracking-wide text-red-600">Rechazados ({dispRechazados.length})</p>
            </div>
            <div className="text-[8.5px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 leading-relaxed">
              Al enviar al director, se creará automáticamente una <strong>solicitud de visita correctiva</strong> con estos dispositivos.
            </div>
            {dispRechazados.map(d => (
              <DispositivoRevisionCard key={d.intervencion_id} dispositivo={d}
                informeId={informeId} coordinadorId={coordinadorId}
                revision={revisiones[d.intervencion_id]} onRevisionChange={onRevisionChange} />
            ))}
          </div>
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
  const { user }   = useAuth();
  const isDirector = user?.role === ROLES.DIRECTOR;
  const userId     = user?.id;

  const [informeDetalle, setInformeDetalle] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [savingPasoId,   setSavingPasoId]   = useState(null);
  const [savingActId,    setSavingActId]    = useState(null);
  const [savingIntervId, setSavingIntervId] = useState(null);
  const [savingObs,      setSavingObs]      = useState(false);
  const [resultModal,    setResultModal]    = useState(null);
  const [showRechazo,    setShowRechazo]    = useState(false);
  const [notaRechazo,    setNotaRechazo]    = useState('');
  const [savingAccion,   setSavingAccion]   = useState(false);
  const [localInforme,   setLocalInforme]   = useState(null);
  const [activeTab,      setActiveTab]      = useState('revision');
  const [revisiones,     setRevisiones]     = useState({});

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
    } catch (err) {
      setResultModal({ error: true, title: 'Error al cargar informe', errorMessage: err.message });
    } finally { setLoading(false); }
  }, [informeBase.visita_id, informeBase.id]);

  useEffect(() => { load(); }, [load]);

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
    setRevisiones(prev => ({ ...prev, [intervencionId]: { aprobado, nota } }));
    try {
      await upsertRevisionCoordinador(informeBase.id, intervencionId, userId, aprobado, nota);
    } catch (err) {
      setRevisiones(prev => { const next = { ...prev }; delete next[intervencionId]; return next; });
      setResultModal({ error: true, title: 'Error al guardar revisión', errorMessage: err.message });
    }
  }, [informeBase.id, userId]);

  // ── Enviar / Aprobar ──────────────────────────────────────────────────────

  const handleAprobar = async () => {
    setSavingAccion(true);
    try {
      if (isDirector) {
        await registrarRevisionDirector(informeBase.id, userId, 'APROBADO', null);
        setResultModal({ error: false, title: 'Informe aprobado', subtitle: 'El informe ha sido aprobado.' });
      } else {
        const dispositivos = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
        const sinRevisar   = dispositivos.filter(d => revisiones[d.intervencion_id] === undefined);
        if (sinRevisar.length > 0) {
          setResultModal({ error: true, title: 'Revisión incompleta', errorMessage: `Faltan ${sinRevisar.length} dispositivo(s) por revisar.` });
          return;
        }

        const rechazados = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false);
        if (rechazados.length > 0) {
          const motivosRechazo = rechazados.map(d => {
            const nombre = [d.modelo, d.marca_nombre].filter(Boolean).join(' · ') || d.codigo_unico || 'Dispositivo';
            const nota   = revisiones[d.intervencion_id]?.nota;
            return nota ? `${nombre}: ${nota}` : nombre;
          }).join('\n');

          await crearSolicitudCorrectiva({
            clienteId:      localInforme?.cliente_id || null,
            sucursalId:     informeBase.sucursal_id || null,
            creadoPor:      userId,
            motivo:         `Corrección solicitada por coordinador:\n${motivosRechazo}`,
            dispositivoIds: rechazados.map(d => d.id),
          });
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
            rechazados.length > 0 ? `Se creó una solicitud correctiva para ${rechazados.length} dispositivo(s).` : null,
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
        <Loader2 size={20} className="animate-spin text-[#D32F2F]" />
        <TextSmall className="text-gray-400">Cargando informe…</TextSmall>
      </div>
    );
  }

  const estadoCodigo   = informeDetalle?.estado || informeBase.estado;
  const yaEnviado      = !!informeDetalle?.enviado_director_at;
  const dispositivos   = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
  const totalDisp      = dispositivos.length;
  const revisadosCount = dispositivos.filter(d => revisiones[d.intervencion_id] !== undefined).length;
  const todosRevisados = !isDirector && revisadosCount === totalDisp && totalDisp > 0;

  // Informe filtrado: solo dispositivos aprobados (rechazados no aparecen)
  const informeFiltrado = localInforme ? {
    ...localInforme,
    observacion_coordinador: informeDetalle?.observacion_coordinador || null,
    coordinador_nombre: localInforme.coordinador,
    categorias: localInforme.categorias.map(cat => ({
      ...cat,
      dispositivos: cat.dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado !== false),
    })).filter(cat => cat.dispositivos.length > 0),
  } : null;

  const TABS = [
    ...(!isDirector ? [{ id: 'revision', label: `Revisión (${revisadosCount}/${totalDisp})` }] : []),
    { id: 'chat', label: 'Chat' },
  ];

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] animate-in slide-in-from-right-8 duration-300">

      {/* ── Columna izquierda: informe ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm">

        {/* Header */}
        <div className="bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-5 py-3 relative overflow-hidden shrink-0">
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
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${
              estadoCodigo === 'APROBADO'  ? 'bg-green-400/30 text-green-100 border border-green-400/40' :
              estadoCodigo === 'RECHAZADO' ? 'bg-red-300/30 text-red-100 border border-red-400/40' :
                                            'bg-yellow-400/30 text-yellow-100 border border-yellow-400/40'
            }`}>{estadoCodigo}</span>
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

        {/* Informe */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {informeFiltrado && (
              <InformePDFTemplate
                informe={informeFiltrado}
                renderComentarioPaso={(intervencionId, pasoId, pasoProtocoloId, comentarioActual) => (
                  <ComentarioEditor
                    value={comentarioActual}
                    saving={savingPasoId === pasoProtocoloId}
                    onSave={(val) => handleSaveComentario(intervencionId, pasoProtocoloId, val)}
                  />
                )}
                renderComentarioActividad={(act) => (
                  <ActividadObsEditor
                    act={act}
                    saving={savingActId === act.ejecucion_id}
                    onSave={(obs) => handleSaveActividadObs(act.ejecucion_id, act.intervencion_id, act.actividad_id, obs)}
                  />
                )}
                renderObservacionIntervencion={(intervencionId, obsActual) => (
                  <IntervencionObsEditor
                    value={obsActual}
                    saving={savingIntervId === intervencionId}
                    onSave={(obs) => handleSaveIntervObs(intervencionId, obs)}
                  />
                )}
                renderEtiquetaValor={(intervencionId, codigoEtiqueta) => (
                  <EtiquetaValorEditor
                    value={codigoEtiqueta}
                    onSave={(val) => handleSaveEtiquetaValor(intervencionId, val)}
                  />
                )}
                renderObsCoordinador={() => (
                  <ObsCoordinadorEditor
                    value={informeDetalle?.observacion_coordinador || null}
                    onSave={handleSaveObsCoordinador}
                  />
                )}
                renderEvidencias={(dispositivo) => (
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <TextTiny className="text-gray-400">
            {isDirector
              ? 'Como director puedes aprobar o rechazar el informe.'
              : !todosRevisados && totalDisp > 0
                ? `Revisa todos los dispositivos (${revisadosCount}/${totalDisp}) antes de enviar.`
                : yaEnviado ? 'Informe ya enviado. Puedes seguir editando.'
                            : 'Todos revisados. Listo para enviar al director.'}
          </TextTiny>
          <div className="flex gap-2 shrink-0">
            {isDirector && (
              <button type="button" disabled={savingAccion} onClick={() => setShowRechazo(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  showRechazo ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`}>
                <XCircle size={14} /> Rechazar
              </button>
            )}
            <button type="button"
              disabled={savingAccion || estadoCodigo === 'APROBADO' || (!isDirector && !todosRevisados)}
              onClick={handleAprobar}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#D32F2F] hover:bg-[#B71C1C] text-white disabled:opacity-40 transition-colors">
              {savingAccion ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isDirector ? 'Aprobar' : yaEnviado ? 'Reenviar al director' : 'Enviar al director'}
            </button>
          </div>
        </div>

        {showRechazo && isDirector && (
          <div className="px-4 pb-4 border-t border-red-100 bg-red-50/50 space-y-2 shrink-0">
            <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-[9px] pt-3">Motivo del rechazo (opcional)</TextTiny>
            <textarea autoFocus value={notaRechazo} onChange={e => setNotaRechazo(e.target.value)} rows={2}
              placeholder="Describe qué debe corregir el coordinador…"
              className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-400 bg-white" />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowRechazo(false); setNotaRechazo(''); }}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="button" disabled={savingAccion} onClick={handleRechazar}
                className="px-3 py-1.5 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-40">
                {savingAccion ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Columna derecha ── */}
      <div className="w-72 shrink-0 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col">
        <div className="flex border-b border-gray-100 shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                activeTab === tab.id ? 'text-[#D32F2F] border-b-2 border-[#D32F2F]' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'revision' && !isDirector && (
            <RevisionPanel
              localInforme={localInforme}
              informeId={informeBase.id}
              coordinadorId={userId}
              revisiones={revisiones}
              onRevisionChange={handleRevisionChange}
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
