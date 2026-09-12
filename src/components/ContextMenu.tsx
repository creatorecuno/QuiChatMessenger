import { motion, AnimatePresence } from 'framer-motion';
import { Reply, Copy, Trash2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  messageId: string;
  isMine: boolean;
  onClose: () => void;
  onReply: (messageId: string) => void;
  onCopy: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 26 };

export default function ContextMenu({ x, y, messageId, isMine, onClose, onReply, onCopy, onDelete }: ContextMenuProps) {
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

  // Clamp position to viewport
  const clampedX = Math.min(x, window.innerWidth - 180);
  const clampedY = Math.min(y, window.innerHeight - 220);

  const actions = [
    { icon: Reply, label: 'Reply', color: 'text-violet-400', action: () => onReply(messageId) },
    { icon: Copy, label: 'Copy', color: 'text-zinc-300', action: () => onCopy(messageId) },
    ...(isMine
      ? [{ icon: Trash2, label: 'Delete', color: 'text-rose-400', action: () => onDelete(messageId) }]
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
          className="fixed z-50 glass-strong rounded-xl p-1.5 shadow-2xl min-w-[160px] origin-top-left"
        >
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
