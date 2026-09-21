import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Check, Forward } from 'lucide-react';
import { useState } from 'react';
import Avatar from './Avatar';
import type { ConversationPreview, Profile } from '../types';

interface ForwardModalProps {
  open: boolean;
  onClose: () => void;
  conversations: ConversationPreview[];
  currentUser: Profile;
  onSelectTarget: (peerId: string) => Promise<boolean>;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

export default function ForwardModal({
  open,
  onClose,
  conversations,
  currentUser,
  onSelectTarget,
}: ForwardModalProps) {
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const handlePick = async (peerId: string) => {
    setSendingTo(peerId);
    const ok = await onSelectTarget(peerId);
    setSendingTo(null);
    if (ok) {
      setSentTo((prev) => new Set(prev).add(peerId));
      setTimeout(onClose, 500);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={spring}
              className="w-[380px] max-w-full max-h-[80dvh] glass-strong rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Forward size={18} className="text-violet-400" />
                  <h2 className="text-lg font-bold text-white">Переслать</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={spring}
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={() => handlePick(currentUser.id)}
                  disabled={sendingTo !== null}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-full gradient-accent flex items-center justify-center shrink-0 glow-accent">
                    <Bookmark size={18} className="text-white" fill="currentColor" />
                  </div>
                  <span className="flex-1 font-medium text-sm text-white">Избранное</span>
                  {sentTo.has(currentUser.id) && <Check size={16} className="text-emerald-400" />}
                  {sendingTo === currentUser.id && (
                    <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </motion.button>

                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">Пока не с кем переписываться</div>
                ) : (
                  conversations.map(({ peer }) => (
                    <motion.button
                      key={peer.id}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                      onClick={() => handlePick(peer.id)}
                      disabled={sendingTo !== null}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <Avatar name={peer.username || peer.email} avatarUrl={peer.avatar_url} size="md" />
                      <span className="flex-1 font-medium text-sm text-white truncate">
                        {peer.username || peer.email}
                      </span>
                      {sentTo.has(peer.id) && <Check size={16} className="text-emerald-400" />}
                      {sendingTo === peer.id && (
                        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
