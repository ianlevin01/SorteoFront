import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useChat } from '../../hooks/useChat.js';
import styles from './ChatWidget.module.css';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/** Botón flotante + panel del asistente. Se monta una sola vez en el Layout. */
export function ChatWidget() {
  const chat = useChat();
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState(null); // { dataUrl, name }
  const [attachError, setAttachError] = useState('');
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!chat.isOpen) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.isOpen, chat.timeline, chat.sending]);

  const closed = chat.status === 'closed';
  const canSend = !chat.sending && !chat.sendingLive && !closed && Boolean(input.trim() || pendingImage);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAttachError('');
    if (!file.type.startsWith('image/')) {
      setAttachError('Solo podés adjuntar imágenes.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setAttachError('La imagen pesa demasiado (máx. 6 MB).');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingImage({ dataUrl, name: file.name });
    } catch {
      setAttachError('No pudimos leer esa imagen.');
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text && !pendingImage) return;
    const img = pendingImage?.dataUrl;
    setInput('');
    setPendingImage(null);
    await chat.send(text, img);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {chat.isOpen && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Asistente virtual"
          >
            <header className={styles.header}>
              <div>
                <p className={styles.title}>Asistente</p>
                <p className={styles.subtitle}>
                  {chat.mode === 'live'
                    ? closed
                      ? 'Consulta cerrada'
                      : 'Chat en vivo con un asesor'
                    : 'Importadora Precios Bajos'}
                </p>
              </div>
              <button type="button" className={styles.iconBtn} onClick={chat.close} aria-label="Cerrar chat">
                <CloseIcon />
              </button>
            </header>

            <div className={styles.list} ref={listRef}>
              {chat.timeline.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              {chat.sending && (
                <div className={clsx(styles.bubble, styles.assistant, styles.typing)}>
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            {chat.error && (
              <div className={styles.errorBar}>
                <span>{chat.error}</span>
                <button type="button" onClick={chat.clearError} aria-label="Cerrar aviso">
                  ×
                </button>
              </div>
            )}

            {closed ? (
              <div className={styles.closedBar}>
                <p>Esta consulta ya se cerró.</p>
                <button type="button" className={styles.newChatBtn} onClick={chat.startNew}>
                  Iniciar una nueva consulta
                </button>
              </div>
            ) : (
              <form className={styles.composer} onSubmit={handleSend}>
                {pendingImage && (
                  <div className={styles.attachPreview}>
                    <img src={pendingImage.dataUrl} alt="" />
                    <button type="button" onClick={() => setPendingImage(null)} aria-label="Quitar imagen">
                      ×
                    </button>
                  </div>
                )}
                {attachError && <p className={styles.attachError}>{attachError}</p>}
                <div className={styles.composerRow}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Adjuntar imagen"
                  >
                    <ClipIcon />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
                  <textarea
                    className={styles.textarea}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí tu consulta…"
                    rows={1}
                  />
                  <button type="submit" className={styles.sendBtn} disabled={!canSend} aria-label="Enviar mensaje">
                    <SendIcon />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={clsx(styles.fab, chat.isOpen && styles.fabOpen)}
        onClick={chat.toggle}
        aria-label={chat.isOpen ? 'Cerrar chat' : 'Abrir chat de ayuda'}
      >
        {chat.isOpen ? <CloseIcon /> : <ChatIcon />}
        {!chat.isOpen && chat.unread > 0 && (
          <span className={styles.badge}>{chat.unread > 9 ? '9+' : chat.unread}</span>
        )}
      </button>
    </div>
  );
}

function ChatBubble({ message }) {
  if (message.role === 'system') {
    return (
      <p className={styles.systemNote} data-role="system">
        {message.text}
      </p>
    );
  }
  const isUser = message.role === 'user';
  const label = message.source === 'live' && message.from === 'admin' ? 'Asesor' : null;
  const image = message.imageDataUrl || message.imageUrl;
  return (
    <div className={clsx(styles.bubble, isUser ? styles.user : styles.assistant)} data-role={message.role}>
      {label && <span className={styles.bubbleLabel}>{label}</span>}
      {image && <img className={styles.bubbleImage} src={image} alt="Adjunto" />}
      {message.text && <p>{message.text}</p>}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ClipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.5 8.5 9.7 16.3a3 3 0 1 1-4.24-4.24l8.13-8.13a2 2 0 1 1 2.83 2.83L8.2 15a1 1 0 1 1-1.42-1.42l7.02-7.02"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-7 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
