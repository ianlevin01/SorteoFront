import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Todo lo de acá vive SOLO en localStorage mientras el chat es con la IA: el
// server nunca lo guarda (manda el historial completo en cada mensaje). Recién
// cuando se escala a un asesor humano arranca a persistirse algo en la base
// (ver backend/src/services/inquiryService.js).
const STORAGE_KEY = 'sorteo.chat.v1';
const MAX_STORED_MESSAGES = 40;
const LIVE_POLL_MS = 5000;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    // La imagen en sí nunca se persiste (puede pesar varios MB y llenar el
    // localStorage): solo queda la marca de que hubo una adjunta.
    const trimmed = {
      mode: state.mode,
      inquiryId: state.inquiryId,
      pending: state.pending,
      lastSeenAt: state.lastSeenAt,
      messages: state.messages.slice(-MAX_STORED_MESSAGES).map(({ imageDataUrl: _drop, ...m }) => m),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* localStorage lleno o no disponible: seguimos solo en memoria */
  }
}

function initialState() {
  const stored = loadState();
  if (stored && (stored.mode === 'ai' || stored.mode === 'live')) {
    return {
      messages: Array.isArray(stored.messages) ? stored.messages : [],
      mode: stored.mode,
      inquiryId: stored.inquiryId || null,
      pending: stored.pending || null,
      lastSeenAt: stored.lastSeenAt || null,
    };
  }
  return { messages: [], mode: 'ai', inquiryId: null, pending: null, lastSeenAt: null };
}

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hola! Soy el asistente de Importadora Precios Bajos. Preguntame lo que necesites: cómo funciona, cómo comprar un número, ver los que compraste, tu comprobante... lo que sea 🙂',
};

