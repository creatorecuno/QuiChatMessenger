import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Settings, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import type { Contact } from '../types';
import { supabase, Profile } from '../lib/supabase';
import Avatar from './Avatar';

interface ChatListProps {
  contacts: Contact[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onOpenSettings: () => void;
  profileName: string;
  profileStatus: string;
  currentUserId: string;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function ChatList({
  contacts,
  activeChatId,
  onSelect,
  onOpenSettings,
  profileName,
  profileStatus,
  currentUserId,
}: ChatListProps) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced Supabase search for users by username
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${search.trim()}%`)
        .neq('id', currentUserId)
        .limit(20);

      if (error) {
        console.error('Search error:', error.message);
        setSearchResults([]);
      } else {
        setSearchResults((data as Profile[]) || []);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentUserId]);

  const isSearching = search.trim().length > 0;

  const existingIds = useMemo(() => new Set(contacts.map((c) => c.id)), [contacts]);

  const profileToContact = (p: Profile): Contact => {
    const lastSeenMap: Record<string, string> = {
      online: 'Active now',
      away: 'Away',
      offline: 'Offline',
    };
    return {
      id: p.id,
      name: p.username,
      avatar: p.avatar_initials,
      status: p.online_status as 'online' | 'offline' | 'away',
      lastSeen: lastSeenMap[p.online_status] || 'Offline',
      unread: 0,
      isTyping: p.is_typing,
      isFavorite: false,
      bio: p.status_message,
    };
  };

  const handleSelectSearchResult = (profile: Profile) => {
    setSearch('');
    onSelect(profile.id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by username..."
            className="w-full glass-input rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {searching ? (
              <Loader2 size={14} className="animate-spin text-zinc-500" />
            ) : search ? (
              <button
                onClick={() => setSearch('')}
                className="text-zinc-500 hover:text-white transition-colors text-xs"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* List area: search results or existing contacts */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        <AnimatePresence mode="popLayout">
          {isSearching ? (
            // Search results
            searchResults.length === 0 && !searching ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring}
                className="flex flex-col items-center justify-center py-16 text-zinc-600"
              >
                <Search size={32} className="mb-3 opacity-40" />
                <p className="text-sm">No users found</p>
              </motion.div>
            ) : (
              searchResults.map((profile) => {
                const contact = profileToContact(profile);
                const exists = existingIds.has(profile.id);
                return (
                  <motion.button
                    key={profile.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={spring}
                    onClick={() => handleSelectSearchResult(profile)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 group transition-colors relative"
                  >
                    {activeChatId === profile.id && (
                      <motion.div
                        layoutId="active-chat"
                        transition={spring}
                        className="absolute inset-0 rounded-xl glass-strong border border-violet-500/20"
                      />
                    )}
                    <Avatar initials={contact.avatar} status={contact.status} showStatus size="md" />
                    <div className="flex-1 min-w-0 text-left relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white truncate">
                          {contact.name}
                        </span>
                        {!exists && (
                          <span className="text-[10px] text-violet-400 font-medium shrink-0 ml-2">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 truncate block mt-0.5">
                        {contact.bio}
                      </span>
                    </div>
                  </motion.button>
                );
              })
            )
          ) : contacts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
              className="flex flex-col items-center justify-center py-16 text-zinc-600"
            >
              <Search size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Search to start a conversation</p>
            </motion.div>
          ) : (
            contacts.map((contact) => (
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
