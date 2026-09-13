import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, Search, X, Mic, Phone, Video, Info } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import Avatar from './Avatar';
import MessageBubble, { TypingBubble } from './MessageBubble';
import DateSeparator from './DateSeparator';
import EmojiPicker from './EmojiPicker';
import ContextMenu from './ContextMenu';
import { useChat } from '../hooks/useChat';
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

export default function ChatWindow({ currentUser, peer, isPeerOnline, onBack }: ChatWindowProps) {
  const { messages, peerTyping, sendMessage, deleteMessage, notifyTyping } = useChat(currentUser.id, peer.id);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, peerTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const content = replyTo ? `> ${replyTo.content}\n${input.trim()}` : input.trim();
    sendMessage(content);
    setInput('');
    setReplyTo(null);
  }, [input, replyTo, sendMessage]);

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
    if (msg) setReplyTo(msg);
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

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  let lastDate: string | null = null;
  let lastSenderId: string | null = null;

  const displayName = peer.username || peer.email;

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

        <Avatar name={displayName} avatarUrl={peer.avatar_url} status={isPeerOnline ? 'online' : 'offline'} showStatus size="md" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{displayName}</h2>
          <p className="text-xs text-zinc-500 truncate">
            {peerTyping ? (
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
          {messages.length === 0 && (
            <div className="flex items-center justify-center text-zinc-500 text-sm pt-24 text-center px-8">
              Напишите первое сообщение, чтобы начать переписку с {displayName}
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
                <div key={msg.id} onTouchStart={(e) => handleTouchStart(e, msg.id)} onTouchEnd={handleTouchEnd}>
                  {showDate && <DateSeparator label={dateLabel} />}
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    showAvatar={showAvatar}
                    avatarName={displayName}
                    avatarUrl={peer.avatar_url}
                    timeLabel={formatTime(msg.created_at)}
                    onContextMenu={handleContextMenu}
                    isReplyTarget={replyTo?.id === msg.id}
                  />
                </div>
              );
            })}
          </AnimatePresence>
          {peerTyping && <TypingBubble avatarName={displayName} avatarUrl={peer.avatar_url} />}
          <div ref={endRef} className="h-1" />
        </div>
      </div>

      <AnimatePresence>
        {replyTo && (
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
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            title="Медиа-вложения появятся на следующем этапе"
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors shrink-0"
          >
            <Paperclip size={18} />
          </motion.button>

          <div className="flex-1 flex items-center gap-2 glass-input rounded-xl px-4 py-2.5 relative">
            <input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Напишите сообщение..."
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
              <EmojiPicker onPick={(emoji) => setInput((prev) => prev + emoji)} onClose={() => setShowEmoji(false)} />
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
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={spring}
              onClick={() => setIsRecording((v) => !v)}
              title="Голосовые сообщения появятся на следующем этапе"
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isRecording ? 'gradient-accent text-white glow-accent-strong' : 'glass text-zinc-400 hover:text-violet-400'
              }`}
            >
              <motion.div
                animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
              >
                <Mic size={18} />
              </motion.div>
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="overflow-hidden max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between py-2.5 px-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-rose-500"
                  />
                  <span className="text-sm text-zinc-400">Голосовые сообщения — скоро</span>
                </div>
                <button
                  onClick={() => setIsRecording(false)}
                  className="px-3 py-1 rounded-lg glass text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          messageId={contextMenu.messageId}
          isMine={messages.find((m) => m.id === contextMenu.messageId)?.sender_id === currentUser.id}
          onClose={() => setContextMenu(null)}
          onReply={handleReply}
          onCopy={handleCopy}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
}
