import { motion } from 'framer-motion';
import { Check, CheckCheck, Play, Pause, FileText, Download } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  avatarName: string;
  avatarUrl?: string | null;
  timeLabel: string;
  onContextMenu: (e: React.MouseEvent, messageId: string) => void;
  onImageClick: (url: string) => void;
  isReplyTarget?: boolean;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

function initialsOf(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function VoicePlayer({ url, duration, isMine }: { url: string; duration: number | null; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px] ${
        isMine ? 'gradient-accent text-white rounded-br-md glow-accent' : 'glass text-zinc-200 rounded-bl-md'
      }`}
    >
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (audio.duration) setProgress(audio.currentTime / audio.duration);
        }}
      />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isMine ? 'bg-white/20' : 'bg-violet-500/20'
        }`}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </motion.button>
      <div className="flex-1 min-w-0">
        <div className={`h-1.5 rounded-full overflow-hidden ${isMine ? 'bg-white/25' : 'bg-white/10'}`}>
          <motion.div
            className={`h-full rounded-full ${isMine ? 'bg-white' : 'bg-violet-400'}`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className="text-[10px] opacity-70 mt-1 block">{formatDuration(duration)}</span>
      </div>
    </div>
  );
}

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  avatarName,
  avatarUrl,
  timeLabel,
  onContextMenu,
  onImageClick,
  isReplyTarget,
}: MessageBubbleProps) {
  const renderContent = () => {
    if (message.message_type === 'image' && message.file_url) {
      return (
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          transition={spring}
          onClick={() => onImageClick(message.file_url as string)}
          onContextMenu={(e) => onContextMenu(e, message.id)}
          className="block rounded-2xl overflow-hidden cursor-pointer max-w-[280px]"
        >
          <img
            src={message.file_url}
            alt={message.file_name || 'Изображение'}
            className="w-full h-auto max-h-[320px] object-cover"
          />
        </motion.button>
      );
    }

    if (message.message_type === 'voice' && message.file_url) {
      return <VoicePlayer url={message.file_url} duration={message.duration_seconds} isMine={isMine} />;
    }

    if (message.message_type === 'file' && message.file_url) {
      return (
        <motion.a
          href={message.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={message.file_name || undefined}
          whileHover={{ scale: 1.02 }}
          transition={spring}
          onContextMenu={(e) => onContextMenu(e, message.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[220px] cursor-pointer ${
            isMine ? 'gradient-accent text-white rounded-br-md glow-accent' : 'glass text-zinc-200 rounded-bl-md'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isMine ? 'bg-white/20' : 'bg-violet-500/20'
            }`}
          >
            <FileText size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.file_name || 'Файл'}</p>
            <p className="text-[10px] opacity-70">{formatBytes(message.file_size)}</p>
          </div>
          <Download size={14} className="opacity-70 shrink-0" />
        </motion.a>
      );
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={spring}
        onContextMenu={(e) => onContextMenu(e, message.id)}
        className={`px-4 py-2.5 text-sm leading-relaxed cursor-pointer select-none whitespace-pre-wrap break-words ${
          isMine
            ? 'gradient-accent text-white rounded-2xl rounded-br-md glow-accent'
            : 'glass text-zinc-200 rounded-2xl rounded-bl-md'
        }`}
      >
        {linkify(message.content)}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-3' : 'mt-0.5'} ${
        isReplyTarget ? 'ring-1 ring-violet-500/40 rounded-2xl' : ''
      }`}
    >
      {!isMine && (
        <div className={`w-7 shrink-0 ${showAvatar ? '' : 'opacity-0'}`}>
          {showAvatar && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-300 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={avatarName} className="w-full h-full object-cover" />
              ) : (
                initialsOf(avatarName)
              )}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {renderContent()}

        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-zinc-600">{timeLabel}</span>
          {isMine && (
            <>
              {message.status === 'read' ? (
                <CheckCheck size={12} className="text-violet-400" />
              ) : (
                <Check size={12} className="text-zinc-600" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TypingBubble({ avatarName, avatarUrl }: { avatarName: string; avatarUrl?: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="flex items-end gap-2 mt-3"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0 overflow-hidden">
        {avatarUrl ? <img src={avatarUrl} alt={avatarName} className="w-full h-full object-cover" /> : initialsOf(avatarName)}
      </div>
      <div className="glass px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
        </div>
      </div>
    </motion.div>
  );
}
