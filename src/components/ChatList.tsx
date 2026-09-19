import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Bookmark, Users, Bell, BellOff, LogOut, Palette } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import type { ConversationPreview, Profile } from '../types';

interface ChatListProps {
  currentUser: Profile;
  conversations: ConversationPreview[];
  conversationsLoading: boolean;
  onlineIds: Set<string>;
  activeUserId?: string;
  browseAll: boolean;
  onToggleBrowseAll: () => void;
  onSelectUser: (user: Profile) => void;
  onOpenSaved: () => void;
  isSavedActive: boolean;
  onOpenProfile: () => void;
  onSignOut: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onOpenSettings: () => void;
}

function formatPreviewTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function mediaLabel(type: string) {
  if (type === 'image') return '📷 Фото';
  if (type === 'voice') return '🎤 Голосовое сообщение';
  if (type === 'file') return '📎 Файл';
  return '';
}

export default function ChatList({
  currentUser,
  conversations,
  conversationsLoading,
  onlineIds,
  activeUserId,
  browseAll,
  onToggleBrowseAll,
  onSelectUser,
  onOpenSaved,
  isSavedActive,
  onOpenProfile,
  onSignOut,
  notificationsEnabled,
  onToggleNotifications,
  onOpenSettings,
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
        let request = supabase.from('profiles').select('*').neq('id', currentUser.id).limit(50);
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
  }, [searchQuery, currentUser.id, browseAll]);

  const isBrowseMode = searchQuery.trim().length > 0 || browseAll;
  const knownPeerIds = new Set(conversations.map((c) => c.peer.id));

  return (
    <div className="w-full md:w-80 h-full glass border-r border-white/5 flex flex-col shrink-0">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {browseAll && !searchQuery ? 'Все пользователи' : 'Сообщения'}
          </h1>

          <div className="flex md:hidden items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onToggleBrowseAll}
              title="Все пользователи"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                browseAll ? 'text-violet-400 bg-violet-500/15' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Users size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onToggleNotifications}
              title={notificationsEnabled ? 'Уведомления включены' : 'Включить уведомления'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                notificationsEnabled ? 'text-violet-400 bg-violet-500/15' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onOpenSettings}
              title="Оформление"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Palette size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onSignOut}
              title="Выйти"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors"
            >
              <LogOut size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onOpenProfile}
              title="Профиль"
              className="ml-1"
            >
              <Avatar name={currentUser.username || currentUser.email} avatarUrl={currentUser.avatar_url} size="sm" />
            </motion.button>
          </div>
        </div>

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
        {!isBrowseMode && (
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={onOpenSaved}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left mb-1 ${
              isSavedActive ? 'bg-violet-500/15 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="w-11 h-11 rounded-full gradient-accent flex items-center justify-center shrink-0 glow-accent">
              <Bookmark size={18} className="text-white" fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-white">Избранное</span>
              <p className="text-xs text-zinc-500 truncate mt-0.5">Заметки, файлы, ссылки</p>
            </div>
          </motion.button>
        )}

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
          conversations.map(({ peer, lastMessage, unreadCount }) => (
            <ContactRow
              key={peer.id}
              user={peer}
              isOnline={onlineIds.has(peer.id)}
              isActive={activeUserId === peer.id}
              subtitle={lastMessage ? lastMessage.content || mediaLabel(lastMessage.message_type) : 'Нет сообщений'}
              timestamp={lastMessage ? formatPreviewTime(lastMessage.created_at) : undefined}
              unreadCount={unreadCount}
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
  unreadCount?: number;
  onClick: () => void;
}

function ContactRow({ user, isOnline, isActive, subtitle, timestamp, unreadCount, onClick }: ContactRowProps) {
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
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
          {!!unreadCount && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full gradient-accent text-white text-[10px] font-semibold flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
