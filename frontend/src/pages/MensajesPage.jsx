import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, Building2, MapPin, Send, Loader2,
  ChevronLeft, Search, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversaciones, getChatInforme, sendChatInforme } from '../api/informeApi';
import { supabase } from '../utils/supabase';
import { H2, TextSmall, TextTiny } from '../components/ui/Typography';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtRelativo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (min < 1)  return 'ahora';
  if (min < 60) return `${min}m`;
  if (h < 24)   return `${h}h`;
  if (d < 7)    return `${d}d`;
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

const fmtHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const ESTADO_BADGE = {
  EN_REVISION: { label: 'En revisión', color: 'bg-amber-100 text-amber-700', icon: Clock },
  APROBADO:    { label: 'Aprobado',    color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  RECHAZADO:   { label: 'Rechazado',   color: 'bg-red-100 text-red-700',     icon: XCircle },
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
    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap wrap-break-word ${
      isMe ? 'bg-[#D32F2F] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
    }`}>
      {msg.mensaje}
    </div>
  </div>
);

// ─── Panel de chat activo ─────────────────────────────────────────────────────

/**
 * @param {{ conv: import('../api/informeApi').Conversacion, userId: string, onBack: () => void }} props
 */
const ChatActivo = ({ conv, userId, onBack }) => {
  const [mensajes, setMensajes] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const badge  = ESTADO_BADGE[conv.informe_estado] || ESTADO_BADGE.EN_REVISION;
  const BadgeIcon = badge.icon;

  const loadMensajes = useCallback(async () => {
    try {
      setMensajes(await getChatInforme(conv.informe_id));
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, [conv.informe_id]);

  useEffect(() => { loadMensajes(); }, [loadMensajes]);

  // Realtime para esta conversación
  useEffect(() => {
    const ch = supabase.channel(`mensajes_page_${conv.informe_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_informe',
        filter: `informe_id=eq.${conv.informe_id}`,
      }, () => loadMensajes())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conv.informe_id, loadMensajes]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleSend = async () => {
    const texto = input.trim();
    if (!texto || sending) return;
    setSending(true);
    try {
      await sendChatInforme(conv.informe_id, userId, texto);
      setInput('');
    } catch { /* silencioso */ } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <TextSmall className="font-bold text-gray-900 truncate">{conv.cliente_nombre}</TextSmall>
            <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>
              <BadgeIcon size={9} />
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Building2 size={9} className="text-gray-400" />
              <TextTiny className="text-gray-500">{conv.sucursal_nombre}</TextTiny>
            </div>
            {conv.sucursal_ciudad && (
              <div className="flex items-center gap-1">
                <MapPin size={9} className="text-gray-400" />
                <TextTiny className="text-gray-500">{conv.sucursal_ciudad}</TextTiny>
              </div>
            )}
            <TextTiny className="text-gray-400">·</TextTiny>
            <TextTiny className="text-gray-400">{conv.tipo_visita}</TextTiny>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        )}
        {!loading && mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare size={28} className="text-gray-200" />
            <TextTiny className="text-gray-400 italic">Sin mensajes en esta conversación.</TextTiny>
          </div>
        )}
        {!loading && mensajes.map(msg => (
          <ChatBubble key={msg.id} msg={msg} isMe={msg.autor_id === userId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje… (Enter para enviar)"
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all min-h-9 max-h-24"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-xl transition-colors disabled:opacity-40 shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Item de lista de conversaciones ─────────────────────────────────────────

const ConversacionItem = ({ conv, isActive, onClick }) => {
  const badge = ESTADO_BADGE[conv.informe_estado] || ESTADO_BADGE.EN_REVISION;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
        isActive ? 'bg-red-50 border-l-2 border-l-[#D32F2F]' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-xs font-bold text-gray-900 truncate">{conv.cliente_nombre}</p>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 truncate">{conv.sucursal_nombre}{conv.sucursal_ciudad ? ` · ${conv.sucursal_ciudad}` : ''}</p>
          {conv.ultimo_mensaje && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {conv.ultimo_autor_nombre ? `${conv.ultimo_autor_nombre}: ` : ''}{conv.ultimo_mensaje}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <TextTiny className="text-gray-400 text-[9px]">{fmtRelativo(conv.ultimo_mensaje_at)}</TextTiny>
          <span className="text-[8px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {conv.total_mensajes} msg
          </span>
        </div>
      </div>
    </button>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────

const MensajesPage = () => {
  const { user } = useAuth();
  const userId   = user?.id;

  const [conversaciones,   setConversaciones]   = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [busqueda,         setBusqueda]         = useState('');
  const [activeConvId,     setActiveConvId]     = useState(null);
  const [mobileShowChat,   setMobileShowChat]   = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setConversaciones(await getConversaciones());
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Realtime global: escucha nuevos mensajes en cualquier informe y refresca la bandeja
  useEffect(() => {
    const ch = supabase.channel('mensajes_bandeja_global')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_informe',
      }, () => cargar())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cargar]);

  const convsFiltradas = conversaciones.filter(c => {
    const q = busqueda.toLowerCase();
    return !q
      || c.cliente_nombre.toLowerCase().includes(q)
      || c.sucursal_nombre.toLowerCase().includes(q)
      || c.tipo_visita.toLowerCase().includes(q)
      || c.sucursal_ciudad?.toLowerCase().includes(q);
  });

  const convActiva = conversaciones.find(c => c.informe_id === activeConvId) || null;

  const handleSelectConv = (conv) => {
    setActiveConvId(conv.informe_id);
    setMobileShowChat(true);
  };

  return (
    <div className="flex h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {/* ── Columna izquierda: lista ── */}
      <div className={`flex flex-col border-r border-gray-100 shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80`}>
        {/* Header lista */}
        <div className="px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-[#D32F2F]" />
            <H2 className="text-sm font-bold text-gray-900">Mensajes</H2>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversación…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          )}
          {!loading && convsFiltradas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <MessageSquare size={28} className="text-gray-200" />
              <TextTiny className="text-gray-400 italic">
                {busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay conversaciones aún.'}
              </TextTiny>
            </div>
          )}
          {!loading && convsFiltradas.map(conv => (
            <ConversacionItem
              key={conv.informe_id}
              conv={conv}
              isActive={activeConvId === conv.informe_id}
              onClick={() => handleSelectConv(conv)}
            />
          ))}
        </div>
      </div>

      {/* ── Columna derecha: chat activo ── */}
      <div className={`flex-1 min-w-0 ${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-col`}>
        {convActiva ? (
          <ChatActivo
            key={convActiva.informe_id}
            conv={convActiva}
            userId={userId}
            onBack={() => setMobileShowChat(false)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="p-4 rounded-full bg-gray-50">
              <MessageSquare size={28} className="text-gray-300" />
            </div>
            <TextSmall className="font-semibold text-gray-500">Selecciona una conversación</TextSmall>
            <TextTiny className="text-gray-400">
              Los mensajes del chat de cada informe aparecen aquí, organizados por conversación.
            </TextTiny>
          </div>
        )}
      </div>
    </div>
  );
};

export default MensajesPage;
