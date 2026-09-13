import { motion } from 'framer-motion';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  status?: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const sizeMap = {
  sm: { box: 'w-8 h-8', text: 'text-xs', dot: 'w-2 h-2', pos: '-bottom-0.5 -right-0.5' },
  md: { box: 'w-11 h-11', text: 'text-sm', dot: 'w-3 h-3', pos: '-bottom-0.5 -right-0.5' },
  lg: { box: 'w-16 h-16', text: 'text-xl', dot: 'w-4 h-4', pos: '-bottom-1 -right-1' },
};

const statusColors: Record<string, string> = {
  online: 'bg-green-500 status-online',
  away: 'bg-amber-400',
  offline: 'bg-zinc-600',
};

const avatarColors = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-teal-500 to-green-600',
];

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ name, avatarUrl, status, size = 'md', showStatus = false }: AvatarProps) {
  const s = sizeMap[size];
  const initials = getInitials(name);
  const colorIdx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % avatarColors.length;
  const gradient = avatarColors[colorIdx];

  return (
    <div className="relative shrink-0">
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`${s.box} rounded-full overflow-hidden flex items-center justify-center ${s.text} font-semibold text-white shadow-lg ${
          avatarUrl ? '' : `bg-gradient-to-br ${gradient}`
        }`}
      >
        {avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" /> : initials}
      </motion.div>
      {showStatus && status && (
        <span className={`absolute ${s.pos} ${s.dot} ${statusColors[status]} rounded-full ring-2 ring-zinc-900`} />
      )}
    </div>
  );
}
