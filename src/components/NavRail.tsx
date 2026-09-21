import { motion } from 'framer-motion';
import { MessageSquare, UserPlus, LogOut, Bell, BellOff, Palette } from 'lucide-react';
import Avatar from './Avatar';
import type { Profile } from '../types';

interface NavRailProps {
  currentUser: Profile;
  peopleOpen: boolean;
  incomingCount: number;
  onTogglePeople: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onOpenSettings: () => void;
}

export default function NavRail({
  currentUser,
  peopleOpen,
  incomingCount,
  onTogglePeople,
  onOpenProfile,
  onSignOut,
  notificationsEnabled,
  onToggleNotifications,
  onOpenSettings,
}: NavRailProps) {
  return (
    <div className="hidden md:flex flex-col items-center gap-2 py-5 px-2 w-16 border-r border-white/5 glass shrink-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center glow-accent-strong mb-4"
      >
        <MessageSquare size={20} className="text-white" />
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        title="Чаты"
        className="relative w-11 h-11 rounded-xl flex items-center justify-center"
      >
        <motion.div
          layoutId="nav-active"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-0 rounded-xl bg-violet-500/15 border border-violet-500/30"
        />
        <MessageSquare size={20} className="relative z-10 text-violet-400" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onTogglePeople}
        title="Заявки и поиск"
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
          peopleOpen
            ? 'text-violet-400 bg-violet-500/15 border border-violet-500/30'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <UserPlus size={20} />
        {incomingCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full gradient-accent text-[9px] font-semibold flex items-center justify-center text-white">
            {incomingCount > 9 ? '9+' : incomingCount}
          </span>
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onToggleNotifications}
        title={notificationsEnabled ? 'Уведомления включены' : 'Включить уведомления в браузере'}
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
          notificationsEnabled
            ? 'text-violet-400 bg-violet-500/15 border border-violet-500/30'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onOpenSettings}
        title="Настройки"
        className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Palette size={20} />
      </motion.button>

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

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onOpenProfile}
        title="Профиль"
      >
        <Avatar name={currentUser.username || currentUser.email} avatarUrl={currentUser.avatar_url} size="md" />
      </motion.button>
    </div>
  );
}
