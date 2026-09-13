import { motion } from 'framer-motion';
import { MessageSquare, Users, Archive, LogOut } from 'lucide-react';
import Avatar from './Avatar';
import type { Profile } from '../types';

interface NavRailProps {
  currentUser: Profile;
  onSignOut: () => void;
}

const navItems = [
  { key: 'chats', icon: MessageSquare, label: 'Чаты', enabled: true },
  { key: 'contacts', icon: Users, label: 'Контакты — скоро', enabled: false },
  { key: 'archive', icon: Archive, label: 'Архив — скоро', enabled: false },
];

export default function NavRail({ currentUser, onSignOut }: NavRailProps) {
  return (
    <div className="hidden md:flex flex-col items-center gap-2 py-5 px-2 w-16 border-r border-white/5 glass shrink-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center glow-accent-strong mb-4"
      >
        <span className="text-white font-bold text-lg">Q</span>
      </motion.div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.key}
            whileHover={item.enabled ? { scale: 1.08 } : {}}
            whileTap={item.enabled ? { scale: 0.92 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            disabled={!item.enabled}
            title={item.label}
            className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors group ${
              item.enabled ? '' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            {item.enabled && (
              <motion.div
                layoutId="nav-active"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-violet-500/15 border border-violet-500/30"
              />
            )}
            <Icon
              size={20}
              className={`relative z-10 transition-colors ${item.enabled ? 'text-violet-400' : 'text-zinc-500'}`}
            />
          </motion.button>
        );
      })}

      <div className="flex-1" />

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onSignOut}
        title="Выйти"
        className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors text-zinc-500 hover:text-rose-400"
      >
        <LogOut size={20} />
      </motion.button>

      <Avatar name={currentUser.username || currentUser.email} avatarUrl={currentUser.avatar_url} size="md" />
    </div>
  );
}
