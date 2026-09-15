import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Copy, Trash2, Pin, PinOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  messageId: string;
  isMine: boolean;
  isPinned: boolean;
  onClose: () => void;
  onReply: (messageId: string) => void;
  onCopy: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 26 };

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ContextMenu({
  x,
  y,
  messageId,
  isMine,
  isPinned,
  onClose,
  onReply,
  onCopy,
  onDelete,
  onPin,
  onReact,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const clampedX = Math.min(x, window.innerWidth - 220);
  const clampedY = Math.min(y, window.innerHeight - 300);

  const actions = [
    { icon: Reply, label: 'Ответить', color: 'text-violet-400', action: () => onReply(messageId) },
    { icon: Copy, label: 'Копировать', color: 'text-zinc-300', action: () => onCopy(messageId) },
    isPinned
      ? { icon: PinOff, label: 'Открепить', color: 'text-zinc-300', action: () => onPin(messageId) }
      : { icon: Pin, label: 'Закрепить', color: 'text-zinc-300', action: () => onPin(messageId) },
    ...(isMine
      ? [{ icon: Trash2, label: 'Удалить', color: 'text-rose-400', action: () => onDelete(messageId) }]
      : []),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.85, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -8 }}
          transition={spring}
          style={{ left: clampedX, top: clampedY }}
          className="fixed z-50 glass-strong rounded-xl p-1.5 shadow-2xl min-w-[200px] origin-top-left"
        >
          <div className="flex items-center justify-between gap-1 px-1.5 py-1.5 mb-1 border-b border-white/5">
            {QUICK_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                transition={spring}
                onClick={() => {
                  onReact(messageId, emoji);
                  onClose();
                }}
                className="text-lg leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5"
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
              >
                <Icon size={15} className={item.color} />
                <span className="text-zinc-200">{item.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
