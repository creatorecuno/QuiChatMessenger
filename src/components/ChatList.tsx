import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import type { ConversationPreview, Profile } from '../types';

interface ChatListProps {
  currentUserId: string;
  conversations: ConversationPreview[];
  conversationsLoading: boolean;
  onlineIds: Set<string>;
  activeUserId?: string;
  browseAll: boolean;
  onSelectUser: (user: Profile) => void;
}

function formatPreviewTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function ChatList({
  currentUserId,
  conversations,
  conversationsLoading,
  onlineIds,
  activeUserId,
  browseAll,
  onSelectUser,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query && !browseAll) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(
      async () => {
        let request = supabase.from('profiles').select('*').neq('id', currentUserId).limit(50);
        request = query
          ? request.or(`username.ilike.%${query}%,email.ilike.%${query}%`)
          : request.order('username', { ascending: true });

        const { data, error } = await request;
        if (error) {
          console.error('Search error:', error.message);
          setSearchResults([]);
        } else {
          setSearchResults((data || []) as Profile[]);
        }
        setSearching(false);
      },
      query ? 300 : 0
    );

    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId, browseAll]);

  const isBrowseMode = searchQuery.trim().length > 0 || browseAll;
  const knownPeerIds = new Set(conversations.map((c) => c.peer.id));

  return (
    <div className="w-full md:w-80 h-full glass border-r border-white/5 flex flex-col shrink-0">
      <div className="p-4 border-b border-white/5">
        <h1 className="text-xl font-bold text-white mb-4 tracking-tight">
          {browseAll && !searchQuery ? 'Все пользователи' : 'Сообщения'}
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Найти человека..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {isBrowseMode ? (
          <>
            {searching && <div className="p-4 text-center text-zinc-500 text-sm">Ищем...</div>}
            {!searching && searchResults.length === 0 && (
              <div className="p-4 text-center text-zinc-500 text-sm">Никого не нашли</div>
            )}
            {!searching &&
              searchResults.map((user) => (
                <ContactRow
                  key={user.id}
                  user={user}
                  isOnline={onlineIds.has(user.id)}
                  isActive={activeUserId === user.id}
                  subtitle={knownPeerIds.has(user.id) ? 'Уже переписываетесь' : 'Написать первым'}
                  onClick={() => onSelectUser(user)}
                />
              ))}
          </>
        ) : conversationsLoading ? (
          <div className="p-4 text-center text-zinc-500 text-sm">Загружаем чаты...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm leading-relaxed">
            Пока пусто. Найдите собеседника через поиск выше, чтобы начать первый чат.
          </div>
        ) : (
          conversations.map(({ peer, lastMessage }) => (
            <ContactRow
              key={peer.id}
              user={peer}
              isOnline={onlineIds.has(peer.id)}
              isActive={activeUserId === peer.id}
              subtitle={lastMessage ? lastMessage.content : 'Нет сообщений'}
              timestamp={lastMessage ? formatPreviewTime(lastMessage.created_at) : undefined}
              onClick={() => onSelectUser(peer)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ContactRowProps {
  user: Profile;
  isOnline: boolean;
  isActive: boolean;
  subtitle: string;
  timestamp?: string;
  onClick: () => void;
}

function ContactRow({ user, isOnline, isActive, subtitle, timestamp, onClick }: ContactRowProps) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
        isActive ? 'bg-violet-500/15 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      <Avatar
        name={user.username || user.email}
        avatarUrl={user.avatar_url}
        status={isOnline ? 'online' : 'offline'}
        showStatus
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-white truncate">{user.username || user.email}</span>
          {timestamp && <span className="text-[10px] text-zinc-500 shrink-0">{timestamp}</span>}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{subtitle}</p>
      </div>
    </motion.button>
  );
}
