import { motion, AnimatePresence } from 'framer-motion';
import { X, Ban, BellOff, Bell, ShieldAlert } from 'lucide-react';
import Avatar from './Avatar';
import type { Profile } from '../types';

interface PeerInfoModalProps {
  open: boolean;
  onClose: () => void;
  peer: Profile;
  isOnline: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onBlock: () => void;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 };

export default function PeerInfoModal({
  open,
  onClose,
  peer,
  isOnline,
  muted,
  onToggleMute,
  onBlock,
}: PeerInfoModalProps) {
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
              className="w-[380px] max-w-full glass-strong rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-white">Профиль</h2>
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

              <div className="px-6 py-6 flex flex-col items-center text-center">
                <Avatar
                  name={peer.username || peer.email}
                  avatarUrl={peer.avatar_url}
                  status={isOnline ? 'online' : 'offline'}
                  showStatus={isOnline}
                  size="lg"
                />
                <p className="mt-4 text-base font-semibold text-white">{peer.username || peer.email}</p>
                <p className="text-xs text-zinc-500 mt-1">{isOnline ? 'В сети' : 'Был(а) недавно'}</p>
              </div>

              <div className="px-4 pb-5 space-y-2">
                <button
                  onClick={onToggleMute}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  {muted ? <Bell size={18} className="text-violet-400" /> : <BellOff size={18} className="text-zinc-400" />}
                  <div>
                    <p className="text-sm text-white">{muted ? 'Включить уведомления' : 'Выключить уведомления'}</p>
                    <p className="text-xs text-zinc-500">Только для этого чата</p>
                  </div>
                </button>
                <button
                  onClick={onBlock}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 transition-colors text-left"
                >
                  <Ban size={18} className="text-rose-400" />
                  <div>
                    <p className="text-sm text-rose-300">Заблокировать</p>
                    <p className="text-xs text-zinc-500">Человек больше не сможет вам писать</p>
                  </div>
                </button>
                <div className="flex items-start gap-2 px-4 pt-2 text-[11px] text-zinc-600">
                  <ShieldAlert size={12} className="mt-0.5 shrink-0" />
                  <span>Блок действует сразу. Разблокировать можно из поиска, если снова найдёте этот профиль.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
