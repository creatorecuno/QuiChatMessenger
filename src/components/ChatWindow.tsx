import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, Search, X, Mic, Phone, Video, Info, Square, Bookmark, Pin, PinOff, Pencil } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import Avatar from './Avatar';
import MessageBubble, { TypingBubble } from './MessageBubble';
import DateSeparator from './DateSeparator';
import EmojiPicker from './EmojiPicker';
import ContextMenu from './ContextMenu';
import { useChat } from '../hooks/useChat';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import type { ChatMessage, Profile } from '../types';

interface ChatWindowProps {
  currentUser: Profile;
  peer: Profile;
  isPeerOnline: boolean;
  onBack: () => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface ContextMenuState {
  x: number;
  y: number;
  messageId: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function formatRecDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function pinnedPreview(msg: ChatMessage) {
  if (msg.content) return msg.content;
  if (msg.message_type === 'image') return '📷 Фото';
  if (msg.message_type === 'voice') return '🎤 Голосовое сообщение';
  if (msg.message_type === 'file') return `📎 ${msg.file_name || 'Файл'}`;
  return '';
}

export default function ChatWindow({ currentUser, peer, isPeerOnline, onBack }: ChatWindowProps) {
  const isSelf = peer.id === currentUser.id;
  const {
    messages,
    hasMore,
    loadingMore,
    loadMore,
    peerTyping,
    sendMessage,
    sendMediaMessage,
    editMessage,
    deleteMessage,
    togglePin,
    toggleReaction,
    reactionsByMessage,
    notifyTyping,
    sendError,
    uploading,
  } = useChat(currentUser.id, peer.id);
  const voice = useVoiceRecorder();

  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId, peerTyping]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (editingMessage) {
      editMessage(editingMessage.id, input);
      setEditingMessage(null);
      setInput('');
      return;
    }
    const content = replyTo ? `> ${replyTo.content}\n${input.trim()}` : input.trim();
    sendMessage(content);
    setInput('');
    setReplyTo(null);
  }, [input, replyTo, editingMessage, sendMessage, editMessage]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    notifyTyping();
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const handleCopy = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) navigator.clipboard.writeText(msg.content);
  };

  const handleReply = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      setEditingMessage(null);
      setReplyTo(msg);
    }
  };

  const handleEdit = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      setReplyTo(null);
      setEditingMessage(msg);
      setInput(msg.content);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setInput('');
  };

  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    const touch = e.touches[0];
    touchTimerRef.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY, messageId });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    await sendMediaMessage(file, type, file.name);
  };

  const handleMicClick = async () => {
    if (!voice.isRecording) {
      await voice.start();
      return;
    }
    const result = await voice.stop();
    if (result) {
      await sendMediaMessage(result.blob, 'voice', `voice-${Date.now()}.webm`, result.duration);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const pinnedMessage = messages.find((m) => m.pinned) || null;
  const contextMsg = contextMenu ? messages.find((m) => m.id === contextMenu.messageId) : undefined;

  let lastDate: string | null = null;
  let lastSenderId: string | null = null;

  const displayName = isSelf ? 'Избранное' : peer.username || peer.email;

  const headerActions = [
    { icon: Search, label: 'Search', onClick: () => setShowSearch((v) => !v), enabled: true },
    { icon: Phone, label: 'Call', onClick: () => {}, enabled: false },
    { icon: Video, label: 'Video', onClick: () => {}, enabled: false },
    { icon: Info, label: 'Info', onClick: () => {}, enabled: false },
  ];

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 glass-strong z-10"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={spring}
          onClick={onBack}
          className="md:hidden w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </motion.button>

        {isSelf ? (
          <div className="w-11 h-11 rounded-full gradient-accent flex items-center justify-center shrink-0 glow-accent">
            <Bookmark size={18} className="text-white" fill="currentColor" />
          </div>
        ) : (
          <Avatar name={displayName} avatarUrl={peer.avatar_url} status={isPeerOnline ? 'online' : 'offline'} showStatus size="md" />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{displayName}</h2>
          <p className="text-xs text-zinc-500 truncate">
            {isSelf ? (
              'Заметки, которые видны только вам'
            ) : peerTyping ? (
              <span className="text-violet-400">печатает...</span>
            ) : isPeerOnline ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-online" />
                В сети
              </span>
            ) : (
              'Не в сети'
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {headerActions.map(({ icon: Icon, label, onClick, enabled }) => (
            <motion.button
              key={label}
              whileHover={enabled ? { scale: 1.08 } : {}}
              whileTap={enabled ? { scale: 0.92 } : {}}
              transition={spring}
              onClick={enabled ? onClick : undefined}
              disabled={!enabled}
              title={enabled ? label : `${label} — скоро`}
              className={`w-9 h-9 rounded-xl glass flex items-center justify-center transition-colors ${
                !enabled
                  ? 'text-zinc-600 opacity-50 cursor-not-allowed'
                  : label === 'Search' && showSearch
                  ? 'text-violet-400 border border-violet-500/30'
                  : 'text-zinc-400 hover:text-violet-400'
              }`}
            >
              <Icon size={17} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {pinnedMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            onClick={() => scrollToMessage(pinnedMessage.id)}
            className="overflow-hidden px-4 py-2 border-b border-white/5 glass flex items-center gap-2 cursor-pointer"
          >
            <Pin size={14} className="text-violet-400 shrink-0" fill="currentColor" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-400 font-medium">Закреплено</p>
              <p className="text-xs text-zinc-400 truncate">{pinnedPreview(pinnedMessage)}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                togglePin(pinnedMessage.id);
              }}
              className="flex items-center gap-1 text-zinc-500 hover:text-white text-xs shrink-0 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <PinOff size={12} />
              Открепить
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden px-4 py-2.5 border-b border-white/5 glass"
          >
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по переписке..."
                autoFocus
                className="w-full glass-input rounded-xl py-2 pl-10 pr-8 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-zinc-500 mt-2 px-1">
                {filteredMessages.length} результат{filteredMessages.length === 1 ? '' : 'ов'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2">
        <div className="max-w-3xl mx-auto">
          {hasMore && !searchQuery && (
            <div className="flex justify-center py-2">
              <motion.button
                whileHover={{ scale: loadingMore ? 1 : 1.03 }}
                whileTap={{ scale: loadingMore ? 1 : 0.97 }}
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-1.5 rounded-full glass text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Загружаем...' : 'Показать более раннюю историю'}
              </motion.button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex items-center justify-center text-zinc-500 text-sm pt-24 text-center px-8">
              {isSelf ? 'Сохраняйте сюда заметки, ссылки и файлы' : `Напишите первое сообщение, чтобы начать переписку с ${displayName}`}
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((msg) => {
              const isMine = msg.sender_id === currentUser.id;
              const showAvatar = msg.sender_id !== lastSenderId;
              const dateLabel = formatDateLabel(msg.created_at);
              const showDate = dateLabel !== lastDate;
              lastDate = dateLabel;
              lastSenderId = msg.sender_id;
              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  onTouchStart={(e) => handleTouchStart(e, msg.id)}
                  onTouchEnd={handleTouchEnd}
                >
                  {showDate && <DateSeparator label={dateLabel} />}
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    showAvatar={showAvatar}
                    avatarName={displayName}
                    avatarUrl={peer.avatar_url}
                    timeLabel={formatTime(msg.created_at)}
                    reactions={reactionsByMessage[msg.id] || []}
                    onContextMenu={handleContextMenu}
                    onImageClick={setLightboxUrl}
                    onToggleReaction={(emoji) => toggleReaction(msg.id, emoji)}
                    isReplyTarget={replyTo?.id === msg.id}
                  />
                </div>
              );
            })}
          </AnimatePresence>
          {peerTyping && !isSelf && <TypingBubble avatarName={displayName} avatarUrl={peer.avatar_url} />}
          <div ref={endRef} className="h-1" />
        </div>
      </div>

      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden px-4 py-2 border-t border-white/5 glass"
          >
            <div className="flex items-start gap-2 max-w-3xl mx-auto">
              <Pencil size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 py-1">
                <p className="text-xs text-amber-400 font-medium">Редактирование сообщения</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{editingMessage.content}</p>
              </div>
              <button
                onClick={cancelEdit}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyTo && !editingMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden px-4 py-2 border-t border-white/5 glass"
          >
            <div className="flex items-start gap-2 max-w-3xl mx-auto">
              <div className="w-1 h-full rounded-full gradient-accent shrink-0 self-stretch" />
              <div className="flex-1 min-w-0 py-1">
                <p className="text-xs text-violet-400 font-medium">
                  Ответ {replyTo.sender_id === currentUser.id ? 'себе' : displayName}
                </p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="px-4 py-3 border-t border-white/5 glass-strong relative"
      >
        {sendError && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            Не удалось отправить: {sendError}
          </div>
        )}

        {uploading && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
            />
            Загружаем...
          </div>
        )}

        {voice.error && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {voice.error}
          </div>
        )}

        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />

        <AnimatePresence mode="wait">
          {voice.isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="max-w-3xl mx-auto flex items-center gap-3"
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-rose-500 shrink-0"
              />
              <span className="text-sm text-white font-medium">{formatRecDuration(voice.duration)}</span>
              <span className="text-xs text-zinc-500 flex-1">Идёт запись голосового...</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={voice.cancel}
                className="px-3 py-2 rounded-xl glass text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Отмена
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleMicClick}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 gradient-accent text-white glow-accent"
              >
                <Square size={16} fill="currentColor" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="composer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="max-w-3xl mx-auto flex items-center gap-2"
            >
              <motion.button
                whileHover={{ scale: uploading ? 1 : 1.08 }}
                whileTap={{ scale: uploading ? 1 : 0.92 }}
                transition={spring}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Прикрепить фото или файл"
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors shrink-0 disabled:opacity-50"
              >
                <Paperclip size={18} />
              </motion.button>

              <div className="flex-1 flex items-center gap-2 glass-input rounded-xl px-4 py-2.5 relative">
                <input
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={
                    editingMessage ? 'Изменить сообщение...' : isSelf ? 'Заметка себе...' : 'Напишите сообщение...'
                  }
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={spring}
                  onClick={() => setShowEmoji((v) => !v)}
                  className={`transition-colors ${showEmoji ? 'text-violet-400' : 'text-zinc-500 hover:text-violet-400'}`}
                >
                  <Smile size={18} />
                </motion.button>

                {showEmoji && (
                  <EmojiPicker
                    onPick={(emoji) => setInput((prev) => prev + emoji)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </div>

              {input.trim() ? (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={spring}
                  onClick={handleSend}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 gradient-accent text-white glow-accent"
                >
                  <Send size={18} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: uploading ? 1 : 1.08 }}
                  whileTap={{ scale: uploading ? 1 : 0.92 }}
                  transition={spring}
                  onClick={handleMicClick}
                  disabled={uploading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 glass text-zinc-400 hover:text-violet-400 transition-colors disabled:opacity-50"
                >
                  <Mic size={18} />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {contextMenu && contextMsg && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          messageId={contextMenu.messageId}
          isMine={contextMsg.sender_id === currentUser.id}
          isPinned={contextMsg.pinned}
          canEdit={contextMsg.sender_id === currentUser.id && contextMsg.message_type === 'text'}
          onClose={() => setContextMenu(null)}
          onReply={handleReply}
          onCopy={handleCopy}
          onDelete={deleteMessage}
          onPin={togglePin}
          onReact={toggleReaction}
          onEdit={handleEdit}
        />
      )}

      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={spring}
              src={lightboxUrl}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full rounded-2xl object-contain"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl glass-strong flex items-center justify-center text-white"
            >
              <X size={20} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
