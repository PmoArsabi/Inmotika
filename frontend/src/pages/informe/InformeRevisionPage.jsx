import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, Send, CheckCircle2, XCircle, AlertCircle,
  MessageSquare, Edit3, Check, X, Loader2, ThumbsUp, ThumbsDown,
  Camera, ClipboardEdit, ChevronDown, ChevronUp,
} from 'lucide-react';
import Button from '../../components/ui/Button';
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
  updateObservacionCoordinador,
  registrarRevisionDirector,
  enviarInformeADirector,
  getRevisionesCoordinador,
  upsertRevisionCoordinador,
  crearSolicitudCorrectiva,
} from '../../api/informeApi';
import { supabase } from '../../utils/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

// ─── Burbuja de chat ──────────────────────────────────────────────────────────

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
      isMe
        ? 'bg-[#D32F2F] text-white rounded-tr-sm'
        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
    }`}>
      {msg.mensaje}
    </div>
  </div>
);

// ─── Panel de chat ────────────────────────────────────────────────────────────

const ChatPanel = ({ informeId, userId }) => {
  const [mensajes, setMensajes]   = useState([]);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);

  const loadChat = useCallback(async () => {
    try {
      const data = await getChatInforme(informeId);
      setMensajes(data);
    } catch { /* silencioso */ }
  }, [informeId]);

  useEffect(() => { loadChat(); }, [loadChat]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat_informe_${informeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_informe', filter: `informe_id=eq.${informeId}` },
        () => loadChat())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [informeId, loadChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleSend = async () => {
    const texto = input.trim();
    if (!texto || sending) return;
    setSending(true);
    try {
      await sendChatInforme(informeId, userId, texto);
      setInput('');
    } catch { /* silencioso */ } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
            <TextTiny className="text-gray-400 italic">Sin comentarios aún.<br/>Usa este espacio para coordinar correcciones.</TextTiny>
          </div>
        )}
        {mensajes.map(msg => (
          <ChatBubble key={msg.id} msg={msg} isMe={msg.autor_id === userId} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all min-h-9 max-h-24"
            placeholder="Escribe un comentario interno…"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            type="button"
            disabled={!input.trim() || sending}
            onClick={handleSend}
            className="p-2 rounded-xl bg-[#D32F2F] text-white hover:bg-[#B71C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inline editor de comentario de paso ─────────────────────────────────────

const ComentarioEditor = ({ value, onSave, saving }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  const handleSave = async () => {
    await onSave(draft.trim() || null);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <span className="flex-1 text-[8.5px] text-[#1e40af] leading-relaxed">
          {value || <span className="text-gray-300 italic">Sin comentario</span>}
        </span>
        <button
          type="button"
          onClick={() => { setDraft(value || ''); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-gray-100"
        >
          <Edit3 size={10} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={2}
        className="w-full text-[8.5px] border border-blue-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
      />
      <div className="flex gap-1 justify-end">
        <button type="button" onClick={handleCancel} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X size={10} />
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40">
          {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
        </button>
      </div>
    </div>
  );
};

// ─── Panel de revisión de dispositivo (coordinador) ───────────────────────────

/**
 * Tarjeta de revisión por dispositivo: muestra estado actual y permite aprobar/rechazar.
 *
 * @param {{
 *   dispositivo: import('../../api/informeApi').DispositivoInforme,
 *   informeId: string,
 *   coordinadorId: string,
 *   revision: { aprobado: boolean, nota: string|null } | null,
 *   onRevisionChange: (intervencionId: string, aprobado: boolean, nota: string|null) => void,
 * }} props
 */
const DispositivoRevisionCard = ({ dispositivo: d, revision, onRevisionChange }) => {
  const [expanded, setExpanded]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [showRechazo, setShowRechazo] = useState(false);
  const [notaDraft, setNotaDraft]   = useState(revision?.nota || '');

  const aprobado  = revision?.aprobado;
  const rechazado = revision !== null && revision?.aprobado === false;

  const handleAprobar = async () => {
    setSaving(true);
    try {
      await onRevisionChange(d.intervencion_id, true, null);
      setShowRechazo(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRechazar = async () => {
    setSaving(true);
    try {
      await onRevisionChange(d.intervencion_id, false, notaDraft.trim() || null);
      setShowRechazo(false);
    } finally {
      setSaving(false);
    }
  };

  const borderColor = aprobado ? 'border-green-300' : rechazado ? 'border-red-300' : 'border-gray-200';
  const headerBg    = aprobado ? 'bg-green-50'      : rechazado ? 'bg-red-50'      : 'bg-gray-50';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${borderColor}`}>
      {/* Header dispositivo */}
      <div className={`flex items-center gap-3 px-4 py-3 ${headerBg}`}>
        {/* Badge estado revisión */}
        {aprobado && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
            <ThumbsUp size={10} /> Aprobado
          </span>
        )}
        {rechazado && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full shrink-0">
            <ThumbsDown size={10} /> Rechazado
          </span>
        )}
        {!aprobado && !rechazado && (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full shrink-0">
            Sin revisar
          </span>
        )}

        {/* Info dispositivo */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800 truncate">
            {d.nombre || d.modelo || d.codigo_unico || `Dispositivo`}
          </p>
          <p className="text-[9px] text-gray-400 truncate">
            {[d.categoria_nombre, d.marca_nombre, d.serial].filter(Boolean).join(' · ')}
            {d.fuera_de_servicio && <span className="ml-1.5 text-red-500 font-bold">⚠ FDS</span>}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 shrink-0">
          {saving ? (
            <Loader2 size={14} className="animate-spin text-gray-400" />
          ) : (
            <>
              <button
                type="button"
                onClick={handleAprobar}
                title="Aprobar dispositivo"
                className={`p-1.5 rounded-lg transition-colors ${
                  aprobado
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600'
                }`}
              >
                <ThumbsUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => { setShowRechazo(v => !v); setNotaDraft(revision?.nota || ''); }}
                title="Rechazar dispositivo"
                className={`p-1.5 rounded-lg transition-colors ${
                  rechazado
                    ? 'bg-red-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600'
                }`}
              >
                <ThumbsDown size={13} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Panel de rechazo inline */}
      {showRechazo && (
        <div className="px-4 py-3 border-t border-red-100 bg-red-50/60 space-y-2">
          <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-[9px]">
            Motivo del rechazo (se incluirá en la solicitud correctiva)
          </TextTiny>
          <textarea
            autoFocus
            value={notaDraft}
            onChange={e => setNotaDraft(e.target.value)}
            rows={2}
            placeholder="Describe qué debe corregir el técnico en este dispositivo…"
            className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-400 transition-all bg-white"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowRechazo(false)}
              className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleRechazar}
              className="px-3 py-1.5 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-40 transition-colors"
            >
              {saving ? 'Guardando…' : 'Confirmar rechazo'}
            </button>
          </div>
        </div>
      )}

      {/* Nota de rechazo guardada */}
      {rechazado && revision?.nota && !showRechazo && (
        <div className="px-4 py-2 border-t border-red-100 bg-red-50/40 flex items-start gap-2">
          <ClipboardEdit size={11} className="text-red-400 mt-0.5 shrink-0" />
          <TextTiny className="text-red-600 italic">{revision.nota}</TextTiny>
        </div>
      )}

      {/* Detalle expandido: fotos y observacion_final */}
      {expanded && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white space-y-3">
          {d.observacion_final && (
            <div className="text-[10px] text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <strong className="text-blue-700">Obs. técnico:</strong> {d.observacion_final}
            </div>
          )}
          {(d.fotos.length > 0 || d.foto_etiqueta) && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Camera size={11} className="text-gray-400" />
                <TextTiny className="font-bold text-gray-500 uppercase tracking-wide text-[9px]">Fotos</TextTiny>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.foto_etiqueta && (
                  <div className="relative">
                    <img src={d.foto_etiqueta} alt="Etiqueta" className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
                    <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-black/50 text-white py-0.5 rounded-b-lg">Etiqueta</span>
                  </div>
                )}
                {d.fotos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Foto ${i + 1}`} className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
                    <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center bg-black/50 text-white py-0.5 rounded-b-lg">Foto {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {d.fotos.length === 0 && !d.foto_etiqueta && (
            <TextTiny className="text-gray-300 italic">Sin fotos adjuntas.</TextTiny>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Panel de revisión de dispositivos (coordinador) ─────────────────────────

/**
 * Panel lateral de revisión de todos los dispositivos del informe.
 *
 * @param {{
 *   localInforme: import('../../api/informeApi').InformeVisita | null,
 *   informeId: string,
 *   coordinadorId: string,
 *   revisiones: Record<string, { aprobado: boolean, nota: string|null }>,
 *   onRevisionChange: Function,
 * }} props
 */
const RevisionPanel = ({ localInforme, informeId, coordinadorId, revisiones, onRevisionChange }) => {
  if (!localInforme) return null;

  const dispositivos = localInforme.categorias.flatMap(cat => cat.dispositivos);
  const total        = dispositivos.length;
  const revisados    = dispositivos.filter(d => revisiones[d.intervencion_id] !== undefined).length;
  const aprobados    = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === true).length;
  const rechazados   = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardEdit size={14} className="text-[#D32F2F]" />
          <TextSmall className="font-bold text-gray-800">Revisión de dispositivos</TextSmall>
        </div>
        <div className="flex gap-3">
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

      {/* Lista dispositivos */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {dispositivos.map(d => (
          <DispositivoRevisionCard
            key={d.intervencion_id}
            dispositivo={d}
            informeId={informeId}
            coordinadorId={coordinadorId}
            revision={revisiones[d.intervencion_id] ?? null}
            onRevisionChange={onRevisionChange}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Página de revisión del informe para coordinador y director.
 *
 * @param {{ informe: { id: string, visita_id: string, estado: string, cliente_nombre: string, sucursal_nombre: string, tipo_visita: string }, onBack: () => void }} props
 */
const InformeRevisionPage = ({ informe: informeBase, onBack }) => {
  const { user } = useAuth();
  const isDirector  = user?.role === ROLES.DIRECTOR;
  const userId      = user?.id;

  const [informeDetalle,   setInformeDetalle]   = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [savingComentario, setSavingComentario] = useState(null);
  const [savingObs,        setSavingObs]        = useState(false);
  const [editingObs,       setEditingObs]       = useState(false);
  const [obsDraft,         setObsDraft]         = useState('');
  const [resultModal,      setResultModal]      = useState(null);
  const [showRechazo,      setShowRechazo]      = useState(false);
  const [notaRechazo,      setNotaRechazo]      = useState('');
  const [savingAccion,     setSavingAccion]     = useState(false);
  const [localInforme,     setLocalInforme]     = useState(null);
  const [activeTab,        setActiveTab]        = useState('informe'); // 'informe' | 'revision' | 'chat'

  /**
   * revisiones: Record<intervencion_id, { aprobado: boolean, nota: string|null }>
   * Se inicializa desde BD y se actualiza optimisticamente.
   */
  const [revisiones, setRevisiones] = useState({});

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
      setObsDraft(detalle?.observacion_coordinador || '');

      /** @type {Record<string, { aprobado: boolean, nota: string|null }>} */
      const revMap = {};
      for (const r of revRows) {
        revMap[r.intervencion_id] = { aprobado: r.aprobado, nota: r.nota };
      }
      setRevisiones(revMap);
    } catch (err) {
      setResultModal({ error: true, title: 'Error al cargar informe', errorMessage: err.message });
    } finally {
      setLoading(false);
    }
  }, [informeBase.visita_id, informeBase.id]);

  useEffect(() => { load(); }, [load]);

  // ── Edición de comentario de paso ─────────────────────────────────────────

  const handleSaveComentario = useCallback(async (intervencionId, pasoProtocoloId, comentarios) => {
    setSavingComentario(pasoProtocoloId);
    try {
      await updateComentarioPaso(intervencionId, pasoProtocoloId, comentarios);
      setLocalInforme(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          categorias: prev.categorias.map(cat => ({
            ...cat,
            dispositivos: cat.dispositivos.map(disp => ({
              ...disp,
              pasos: disp.pasos.map(p =>
                p.id === pasoProtocoloId ? { ...p, comentarios } : p
              ),
            })),
          })),
        };
      });
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar comentario', errorMessage: err.message });
    } finally {
      setSavingComentario(null);
    }
  }, []);

  // ── Observación coordinador ───────────────────────────────────────────────

  const handleSaveObs = async () => {
    setSavingObs(true);
    try {
      await updateObservacionCoordinador(informeBase.id, obsDraft.trim() || null);
      setInformeDetalle(prev => ({ ...prev, observacion_coordinador: obsDraft.trim() || null }));
      setEditingObs(false);
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar observación', errorMessage: err.message });
    } finally {
      setSavingObs(false);
    }
  };

  // ── Revisión de dispositivos (coordinador) ────────────────────────────────

  const handleRevisionChange = useCallback(async (intervencionId, aprobado, nota) => {
    // Optimistic update
    setRevisiones(prev => ({ ...prev, [intervencionId]: { aprobado, nota } }));
    try {
      await upsertRevisionCoordinador(informeBase.id, intervencionId, userId, aprobado, nota);
    } catch (err) {
      // Revertir si falla
      setRevisiones(prev => {
        const next = { ...prev };
        delete next[intervencionId];
        return next;
      });
      setResultModal({ error: true, title: 'Error al guardar revisión', errorMessage: err.message });
    }
  }, [informeBase.id, userId]);

  // ── Enviar al director / Aprobar ──────────────────────────────────────────

  const handleAprobar = async () => {
    setSavingAccion(true);
    try {
      if (isDirector) {
        await registrarRevisionDirector(informeBase.id, userId, 'APROBADO', null);
        setResultModal({
          error: false,
          title: 'Informe aprobado',
          subtitle: 'El informe ha sido aprobado. El coordinador será notificado.',
        });
      } else {
        // Coordinador → verificar que todos están revisados
        const dispositivos = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
        const sinRevisar   = dispositivos.filter(d => revisiones[d.intervencion_id] === undefined);
        if (sinRevisar.length > 0) {
          setResultModal({
            error: true,
            title: 'Revisión incompleta',
            errorMessage: `Faltan ${sinRevisar.length} dispositivo(s) por revisar antes de enviar al director.`,
          });
          return;
        }

        // Dispositivos rechazados → crear solicitud correctiva
        const rechazados = dispositivos.filter(d => revisiones[d.intervencion_id]?.aprobado === false);
        if (rechazados.length > 0) {
          const motivosRechazo = rechazados
            .map(d => {
              const nombre = d.nombre || d.modelo || d.codigo_unico || 'Dispositivo';
              const nota   = revisiones[d.intervencion_id]?.nota;
              return nota ? `${nombre}: ${nota}` : nombre;
            })
            .join('\n');

          await crearSolicitudCorrectiva({
            clienteId:      localInforme?.cliente_id || null,
            sucursalId:     informeBase.sucursal_id || null,
            creadoPor:      userId,
            motivo:         `Corrección solicitada por coordinador:\n${motivosRechazo}`,
            dispositivoIds: rechazados.map(d => d.id),
          });
        }

        // Obtener emails del director
        const { data: coordRow } = await supabase
          .from('coordinador')
          .select('coordinador_director(director:director_id(perfil:usuario_id(email)))')
          .eq('usuario_id', userId)
          .eq('activo', true)
          .maybeSingle();

        const directorEmails = (coordRow?.coordinador_director || [])
          .map(cd => cd.director?.perfil?.email).filter(Boolean);

        const { data: coordPerfil } = await supabase
          .from('perfil_usuario').select('nombres, apellidos').eq('id', userId).maybeSingle();

        const coordNombre = coordPerfil
          ? `${coordPerfil.nombres || ''} ${coordPerfil.apellidos || ''}`.trim() : 'Coordinador';

        await enviarInformeADirector(informeBase.id, {
          directorEmails,
          clienteNombre:     informeBase.cliente_nombre,
          sucursalNombre:    informeBase.sucursal_nombre,
          tipoVisita:        informeBase.tipo_visita,
          coordinadorNombre: coordNombre,
          appUrl:            import.meta.env.VITE_APP_URL || window.location.origin,
        });

        const rechazadosCount = rechazados.length;
        setResultModal({
          error: false,
          title: 'Informe enviado al director',
          subtitle: [
            directorEmails.length ? `Notificado a ${directorEmails.length} director(es).` : 'Informe marcado como enviado.',
            rechazadosCount > 0 ? `Se creó una solicitud correctiva para ${rechazadosCount} dispositivo(s) rechazado(s).` : null,
          ].filter(Boolean).join(' '),
        });
      }
    } catch (err) {
      setResultModal({ error: true, title: 'Error', errorMessage: err.message });
    } finally {
      setSavingAccion(false);
    }
  };

  // ── Rechazar (solo director) ──────────────────────────────────────────────

  const handleRechazar = async () => {
    setSavingAccion(true);
    try {
      await registrarRevisionDirector(informeBase.id, userId, 'RECHAZADO', notaRechazo.trim() || null);
      setShowRechazo(false);
      setNotaRechazo('');
      setResultModal({
        error: false,
        title: 'Informe rechazado',
        subtitle: 'El informe vuelve al coordinador para correcciones.',
      });
    } catch (err) {
      setResultModal({ error: true, title: 'Error al rechazar', errorMessage: err.message });
    } finally {
      setSavingAccion(false);
    }
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

  const estadoCodigo = informeDetalle?.estado || informeBase.estado;
  const yaEnviado    = !!informeDetalle?.enviado_director_at;

  // Contadores de revisión para el botón enviar
  const dispositivos     = localInforme?.categorias.flatMap(cat => cat.dispositivos) || [];
  const totalDisp        = dispositivos.length;
  const revisadosCount   = dispositivos.filter(d => revisiones[d.intervencion_id] !== undefined).length;
  const todosRevisados   = !isDirector && revisadosCount === totalDisp && totalDisp > 0;

  const TABS = [
    { id: 'informe',   label: 'Informe' },
    ...(!isDirector ? [{ id: 'revision', label: `Revisión (${revisadosCount}/${totalDisp})` }] : []),
    { id: 'chat',      label: 'Chat' },
  ];

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] animate-in slide-in-from-right-8 duration-300">

      {/* ── Columna izquierda: informe renderizado ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm">

        {/* Header */}
        <div className="bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-5 py-3 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-colors shrink-0"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm leading-tight truncate">{informeBase.cliente_nombre}</p>
              <p className="text-white/70 text-xs">{informeBase.sucursal_nombre} · {informeBase.tipo_visita}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
              estadoCodigo === 'APROBADO'   ? 'bg-green-400/30 text-green-100 border border-green-400/40' :
              estadoCodigo === 'RECHAZADO'  ? 'bg-red-300/30 text-red-100 border border-red-400/40' :
                                             'bg-yellow-400/30 text-yellow-100 border border-yellow-400/40'
            }`}>{estadoCodigo}</span>
          </div>
        </div>

        {/* Alerta rechazo director */}
        {estadoCodigo === 'RECHAZADO' && (
          <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shrink-0">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <TextSmall className="font-bold text-red-700">El director rechazó este informe</TextSmall>
              <TextTiny className="text-red-600 mt-0.5">Revisa los comentarios internos y corrige lo indicado.</TextTiny>
            </div>
          </div>
        )}

        {/* Observación coordinador */}
        <div className="mx-4 mt-3 border border-gray-200 rounded-xl overflow-hidden shrink-0">
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-100">
            <TextTiny className="font-bold text-gray-600 uppercase tracking-wide text-[9px]">
              Observación del coordinador (aparece en el PDF)
            </TextTiny>
            {!editingObs && (
              <button
                type="button"
                onClick={() => { setObsDraft(informeDetalle?.observacion_coordinador || ''); setEditingObs(true); }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                <Edit3 size={11} className="text-gray-400" />
              </button>
            )}
          </div>
          <div className="px-4 py-3">
            {editingObs ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={obsDraft}
                  onChange={e => setObsDraft(e.target.value)}
                  rows={3}
                  placeholder="Escribe una observación para el cliente (irá en el PDF)…"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingObs(false)}
                    className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveObs}
                    disabled={savingObs}
                    className="px-3 py-1.5 text-[11px] font-bold bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-lg disabled:opacity-40 transition-colors"
                  >
                    {savingObs ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <TextTiny className={informeDetalle?.observacion_coordinador ? 'text-gray-700' : 'text-gray-300 italic'}>
                {informeDetalle?.observacion_coordinador || 'Sin observación. Haz clic en el lápiz para agregar.'}
              </TextTiny>
            )}
          </div>
        </div>

        {/* Informe HTML renderizado */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {localInforme && (
              <InformePDFTemplate
                informe={{
                  ...localInforme,
                  instrucciones: informeDetalle?.observacion_coordinador || localInforme.instrucciones,
                }}
                renderComentarioPaso={(intervencionId, pasoId, pasoProtocoloId, comentarioActual) => (
                  <ComentarioEditor
                    value={comentarioActual}
                    saving={savingComentario === pasoProtocoloId}
                    onSave={(val) => handleSaveComentario(intervencionId, pasoProtocoloId, val)}
                  />
                )}
              />
            )}
          </div>
        </div>

        {/* Footer acciones */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <TextTiny className="text-gray-400">
            {isDirector
              ? 'Como director puedes aprobar o rechazar el informe.'
              : !todosRevisados && totalDisp > 0
                ? `Revisa todos los dispositivos (${revisadosCount}/${totalDisp}) antes de enviar.`
                : yaEnviado
                  ? 'Informe ya enviado al director. Puedes seguir editando.'
                  : 'Todos revisados. Listo para enviar al director.'}
          </TextTiny>
          <div className="flex gap-2 shrink-0">
            {isDirector && (
              <button
                type="button"
                disabled={savingAccion}
                onClick={() => setShowRechazo(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  showRechazo
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <XCircle size={14} />
                Rechazar
              </button>
            )}
            <button
              type="button"
              disabled={savingAccion || estadoCodigo === 'APROBADO' || (!isDirector && !todosRevisados)}
              onClick={handleAprobar}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#D32F2F] hover:bg-[#B71C1C] text-white disabled:opacity-40 transition-colors"
            >
              {savingAccion
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />
              }
              {isDirector ? 'Aprobar' : yaEnviado ? 'Reenviar al director' : 'Enviar al director'}
            </button>
          </div>
        </div>

        {/* Panel de rechazo director */}
        {showRechazo && isDirector && (
          <div className="px-4 pb-4 border-t border-red-100 bg-red-50/50 space-y-2 shrink-0">
            <TextTiny className="font-bold text-red-700 uppercase tracking-wide text-[9px] pt-3">
              Motivo del rechazo (opcional — irá al chat interno)
            </TextTiny>
            <textarea
              autoFocus
              value={notaRechazo}
              onChange={e => setNotaRechazo(e.target.value)}
              rows={2}
              placeholder="Describe qué debe corregir el coordinador…"
              className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300/30 focus:border-red-400 transition-all bg-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowRechazo(false); setNotaRechazo(''); }}
                className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingAccion}
                onClick={handleRechazar}
                className="px-3 py-1.5 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-40 transition-colors"
              >
                {savingAccion ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Columna derecha: tabs ── */}
      <div className="w-80 shrink-0 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'text-[#D32F2F] border-b-2 border-[#D32F2F]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab activo */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'informe' && (
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="text-[10px] text-gray-500 space-y-1">
                <p><strong>Cliente:</strong> {informeBase.cliente_nombre}</p>
                <p><strong>Sucursal:</strong> {informeBase.sucursal_nombre}</p>
                <p><strong>Tipo:</strong> {informeBase.tipo_visita}</p>
                <p><strong>Estado:</strong> {estadoCodigo}</p>
                <p><strong>Dispositivos:</strong> {totalDisp}</p>
                {localInforme?.tecnicos && <p><strong>Técnico(s):</strong> {localInforme.tecnicos}</p>}
              </div>
              {!isDirector && (
                <div className="text-[9px] text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-2.5 space-y-1">
                  <p className="font-bold uppercase tracking-wide">Flujo de revisión</p>
                  <p>1. Revisa cada dispositivo en la pestaña <strong>Revisión</strong></p>
                  <p>2. Aprueba o rechaza con nota de corrección</p>
                  <p>3. Los rechazados generarán una solicitud correctiva automáticamente</p>
                  <p>4. Envía al director cuando termines</p>
                </div>
              )}
            </div>
          )}
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

      {/* Modal resultado */}
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
