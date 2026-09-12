import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Video, Info, Send, Paperclip, Smile, Search, X, Mic, Reply, Trash2 } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';
import type { Contact, Message } from '../types';
import Avatar from './Avatar';
import MessageBubble, { TypingBubble } from './MessageBubble';
import DateSeparator from './DateSeparator';
import EmojiPicker from './EmojiPicker';
import ContextMenu from './ContextMenu';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onBack: () => void;
  onSend: (content: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

interface ContextMenuState {
  x: number;
  y: number;
  messageId: string;
}

export default function ChatWindow({ contact, messages, onBack, onSend, onDeleteMessage }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
    setReplyTo(null);
  }, [input, onSend]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const handleDelete = (messageId: string) => {
    onDeleteMessage(messageId);
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

  // Filter messages by search
  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Group messages by date
  let lastDate: string | null = null;
  let lastSenderId: string | null = null;

  const headerActions = [
    { icon: Search, label: 'Search', onClick: () => setShowSearch(!showSearch) },
    { icon: Phone, label: 'Call', onClick: () => {} },
    { icon: Video, label: 'Video', onClick: () => {} },
    { icon: Info, label: 'Info', onClick: () => {} },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
          className="lg:hidden w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </motion.button>

        <Avatar initials={contact.avatar} status={contact.status} showStatus size="md" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{contact.name}</h2>
          <p className="text-xs text-zinc-500 truncate">
            {contact.isTyping ? (
              <span className="text-violet-400">typing...</span>
            ) : contact.status === 'online' ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-online" />
                Active now
              </span>
            ) : (
              `Last seen ${contact.lastSeen}`
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {headerActions.map(({ icon: Icon, label, onClick }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={spring}
              onClick={onClick}
              className={`w-9 h-9 rounded-xl glass flex items-center justify-center transition-colors ${
                (label === 'Search' && showSearch)
                  ? 'text-violet-400 border border-violet-500/30'
                  : 'text-zinc-400 hover:text-violet-400'
              }`}
            >
              <Icon size={17} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Search in chat */}
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
                placeholder="Search in this conversation..."
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
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((msg) => {
              const isMine = msg.senderId === 'me';
              const showAvatar = msg.senderId !== lastSenderId;
              const showDate = msg.date !== lastDate;
              lastDate = msg.date;
              lastSenderId = msg.senderId;
              return (
                <div
                  key={msg.id}
                  onTouchStart={(e) => handleTouchStart(e, msg.id)}
                  onTouchEnd={handleTouchEnd}
                >
                  {showDate && <DateSeparator label={msg.date} />}
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    showAvatar={showAvatar}
                    avatarInitials={contact.avatar}
                    onContextMenu={handleContextMenu}
                    isReplyTarget={replyTo?.id === msg.id}
                  />
                </div>
              );
            })}
          </AnimatePresence>
          {contact.isTyping && <TypingBubble avatarInitials={contact.avatar} />}
          <div ref={endRef} className="h-1" />
        </div>
      </div>

      {/* Reply preview */}
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
                <p className="text-xs text-violet-400 font-medium flex items-center gap-1">
                  <Reply size={11} /> Replying to {replyTo.senderId === 'me' ? 'yourself' : contact.name}
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

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="px-4 py-3 border-t border-white/5 glass-strong relative"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {/* Attachment */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors shrink-0"
          >
            <Paperclip size={18} />
          </motion.button>

          {/* Input with emoji */}
          <div className="flex-1 flex items-center gap-2 glass-input rounded-xl px-4 py-2.5 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={spring}
              onClick={() => setShowEmoji(!showEmoji)}
              className={`transition-colors ${showEmoji ? 'text-violet-400' : 'text-zinc-500 hover:text-violet-400'}`}
            >
              <Smile size={18} />
            </motion.button>

            {/* Emoji picker */}
            {showEmoji && (
              <EmojiPicker
                onPick={(emoji) => {
                  setInput((prev) => prev + emoji);
                  setShowEmoji(false);
                }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>

          {/* Send / Voice button */}
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
              onClick={() => setIsRecording(!isRecording)}
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

        {/* Recording bar */}
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
                  <span className="text-sm text-zinc-400">Recording voice message...</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecording(false)}
                    className="px-3 py-1 rounded-lg glass text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                    onClick={() => setIsRecording(false)}
                    className="px-3 py-1 rounded-lg gradient-accent text-xs text-white font-medium glow-accent flex items-center gap-1"
                  >
                    <Send size={12} /> Send
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          messageId={contextMenu.messageId}
          isMine={messages.find((m) => m.id === contextMenu.messageId)?.senderId === 'me'}
          onClose={() => setContextMenu(null)}
          onReply={handleReply}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
