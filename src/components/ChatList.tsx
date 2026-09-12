import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Check, Settings } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Contact } from '../types';
import Avatar from './Avatar';

interface ChatListProps {
  contacts: Contact[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onOpenSettings: () => void;
  profileName: string;
  profileStatus: string;
}

type FilterTab = 'all' | 'unread' | 'favorites';

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function ChatList({ contacts, activeChatId, onSelect, onOpenSettings, profileName, profileStatus }: ChatListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.bio.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === 'unread') return c.unread > 0;
      if (filter === 'favorites') return c.isFavorite;
      return true;
    });
  }, [contacts, search, filter]);

  const unreadTotal = contacts.reduce((sum, c) => sum + c.unread, 0);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'favorites', label: 'Starred' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
            {unreadTotal > 0 && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={spring}
                className="px-2 py-0.5 rounded-full gradient-accent text-white text-xs font-semibold glow-accent"
              >
                {unreadTotal}
              </motion.span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors"
          >
            <SlidersHorizontal size={17} />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={spring}
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <span className="text-xs">Clear</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-5 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="relative px-3.5 py-1.5 text-xs font-medium transition-colors"
          >
            <span className={filter === tab.key ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}>{tab.label}</span>
            {filter === tab.key && (
              <motion.div
                layoutId="filter-pill"
                transition={spring}
                className="absolute inset-0 rounded-lg bg-violet-500/15 border border-violet-500/30 -z-10"
              />
            )}
          </button>
        ))}
      </div>

      {/* Chat items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
              className="flex flex-col items-center justify-center py-16 text-zinc-600"
            >
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-sm">No conversations found</p>
            </motion.div>
          ) : (
            filtered.map((contact) => (
              <motion.button
                key={contact.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={spring}
                onClick={() => onSelect(contact.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 group transition-colors relative"
              >
                {activeChatId === contact.id && (
                  <motion.div
                    layoutId="active-chat"
                    transition={spring}
                    className="absolute inset-0 rounded-xl glass-strong border border-violet-500/20"
                  />
                )}
                <Avatar initials={contact.avatar} status={contact.status} showStatus size="md" />
                <div className="flex-1 min-w-0 text-left relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                      {contact.name}
                      {contact.isFavorite && <span className="text-violet-400 text-[10px]">&#9733;</span>}
                    </span>
                    <span className="text-[10px] text-zinc-500 shrink-0 ml-2">{contact.lastSeen}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {contact.isTyping ? (
                      <span className="text-xs text-violet-400 font-medium">typing...</span>
                    ) : (
                      <span className="text-xs text-zinc-500 truncate">{contact.bio}</span>
                    )}
                    {contact.unread > 0 && (
                      <span className="ml-2 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full gradient-accent text-white text-[10px] font-bold flex items-center justify-center glow-accent">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Current user footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Avatar initials="ME" status="online" showStatus size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{profileName}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <Check size={10} /> {profileStatus}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors"
          >
            <Settings size={17} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
