import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  avatarName: string;
  avatarUrl?: string | null;
  timeLabel: string;
  onContextMenu: (e: React.MouseEvent, messageId: string) => void;
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

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  avatarName,
  avatarUrl,
  timeLabel,
  onContextMenu,
  isReplyTarget,
}: MessageBubbleProps) {
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
          {message.content}
        </motion.div>

        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-zinc-600">{timeLabel}</span>
          {isMine && (
            <>
              {message.status === 'read' ? (
                <CheckCheck size={12} className="text-violet-400" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={12} className="text-zinc-600" />
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