export function useChat() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState(initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const escalatingRef = useRef(false);

  useEffect(() => saveState(state), [state]);

  // ---- Polling del hilo en vivo, una vez escalado a un asesor ----
  const live = useQuery({
    queryKey: ['chat', 'inquiry', state.inquiryId],
    queryFn: () => api(`/chat/inquiries/${state.inquiryId}`),
    enabled: state.mode === 'live' && Boolean(state.inquiryId) && isAuthenticated,
    refetchInterval: (query) => (query.state.data?.inquiry?.status === 'open' ? LIVE_POLL_MS : false),
  });
  const liveMessages = useMemo(() => live.data?.messages || [], [live.data]);
  const liveStatus = live.data?.inquiry?.status || null;

  // ---- Escalar: crea la consulta y recién ahí arranca a guardarse algo ----
  const escalateMutation = useMutation({
    mutationFn: (body) => api('/chat/escalate', { method: 'POST', body }),
  });

  const runEscalation = useCallback(
    async ({ summary, firstMessage, imageDataUrl }) => {
      if (escalatingRef.current) return;
      escalatingRef.current = true;
      try {
        const result = await escalateMutation.mutateAsync({ summary, firstMessage, imageDataUrl });
        setState((s) => ({ ...s, mode: 'live', inquiryId: result.inquiryId, pending: null }));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No pudimos conectarte con un asesor. Probá de nuevo.');
      } finally {
        escalatingRef.current = false;
      }
    },
    [escalateMutation],
  );

  // Si la IA quiso derivar a un asesor pero la persona todavía no había
  // iniciado sesión, queda pendiente; apenas inicia sesión, se dispara sola.
  useEffect(() => {
    if (isAuthenticated && state.mode === 'ai' && state.pending) {
      runEscalation(state.pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, state.mode, state.pending]);

  // ---- Un turno de chat con la IA (nada de esto se guarda en el server) ----
  const aiMutation = useMutation({
    mutationFn: (body) => api('/chat/message', { method: 'POST', body }),
  });

  const sendAi = useCallback(
    async (text, imageDataUrl) => {
      setError(null);
      const userMsg = {
        id: uid(),
        role: 'user',
        text: text || '',
        hadImage: Boolean(imageDataUrl),
        imageDataUrl,
      };
      const history = state.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.text || (m.hadImage ? '(adjuntó una imagen)' : '') }));

      setState((s) => ({ ...s, messages: [...s.messages, userMsg] }));

      try {
        const res = await aiMutation.mutateAsync({ history, message: text || undefined, imageDataUrl });
        const assistantMsg = { id: uid(), role: 'assistant', text: res.reply };
        setState((s) => ({ ...s, messages: [...s.messages, assistantMsg] }));

        if (res.shouldEscalate) {
          const payload = {
            summary: res.summaryForAdvisor || 'El cliente pidió hablar con un asesor.',
            firstMessage: text || null,
            imageDataUrl,
          };
          if (isAuthenticated) {
            await runEscalation(payload);
          } else {
            setState((s) => ({
              ...s,
              pending: { summary: payload.summary, firstMessage: payload.firstMessage },
              messages: [
                ...s.messages,
                {
                  id: uid(),
                  role: 'system',
                  text: 'Para conectarte con un asesor necesitamos que ingreses con tu DNI. Iniciá sesión o registrate y seguimos automáticamente.',
                },
              ],
            }));
          }
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No pudimos responder. Probá de nuevo en un momento.');
      }
    },
    [state.messages, aiMutation, isAuthenticated, runEscalation],
  );

  // ---- Mensaje nuevo en modo "en vivo" (ya escalado) ----
  const liveMutation = useMutation({
    mutationFn: ({ inquiryId, ...body }) => api(`/chat/inquiries/${inquiryId}/messages`, { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', 'inquiry', state.inquiryId] }),
  });

  const sendLive = useCallback(
    async (text, imageDataUrl) => {
      setError(null);
      try {
        await liveMutation.mutateAsync({ inquiryId: state.inquiryId, text: text || undefined, imageDataUrl });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No pudimos enviar tu mensaje. Probá de nuevo.');
      }
    },
    [liveMutation, state.inquiryId],
  );

  const send = useCallback(
    (text, imageDataUrl) => (state.mode === 'live' ? sendLive(text, imageDataUrl) : sendAi(text, imageDataUrl)),
    [state.mode, sendLive, sendAi],
  );

  const startNew = useCallback(() => {
    setState({ messages: [], mode: 'ai', inquiryId: null, pending: null, lastSeenAt: null });
    setError(null);
  }, []);

  const markSeen = useCallback(() => {
    setState((s) => ({ ...s, lastSeenAt: new Date().toISOString() }));
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    markSeen();
  }, [markSeen]);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen((v) => {
      if (!v) markSeen();
      return !v;
    });
  }, [markSeen]);

  // ---- Timeline combinado: lo local (IA) + lo del server (una vez en vivo) ----
  const timeline = useMemo(() => {
    const aiMsgs = state.messages.map((m) => ({ ...m, source: 'ai' }));
    if (state.mode !== 'live') return aiMsgs.length ? aiMsgs : [WELCOME];
    const liveMsgs = liveMessages.map((m) => ({
      id: m.messageId,
      role: m.from === 'admin' ? 'assistant' : 'user',
      from: m.from,
      text: m.text,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
      source: 'live',
    }));
    return [...aiMsgs, ...liveMsgs];
  }, [state.messages, state.mode, liveMessages]);

  const unread = useMemo(() => {
    if (isOpen || state.mode !== 'live') return 0;
    if (!state.lastSeenAt) return liveMessages.filter((m) => m.from === 'admin').length;
    return liveMessages.filter((m) => m.from === 'admin' && m.createdAt > state.lastSeenAt).length;
  }, [isOpen, state.mode, state.lastSeenAt, liveMessages]);

  return {
    isOpen,
    open,
    close,
    toggle,
    timeline,
    mode: state.mode,
    status: liveStatus,
    sending: aiMutation.isPending || escalateMutation.isPending,
    sendingLive: liveMutation.isPending,
    send,
    startNew,
    unread,
    error,
    clearError: () => setError(null),
  };
}
