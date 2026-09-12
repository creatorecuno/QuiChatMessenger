import { motion } from 'framer-motion';
import { Check, CheckCheck, Mic } from 'lucide-react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  avatarInitials: string;
  onContextMenu: (e: React.MouseEvent, messageId: string) => void;
  isReplyTarget?: boolean;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function MessageBubble({
  message,
  isMine,
  showAvatar,
  avatarInitials,
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
      {/* Avatar space for alignment */}
      {!isMine && (
        <div className={`w-7 shrink-0 ${showAvatar ? '' : 'opacity-0'}`}>
          {showAvatar && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-300">
              {avatarInitials}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={spring}
          onContextMenu={(e) => onContextMenu(e, message.id)}
          onClick={(e) => {
            // Long-press simulation for mobile via right-click context
            if (e.detail === 1 && e.type === 'contextmenu') return;
          }}
          className={`px-4 py-2.5 text-sm leading-relaxed cursor-pointer select-none ${
            isMine
              ? 'gradient-accent text-white rounded-2xl rounded-br-md glow-accent'
              : 'glass text-zinc-200 rounded-2xl rounded-bl-md'
          }`}
        >
          {message.content}
        </motion.div>

        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-zinc-600">{message.timestamp}</span>
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

      {isMine && (
        <div className="w-7 shrink-0">
          <div className="w-7 h-7 rounded-full gradient-accent flex items-center justify-center text-[10px] font-semibold text-white">
            ME
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function TypingBubble({ avatarInitials }: { avatarInitials: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="flex items-end gap-2 mt-3"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-300 shrink-0">
        {avatarInitials}
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

export function VoiceMessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mt-3`}
    >
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl flex items-center gap-3 ${
        isMine ? 'gradient-accent text-white rounded-br-md' : 'glass text-zinc-200 rounded-bl-md'
      }`}>
        <Mic size={18} />
        <div className="flex items-center gap-0.5">
          {[8, 14, 20, 12, 16, 6, 18, 10, 14, 8, 12, 6, 16, 10].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${isMine ? 'bg-white/60' : 'bg-violet-400/60'}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <span className="text-xs opacity-70">0:24</span>
      </div>
    </motion.div>
  );
}
