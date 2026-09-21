import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Bookmark, UserPlus, Bell, BellOff, LogOut, Palette, Check, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';
import { canSeePresence, type Relation } from '../hooks/useSocial';
import type { ContactRequest, ConversationPreview, Profile } from '../types';

interface ChatListProps {
  currentUser: Profile;
  conversations: ConversationPreview[];
  conversationsLoading: boolean;
  onlineIds: Set<string>;
  mutedIds: Set<string>;
  contactIds: Set<string>;
  incoming: ContactRequest[];
  outgoing: ContactRequest[];
  relationWith: (peerId: string) => Relation;
  profilesById: Map<string, Profile>;
  activeUserId?: string;
  peopleOpen: boolean;
  onTogglePeople: () => void;
  onSelectUser: (user: Profile) => void;
  onOpenSaved: () => void;
  isSavedActive: boolean;
  onOpenProfile: () => void;
  onSignOut: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onOpenSettings: () => void;
  onSendRequest: (peerId: string) => Promise<boolean | void>;
  onAcceptRequest: (requestId: string) => Promise<boolean | void>;
  onDeclineRequest: (requestId: string) => Promise<boolean | void>;
  onCancelRequest: (requestId: string) => Promise<boolean | void>;
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
  mutedIds,
  contactIds,
  incoming,
  outgoing,
  relationWith,
  profilesById,
  activeUserId,
  peopleOpen,
  onTogglePeople,
  onSelectUser,
  onOpenSaved,
  isSavedActive,
  onOpenProfile,
  onSignOut,
  notificationsEnabled,
  onToggleNotifications,
  onOpenSettings,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .ilike('username', `%${query}%`)
        .limit(30);

