import { motion } from 'framer-motion';
import { MessageSquare, Users, Bell, Archive, LogOut } from 'lucide-react';

interface NavRailProps {
  active: string;
  onNavigate: (key: string) => void;
  onSignOut?: () => void;
}

const navItems = [
  { key: 'chats', icon: MessageSquare, label: 'Chats', badge: 11 },
  { key: 'contacts', icon: Users, label: 'Contacts' },
  { key: 'alerts', icon: Bell, label: 'Alerts' },
  { key: 'archive', icon: Archive, label: 'Archive' },
];

export default function NavRail({ active, onNavigate, onSignOut }: NavRailProps) {
  return (
    <div className="hidden md:flex flex-col items-center gap-2 py-5 px-2 w-16 border-r border-white/5 glass">
      {/* Logo */}
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
        const isActive = active === item.key;
        return (
          <motion.button
            key={item.key}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onNavigate(item.key)}
            className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors group"
          >
            {isActive && (
              <motion.div
                layoutId="nav-active"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-violet-500/15 border border-violet-500/30"
              />
            )}
            <Icon
              size={20}
              className={`relative z-10 transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}
            />
            {item.badge && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full gradient-accent text-white text-[9px] font-bold flex items-center justify-center glow-accent z-20">
                {item.badge}
              </span>
            )}
          </motion.button>
        );
      })}

      <div className="flex-1" />

      {/* Sign out button */}
      {onSignOut && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={onSignOut}
          className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors group text-zinc-500 hover:text-rose-400"
        >
          <LogOut size={20} />
        </motion.button>
      )}

      {/* Bottom avatar */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-white font-semibold text-sm cursor-pointer glow-accent"
      >
        ME
      </motion.div>
    </div>
  );
}