      if (error) {
        console.error('Search error:', error.message);
        setSearchResults([]);
      } else {
        setSearchResults((data || []) as Profile[]);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser.id]);

  const isSearchMode = searchQuery.trim().length > 0;
  const isPeopleMode = peopleOpen || isSearchMode;

  return (
    <div className="w-full md:w-80 h-full glass border-r border-white/5 flex flex-col shrink-0">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {peopleOpen && !isSearchMode ? 'Люди' : 'Сообщения'}
          </h1>

          <div className="flex md:hidden items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={onTogglePeople}
              title="Заявки и поиск"
              className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                peopleOpen ? 'text-violet-400 bg-violet-500/15' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={16} />
              {incoming.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full gradient-accent text-[9px] font-semibold flex items-center justify-center">
                  {incoming.length > 9 ? '9+' : incoming.length}
                </span>
              )}
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
              title="Настройки"
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
            placeholder="Найти по имени..."
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
        {!isPeopleMode && (
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

        {isSearchMode ? (
          <>
            {searching && <div className="p-4 text-center text-zinc-500 text-sm">Ищем...</div>}
            {!searching && searchResults.length === 0 && (
              <div className="p-4 text-center text-zinc-500 text-sm">Никого не нашли. Поиск только по имени, не по email.</div>
            )}
            {!searching &&
              searchResults.map((user) => (
                <PeopleRow
                  key={user.id}
                  user={user}
                  isOnline={canSeePresence(currentUser.id, user, contactIds.has(user.id)) && onlineIds.has(user.id)}
                  isActive={activeUserId === user.id}
                  relation={relationWith(user.id)}
                  onOpenChat={() => onSelectUser(user)}
                  onSendRequest={() => onSendRequest(user.id)}
                  onAccept={() => {
                    const rel = relationWith(user.id);
                    if (rel.kind === 'incoming') onAcceptRequest(rel.request.id);
                  }}
                  onDecline={() => {
                    const rel = relationWith(user.id);
                    if (rel.kind === 'incoming') onDeclineRequest(rel.request.id);
                  }}
                  onCancel={() => {
                    const rel = relationWith(user.id);
                    if (rel.kind === 'outgoing') onCancelRequest(rel.request.id);
                  }}
                />
              ))}
          </>
        ) : peopleOpen ? (
          <>
            {incoming.length === 0 && outgoing.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-sm leading-relaxed">
                Нет заявок. Найдите человека по имени в поиске и отправьте запрос — чат откроется после согласия.
              </div>
            )}
            {incoming.length > 0 && (
              <p className="px-2 pt-1 pb-2 text-[11px] uppercase tracking-wide text-zinc-500">Входящие</p>
            )}
            {incoming.map((req) => {
              const user = profilesById.get(req.requester_id);
              if (!user) return null;
              return (
                <PeopleRow
                  key={req.id}
                  user={user}
                  isOnline={canSeePresence(currentUser.id, user, false) && onlineIds.has(user.id)}
                  isActive={false}
                  relation={{ kind: 'incoming', request: req }}
                  onOpenChat={() => {}}
                  onSendRequest={() => Promise.resolve()}
                  onAccept={() => onAcceptRequest(req.id)}
                  onDecline={() => onDeclineRequest(req.id)}
                  onCancel={() => Promise.resolve()}
                />
              );
            })}
            {outgoing.length > 0 && (
              <p className="px-2 pt-3 pb-2 text-[11px] uppercase tracking-wide text-zinc-500">Исходящие</p>
            )}
            {outgoing.map((req) => {
              const user = profilesById.get(req.addressee_id);
              if (!user) return null;
              return (
                <PeopleRow
                  key={req.id}
                  user={user}
                  isOnline={false}
                  isActive={false}
                  relation={{ kind: 'outgoing', request: req }}
                  onOpenChat={() => {}}
                  onSendRequest={() => Promise.resolve()}
                  onAccept={() => Promise.resolve()}
                  onDecline={() => Promise.resolve()}
                  onCancel={() => onCancelRequest(req.id)}
                />
              );
            })}
          </>
        ) : conversationsLoading ? (
          <div className="p-4 text-center text-zinc-500 text-sm">Загружаем чаты...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm leading-relaxed">
            Пока пусто. Найдите человека по имени и отправьте заявку в контакты.
          </div>
        ) : (
          conversations.map(({ peer, lastMessage, unreadCount }) => {
            const showOnline =
              canSeePresence(currentUser.id, peer, contactIds.has(peer.id)) && onlineIds.has(peer.id);
            return (
              <ContactRow
                key={peer.id}
                user={peer}
                isOnline={showOnline}
                isActive={activeUserId === peer.id}
                subtitle={lastMessage ? lastMessage.content || mediaLabel(lastMessage.message_type) : 'Нет сообщений'}
                timestamp={lastMessage ? formatPreviewTime(lastMessage.created_at) : undefined}
                unreadCount={unreadCount}
                muted={mutedIds.has(peer.id)}
                onClick={() => onSelectUser(peer)}
              />
            );
          })
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
  muted?: boolean;
  onClick: () => void;
}

function ContactRow({
  user,
  isOnline,
  isActive,
  subtitle,
  timestamp,
  unreadCount,
  muted,
  onClick,
}: ContactRowProps) {
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
        showStatus={isOnline}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-white truncate">{user.username || user.email}</span>
          <span className="flex items-center gap-1 shrink-0">
            {muted && <BellOff size={11} className="text-zinc-600" />}
            {timestamp && <span className="text-[10px] text-zinc-500">{timestamp}</span>}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
          {!!unreadCount && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-semibold flex items-center justify-center ${
                muted ? 'bg-zinc-600' : 'gradient-accent'
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

interface PeopleRowProps {
  user: Profile;
  isOnline: boolean;
  isActive: boolean;
  relation: Relation;
  onOpenChat: () => void;
  onSendRequest: () => Promise<boolean | void>;
  onAccept: () => Promise<boolean | void>;
  onDecline: () => Promise<boolean | void>;
  onCancel: () => Promise<boolean | void>;
}

function PeopleRow({
  user,
  isOnline,
  isActive,
  relation,
  onOpenChat,
  onSendRequest,
  onAccept,
  onDecline,
  onCancel,
}: PeopleRowProps) {
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<boolean | void>) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <div
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl ${
        isActive ? 'bg-violet-500/15 border border-violet-500/30' : 'border border-transparent'
      }`}
    >
      <Avatar
        name={user.username || user.email}
        avatarUrl={user.avatar_url}
        status={isOnline ? 'online' : 'offline'}
        showStatus={isOnline}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white truncate">{user.username || user.email}</p>
        <p className="text-xs text-zinc-500 truncate mt-0.5">
          {relation.kind === 'contact' && 'В контактах'}
          {relation.kind === 'incoming' && 'Хочет добавить вас'}
          {relation.kind === 'outgoing' && 'Заявка отправлена'}
          {relation.kind === 'blocked' && 'В чёрном списке'}
          {relation.kind === 'none' && 'Можно отправить заявку'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {relation.kind === 'contact' && (
          <button
            onClick={onOpenChat}
            className="px-2.5 py-1 rounded-lg gradient-accent text-[11px] font-medium text-white"
          >
            Чат
          </button>
        )}
        {relation.kind === 'none' && (
          <button
            disabled={busy}
            onClick={() => run(onSendRequest)}
            className="px-2.5 py-1 rounded-lg glass text-[11px] font-medium text-violet-300 disabled:opacity-50"
          >
            Добавить
          </button>
        )}
        {relation.kind === 'outgoing' && (
          <button
            disabled={busy}
            onClick={() => run(onCancel)}
            className="px-2.5 py-1 rounded-lg glass text-[11px] font-medium text-zinc-400 disabled:opacity-50"
          >
            Отменить
          </button>
        )}
        {relation.kind === 'incoming' && (
          <>
            <button
              disabled={busy}
              onClick={() => run(onDecline)}
              className="w-8 h-8 rounded-lg glass flex items-center justify-center text-zinc-400 disabled:opacity-50"
              title="Отклонить"
            >
              <Ban size={14} />
            </button>
            <button
              disabled={busy}
              onClick={() => run(onAccept)}
              className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-white disabled:opacity-50"
              title="Принять"
            >
              <Check size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
